"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface User { _id: string; username: string; displayName: string; role: string; active: boolean; createdAt: string; }

const roles = [
  { value: "admin", label: "এডমিন" },
  { value: "manager", label: "ম্যানেজার" },
  { value: "asr", label: "এএসআর" },
  { value: "user", label: "ইউজার" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("user");
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    fetch("/api/dashboard/users")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !displayName.trim()) {
      toast.error("সকল ফিল্ড পূরণ করুন"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, displayName: displayName.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "সমস্যা হয়েছে"); return; }
      toast.success("ইউজার তৈরি হয়েছে");
      setShowForm(false); setUsername(""); setPassword(""); setDisplayName(""); setRole("user");
      loadData();
    } catch { toast.error("সমস্যা হয়েছে"); }
    finally { setSubmitting(false); }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await fetch(`/api/dashboard/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      toast.success("পদবি পরিবর্তন হয়েছে");
      loadData();
    } catch { toast.error("সমস্যা হয়েছে"); }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/dashboard/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      toast.success(active ? "ইউজার নিষ্ক্রিয় হয়েছে" : "ইউজার সক্রিয় হয়েছে");
      loadData();
    } catch { toast.error("সমস্যা হয়েছে"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("মুছে ফেলতে চান?")) return;
    await fetch(`/api/dashboard/users/${id}`, { method: "DELETE" });
    toast.success("ইউজার মুছে ফেলা হয়েছে");
    loadData();
  };

  const inputStyle = "w-full h-10 px-3 rounded-lg text-sm outline-none";

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>ইউজার ম্যানেজমেন্ট</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-white cursor-pointer" style={{ background: "#66a80f" }}>
          <Plus size={16} /> নতুন ইউজার
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl p-5 mb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>ইউজারনেম</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ইউজারনেম" className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>পাসওয়ার্ড</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="পাসওয়ার্ড" className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>প্রদর্শন নাম</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="পুরো নাম" className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>পদবি</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting}
                className="h-10 px-6 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50" style={{ background: "#66a80f" }}>
                {submitting ? "তৈরি হচ্ছে..." : "ইউজার তৈরি"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {users.length === 0 ? (
          <div className="py-12 text-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>কোনো ইউজার নেই</p></div>
        ) : (
          <table className="w-full text-[13px]">
            <thead style={{ background: "var(--bg-input)" }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>নাম</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>ইউজারনেম</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>পদবি</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>স্ট্যাটাস</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderTop: "1px solid var(--border-color)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{u.displayName}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{u.username}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="h-8 px-2 rounded-md text-[12px] outline-none cursor-pointer"
                      style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                    >
                      {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleActive(u._id, u.active)} className="cursor-pointer">
                      {u.active ? (
                        <ShieldCheck size={16} style={{ color: "#16a34a" }} />
                      ) : (
                        <Shield size={16} style={{ color: "#dc2626" }} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(u._id)} className="cursor-pointer" style={{ color: "#dc2626" }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
