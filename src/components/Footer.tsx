export default function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span
              className="text-sm font-sans font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              My Tech Memoir
            </span>
            <span
              className="hidden sm:inline text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              ·
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              &copy; {new Date().getFullYear()}
            </span>
          </div>

          {/* Right */}
          <p
            className="text-xs font-sans tracking-widest uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Written while learning
          </p>
        </div>
      </div>
    </footer>
  );
}
