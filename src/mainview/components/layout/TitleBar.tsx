interface TitleBarProps {
  projectName: string;
}

export function TitleBar({ projectName }: TitleBarProps) {
  return (
    <div
      className="drag-region flex items-center h-12 px-4 border-b shrink-0"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-subtle)",
        paddingLeft: 80, // Space for macOS traffic lights
      }}
    >
      <span
        className="no-drag text-sm font-medium truncate"
        style={{ color: "var(--text-primary)" }}
      >
        {projectName}
      </span>
    </div>
  );
}
