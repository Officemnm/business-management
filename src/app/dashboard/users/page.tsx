"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, ShieldCheck, Pencil, X, User, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

interface UserData { _id: string; username: string; displayName: string; role: string; active: boolean; createdAt: string; }

const roles = [
  { value: "admin", label: "এডমিন" },
  { value: "manager", label: "ম্যানেজার" },
  { value: "asr", label: "এএসআর" },
  { value: "user", label: "ইউজার" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("user");
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const loadData = () => {
    fetch("/api/dashboard/users")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openEdit = (u: UserData) => {
    setEditUser(u);
    setEditDisplayName(u.displayName);
    setEditUsername(u.username);
    setEditRole(u.role);
    setEditPassword("");
  };

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

  const handleEditSave = async () => {
    if (!editUser) return;
    if (!editDisplayName.trim()) { toast.error("প্রদর্শন নাম আবশ্যক"); return; }
    setEditSaving(true);
    try {
      const body: Record<string, string> = {
        displayName: editDisplayName.trim(),
        role: editRole,
      };
      if (editPassword.trim()) body.newPassword = editPassword.trim();

      const res = await fetch(`/api/dashboard/users/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success("ইউজার আপডেট হয়েছে");
      setEditUser(null);
      loadData();
    } catch { toast.error("আপডেট ব্যর্থ"); }
    finally { setEditSaving(false); }
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

      {/* User Cards */}
      <div className="flex flex-col gap-3">
        {users.length === 0 ? (
          <div className="rounded-xl py-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>কোনো ইউজার নেই</p>
          </div>
        ) : (
          users.map((u) => (
            <div key={u._id} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold text-white"
                  style={{ background: u.active ? "#66a80f" : "#9ca3af" }}>
                  {u.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{u.displayName}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                      style={{
                        background: u.role === "admin" ? "#fef2f2" : u.role === "manager" ? "#eff6ff" : "#f0fdf4",
                        color: u.role === "admin" ? "#dc2626" : u.role === "manager" ? "#2563eb" : "#16a34a",
                      }}>
                      {roles.find((r) => r.value === u.role)?.label || u.role}
                    </span>
                    {!u.active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: "#fef2f2", color: "#dc2626" }}>নিষ্ক্রিয়</span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <User size={10} /> {u.username}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleToggleActive(u._id, u.active)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }} title={u.active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}>
                    {u.active ? <ShieldCheck size={14} style={{ color: "#16a34a" }} /> : <Shield size={14} style={{ color: "#dc2626" }} />}
                  </button>
                  <button onClick={() => openEdit(u)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }} title="সম্পাদনা">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(u._id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }} title="মুছুন">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-[90%] max-w-md rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>ইউজার সম্পাদনা</h3>
              <button onClick={() => setEditUser(null)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>প্রদর্শন নাম</label>
                <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className={inputStyle}
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>ইউজারনেম</label>
                <div className="h-10 px-3 flex items-center rounded-lg text-sm" style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
                  {editUsername}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>পদবি</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={inputStyle}
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                  {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound size={12} style={{ color: "var(--text-muted)" }} />
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>নতুন পাসওয়ার্ড (অপশনাল)</span>
                </div>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="খালি রাখলে পাসওয়ার্ড পরিবর্তন হবে না" className={inputStyle}
                  style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>
              <button onClick={handleEditSave} disabled={editSaving}
                className="w-full h-11 rounded-xl text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ background: "#66a80f" }}>
                {editSaving ? "সংরক্ষণ হচ্ছে..." : "আপডেট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
