type PostDateProps = {
  children: React.ReactNode;
};

export function PostDate({ children }: PostDateProps) {
  return (
    <time
      className="text-xs font-medium tracking-wider uppercase"
      style={{ color: "var(--ink-tertiary)" }}
    >
      {children}
    </time>
  );
}
