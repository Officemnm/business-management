"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { UserPlus, Trash2, X, User, Lock, Shield, CheckCircle, AlertCircle } from "lucide-react";

interface UserRecord {
  _id: string;
  username: string;
  role: "manager" | "asr";
  displayName: string;
  createdAt: string;
  active: boolean;
}

const ROLE_LABEL: Record<string, string> = { manager: "ম্যানেজার", asr: "ASR" };
const ROLE_COLOR: Record<string, string> = { manager: "#2563eb", asr: "#059669" };

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ username: "", password: "", displayName: "", role: "manager" });
  const [formErr, setFormErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) { const d = await res.json(); setUsers(d.users); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr("");
    if (!form.username || !form.password || !form.displayName) { setFormErr("সব ঘর পূরণ করুন।"); return; }
    setSubmitting(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setFormErr(data.error); return; }
    setShowModal(false);
    setForm({ username: "", password: "", displayName: "", role: "manager" });
    fetchUsers();
    showToast("ব্যবহারকারী সফলভাবে তৈরি হয়েছে!", true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" মুছে ফেলবেন?`)) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    fetchUsers();
    showToast(`"${name}" মুছে ফেলা হয়েছে।`, true);
  };

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
            style={{ position: "fixed", top: 72, right: 20, zIndex: 200, display: "flex", alignItems: "center", gap: 8,
              background: toast.ok ? "#ecfdf5" : "#fef2f2", border: `1px solid ${toast.ok ? "#6ee7b7" : "#fca5a5"}`,
              color: toast.ok ? "#059669" : "#dc2626", padding: "10px 16px", borderRadius: 10,
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)", fontSize: "0.82rem" }}>
            {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a0f14", margin: 0 }}>ব্যবহারকারী ব্যবস্থাপনা</h2>
          <p style={{ fontSize: "0.72rem", color: "#8a7078", marginTop: 3 }}>ম্যানেজার ও ASR অ্যাকাউন্ট তৈরি করুন</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#8b3a5a,#d4899f)",
            color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: "0.82rem",
            fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(139,58,90,0.30)" }}>
          <UserPlus size={15} /> নতুন ব্যবহারকারী
        </motion.button>
      </div>

      {/* User List */}
      <div style={{ background: "rgba(255,253,251,0.97)", borderRadius: 12, border: "1px solid rgba(235,220,225,0.80)",
        boxShadow: "0 2px 12px rgba(26,15,20,0.05)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#8a7078", fontSize: "0.82rem" }}>লোড হচ্ছে...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <User size={32} color="#d4899f" style={{ margin: "0 auto 10px" }} />
            <p style={{ color: "#8a7078", fontSize: "0.82rem" }}>এখনো কোনো ব্যবহারকারী নেই।</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(139,58,90,0.08)", background: "rgba(139,58,90,0.03)" }}>
                {["নাম", "ইউজারনেম", "ভূমিকা", "তৈরির তারিখ", "অ্যাকশন"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.63rem",
                    color: "#8a7078", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr key={u._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }} whileHover={{ backgroundColor: "rgba(139,58,90,0.025)" }}
                  style={{ borderBottom: "1px solid rgba(139,58,90,0.04)" }}>
                  <td style={{ padding: "12px 16px", fontSize: "0.80rem", color: "#1a0f14", fontWeight: 600 }}>{u.displayName}</td>
                  <td style={{ padding: "12px 16px", fontSize: "0.78rem", color: "#3d2e35" }}>{u.username}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.68rem",
                      color: ROLE_COLOR[u.role], background: `${ROLE_COLOR[u.role]}14`,
                      padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                      <Shield size={11} /> {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "0.72rem", color: "#8a7078" }}>
                    {new Date(u.createdAt).toLocaleDateString("bn-BD")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <motion.button whileHover={{ scale: 1.10 }} whileTap={{ scale: 0.93 }}
                      onClick={() => handleDelete(u._id, u.displayName)}
                      style={{ background: "rgba(220,38,38,0.08)", border: "none", borderRadius: 8,
                        padding: "6px 8px", cursor: "pointer", color: "#dc2626", display: "flex" }}>
                      <Trash2 size={14} />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(26,15,20,0.45)", backdropFilter: "blur(4px)", padding: "16px", overflowY: "auto" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "#fff", borderRadius: 16, padding: "24px 22px",
                width: "min(100%, 420px)", maxHeight: "calc(100vh - 32px)", overflowY: "auto",
                boxShadow: "0 20px 60px rgba(26,15,20,0.18), 0 4px 16px rgba(139,58,90,0.12)",
                margin: "auto", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#8b3a5a,#d4899f)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <UserPlus size={16} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a0f14" }}>নতুন ব্যবহারকারী</div>
                    <div style={{ fontSize: "0.68rem", color: "#8a7078" }}>অ্যাকাউন্ট তৈরি করুন</div>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a7078", display: "flex", padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate}>
                {formErr && (
                  <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)",
                    borderRadius: 8, padding: "9px 12px", marginBottom: 16, fontSize: "0.76rem", color: "#dc2626", textAlign: "center" }}>
                    {formErr}
                  </div>
                )}

                {[
                  { key: "displayName", label: "পূর্ণ নাম", placeholder: "যেমন: রাহেলা বেগম", icon: User, type: "text" },
                  { key: "username", label: "ইউজারনেম", placeholder: "যেমন: rahela123", icon: User, type: "text" },
                  { key: "password", label: "পাসওয়ার্ড", placeholder: "••••••••", icon: Lock, type: "password" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#3d2e35", display: "block", marginBottom: 6, letterSpacing: "0.02em" }}>{f.label}</label>
                    <div style={{ position: "relative" }}>
                      <f.icon size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a7078" }} />
                      <input type={f.type} placeholder={f.placeholder}
                        value={form[f.key as keyof typeof form] as string}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px 10px 34px", border: "1.5px solid rgba(139,58,90,0.18)",
                          borderRadius: 8, fontSize: "0.82rem", color: "#1a0f14", outline: "none",
                          background: "#fdf8f9", boxSizing: "border-box",
                          transition: "border-color 0.2s" }}
                        onFocus={e => (e.target.style.borderColor = "#8b3a5a")}
                        onBlur={e => (e.target.style.borderColor = "rgba(139,58,90,0.18)")} />
                    </div>
                  </div>
                ))}

                <div style={{ marginBottom: 22 }}>
                  <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#3d2e35", display: "block", marginBottom: 6, letterSpacing: "0.02em" }}>ভূমিকা</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ v: "manager", l: "ম্যানেজার", c: "#2563eb" }, { v: "asr", l: "ASR", c: "#059669" }].map(r => (
                      <button key={r.v} type="button" onClick={() => setForm(p => ({ ...p, role: r.v }))}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1.5px solid ${form.role === r.v ? r.c : "rgba(139,58,90,0.15)"}`,
                          background: form.role === r.v ? `${r.c}12` : "transparent", cursor: "pointer",
                          color: form.role === r.v ? r.c : "#8a7078", fontSize: "0.80rem", fontWeight: 600,
                          transition: "all 0.2s" }}>
                        {r.l}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: "100%", padding: "12px", borderRadius: 10,
                    background: "linear-gradient(135deg,#8b3a5a,#c4688a)", border: "none",
                    color: "#fff", fontSize: "0.86rem", fontWeight: 600, cursor: submitting ? "wait" : "pointer",
                    boxShadow: "0 4px 14px rgba(139,58,90,0.30)", opacity: submitting ? 0.75 : 1 }}>
                  {submitting ? "তৈরি হচ্ছে..." : "ব্যবহারকারী তৈরি করুন"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
