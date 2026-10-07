import { images } from "../data/images";
export default function Credits() {
  return (
    <div className="container credits-page">
      <div className="page-heading">
        <p className="eyebrow">THROUGH SOMEONE ELSE’S LENS</p>
        <h1>Photography credits</h1>
        <p>
          Thank you to the photographers who help bring these cities into view.
        </p>
      </div>
      {Object.entries(images).map(([key, i]) => (
        <article className="credit-card" key={key}>
          <img src={i.src} alt={key} />
          <div>
            <h2>{i.credit}</h2>
            <p>{i.license} · Downloaded thumbnail, cropped for display.</p>
            <a
              className="text-link"
              href={i.url}
              target="_blank"
              rel="noreferrer"
            >
              Original photograph and licence
            </a>
            {i.license === "Free Art License" ? (
              <a
                className="text-link"
                href="https://artlibre.org/licence/lal/en/"
                target="_blank"
                rel="noreferrer"
              >
                Read the Free Art License
              </a>
            ) : (
              <a
                className="text-link"
                href={`https://creativecommons.org/licenses/by-sa/${i.license.endsWith("4.0") ? "4.0" : "3.0"}/`}
                target="_blank"
                rel="noreferrer"
              >
                Read the Creative Commons licence
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
