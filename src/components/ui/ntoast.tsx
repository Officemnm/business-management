"use client";

import toast from "react-hot-toast";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

const iconMap = {
  success: { icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
  error: { icon: XCircle, color: "#dc2626", bg: "#fef2f2" },
  warning: { icon: AlertTriangle, color: "#d97706", bg: "#fffbeb" },
  info: { icon: Info, color: "#2563eb", bg: "#eff6ff" },
};

type ToastType = keyof typeof iconMap;

function showToast(message: string, type: ToastType = "success") {
  const { icon: Icon, color, bg } = iconMap[type];

  toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
          t.visible ? "animate-toast-in" : "animate-toast-out"
        }`}
        style={{
          background: "var(--bg-card, #ffffff)",
          border: "1px solid var(--border-color, #e5e5e5)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          maxWidth: 360,
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-[13px] font-medium flex-1" style={{ color: "var(--text-primary, #1c1917)" }}>
          {message}
        </p>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-[10px] px-2 py-1 rounded-md cursor-pointer shrink-0"
          style={{ color: "var(--text-muted, #999)", background: "var(--bg-input, #f5f5f4)" }}
        >
          ✕
        </button>
      </div>
    ),
    { duration: 3000 }
  );
}

export const ntoast = {
  success: (msg: string) => showToast(msg, "success"),
  error: (msg: string) => showToast(msg, "error"),
  warning: (msg: string) => showToast(msg, "warning"),
  info: (msg: string) => showToast(msg, "info"),
};
