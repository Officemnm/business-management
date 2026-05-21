"use client";

import { useEffect, useState } from "react";
import { Calendar, Package, ChevronDown, Truck, Banknote, ShoppingBag, BarChart3, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SummaryItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SummaryOrder {
  orderId: string;
  orderNumber?: string;
  customerName: string;
  items: SummaryItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

interface Summary {
  _id: string;
  date: string;
  orders: SummaryOrder[];
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  totalDeliveredAmount: number;
  orderCount: number;
  createdAt: string;
}

interface TodayStats {
  summaryAmount: number;
  orderCollection: number;
  dueCollection: number;
}

export default function SummaryPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats>({ summaryAmount: 0, orderCollection: 0, dueCollection: 0 });

  useEffect(() => {
    // Get today's date in BD timezone
    const now = new Date();
    const bdDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(now);

    Promise.all([
      fetch("/api/dashboard/summary").then((r) => r.json()),
      fetch(`/api/dashboard/payments?date=${bdDateStr}`).then((r) => r.json()),
    ]).then(([summaryData, paymentsData]) => {
      if (Array.isArray(summaryData)) {
        setSummaries(summaryData);

        // Find today's summary
        const todaySummary = summaryData.find((s: Summary) => s.date === bdDateStr);
        const summaryAmount = todaySummary ? todaySummary.totalAmount : 0;
        const orderCollection = todaySummary ? todaySummary.totalPaid : 0;

        // Due collection from payments today
        const dueCollection = Array.isArray(paymentsData)
          ? paymentsData.reduce((s: number, p: { amount: number }) => s + (p.amount || 0), 0)
          : 0;

        setTodayStats({ summaryAmount, orderCollection, dueCollection });
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("bn-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  };

  const todayDateLabel = (() => {
    const now = new Date();
    return now.toLocaleDateString("bn-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
      timeZone: "Asia/Dhaka",
    });
  })();

  // Calculated values
  const totalCollection = todayStats.orderCollection + todayStats.dueCollection;
  const difference = totalCollection - todayStats.summaryAmount;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-slate-800 animate-spin"></div>
          <p className="text-[13px] font-medium text-slate-500 tracking-wide">লোড হচ্ছে...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">সামারি</h1>
          <p className="text-[14px] font-medium text-slate-500 mt-1">
            তারিখ ভিত্তিক অর্ডার সামারি
          </p>
        </div>
      </div>

      {/* Today's Date Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-9 h-9 rounded-[10px] bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Calendar size={16} className="text-indigo-600" />
        </div>
        <p className="text-[15px] font-bold text-slate-800">{todayDateLabel}</p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Today's Summary Amount */}
        <div className="bg-white rounded-[18px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">আজকের সামারি</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
              <BarChart3 size={16} strokeWidth={2.2} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-[26px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            ৳{todayStats.summaryAmount.toLocaleString("en-US")}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-2">পেন্ডিং অর্ডারের মোট</p>
        </div>

        {/* Card 2: Order Collection (নগদ আদায়) */}
        <div className="bg-white rounded-[18px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">অর্ডার থেকে আদায়</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100">
              <ShoppingBag size={16} strokeWidth={2.2} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-[26px] font-black text-emerald-600 leading-none tabular-nums tracking-tight">
            ৳{todayStats.orderCollection.toLocaleString("en-US")}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-2">অর্ডারে নগদ পরিশোধ</p>
        </div>

        {/* Card 3: Due Collection (বাকি থেকে আদায়) */}
        <div className="bg-white rounded-[18px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">বাকি থেকে আদায়</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-100">
              <CreditCard size={16} strokeWidth={2.2} className="text-amber-600" />
            </div>
          </div>
          <p className="text-[26px] font-black text-amber-600 leading-none tabular-nums tracking-tight">
            ৳{todayStats.dueCollection.toLocaleString("en-US")}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-2">বকেয়া থেকে কালেক্ট</p>
        </div>
      </div>

      {/* Bottom 2 Cards: Total Collection & Difference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Collection */}
        <div className="bg-white rounded-[18px] p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">মোট আদায়</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100">
              <Banknote size={16} strokeWidth={2.2} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-[28px] font-black text-slate-900 leading-none tabular-nums tracking-tight">
            ৳{totalCollection.toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-3 mt-3 text-[12px] font-medium text-slate-500">
            <span>নগদ: ৳{todayStats.orderCollection.toLocaleString("en-US")}</span>
            <span className="text-slate-300">+</span>
            <span>বাকি: ৳{todayStats.dueCollection.toLocaleString("en-US")}</span>
          </div>
        </div>

        {/* Difference from Summary */}
        <div className={`bg-white rounded-[18px] p-5 shadow-sm border ${difference >= 0 ? "border-emerald-200/60" : "border-rose-200/60"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">সামারি থেকে পার্থক্য</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${difference >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
              {difference >= 0 ? (
                <TrendingUp size={16} strokeWidth={2.2} className="text-emerald-600" />
              ) : (
                <TrendingDown size={16} strokeWidth={2.2} className="text-rose-600" />
              )}
            </div>
          </div>
          <p className={`text-[28px] font-black leading-none tabular-nums tracking-tight ${difference >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {difference >= 0 ? "+" : ""}৳{difference.toLocaleString("en-US")}
          </p>
          <p className={`text-[12px] font-medium mt-2 ${difference >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {difference > 0 ? "সামারির চেয়ে বেশি আদায় হয়েছে" : difference < 0 ? "সামারির চেয়ে কম আদায় হয়েছে" : "সামারি ও আদায় সমান"}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-slate-200/60"></div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">তারিখ ভিত্তিক সামারি</span>
        <div className="h-px flex-1 bg-slate-200/60"></div>
      </div>

      {/* Summary List */}
      {summaries.length === 0 ? (
        <div className="bg-white rounded-[20px] py-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-200/60">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
            <BarChart3 size={28} strokeWidth={1.5} className="text-slate-400" />
          </div>
          <p className="text-[15px] font-bold text-slate-900 mb-1">কোনো সামারি নেই</p>
          <p className="text-[13px] font-medium text-slate-500">অর্ডার পেইজ থেকে অর্ডার সিলেক্ট করে সামারিতে পাঠান</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {summaries.map((summary) => {
            const isExpanded = expandedId === summary._id;

            // Aggregate products across all orders in this summary
            const productMap: Record<string, { name: string; qty: number; total: number }> = {};
            summary.orders.forEach((o) => {
              o.items.forEach((item) => {
                const key = item.productName;
                if (!productMap[key]) {
                  productMap[key] = { name: item.productName, qty: 0, total: 0 };
                }
                productMap[key].qty += item.quantity;
                productMap[key].total += item.total;
              });
            });
            const productList = Object.values(productMap).sort((a, b) => b.total - a.total);

            return (
              <div key={summary._id} className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm overflow-hidden">
                {/* Summary Header - Clickable */}
                <button
                  onClick={() => toggleExpand(summary._id)}
                  className="w-full flex items-center gap-4 p-5 sm:p-6 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-[14px] bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Calendar size={20} className="text-indigo-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-slate-900 truncate">
                      {formatDate(summary.date)}
                    </p>
                    <p className="text-[12px] font-medium text-slate-500 mt-1">
                      {summary.orderCount} টি অর্ডার
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">সামারি</p>
                      <p className="text-[18px] font-black text-slate-900 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">ডেলিভারড</p>
                      <p className="text-[18px] font-black text-emerald-600 tabular-nums">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${isExpanded ? "rotate-180 bg-slate-100" : "bg-slate-50"}`}>
                      <ChevronDown size={18} className="text-slate-500" />
                    </div>
                  </div>
                </button>

                {/* Mobile stats row */}
                <div className="flex sm:hidden items-center gap-3 px-5 pb-4 -mt-2">
                  <div className="flex-1 p-2.5 rounded-[10px] bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">সামারি</p>
                    <p className="text-[14px] font-black text-slate-900 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                  </div>
                  <div className="flex-1 p-2.5 rounded-[10px] bg-emerald-50 border border-emerald-100 text-center">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">ডেলিভারড</p>
                    <p className="text-[14px] font-black text-emerald-600 tabular-nums">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 border-t border-slate-100">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 mb-6">
                          <div className="p-3.5 rounded-[14px] bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                              <ShoppingBag size={14} className="text-slate-500" />
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">মোট বিল</p>
                            </div>
                            <p className="text-[18px] font-black text-slate-900 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                          </div>
                          <div className="p-3.5 rounded-[14px] bg-emerald-50 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Banknote size={14} className="text-emerald-500" />
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">পরিশোধ</p>
                            </div>
                            <p className="text-[18px] font-black text-emerald-700 tabular-nums">৳{summary.totalPaid.toLocaleString("en-US")}</p>
                          </div>
                          <div className={`p-3.5 rounded-[14px] border ${summary.totalDue > 0 ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Banknote size={14} className={summary.totalDue > 0 ? "text-rose-500" : "text-slate-500"} />
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${summary.totalDue > 0 ? "text-rose-500" : "text-slate-500"}`}>বাকি</p>
                            </div>
                            <p className={`text-[18px] font-black tabular-nums ${summary.totalDue > 0 ? "text-rose-600" : "text-slate-900"}`}>৳{summary.totalDue.toLocaleString("en-US")}</p>
                          </div>
                          <div className="p-3.5 rounded-[14px] bg-blue-50 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck size={14} className="text-blue-500" />
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">ডেলিভারড</p>
                            </div>
                            <p className="text-[18px] font-black text-blue-700 tabular-nums">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                          </div>
                        </div>

                        {/* Product breakdown table */}
                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                          <Package size={14} className="text-slate-400" /> পণ্য ভিত্তিক বিবরণ
                        </h4>
                        <div className="rounded-[14px] overflow-hidden border border-slate-200/60 bg-white shadow-sm">
                          <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border-b border-slate-200/60">
                            <span className="col-span-6">পণ্য</span>
                            <span className="col-span-3 text-center">পরিমাণ</span>
                            <span className="col-span-3 text-right">মোট</span>
                          </div>
                          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            {productList.map((p, idx) => (
                              <div key={idx} className="grid grid-cols-12 px-4 py-3 items-center border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <span className="col-span-6 text-[13px] font-bold text-slate-900 truncate pr-2">{p.name}</span>
                                <span className="col-span-3 text-center text-[13px] font-semibold text-slate-600">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded-md">{p.qty}</span>
                                </span>
                                <span className="col-span-3 text-right text-[14px] font-black text-slate-900 tabular-nums">৳{p.total.toLocaleString("en-US")}</span>
                              </div>
                            ))}
                          </div>
                          {productList.length > 0 && (
                            <div className="grid grid-cols-12 px-4 py-3 items-center border-t-2 border-slate-100 bg-slate-50/80">
                              <span className="col-span-6 text-[12px] font-bold uppercase tracking-wider text-slate-600">সর্বমোট</span>
                              <span className="col-span-3 text-center text-[13px] font-black text-indigo-700 bg-indigo-100 rounded-md py-0.5 mx-auto px-2">
                                {productList.reduce((s, p) => s + p.qty, 0)}
                              </span>
                              <span className="col-span-3 text-right text-[15px] font-black text-indigo-600 tabular-nums">
                                ৳{summary.totalAmount.toLocaleString("en-US")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Order list */}
                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-600 mt-6 mb-3 flex items-center gap-2">
                          <ShoppingBag size={14} className="text-slate-400" /> অর্ডার তালিকা ({summary.orderCount} টি)
                        </h4>
                        <div className="flex flex-col gap-2">
                          {summary.orders.map((o, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-[12px] bg-slate-50 border border-slate-100">
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-900 truncate">{o.customerName}</p>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                  {o.orderNumber || "—"} · {o.items.length} পণ্য
                                </p>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <p className="text-[14px] font-black text-slate-900 tabular-nums">৳{o.totalAmount.toLocaleString("en-US")}</p>
                                {o.dueAmount > 0 && (
                                  <p className="text-[11px] font-bold text-rose-500 mt-0.5">বাকি ৳{o.dueAmount.toLocaleString("en-US")}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
