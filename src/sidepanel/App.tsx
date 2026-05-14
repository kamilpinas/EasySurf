// Side panel UI — senior-optimised two-column tile layout with Phosphor icons.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import Sortable from "sortablejs"
import {
  House,
  ArrowLeft,
  ArrowRight,
  ArrowLineUp,
  ArrowsDownUp,
  TextAa,
  BookmarkSimple,
  XCircle,
  Lock,
  PencilSimple,
  Eye,
  EyeSlash,
  DotsSixVertical,
  SpeakerHigh,
  SpeakerLow,
  SpeakerNone,
  SpeakerSlash,
} from "@phosphor-icons/react"
import { storage } from "@shared/storage"
import { FloatingToast, useToast } from "@shared/toast"
import {
  FONT_SIZES,
  FONT_SIZE_LABELS,
  DEFAULT_PANEL_BUTTON_ORDER,
  DEFAULT_PANEL_BUTTONS,
} from "@shared/constants"
import type { FontSize, PanelButtonConfig } from "@shared/types"

// ── Icon map (Phosphor, weight="bold") ────────────────────────────────────────

const PHOSPHOR: Record<string, React.ReactNode> = {
  home: <House size={36} weight="bold" />,
  back: <ArrowLeft size={36} weight="bold" />,
  forward: <ArrowRight size={36} weight="bold" />,
  scrollTop: <ArrowLineUp size={36} weight="bold" />,
  zoom: <TextAa size={36} weight="bold" />,
  save: <BookmarkSimple size={36} weight="bold" />,
  exit: <XCircle size={36} weight="bold" />,
}

// Smaller variants for the admin drag list
const PHOSPHOR_SM: Record<string, React.ReactNode> = {
  home: <House size={18} weight="bold" />,
  back: <ArrowLeft size={18} weight="bold" />,
  forward: <ArrowRight size={18} weight="bold" />,
  volume: <SpeakerHigh size={18} weight="bold" />,
  scroll: <ArrowsDownUp size={18} weight="bold" />,
  scrollTop: <ArrowLineUp size={18} weight="bold" />,
  zoom: <TextAa size={18} weight="bold" />,
  save: <BookmarkSimple size={18} weight="bold" />,
  exit: <XCircle size={18} weight="bold" />,
}

// ── Tile button ───────────────────────────────────────────────────────────────

interface TileProps {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "primary" | "danger"
  fullWidth?: boolean
  tourTarget?: string
}

function Tile({
  id,
  label,
  icon,
  onClick,
  disabled = false,
  variant = "default",
  fullWidth = false,
  tourTarget,
}: TileProps) {
  const [hov, setHov] = useState(false)
  const [pressed, setPressed] = useState(false)

  const isPrimary = variant === "primary"
  const isDanger = variant === "danger"

  // Background logic
  let bg = "var(--sw-surface)"
  if (isPrimary)
    bg = hov ? "var(--sw-accent-btn-hover)" : "var(--sw-accent-btn)"
  else if (isDanger) bg = hov ? "var(--sw-danger-light)" : "var(--sw-surface)"
  else if (hov) bg = "var(--sw-accent-light)"

  // Text / icon colour
  let fg = "var(--sw-text-muted)"
  if (isPrimary) fg = "#fff"
  else if (isDanger) fg = hov ? "var(--sw-danger)" : "var(--sw-text-muted)"
  else if (hov) fg = "var(--sw-accent)"

  // Border
  let border = `1.5px solid ${hov && !isPrimary ? "var(--sw-accent-light)" : "var(--sw-surface-edge)"}`
  if (isPrimary) border = "none"
  if (isDanger && hov) border = `1.5px solid var(--sw-danger)`

  return (
    <button
      key={id}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      data-panel-tour={tourTarget}
      onMouseEnter={() => {
        if (!disabled) setHov(true)
      }}
      onMouseLeave={() => {
        setHov(false)
        setPressed(false)
      }}
      onMouseDown={() => {
        if (!disabled) setPressed(true)
      }}
      onMouseUp={() => setPressed(false)}
      style={{
        gridColumn: fullWidth ? "span 2" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.45rem",
        padding: fullWidth ? "1rem 1.25rem" : "1rem 0.5rem",
        minHeight: fullWidth ? 68 : 84,
        background: bg,
        border,
        borderRadius: "var(--sw-radius)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.38 : 1,
        color: fg,
        fontFamily: "inherit",
        transition:
          "background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s",
        transform: pressed ? "scale(0.95)" : hov ? "scale(1.02)" : "scale(1)",
        boxShadow: isPrimary
          ? hov
            ? "0 6px 20px rgba(160, 74, 28, 0.45)"
            : "0 3px 10px rgba(194, 94, 42, 0.28)"
          : hov
            ? "var(--sw-shadow-md)"
            : "none",
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
          flexDirection: fullWidth ? "row" : "column",
          gap: fullWidth ? "0.6rem" : 0,
        }}
      >
        {icon}

        {/* Inline label for full-width buttons */}
        {fullWidth && (
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "0.01em",
              lineHeight: 1.2,
            }}
          >
            {label}
          </span>
        )}
      </span>

      {/* Label below icon for tile buttons */}
      {!fullWidth && (
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            letterSpacing: "0.01em",
            lineHeight: 1.2,
            textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </button>
  )
}

// ── Zoom size indicator dots ──────────────────────────────────────────────────

