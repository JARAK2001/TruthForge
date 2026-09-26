import React, { useState, useMemo, useRef, useEffect } from "react";
import { parseFormula, type AstNode } from "@truthforge/logic-engine";
import LogicKeyboard from "../components/LogicKeyboard";

type GateType = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR";

interface InputDef {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface GateDef {
  id: string;
  type: GateType;
  x: number;
  y: number;
  in1Source: string;
  in2Source?: string;
  label?: string;
}

interface OutputDef {
  id: string;
  x: number;
  y: number;
  sourceGateId: string;
}

interface CircuitPreset {
  id: string;
  name: string;
  formula: string;
  description: string;
  inputs: InputDef[];
  gates: GateDef[];
  outputGateId: string;
}

const PRESETS: CircuitPreset[] = [
  {
    id: "reference_circuit",
    name: "Laboratorio Compuesto (Referencia)",
    formula: "OUT = (A ∧ B) ∨ (A ⊕ B)",
    description: "Combina una compuerta AND con una compuerta XOR alimentando a una compuerta OR. Demuestra cómo las señales booleanas se ramifican y convergen.",
    inputs: [
      { id: "in_A", label: "A", x: 120, y: 160 },
      { id: "in_B", label: "B", x: 120, y: 380 }
    ],
    gates: [
      { id: "g_and", type: "AND", x: 380, y: 130, in1Source: "in_A", in2Source: "in_B" },
      { id: "g_xor", type: "XOR", x: 380, y: 400, in1Source: "in_A", in2Source: "in_B" },
      { id: "g_not", type: "NOT", x: 620, y: 130, in1Source: "g_and" },
      { id: "g_nand", type: "NAND", x: 620, y: 300, in1Source: "in_A", in2Source: "in_B" },
      { id: "g_or", type: "OR", x: 880, y: 280, in1Source: "g_nand", in2Source: "g_xor" }
    ],
    outputGateId: "g_or"
  },
  {
    id: "demorgan_nand",
    name: "Leyes de De Morgan (NAND)",
    formula: "OUT = ¬(A ∧ B) ↔ (¬A ∨ ¬B)",
    description: "Una compuerta NAND equivale exactamente a negar cada entrada por separado y pasarlas por una compuerta OR.",
    inputs: [
      { id: "in_A", label: "A", x: 140, y: 200 },
      { id: "in_B", label: "B", x: 140, y: 360 }
    ],
    gates: [
      { id: "g_nand", type: "NAND", x: 480, y: 270, in1Source: "in_A", in2Source: "in_B" }
    ],
    outputGateId: "g_nand"
  },
  {
    id: "implication_circuit",
    name: "Equivalencia del Condicional (A → B)",
    formula: "OUT = A → B ≡ (¬A ∨ B)",
    description: "En circuitos lógicos la implicación A → B se construye negando el antecedente (¬A) y combinándolo con B mediante una compuerta OR.",
    inputs: [
      { id: "in_A", label: "A", x: 140, y: 180 },
      { id: "in_B", label: "B", x: 140, y: 360 }
    ],
    gates: [
      { id: "g_not", type: "NOT", x: 400, y: 170, in1Source: "in_A" },
      { id: "g_or", type: "OR", x: 700, y: 260, in1Source: "g_not", in2Source: "in_B" }
    ],
    outputGateId: "g_or"
  },
  {
    id: "half_adder",
    name: "Semi-Sumador Digital (Half Adder)",
    formula: "SUM = A ⊕ B  |  CARRY = A ∧ B",
    description: "El bloque fundamental de una CPU digital: la suma aritmética binaria se realiza con un XOR (suma) y un AND (acarreo).",
    inputs: [
      { id: "in_A", label: "A", x: 140, y: 180 },
      { id: "in_B", label: "B", x: 140, y: 360 }
    ],
    gates: [
      { id: "g_xor", type: "XOR", x: 500, y: 180, in1Source: "in_A", in2Source: "in_B" },
      { id: "g_and", type: "AND", x: 500, y: 360, in1Source: "in_A", in2Source: "in_B" }
    ],
    outputGateId: "g_xor"
  }
];

function evalGate(type: GateType, in1: boolean, in2?: boolean): boolean {
  switch (type) {
    case "AND": return in1 && (in2 ?? false);
    case "OR": return in1 || (in2 ?? false);
    case "NOT": return !in1;
    case "NAND": return !(in1 && (in2 ?? false));
    case "NOR": return !(in1 || (in2 ?? false));
    case "XOR": return in1 !== (in2 ?? false);
    default: return false;
  }
}

const GATE_STYLES: Record<GateType, { bg: string; border: string; text: string; glow: string }> = {
  AND: { bg: "bg-emerald-950/85", border: "border-emerald-400", text: "text-emerald-300", glow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]" },
  OR: { bg: "bg-cyan-950/85", border: "border-cyan-400", text: "text-cyan-300", glow: "shadow-[0_0_20px_rgba(6,182,212,0.35)]" },
  NOT: { bg: "bg-purple-950/85", border: "border-purple-400", text: "text-purple-300", glow: "shadow-[0_0_20px_rgba(168,85,247,0.35)]" },
  NAND: { bg: "bg-amber-950/85", border: "border-amber-400", text: "text-amber-300", glow: "shadow-[0_0_20px_rgba(245,158,11,0.35)]" },
  NOR: { bg: "bg-pink-950/85", border: "border-pink-400", text: "text-pink-300", glow: "shadow-[0_0_20px_rgba(236,72,153,0.35)]" },
  XOR: { bg: "bg-blue-950/85", border: "border-blue-400", text: "text-blue-300", glow: "shadow-[0_0_20px_rgba(59,130,246,0.35)]" },
};

export default function CircuitSimulatorPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("reference_circuit");

