"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, User, Phone, MapPin, Banknote } from "lucide-react";
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

  // Edit modal state
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPrevDue, setEditPrevDue] = useState<number | string>("");
  const [editSaving, setEditSaving] = useState(false);

  const loadData = () => {
    fetch("/api/dashboard/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditAddress(c.address || "");
    setEditPrevDue("");
  };

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

  const handleEditSave = async () => {
    if (!editCustomer) return;
    if (!editName.trim() || !editPhone.trim()) { toast.error("নাম ও ফোন আবশ্যক"); return; }
    setEditSaving(true);
    try {
      const prevDueAmt = Number(editPrevDue) || 0;

      // Update customer info
      const updateBody: Record<string, unknown> = {
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      };
      if (prevDueAmt > 0) {
        updateBody.totalDue = editCustomer.totalDue + prevDueAmt;
      }

      const res = await fetch(`/api/dashboard/customers/${editCustomer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });
      if (!res.ok) throw new Error();

      // If manual due was added, create a payment record (negative = due added)
      if (prevDueAmt > 0) {
        await fetch("/api/dashboard/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: editCustomer._id,
            customerName: editName.trim(),
            amount: -prevDueAmt,
            note: "পূর্বের বকেয়া যোগ",
          }),
        });
      }

      toast.success("কাস্টমার আপডেট হয়েছে");
      setEditCustomer(null);
      loadData();
    } catch { toast.error("আপডেট ব্যর্থ"); }
    finally { setEditSaving(false); }
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

      {/* Customer Cards List */}
      <div className="flex flex-col gap-3">
        {customers.length === 0 ? (
          <div className="rounded-xl py-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>কোনো কাস্টমার নেই</p>
          </div>
        ) : (
          customers.map((c) => (
            <div key={c._id} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
                  <User size={18} style={{ color: "#66a80f" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <Phone size={10} /> {c.phone}
                    </span>
                    {c.address && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        <MapPin size={10} /> {c.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 mr-2">
                  {c.totalDue > 0 ? (
                    <p className="text-[15px] font-extrabold" style={{ color: "#dc2626" }}>৳{c.totalDue}</p>
                  ) : (
                    <p className="text-[12px] font-medium" style={{ color: "#16a34a" }}>বাকি নেই</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(c)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }} title="সম্পাদনা">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(c._id)}
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

      {/* Edit Customer Modal */}
      {editCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-[90%] max-w-md rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>কাস্টমার সম্পাদনা</h3>
              <button onClick={() => setEditCustomer(null)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>নাম</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="কাস্টমার নাম" className={inputStyle}
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>ফোন</label>
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="ফোন নম্বর" className={inputStyle}
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>ঠিকানা</label>
                <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="ঠিকানা" className={inputStyle}
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>

              {/* Manual Previous Due */}
              <div className="rounded-xl p-4" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Banknote size={14} style={{ color: "#d97706" }} />
                  <span className="text-[12px] font-bold" style={{ color: "#d97706" }}>পূর্বের বকেয়া যোগ করুন (অপশনাল)</span>
                </div>
                <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>
                  বর্তমান বাকি: <b style={{ color: "#dc2626" }}>৳{editCustomer.totalDue}</b>
                </p>
                <input type="number" value={editPrevDue}
                  onChange={(e) => setEditPrevDue(e.target.value === "" ? "" : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="টাকার পরিমাণ লিখুন" min={0}
                  className={inputStyle}
                  style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #fde68a" }} />
                {Number(editPrevDue) > 0 && (
                  <p className="text-[11px] mt-2 font-semibold" style={{ color: "#d97706" }}>
                    নতুন মোট বাকি হবে: ৳{editCustomer.totalDue + Number(editPrevDue)}
                  </p>
                )}
              </div>

              <button onClick={handleEditSave} disabled={editSaving}
                className="w-full h-11 rounded-xl text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
