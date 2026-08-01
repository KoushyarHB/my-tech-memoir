type PostTagProps = {
  children: React.ReactNode;
};

export function PostTag({ children }: PostTagProps) {
  return (
    <span
      className="rounded-md px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase"
      style={{
        color: "var(--ink-tertiary)",
        backgroundColor: "var(--bg-muted)",
      }}
    >
      {children}
    </span>
  );
}
