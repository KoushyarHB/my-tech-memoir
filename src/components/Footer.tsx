export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg-raised)",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-6 flex items-center justify-between">
        <p
          className="text-sm font-sans"
          style={{ color: "var(--ink-tertiary)" }}
        >
          &copy; {new Date().getFullYear()} My Tech Memoir
        </p>
        <p
          className="text-xs font-sans tracking-wide uppercase"
          style={{ color: "var(--ink-tertiary)", letterSpacing: "0.08em" }}
        >
          Written while learning
        </p>
      </div>
    </footer>
  );
}
