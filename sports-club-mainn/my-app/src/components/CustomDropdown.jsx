"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomDropdown({
  label,
  value,
  options,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>

      <button
        onClick={() => setOpen(!open)}
        className="mt-2 w-full flex justify-between items-center border rounded-xl px-4 py-3 bg-white dark:bg-gray-800 dark:border-gray-700 transition"
      >
        <span>{value}</span>
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`absolute z-20 mt-2 w-full rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden transition-all duration-300 origin-top
          ${
            open
              ? "scale-y-100 opacity-100"
              : "scale-y-95 opacity-0 pointer-events-none"
          }`}
      >
        {options.map((option) => (
          <div
            key={option}
            onClick={() => {
              onChange(option);
              setOpen(false);
            }}
            className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition"
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
}