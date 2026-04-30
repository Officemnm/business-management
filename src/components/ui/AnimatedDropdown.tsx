"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AnimatedDropdown({ options, value, onChange, placeholder = "নির্বাচন করুন", className = "" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3 rounded-lg text-sm text-left flex items-center justify-between cursor-pointer outline-none"
        style={{ background: "var(--bg-input)", color: selected ? "var(--text-primary)" : "var(--text-placeholder)", border: open ? "1.5px solid #66a80f" : "1px solid var(--border-color)" }}
        whileTap={{ scale: 0.99 }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 12px 28px rgba(0,0,0,0.12)" }}
            initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style-origin="top"
          >
            <div className="max-h-52 overflow-y-auto py-1">
              {options.map((opt, i) => (
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full px-3 py-2.5 text-[13px] text-left flex items-center justify-between cursor-pointer"
                  style={{
                    color: opt.value === value ? "#66a80f" : "var(--text-primary)",
                    background: opt.value === value ? "rgba(102, 168, 15, 0.06)" : "transparent",
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ background: "var(--bg-input)" }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Check size={14} style={{ color: "#66a80f" }} />}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
