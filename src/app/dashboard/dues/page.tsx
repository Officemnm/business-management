"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Banknote, User, Phone, Calendar, CheckCircle2, History } from "lucide-react";
import toast from "react-hot-toast";

interface Customer { _id: string; name: string; phone: string; totalDue: number; }
interface Payment { _id: string; customer: string; customerName: string; amount: number; note?: string; collectedBy: string; createdAt: string; }

export default function DuesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Collection modal
  const [collectCustomer, setCollectCustomer] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number | string>("");
  const [collecting, setCollecting] = useState(false);

  // History modal per customer — shows payment records
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadCustomers = () => {
    fetch("/api/dashboard/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(data.filter((c: Customer) => c.totalDue > 0)))
      .finally(() => setLoading(false));
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
    const dateKey = new Date(p.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
    if (!paymentsByDate[dateKey]) paymentsByDate[dateKey] = [];
    paymentsByDate[dateKey].push(p);
  });
  const paymentDateList = Object.entries(paymentsByDate);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
    </div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>বাকি তালিকা</h2>
        <div className="h-10 px-4 flex items-center rounded-xl text-sm font-bold" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          মোট বাকি: ৳{totalDue}
        </div>
      </div>

      {/* Customer List */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {customers.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: "#16a34a" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>কোনো বাকি নেই</p>
          </div>
        ) : (
          customers.map((c, idx) => (
            <div key={c._id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: idx > 0 ? "1px solid var(--border-color)" : "none" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef2f2" }}>
                <User size={16} style={{ color: "#dc2626" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <Phone size={9} /> {c.phone}
                </span>
              </div>
              <p className="text-[15px] font-extrabold shrink-0" style={{ color: "#dc2626" }}>৳{c.totalDue}</p>
              {/* History icon */}
              <button onClick={() => { setHistoryCustomer(c); setPayments([]); }}
                className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }} title="অর্ডার হিস্ট্রি">
                <History size={15} style={{ color: "#2563eb" }} />
              </button>
              {/* Collect icon */}
              <button onClick={() => { setCollectCustomer(c); setCollectAmount(""); }}
                className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }} title="টাকা কালেক্ট">
                <Banknote size={15} style={{ color: "#16a34a" }} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Payment History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-[95%] max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
              <div className="flex items-center gap-2">
                <History size={16} style={{ color: "#2563eb" }} />
                <h3 className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>{historyCustomer.name} — পেমেন্ট হিস্ট্রি</h3>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>

            <div className="p-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl p-3 text-center" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>বর্তমান বাকি</p>
                  <p className="text-[18px] font-extrabold" style={{ color: "#dc2626" }}>৳{historyCustomer.totalDue}</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>মোট কালেক্ট</p>
                  <p className="text-[18px] font-extrabold" style={{ color: "#16a34a" }}>৳{totalCollected}</p>
                </div>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
                </div>
              ) : payments.length === 0 ? (
                <div className="rounded-xl py-12 text-center" style={{ background: "var(--bg-input)" }}>
                  <Banknote size={28} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} strokeWidth={1} />
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>এখনো কোনো পেমেন্ট রেকর্ড নেই</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {paymentDateList.map(([dateLabel, dayPayments]) => {
                    const dayTotal = dayPayments.reduce((s, p) => s + p.amount, 0);
                    return (
                      <div key={dateLabel} className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
                        {/* Date header */}
                        <div className="flex items-center justify-between px-3 py-2" style={{ background: "var(--bg-input)" }}>
                          <div className="flex items-center gap-2">
                            <Calendar size={12} style={{ color: "var(--text-muted)" }} />
                            <span className="text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>{dateLabel}</span>
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: "#16a34a" }}>৳{dayTotal}</span>
                        </div>
                        {/* Payment entries */}
                        {dayPayments.map((p, i) => (
                          <div key={p._id} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: i > 0 ? "1px solid var(--border-color)" : "1px solid var(--border-color)" }}>
                            <div>
                              <p className="text-[12px] font-semibold" style={{ color: "#16a34a" }}>৳{p.amount} কালেক্ট</p>
                              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                {new Date(p.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                                {p.collectedBy && ` · ${p.collectedBy}`}
                              </p>
                            </div>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                              <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                            </div>
                          </div>
                        ))}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-[90%] max-w-md rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>বাকি কালেক্ট</h3>
              <button onClick={() => setCollectCustomer(null)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#fef2f2" }}>
                  <User size={18} style={{ color: "#dc2626" }} />
                </div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>{collectCustomer.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{collectCustomer.phone}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[16px] font-extrabold" style={{ color: "#dc2626" }}>৳{collectCustomer.totalDue}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>মোট বাকি</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>কত টাকা কালেক্ট করছেন?</label>
                <input type="number" value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="টাকার পরিমাণ লিখুন"
                  min={0} max={collectCustomer.totalDue}
                  className="w-full h-11 px-4 rounded-xl text-[15px] font-bold outline-none"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>

              {Number(collectAmount) > 0 && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>বর্তমান বাকি</span>
                    <span className="font-bold" style={{ color: "#dc2626" }}>৳{collectCustomer.totalDue}</span>
                  </div>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>কালেক্ট</span>
                    <span className="font-bold" style={{ color: "#16a34a" }}>- ৳{Number(collectAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] pt-1" style={{ borderTop: "1px dashed var(--border-color)" }}>
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>অবশিষ্ট বাকি</span>
                    <span className="font-extrabold" style={{ color: collectCustomer.totalDue - Number(collectAmount) > 0 ? "#dc2626" : "#16a34a" }}>
                      ৳{collectCustomer.totalDue - Number(collectAmount)}
                    </span>
                  </div>
                </div>
              )}

              <button onClick={handleCollect} disabled={collecting}
                className="w-full h-11 rounded-xl text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#66a80f" }}>
                <Banknote size={16} />
                {collecting ? "সংরক্ষণ হচ্ছে..." : "কালেক্ট কনফার্ম"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
