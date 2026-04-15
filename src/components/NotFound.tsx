import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-16 text-center">
      <div className="text-[72px] leading-none font-mono text-vsc-accent">404</div>
      <h1 className="text-h1 text-vsc-heading mt-4">Page not found</h1>
      <p className="text-vsc-textMuted mt-2">
        The recipe you are looking for does not exist yet.
      </p>
      <Link
        to="/"
        className="inline-block mt-6 px-4 py-2 rounded-md2 bg-vsc-accent text-white hover:bg-vsc-accentHover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsc-accent"
      >
        Back to Home
      </Link>
    </div>
  );
}
