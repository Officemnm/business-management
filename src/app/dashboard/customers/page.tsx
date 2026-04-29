"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Customer { _id: string; name: string; phone: string; address?: string; totalDue: number; createdAt: string; }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    fetch("/api/dashboard/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { toast.error("নাম ও ফোন নম্বর আবশ্যক"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), address: address.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("কাস্টমার যোগ হয়েছে");
      setShowForm(false); setName(""); setPhone(""); setAddress("");
      loadData();
    } catch { toast.error("সমস্যা হয়েছে"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("মুছে ফেলতে চান?")) return;
    await fetch(`/api/dashboard/customers/${id}`, { method: "DELETE" });
    toast.success("কাস্টমার মুছে ফেলা হয়েছে");
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
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>কাস্টমার সমূহ</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-white cursor-pointer" style={{ background: "#66a80f" }}>
          <Plus size={16} /> কাস্টমার এড
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl p-5 mb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>নাম</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="কাস্টমার নাম" className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>ফোন</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ফোন নম্বর" className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>ঠিকানা</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ঠিকানা" className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
            <div className="md:col-span-3">
              <button type="submit" disabled={submitting}
                className="h-10 px-6 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50" style={{ background: "#66a80f" }}>
                {submitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {customers.length === 0 ? (
          <div className="py-12 text-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>কোনো কাস্টমার নেই</p></div>
        ) : (
          <table className="w-full text-[13px]">
            <thead style={{ background: "var(--bg-input)" }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>নাম</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>ফোন</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>ঠিকানা</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>বাকি</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>তারিখ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} style={{ borderTop: "1px solid var(--border-color)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{c.phone}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{c.address || "-"}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: c.totalDue > 0 ? "#dc2626" : "var(--text-secondary)" }}>৳{c.totalDue}</td>
                  <td className="px-4 py-3 text-right text-[12px]" style={{ color: "var(--text-muted)" }}>{new Date(c.createdAt).toLocaleDateString("bn-BD")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(c._id)} className="cursor-pointer" style={{ color: "#dc2626" }}><Trash2 size={14} /></button>
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
