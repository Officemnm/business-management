"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Banknote, User, Phone, Calendar, CheckCircle2, History } from "lucide-react";
import toast from "react-hot-toast";
import AnimatedDropdown from "@/components/ui/AnimatedDropdown";

interface Customer { _id: string; name: string; phone: string; totalDue: number; createdBy: string; }
interface Payment { _id: string; customer: string; customerName: string; amount: number; note?: string; collectedBy: string; createdAt: string; }

export default function DuesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // User filter stuff
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState("");

  // Collection modal
  const [collectCustomer, setCollectCustomer] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number | string>("");
  const [collecting, setCollecting] = useState(false);

  // History modal per customer — shows payment records
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadCustomers = (tUser?: string) => {
    const t = tUser !== undefined ? tUser : targetUser;
    let url = "/api/dashboard/customers";
    if (t) {
      url += `?targetUser=${t}`;
    }

    // Fetch auth to conditionally fetch system users if not loaded yet
    if (!currentUser) {
      fetch("/api/auth/me").then(r => r.json()).then(authData => {
        const user = authData?.user;
        setCurrentUser(user);
        
        const admin = user?.role === "admin";
        
        // If there's no explicitly passed targetUser parameter, and user is admin, use his username as the default
        const effectiveTarget = (tUser === undefined && admin) ? user.username : t;
        if (admin && tUser === undefined) {
          setTargetUser(user.username);
        }

        const userListPromise = admin ? fetch("/api/dashboard/users").then(r => r.json()) : Promise.resolve([]);
        const customersUrl = `/api/dashboard/customers${effectiveTarget ? `?targetUser=${effectiveTarget}` : ""}`;

        Promise.all([
          fetch(customersUrl).then((r) => r.json()),
          userListPromise
        ]).then(([data, u]) => {
          setCustomers(data.filter((c: Customer) => c.totalDue > 0));
          if (admin && Array.isArray(u)) setSystemUsers(u);
        }).finally(() => setLoading(false));
      });
    } else {
      fetch(url)
        .then((r) => r.json())
        .then((data) => setCustomers(data.filter((c: Customer) => c.totalDue > 0)))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const fetchPayments = useCallback((customerId: string) => {
    setHistoryLoading(true);
    fetch(`/api/dashboard/payments?customerId=${customerId}`)
      .then((r) => r.json())
      .then(setPayments)
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (historyCustomer) fetchPayments(historyCustomer._id);
  }, [historyCustomer, fetchPayments]);

  const totalDue = customers.reduce((s, c) => s + c.totalDue, 0);

  const handleCollect = async () => {
    if (!collectCustomer) return;
    const amt = Number(collectAmount) || 0;
    if (amt <= 0) { toast.error("টাকার পরিমাণ দিন"); return; }
    if (amt > collectCustomer.totalDue) { toast.error("বাকির চেয়ে বেশি দেওয়া যাবে না"); return; }
    setCollecting(true);
    try {
      const res = await fetch("/api/dashboard/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: collectCustomer._id,
          customerName: collectCustomer.name,
          amount: amt,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`৳${amt} কালেক্ট হয়েছে`);
      setCollectCustomer(null);
      setCollectAmount("");
      loadCustomers();
    } catch { toast.error("কালেক্ট ব্যর্থ"); }
    finally { setCollecting(false); }
  };

  // Group payments by date for history modal
  const paymentsByDate: Record<string, Payment[]> = {};
  payments.forEach((p) => {
    const dateKey = new Date(p.createdAt).toLocaleDateString("bn-BD", { day: "2-digit", month: "long", year: "numeric" });
    if (!paymentsByDate[dateKey]) paymentsByDate[dateKey] = [];
    paymentsByDate[dateKey].push(p);
  });
  const paymentDateList = Object.entries(paymentsByDate);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);

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

  const avgDue = customers.length > 0 ? Math.round(totalDue / customers.length) : 0;
  const maxDue = customers.length > 0 ? Math.max(...customers.map((c) => c.totalDue)) : 0;

  return (
    <div className="pb-8 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">বাকি তালিকা</h1>
          <p className="text-[14px] font-medium text-slate-500 mt-1">
            মোট <span className="font-bold text-slate-700">{customers.length}</span> জন কাস্টমারের বকেয়া রয়েছে
          </p>
        </div>

        {/* Target User Filter for Admin */}
        {currentUser?.role === "admin" && systemUsers.length > 0 && (
          <div className="w-full sm:w-64 z-20">
            <AnimatedDropdown
              options={[
                { value: "", label: "সকল ইউজার (All)" },
                ...systemUsers.map(u => ({
                  value: u.username,
                  label: `${u.displayName} - (${u.username})`
                }))
              ]}
              value={targetUser}
              onChange={(u) => {
                setTargetUser(u);
                loadCustomers(u);
              }}
              className="w-full h-11 shadow-sm rounded-[12px] font-bold text-[13px] bg-white border-slate-200 text-slate-800"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">মোট বাকি</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 border border-rose-100">
              <Banknote size={16} strokeWidth={2.2} className="text-rose-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-rose-600 leading-none tabular-nums tracking-tight">
            ৳{totalDue.toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[12px] font-bold text-slate-700">{customers.length}</span>
            <span className="text-[12px] font-medium text-slate-500">জন কাস্টমার</span>
          </div>
        </div>

        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">গড় বাকি</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-100">
              <Banknote size={16} strokeWidth={2.2} className="text-amber-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            ৳{avgDue.toLocaleString("en-US")}
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200/60 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">সর্বোচ্চ বাকি</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 border border-slate-200">
              <Banknote size={16} strokeWidth={2.2} className="text-slate-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            ৳{maxDue.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200/60 bg-slate-50/50">
          <h3 className="text-[16px] font-bold text-slate-800">বকেয়া কাস্টমার তালিকা</h3>
          <span className="text-[12px] font-bold px-3 py-1 rounded-[8px] bg-rose-50 text-rose-600 border border-rose-100">বাকি: {customers.length} জন</span>
        </div>
        {customers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100">
              <CheckCircle2 size={28} strokeWidth={2} className="text-emerald-500" />
            </div>
            <p className="text-[15px] font-bold text-slate-900 mb-1">সব বকেয়া পরিশোধিত</p>
            <p className="text-[13px] font-medium text-slate-500">কোনো কাস্টমারের বাকি নেই</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {customers.map((c, idx) => (
              <div key={c._id} className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-0">
                <div className="hidden sm:flex w-12 h-12 rounded-[14px] items-center justify-center shrink-0 text-[15px] font-bold bg-rose-50 text-rose-600 border border-rose-100/50">
                  {c.name[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 truncate">{c.name}</p>
                  <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[12px] font-medium mt-1 text-slate-500 bg-slate-100/60 px-1.5 sm:px-2 py-0.5 rounded-md inline-flex max-w-[90px] sm:max-w-[200px] truncate w-[max-content]">
                    <Phone size={10} className="text-slate-400 shrink-0 sm:w-3 sm:h-3" /> <span className="truncate">{c.phone}</span>
                  </span>
                </div>
                <div className="text-right shrink-0 mx-1 sm:mx-2 md:mx-6 min-w-[65px] sm:min-w-[90px]">
                  <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">বকেয়া</p>
                  <p className="text-[13px] sm:text-[16px] font-black text-rose-600 tabular-nums">৳{c.totalDue.toLocaleString("en-US")}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 shrink-0">
                  <button onClick={() => { setHistoryCustomer(c); setPayments([]); }}
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-[8px] sm:rounded-[12px] bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group" title="পেমেন্ট হিস্ট্রি">
                    <History size={12} strokeWidth={2} className="sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                  </button>
                  <button onClick={() => { setCollectCustomer(c); setCollectAmount(""); }}
                    className="w-7 h-7 sm:w-auto sm:h-10 sm:px-4 rounded-[8px] sm:rounded-[12px] sm:text-[13px] sm:font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95 flex items-center justify-center gap-0 sm:gap-2" title="টাকা কালেক্ট">
                    <Banknote size={12} strokeWidth={2.5} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">কালেক্ট</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-[24px] max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <History size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-tight">{historyCustomer.name}</h3>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">পেমেন্ট হিস্ট্রি</p>
                </div>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><X size={20} strokeWidth={2} /></button>
            </div>

            <div className="p-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-[16px] p-4 text-center bg-rose-50 border border-rose-100 shadow-sm">
                  <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-1.5">বর্তমান বাকি</p>
                  <p className="text-[20px] font-black text-rose-600 tabular-nums">৳{historyCustomer.totalDue.toLocaleString("en-US")}</p>
                </div>
                <div className="rounded-[16px] p-4 text-center bg-emerald-50 border border-emerald-100 shadow-sm">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">মোট কালেক্ট</p>
                  <p className="text-[20px] font-black text-emerald-600 tabular-nums">৳{totalCollected.toLocaleString("en-US")}</p>
                </div>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-8 h-8 border-[3px] border-slate-200 border-t-indigo-600 rounded-full" />
                </div>
              ) : payments.length === 0 ? (
                <div className="rounded-[16px] py-14 text-center bg-slate-50 border border-slate-100">
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Banknote size={24} className="text-slate-400 stroke-[1.5px]" />
                  </div>
                  <p className="text-[14px] font-bold text-slate-600 mb-1">কোনো রেকর্ড নেই</p>
                  <p className="text-[13px] text-slate-400">এখনো কোনো পেমেন্ট রেকর্ড যোগ করা হয়নি</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {paymentDateList.map(([dateLabel, dayPayments]) => {
                    const dayTotal = dayPayments.reduce((s, p) => s + p.amount, 0);
                    return (
                      <div key={dateLabel} className="rounded-[16px] overflow-hidden border border-slate-200 shadow-sm">
                        {/* Date header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-500" />
                            <span className="text-[13px] font-bold text-slate-800">{dateLabel}</span>
                          </div>
                          <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${dayTotal >= 0 ? "bg-emerald-100/50 text-emerald-700" : "bg-rose-100/50 text-rose-700"}`}>
                            {dayTotal >= 0 ? `৳${dayTotal.toLocaleString("en-US")}` : `- ৳${Math.abs(dayTotal).toLocaleString("en-US")}`}
                          </span>
                        </div>
                        {/* Payment entries */}
                        {dayPayments.map((p, i) => {
                          const isDebit = p.amount < 0;
                          return (
                          <div key={p._id} className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <div>
                              <p className={`text-[14px] font-bold ${isDebit ? "text-rose-600" : "text-emerald-600"}`}>
                                {isDebit ? `৳${Math.abs(p.amount).toLocaleString("en-US")} বকেয়া যোগ` : `৳${p.amount.toLocaleString("en-US")} কালেক্ট`}
                              </p>
                              <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                                {new Date(p.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                                {p.note && <span className="text-slate-400"> · {p.note}</span>}
                                {p.collectedBy && p.collectedBy !== "unknown" && <span className="text-slate-400"> · {p.collectedBy}</span>}
                              </p>
                            </div>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm shrink-0 ${isDebit ? "bg-rose-50 border border-rose-100" : "bg-emerald-50 border border-emerald-100"}`}>
                              {isDebit ? <Banknote size={16} className="text-rose-500" strokeWidth={2.5}/> : <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={2.5}/>}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {collectCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-[18px] font-bold text-slate-900">বাকি কালেক্ট</h3>
              <button onClick={() => setCollectCustomer(null)} className="w-9 h-9 flex items-center justify-center rounded-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><X size={20} strokeWidth={2} /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5 p-4 rounded-[16px] bg-rose-50 border border-rose-100/50 shadow-sm">
                <div className="w-12 h-12 rounded-[14px] bg-white border border-rose-100 flex items-center justify-center shadow-sm">
                  <User size={20} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-slate-900 leading-tight">{collectCustomer.name}</p>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">{collectCustomer.phone}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[20px] font-black text-rose-600 tabular-nums">৳{collectCustomer.totalDue.toLocaleString("en-US")}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mt-0.5">মোট বাকি</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">কত টাকা কালেক্ট করছেন?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input type="number" value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    placeholder="টাকার পরিমাণ লিখুন"
                    min={0} max={collectCustomer.totalDue}
                    className="w-full h-12 pl-9 pr-4 rounded-[14px] text-[16px] font-black outline-none bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900 placeholder:text-slate-300 placeholder:font-normal tabular-nums shadow-sm" />
                </div>
              </div>

              {Number(collectAmount) > 0 && (
                <div className="mb-6 p-4 rounded-[16px] bg-emerald-50 border border-emerald-100 shadow-sm">
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="font-semibold text-slate-600">বর্তমান বাকি</span>
                    <span className="font-bold text-rose-600 tabular-nums">৳{collectCustomer.totalDue.toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between text-[13px] mb-3">
                    <span className="font-semibold text-slate-600">কালেক্ট</span>
                    <span className="font-bold text-emerald-600 tabular-nums">- ৳{Number(collectAmount).toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between text-[14px] pt-3 border-t border-emerald-200/60">
                    <span className="font-bold text-slate-800">অবশিষ্ট বাকি</span>
                    <span className={`font-black tabular-nums ${collectCustomer.totalDue - Number(collectAmount) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      ৳{(collectCustomer.totalDue - Number(collectAmount)).toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
              )}

              <button onClick={handleCollect} disabled={collecting}
                className="w-full h-12 rounded-[14px] text-[15px] font-bold text-white shadow-[0_4px_20px_-4px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 cursor-pointer">
                {collecting ? (
                   "সংরক্ষণ হচ্ছে..."
                ) : (
                  <>
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                    কালেক্ট কনফার্ম
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
