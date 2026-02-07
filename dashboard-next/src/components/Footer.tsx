export default function Footer({ data }: any) {
  return (
    <footer>
      <nav>
        {data.links.map((l: any, i: number) => (
          <a key={i} href={l.href}>{l.label}</a>
        ))}
      </nav>
      <p>{data.copyright}</p>
    </footer>
  );
}
