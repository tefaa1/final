"use client";

import React, { useEffect } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

// In-app confirmation modal — a proper replacement for window.confirm. Renders a
// dark-slate dialog over a dimmed backdrop. `open` controls visibility; `onCancel`
// fires on backdrop click / Esc / Cancel; `onConfirm` runs the destructive action.
// `busy` disables the buttons while the action is in flight.
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* backdrop */}
      <button
        aria-hidden
        tabIndex={-1}
        onClick={() => !busy && onCancel?.()}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm cursor-default"
      />
      {/* dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 fade-in">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600" />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <FiAlertTriangle size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-black text-white tracking-tight">{title}</h3>
              {message && (
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{message}</p>
              )}
            </div>
            <button
              onClick={() => !busy && onCancel?.()}
              disabled={busy}
              className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
              title="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              onClick={() => !busy && onCancel?.()}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-rose-500/50 bg-rose-500/15 text-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-400 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {busy ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
