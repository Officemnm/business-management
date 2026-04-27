"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Lock, User, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/* ── Variants ── */
const cardAnim: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
  },
};
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
  },
};

/* ── Main page ── */
export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [errors, setErrors] = useState({ username: "", password: "", general: "" });
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const validate = () => {
    const e = { username: "", password: "", general: "" };
    let ok = true;
    if (!form.username) { e.username = "ব্যবহারকারীর নাম প্রয়োজন"; ok = false; }
    if (!form.password) { e.password = "পাসওয়ার্ড প্রয়োজন"; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (form.username === "admin" && form.password === "1234") {
        router.push("/dashboard");
      } else {
        setIsLoading(false);
        setErrors(p => ({ ...p, general: "ব্যবহারকারীর নাম বা পাসওয়ার্ড ভুল হয়েছে।" }));
      }
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (errors[name as keyof typeof errors])
      setErrors(p => ({ ...p, [name]: "", general: "" }));
  };

  return (
    <div className="page-wrap">
      {/* ── Card ── */}
      <motion.div
        variants={cardAnim}
        initial="hidden"
        animate="visible"
        className="card"
      >
        {/* Logo image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}
        >
          <Image
            src="/logo.png"
            alt="ভ্যারাইটিজ কসমেটিক্স লোগো"
            width={180}
            height={140}
            priority
            style={{ objectFit: "contain", width: "auto", height: "auto", maxWidth: 200, maxHeight: 140 }}
          />
        </motion.div>

        {/* Tagline */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ textAlign: "center", marginBottom: 16 }}
        >
          <motion.p variants={fadeUp} style={{
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            letterSpacing: "0.02em",
          }}>
            আপনার অ্যাকাউন্টে প্রবেশ করুন
          </motion.p>
        </motion.div>

        {/* ── Form ── */}
        <motion.form
          onSubmit={handleSubmit}
          noValidate
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* General error */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                key="general-err"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: "rgba(185,28,28,0.07)",
                  border: "1px solid rgba(185,28,28,0.18)",
                  borderRadius: 3,
                  padding: "9px 12px",
                  marginBottom: 16,
                  fontSize: "0.78rem",
                  color: "var(--error)",
                  letterSpacing: "0.01em",
                  textAlign: "center",
                }}
              >
                {errors.general}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Username */}
          <motion.div variants={fadeUp} style={{ marginBottom: 18 }}>
            <label htmlFor="username" className="lbl">ব্যবহারকারীর নাম</label>
            <div className="field-wrap">
              <span className="field-icon"><User size={14} /></span>
              <input
                id="username" name="username" type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                placeholder="admin"
                className={`field${errors.username ? " err" : ""}`}
              />
            </div>
            <AnimatePresence>
              {errors.username && (
                <motion.p key="un"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="err-txt">{errors.username}</motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password */}
          <motion.div variants={fadeUp} style={{ marginBottom: 18 }}>
            <label htmlFor="password" className="lbl">পাসওয়ার্ড</label>
            <div className="field-wrap">
              <span className="field-icon"><Lock size={14} /></span>
              <input
                id="password" name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`field field-pr${errors.password ? " err" : ""}`}
              />
              <button
                type="button" className="eye-btn"
                aria-label={showPw ? "লুকান" : "দেখান"}
                onClick={() => setShowPw(p => !p)}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p key="pw"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="err-txt">{errors.password}</motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Remember */}
          <motion.div variants={fadeUp}
            style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22 }}
          >
            <input
              id="remember" name="remember" type="checkbox"
              checked={form.remember} onChange={handleChange}
              className="cb"
            />
            <label htmlFor="remember" style={{
              fontSize: "0.78rem", color: "var(--text-muted)",
              cursor: "pointer", userSelect: "none", letterSpacing: "0.02em",
            }}>
              আমাকে মনে রাখুন
            </label>
          </motion.div>

          {/* Submit */}
          <motion.div variants={fadeUp}>
            <motion.button
              type="submit" disabled={isLoading} className="btn"
              whileHover={!isLoading ? { scale: 1.012 } : {}}
              whileTap={!isLoading ? { scale: 0.990 } : {}}
            >
              {isLoading ? (
                <><span className="spinner" />যাচাই করা হচ্ছে...</>
              ) : (
                <>লগইন করুন<ArrowRight size={14} /></>
              )}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="footer"
      >
        <p>&copy; {new Date().getFullYear()} ভ্যারাইটিজ কসমেটিক্স</p>
        <p>Developed by <strong>Mehedi Hasan</strong></p>
      </motion.footer>
    </div>
  );
}
