export default function Hero({ data }: any) {
  return (
    <section className="hero">
      <h1>{data.title}</h1>
      <p>{data.subtitle}</p>

      <div className="hero-actions">
        <a className="btn-primary" href={data.cta.href}>
          {data.cta.label}
        </a>
      </div>
    </section>
  );
}
