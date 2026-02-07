export default function Trust({ data }: any) {
  return (
    <section className="trust">
      <h2>{data.title}</h2>
      <blockquote>
        {data.quote}
        <span>{data.author}</span>
      </blockquote>
    </section>
  );
}
