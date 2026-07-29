export default function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-sans"
            style={{ color: "var(--text-tertiary)" }}
          >
            &copy; {new Date().getFullYear()} My Tech Memoir
          </span>
          <span
            className="text-xs font-sans tracking-widest uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Written while learning
          </span>
        </div>
      </div>
    </footer>
  );
}
