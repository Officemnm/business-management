"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Lock, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
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
    <div className="min-h-screen relative flex items-center justify-center px-5 py-10 overflow-hidden bg-slate-50">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse pointer-events-none bg-indigo-200"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none bg-blue-200"></div>

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
            className="mb-5 flex items-center justify-center"
          >
            <Image
              src="/logo.svg"
              alt="ভ্যারাইটিজ কসমেটিক্স"
              width={90}
              height={90}
              className="object-contain drop-shadow-sm"
              priority
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-bold tracking-tight mb-2 text-slate-900"
          >
            স্বাগতম ফিরে এসেছেন
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm font-medium text-slate-500"
          >
            আপনার প্যানেলে প্রবেশ করতে তথ্য দিন
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-[24px] p-8 backdrop-blur-xl bg-white shadow-sm border border-slate-200/60"
        >
          <form onSubmit={handleLogin}>
            {/* Username */}
            <div className="mb-5">
              <label className="block text-[13px] font-bold text-slate-600 tracking-wide mb-2 ml-1">
                ইউজারনেম
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 ${focusedField === "username" ? "text-indigo-600" : "text-slate-400"}`}>
                  <User size={18} strokeWidth={focusedField === "username" ? 2 : 1.5} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="আপনার ইউজারনেম লিখুন"
                  className={`w-full h-12 pl-12 pr-4 rounded-[12px] text-[15px] outline-none transition-all duration-300 bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:bg-white ${
                    focusedField === "username" 
                      ? "border-indigo-400 ring-4 ring-indigo-50" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-8">
              <div className="mb-2 ml-1">
                <label className="text-[13px] font-bold text-slate-600 tracking-wide">
                  পাসওয়ার্ড
                </label>
              </div>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 ${focusedField === "password" ? "text-indigo-600" : "text-slate-400"}`}>
                  <Lock size={18} strokeWidth={focusedField === "password" ? 2 : 1.5} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className={`w-full h-12 pl-12 pr-12 rounded-[12px] text-[15px] outline-none transition-all duration-300 bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:bg-white ${
                    focusedField === "password" 
                      ? "border-indigo-400 ring-4 ring-indigo-50" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
              className="w-full h-12 rounded-[12px] text-[15px] font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-white" />
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
          className="text-center text-[12px] mt-10 font-bold tracking-wide text-slate-400"
        >
          © {new Date().getFullYear()} ভ্যারাইটিজ কসমেটিক্স • সর্বস্বত্ব সংরক্ষিত
        </motion.p>
      </motion.div>
    </div>
  );
}
