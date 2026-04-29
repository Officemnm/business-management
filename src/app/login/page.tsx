"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("সকল ফিল্ড পূরণ করুন");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "লগইন ব্যর্থ হয়েছে");
        return;
      }

      toast.success("স্বাগতম!");
      router.push("/dashboard");
    } catch {
      toast.error("কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px]"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="ভ্যারাইটিজ কসমেটিক্স"
            width={80}
            height={80}
            className="mb-4"
            priority
          />

          <h1
            className="text-[22px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            সাইন ইন করুন
          </h1>

          <p
            className="text-sm mt-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            আপনার অ্যাকাউন্টে প্রবেশ করুন
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          <form onSubmit={handleLogin}>
            {/* Username */}
            <div className="mb-5">
              <label
                className="block text-[12px] font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                ইউজারনেম
              </label>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    color: focusedField === "username" ? "#66a80f" : "var(--text-muted)",
                  }}
                >
                  <User size={16} strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="ইউজারনেম লিখুন"
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none transition-all duration-150"
                  style={{
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    border: `1.5px solid ${focusedField === "username" ? "#66a80f" : "var(--border-color)"}`,
                    boxShadow: focusedField === "username" ? "0 0 0 3px rgba(102,168,15,0.1)" : "none",
                  }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-[12px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  পাসওয়ার্ড
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium hover:underline"
                  style={{ color: "#66a80f" }}
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    color: focusedField === "password" ? "#66a80f" : "var(--text-muted)",
                  }}
                >
                  <Lock size={16} strokeWidth={1.5} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="পাসওয়ার্ড লিখুন"
                  className="w-full h-11 pl-10 pr-11 rounded-xl text-sm outline-none transition-all duration-150"
                  style={{
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    border: `1.5px solid ${focusedField === "password" ? "#66a80f" : "var(--border-color)"}`,
                    boxShadow: focusedField === "password" ? "0 0 0 3px rgba(102,168,15,0.1)" : "none",
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={showPassword ? "hide" : "show"}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.12 }}
                    >
                      {showPassword ? (
                        <EyeOff size={16} strokeWidth={1.5} />
                      ) : (
                        <Eye size={16} strokeWidth={1.5} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </button>
              </div>
            </div>

            {/* Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#66a80f" }}
              whileHover={{ background: "#5c940d" }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "সাইন ইন"
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center text-[11px] mt-8"
          style={{ color: "var(--text-muted)" }}
        >
          © {new Date().getFullYear()} ভ্যারাইটিজ কসমেটিক্স
        </motion.p>
      </motion.div>
    </div>
  );
}
