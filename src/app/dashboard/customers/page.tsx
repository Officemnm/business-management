"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, User, Phone, MapPin, Banknote } from "lucide-react";
import toast from "react-hot-toast";
import AnimatedModal from "@/components/ui/AnimatedModal";

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
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

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

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      const res = await fetch(`/api/dashboard/customers/${deleteConfirmation}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("কাস্টমার মুছে ফেলা হয়েছে");
      loadData();
    } catch { toast.error("মুছতে ব্যর্থ হয়েছে"); }
    finally { setDeleteConfirmation(null); }
  };

  const inputStyle = "w-full h-10 px-3 rounded-lg text-[13px] outline-none transition-colors focus:border-[#66a80f]";

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
    </div>;
  }

  // Stats
  const totalCustomers = customers.length;
  const customersWithDue = customers.filter((c) => c.totalDue > 0).length;
  const totalDueAmount = customers.reduce((s, c) => s + c.totalDue, 0);
  const avgDue = customersWithDue > 0 ? Math.round(totalDueAmount / customersWithDue) : 0;

  return (
    <div className="pb-8 space-y-5">
      {/* Page Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>কাস্টমার সমূহ</h1>
          <p className="text-[13px] font-medium mt-1" style={{ color: "#6b7280" }}>মোট {totalCustomers} জন কাস্টমার · {customersWithDue} জনের বকেয়া আছে</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all hover:shadow-sm"
          style={{ background: "#66a80f" }}>
          <Plus size={16} /> নতুন কাস্টমার
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট কাস্টমার</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
              <User size={14} strokeWidth={2.2} style={{ color: "#66a80f" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {totalCustomers.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>বকেয়া কাস্টমার</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fffbeb" }}>
              <Banknote size={14} strokeWidth={2.2} style={{ color: "#d97706" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {customersWithDue.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট বকেয়া</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fef2f2" }}>
              <Banknote size={14} strokeWidth={2.2} style={{ color: "#dc2626" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            ৳{totalDueAmount.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>গড় বকেয়া</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <Banknote size={14} strokeWidth={2.2} style={{ color: "#374151" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            ৳{avgDue.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
              <Plus size={15} strokeWidth={2.2} style={{ color: "#66a80f" }} />
            </div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>নতুন কাস্টমার যোগ করুন</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>নাম</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="কাস্টমার নাম" className={inputStyle}
                style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>ফোন</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ফোন নম্বর" className={inputStyle}
                style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>ঠিকানা</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ঠিকানা" className={inputStyle}
                style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }} />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="h-10 px-5 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors"
                style={{ background: "#fafafa", color: "#374151", border: "1px solid #e5e7eb" }}>
                বাতিল
              </button>
              <button type="submit" disabled={submitting}
                className="h-10 px-6 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 transition-all hover:shadow-sm" style={{ background: "#66a80f" }}>
                {submitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Table-style List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <h3 className="text-[13px] font-semibold" style={{ color: "#111827" }}>কাস্টমার তালিকা</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#374151" }}>{totalCustomers}</span>
        </div>
        {customers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <User size={20} strokeWidth={1.5} style={{ color: "#9ca3af" }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "#6b7280" }}>কোনো কাস্টমার নেই</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {customers.map((c, idx) => (
              <div key={c._id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50" style={{ borderTop: idx > 0 ? "1px solid #f3f4f6" : "none" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold" style={{ background: "#f3f4f6", color: "#111827" }}>
                  {c.name[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: "#111827" }}>{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#6b7280" }}>
                      <Phone size={10} /> {c.phone}
                    </span>
                    {c.address && (
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#6b7280" }}>
                        <MapPin size={10} /> {c.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 mr-2">
                  {c.totalDue > 0 ? (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>বকেয়া</p>
                      <p className="text-[15px] font-bold" style={{ color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>৳{c.totalDue.toLocaleString("en-US")}</p>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a" }}>পরিশোধিত</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(c)}
                    className="w-10 h-10 rounded-[14px] bg-white border border-slate-200/80 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)] transition-all shadow-sm group" title="সম্পাদনা">
                    <Pencil size={15} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => setDeleteConfirmation(c._id)}
                    className="w-10 h-10 rounded-[14px] bg-white border border-slate-200/80 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 hover:shadow-[0_4px_12px_-4px_rgba(244,63,94,0.2)] transition-all shadow-sm group" title="মুছুন">
                    <Trash2 size={15} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      <AnimatedModal
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        title=""
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col items-center justify-center pt-4 pb-2 px-2 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center mb-5 shrink-0">
            <Trash2 size={24} className="text-rose-500" strokeWidth={2} />
          </div>
          <h3 className="text-[18px] font-black text-slate-900 mb-2">কাস্টমার ডিলিট</h3>
          <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed max-w-[260px]">
            আপনি কি নিশ্চিত যে এই কাস্টমারটিকে রিমুভ করতে চান? এটি একবার ডিলিট করলে এর ডাটা আর ফিরে পাওয়া যাবে না।
          </p>
          <div className="flex w-full gap-3">
            <button
              onClick={() => setDeleteConfirmation(null)}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
            >
              বাতিল
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-[0_4px_15px_-3px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(244,63,94,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              ডিলিট করুন
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Edit Customer Modal */}
      <AnimatedModal open={!!editCustomer} onClose={() => setEditCustomer(null)} title="কাস্টমার সম্পাদনা" maxWidth="max-w-md">
        <div className="flex flex-col gap-4">
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
              বর্তমান বাকি: <b style={{ color: "#dc2626" }}>৳{editCustomer?.totalDue || 0}</b>
            </p>
            <input type="number" value={editPrevDue}
              onChange={(e) => setEditPrevDue(e.target.value === "" ? "" : Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              placeholder="টাকার পরিমাণ লিখুন" min={0}
              className={inputStyle}
              style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #fde68a" }} />
            {Number(editPrevDue) > 0 && editCustomer && (
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
      </AnimatedModal>
    </div>
  );
}
