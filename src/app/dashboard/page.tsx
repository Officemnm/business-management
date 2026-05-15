"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Users, Package, CreditCard, Clock, TrendingUp, Truck, CheckCircle2, AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Banknote, Trash2, ArrowUpRight, Activity as ActivityIcon, DollarSign, Wallet, MoreHorizontal } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid } from "recharts";
import { motion, AnimatePresence, Variants } from "framer-motion";
import AnimatedModal from "@/components/ui/AnimatedModal";
import { getBDDateString } from "@/lib/utils";

interface Stats {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  totalDue: number;
  totalCollection: number;
  todayOrders: number;
  todayRevenue: number;
  todayCollection: number;
  todayDelivered: number;
  todayPending: number;
}

interface ChartDay { date: string; revenue: number; orders: number; }

interface Activity {
  _id: string;
  type?: "order" | "payment";
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  itemCount: number;
  status: string;
  deliveryStatus: string;
  createdBy: string;
  createdAt: string;
}

interface PeriodStats {
  revenue: number;
  count: number;
  paid: number;
  due: number;
}

// Minimal Staggered Animation
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Sales detail modal state
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [periodStats, setPeriodStats] = useState<{ [key: string]: PeriodStats }>({});
  const [selectedDate, setSelectedDate] = useState(() => getBDDateString(new Date()));
  const [dateStats, setDateStats] = useState<PeriodStats | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  // Collection detail modal state
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionDate, setCollectionDate] = useState(() => getBDDateString(new Date()));
  const [collectionData, setCollectionData] = useState<{
    orderPaid: number;
    dueCollection: number;
    total: number;
    dateCollections: { _id: string; customerName: string; amount: number; date: string }[];
    orderCollections: any[];
    isAdmin: boolean;
  } | null>(null);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null);
  const [collectionTab, setCollectionTab] = useState<"due" | "order">("due");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setChartData(data.chartData || []);
        setActivity(data.recentActivity || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchPeriodStats = async () => {
    setLoadingPeriods(true);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Start = new Date(today);
    last7Start.setDate(last7Start.getDate() - 6);
    const last30Start = new Date(today);
    last30Start.setDate(last30Start.getDate() - 29);

    const formatDate = (d: Date) => getBDDateString(d);

    try {
      const [todayRes, yesterdayRes, last7Res, last30Res] = await Promise.all([
        fetch(`/api/dashboard/stats?from=${formatDate(today)}&to=${formatDate(today)}`),
        fetch(`/api/dashboard/stats?from=${formatDate(yesterday)}&to=${formatDate(yesterday)}`),
        fetch(`/api/dashboard/stats?from=${formatDate(last7Start)}&to=${formatDate(today)}`),
        fetch(`/api/dashboard/stats?from=${formatDate(last30Start)}&to=${formatDate(today)}`),
      ]);

      const [todayData, yesterdayData, last7Data, last30Data] = await Promise.all([
        todayRes.json(), yesterdayRes.json(), last7Res.json(), last30Res.json(),
      ]);

      setPeriodStats({ today: todayData, yesterday: yesterdayData, last7: last7Data, last30: last30Data });
    } catch {
      // Silent fail
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchDateStats = async (date: string) => {
    try {
      const res = await fetch(`/api/dashboard/stats?from=${date}&to=${date}`);
      const data = await res.json();
      setDateStats(data);
    } catch {
      setDateStats(null);
    }
  };

  const openSalesModal = () => {
    setShowSalesModal(true);
    fetchPeriodStats();
    fetchDateStats(selectedDate);
  };

  const fetchCollectionData = async (date?: string) => {
    setLoadingCollection(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}") as { role?: string };
      const isAdmin = userInfo.role === "admin";
      const targetDate = date || collectionDate;

      const paymentsRes = await fetch(`/api/dashboard/payments?date=${targetDate}`);
      const datePayments = await paymentsRes.json();

      const statsRes = await fetch(`/api/dashboard/stats?from=${targetDate}&to=${targetDate}`);
      const dStats = await statsRes.json();

      const dueCollections = datePayments
        .filter((p: { amount: number }) => p.amount > 0)
        .reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0);

      const dateCollections = datePayments
        .filter((p: { amount: number }) => p.amount > 0)
        .map((p: { _id: string; customerName: string; amount: number; createdAt: string }) => ({
          _id: p._id,
          customerName: p.customerName,
          amount: p.amount,
          date: p.createdAt,
        }));

      const orderPaid = dStats.paid || 0;
      const orderCollections = dStats.paidOrders || [];

      setCollectionData({
        orderPaid,
        dueCollection: dueCollections,
        total: orderPaid + dueCollections,
        dateCollections,
        orderCollections,
        isAdmin,
      });
    } catch {
      setCollectionData(null);
    } finally {
      setLoadingCollection(false);
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!collectionData?.isAdmin) return;
    setDeletingPayment(paymentId);
    try {
      const res = await fetch(`/api/dashboard/payments?id=${paymentId}`, { method: "DELETE" });
      if (res.ok) {
        fetchCollectionData(collectionDate);
      } else {
        alert("ডিলিট করতে সমস্যা হয়েছে");
      }
    } catch {
      alert("ডিলিট করতে সমস্যা হয়েছে");
    } finally {
      setDeletingPayment(null);
    }
  };

  const handleCollectionDateChange = (date: string) => {
    setCollectionDate(date);
    fetchCollectionData(date);
  };

  const openCollectionModal = () => {
    setShowCollectionModal(true);
    fetchCollectionData();
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchDateStats(date);
  };

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

  const todayLabel = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "সুপ্রভাত" : greetHour < 17 ? "শুভ অপরাহ্ণ" : "শুভ সন্ধ্যা";

  const totalRevenue7d = chartData.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalOrders7d = chartData.reduce((s, d) => s + (d.orders || 0), 0);
  const avgRevenue = totalOrders7d > 0 ? Math.round(totalRevenue7d / totalOrders7d) : 0;

  // Premium, ultra-clean card styles
  const cardStyle = "bg-white border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] rounded-[20px] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]";

  return (
    <motion.div 
      className="pb-12 space-y-8 max-w-[1400px] mx-auto font-sans"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Super Clean Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight text-slate-900 leading-tight">
            ড্যাশবোর্ড
          </h1>
          <p className="text-[14px] text-slate-500 mt-1 flex items-center gap-2">
            <span>{greeting}, আজকে</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span> 
            <span>{todayLabel}</span>
          </p>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-full shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[13px] font-medium text-slate-600">আজকের অর্ডার:</p>
            <p className="text-[14px] font-bold text-slate-900">{stats?.todayOrders || 0}</p>
          </div>
        </div>
      </motion.div>

      {/* Main KPI Grid - Apple-like Clean */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Revenue */}
        <div onClick={openSalesModal} className={`${cardStyle} cursor-pointer p-6 flex flex-col justify-between group`}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              <ArrowUpRight size={14} /> ৳{(stats?.todayRevenue || 0).toLocaleString("en-US")}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">মোট বিক্রি</p>
            <p className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-none tabular-nums">
              ৳{(stats?.totalRevenue || 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>

        {/* Collection */}
        <div onClick={openCollectionModal} className={`${cardStyle} cursor-pointer p-6 flex flex-col justify-between group`}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
              <Wallet size={20} className="text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              <ArrowUpRight size={14} /> ৳{(stats?.todayCollection || 0).toLocaleString("en-US")}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">মোট আদায়</p>
            <p className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-none tabular-nums">
              ৳{(stats?.totalCollection || 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>

        {/* Due */}
        <div className={`${cardStyle} p-6 flex flex-col justify-between`}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
              <CreditCard size={20} className="text-rose-600" />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
              <AlertCircle size={14} /> বকেয়া
            </span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">মোট বাকি</p>
            <p className="text-[28px] md:text-[32px] font-bold text-rose-600 tracking-tight leading-none tabular-nums">
              ৳{(stats?.totalDue || 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className={`${cardStyle} p-6 flex flex-col justify-between`}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
              <ShoppingCart size={20} className="text-violet-600" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">মোট অর্ডার</p>
            <p className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-none tabular-nums">
              {(stats?.totalOrders || 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Today Performance & Secondary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
        <div className="xl:col-span-2 bg-white rounded-[24px] shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden flex flex-col">
          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Clock size={16} className="text-indigo-600" />
              </div>
              <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900">আজকের পারফরম্যান্স</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 flex-1">
            {[
              { label: "নতুন অর্ডার", value: stats?.todayOrders || 0, color: "text-slate-900", bgHover: "hover:bg-slate-50/50" },
              { label: "ডেলিভারড", value: stats?.todayDelivered || 0, color: "text-emerald-600", bgHover: "hover:bg-emerald-50/30" },
              { label: "পেন্ডিং", value: stats?.todayPending || 0, color: "text-amber-500", bgHover: "hover:bg-amber-50/30" },
              { label: "আজকের বিক্রি", value: `৳${(stats?.todayRevenue || 0).toLocaleString("en-US")}`, color: "text-indigo-600", bgHover: "hover:bg-indigo-50/30" },
            ].map((s) => (
              <div key={s.label} className={`p-6 sm:p-8 flex flex-col justify-center transition-colors duration-300 ${s.bgHover}`}>
                <p className="text-[13px] font-medium text-slate-500 mb-2">{s.label}</p>
                <p className={`text-[26px] sm:text-[30px] font-black ${s.color} tracking-tight tabular-nums leading-none`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row xl:flex-col gap-5 sm:gap-6">
          <div className="flex-1 bg-slate-900 rounded-[24px] p-6 sm:p-8 shadow-lg text-white flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-110" />
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-md transition-transform group-hover:scale-105">
              <Users size={24} className="text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-[13px] font-medium text-slate-400 mb-1.5">মোট কাস্টমার</p>
              <p className="text-[32px] sm:text-[36px] font-black text-white tracking-tight leading-none">{stats?.totalCustomers || 0}</p>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-110" />
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <Package size={24} className="text-amber-600" />
            </div>
            <div className="relative z-10">
              <p className="text-[13px] font-medium text-slate-500 mb-1.5">মোট প্রডাক্ট</p>
              <p className="text-[32px] sm:text-[36px] font-black text-slate-900 tracking-tight leading-none">{stats?.totalProducts || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Analytics Charts - Minimalist */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[13px] font-medium text-slate-500 mb-1">গত ৭ দিনের বিক্রি</p>
              <div className="flex items-baseline gap-2">
                <p className="text-[24px] font-bold text-slate-900 tracking-tight leading-none">
                  ৳{totalRevenue7d.toLocaleString("en-US")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-medium text-slate-400 mb-1">গড় বিক্রি / দিন</p>
              <p className="text-[16px] font-semibold text-emerald-600">৳{avgRevenue.toLocaleString("en-US")}</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", padding: "8px 12px" }}
                  labelStyle={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}
                  itemStyle={{ color: "#0f172a", fontSize: "14px", fontWeight: 600 }}
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
                  formatter={(value) => [`৳${Number(value).toLocaleString("en-US")}`, "বিক্রি"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
          <div className="mb-8">
            <p className="text-[13px] font-medium text-slate-500 mb-1">গত ৭ দিনের অর্ডার</p>
            <p className="text-[24px] font-bold text-slate-900 tracking-tight leading-none">
              {totalOrders7d} <span className="text-[14px] font-normal text-slate-500">টি</span>
            </p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", padding: "8px 12px" }}
                  labelStyle={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}
                  itemStyle={{ color: "#0f172a", fontSize: "14px", fontWeight: 600 }}
                  formatter={(value) => [String(value), "অর্ডার"]}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={30}>
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? "#0f172a" : "#e2e8f0"} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Clean Recent Activity */}
      <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[16px] font-semibold text-slate-900">সাম্প্রতিক কার্যক্রম</h3>
          <span className="text-[12px] font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">{activity.length} টি রেকর্ড</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-6 py-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <ActivityIcon size={24} className="text-slate-300" />
            </div>
            <p className="text-[15px] font-medium text-slate-600">কোনো কার্যক্রম নেই</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-400 uppercase tracking-wider">বিবরণ</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-400 uppercase tracking-wider text-center">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-400 uppercase tracking-wider text-right">পরিমাণ</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-400 uppercase tracking-wider text-right">সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activity.map((item) => {
                  const isPayment = item.type === "payment";
                  const ds = item.deliveryStatus || "pending";
                  const statusLabel = isPayment ? "আদায়" : ds === "delivered" ? "ডেলিভারড" : ds === "not_delivered" ? "অনডেলিভারড" : "পেন্ডিং";
                  
                  const statusStyles = isPayment || ds === "delivered" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : ds === "not_delivered" 
                    ? "bg-rose-50 text-rose-600 border-rose-100" 
                    : "bg-amber-50 text-amber-600 border-amber-100";

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPayment ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>
                            {isPayment ? <Banknote size={18} /> : <Package size={18} />}
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-slate-900">{item.customerName}</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                              {isPayment ? "বাকি আদায়" : `${item.itemCount} টি প্রডাক্ট`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusStyles}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`text-[15px] font-bold tabular-nums ${isPayment ? "text-emerald-600" : "text-slate-900"}`}>
                          {isPayment ? "+" : ""}৳{item.totalAmount.toLocaleString("en-US")}
                        </p>
                        {!isPayment && item.dueAmount > 0 && (
                          <p className="text-[11px] font-medium text-rose-500 mt-0.5">বাকি ৳{item.dueAmount.toLocaleString("en-US")}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[13px] font-medium text-slate-800">
                          {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* --- Super Clean Modals --- */}
      <AnimatedModal open={showSalesModal} onClose={() => setShowSalesModal(false)} title="বিক্রির বিস্তারিত রিপোর্ট" maxWidth="max-w-3xl">
        <div className="space-y-6 p-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingPeriods ? (
              <div className="col-span-4 py-12 flex justify-center">
                 <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin"></div>
              </div>
            ) : (
              <>
                {[
                  { label: "আজকে", data: periodStats.today },
                  { label: "গতকাল", data: periodStats.yesterday },
                  { label: "গত ৭ দিন", data: periodStats.last7 },
                  { label: "গত ৩০ দিন", data: periodStats.last30 },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">{item.label}</p>
                    <p className="text-[20px] font-bold text-slate-900 tabular-nums leading-none mb-3">
                      ৳{(item.data?.revenue || 0).toLocaleString("en-US")}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">{item.data?.count || 0} অর্ডার</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-[15px] font-semibold text-slate-900 mb-4">দিনভিত্তিক রিপোর্ট</h4>
            
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-100/50 border border-slate-200/50 mb-6 max-w-sm mx-auto">
              <button
                onClick={() => {
                  const d = new Date(selectedDate); d.setDate(d.getDate() - 1); handleDateChange(getBDDateString(d));
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="relative flex-1 flex justify-center items-center">
                <p className="text-[14px] font-medium text-slate-800">
                  {new Date(selectedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
                </p>
                <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <button
                onClick={() => {
                  const d = new Date(selectedDate); d.setDate(d.getDate() + 1); handleDateChange(getBDDateString(d));
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {dateStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 rounded-xl p-5 bg-slate-900 text-white">
                  <p className="text-[12px] font-medium text-slate-400 mb-1">মোট বিক্রি</p>
                  <p className="text-[24px] font-bold tabular-nums">৳{dateStats.revenue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-5 bg-slate-50 border border-slate-100">
                  <p className="text-[12px] font-medium text-slate-500 mb-1">অর্ডার</p>
                  <p className="text-[24px] font-bold text-slate-900 tabular-nums">{dateStats.count}</p>
                </div>
                <div className="rounded-xl p-5 bg-rose-50 border border-rose-100">
                  <p className="text-[12px] font-medium text-rose-600 mb-1">বাকি</p>
                  <p className="text-[20px] font-bold text-rose-700 tabular-nums">৳{dateStats.due.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[14px] text-slate-500">এই দিনের কোনো ডাটা নেই</p>
              </div>
            )}
          </div>
        </div>
      </AnimatedModal>

      <AnimatedModal open={showCollectionModal} onClose={() => setShowCollectionModal(false)} title="আদায়ের বিস্তারিত রিপোর্ট" maxWidth="max-w-2xl">
        <div className="space-y-6 p-1">
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-100/50 border border-slate-200/50 mb-6 max-w-sm mx-auto">
            <button onClick={() => { const d = new Date(collectionDate); d.setDate(d.getDate() - 1); handleCollectionDateChange(getBDDateString(d)); }} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronLeft size={20} />
            </button>
            <div className="relative flex-1 flex justify-center items-center">
              <p className="text-[14px] font-medium text-slate-800">
                {new Date(collectionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
              </p>
              <input type="date" value={collectionDate} onChange={(e) => handleCollectionDateChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <button onClick={() => { const d = new Date(collectionDate); d.setDate(d.getDate() + 1); handleCollectionDateChange(getBDDateString(d)); }} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronRight size={20} />
            </button>
          </div>

          {loadingCollection ? (
            <div className="py-12 flex justify-center">
               <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin"></div>
            </div>
          ) : collectionData ? (
            <div className="space-y-6">
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[12px] font-medium text-slate-500 mb-1">সর্বমোট আদায় (এই দিন)</p>
                <p className="text-[36px] font-bold text-slate-900 tabular-nums leading-none">
                  ৳{(collectionData.total).toLocaleString("en-US")}
                </p>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button onClick={() => setCollectionTab("due")} className={`flex-1 py-2.5 text-[13px] font-medium rounded-md transition-all ${collectionTab === "due" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  বাকি আদায় (৳{collectionData.dueCollection.toLocaleString()})
                </button>
                <button onClick={() => setCollectionTab("order")} className={`flex-1 py-2.5 text-[13px] font-medium rounded-md transition-all ${collectionTab === "order" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  নগদ অর্ডার (৳{collectionData.orderPaid.toLocaleString()})
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto pr-2">
                {collectionTab === "due" && (
                  <div className="space-y-3">
                    {collectionData.dateCollections.length > 0 ? (
                      collectionData.dateCollections.map((c: any) => (
                        <div key={c._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white">
                          <div>
                            <p className="text-[14px] font-semibold text-slate-900">{c.customerName}</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">{new Date(c.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-[15px] font-bold text-slate-900 tabular-nums">৳{c.amount.toLocaleString()}</p>
                            {collectionData.isAdmin && (
                              <button onClick={() => deletePayment(c._id)} disabled={deletingPayment === c._id} className="text-slate-400 hover:text-rose-500 transition-colors">
                                {deletingPayment === c._id ? <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" /> : <Trash2 size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-[13px] text-slate-500 py-8">কোনো বাকি আদায় নেই</p>
                    )}
                  </div>
                )}

                {collectionTab === "order" && (
                  <div className="space-y-3">
                    {collectionData.orderCollections.length > 0 ? (
                      collectionData.orderCollections.map((o: any) => (
                        <div key={o._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white">
                          <div>
                            <p className="text-[14px] font-semibold text-slate-900">{o.customerName}</p>
                            {o.dueAmount > 0 ? (
                               <p className="text-[12px] text-rose-500 mt-0.5">বাকি: ৳{o.dueAmount.toLocaleString()}</p>
                            ) : (
                               <p className="text-[12px] text-emerald-600 mt-0.5">সম্পূর্ণ পরিশোধিত</p>
                            )}
                          </div>
                          <p className="text-[15px] font-bold text-slate-900 tabular-nums">৳{o.paidAmount.toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-[13px] text-slate-500 py-8">কোনো নগদ আদায় নেই</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[14px] text-slate-500">কোনো তথ্য পাওয়া যায়নি</div>
          )}
        </div>
      </AnimatedModal>
    </motion.div>
  );
}