  // Dynamic circuit state
  const [inputs, setInputs] = useState<InputDef[]>(PRESETS[0]!.inputs);
  const [gates, setGates] = useState<GateDef[]>(PRESETS[0]!.gates);
  const [outputNode, setOutputNode] = useState<OutputDef>({
    id: "out_main",
    x: 1080,
    y: 260,
    sourceGateId: PRESETS[0]!.outputGateId
  });

  const [circuitName, setCircuitName] = useState<string>(PRESETS[0]!.name);
  const [circuitDesc, setCircuitDesc] = useState<string>(PRESETS[0]!.description);

  // Input states (HIGH/LOW)
  const [inputStates, setInputStates] = useState<Record<string, boolean>>({
    in_A: true,
    in_B: false
  });

  const [simulationOn, setSimulationOn] = useState(true);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

  // Figma Studio Controls: Zoom & Pan (device-aware defaults)
  const [zoom, setZoom] = useState(() => (typeof window !== "undefined" && window.innerWidth < 768 ? 0.6 : 1));
  const [pan, setPan] = useState(() => (typeof window !== "undefined" && window.innerWidth < 768 ? { x: 10, y: 30 } : { x: 0, y: 0 }));
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Floating Side Panel Drawer (Tabs: "inspector" | "table" | "presets")
  // On desktop (>=1024px) open by default; on mobile/tablet closed initially to keep canvas clear
  const [sidePanelOpen, setSidePanelOpen] = useState(() => (typeof window !== "undefined" && window.innerWidth >= 1024));
  const [sidePanelTab, setSidePanelTab] = useState<"inspector" | "table" | "presets">("table");

  // Formula Synthesizer Modal
  const [formulaMode, setFormulaMode] = useState(false);
  const [formulaInput, setFormulaInput] = useState("(A ∧ B) ∨ ¬A");
  const [formulaError, setFormulaError] = useState("");

