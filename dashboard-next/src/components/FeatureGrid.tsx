export default function FeatureGrid({ data }: any) {
  return (
    <section className="features" id="features">
      <h2>{data.title}</h2>

      <div className="grid">
        {data.items.map((f: any, i: number) => (
          <div className="card" key={i}>
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
