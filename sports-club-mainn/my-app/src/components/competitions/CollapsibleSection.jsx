"use client";

import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

// A section whose body collapses/expands when the header is clicked. Expanded by
// default. `title` is the header content (icon + text); `right` is optional
// content rendered on the right of the header (e.g. a legend/count).
export default function CollapsibleSection({
  title,
  right = null,
  defaultOpen = true,
  className = "",
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`bg-slate-900/50 rounded-2xl border border-slate-800 ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 group"
      >
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2 group-hover:text-white transition-colors">
          {title}
        </h2>
        <span className="flex items-center gap-3">
          {right}
          <FiChevronDown
            className={`text-slate-500 group-hover:text-slate-300 transition-all ${open ? "rotate-180" : ""}`}
            size={18}
          />
        </span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}