function ZoomTile({
  label,
  currentSize,
  onClick,
  disabled,
}: {
  label: string
  currentSize: FontSize
  onClick: () => void
  disabled: boolean
}) {
  const [hov, setHov] = useState(false)
  const [pressed, setPressed] = useState(false)
  const sizeIdx = FONT_SIZES.indexOf(currentSize)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label}: ${FONT_SIZE_LABELS[currentSize]}`}
      onMouseEnter={() => {
        if (!disabled) setHov(true)
      }}
      onMouseLeave={() => {
        setHov(false)
        setPressed(false)
      }}
      onMouseDown={() => {
        if (!disabled) setPressed(true)
      }}
      onMouseUp={() => setPressed(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.45rem",
        padding: "1rem 0.5rem",
        minHeight: 84,
        background: hov ? "var(--sw-accent-light)" : "var(--sw-surface)",
        border: `1.5px solid ${hov ? "var(--sw-accent-light)" : "var(--sw-surface-edge)"}`,
        borderRadius: "var(--sw-radius)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.38 : 1,
        color: hov ? "var(--sw-accent)" : "var(--sw-text-muted)",
        fontFamily: "inherit",
        transition:
          "background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s",
        transform: pressed ? "scale(0.95)" : hov ? "scale(1.02)" : "scale(1)",
        boxShadow: hov ? "var(--sw-shadow-md)" : "none",
      }}
    >
      <TextAa size={36} weight="bold" />

      {/* Step dots */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {FONT_SIZES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === sizeIdx ? 8 : 5,
              height: i === sizeIdx ? 8 : 5,
              borderRadius: "50%",
              background:
                i <= sizeIdx ? "currentColor" : "var(--sw-surface-edge)",
              transition: "background 0.15s, width 0.15s, height 0.15s",
            }}
          />
        ))}
      </div>

      <span
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          letterSpacing: "0.01em",
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </button>
  )
}

// ── Volume control tile ───────────────────────────────────────────────────────

const SEGMENTS = 10
const VOL_STEP = 0.1

function speakerIcon(vol: number) {
  if (vol === 0) return <SpeakerSlash size={22} weight="bold" />
  if (vol <= 0.35) return <SpeakerNone size={22} weight="bold" />
  if (vol <= 0.65) return <SpeakerLow size={22} weight="bold" />
  return <SpeakerHigh size={22} weight="bold" />
}

// Bar heights rise left-to-right like an equaliser (8 px → 30 px).
function barHeight(idx: number): number {
  return Math.round(8 + (idx / (SEGMENTS - 1)) * 22)
}

interface VolTileProps {
  label: string
  volume: number // 0.0 – 1.0
  onSet: (v: number) => void
}

function VolumeControlTile({ label, volume, onSet }: VolTileProps) {
  const preVolRef = useRef(1.0) // remembers level before muting
  const filled = Math.round(volume * SEGMENTS)
  const pct = Math.round(volume * 100)
  const atMin = volume <= 0
  const atMax = volume >= 1
  const muted = volume === 0

  const dec = () => {
    if (!atMin) onSet(parseFloat(Math.max(0, volume - VOL_STEP).toFixed(1)))
  }
  const inc = () => {
    if (!atMax) onSet(parseFloat(Math.min(1, volume + VOL_STEP).toFixed(1)))
  }
  const toggleMute = () => {
    if (muted) {
      onSet(preVolRef.current > 0 ? preVolRef.current : 0.5)
    } else {
      preVolRef.current = volume
      onSet(0)
    }
  }

  return (
    <div
      data-panel-tour="volume"
      style={{
        gridColumn: "span 2",
        padding: "0.85rem 0.9rem 0.75rem",
        background: "var(--sw-surface)",
        border: "1.5px solid var(--sw-surface-edge)",
        borderRadius: "var(--sw-radius)",
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
      }}
    >
      {/* Header row — icon, label, percentage */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            color: "var(--sw-text-muted)",
          }}
        >
          {speakerIcon(volume)}
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--sw-text-muted)",
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: "1.05rem",
            fontWeight: 800,
            color: muted ? "var(--sw-accent)" : "var(--sw-text)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            minWidth: 44,
            textAlign: "right",
          }}
        >
          {muted ? "Muted" : `${pct}%`}
        </span>
      </div>

      {/* Equaliser bar */}
      <div
        style={{
          display: "flex",
          gap: 3,
          alignItems: "flex-end",
          height: 32,
          padding: "0 2px",
        }}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: i < filled ? barHeight(i) : 6,
              borderRadius: 3,
              background:
                i < filled
                  ? `hsl(${22 + i * 4}, 72%, ${46 - i * 1.5}%)`
                  : "var(--sw-surface-edge)",
              transition:
                "height 0.12s cubic-bezier(.22,.68,0,1.2), background 0.15s",
            }}
          />
        ))}
      </div>

      {/* − Less / + More */}
      <div style={{ display: "flex", gap: 6 }}>
        <VolBtn icon="−" label="LESS" onClick={dec} disabled={atMin} />
        <VolBtn icon="+" label="MORE" onClick={inc} disabled={atMax} />
      </div>

      {/* Mute / Unmute */}
      <VolBtn
        icon={speakerIcon(volume)}
        label={muted ? "UNMUTE" : "MUTE"}
        onClick={toggleMute}
        disabled={false}
        fullWidth
        accent={muted}
      />
    </div>
  )
}

interface VolBtnProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled: boolean
  fullWidth?: boolean
  accent?: boolean // active/on state (e.g. Mute engaged)
}

function VolBtn({
  icon,
  label,
  onClick,
  disabled,
  fullWidth = false,
  accent = false,
}: VolBtnProps) {
  const [hov, setHov] = useState(false)
  const [press, setPress] = useState(false)

  const bg = accent
    ? "var(--sw-accent-xlight)"
    : hov
      ? "var(--sw-accent-light)"
      : "var(--sw-bg)"
  const col = disabled
    ? "var(--sw-surface-edge-mid)"
    : accent || hov
      ? "var(--sw-accent)"
      : "var(--sw-text-muted)"
  const border = `1.5px solid ${accent || hov ? "var(--sw-accent-light)" : "var(--sw-surface-edge)"}`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => {
        if (!disabled) setHov(true)
      }}
      onMouseLeave={() => {
        setHov(false)
        setPress(false)
      }}
      onMouseDown={() => {
        if (!disabled) setPress(true)
      }}
      onMouseUp={() => setPress(false)}
      style={{
        flex: fullWidth ? undefined : 1,
        width: fullWidth ? "100%" : undefined,
        height: 42,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.38rem",
        fontFamily: "inherit",
        background: bg,
        color: col,
        border,
        borderRadius: "var(--sw-radius-sm)",
        cursor: disabled ? "default" : "pointer",
        transition:
          "background 0.12s, color 0.12s, border-color 0.12s, transform 0.1s",
        transform: press ? "scale(0.94)" : "scale(1)",
        lineHeight: 1,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          lineHeight: 1,
          fontSize: "1.5rem",
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{label}</span>
    </button>
  )
}

// ── Scroll control tile ───────────────────────────────────────────────────────

interface ScrollTileProps {
  label: string
  scrollPct: number // 0–100
  onScrollBy: (dir: 1 | -1) => void
  onScrollTop: () => void
}

function ScrollControlTile({
  label,
  scrollPct,
  onScrollBy,
  onScrollTop,
}: ScrollTileProps) {
  const filled = Math.round((scrollPct / 100) * SEGMENTS)
  const atTop = scrollPct <= 0
  const atBot = scrollPct >= 100
  const posLabel =
    scrollPct <= 0 ? "Top" : scrollPct >= 100 ? "Bottom" : `${scrollPct}%`

  return (
    <div
      data-panel-tour="scroll"
      style={{
        gridColumn: "span 2",
        padding: "0.85rem 0.9rem 0.75rem",
        background: "var(--sw-surface)",
        border: "1.5px solid var(--sw-surface-edge)",
        borderRadius: "var(--sw-radius)",
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
      }}
    >
      {/* Header row — icon, label, position */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            color: "var(--sw-text-muted)",
          }}
        >
          <ArrowsDownUp size={22} weight="bold" />
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--sw-text-muted)",
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: "1.05rem",
            fontWeight: 800,
            color: atTop || atBot ? "var(--sw-accent)" : "var(--sw-text-muted)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            minWidth: 56,
            textAlign: "right",
          }}
        >
          {posLabel}
        </span>
      </div>

      {/* Segmented progress bar — filled left→right shows how far down */}
      <div
        style={{
          display: "flex",
          gap: 3,
          alignItems: "center",
          height: 12,
          padding: "0 2px",
        }}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 3,
              background:
                i < filled
                  ? `hsl(${210 + i * 5}, 68%, ${52 - i * 1.5}%)`
                  : "var(--sw-surface-edge)",
              transition: "background 0.15s",
            }}
          />
        ))}
      </div>

      {/* ↑ Up / ↓ Down */}
      <div style={{ display: "flex", gap: 6 }}>
        <VolBtn
          icon="↑"
          label="UP"
          onClick={() => onScrollBy(-1)}
          disabled={atTop}
        />
        <VolBtn
          icon="↓"
          label="DOWN"
          onClick={() => onScrollBy(1)}
          disabled={atBot}
        />
      </div>

      {/* Back to Top */}
      <VolBtn
        icon={<ArrowLineUp size={15} weight="bold" />}
        label="BACK TO TOP"
        onClick={onScrollTop}
        disabled={atTop}
        fullWidth
      />
    </div>
  )
}

// SaveToast removed — FloatingToast (shared) is used instead.

// ── Admin drag row ────────────────────────────────────────────────────────────

interface AdminRowProps {
  id: string
  cfg: PanelButtonConfig
  isPrimary: boolean
  onLabelChange: (id: string, label: string) => void
  onVisibilityToggle: (id: string) => void
}

function AdminRow({
  id,
  cfg,
  isPrimary,
  onLabelChange,
  onVisibilityToggle,
}: AdminRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(cfg.label)

  const commit = () => {
    const val = draft.trim() || cfg.label
    setDraft(val)
    onLabelChange(id, val)
    setEditing(false)
  }

  return (
    <div
      data-id={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        background: cfg.visible ? "var(--sw-surface)" : "rgba(0,0,0,0.03)",
        border: "1.5px solid var(--sw-surface-edge)",
        borderRadius: "var(--sw-radius-sm)",
        opacity: cfg.visible ? 1 : 0.5,
        cursor: "grab",
      }}
    >
      <span
        style={{
          color: "var(--sw-text-subtle)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <DotsSixVertical size={16} weight="bold" />
      </span>

      <span
        style={{
          flexShrink: 0,
          color: isPrimary ? "var(--sw-accent)" : "var(--sw-text-muted)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {PHOSPHOR_SM[id]}
      </span>

      {editing ? (
        <input
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") setEditing(false)
          }}
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            minWidth: 0,
            border: "1.5px solid var(--sw-accent)",
            borderRadius: 5,
            padding: "2px 6px",
            outline: "none",
            background: "var(--sw-bg)",
            color: "var(--sw-text-muted)",
            fontFamily: "inherit",
          }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--sw-text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {cfg.label}
        </span>
      )}

      <button
        onClick={() => {
          setDraft(cfg.label)
          setEditing(true)
        }}
        title="Edit label"
        style={iconBtnStyle}
      >
        <PencilSimple size={14} weight="bold" />
      </button>

      <button
        onClick={() => onVisibilityToggle(id)}
        title={cfg.visible ? "Hide" : "Show"}
        style={iconBtnStyle}
      >
        {cfg.visible ? (
          <Eye size={14} weight="bold" />
        ) : (
          <EyeSlash size={14} weight="bold" />
        )}
      </button>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 4,
  cursor: "pointer",
  color: "var(--sw-text-muted)",
  display: "flex",
  alignItems: "center",
  borderRadius: 4,
  flexShrink: 0,
}

// ── Inline PIN entry ──────────────────────────────────────────────────────────

const PIN_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["⌫", "0"],
]

function PinEntry({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (digits.length !== 4 || shake) return
    ;(async () => {
      const config = await storage.local.get("config")
      if (digits.join("") === config.adminPin) {
        onSuccess()
      } else {
        setShake(true)
        setError("Wrong PIN")
        setTimeout(() => {
          setShake(false)
          setDigits([])
          setError("")
        }, 900)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9")
        setDigits((p) => (p.length < 4 ? [...p, e.key] : p))
      else if (e.key === "Backspace") {
        setDigits((p) => p.slice(0, -1))
        setError("")
      } else if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  const press = (key: string) => {
    if (shake) return
    if (key === "⌫") {
      setDigits((p) => p.slice(0, -1))
      setError("")
      return
    }
    setDigits((p) => (p.length < 4 ? [...p, key] : p))
  }

  return (
    <div
      style={{
        padding: "14px 10px 10px",
        background: "var(--sw-surface)",
        border: "1.5px solid var(--sw-surface-edge)",
        borderRadius: "var(--sw-radius)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
        animation: shake ? "sw-shake 0.42s ease" : "none",
      }}
    >
      <div
        style={{ fontSize: 13, fontWeight: 700, color: "var(--sw-text-muted)" }}
      >
        Enter PIN to edit panel
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 13,
              height: 13,
              borderRadius: "50%",
              background:
                digits.length > i
                  ? error
                    ? "var(--sw-accent)"
                    : "var(--sw-text-muted)"
                  : "transparent",
              border: `2px solid ${error ? "var(--sw-accent)" : digits.length > i ? "var(--sw-text-muted)" : "var(--sw-surface-edge)"}`,
              transition: "background 0.15s, border-color 0.15s",
            }}
          />
        ))}
      </div>

      {error && (
        <div
          style={{
            fontSize: 12,
            color: "var(--sw-accent)",
            fontWeight: 600,
            marginTop: -4,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          width: "100%",
        }}
      >
        {PIN_ROWS.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: "flex",
              gap: 4,
              justifyContent: row.length < 3 ? "center" : "stretch",
            }}
          >
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                disabled={shake}
                style={{
                  flex: row.length === 3 ? 1 : undefined,
                  width: row.length < 3 ? 58 : undefined,
                  height: 44,
                  fontSize: key === "⌫" ? "1rem" : "1.15rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  background: "var(--sw-bg)",
                  border: "1.5px solid var(--sw-surface-edge)",
                  borderRadius: 8,
                  cursor: shake ? "default" : "pointer",
                  color: "var(--sw-text-muted)",
                }}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={onCancel}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--sw-text-muted)",
          fontSize: 12,
          fontFamily: "inherit",
          fontWeight: 600,
        }}
      >
        Cancel
      </button>
    </div>
  )
}

// ── Panel spotlight tour ──────────────────────────────────────────────────────

const PANEL_PAD = 10 // extra padding around spotlit element (px)
const PANEL_GAP = 12 // gap between spotlight edge and tooltip card (px)
const PANEL_CARD_W = 254 // card width (fits ~300px panel with 24px total margin)
const PANEL_CARD_H_EST = 200 // initial estimate before we measure the real card

interface PanelTourStep {
  target: string | null // data-panel-tour attribute value, or null = centred card
  emoji: string
  title: string
  body: string
}

const PANEL_TOUR_STEPS: PanelTourStep[] = [
  {
    target: null,
    emoji: "👋",
    title: "Welcome to your helper panel!",
    body: "Here you'll find quick buttons to help you browse. Let me show you around!",
  },
  {
    target: "home",
    emoji: "🏠",
    title: "Go Home",
    body: "This big button takes you back to your start page any time you get lost.",
  },
  {
    target: "volume",
    emoji: "🔊",
    title: "Control the Volume",
    body: "Use this to turn sound louder, quieter, or mute it completely.",
  },
  {
    target: "scroll",
    emoji: "📜",
    title: "Scroll the Page",
    body: 'Move pages up or down. "Back to Top" jumps straight to the beginning.',
  },
  {
    target: "save",
    emoji: "🔖",
    title: "Save Pages You Like",
    body: "Tap this to save the page you're reading. Your caregiver will see all your saved pages.",
  },
  {
    target: null,
    emoji: "🎉",
    title: "You're all set!",
    body: "Tap any button to start browsing. Your caregiver can always help if you need anything.",
  },
]

// ── Tooltip card ──────────────────────────────────────────────────────────────

interface PanelCardProps {
  step: PanelTourStep
  stepIndex: number
  total: number
  isFirst: boolean
  isLast: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  /** Arrow direction: 'top' = arrow points up (card is below element). */
  arrowSide?: "top" | "bottom"
  /** Arrow tip x offset from the card's left edge (px). */
  arrowLeft?: number
  cardRef?: React.Ref<HTMLDivElement>
  style?: React.CSSProperties
}

function PanelTourCard({
  step,
  stepIndex,
  total,
  isFirst,
  isLast,
  onBack,
  onNext,
  onSkip,
  arrowSide,
  arrowLeft,
  cardRef,
  style,
}: PanelCardProps) {
  const arrowEl =
    arrowSide != null && arrowLeft != null ? (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: Math.max(14, Math.min(arrowLeft, PANEL_CARD_W - 40)),
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          ...(arrowSide === "top"
            ? { top: -12, borderBottom: "12px solid var(--sw-bg)" }
            : { bottom: -12, borderTop: "12px solid var(--sw-bg)" }),
        }}
      />
    ) : null

  return (
    <div
      ref={cardRef}
      style={{
        position: "relative",
        background: "var(--sw-bg)",
        border: "1.5px solid var(--sw-surface-edge)",
        borderRadius: "var(--sw-radius)",
        padding: "1.1rem",
        boxShadow: "0 8px 32px rgba(42,38,32,0.45)",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        textAlign: "center",
        ...style,
      }}
    >
      {arrowEl}

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              height: 6,
              width: i === stepIndex ? 20 : 6,
              borderRadius: 3,
              background:
                i === stepIndex ? "var(--sw-accent)" : "var(--sw-surface-edge)",
              transition: "width 0.2s ease, background 0.2s ease",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div>
        <div
          style={{ fontSize: "1.8rem", lineHeight: 1, marginBottom: "0.4rem" }}
        >
          {step.emoji}
        </div>
        <h2
          style={{
            margin: "0 0 0.35rem",
            fontSize: "1rem",
            fontWeight: 800,
            color: "var(--sw-text-muted)",
            lineHeight: 1.25,
          }}
        >
          {step.title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "var(--sw-text-muted)",
            lineHeight: 1.6,
          }}
        >
          {step.body}
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "0.4rem" }}>
        {isFirst && (
          <button
            type="button"
            onClick={onSkip}
            style={{
              padding: "0.55rem 0.8rem",
              background: "transparent",
              color: "var(--sw-text-subtle)",
              border: "1.5px solid var(--sw-surface-edge)",
              borderRadius: "var(--sw-radius-sm)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            Skip
          </button>
        )}
        {!isFirst && (
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: "0.55rem 0.8rem",
              background: "transparent",
              color: "var(--sw-text-muted)",
              border: "1.5px solid var(--sw-surface-edge)",
              borderRadius: "var(--sw-radius-sm)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          style={{
            flex: 1,
            padding: "0.55rem 0.8rem",
            background: "var(--sw-accent-btn)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--sw-radius-sm)",
            fontSize: "0.875rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {isLast ? "Got it! 👍" : "Next →"}
        </button>
      </div>
    </div>
  )
}

// ── Panel wizard — spotlight overlay via createPortal ─────────────────────────

function PanelWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null)
  const [cardH, setCardH] = useState(PANEL_CARD_H_EST)
  const cardRef = useRef<HTMLDivElement>(null)

  const current = PANEL_TOUR_STEPS[step]!
  const isFirst = step === 0
  const isLast = step === PANEL_TOUR_STEPS.length - 1

  // Signal the newtab page to show its "look at the panel" scrim
  useEffect(() => {
    chrome.storage.session.set({ panelTourActive: true }).catch(() => {})
    return () => {
      chrome.storage.session.set({ panelTourActive: false }).catch(() => {})
    }
  }, [])

  // Measure target element position before the browser paints
  useLayoutEffect(() => {
    if (!current.target) {
      setSpotRect(null)
      return
    }
    const el = document.querySelector<HTMLElement>(
      `[data-panel-tour="${current.target}"]`,
    )
    setSpotRect(el ? el.getBoundingClientRect() : null)
  }, [step, current.target])

  // Measure the rendered card height so we can decide above/below placement
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (cardRef.current) setCardH(cardRef.current.offsetHeight)
    })
    return () => cancelAnimationFrame(id)
  }, [step])

  const goNext = () => (isLast ? onDone() : setStep((s) => s + 1))
  const goBack = () => setStep((s) => s - 1)

  // ── Mode A: centred card (intro / outro — no specific target) ──────────────
  if (!spotRect) {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10200,
          background: "rgba(42,38,32,0.78)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <PanelTourCard
          cardRef={cardRef}
          step={current}
          stepIndex={step}
          total={PANEL_TOUR_STEPS.length}
          isFirst={isFirst}
          isLast={isLast}
          onBack={goBack}
          onNext={goNext}
          onSkip={onDone}
          style={{ width: "100%", maxWidth: PANEL_CARD_W }}
        />
      </div>,
      document.body,
    )
  }

  // ── Mode B: spotlight over a real panel element ────────────────────────────

  const sTop = spotRect.top - PANEL_PAD
  const sLeft = spotRect.left - PANEL_PAD
  const sW = spotRect.width + PANEL_PAD * 2
  const sH = spotRect.height + PANEL_PAD * 2

  const spaceBelow = window.innerHeight - (sTop + sH)
  const showAbove = spaceBelow < cardH + PANEL_GAP + 24

  const tooltipTop = showAbove
    ? sTop - PANEL_GAP - cardH
    : sTop + sH + PANEL_GAP

  const panelW = window.innerWidth
  const tooltipLeft = Math.max(
    8,
    Math.min(sLeft + sW / 2 - PANEL_CARD_W / 2, panelW - PANEL_CARD_W - 8),
  )
  const arrowLeft = sLeft + sW / 2 - tooltipLeft - 12

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10200,
        pointerEvents: "none",
      }}
    >
      {/* Full-screen click blocker — prevents accidental tile presses */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }} />

      {/* Spotlight cutout — box-shadow creates the dark veil, the div's bounds
          punch the transparent hole right over the target element */}
      <div
        style={{
          position: "absolute",
          top: sTop,
          left: sLeft,
          width: sW,
          height: sH,
          boxShadow: "0 0 0 9999px rgba(42,38,32,0.78)",
          borderRadius: 12,
          border: "2.5px solid rgba(194,94,42,0.65)",
          pointerEvents: "none",
          transition:
            "top    0.38s cubic-bezier(.4,0,.2,1)," +
            "left   0.38s cubic-bezier(.4,0,.2,1)," +
            "width  0.38s cubic-bezier(.4,0,.2,1)," +
            "height 0.38s cubic-bezier(.4,0,.2,1)",
        }}
      />

      {/* Tooltip card — slides alongside the spotlight */}
      <PanelTourCard
        cardRef={cardRef}
        step={current}
        stepIndex={step}
        total={PANEL_TOUR_STEPS.length}
        isFirst={isFirst}
        isLast={isLast}
        onBack={goBack}
        onNext={goNext}
        onSkip={onDone}
        arrowSide={showAbove ? "bottom" : "top"}
        arrowLeft={arrowLeft}
        style={{
          position: "absolute",
          top: tooltipTop,
          left: tooltipLeft,
          width: PANEL_CARD_W,
          maxWidth: "calc(100vw - 16px)",
          pointerEvents: "auto",
          transition:
            "top  0.38s cubic-bezier(.4,0,.2,1)," +
            "left 0.38s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>,
    document.body,
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export function App() {
  const [fontIdx, setFontIdx] = useState(0)
  const [volume, setVolume] = useState(1.0)
  const [scrollPct, setScrollPct] = useState(0)
  const { toast, showToast } = useToast()
  const [adminMode, setAdminMode] = useState(false)
  const [showPinEntry, setShowPinEntry] = useState(false)
  const [showPanelWizard, setShowPanelWizard] = useState(false)
  const [btnOrder, setBtnOrder] = useState([...DEFAULT_PANEL_BUTTON_ORDER])
  const [btnCfgs, setBtnCfgs] = useState<Record<string, PanelButtonConfig>>({
    ...DEFAULT_PANEL_BUTTONS,
  })

  const caregiverName = useRef("")
  const listRef = useRef<HTMLDivElement>(null)
  const sortableRef = useRef<Sortable | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const [session, config, isAdmin] = await Promise.all([
          storage.session.get("currentFontSize"),
          storage.local.get("config"),
          storage.session.get("adminModeActive"),
        ])
        caregiverName.current = config.caregiverName?.trim() ?? ""
        setAdminMode(!!isAdmin)
        // Only show panel wizard AFTER the newtab onboarding is done.
        // panelWizardDone guards against showing it a second time.
        if (config.onboardingDone && !config.panelWizardDone)
          setShowPanelWizard(true)
        const order = config.panelButtonOrder?.length
          ? config.panelButtonOrder
          : [...DEFAULT_PANEL_BUTTON_ORDER]
        setBtnOrder(order)
        setBtnCfgs({ ...DEFAULT_PANEL_BUTTONS, ...config.panelButtons })
        const active: FontSize = (session ?? config.defaultFontSize) as FontSize
        const idx = FONT_SIZES.indexOf(active)
        setFontIdx(idx >= 0 ? idx : 0)
      } catch {
        /* use defaults */
      }
    })()
  }, [])

  // ── Admin mode broadcast ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (msg: unknown) => {
      if (!msg || typeof msg !== "object" || !("type" in msg)) return
      const m = msg as { type: string; payload?: { active: boolean } }
      if (m.type === "ADMIN_MODE_CHANGED" && m.payload != null) {
        setAdminMode(m.payload.active)
        if (!m.payload.active) setShowPinEntry(false)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  // ── Watch for newtab onboarding completing while panel is already open ────
  // Needed because the panel may be open before the user finishes the wizard.
  useEffect(() => {
    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "local" || !("config" in changes)) return
      const cfg = changes["config"]?.newValue as
        | { onboardingDone?: boolean; panelWizardDone?: boolean }
        | undefined
      if (cfg?.onboardingDone && !cfg?.panelWizardDone) {
        setShowPanelWizard(true)
      }
    }
    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  }, [])

  // ── Dark theme — apply on load, keep in sync across tabs ────────────────
  useEffect(() => {
    storage.local
      .get("config")
      .then((cfg) => {
        const t = cfg.theme ?? "light"
        if (t === "dark") document.documentElement.classList.add("dark")
        else document.documentElement.classList.remove("dark")
      })
      .catch(() => {})

    const onThemeChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "local" || !("config" in changes)) return
      const next = (
        changes["config"]?.newValue as { theme?: string } | undefined
      )?.theme
      if (next === "dark") document.documentElement.classList.add("dark")
      else if (next === "light")
        document.documentElement.classList.remove("dark")
    }
    chrome.storage.onChanged.addListener(onThemeChange)
    return () => chrome.storage.onChanged.removeListener(onThemeChange)
  }, [])

  // ── SortableJS ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!adminMode || !listRef.current) {
      sortableRef.current?.destroy()
      sortableRef.current = null
      return
    }
    sortableRef.current = Sortable.create(listRef.current, {
      animation: 120,
      dataIdAttr: "data-id",
      onEnd: () => {
        const order = sortableRef.current!.toArray()
        setBtnOrder(order)
        void storage.local.update("config", { panelButtonOrder: order })
      },
    })
    return () => {
      sortableRef.current?.destroy()
      sortableRef.current = null
    }
  }, [adminMode])

  // ── Tab helper ───────────────────────────────────────────────────────────
  const getTab = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab ?? null
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleHome = useCallback(async () => {
    const tab = await getTab()
    if (tab?.id != null)
      await chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL("newtab/index.html"),
      })
  }, [getTab])

  const handleBack = useCallback(async () => {
    const tab = await getTab()
    if (tab?.id != null)
      await (chrome.tabs as unknown as { goBack(id: number): Promise<void> })
        .goBack(tab.id)
        .catch(() => {})
  }, [getTab])

  const handleForward = useCallback(async () => {
    const tab = await getTab()
    if (tab?.id != null)
      await (chrome.tabs as unknown as { goForward(id: number): Promise<void> })
        .goForward(tab.id)
        .catch(() => {})
  }, [getTab])

  const handleScrollTop = useCallback(async () => {
    const tab = await getTab()
    if (tab?.id != null) {
      chrome.tabs
        .sendMessage(tab.id, {
          type: "TAB_COMMAND",
          payload: { command: "scrollTop" },
        })
        .catch(() => {})
      setScrollPct(0) // optimistic — scroll to top resets position to 0
    }
  }, [getTab])

  const handleSetVolume = useCallback(
    async (level: number) => {
      setVolume(level)
      const tab = await getTab()
      if (tab?.id != null)
        chrome.tabs
          .sendMessage(tab.id, {
            type: "TAB_COMMAND",
            payload: { command: "setVolume", level },
          })
          .catch(() => {})
    },
    [getTab],
  )

  const handleScrollBy = useCallback(
    async (dir: 1 | -1) => {
      const tab = await getTab()
      if (tab?.id == null) return
      chrome.tabs.sendMessage(
        tab.id,
        { type: "TAB_COMMAND", payload: { command: "scrollBy", delta: dir } },
        (resp: { ok?: boolean; scrollPct?: number } | undefined) => {
          if (chrome.runtime.lastError) return
          if (resp != null && typeof resp.scrollPct === "number")
            setScrollPct(resp.scrollPct)
        },
      )
    },
    [getTab],
  )

  const refreshScrollPos = useCallback(async () => {
    const tab = await getTab()
    if (tab?.id == null) return
    chrome.tabs.sendMessage(
      tab.id,
      { type: "TAB_COMMAND", payload: { command: "getScrollPos" } },
      (resp: { ok?: boolean; scrollPct?: number } | undefined) => {
        if (chrome.runtime.lastError) return
        if (resp != null && typeof resp.scrollPct === "number")
          setScrollPct(resp.scrollPct)
      },
    )
  }, [getTab])

  const FONT_ZOOM: Record<FontSize, number> = {
    normal: 1,
    large: 1.25,
    xlarge: 1.5,
  }

  const handleZoom = useCallback(async () => {
    const nextIdx = (fontIdx + 1) % FONT_SIZES.length
    const next: FontSize = FONT_SIZES[nextIdx] ?? "normal"
    setFontIdx(nextIdx)
    await storage.session.set("currentFontSize", next)
    const tab = await getTab()
    if (tab?.id != null)
      await chrome.tabs.setZoom(tab.id, FONT_ZOOM[next]).catch(() => {})
  }, [fontIdx, getTab])

  const handleSave = useCallback(async () => {
    const tab = await getTab()
    if (!tab) return
    const url = tab.url ?? "",
      title = tab.title ?? url
    if (!url.startsWith("http")) {
      showToast("Can't save this page.", "error")
      return
    }
    const links = await storage.local.get("savedLinks")
    const existIdx = links.findIndex((l) => l.url === url)
    const entry = {
      id:
        existIdx >= 0
          ? (links[existIdx]?.id ?? crypto.randomUUID())
          : crypto.randomUUID(),
      url,
      title,
      savedAt: new Date().toISOString(),
    }
    const next =
      existIdx >= 0
        ? links.map((l, i) => (i === existIdx ? entry : l))
        : [...links, entry]
    await storage.local.set("savedLinks", next)
    showToast(
      `Saved! ${caregiverName.current || "Your caregiver"} will see this.`,
    )
  }, [getTab])

  const handleExit = useCallback(async () => {
    const tab = await getTab()
    if (tab?.id != null) await chrome.tabs.remove(tab.id)
  }, [getTab])

  // ── Admin mode ───────────────────────────────────────────────────────────
  // Optimistically update local state, then tell the SW so it writes session
  // storage and broadcasts ADMIN_MODE_CHANGED to all other extension views
  // (e.g. the newtab page), keeping both surfaces in sync from one PIN entry.
  const enterAdmin = useCallback(() => {
    setAdminMode(true)
    setShowPinEntry(false)
    chrome.runtime
      .sendMessage({ type: "SET_ADMIN_MODE", payload: { active: true } })
      .catch(() => {})
  }, [])

  const exitAdmin = useCallback(() => {
    setAdminMode(false)
    chrome.runtime
      .sendMessage({ type: "SET_ADMIN_MODE", payload: { active: false } })
      .catch(() => {})
  }, [])

  const handleLabelChange = useCallback((id: string, label: string) => {
    setBtnCfgs((prev) => {
      const base = prev[id] ??
        DEFAULT_PANEL_BUTTONS[id] ?? { label, visible: true }
      const next = { ...prev, [id]: { ...base, label } }
      void storage.local.update("config", { panelButtons: next })
      return next
    })
  }, [])

  const handleVisibility = useCallback((id: string) => {
    setBtnCfgs((prev) => {
      const cur = prev[id] ??
        DEFAULT_PANEL_BUTTONS[id] ?? { label: id, visible: true }
      const visCount = Object.values(prev).filter((c) => c.visible).length
      if (cur.visible && visCount <= 1) return prev
      const next = { ...prev, [id]: { ...cur, visible: !cur.visible } }
      void storage.local.update("config", { panelButtons: next })
      return next
    })
  }, [])

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentSize: FontSize = FONT_SIZES[fontIdx] ?? "normal"

  const visible = (id: string) => btnCfgs[id]?.visible ?? true
  const label = (id: string, fallback: string) => btnCfgs[id]?.label ?? fallback

  const handlers: Record<string, () => void> = {
    home: handleHome,
    back: handleBack,
    forward: handleForward,
    scrollTop: handleScrollTop,
    zoom: handleZoom,
    save: handleSave,
    exit: handleExit,
  }

  // ── Scroll position sync (must be after refreshScrollPos is declared) ────
  useEffect(() => {
    void refreshScrollPos()
  }, [refreshScrollPos])

  useEffect(() => {
    const onActivated = () => {
      void refreshScrollPos()
    }
    chrome.tabs.onActivated.addListener(onActivated)
    return () => chrome.tabs.onActivated.removeListener(onActivated)
  }, [refreshScrollPos])

  // `scroll` and `volume` are rendered as special tiles — not in handlers

  // Mid buttons (no home, no exit) in stored order, visible only
  const midIds = btnOrder.filter(
    (id) => id !== "home" && id !== "exit" && visible(id),
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--sw-bg)",
      }}
    >
      {/* Edit-mode banner */}
      {adminMode && (
        <div
          style={{
            padding: "10px 14px",
            flexShrink: 0,
            background: "var(--sw-accent-btn)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <span>Editing panel</span>
          <button
            onClick={exitAdmin}
            style={{
              background: "rgba(255,255,255,0.22)",
              border: "none",
              color: "inherit",
              borderRadius: 6,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.32)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.22)"
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* Scrollable area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {adminMode ? (
          /* ── Admin drag list ── */
          <div
            ref={listRef}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            {btnOrder.map((id) => (
              <AdminRow
                key={id}
                id={id}
                cfg={
                  btnCfgs[id] ??
                  DEFAULT_PANEL_BUTTONS[id] ?? { label: id, visible: true }
                }
                isPrimary={id === "home"}
                onLabelChange={handleLabelChange}
                onVisibilityToggle={handleVisibility}
              />
            ))}
          </div>
        ) : (
          /* ── Normal tile grid ── */
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {/* Home — full-width primary */}
            {visible("home") && (
              <Tile
                id="home"
                label={label("home", "HOME")}
                icon={<House size={28} weight="bold" />}
                onClick={handleHome}
                variant="primary"
                fullWidth
                tourTarget="home"
              />
            )}

            {/* Mid buttons fill the 2-col grid */}
            {midIds.map((id) => {
              if (id === "zoom") {
                return (
                  <ZoomTile
                    key={id}
                    label={label("zoom", "TEXT SIZE")}
                    currentSize={currentSize}
                    onClick={handleZoom}
                    disabled={false}
                  />
                )
              }
              if (id === "volume") {
                return (
                  <VolumeControlTile
                    key={id}
                    label={label("volume", "VOLUME")}
                    volume={volume}
                    onSet={handleSetVolume}
                  />
                )
              }
              if (id === "scroll") {
                return (
                  <ScrollControlTile
                    key={id}
                    label={label("scroll", "SCROLL")}
                    scrollPct={scrollPct}
                    onScrollBy={handleScrollBy}
                    onScrollTop={handleScrollTop}
                  />
                )
              }
              return (
                <Tile
                  key={id}
                  id={id}
                  label={label(id, id)}
                  icon={PHOSPHOR[id]}
                  onClick={handlers[id] ?? (() => {})}
                  tourTarget={id}
                />
              )
            })}

            {/* Spacer row to push exit to bottom */}
            <div style={{ gridColumn: "span 2", flex: 1 }} />

            {/* Exit — full-width danger at bottom */}
            {visible("exit") && (
              <Tile
                id="exit"
                label={label("exit", "CLOSE TAB")}
                icon={<XCircle size={28} weight="bold" />}
                onClick={handleExit}
                variant="danger"
                fullWidth
                tourTarget="exit"
              />
            )}
          </div>
        )}
      </div>

      {/* Floating toast — sits above everything */}
      <FloatingToast toast={toast} />

      {/* Panel spotlight wizard — portal-rendered so it overlays the real tiles */}
      {showPanelWizard && !adminMode && (
        <PanelWizard
          onDone={() => {
            setShowPanelWizard(false)
            void storage.local.update("config", { panelWizardDone: true })
            // Hand off to the newtab — start the senior walkthrough there next.
            chrome.storage.session
              .set({ seniorTourPending: true })
              .catch(() => {})
          }}
        />
      )}

      {/* Footer — Caregiver tools / PIN entry */}
      {!adminMode && (
        <div
          style={{
            padding: "8px 10px",
            flexShrink: 0,
            borderTop: "1px solid var(--sw-surface-edge)",
            background: "var(--sw-surface)",
          }}
        >
          {showPinEntry ? (
            <PinEntry
              onSuccess={enterAdmin}
              onCancel={() => setShowPinEntry(false)}
            />
          ) : (
            <button
              onClick={() => setShowPinEntry(true)}
              style={{
                width: "100%",
                padding: "9px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background: "transparent",
                border: "1.5px solid var(--sw-surface-edge)",
                borderRadius: "var(--sw-radius-sm)",
                cursor: "pointer",
                color: "var(--sw-text-muted)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                transition: "background 0.12s, color 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--sw-bg)"
                e.currentTarget.style.borderColor = "var(--sw-surface-edge-mid)"
                e.currentTarget.style.color = "var(--sw-text-muted)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.borderColor = "var(--sw-surface-edge)"
                e.currentTarget.style.color = "var(--sw-text-muted)"
              }}
            >
              <Lock size={14} weight="bold" />
              <span>Caregiver tools</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
