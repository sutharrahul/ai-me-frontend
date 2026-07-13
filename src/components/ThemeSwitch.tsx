"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { THEME_OPTIONS } from "./ThemeIcons";

// Collapsed to a single circle showing the active theme's icon. Clicking it
// smoothly widens the pill to the left - its right edge stays anchored
// because it's the last item in the header's `justify-between` row (see
// `page.tsx`), so growing its own width only extends leftward - revealing
// all three options. Closes back down on selection or an outside click.
export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const ActiveIcon =
    THEME_OPTIONS.find((option) => mounted && option.value === theme)?.icon ??
    THEME_OPTIONS[1].icon;

  return (
    <div
      ref={containerRef}
      className={`flex h-8 items-center justify-end gap-0.5 overflow-hidden rounded-full border border-neutral-200 bg-white transition-[width] duration-300 ease-in-out dark:border-white/10 dark:bg-white/5 ${
        open ? "w-22 p-1" : "w-8 p-0"
      }`}
    >
      {open ? (
        THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={`${label} theme`}
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={mounted ? `Theme: ${theme}` : "Theme"}
          aria-expanded={open}
          className="flex h-full w-full shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ActiveIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
