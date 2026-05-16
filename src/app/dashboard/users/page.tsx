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

  const inputStyle = "w-full h-11 px-4 rounded-[12px] text-[13px] bg-slate-50 border border-slate-200 outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-slate-800 placeholder:text-slate-400 font-semibold";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-indigo-600 animate-spin"></div>
          <p className="text-[13px] font-medium text-slate-500 tracking-wide">লোড হচ্ছে...</p>
        </div>
      </div>
    );
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
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">ইউজার ম্যানেজমেন্ট</h1>
          <p className="text-[14px] font-medium text-slate-500 mt-1">মোট {totalUsers} জন ইউজার · {activeUsers} জন সক্রিয়</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 h-11 px-5 rounded-[12px] text-[14px] font-bold text-white cursor-pointer bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm active:scale-95">
          <Plus size={18} strokeWidth={2.5} /> নতুন ইউজার
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">মোট ইউজার</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
              <User size={16} strokeWidth={2.2} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            {totalUsers.toLocaleString("en-US")}
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">সক্রিয়</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100">
              <ShieldCheck size={16} strokeWidth={2.2} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            {activeUsers.toLocaleString("en-US")}
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">এডমিন</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 border border-rose-100">
              <Shield size={16} strokeWidth={2.2} className="text-rose-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            {adminCount.toLocaleString("en-US")}
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">ম্যানেজার</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
              <Shield size={16} strokeWidth={2.2} className="text-blue-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            {managerCount.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-[16px] p-6 shadow-sm border border-slate-200/60 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
                <User size={18} strokeWidth={2.2} className="text-indigo-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900">নতুন ইউজার তৈরি করুন</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <Plus size={20} className="rotate-45" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ইউজারনেম</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ইউজারনেম" className={inputStyle} />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">পাসওয়ার্ড</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="পাসওয়ার্ড" className={inputStyle} />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">প্রদর্শন নাম</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="পুরো নাম" className={inputStyle} />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">পদবি</label>
              <AnimatedDropdown options={roles} value={role} onChange={setRole} className="h-11 rounded-[12px] bg-slate-50 border-slate-200" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2 pt-5 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)}
                className="h-11 px-6 rounded-[10px] text-[14px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                বাতিল
              </button>
              <button type="submit" disabled={submitting}
                className="h-11 px-8 rounded-[10px] text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm">
                {submitting ? "তৈরি হচ্ছে..." : "ইউজার তৈরি"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200/60 bg-slate-50/50">
          <h3 className="text-[16px] font-bold text-slate-800">ইউজার তালিকা</h3>
          <span className="text-[12px] font-bold px-3 py-1 rounded-[8px] bg-indigo-50 text-indigo-600 border border-indigo-100">মোট: {totalUsers}</span>
        </div>
        {users.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <User size={28} strokeWidth={1.5} className="text-slate-400" />
            </div>
            <p className="text-[15px] font-semibold text-slate-600 mb-1">কোনো ইউজার নেই</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {users.map((u, idx) => (
              <div key={u._id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-0">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 text-[15px] font-bold border ${u.active ? "bg-indigo-50 text-indigo-600 border-indigo-100/50" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  {u.displayName[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-bold text-slate-900 truncate">{u.displayName}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-[6px] font-bold shrink-0 ${
                        u.role === "admin" ? "bg-rose-50 text-rose-600 border border-rose-100" : 
                        u.role === "manager" ? "bg-blue-50 text-blue-600 border border-blue-100" : 
                        u.role === "asr" ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                        "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                      {roles.find((r) => r.value === u.role)?.label || u.role}
                    </span>
                    {!u.active && (
                      <span className="text-[11px] px-2 py-0.5 rounded-[6px] font-bold shrink-0 bg-rose-50 text-rose-600 border border-rose-100">নিষ্ক্রিয়</span>
                    )}
                    {(u.role === "user" || u.role === "asr") && u.permissions && (!u.permissions.canEdit || !u.permissions.canDelete) && (
                      <span className="text-[11px] px-2 py-0.5 rounded-[6px] font-bold shrink-0 flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-100"><Eye size={10} strokeWidth={2.5} /> অনলি ভিউ</span>
                    )}
                    {u.role === "user" && u.assignedASR && (
                      <span className="text-[11px] px-2 py-0.5 rounded-[6px] font-bold shrink-0 bg-slate-100 text-slate-600 border border-slate-200">ASR: {u.assignedASR}</span>
                    )}
                  </div>
                  <p className="text-[12px] mt-1.5 flex items-center gap-1 font-medium text-slate-500">
                    <User size={12} className="text-slate-400" /> {u.username}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggleActive(u._id, u.active)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-[12px] bg-white border border-slate-200 flex items-center justify-center transition-all shadow-sm group" title={u.active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}>
                    {u.active ? <ShieldCheck size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" /> : <Shield size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />}
                  </button>
                  <button onClick={() => openEdit(u)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-[12px] bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group" title="সম্পাদনা">
                    <Pencil size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => handleDelete(u._id)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-[12px] bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm group" title="মুছুন">
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <AnimatedModal open={!!editUser} onClose={() => setEditUser(null)} title="ইউজার সম্পাদনা" maxWidth="max-w-md">
        <div className="flex flex-col gap-5 p-1">
          <div>
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">প্রদর্শন নাম</label>
            <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className={inputStyle} />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ইউজারনেম</label>
            <div className="h-11 px-4 flex items-center rounded-[12px] text-[14px] bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed">
              {editUsername}
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">পদবি</label>
            <AnimatedDropdown options={roles} value={editRole} onChange={setEditRole} className="h-11 rounded-[12px] bg-slate-50 border-slate-200" />
          </div>

          {(editRole === "user" || editRole === "asr") && (
            <div className="rounded-[16px] p-4 flex flex-col gap-4 bg-slate-50 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-slate-700" />
                <span className="text-[13px] font-bold text-slate-800">অনুমতি (Permissions)</span>
              </div>
              <div className="flex bg-white rounded-[12px] border border-slate-200 overflow-hidden p-1 gap-1 shadow-sm">
                <button type="button" onClick={() => setEditPermissions({ canEdit: false, canDelete: false })} className={`flex-1 py-2 text-[12px] font-bold rounded-[8px] transition-colors ${!editPermissions.canEdit && !editPermissions.canDelete ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-slate-50"}`}>
                  <Eye size={14} className="inline mr-1.5" /> অনলি ভিউ
                </button>
                <button type="button" onClick={() => setEditPermissions({ canEdit: true, canDelete: true })} className={`flex-1 py-2 text-[12px] font-bold rounded-[8px] transition-colors ${editPermissions.canEdit || editPermissions.canDelete ? "bg-emerald-50 text-emerald-600" : "text-slate-500 hover:bg-slate-50"}`}>
                  পূর্ণ অনুমতি
                </button>
              </div>
              {editRole === "user" && (
                <div className="mt-2">
                  <label className="block text-[12px] font-bold text-slate-600 mb-2">নির্দিষ্ট এএসআর বরাদ্দ</label>
                  <AnimatedDropdown options={asrOptions} value={editAssignedASR} onChange={setEditAssignedASR} className="h-11 rounded-[12px] bg-white border-slate-200" />
                </div>
              )}
            </div>
          )}

          <div className="rounded-[16px] p-4 bg-indigo-50/50 border border-indigo-100 shadow-sm mt-2">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound size={16} className="text-indigo-600" />
              <span className="text-[13px] font-bold text-indigo-900">নতুন পাসওয়ার্ড (অপশনাল)</span>
            </div>
            <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
              placeholder="খালি রাখলে পাসওয়ার্ড পরিবর্তন হবে না" className={inputStyle} />
          </div>

          <div className="mt-2 pt-4 border-t border-slate-100 mb-1">
            <button onClick={handleEditSave} disabled={editSaving}
              className="w-full h-12 rounded-[14px] text-[14.5px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {editSaving ? "সংরক্ষণ হচ্ছে..." : "আপডেট করুন"}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
