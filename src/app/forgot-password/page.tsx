"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Loader2, ArrowLeft, KeyRound, CheckCircle2, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"username" | "reset" | "success">("username");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleVerifyUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("ইউজারনেম লিখুন");
      return;
    }
    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error("নতুন পাসওয়ার্ড লিখুন");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("পাসওয়ার্ড মিলছে না");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে");
        return;
      }

      setStep("success");
      toast.success("পাসওয়ার্ড রিসেট সফল!");
    } catch {
      toast.error("কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field: string) => ({
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    border: `1.5px solid ${focusedField === field ? "#66a80f" : "var(--border-color)"}`,
    boxShadow: focusedField === field ? "0 0 0 3px rgba(102,168,15,0.1)" : "none",
  });

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
          />

          <h1
            className="text-[22px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {step === "success" ? "সম্পন্ন!" : "পাসওয়ার্ড রিসেট"}
          </h1>

          <p
            className="text-sm mt-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            {step === "username" && "ইউজারনেম লিখে এগিয়ে যান"}
            {step === "reset" && "নতুন পাসওয়ার্ড তৈরি করুন"}
            {step === "success" && "আপনার পাসওয়ার্ড পরিবর্তন হয়েছে"}
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
          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === "username" && (
              <motion.form
                key="username"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleVerifyUsername}
              >
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
                      style={inputStyle("username")}
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center cursor-pointer"
                  style={{ background: "#66a80f" }}
                  whileHover={{ background: "#5c940d" }}
                  whileTap={{ scale: 0.98 }}
                >
                  এগিয়ে যান
                </motion.button>
              </motion.form>
            )}

            {/* Step 2 */}
            {step === "reset" && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleResetPassword}
              >
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm mb-5"
                  style={{
                    background: "var(--bg-input)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <User size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                  {username}
                </div>

                <div className="mb-5">
                  <label
                    className="block text-[12px] font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    নতুন পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        color: focusedField === "newPassword" ? "#66a80f" : "var(--text-muted)",
                      }}
                    >
                      <Lock size={16} strokeWidth={1.5} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setFocusedField("newPassword")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="নতুন পাসওয়ার্ড লিখুন"
                      className="w-full h-11 pl-10 pr-11 rounded-xl text-sm outline-none transition-all duration-150"
                      style={inputStyle("newPassword")}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    className="block text-[12px] font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    পাসওয়ার্ড নিশ্চিত করুন
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        color: focusedField === "confirmPassword" ? "#66a80f" : "var(--text-muted)",
                      }}
                    >
                      <Lock size={16} strokeWidth={1.5} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="পাসওয়ার্ড আবার লিখুন"
                      className="w-full h-11 pl-10 pr-11 rounded-xl text-sm outline-none transition-all duration-150"
                      style={inputStyle("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setStep("username")}
                    className="h-11 px-5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{
                      background: "var(--bg-input)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft size={15} strokeWidth={1.5} />
                    পিছনে
                  </motion.button>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#66a80f" }}
                    whileHover={{ background: "#5c940d" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "রিসেট করুন"
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
                  style={{ background: "rgba(102, 168, 15, 0.1)" }}
                >
                  <CheckCircle2
                    size={26}
                    style={{ color: "#66a80f" }}
                    strokeWidth={1.5}
                  />
                </motion.div>
                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  এখন নতুন পাসওয়ার্ড দিয়ে সাইন ইন করতে পারবেন।
                </p>
                <Link href="/login">
                  <motion.button
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center cursor-pointer"
                    style={{ background: "#66a80f" }}
                    whileHover={{ background: "#5c940d" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    সাইন ইন এ ফিরে যান
                  </motion.button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to login */}
        {step !== "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-center mt-6"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
              সাইন ইন এ ফিরে যান
            </Link>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-[11px] mt-8"
          style={{ color: "var(--text-muted)" }}
        >
          © {new Date().getFullYear()} ভ্যারাইটিজ কসমেটিক্স
        </motion.p>
      </motion.div>
    </div>
  );
}
