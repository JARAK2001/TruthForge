export default function PlaceholderPage({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="card p-8">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-300">{detail}</p>
    </section>
  );
}