  // Canvas Dragging State
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingItem, setDraggingItem] = useState<{
    id: string;
    type: "gate" | "input" | "output";
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Switch preset
  const handleSelectPreset = (pId: string) => {
    setSelectedPresetId(pId);
    const target = PRESETS.find((p) => p.id === pId) ?? PRESETS[0]!;
    setInputs(target.inputs);
    setGates(target.gates);
    setOutputNode({
      id: "out_main",
      x: 1080,
      y: 260,
      sourceGateId: target.outputGateId
    });
    setCircuitName(target.name);
    setCircuitDesc(target.description);
    setSelectedGateId(null);
    setSidePanelTab("table");

    const nextInputs: Record<string, boolean> = {};
    for (const inp of target.inputs) {
      nextInputs[inp.id] = true;
    }
    setInputStates(nextInputs);
  };

  const toggleInput = (id: string) => {
    if (!simulationOn) return;
    setInputStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Add Gate from Floating Palette
  const handleAddGate = (type: GateType) => {
    const newId = `g_${type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const availableSources = [...inputs.map((i) => i.id), ...gates.map((g) => g.id)];
    const in1 = availableSources[0] ?? "in_A";
    const in2 = type === "NOT" ? undefined : availableSources[1] ?? in1;

    // Place near current view center
    const viewCenterX = -pan.x + 500;
    const viewCenterY = -pan.y + 280;

    const newGate: GateDef = {
      id: newId,
      type,
      x: Math.max(240, viewCenterX + (gates.length % 3) * 40),
      y: Math.max(80, viewCenterY + (gates.length % 4) * 60),
      in1Source: in1,
      in2Source: in2
    };

    setGates((prev) => [...prev, newGate]);
    setSelectedGateId(newId);
    setSidePanelTab("inspector");
    setSidePanelOpen(true);
    setSelectedPresetId("custom");
    setCircuitName("Circuito Personalizado");
  };

  // Add New Input Node
  const handleAddInput = () => {
    if (inputs.length >= 5) return;
    const char = String.fromCharCode(65 + inputs.length); // A, B, C, D, E
    const newId = `in_${char}`;
    const nextY = 100 + inputs.length * 110;
    const newInput: InputDef = { id: newId, label: char, x: 120, y: nextY };

    setInputs((prev) => [...prev, newInput]);
    setInputStates((prev) => ({ ...prev, [newId]: false }));
    setSelectedPresetId("custom");
  };

  // Remove Input Node
  const handleRemoveInput = (inputId: string) => {
    if (inputs.length <= 1) return;
    setInputs((prev) => prev.filter((i) => i.id !== inputId));
    setInputStates((prev) => {
      const next = { ...prev };
      delete next[inputId];
      return next;
    });
    const fallbackId = inputs.find((i) => i.id !== inputId)?.id ?? "in_A";
    setGates((prev) =>
      prev.map((g) => ({
        ...g,
        in1Source: g.in1Source === inputId ? fallbackId : g.in1Source,
        in2Source: g.in2Source === inputId ? fallbackId : g.in2Source
      }))
    );
  };

  // Delete Gate
  const handleDeleteGate = (gateId: string) => {
    setGates((prev) => prev.filter((g) => g.id !== gateId));
    if (selectedGateId === gateId) setSelectedGateId(null);
    if (outputNode.sourceGateId === gateId) {
      const remaining = gates.filter((g) => g.id !== gateId);
      setOutputNode((prev) => ({
        ...prev,
        sourceGateId: remaining[remaining.length - 1]?.id ?? ""
      }));
    }
  };

  // Synthesize circuit automatically from a propositional formula
  const handleSynthesizeFormula = () => {
    setFormulaError("");
    try {
      const parsed = parseFormula(formulaInput);
      const vars = parsed.variables.map((v) => v.toUpperCase());
      const uniqueVars = Array.from(new Set(vars));

      const newInputs: InputDef[] = uniqueVars.map((v, idx) => ({
        id: `in_${v}`,
        label: v,
        x: 120,
        y: 120 + idx * 110
      }));

      const newGates: GateDef[] = [];
      let gateSeq = 1;

      function mapNode(node: AstNode, depth: number): string {
        if (node.kind === "var") {
          return `in_${node.name.toUpperCase()}`;
        }
        if (node.kind === "const") {
          return `in_${uniqueVars[0] ?? "A"}`;
        }
        if (node.kind === "not") {
          const childSrc = mapNode(node.operand, depth + 1);
          const gId = `g_not_${gateSeq++}`;
          newGates.push({
            id: gId,
            type: "NOT",
            x: 360 + depth * 220,
            y: 120 + (newGates.length % 4) * 110,
            in1Source: childSrc
          });
          return gId;
        }
        if (node.kind === "binary") {
          const lSrc = mapNode(node.left, depth + 1);
          const rSrc = mapNode(node.right, depth + 1);
          let gType: GateType = "AND";
          if (node.op === "OR") gType = "OR";
          else if (node.op === "XOR") gType = "XOR";
          else if (node.op === "NAND") gType = "NAND";
          else if (node.op === "NOR") gType = "NOR";
          else if (node.op === "IMPLIES") gType = "OR";
          else if (node.op === "IFF") gType = "XOR";

          const gId = `g_${gType.toLowerCase()}_${gateSeq++}`;
          newGates.push({
            id: gId,
            type: gType,
            x: 360 + depth * 220,
            y: 120 + (newGates.length % 4) * 110,
            in1Source: lSrc,
            in2Source: rSrc
          });
          return gId;
        }
        return "in_A";
      }

      const rootGateId = mapNode(parsed.ast, 0);

      const maxCol = Math.max(360, ...newGates.map((g) => g.x));
      const sortedGates = newGates.map((g) => ({
        ...g,
        x: maxCol - (g.x - 360) + 360
      }));

      setInputs(newInputs);
      setGates(sortedGates);
      setOutputNode({
        id: "out_main",
        x: maxCol + 280,
        y: 260,
        sourceGateId: rootGateId
      });
      setSelectedPresetId("custom");
      setCircuitName(`Circuito: ${parsed.normalized}`);
      setCircuitDesc(`Generado automáticamente desde la fórmula proposicional ${parsed.normalized}.`);
      setFormulaMode(false);
      setSidePanelTab("table");

      const nextInputs: Record<string, boolean> = {};
      newInputs.forEach((i) => (nextInputs[i.id] = true));
      setInputStates(nextInputs);
    } catch (e) {
      setFormulaError((e as Error).message);
    }
  };

  // Figma Pan & Zoom Mechanics (Mouse & Touch)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't pan if clicking directly on a button, input, or draggable gate/node
    if (target.closest("button") || target.closest("input") || target.closest("[data-gate-node]")) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setSelectedGateId(null);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    const target = e.target as HTMLElement;
    // Don't pan if touching directly on a button, input, or draggable gate/node
    if (target.closest("button") || target.closest("input") || target.closest("[data-gate-node]")) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    setSelectedGateId(null);
  };

  const handleItemMouseDown = (id: string, type: "gate" | "input" | "output", e: React.MouseEvent) => {
    e.stopPropagation();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    let itemX = 0;
    let itemY = 0;

    if (type === "gate") {
      const g = gates.find((item) => item.id === id);
      if (g) {
        itemX = g.x;
        itemY = g.y;
        setSelectedGateId(id);
        setSidePanelTab("inspector");
      }
    } else if (type === "input") {
      const inp = inputs.find((item) => item.id === id);
      if (inp) {
        itemX = inp.x;
        itemY = inp.y;
      }
    } else {
      itemX = outputNode.x;
      itemY = outputNode.y;
    }

    const mouseCanvasX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - canvasRect.top - pan.y) / zoom;

    setDraggingItem({
      id,
      type,
      offsetX: mouseCanvasX - itemX,
      offsetY: mouseCanvasY - itemY
    });
  };

  const handleItemTouchStart = (id: string, type: "gate" | "input" | "output", e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    let itemX = 0;
    let itemY = 0;

    if (type === "gate") {
      const g = gates.find((item) => item.id === id);
      if (g) {
        itemX = g.x;
        itemY = g.y;
        setSelectedGateId(id);
      }
    } else if (type === "input") {
      const inp = inputs.find((item) => item.id === id);
      if (inp) {
        itemX = inp.x;
        itemY = inp.y;
      }
    } else {
      itemX = outputNode.x;
      itemY = outputNode.y;
    }

    const mouseCanvasX = (touch.clientX - canvasRect.left - pan.x) / zoom;
    const mouseCanvasY = (touch.clientY - canvasRect.top - pan.y) / zoom;

    setDraggingItem({
      id,
      type,
      offsetX: mouseCanvasX - itemX,
      offsetY: mouseCanvasY - itemY
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y
        });
        return;
      }

      if (!draggingItem || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const mouseCanvasX = (e.clientX - canvasRect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - canvasRect.top - pan.y) / zoom;

      const newX = Math.round(mouseCanvasX - draggingItem.offsetX);
      const newY = Math.round(mouseCanvasY - draggingItem.offsetY);

      if (draggingItem.type === "gate") {
        setGates((prev) =>
          prev.map((g) => (g.id === draggingItem.id ? { ...g, x: newX, y: newY } : g))
        );
      } else if (draggingItem.type === "input") {
        setInputs((prev) =>
          prev.map((inp) => (inp.id === draggingItem.id ? { ...inp, x: newX, y: newY } : inp))
        );
      } else if (draggingItem.type === "output") {
        setOutputNode((prev) => ({ ...prev, x: newX, y: newY }));
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setDraggingItem(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      if (!touch) return;

      if (isPanning) {
        if (e.cancelable) e.preventDefault();
        setPan({
          x: touch.clientX - startPan.x,
          y: touch.clientY - startPan.y
        });
        return;
      }

      if (!draggingItem || !canvasRef.current) return;
      if (e.cancelable) e.preventDefault();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const mouseCanvasX = (touch.clientX - canvasRect.left - pan.x) / zoom;
      const mouseCanvasY = (touch.clientY - canvasRect.top - pan.y) / zoom;

      const newX = Math.round(mouseCanvasX - draggingItem.offsetX);
      const newY = Math.round(mouseCanvasY - draggingItem.offsetY);

      if (draggingItem.type === "gate") {
        setGates((prev) =>
          prev.map((g) => (g.id === draggingItem.id ? { ...g, x: newX, y: newY } : g))
        );
      } else if (draggingItem.type === "input") {
        setInputs((prev) =>
          prev.map((inp) => (inp.id === draggingItem.id ? { ...inp, x: newX, y: newY } : inp))
        );
      } else if (draggingItem.type === "output") {
        setOutputNode((prev) => ({ ...prev, x: newX, y: newY }));
      }
    };

    const handleTouchEnd = () => {
      setIsPanning(false);
      setDraggingItem(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPanning, startPan, draggingItem, pan, zoom]);

  // Evaluate the entire circuit in topological order
  const nodeValues = useMemo(() => {
    const values: Record<string, boolean> = { ...inputStates };
    if (!simulationOn) {
      for (const g of gates) values[g.id] = false;
      return values;
    }

    for (let pass = 0; pass < gates.length + 1; pass++) {
      for (const g of gates) {
        const v1 = values[g.in1Source] ?? false;
        const v2 = g.in2Source ? values[g.in2Source] ?? false : undefined;
        values[g.id] = evalGate(g.type, v1, v2);
      }
    }
    return values;
  }, [inputStates, gates, simulationOn]);

  // Truth table generator
  const truthTableRows = useMemo(() => {
    const inputKeys = inputs.map((i) => i.id);
    const n = inputKeys.length;
    const totalCombinations = 1 << n;
    const rows = [];

    for (let c = 0; c < totalCombinations; c++) {
      const currentCombo: Record<string, boolean> = {};
      for (let i = 0; i < n; i++) {
        const bit = ((c >> (n - 1 - i)) & 1) === 1;
        currentCombo[inputKeys[i]!] = bit;
      }

      const testValues: Record<string, boolean> = { ...currentCombo };
      for (let pass = 0; pass < gates.length + 1; pass++) {
        for (const g of gates) {
          const v1 = testValues[g.in1Source] ?? false;
          const v2 = g.in2Source ? testValues[g.in2Source] ?? false : undefined;
          testValues[g.id] = evalGate(g.type, v1, v2);
        }
      }

      const outVal = testValues[outputNode.sourceGateId] ?? false;
      const isCurrentActive = inputKeys.every((k) => currentCombo[k] === inputStates[k]);

      rows.push({
        combo: currentCombo,
        out: outVal,
        isActive: isCurrentActive
      });
    }
    return rows;
  }, [inputs, gates, outputNode.sourceGateId, inputStates]);

  const outputValue = nodeValues[outputNode.sourceGateId] ?? false;

  // Coordinate lookup for wire paths
  const getPortCoords = (sourceId: string): { x: number; y: number } => {
    const inp = inputs.find((i) => i.id === sourceId);
    if (inp) {
      return { x: inp.x + 80, y: inp.y + 32 };
    }
    const gate = gates.find((g) => g.id === sourceId);
    if (gate) {
      return { x: gate.x + 115, y: gate.y + 30 };
    }
    return { x: 0, y: 0 };
  };

  const selectedGate = gates.find((g) => g.id === selectedGateId);
  const availableSources = [
    ...inputs.map((i) => ({ id: i.id, label: `IN ${i.label}` })),
    ...gates.map((g) => ({ id: g.id, label: `${g.type} (${g.id})` }))
  ];

  return (
    <div className="relative -mx-3 sm:-mx-6 -my-4 sm:-my-8 h-[calc(100dvh-57px)] sm:h-[calc(100vh-68px)] min-h-[500px] bg-void-950 flex flex-col overflow-hidden select-none">
      {/* Figma-Style Top Control Bar */}
      <header className="h-12 sm:h-14 border-b border-cyan-500/20 bg-void-900/90 backdrop-blur-xl px-2 sm:px-4 flex items-center justify-between z-30 shadow-md gap-1">
        {/* Left: Project title & Presets */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-void-950 border border-cyan-500/25">
            <span className="w-2 h-2 rounded-full bg-neon animate-pulse shrink-0" />
            <span className="font-display text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[90px] sm:max-w-[160px] md:max-w-none">
              {circuitName}
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-1 bg-void-950/80 p-0.5 rounded-xl border border-white/10">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  p.id === selectedPresetId
                    ? "bg-cyan-500/20 text-neon font-bold border border-neon/50 shadow-glow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Formula Synthesizer Button */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setFormulaMode(!formulaMode)}
            className="btn-secondary text-[11px] sm:text-xs py-1 px-2 sm:py-1.5 sm:px-3 flex items-center gap-1 sm:gap-1.5 shadow-sm shrink-0"
          >
            <span className="text-neon font-mono font-bold">∑</span>
            <span className="hidden sm:inline">{formulaMode ? "Cerrar" : "De Fórmula a Circuito"}</span>
            <span className="sm:hidden">{formulaMode ? "✕" : "Sintetizar"}</span>
          </button>
        </div>

        {/* Right: Simulation switch & Zoom controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-void-950 p-0.5 rounded-xl border border-cyan-500/20 text-[11px] sm:text-xs font-mono shrink-0">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-slate-300 hover:text-neon hover:bg-white/5 rounded-lg transition-colors"
              title="Reducir Zoom"
            >
              -
            </button>
            <button
              onClick={() => {
                setZoom(typeof window !== "undefined" && window.innerWidth < 768 ? 0.6 : 1);
                setPan(typeof window !== "undefined" && window.innerWidth < 768 ? { x: 10, y: 30 } : { x: 0, y: 0 });
              }}
              className="px-1.5 sm:px-2 font-bold text-neon hover:underline"
              title="Restablecer vista"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.1).toFixed(1))))}
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-slate-300 hover:text-neon hover:bg-white/5 rounded-lg transition-colors"
              title="Aumentar Zoom"
            >
              +
            </button>
          </div>

          {/* Simulation Toggle */}
          <button
            onClick={() => setSimulationOn(!simulationOn)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-display font-bold transition-all shadow-sm flex items-center gap-1 sm:gap-1.5 shrink-0 ${
              simulationOn
                ? "bg-emerald-500 text-void-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : "bg-slate-800 text-slate-400 border border-white/10"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${simulationOn ? "bg-black" : "bg-red-400"}`} />
            <span className="hidden md:inline">{simulationOn ? "SIMULACIÓN ON" : "PAUSADA"}</span>
            <span className="md:hidden">{simulationOn ? "ON" : "OFF"}</span>
          </button>

          {/* Side Drawer Toggle */}
          <button
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border flex items-center gap-1 text-[11px] sm:text-xs font-mono transition-colors shrink-0 ${
              sidePanelOpen
                ? "bg-cyan-500/25 border-cyan-400 text-neon shadow-glow-sm"
                : "bg-void-950 border-cyan-500/25 text-slate-300 hover:text-neon"
            }`}
            title={sidePanelOpen ? "Cerrar panel" : "Abrir tabla y herramientas"}
          >
            <span className="font-mono">▦</span>
            <span className="hidden sm:inline">{sidePanelOpen ? "Ocultar" : "Panel"}</span>
          </button>
        </div>
      </header>

      {/* Floating Formula Synthesizer Modal */}
      {formulaMode && (
        <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl p-4 sm:p-5 rounded-2xl bg-void-900/98 border border-cyan-500/40 shadow-glow backdrop-blur-2xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-xs sm:text-sm font-bold text-neon flex items-center gap-2">
              <span>⚡</span> Sintetizador Automático de Circuitos
            </span>
            <button
              onClick={() => setFormulaMode(false)}
              className="text-xs text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Escribe cualquier fórmula de lógica proposicional. El compilador creará automáticamente todas las compuertas y las conectará en el lienzo.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              className="input-mono text-sm py-2 flex-1"
              value={formulaInput}
              onChange={(e) => setFormulaInput(e.target.value)}
              placeholder="Ej: (A ∧ B) ∨ (¬C ∧ D)"
              spellCheck={false}
            />
            <button onClick={handleSynthesizeFormula} className="btn-primary text-xs py-2 px-4 whitespace-nowrap">
              Sintetizar Circuito
            </button>
          </div>
          <LogicKeyboard
            onInsert={(ch) => setFormulaInput((prev) => prev + ch)}
            onBackspace={() => setFormulaInput((prev) => prev.slice(0, -1))}
            onClear={() => setFormulaInput("")}
            compact
          />
          {formulaError && (
            <p className="text-xs text-red-300 mt-2">⚠️ Error: {formulaError}</p>
          )}
        </div>
      )}

      {/* Main Studio Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-void-950">
        {/* Infinite Dot Grid Canvas */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onTouchStart={handleCanvasTouchStart}
          style={{
            cursor: isPanning ? "grabbing" : "grab",
            backgroundImage: `radial-gradient(circle, rgba(0, 240, 255, 0.15) 1.2px, transparent 1.2px)`,
            backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
          className="w-full h-full relative"
        >
          {/* Zoom/Pan Scaled Layer */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: "3000px",
              height: "2000px",
              position: "absolute",
              top: 0,
              left: 0
            }}
          >
            {/* SVG Dynamic Wires Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Draw wires from source to gate inputs */}
              {gates.map((g) => {
                const in1Pt = getPortCoords(g.in1Source);
                const gIn1Y = g.type === "NOT" ? g.y + 30 : g.y + 18;
                const v1 = nodeValues[g.in1Source] ?? false;

                const in2Pt = g.in2Source ? getPortCoords(g.in2Source) : null;
                const gIn2Y = g.y + 42;
                const v2 = g.in2Source ? nodeValues[g.in2Source] ?? false : false;

                return (
                  <React.Fragment key={g.id}>
                    {/* Wire 1 */}
                    <path
                      d={`M ${in1Pt.x} ${in1Pt.y} C ${in1Pt.x + 80} ${in1Pt.y}, ${g.x - 80} ${gIn1Y}, ${g.x} ${gIn1Y}`}
                      fill="none"
                      stroke={v1 && simulationOn ? "#10B981" : "#1e293b"}
                      strokeWidth={v1 && simulationOn ? 4 : 2.5}
                      className={v1 && simulationOn ? "anim-signal" : ""}
                    />
                    {/* Wire 2 if 2-input gate */}
                    {in2Pt && (
                      <path
                        d={`M ${in2Pt.x} ${in2Pt.y} C ${in2Pt.x + 80} ${in2Pt.y}, ${g.x - 80} ${gIn2Y}, ${g.x} ${gIn2Y}`}
                        fill="none"
                        stroke={v2 && simulationOn ? "#10B981" : "#1e293b"}
                        strokeWidth={v2 && simulationOn ? 4 : 2.5}
                        className={v2 && simulationOn ? "anim-signal" : ""}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Wire from source gate to Output Lamp */}
              {(() => {
                const outGate = gates.find((g) => g.id === outputNode.sourceGateId);
                if (!outGate) return null;
                const startX = outGate.x + 115;
                const startY = outGate.y + 30;
                const targetX = outputNode.x;
                const targetY = outputNode.y + 40;
                return (
                  <path
                    d={`M ${startX} ${startY} C ${startX + 60} ${startY}, ${targetX - 60} ${targetY}, ${targetX} ${targetY}`}
                    fill="none"
                    stroke={outputValue && simulationOn ? "#10B981" : "#1e293b"}
                    strokeWidth={outputValue && simulationOn ? 5 : 3}
                    className={outputValue && simulationOn ? "anim-signal" : ""}
                  />
                );
              })()}
            </svg>

            {/* Draggable Input Nodes */}
            {inputs.map((inp) => {
              const val = inputStates[inp.id] ?? false;
              return (
                <div
                  key={inp.id}
                  data-gate-node="true"
                  style={{ position: "absolute", left: `${inp.x}px`, top: `${inp.y}px` }}
                  onMouseDown={(e) => handleItemMouseDown(inp.id, "input", e)}
                  onTouchStart={(e) => handleItemTouchStart(inp.id, "input", e)}
                  className="z-10 flex items-center gap-2 group cursor-grab active:cursor-grabbing select-none"
                >
                  <button
                    type="button"
                    onClick={() => toggleInput(inp.id)}
                    className={`relative flex flex-col items-center justify-center w-20 h-16 rounded-2xl border-2 transition-all cursor-pointer backdrop-blur-md ${
                      val && simulationOn
                        ? "bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105"
                        : "bg-void-900/95 border-cyan-500/25 text-slate-400 hover:border-cyan-400/60"
                    }`}
                    title={`Conmutar ${inp.label} (Valor: ${val ? 1 : 0})`}
                  >
                    <span className="font-display text-xs font-bold text-slate-200">
                      IN {inp.label}
                    </span>
                    <span
                      className={`font-mono text-2xl font-black ${
                        val && simulationOn ? "text-emerald-300" : "text-slate-500"
                      }`}
                    >
                      {val ? "1" : "0"}
                    </span>
                    <span className="text-[9px] font-mono text-muted uppercase">
                      {val ? "HIGH" : "LOW"}
                    </span>
                  </button>

                  {/* Output pin value dot */}
                  <div
                    className={`w-5 h-5 rounded-full border border-black/40 flex items-center justify-center text-[10px] font-mono font-bold ${
                      val && simulationOn
                        ? "bg-emerald-400 text-black shadow-[0_0_10px_#10B981]"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {val ? "1" : "0"}
                  </div>

                  {/* Delete Input Button if > 1 */}
                  {inputs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveInput(inp.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-200 bg-void-950 rounded-full w-5 h-5 flex items-center justify-center border border-red-500/30 transition-opacity"
                      title="Eliminar entrada"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}

            {/* Draggable Gates on Canvas (Expanded Figma Nodes) */}
            {gates.map((g) => {
              const outVal = nodeValues[g.id] ?? false;
              const style = GATE_STYLES[g.type];
              const isSelected = selectedGateId === g.id;
              const isFinalOut = outputNode.sourceGateId === g.id;

              return (
                <div
                  key={g.id}
                  data-gate-node="true"
                  style={{ position: "absolute", left: `${g.x}px`, top: `${g.y}px` }}
                  onMouseDown={(e) => handleItemMouseDown(g.id, "gate", e)}
                  onTouchStart={(e) => handleItemTouchStart(g.id, "gate", e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGateId(g.id);
                    setSidePanelTab("inspector");
                    setSidePanelOpen(true);
                  }}
                  className={`z-10 w-28 h-16 rounded-2xl border-2 flex items-center justify-between px-3 backdrop-blur-xl cursor-grab active:cursor-grabbing transition-all select-none ${
                    style.bg
                  } ${style.border} ${style.glow} ${
                    isSelected ? "ring-4 ring-neon scale-105 shadow-glow" : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`font-display text-sm font-black tracking-wider ${style.text}`}>
                      {g.type}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-[55px]">
                      {isFinalOut ? "★ FINAL" : g.id}
                    </span>
                  </div>

                  {/* Output pin value socket */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition-colors ${
                      outVal && simulationOn
                        ? "bg-emerald-500 border-emerald-300 text-black shadow-[0_0_12px_#10B981]"
                        : "bg-void-950 border-white/15 text-slate-500"
                    }`}
                  >
                    {outVal ? "1" : "0"}
                  </div>
                </div>
              );
            })}

            {/* Draggable Final Output Lamp Node */}
            <div
              data-gate-node="true"
              style={{ position: "absolute", left: `${outputNode.x}px`, top: `${outputNode.y}px` }}
              onMouseDown={(e) => handleItemMouseDown("out_main", "output", e)}
              onTouchStart={(e) => handleItemTouchStart("out_main", "output", e)}
              className="z-10 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
            >
              <div
                className={`flex flex-col items-center justify-center w-28 h-20 rounded-2xl border-2 transition-all backdrop-blur-xl ${
                  outputValue && simulationOn
                    ? "bg-emerald-950/95 border-emerald-400 text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.7)] scale-105"
                    : "bg-void-900/95 border-cyan-500/30 text-slate-500"
                }`}
              >
                <span className="font-display text-[11px] font-black text-slate-200 uppercase tracking-wider">
                  SALIDA (OUT)
                </span>
                <span className="font-mono text-3xl font-black text-neon mt-0.5">
                  {outputValue ? "1" : "0"}
                </span>
                <span className="text-[10px] font-mono text-muted uppercase">
                  {outputValue ? "VERDADERO" : "FALSO"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bottom Gate Palette (Figma Island Style - Responsive Scroll) */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute bottom-2.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-1rem)] overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-void-900/95 border border-cyan-500/30 backdrop-blur-xl shadow-glow"
        >
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-muted-light font-bold px-1.5 hidden md:inline shrink-0">
            Paleta:
          </span>

          {(["AND", "OR", "NOT", "NAND", "NOR", "XOR"] as GateType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAddGate(type)}
              className={`shrink-0 rounded-xl px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-display font-bold border transition-all hover:scale-105 active:scale-95 shadow-sm ${GATE_STYLES[type].border} ${GATE_STYLES[type].bg} ${GATE_STYLES[type].text}`}
              title={`Añadir compuerta ${type}`}
            >
              + {type}
            </button>
          ))}

          <div className="h-5 sm:h-6 w-[1px] bg-white/10 mx-0.5 sm:mx-1 shrink-0" />

          <button
            onClick={handleAddInput}
            disabled={inputs.length >= 5}
            className={`shrink-0 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold border transition-all ${
              inputs.length >= 5
                ? "opacity-40 cursor-not-allowed border-white/10 text-muted"
                : "border-cyan-400 bg-cyan-500/15 text-neon hover:bg-cyan-500/25"
            }`}
            title="Añadir entrada booleana (+ IN)"
          >
            + IN ({inputs.length}/5)
          </button>
        </div>

        {/* Mobile Backdrop Overlay when Drawer is open */}
        {sidePanelOpen && (
          <div
            className="md:hidden fixed inset-0 z-35 bg-black/60 backdrop-blur-xs"
            onClick={() => setSidePanelOpen(false)}
          />
        )}

        {/* Floating Side / Bottom Sheet Studio Panel (Figma Design Inspector) */}
        {sidePanelOpen && (
          <aside className="fixed inset-x-2 bottom-2 max-h-[75vh] md:fixed md:top-20 md:right-4 md:bottom-4 md:w-96 md:max-h-none md:inset-x-auto z-40 rounded-2xl sm:rounded-3xl bg-void-900/98 border border-cyan-500/40 backdrop-blur-2xl shadow-card flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto my-1.5 md:hidden shrink-0" />

            {/* Panel Tabs Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 bg-void-950/60 p-2 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSidePanelTab("table")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                    sidePanelTab === "table"
                      ? "bg-cyan-500/20 text-neon font-bold border border-neon/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setSidePanelTab("inspector")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                    sidePanelTab === "inspector"
                      ? "bg-cyan-500/20 text-neon font-bold border border-neon/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Inspector
                </button>
                <button
                  onClick={() => setSidePanelTab("presets")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                    sidePanelTab === "presets"
                      ? "bg-cyan-500/20 text-neon font-bold border border-neon/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Plantillas
                </button>
              </div>

              <button
                onClick={() => setSidePanelOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-xs"
                title="Cerrar panel"
              >
                ✕
              </button>
            </div>

            {/* Tab 1: Truth Table Content */}
            {sidePanelTab === "table" && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-neon font-mono">▦</span> Tabla Booleana
                    </span>
                    <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-neon font-bold">
                      {inputs.length} Vars · {truthTableRows.length} Filas
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-cyan-500/20 bg-void-950/80">
                    <table className="w-full border-collapse font-mono text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-void-900 border-b border-cyan-500/25 text-slate-300">
                          {inputs.map((inp) => (
                            <th key={inp.id} className="p-2 text-center font-bold">
                              {inp.label}
                            </th>
                          ))}
                          <th className="p-2 text-center text-neon font-black">
                            OUT
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {truthTableRows.map((r, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-white/5 transition-all ${
                              r.isActive
                                ? "bg-cyan-500/30 text-white font-bold shadow-[inset_0_0_15px_rgba(0,240,255,0.3)]"
                                : "text-slate-400 hover:bg-white/5"
                            }`}
                          >
                            {inputs.map((inp) => {
                              const v = r.combo[inp.id];
                              return (
                                <td key={inp.id} className="p-2 text-center">
                                  <span className={v ? "text-emerald-400 font-bold" : "text-slate-500"}>
                                    {v ? "1" : "0"}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="p-2 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-bold ${
                                  r.out
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : "bg-slate-800 text-slate-500 border border-white/5"
                                }`}
                              >
                                {r.out ? "1" : "0"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[11px] text-muted leading-relaxed">
                    La fila resaltada en cian representa el estado activo actual del circuito.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-cyan-500/15">
                  <span className="text-[10px] font-mono text-muted uppercase">Señales:</span>
                  <div className="mt-1 flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                      1 (HIGH)
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      0 (LOW)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Inspector Content */}
            {sidePanelTab === "inspector" && (
              <div className="flex-1 p-4 overflow-y-auto">
                {selectedGate ? (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                      <div>
                        <span className="text-[10px] font-mono text-neon uppercase font-bold">Compuerta:</span>
                        <h3 className="font-display text-base font-bold text-white">{selectedGate.id}</h3>
                      </div>
                      <button
                        onClick={() => handleDeleteGate(selectedGate.id)}
                        className="rounded-lg border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20 transition-colors"
                      >
                        Eliminar 🗑️
                      </button>
                    </div>

                    {/* Change Gate Type */}
                    <div>
                      <label className="text-[11px] font-mono text-muted uppercase block mb-1">
                        Cambiar Función Lógica:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(["AND", "OR", "NOT", "NAND", "NOR", "XOR"] as GateType[]).map((t) => (
                          <button
                            key={t}
                            onClick={() =>
                              setGates((prev) =>
                                prev.map((g) => (g.id === selectedGate.id ? { ...g, type: t } : g))
                              )
                            }
                            className={`py-1.5 text-xs font-mono font-bold rounded-xl border transition-all ${
                              selectedGate.type === t
                                ? "bg-neon/20 border-neon text-neon shadow-glow-sm"
                                : "bg-void-950 border-white/10 text-slate-300 hover:border-cyan-500/30"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pin 1 Source */}
                    <div>
                      <label className="text-[11px] font-mono text-muted uppercase block mb-1">
                        Entrada 1 (Pin A):
                      </label>
                      <select
                        className="w-full rounded-xl bg-void-950 border border-cyan-500/30 px-3 py-2 text-xs font-mono text-slate-200"
                        value={selectedGate.in1Source}
                        onChange={(e) =>
                          setGates((prev) =>
                            prev.map((g) =>
                              g.id === selectedGate.id ? { ...g, in1Source: e.target.value } : g
                            )
                          )
                        }
                      >
                        {availableSources
                          .filter((s) => s.id !== selectedGate.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Pin 2 Source if binary */}
                    {selectedGate.type !== "NOT" && (
                      <div>
                        <label className="text-[11px] font-mono text-muted uppercase block mb-1">
                          Entrada 2 (Pin B):
                        </label>
                        <select
                          className="w-full rounded-xl bg-void-950 border border-cyan-500/30 px-3 py-2 text-xs font-mono text-slate-200"
                          value={selectedGate.in2Source ?? availableSources[0]?.id}
                          onChange={(e) =>
                            setGates((prev) =>
                              prev.map((g) =>
                                g.id === selectedGate.id ? { ...g, in2Source: e.target.value } : g
                              )
                            )
                          }
                        >
                          {availableSources
                            .filter((s) => s.id !== selectedGate.id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Connect to Output */}
                    <button
                      onClick={() =>
                        setOutputNode((prev) => ({ ...prev, sourceGateId: selectedGate.id }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-display font-bold border transition-all ${
                        outputNode.sourceGateId === selectedGate.id
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          : "bg-void-950 border-cyan-500/30 text-cyan-300 hover:border-cyan-300"
                      }`}
                    >
                      {outputNode.sourceGateId === selectedGate.id
                        ? "★ Conectada a Salida Principal"
                        : "Conectar a Salida Principal (OUT)"}
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
                    <span className="text-3xl mb-2">🖱️</span>
                    <p className="text-xs">
                      Haz clic sobre cualquier compuerta en el lienzo para ver y editar sus propiedades.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Presets & Info Content */}
            {sidePanelTab === "presets" && (
              <div className="flex-1 p-4 overflow-y-auto grid gap-3">
                <div className="p-3 rounded-2xl bg-void-950 border border-cyan-500/20">
                  <span className="text-[10px] font-mono text-neon uppercase font-bold">Acerca del Circuito Actual:</span>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">{circuitDesc}</p>
                </div>
                <span className="text-xs font-mono text-muted uppercase font-bold mt-1">
                  Plantillas Rápidas:
                </span>
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      p.id === selectedPresetId
                        ? "bg-cyan-500/20 border-neon text-neon shadow-glow-sm"
                        : "bg-void-950 border-white/10 text-slate-300 hover:border-cyan-500/30"
                    }`}
                  >
                    <p className="font-display text-xs font-bold text-white">{p.name}</p>
                    <p className="text-[11px] font-mono text-cyan-300 mt-1">{p.formula}</p>
                    <p className="text-[10px] text-muted mt-1 leading-relaxed">{p.description}</p>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
