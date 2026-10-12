import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page-intro">
      <p className="eyebrow">404</p>
      <h1 className="page-title">No standard lives here yet.</h1>
      <p className="lede">The page may have moved, or the standard may not be in the guide. You could add it.</p>
      <p style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <Link href="/" className="button button--primary">
          Back to the map
        </Link>
        <Link href="/contribute" className="button">
          Add a standard
        </Link>
      </p>
    </div>
  );
}
