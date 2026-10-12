import SunMark from "@/components/SunMark";

// A preview of the color tokens from app/globals.css, so they can be checked by eye.
const COLOR_TOKENS = [
  { name: "bg", hex: "#0E1024" },
  { name: "surface", hex: "#181B36" },
  { name: "surface-2", hex: "#22264A" },
  { name: "border", hex: "#3A3F6E" },
  { name: "text", hex: "#F5F0E6" },
  { name: "muted", hex: "#B3B0C7" },
  { name: "sun", hex: "#FFC23A" },
  { name: "sun-light", hex: "#FFD873" },
  { name: "red", hex: "#E8452C" },
  { name: "ink", hex: "#1A1410" },
  { name: "moon", hex: "#E9E4D6" },
  { name: "planet-1", hex: "#7FB2FF" },
  { name: "planet-2", hex: "#FF8F6B" },
  { name: "planet-3", hex: "#9BE3B8" },
  { name: "planet-4", hex: "#C9A7FF" },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <SunMark size={160} title="A smiling sun" />
        <p className="eyebrow">Welcome to Solcraft</p>
        <h1>Hello, sun</h1>
        <p className="lede">
          Discover shared cultural and creative experiences in your city, show up, and keep
          coming back.
        </p>
      </section>

      <section className="tokens" aria-labelledby="tokens-heading">
        <h2 id="tokens-heading">Color tokens</h2>
        <ul className="swatches">
          {COLOR_TOKENS.map((token) => (
            <li key={token.name} className="swatch">
              <span
                className="swatch-chip"
                style={{ background: `var(--color-${token.name})` }}
                aria-hidden="true"
              />
              <span className="swatch-text">
                <strong>{token.name}</strong>
                <code>{token.hex}</code>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
