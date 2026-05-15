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
    <div ref={ref} className={"relative ${className}"}>
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-full min-h-[44px] px-3.5 rounded-[14px] text-[13px] font-bold text-left flex items-center justify-between cursor-pointer outline-none transition-all shadow-sm"
        style={{ 
          background: open ? "#f8fafc" : "#ffffff", 
          color: selected ? "#0f172a" : "#64748b",
          border: open ? "1px solid #c7d2fe" : "1px solid #e2e8f0" 
        }}
        whileTap={{ scale: 0.99 }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className={"${open ? 'text-indigo-500' : 'text-slate-400'}"} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-1.5 rounded-[16px] overflow-hidden z-50 bg-white border border-slate-200/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]"
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
          >
            <div className="max-h-60 overflow-y-auto py-1.5 custom-scrollbar">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={"w-full px-4 py-3 text-[13px] font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/80 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'}"}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="text-indigo-600 shrink-0" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
