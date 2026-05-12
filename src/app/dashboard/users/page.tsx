"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, ShieldCheck, Pencil, User, KeyRound, Eye, Lock } from "lucide-react";
import toast from "react-hot-toast";
import AnimatedModal from "@/components/ui/AnimatedModal";
import AnimatedDropdown from "@/components/ui/AnimatedDropdown";

interface Permissions { canEdit: boolean; canDelete: boolean; }
interface UserData { _id: string; username: string; displayName: string; role: string; active: boolean; createdAt: string; permissions?: Permissions; assignedASR?: string; }

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
  const [editPermissions, setEditPermissions] = useState<Permissions>({ canEdit: true, canDelete: true });
  const [editAssignedASR, setEditAssignedASR] = useState("");

  const asrOptions = [
    { value: "", label: "সব এএসআর (ডিফল্ট)" },
    ...users.filter(u => u.role === "asr" || u.role === "manager").map(u => ({ value: u.username, label: u.displayName }))
  ];

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
    setEditPermissions(u.permissions || { canEdit: true, canDelete: true });
    setEditAssignedASR(u.assignedASR || "");
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
      const body: any = {
        displayName: editDisplayName.trim(),
        role: editRole,
        permissions: editPermissions,
        assignedASR: editAssignedASR,
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

  const inputStyle = "w-full h-10 px-3 rounded-lg text-[13px] outline-none transition-colors";

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
    </div>;
  }

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const managerCount = users.filter((u) => u.role === "manager").length;

  return (
    <div className="pb-8 space-y-5">
      {/* Page Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>ইউজার ম্যানেজমেন্ট</h1>
          <p className="text-[13px] font-medium mt-1" style={{ color: "#6b7280" }}>মোট {totalUsers} জন ইউজার · {activeUsers} জন সক্রিয়</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all hover:shadow-sm"
          style={{ background: "#66a80f" }}>
          <Plus size={16} /> নতুন ইউজার
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট ইউজার</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
              <User size={14} strokeWidth={2.2} style={{ color: "#66a80f" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {totalUsers.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>সক্রিয়</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#f0fdf4" }}>
              <ShieldCheck size={14} strokeWidth={2.2} style={{ color: "#16a34a" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {activeUsers.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>এডমিন</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fef2f2" }}>
              <Shield size={14} strokeWidth={2.2} style={{ color: "#dc2626" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {adminCount.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>ম্যানেজার</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
              <Shield size={14} strokeWidth={2.2} style={{ color: "#2563eb" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {managerCount.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
              <Plus size={15} strokeWidth={2.2} style={{ color: "#66a80f" }} />
            </div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>নতুন ইউজার তৈরি করুন</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>ইউজারনেম</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ইউজারনেম" className={inputStyle}
                style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>পাসওয়ার্ড</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="পাসওয়ার্ড" className={inputStyle}
                style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>প্রদর্শন নাম</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="পুরো নাম" className={inputStyle}
                style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>পদবি</label>
              <AnimatedDropdown options={roles} value={role} onChange={setRole} className="h-10" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="h-10 px-5 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors"
                style={{ background: "#fafafa", color: "#374151", border: "1px solid #e5e7eb" }}>
                বাতিল
              </button>
              <button type="submit" disabled={submitting}
                className="h-10 px-6 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 transition-all hover:shadow-sm" style={{ background: "#66a80f" }}>
                {submitting ? "তৈরি হচ্ছে..." : "ইউজার তৈরি"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <h3 className="text-[13px] font-semibold" style={{ color: "#111827" }}>ইউজার তালিকা</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#374151" }}>{totalUsers}</span>
        </div>
        {users.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <User size={20} strokeWidth={1.5} style={{ color: "#9ca3af" }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "#6b7280" }}>কোনো ইউজার নেই</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {users.map((u, idx) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50" style={{ borderTop: idx > 0 ? "1px solid #f3f4f6" : "none" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold text-white"
                  style={{ background: u.active ? "#66a80f" : "#9ca3af" }}>
                  {u.displayName[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold truncate" style={{ color: "#111827" }}>{u.displayName}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                      style={{
                        background: u.role === "admin" ? "#fef2f2" : u.role === "manager" ? "#eff6ff" : u.role === "asr" ? "#fffbeb" : "#f0fdf4",
                        color: u.role === "admin" ? "#dc2626" : u.role === "manager" ? "#2563eb" : u.role === "asr" ? "#d97706" : "#16a34a",
                      }}>
                      {roles.find((r) => r.value === u.role)?.label || u.role}
                    </span>
                    {!u.active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: "#fef2f2", color: "#dc2626" }}>নিষ্ক্রিয়</span>
                    )}
                    {(u.role === "user" || u.role === "asr") && u.permissions && (!u.permissions.canEdit || !u.permissions.canDelete) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 flex items-center gap-1"
                        style={{ background: "#fef2f2", color: "#dc2626" }}><Eye size={10} /> অনলি ভিউ</span>
                    )}
                    {u.role === "user" && u.assignedASR && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: "#f3f4f6", color: "#4b5563" }}>ASR: {u.assignedASR}</span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 flex items-center gap-1 font-medium" style={{ color: "#6b7280" }}>
                    <User size={10} /> {u.username}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleToggleActive(u._id, u.active)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-100"
                    style={{ background: "#ffffff", border: "1px solid #e5e7eb" }} title={u.active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}>
                    {u.active ? <ShieldCheck size={14} style={{ color: "#16a34a" }} /> : <Shield size={14} style={{ color: "#dc2626" }} />}
                  </button>
                  <button onClick={() => openEdit(u)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-100"
                    style={{ background: "#ffffff", color: "#6b7280", border: "1px solid #e5e7eb" }} title="সম্পাদনা">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(u._id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-red-100"
                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }} title="মুছুন">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <AnimatedModal open={!!editUser} onClose={() => setEditUser(null)} title="ইউজার সম্পাদনা" maxWidth="max-w-md">
        <div className="flex flex-col gap-4">
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
            <AnimatedDropdown options={roles} value={editRole} onChange={setEditRole} className="h-10" />
          </div>

          {(editRole === "user" || editRole === "asr") && (
            <div className="rounded-xl p-3 flex flex-col gap-3" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center gap-2">
                <Lock size={14} style={{ color: "var(--text-primary)" }} />
                <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>অনুমতি (Permissions)</span>
              </div>
              <div className="flex bg-white rounded-lg border overflow-hidden p-1 gap-1" style={{ borderColor: "var(--border-color)" }}>
                <button type="button" onClick={() => setEditPermissions({ canEdit: false, canDelete: false })} className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${!editPermissions.canEdit && !editPermissions.canDelete ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"}`}>
                  <Eye size={12} className="inline mr-1" /> অনলি ভিউ
                </button>
                <button type="button" onClick={() => setEditPermissions({ canEdit: true, canDelete: true })} className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${editPermissions.canEdit || editPermissions.canDelete ? "bg-green-50 text-green-600" : "text-gray-500 hover:bg-gray-50"}`}>
                  পূর্ণ অনুমতি
                </button>
              </div>
              {editRole === "user" && (
                <div className="mt-1">
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>নির্দিষ্ট এএসআর বরাদ্দ</label>
                  <AnimatedDropdown options={asrOptions} value={editAssignedASR} onChange={setEditAssignedASR} className="h-9 text-xs" />
                </div>
              )}
            </div>
          )}

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
      </AnimatedModal>
    </div>
  );
}
