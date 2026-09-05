/**
 * Dropdown menu with trigger and items.
 * Click to open/close, click outside to close.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  children?: ReactNode;
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  align = "right",
  children,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="focus:outline-none"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-56 bg-white rounded-xl border border-neutral-200",
            "shadow-lg py-1",
            align === "right" ? "right-0" : "left-0"
          )}
          role="menu"
        >
          {children}
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && (
                <div className="my-1 border-t border-neutral-100" />
              )}
              <button
                className={cn(
                  "w-full text-left px-4 py-2 text-sm flex items-center gap-2.5",
                  "transition-colors duration-100",
                  item.danger
                    ? "text-danger-600 hover:bg-danger-50"
                    : "text-neutral-700 hover:bg-neutral-50"
                )}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                role="menuitem"
              >
                {item.icon && (
                  <span className="shrink-0 text-neutral-400">{item.icon}</span>
                )}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
