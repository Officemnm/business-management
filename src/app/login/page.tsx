"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Lock, Loader2, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen relative flex items-center justify-center px-5 py-10 overflow-hidden bg-[var(--bg-primary)]">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse pointer-events-none" style={{ background: "var(--accent)" }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none" style={{ background: "#4ade80" }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5 p-3 rounded-2xl bg-white shadow-xl shadow-[var(--accent)]/10 ring-1 ring-black/5"
          >
            <Image
              src="/logo.png"
              alt="ভ্যারাইটিজ কসমেটিক্স"
              width={70}
              height={70}
              className="object-contain"
              priority
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-bold tracking-tight mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            স্বাগতম ফিরে এসেছেন
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            আপনার প্যানেলে প্রবেশ করতে তথ্য দিন
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-[24px] p-8 backdrop-blur-xl bg-white/80"
          style={{
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), 0 0 20px rgba(102,168,15,0.05)",
          }}
        >
          <form onSubmit={handleLogin}>
            {/* Username */}
            <div className="mb-5">
              <label
                className="block text-[13px] font-semibold mb-2 ml-1"
                style={{ color: "var(--text-secondary)" }}
              >
                ইউজারনেম
              </label>
              <div className="relative group">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300"
                  style={{
                    color: focusedField === "username" ? "var(--accent)" : "var(--text-placeholder)",
                  }}
                >
                  <User size={18} strokeWidth={focusedField === "username" ? 2 : 1.5} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="আপনার ইউজারনেম লিখুন"
                  className="w-full h-12 pl-12 pr-4 rounded-xl text-[15px] outline-none transition-all duration-300 bg-white/50 hover:bg-white focus:bg-white"
                  style={{
                    color: "var(--text-primary)",
                    border: `1.5px solid ${focusedField === "username" ? "var(--accent)" : "var(--border-color)"}`,
                    boxShadow: focusedField === "username" ? "0 0 0 4px rgba(102,168,15,0.1)" : "none",
                  }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-8">
              <div className="mb-2 ml-1">
                <label
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  পাসওয়ার্ড
                </label>
              </div>
              <div className="relative group">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300"
                  style={{
                    color: focusedField === "password" ? "var(--accent)" : "var(--text-placeholder)",
                  }}
                >
                  <Lock size={18} strokeWidth={focusedField === "password" ? 2 : 1.5} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full h-12 pl-12 pr-12 rounded-xl text-[15px] outline-none transition-all duration-300 bg-white/50 hover:bg-white focus:bg-white"
                  style={{
                    color: "var(--text-primary)",
                    border: `1.5px solid ${focusedField === "password" ? "var(--accent)" : "var(--border-color)"}`,
                    boxShadow: focusedField === "password" ? "0 0 0 4px rgba(102,168,15,0.1)" : "none",
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={showPassword ? "hide" : "show"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showPassword ? (
                        <EyeOff size={18} strokeWidth={1.5} />
                      ) : (
                        <Eye size={18} strokeWidth={1.5} />
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
              className="w-full h-12 rounded-xl text-[15px] font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
              style={{ 
                background: "linear-gradient(to right, var(--accent), #7ed013)",
                boxShadow: "0 4px 14px rgba(102,168,15,0.4)"
              }}
              whileHover={{ 
                scale: 1.01,
                boxShadow: "0 6px 20px rgba(102,168,15,0.5)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  সাইন ইন করুন
                  <ArrowRight size={18} strokeWidth={2} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-[12px] mt-10 font-medium tracking-wide"
          style={{ color: "var(--text-placeholder)" }}
        >
          © {new Date().getFullYear()} ভ্যারাইটিজ কসমেটিক্স • সর্বস্বত্ব সংরক্ষিত
        </motion.p>
      </motion.div>
    </div>
  );
}
