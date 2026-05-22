"use client";

import { useEffect, useState } from "react";
import { Calendar, Package, ChevronDown, Truck, Banknote, ShoppingBag, BarChart3, TrendingUp, TrendingDown, CreditCard, Trash2, X, Pencil, Layers, ArrowUpRight, ArrowDownRight, CircleDot } from "lucide-react";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

const cardHover = {
  scale: 1.015,
  transition: { type: "spring" as const, stiffness: 400, damping: 20 }
};

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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-[3px] border-gray-100 border-t-indigo-400 animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-b-violet-300 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">লোড হচ্ছে...</p>
            <p className="text-xs text-gray-400 mt-1">সামারি ডেটা প্রস্তুত করা হচ্ছে</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-10 space-y-7"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/50 flex items-center justify-center shadow-sm">
              <Layers size={18} className="text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">সামারি</h1>
              <p className="text-xs font-medium text-gray-400 mt-0.5">তারিখ ভিত্তিক অর্ডার সামারি</p>
            </div>
          </div>
        </div>
        {/* Date Picker */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] px-4 py-2.5 hover:border-indigo-200 hover:shadow-[0_4px_16px_-4px_rgba(99,102,241,0.12)] transition-all duration-300">
            <Calendar size={16} className="text-indigo-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-sm font-semibold text-gray-700 outline-none bg-transparent cursor-pointer w-[140px]"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Selected Date Badge */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-50/80 to-violet-50/60 border border-indigo-100/40">
          <CircleDot size={14} className="text-indigo-400" />
          <p className="text-sm font-semibold text-gray-700">{selectedDateLabel}</p>
        </div>
      </motion.div>

      {/* Top 3 KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Summary Amount */}
        <motion.div whileHover={cardHover} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100/80 hover:border-indigo-100 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.1)] transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">সামারি এমাউন্ট</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100/60 shadow-sm">
                <BarChart3 size={15} strokeWidth={2.2} className="text-indigo-500" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-800 leading-none tabular-nums tracking-tight">
              ৳{todayStats.summaryAmount.toLocaleString("en-US")}
            </p>
            <p className="text-[11px] font-medium text-gray-400 mt-2.5">সিলেক্টেড অর্ডারের মোট</p>
          </div>
        </motion.div>

        {/* Order Collection */}
        <motion.div whileHover={cardHover} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100/80 hover:border-emerald-100 hover:shadow-[0_8px_30px_-8px_rgba(16,185,129,0.1)] transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50/50 to-transparent rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">অর্ডার থেকে আদায়</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100/60 shadow-sm">
                <ShoppingBag size={15} strokeWidth={2.2} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 leading-none tabular-nums tracking-tight">
              ৳{todayStats.orderCollection.toLocaleString("en-US")}
            </p>
            <p className="text-[11px] font-medium text-gray-400 mt-2.5">অর্ডারে নগদ পরিশোধ</p>
          </div>
        </motion.div>

        {/* Due Collection */}
        <motion.div whileHover={cardHover} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100/80 hover:border-amber-100 hover:shadow-[0_8px_30px_-8px_rgba(245,158,11,0.1)] transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-50/50 to-transparent rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">বাকি থেকে আদায়</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100/60 shadow-sm">
                <CreditCard size={15} strokeWidth={2.2} className="text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-amber-600 leading-none tabular-nums tracking-tight">
              ৳{todayStats.dueCollection.toLocaleString("en-US")}
            </p>
            <p className="text-[11px] font-medium text-gray-400 mt-2.5">বকেয়া থেকে কালেক্ট</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom 2 Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Collection */}
        <motion.div whileHover={cardHover} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100/80 hover:border-emerald-100 hover:shadow-[0_8px_30px_-8px_rgba(16,185,129,0.08)] transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50/40 to-transparent rounded-bl-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">মোট আদায়</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/60 shadow-sm">
                <Banknote size={15} strokeWidth={2.2} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-[26px] font-extrabold text-gray-800 leading-none tabular-nums tracking-tight">
              ৳{totalCollection.toLocaleString("en-US")}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">নগদ: ৳{todayStats.orderCollection.toLocaleString("en-US")}</span>
              <span className="text-gray-300 text-xs">+</span>
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">বাকি: ৳{todayStats.dueCollection.toLocaleString("en-US")}</span>
            </div>
          </div>
        </motion.div>

        {/* Difference */}
        <motion.div whileHover={cardHover} className={`group relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.05)] border transition-all duration-300 overflow-hidden ${difference >= 0 ? "border-emerald-100/60 hover:shadow-[0_8px_30px_-8px_rgba(16,185,129,0.1)]" : "border-rose-100/60 hover:shadow-[0_8px_30px_-8px_rgba(244,63,94,0.1)]"}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${difference >= 0 ? "bg-gradient-to-bl from-emerald-50/40 to-transparent" : "bg-gradient-to-bl from-rose-50/40 to-transparent"}`}></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">সামারি থেকে পার্থক্য</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm ${difference >= 0 ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100/60" : "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100/60"}`}>
                {difference >= 0 ? <ArrowUpRight size={15} strokeWidth={2.2} className="text-emerald-500" /> : <ArrowDownRight size={15} strokeWidth={2.2} className="text-rose-500" />}
              </div>
            </div>
            <p className={`text-[26px] font-extrabold leading-none tabular-nums tracking-tight ${difference >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {difference >= 0 ? "+" : ""}৳{difference.toLocaleString("en-US")}
            </p>
            <p className={`text-xs font-medium mt-2.5 ${difference >= 0 ? "text-emerald-500/80" : "text-rose-400"}`}>
              {difference > 0 ? "সামারির চেয়ে বেশি আদায় হয়েছে" : difference < 0 ? "সামারির চেয়ে কম আদায় হয়েছে" : "সামারি ও আদায় সমান"}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 pt-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
          <Layers size={12} className="text-gray-300" />
          তারিখ ভিত্তিক সামারি
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </motion.div>

      {/* Summary List */}
      {summaries.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-3xl py-20 flex flex-col items-center justify-center text-center shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-gray-100/80">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center mb-5 border border-gray-100 shadow-sm"
          >
            <BarChart3 size={32} strokeWidth={1.5} className="text-gray-300" />
          </motion.div>
          <p className="text-base font-bold text-gray-700 mb-1.5">কোনো সামারি নেই</p>
          <p className="text-sm font-medium text-gray-400 max-w-xs">অর্ডার পেইজ থেকে অর্ডার সিলেক্ট করে সামারিতে পাঠান</p>
        </motion.div>
      ) : (

        <div className="flex flex-col gap-4">
          {summaries.map((summary, sIdx) => {
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
                variants={itemVariants}
                layout
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-100/80 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.06)] transition-shadow duration-300"
              >
                {/* Header */}
                <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                  <button onClick={() => toggleExpand(summary._id)} className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 text-left cursor-pointer">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/50 flex items-center justify-center shrink-0 shadow-sm">
                      <Calendar size={17} className="text-indigo-500 sm:hidden" strokeWidth={2} />
                      <Calendar size={19} className="text-indigo-500 hidden sm:block" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] sm:text-[15px] font-bold text-gray-800 break-words">{formatDate(summary.date)}</p>
                      <p className="text-[11px] sm:text-xs font-medium text-gray-400 mt-0.5">
                        {summary.orderCount} টি অর্ডার
                        {isAdmin && summary.createdBy && <span className="ml-2 text-indigo-400 font-semibold">· {summary.createdBy}</span>}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">সামারি</p>
                      <p className="text-[17px] font-extrabold text-gray-800 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">ডেলিভারড</p>
                      <p className="text-[17px] font-extrabold text-emerald-600 tabular-nums">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                    </div>
                    {(isAdmin || summary.date === todayStr) && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteConfirm({ summaryId: summary._id, label: formatDate(summary.date) })}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200"
                        title="সামারি ডিলিট"
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => toggleExpand(summary._id)}
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-200 ${isExpanded ? "bg-indigo-50 border border-indigo-100/50" : "bg-gray-50 border border-gray-100"}`}
                    >
                      <ChevronDown size={16} className={isExpanded ? "text-indigo-500" : "text-gray-400"} />
                    </motion.button>
                  </div>
                </div>

                {/* Mobile stats */}
                <div className="flex sm:hidden items-center gap-2.5 px-4 pb-4 -mt-1">
                  <div className="flex-1 p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100/80 text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">সামারি</p>
                    <p className="text-[14px] font-extrabold text-gray-800 tabular-nums mt-0.5">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                  </div>
                  <div className="flex-1 p-2.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100/60 text-center">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">ডেলিভারড</p>
                    <p className="text-[14px] font-extrabold text-emerald-600 tabular-nums mt-0.5">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-6 border-t border-gray-100/60">

                        {/* KPI Cards inside expanded */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 mb-6">
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-3.5 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100/80">
                            <div className="flex items-center gap-2 mb-2">
                              <ShoppingBag size={13} className="text-gray-400" />
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">মোট বিল</p>
                            </div>
                            <p className="text-lg font-extrabold text-gray-800 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</p>
                          </motion.div>
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-green-50/50 border border-emerald-100/60">
                            <div className="flex items-center gap-2 mb-2">
                              <Banknote size={13} className="text-emerald-400" />
                              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">পরিশোধ</p>
                            </div>
                            <p className="text-lg font-extrabold text-emerald-600 tabular-nums">৳{summary.totalPaid.toLocaleString("en-US")}</p>
                          </motion.div>
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`p-3.5 rounded-xl border ${summary.totalDue > 0 ? "bg-gradient-to-br from-rose-50/80 to-pink-50/50 border-rose-100/60" : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100/80"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Banknote size={13} className={summary.totalDue > 0 ? "text-rose-400" : "text-gray-400"} />
                              <p className={`text-[9px] font-bold uppercase tracking-widest ${summary.totalDue > 0 ? "text-rose-400" : "text-gray-400"}`}>বাকি</p>
                            </div>
                            <p className={`text-lg font-extrabold tabular-nums ${summary.totalDue > 0 ? "text-rose-500" : "text-gray-800"}`}>৳{summary.totalDue.toLocaleString("en-US")}</p>
                          </motion.div>
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/80 to-sky-50/50 border border-blue-100/60">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck size={13} className="text-blue-400" />
                              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">ডেলিভারড</p>
                            </div>
                            <p className="text-lg font-extrabold text-blue-600 tabular-nums">৳{summary.totalDeliveredAmount.toLocaleString("en-US")}</p>
                          </motion.div>
                        </div>

                        {/* Product breakdown */}
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                          <Package size={13} className="text-gray-300" /> পণ্য ভিত্তিক বিবরণ
                        </h4>
                        <div className="rounded-2xl overflow-hidden border border-gray-100/80 bg-white/50 backdrop-blur-sm">
                          <div className="flex flex-col gap-2 p-2">
                            {productList.map((p, idx) => {
                              const avgPrice = p.qty > 0 ? Math.round(p.total / p.qty) : 0;
                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.04 }}
                                  className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-gray-50/80 to-slate-50/40 border border-gray-100/60 group hover:border-indigo-100/60 hover:from-indigo-50/30 hover:to-violet-50/20 transition-all duration-200"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200/60 flex items-center justify-center shrink-0 shadow-sm group-hover:border-indigo-200/60 transition-colors">
                                    <span className="text-[11px] font-extrabold text-gray-500 group-hover:text-indigo-500 transition-colors">{idx + 1}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-gray-800 break-words leading-snug">{p.name}</p>
                                    <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                                      <span className="text-[11px] font-medium text-gray-400">দর: ৳{avgPrice.toLocaleString("en-US")}</span>
                                      <span className="text-gray-200">·</span>
                                      <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100/40">{p.qty} টি</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-[15px] font-extrabold text-gray-800 tabular-nums">৳{p.total.toLocaleString("en-US")}</p>
                                  </div>
                                </motion.div>
                              );
                            })}

                            {productList.length > 0 && (
                              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/80 to-violet-50/60 border border-indigo-100/50">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-wider">সর্বমোট</span>
                                  <span className="text-[12px] font-extrabold text-indigo-600 bg-white/80 px-2.5 py-0.5 rounded-lg border border-indigo-100/50 shadow-sm">
                                    {productList.reduce((s, p) => s + p.qty, 0)} টি
                                  </span>
                                </div>
                                <span className="text-[17px] font-extrabold text-indigo-600 tabular-nums">৳{summary.totalAmount.toLocaleString("en-US")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order list */}
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mt-6 mb-3 flex items-center gap-2">
                          <ShoppingBag size={13} className="text-gray-300" /> অর্ডার তালিকা ({summary.orderCount} টি)
                        </h4>
                        <div className="flex flex-col gap-2">
                          {summary.orders.map((o, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50/60 to-slate-50/30 border border-gray-100/60 group hover:border-indigo-100/50 hover:bg-gradient-to-r hover:from-indigo-50/20 hover:to-violet-50/10 transition-all duration-200"
                            >
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/60 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-extrabold text-gray-500">{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-gray-800 break-words">{o.customerName}</p>
                                <p className="text-[11px] font-medium text-gray-400 mt-0.5 break-words">
                                  {o.orderNumber || "—"} · {o.items.length} পণ্য
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <p className="text-[13px] sm:text-[14px] font-extrabold text-gray-800 tabular-nums">৳{o.totalAmount.toLocaleString("en-US")}</p>
                                  {o.dueAmount > 0 && (
                                    <p className="text-[10px] sm:text-[11px] font-bold text-rose-400 mt-0.5">বাকি ৳{o.dueAmount.toLocaleString("en-US")}</p>
                                  )}
                                </div>
                                {(isAdmin || summary.date === todayStr) && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setDeleteConfirm({ summaryId: summary._id, orderId: o.orderId, label: o.customerName })}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                                    title="সামারি থেকে সরান"
                                  >
                                    <Trash2 size={13} />
                                  </motion.button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/30 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100/50"
            >
              <div className="flex flex-col items-center justify-center pt-8 pb-4 px-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100/60 flex items-center justify-center mb-5 shrink-0 shadow-sm"
                >
                  <Trash2 size={24} className="text-rose-400" strokeWidth={2} />
                </motion.div>
                <h3 className="text-lg font-extrabold text-gray-800 mb-2">ডিলিট নিশ্চিত করুন</h3>
                <p className="text-sm font-medium text-gray-400 leading-relaxed">
                  {deleteConfirm.orderId
                    ? `"${deleteConfirm.label}" কে সামারি থেকে সরাতে চান?`
                    : `"${deleteConfirm.label}" সামারি ডিলিট করতে চান?`}
                </p>
              </div>
              <div className="flex gap-3 p-6 pt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 h-12 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100/80 hover:bg-gray-200/80 transition-colors border border-gray-200/50"
                >
                  বাতিল
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="flex-1 h-12 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 transition-all shadow-[0_4px_15px_-3px_rgba(244,63,94,0.3)]"
                >
                  ডিলিট করুন
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
