// ─────────────────────────────────────────────────────────────────────────────
// CLEAN SINGLE-CARD DRAG GHOST
//
// The native HTML5 drag image, by default, is a screenshot of the dragged DOM
// node. On the lineup pitch that node sits inside the pitch container, so some
// browsers ended up capturing the whole board (all the player photos) as the
// drag ghost. To guarantee the user only ever sees the ONE player being dragged
// we build a tiny detached element (a single round photo + the player's name),
// hand it to dataTransfer.setDragImage(), and remove it on the next tick.
//
// Returns nothing; safe to call from any onDragStart handler.
// ─────────────────────────────────────────────────────────────────────────────

const GHOST_ID = "__lineup-drag-ghost__";

export function setPlayerDragImage(e, { photoUrl, name } = {}) {
  if (typeof document === "undefined" || !e?.dataTransfer) return;

  // Remove any stale ghost first.
  document.getElementById(GHOST_ID)?.remove();

  const ghost = document.createElement("div");
  ghost.id = GHOST_ID;
  ghost.style.cssText = [
    "position:fixed",
    "top:-1000px",        // keep it off-screen so it never flashes in place
    "left:-1000px",
    "z-index:99999",
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "gap:4px",
    "padding:6px 10px",
    "border-radius:14px",
    "background:rgba(2,6,23,0.92)",
    "border:1px solid rgba(16,185,129,0.5)",
    "box-shadow:0 10px 30px rgba(0,0,0,0.55)",
    "pointer-events:none",
    "font-family:inherit",
  ].join(";");

  const last = String(name || "").trim().split(/\s+/).slice(-1)[0] || "Player";
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PL";

  // Round photo (or initials fallback).
  if (photoUrl) {
    const img = document.createElement("img");
    img.src = photoUrl;
    img.crossOrigin = "anonymous";
    img.style.cssText =
      "width:52px;height:52px;border-radius:9999px;object-fit:cover;border:2px solid rgba(255,255,255,0.85);background:#0f172a";
    ghost.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.textContent = initials;
    fallback.style.cssText =
      "width:52px;height:52px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;border:2px solid rgba(255,255,255,0.85);background:linear-gradient(135deg,#0a1a3f,#3b0a2a)";
    ghost.appendChild(fallback);
  }

  const label = document.createElement("span");
  label.textContent = last;
  label.style.cssText =
    "font-size:11px;font-weight:900;color:#fff;background:rgba(2,6,23,0.85);padding:1px 6px;border-radius:6px;white-space:nowrap";
  ghost.appendChild(label);

  document.body.appendChild(ghost);

  try {
    // Anchor the ghost under the cursor (centre of the photo).
    e.dataTransfer.setDragImage(ghost, 32, 30);
  } catch {
    /* setDragImage unsupported — native ghost is acceptable */
  }

  // Clean up after the drag image has been snapshotted.
  setTimeout(() => document.getElementById(GHOST_ID)?.remove(), 0);
}
