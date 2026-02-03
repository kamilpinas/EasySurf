// Recovery prompt shown when the senior changed font size last session and
// it differs from the caregiver's default (N-06).

interface Props {
  seniorName: string
  onKeep: () => void
  onRevert: () => void
}

export function FontSizeRecovery({ seniorName, onKeep, onRevert }: Props) {
  const greeting = seniorName.trim() ? seniorName.trim() : "There"

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Text size changed"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        padding: "1rem 1.5rem",
        background: "var(--color-surface)",
        border: "1.5px solid var(--color-surface-edge)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <p
        style={{ margin: 0, fontSize: "1.0625rem", color: "var(--color-text)" }}
      >
        {greeting}, last time the text was made larger.{" "}
        <span style={{ color: "var(--color-text-muted)" }}>
          Keep it that way?
        </span>
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
        <button
          onClick={onKeep}
          style={{
            padding: "0.5rem 1.25rem",
            fontSize: "1.5rem",
            fontWeight: 600,
            fontFamily: "inherit",
            color: "var(--color-text)",
            background: "transparent",
            border: "1.5px solid var(--color-surface-edge)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
        >
          Keep larger
        </button>

        <button
          onClick={onRevert}
          style={{
            padding: "0.5rem 1.25rem",
            fontSize: "1.5rem",
            fontWeight: 600,
            fontFamily: "inherit",
            color: "#fff",
            background: "var(--color-accent)",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
        >
          Back to normal
        </button>
      </div>
    </div>
  )
}
