"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, User, Phone, MapPin, Banknote, Search, CheckCircle2 } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

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
  const totalCustomers = customers.length;
  const customersWithDue = customers.filter((c) => c.totalDue > 0).length;
  const totalDueAmount = customers.reduce((s, c) => s + c.totalDue, 0);
  const avgDue = customersWithDue > 0 ? Math.round(totalDueAmount / customersWithDue) : 0;

  return (
    <div className="pb-8 space-y-5">
            {/* Page Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">কাস্টমার সমূহ</h1>
          <p className="text-[14px] font-medium text-slate-500 mt-1">মোট {totalCustomers} জন কাস্টমার · {customersWithDue} জনের বকেয়া আছে</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 h-11 px-5 rounded-[12px] text-[14px] font-bold transition-all shadow-sm hover:shadow-md active:scale-95">
          <Plus size={18} strokeWidth={2.5} /> নতুন কাস্টমার
        </button>
      </div>

            {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">মোট কাস্টমার</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
              <User size={16} strokeWidth={2.2} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            {totalCustomers.toLocaleString("en-US")}
          </p>
        </div>
        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">বকেয়া কাস্টমার</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-100">
              <Banknote size={16} strokeWidth={2.2} className="text-amber-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            {customersWithDue.toLocaleString("en-US")}
          </p>
        </div>
        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">মোট বকেয়া</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 border border-rose-100">
              <Banknote size={16} strokeWidth={2.2} className="text-rose-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-rose-600 leading-none tabular-nums tracking-tight">
            ৳{totalDueAmount.toLocaleString("en-US")}
          </p>
        </div>
      </div>

            {/* Add Customer Form */}
      {showForm && (
        <div className="bg-white rounded-[16px] p-6 shadow-sm border border-slate-200/60 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
                <User size={18} strokeWidth={2.2} className="text-indigo-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900">নতুন কাস্টমার যোগ করুন</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <Plus size={20} className="rotate-45" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">নাম</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="কাস্টমারের নাম লিখুন" 
                className="w-full h-11 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ফোন নম্বর</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ফোন নম্বর লিখুন" 
                className="w-full h-11 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ঠিকানা (ঐচ্ছিক)</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ঠিকানা লিখুন" 
                className="w-full h-11 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2 pt-5 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)}
                className="h-11 px-6 rounded-[10px] text-[14px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                বাতিল
              </button>
              <button type="submit" disabled={submitting}
                className="h-11 px-8 rounded-[10px] text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm">
                {submitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

            <div className="flex items-center gap-2 mb-4 relative">
        <Search size={18} className="absolute left-3 text-slate-400" />
        <input 
          type="text" 
          placeholder="কাস্টমারের নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-3 rounded-[12px] bg-white border border-slate-200 text-[13.5px] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm shadow-slate-200/50 text-slate-700"
        />
      </div>
      {/* Customer Table-style List */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200/60 bg-slate-50/50">
          <h3 className="text-[16px] font-bold text-slate-800">কাস্টমার তালিকা</h3>
          <span className="text-[12px] font-bold px-3 py-1 rounded-[8px] bg-indigo-50 text-indigo-600 border border-indigo-100">মোট: {totalCustomers}</span>
        </div>
        {customers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <User size={28} strokeWidth={1.5} className="text-slate-400" />
            </div>
            <p className="text-[15px] font-semibold text-slate-600 mb-1">কোনো কাস্টমার নেই</p>
            <p className="text-[13px] text-slate-400">নতুন কাস্টমার যোগ করতে উপরের বাটনে ক্লিক করুন</p>
          </div>
        ) : (
                    <div className="flex flex-col">
            {customers
              .filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.phone.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((c, idx) => (
              <div key={c._id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-0">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 text-[15px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  {c.name[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-slate-900 truncate">{c.name}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 bg-slate-100/60 px-2 py-0.5 rounded-md">
                      <Phone size={12} className="text-slate-400" /> {c.phone}
                    </span>
                    {c.address && (
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 bg-slate-100/60 px-2 py-0.5 rounded-md">
                        <MapPin size={12} className="text-slate-400" /> {c.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 mx-2 md:mx-6 min-w-[90px]">
                  {c.totalDue > 0 ? (
                    <div className="flex flex-col items-end">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">বকেয়া</p>
                      <p className="text-[16px] font-black text-rose-600 tabular-nums">৳{c.totalDue.toLocaleString("en-US")}</p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CheckCircle2 size={14} /> পরিশোধিত
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(c)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-[12px] bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group" title="সম্পাদনা">
                    <Pencil size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => setDeleteConfirmation(c._id)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-[12px] bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm group" title="মুছুন">
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
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
        <div className="flex flex-col gap-5 p-1">
          <div>
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">নাম</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="কাস্টমার নাম" className="w-full h-11 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ফোন</label>
            <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="ফোন নম্বর" className="w-full h-11 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ঠিকানা</label>
            <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="ঠিকানা" className="w-full h-11 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400" />
          </div>

          {/* Manual Previous Due */}
          <div className="bg-amber-50 rounded-[14px] p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2 select-none">
              <Banknote size={16} className="text-amber-600" />
              <span className="text-[13px] font-bold text-amber-700">পূর্বের বকেয়া যোগ করুন (ঐচ্ছিক)</span>
            </div>
            <p className="text-[12px] mb-3 text-slate-600 font-medium">
              বর্তমান বাকি: <span className="font-bold text-rose-600 px-1.5 py-0.5 rounded-md bg-rose-50 ml-1">৳{editCustomer?.totalDue || 0}</span>
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
              <input type="number" value={editPrevDue}
                onChange={(e) => setEditPrevDue(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                placeholder="টাকার পরিমাণ লিখুন" min={0}
                className="w-full h-11 pl-8 pr-4 rounded-[10px] bg-white border border-amber-200 text-[14px] font-black text-slate-900 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all placeholder:text-slate-300 placeholder:font-normal" />
            </div>
            {Number(editPrevDue) > 0 && editCustomer && (
              <div className="mt-3 flex items-center justify-between border-t border-amber-200/50 pt-3">
                <span className="text-[12px] font-semibold text-amber-700">সর্বমোট নতুন বাকি:</span>
                <span className="text-[14px] font-black text-rose-600 tracking-tight tabular-nums">৳{editCustomer.totalDue + Number(editPrevDue)}</span>
              </div>
            )}
          </div>

          <div className="mt-2 pt-4 border-t border-slate-100 mb-1">
            <button onClick={handleEditSave} disabled={editSaving}
              className="w-full h-12 rounded-[14px] text-[14.5px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {editSaving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তনগুলো সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}





