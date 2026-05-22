"use client";

import { useEffect, useState } from "react";
import { Calendar, Package, ChevronDown, Truck, Banknote, ShoppingBag, BarChart3, TrendingUp, TrendingDown, CreditCard, Trash2, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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
  orderCollectionAmount: number;
  orderCount: number;
  createdBy: string;
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
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ summaryId: string; orderId?: string; label: string } | null>(null);
  const [editProduct, setEditProduct] = useState<{ summaryId: string; productName: string; qty: number; avgPrice: number } | null>(null);
  const [editQty, setEditQty] = useState<number | string>("");

  const loadData = (date?: string) => {
    const d = date || selectedDate;
    Promise.all([
      fetch("/api/dashboard/summary").then((r) => r.json()),
      fetch(`/api/dashboard/payments?date=${d}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([summaryData, paymentsData, authData]) => {
      if (authData?.user) setCurrentUser(authData.user);
      if (Array.isArray(summaryData)) {
        setSummaries(summaryData);
        const daySummary = summaryData.find((s: Summary) => s.date === d);
        const summaryAmount = daySummary ? daySummary.totalAmount : 0;
        const orderCollection = daySummary ? daySummary.orderCollectionAmount : 0;
        const dueCollection = Array.isArray(paymentsData)
          ? paymentsData.reduce((s: number, p: { amount: number }) => s + (p.amount || 0), 0)
          : 0;
        setTodayStats({ summaryAmount, orderCollection, dueCollection });
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setLoading(true);
    loadData(newDate);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      let url = `/api/dashboard/summary?id=${deleteConfirm.summaryId}`;
      if (deleteConfirm.orderId) url += `&orderId=${deleteConfirm.orderId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "ডিলিট ব্যর্থ");
        return;
      }
      toast.success(deleteConfirm.orderId ? "অর্ডার সামারি থেকে সরানো হয়েছে" : "সামারি ডিলিট হয়েছে");
      setDeleteConfirm(null);
      loadData(selectedDate);
    } catch { toast.error("ডিলিট ব্যর্থ"); }
  };

  const handleEditQuantity = async () => {
    if (!editProduct) return;
    const qty = Number(editQty) || 0;
    if (qty < 1) { toast.error("পরিমাণ ১ এর কম হতে পারে না"); return; }
    try {
      const res = await fetch("/api/dashboard/summary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryId: editProduct.summaryId,
          productName: editProduct.productName,
          newQuantity: qty,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("পরিমাণ আপডেট হয়েছে");
      setEditProduct(null);
      loadData(selectedDate);
    } catch { toast.error("আপডেট ব্যর্থ"); }
  };

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

  const selectedDateLabel = (() => {
    const [y, m, d] = selectedDate.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("bn-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  })();

  const totalCollection = todayStats.orderCollection + todayStats.dueCollection;
  const difference = totalCollection - todayStats.summaryAmount;
  const isAdmin = currentUser?.role === "admin";
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-[3px] border-violet-100"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-violet-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-b-fuchsia-400 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }}></div>
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">সামারি লোড হচ্ছে...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      {/* Hero Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 border border-violet-100/50 overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-100/30 blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-fuchsia-100/20 blur-2xl"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              সামারি
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">তারিখ ভিত্তিক অর্ডার সামারি ও বিশ্লেষণ</p>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white rounded-2xl border border-violet-200/60 shadow-lg shadow-violet-100/30 px-4 py-3 hover:shadow-xl hover:shadow-violet-100/40 transition-all duration-300">
              <Calendar size={18} className="text-violet-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer w-[140px]"
              />
            </div>
          </div>
        </div>

        {/* Date Badge */}
        <div className="relative mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-violet-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
          <span className="text-xs font-bold text-gray-600">{selectedDateLabel}</span>
        </div>
      </motion.div>

      {/* Stats Grid - Bento Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8"
      >

        {/* Summary Amount - spans 2 cols on lg */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          className="col-span-2 lg:col-span-1 relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-violet-50 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-fuchsia-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <BarChart3 size={15} className="text-violet-600" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">সামারি</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">
              ৳{todayStats.summaryAmount.toLocaleString("en-US")}
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">সিলেক্টেড অর্ডারের মোট</p>
          </div>
        </motion.div>

        {/* Order Collection */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          className="relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-teal-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ShoppingBag size={15} className="text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">অর্ডার আদায়</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
              ৳{todayStats.orderCollection.toLocaleString("en-US")}
            </p>
          </div>
        </motion.div>

        {/* Due Collection */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          className="relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-amber-50 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <CreditCard size={15} className="text-amber-600" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">বাকি আদায়</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums">
              ৳{todayStats.dueCollection.toLocaleString("en-US")}
            </p>
          </div>
        </motion.div>

        {/* Total Collection */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          className="relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-teal-50 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.03] to-cyan-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <Banknote size={15} className="text-teal-600" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মোট আদায়</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 tabular-nums">
              ৳{totalCollection.toLocaleString("en-US")}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[9px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">৳{todayStats.orderCollection.toLocaleString("en-US")}</span>
              <span className="text-[9px] text-gray-300">+</span>
              <span className="text-[9px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">৳{todayStats.dueCollection.toLocaleString("en-US")}</span>
            </div>
          </div>
        </motion.div>

        {/* Difference */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          className={`relative p-5 rounded-2xl bg-white border shadow-sm transition-all duration-300 group overflow-hidden ${difference >= 0 ? "border-emerald-100 hover:shadow-lg hover:shadow-emerald-50" : "border-rose-100 hover:shadow-lg hover:shadow-rose-50"}`}
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${difference >= 0 ? "bg-gradient-to-br from-emerald-500/[0.03] to-green-500/[0.03]" : "bg-gradient-to-br from-rose-500/[0.03] to-pink-500/[0.03]"}`}></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${difference >= 0 ? "bg-emerald-100" : "bg-rose-100"}`}>
                {difference >= 0 ? <TrendingUp size={15} className="text-emerald-600" /> : <TrendingDown size={15} className="text-rose-600" />}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">পার্থক্য</span>
            </div>
            <p className={`text-xl sm:text-2xl font-black tabular-nums ${difference >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {difference >= 0 ? "+" : ""}৳{difference.toLocaleString("en-US")}
            </p>
            <p className={`text-[9px] font-medium mt-1 ${difference >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
              {difference > 0 ? "বেশি আদায়" : difference < 0 ? "কম আদায়" : "সমান"}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Section Title */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500"></div>
        <h2 className="text-lg font-bold text-gray-800">তারিখ ভিত্তিক সামারি</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
      </div>

      {/* Summary List */}
      {summaries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 flex flex-col items-center justify-center text-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center mb-5 shadow-inner">
            <BarChart3 size={36} strokeWidth={1.5} className="text-violet-400" />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-2">কোনো সামারি নেই</p>
          <p className="text-sm text-gray-400 max-w-sm">অর্ডার পেইজ থেকে অর্ডার সিলেক্ট করে সামারিতে পাঠান</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.08 }}
          className="space-y-4"
        >
          {summaries.map((summary) => {
            const isExpanded = expandedId === summary._id;
            const productMap: Record<string, { name: string; qty: number; total: number }> = {};
            summary.orders.forEach((o) => {
              o.items.forEach((item) => {
                const key = item.productName;
                if (!productMap[key]) productMap[key] = { name: item.productName, qty: 0, total: 0 };
                productMap[key].qty += item.quantity;
                productMap[key].total += item.total;
              });
            });
            const productList = Object.values(productMap).sort((a, b) => b.total - a.total);

            return (
              <motion.div
                key={summary._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={() => toggleExpand(summary._id)} className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 text-left cursor-pointer">
                      {/* Date Icon */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-50 flex flex-col items-center justify-center shrink-0 border border-violet-200/50">
                        <span className="text-[10px] font-bold text-violet-500 uppercase leading-none">
                          {new Date(Number(summary.date.split("-")[0]), Number(summary.date.split("-")[1]) - 1, Number(summary.date.split("-")[2])).toLocaleDateString("bn-BD", { weekday: "short" })}
                        </span>
                        <span className="text-lg font-black text-violet-700 leading-tight">
                          {new Date(Number(summary.date.split("-")[0]), Number(summary.date.split("-")[1]) - 1, Number(summary.date.split("-")[2])).toLocaleDateString("bn-BD", { day: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] sm:text-[15px] font-bold text-gray-800 break-words">{formatDate(summary.date)}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                            <ShoppingBag size={10} /> {summary.orderCount} অর্ডার
                          </span>
                          {isAdmin && summary.createdBy && (
                            <span className="text-[11px] font-medium text-gray-400">· {summary.createdBy}</span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Right side stats & actions */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className="hidden sm:flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">সামারি</p>
                          <p className="text-lg font-black text-gray-900 tabular-nums leading-tight">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100"></div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-emerald-500 uppercase">ডেলিভারড</p>
                          <p className="text-lg font-black text-emerald-600 tabular-nums leading-tight">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                        </div>
                      </div>
                      {(isAdmin || summary.date === todayStr) && (
                        <button
                          onClick={() => setDeleteConfirm({ summaryId: summary._id, label: formatDate(summary.date) })}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          title="সামারি ডিলিট"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(summary._id)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 cursor-pointer ${isExpanded ? "bg-violet-50 border-violet-200 rotate-180" : "bg-gray-50 border-gray-200"}`}
                      >
                        <ChevronDown size={16} className={isExpanded ? "text-violet-600" : "text-gray-400"} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile stats row */}
                  <div className="flex sm:hidden items-center gap-2 mt-3">
                    <div className="flex-1 py-2 px-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">সামারি</p>
                      <p className="text-sm font-black text-gray-900 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                    </div>
                    <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-[9px] font-bold text-emerald-500 uppercase">ডেলিভারড</p>
                      <p className="text-sm font-black text-emerald-600 tabular-nums">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-6 border-t border-gray-100">
                        {/* Mini KPI Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 mb-6">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">মোট বিল</p>
                            <p className="text-base font-black text-gray-900 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                            <p className="text-[9px] font-bold text-emerald-500 uppercase mb-1">পরিশোধ</p>
                            <p className="text-base font-black text-emerald-600 tabular-nums">৳{summary.totalPaid.toLocaleString("en-US")}</p>
                          </div>
                          <div className={`p-3 rounded-xl border ${summary.totalDue > 0 ? "bg-gradient-to-br from-rose-50 to-white border-rose-100" : "bg-gradient-to-br from-gray-50 to-white border-gray-100"}`}>
                            <p className={`text-[9px] font-bold uppercase mb-1 ${summary.totalDue > 0 ? "text-rose-500" : "text-gray-400"}`}>বাকি</p>
                            <p className={`text-base font-black tabular-nums ${summary.totalDue > 0 ? "text-rose-500" : "text-gray-900"}`}>৳{summary.totalDue.toLocaleString("en-US")}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                            <p className="text-[9px] font-bold text-blue-500 uppercase mb-1">ডেলিভারড</p>
                            <p className="text-base font-black text-blue-600 tabular-nums">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                          </div>
                        </div>

                        {/* Product Breakdown - Table Style */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Package size={14} className="text-violet-500" />
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">পণ্য ভিত্তিক বিবরণ</h4>
                          </div>
                          <div className="rounded-2xl border border-gray-100 overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                              <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase">#</div>
                              <div className="col-span-5 text-[9px] font-bold text-gray-400 uppercase">পণ্য</div>
                              <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase text-center">পরিমাণ</div>
                              <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase text-right">দর</div>
                              <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase text-right">মোট</div>
                            </div>
                            {/* Table Body */}
                            {productList.map((p, idx) => {
                              const avgPrice = p.qty > 0 ? Math.round(p.total / p.qty) : 0;
                              return (
                                <div
                                  key={idx}
                                  className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-violet-50/30 transition-colors group"
                                >
                                  <div className="col-span-1 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-violet-100 flex items-center justify-center text-[10px] font-bold text-gray-500 group-hover:text-violet-600 transition-colors">{idx + 1}</span>
                                  </div>
                                  <div className="col-span-5 flex items-center">
                                    <p className="text-[13px] font-semibold text-gray-800 truncate">{p.name}</p>
                                  </div>
                                  <div className="col-span-2 flex items-center justify-center">
                                    <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">{p.qty} টি</span>
                                  </div>
                                  <div className="col-span-2 flex items-center justify-end">
                                    <span className="text-xs font-medium text-gray-500">৳{avgPrice.toLocaleString("en-US")}</span>
                                  </div>
                                  <div className="col-span-2 flex items-center justify-end">
                                    <span className="text-sm font-bold text-gray-900 tabular-nums">৳{p.total.toLocaleString("en-US")}</span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Total Row */}
                            {productList.length > 0 && (
                              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-t border-violet-100">
                                <div className="col-span-1"></div>
                                <div className="col-span-5 flex items-center">
                                  <span className="text-xs font-bold text-violet-700 uppercase">সর্বমোট</span>
                                </div>
                                <div className="col-span-2 flex items-center justify-center">
                                  <span className="text-xs font-black text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200 shadow-sm">
                                    {productList.reduce((s, p) => s + p.qty, 0)} টি
                                  </span>
                                </div>
                                <div className="col-span-2"></div>
                                <div className="col-span-2 flex items-center justify-end">
                                  <span className="text-base font-black text-violet-700 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order List */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <ShoppingBag size={14} className="text-violet-500" />
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">অর্ডার তালিকা ({summary.orderCount} টি)</h4>
                          </div>
                          <div className="space-y-2">
                            {summary.orders.map((o, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-100 hover:bg-violet-50/20 transition-all group">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center shrink-0 border border-violet-200/50">
                                  <span className="text-[11px] font-black text-violet-600">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-bold text-gray-800 truncate">{o.customerName}</p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    {o.orderNumber || "—"} · {o.items.length} পণ্য
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <p className="text-[13px] font-black text-gray-900 tabular-nums">৳{o.totalAmount.toLocaleString("en-US")}</p>
                                    {o.dueAmount > 0 && (
                                      <p className="text-[10px] font-bold text-rose-500 mt-0.5">বাকি ৳{o.dueAmount.toLocaleString("en-US")}</p>
                                    )}
                                  </div>
                                  {(isAdmin || summary.date === todayStr) && (
                                    <button
                                      onClick={() => setDeleteConfirm({ summaryId: summary._id, orderId: o.orderId, label: o.customerName })}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                                      title="সামারি থেকে সরান"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring" as const, stiffness: 350, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center mx-auto mb-5 border border-rose-200/50">
                  <Trash2 size={28} className="text-rose-500" strokeWidth={1.8} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">ডিলিট নিশ্চিত করুন</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {deleteConfirm.orderId
                    ? `"${deleteConfirm.label}" কে সামারি থেকে সরাতে চান?`
                    : `"${deleteConfirm.label}" সামারি ডিলিট করতে চান?`}
                </p>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-4 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  ডিলিট করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
