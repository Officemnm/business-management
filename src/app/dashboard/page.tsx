"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Users, Package, CreditCard, Clock, TrendingUp, Truck, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Banknote, Trash2, ArrowUpRight, Activity as ActivityIcon, Wallet, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid } from "recharts";
import { motion, Variants } from "framer-motion";
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

interface PeriodStats { revenue: number; count: number; paid: number; due: number; }

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
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
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const last7Start = new Date(today); last7Start.setDate(last7Start.getDate() - 6);
    const last30Start = new Date(today); last30Start.setDate(last30Start.getDate() - 29);
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
    } catch {} finally { setLoadingPeriods(false); }
  };

  const fetchDateStats = async (date: string) => {
    try {
      const res = await fetch(`/api/dashboard/stats?from=${date}&to=${date}`);
      setDateStats(await res.json());
    } catch { setDateStats(null); }
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
          _id: p._id, customerName: p.customerName, amount: p.amount, date: p.createdAt,
        }));
      const orderPaid = dStats.paid || 0;
      const orderCollections = dStats.paidOrders || [];
      setCollectionData({
        orderPaid, dueCollection: dueCollections,
        total: orderPaid + dueCollections,
        dateCollections, orderCollections, isAdmin,
      });
    } catch { setCollectionData(null); }
    finally { setLoadingCollection(false); }
  };

  const deletePayment = async (paymentId: string) => {
    if (!collectionData?.isAdmin) return;
    setDeletingPayment(paymentId);
    try {
      const res = await fetch(`/api/dashboard/payments?id=${paymentId}`, { method: "DELETE" });
      if (res.ok) fetchCollectionData(collectionDate);
      else alert("ডিলিট করতে সমস্যা হয়েছে");
    } catch { alert("ডিলিট করতে সমস্যা হয়েছে"); }
    finally { setDeletingPayment(null); }
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[2.5px] border-gray-200 border-t-gray-700 animate-spin"></div>
          <p className="text-xs font-medium text-gray-500">লোড হচ্ছে...</p>
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

  return (
    <motion.div className="pb-12 max-w-6xl mx-auto" variants={containerVariants} initial="hidden" animate="show">
      {/* Page Header — clean greeting, no duplicate page name (sidebar already shows it) */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{greeting}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-200 shadow-sm px-3.5 py-2.5">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-60"></div>
          </div>
          <p className="text-sm text-gray-600">আজকের অর্ডার</p>
          <p className="text-sm font-bold text-gray-900 tabular-nums">{stats?.todayOrders || 0}</p>
        </div>
      </motion.div>

      {/* KPI Stats Grid — clean, monochrome with subtle accents */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Total Revenue */}
        <motion.div whileHover={{ y: -3 }} transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          onClick={openSalesModal}
          className="relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Banknote size={15} className="text-gray-700" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মোট বিক্রি</span>
            </div>
            <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 tabular-nums leading-tight">
            ৳{(stats?.totalRevenue || 0).toLocaleString("en-US")}
          </p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1.5">
            আজকে: <span className="text-emerald-600">৳{(stats?.todayRevenue || 0).toLocaleString("en-US")}</span>
          </p>
        </motion.div>

        {/* Total Collection */}
        <motion.div whileHover={{ y: -3 }} transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          onClick={openCollectionModal}
          className="relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Wallet size={15} className="text-gray-700" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মোট আদায়</span>
            </div>
            <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 tabular-nums leading-tight">
            ৳{(stats?.totalCollection || 0).toLocaleString("en-US")}
          </p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1.5">
            আজকে: <span className="text-emerald-600">৳{(stats?.todayCollection || 0).toLocaleString("en-US")}</span>
          </p>
        </motion.div>

        {/* Total Due */}
        <motion.div whileHover={{ y: -3 }} transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          className="relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <CreditCard size={15} className="text-gray-700" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মোট বাকি</span>
            </div>
            {(stats?.totalDue || 0) > 0 && <AlertCircle size={13} className="text-rose-400" />}
          </div>
          <p className={`text-xl sm:text-2xl font-black tabular-nums leading-tight ${(stats?.totalDue || 0) > 0 ? "text-rose-500" : "text-gray-900"}`}>
            ৳{(stats?.totalDue || 0).toLocaleString("en-US")}
          </p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1.5">পেন্ডিং বকেয়া</p>
        </motion.div>

        {/* Total Orders */}
        <motion.div whileHover={{ y: -3 }} transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          className="relative p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <ShoppingCart size={15} className="text-gray-700" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মোট অর্ডার</span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 tabular-nums leading-tight">
            {(stats?.totalOrders || 0).toLocaleString("en-US")} <span className="text-sm text-gray-400 font-bold">টি</span>
          </p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1.5">আজকে: {stats?.todayOrders || 0} টি</p>
        </motion.div>
      </motion.div>

      {/* Today's Performance + Customer/Product cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Today Performance — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-4 rounded-full bg-gray-800"></div>
              <h3 className="text-sm font-bold text-gray-800">আজকের পারফরম্যান্স</h3>
            </div>
            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
              <Clock size={11} />
              {todayLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
            {[
              { label: "নতুন অর্ডার", value: stats?.todayOrders || 0, icon: ShoppingCart },
              { label: "ডেলিভারড", value: stats?.todayDelivered || 0, icon: CheckCircle2, accent: "text-emerald-600" },
              { label: "পেন্ডিং", value: stats?.todayPending || 0, icon: Truck, accent: "text-amber-600" },
              { label: "আজকের বিক্রি", value: `৳${(stats?.todayRevenue || 0).toLocaleString("en-US")}`, icon: TrendingUp },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-2.5">
                    <Icon size={13} className="text-gray-600" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-lg sm:text-xl font-black tabular-nums leading-none ${s.accent || "text-gray-900"}`}>{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Customer + Product (compact cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <motion.div whileHover={{ y: -3 }} transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
            className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Users size={15} className="text-gray-700" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">কাস্টমার</span>
            </div>
            <p className="text-2xl lg:text-3xl font-black text-gray-900 tabular-nums leading-none">{stats?.totalCustomers || 0}</p>
            <p className="text-[10px] font-medium text-gray-400 mt-2">মোট রেজিস্টার্ড</p>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
            className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Package size={15} className="text-gray-700" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">প্রডাক্ট</span>
            </div>
            <p className="text-2xl lg:text-3xl font-black text-gray-900 tabular-nums leading-none">{stats?.totalProducts || 0}</p>
            <p className="text-[10px] font-medium text-gray-400 mt-2">মোট কালেকশন</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Analytics Charts — minimal, monochrome */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={13} className="text-gray-400" />
                <p className="text-xs font-bold text-gray-500">গত ৭ দিনের বিক্রি</p>
              </div>
              <p className="text-2xl font-black text-gray-900 tabular-nums leading-none mt-1.5">
                ৳{totalRevenue7d.toLocaleString("en-US")}
              </p>
            </div>
            <div className="text-right border-l border-gray-100 pl-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">গড় / দিন</p>
              <p className="text-sm font-extrabold text-gray-700 tabular-nums">৳{avgRevenue.toLocaleString("en-US")}</p>
            </div>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1f2937" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#1f2937" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 6px 20px -4px rgba(0,0,0,0.08)", padding: "8px 12px" }}
                  labelStyle={{ color: "#6b7280", fontSize: "11px", marginBottom: "4px", fontWeight: 600 }}
                  itemStyle={{ color: "#111827", fontSize: "13px", fontWeight: 700 }}
                  cursor={{ stroke: "#d1d5db", strokeWidth: 1, strokeDasharray: "4 4" }}
                  formatter={(value) => [`৳${Number(value).toLocaleString("en-US")}`, "বিক্রি"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1f2937" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 5, fill: "#1f2937", strokeWidth: 2.5, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={13} className="text-gray-400" />
              <p className="text-xs font-bold text-gray-500">গত ৭ দিনের অর্ডার</p>
            </div>
            <p className="text-2xl font-black text-gray-900 tabular-nums leading-none mt-1.5">
              {totalOrders7d} <span className="text-sm font-bold text-gray-400">টি</span>
            </p>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 6px 20px -4px rgba(0,0,0,0.08)", padding: "8px 12px" }}
                  labelStyle={{ color: "#6b7280", fontSize: "11px", marginBottom: "4px", fontWeight: 600 }}
                  itemStyle={{ color: "#111827", fontSize: "13px", fontWeight: 700 }}
                  formatter={(value) => [String(value), "অর্ডার"]}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? "#1f2937" : "#e5e7eb"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-full bg-gray-800"></div>
            <h3 className="text-sm font-bold text-gray-800">সাম্প্রতিক কার্যক্রম</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">{activity.length} টি</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-6 py-16 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
              <ActivityIcon size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-700">কোনো কার্যক্রম নেই</p>
            <p className="text-xs text-gray-400 mt-1">নতুন অর্ডার বা পেমেন্ট এখানে দেখা যাবে</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">বিবরণ</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">স্ট্যাটাস</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">পরিমাণ</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activity.map((item, idx) => {
                  const isPayment = item.type === "payment";
                  const ds = item.deliveryStatus || "pending";
                  const statusLabel = isPayment ? "আদায়" : ds === "delivered" ? "ডেলিভারড" : ds === "not_delivered" ? "অনডেলিভারড" : "পেন্ডিং";
                  const statusStyles = isPayment || ds === "delivered"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : ds === "not_delivered"
                    ? "bg-rose-50 text-rose-600 border-rose-100"
                    : "bg-amber-50 text-amber-600 border-amber-100";

                  return (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                            {isPayment ? <Banknote size={15} className="text-emerald-600" /> : <Package size={15} className="text-gray-700" />}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-gray-800">{item.customerName}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {isPayment ? "বাকি আদায়" : `${item.itemCount} টি প্রডাক্ট`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusStyles}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <p className={`text-sm font-extrabold tabular-nums ${isPayment ? "text-emerald-600" : "text-gray-900"}`}>
                          {isPayment ? "+" : ""}৳{item.totalAmount.toLocaleString("en-US")}
                        </p>
                        {!isPayment && item.dueAmount > 0 && (
                          <p className="text-[10px] font-bold text-rose-500 mt-0.5">বাকি ৳{item.dueAmount.toLocaleString("en-US")}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <p className="text-xs font-semibold text-gray-700">
                          {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Dhaka" })}
                        </p>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Sales Detail Modal */}
      <AnimatedModal open={showSalesModal} onClose={() => setShowSalesModal(false)} title="বিক্রির বিস্তারিত রিপোর্ট" maxWidth="max-w-3xl">
        <div className="space-y-5 p-1">
          {/* Period stats — clean white cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {loadingPeriods ? (
              <div className="col-span-4 py-10 flex justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-700 animate-spin"></div>
              </div>
            ) : (
              <>
                {[
                  { label: "আজকে", data: periodStats.today },
                  { label: "গতকাল", data: periodStats.yesterday },
                  { label: "গত ৭ দিন", data: periodStats.last7 },
                  { label: "গত ৩০ দিন", data: periodStats.last30 },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-4 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{item.label}</p>
                    <p className="text-base font-black text-gray-900 tabular-nums leading-none mb-2">
                      ৳{(item.data?.revenue || 0).toLocaleString("en-US")}
                    </p>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      {item.data?.count || 0} অর্ডার
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Date-wise report */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-gray-800"></div>
              <h4 className="text-sm font-bold text-gray-800">দিনভিত্তিক রিপোর্ট</h4>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-2xl bg-gray-50 border border-gray-100 mb-5 max-w-sm mx-auto">
              <button
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); handleDateChange(getBDDateString(d)); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-all">
                <ChevronLeft size={18} />
              </button>
              <div className="relative flex-1 flex justify-center items-center">
                <p className="text-sm font-bold text-gray-800">
                  {new Date(selectedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
                </p>
                <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <button
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); handleDateChange(getBDDateString(d)); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-all">
                <ChevronRight size={18} />
              </button>
            </div>

            {dateStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 rounded-2xl p-5 bg-gray-900 text-white relative overflow-hidden">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">মোট বিক্রি</p>
                  <p className="text-2xl font-black tabular-nums">৳{dateStats.revenue.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl p-4 bg-white border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">অর্ডার</p>
                  <p className="text-xl font-black text-gray-900 tabular-nums">{dateStats.count} <span className="text-xs font-bold text-gray-400">টি</span></p>
                </div>
                <div className="rounded-2xl p-4 bg-white border border-gray-100">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1.5">বাকি</p>
                  <p className="text-base font-black text-rose-500 tabular-nums">৳{dateStats.due.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-medium text-gray-400">এই দিনের কোনো ডাটা নেই</p>
              </div>
            )}
          </div>
        </div>
      </AnimatedModal>

      {/* Collection Detail Modal */}
      <AnimatedModal open={showCollectionModal} onClose={() => setShowCollectionModal(false)} title="আদায়ের বিস্তারিত রিপোর্ট" maxWidth="max-w-2xl">
        <div className="space-y-5 p-1">
          {/* Date navigator */}
          <div className="flex items-center justify-between p-1.5 rounded-2xl bg-gray-50 border border-gray-100 max-w-sm mx-auto">
            <button onClick={() => { const d = new Date(collectionDate); d.setDate(d.getDate() - 1); handleCollectionDateChange(getBDDateString(d)); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-all">
              <ChevronLeft size={18} />
            </button>
            <div className="relative flex-1 flex justify-center items-center">
              <p className="text-sm font-bold text-gray-800">
                {new Date(collectionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
              </p>
              <input type="date" value={collectionDate} onChange={(e) => handleCollectionDateChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <button onClick={() => { const d = new Date(collectionDate); d.setDate(d.getDate() + 1); handleCollectionDateChange(getBDDateString(d)); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>

          {loadingCollection ? (
            <div className="py-10 flex justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-700 animate-spin"></div>
            </div>
          ) : collectionData ? (
            <div className="space-y-5">
              {/* Total — clean dark card */}
              <div className="text-center py-7 px-5 bg-gray-900 rounded-2xl text-white">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">সর্বমোট আদায়</p>
                <p className="text-3xl sm:text-4xl font-black text-white tabular-nums leading-none">
                  ৳{(collectionData.total).toLocaleString("en-US")}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button onClick={() => setCollectionTab("due")}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${collectionTab === "due" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  বাকি আদায় <span className="ml-1 text-[10px] opacity-70">৳{collectionData.dueCollection.toLocaleString()}</span>
                </button>
                <button onClick={() => setCollectionTab("order")}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${collectionTab === "order" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  নগদ অর্ডার <span className="ml-1 text-[10px] opacity-70">৳{collectionData.orderPaid.toLocaleString()}</span>
                </button>
              </div>

              {/* Tab content */}
              <div className="max-h-[400px] overflow-y-auto pr-1">
                {collectionTab === "due" && (
                  <div className="space-y-2">
                    {collectionData.dateCollections.length > 0 ? (
                      collectionData.dateCollections.map((c: any, idx: number) => (
                        <motion.div
                          key={c._id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                              <Banknote size={15} className="text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{c.customerName}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{new Date(c.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-extrabold text-emerald-600 tabular-nums">৳{c.amount.toLocaleString()}</p>
                            {collectionData.isAdmin && (
                              <button onClick={() => deletePayment(c._id)} disabled={deletingPayment === c._id}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                                {deletingPayment === c._id ? (
                                  <div className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-gray-400 py-12">কোনো বাকি আদায় নেই</p>
                    )}
                  </div>
                )}

                {collectionTab === "order" && (
                  <div className="space-y-2">
                    {collectionData.orderCollections.length > 0 ? (
                      collectionData.orderCollections.map((o: any, idx: number) => (
                        <motion.div
                          key={o._id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                              <ShoppingCart size={15} className="text-gray-700" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{o.customerName}</p>
                              {o.dueAmount > 0 ? (
                                <p className="text-[11px] font-semibold text-rose-500 mt-0.5">বাকি: ৳{o.dueAmount.toLocaleString()}</p>
                              ) : (
                                <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">সম্পূর্ণ পরিশোধিত</p>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-extrabold text-gray-900 tabular-nums">৳{o.paidAmount.toLocaleString()}</p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-gray-400 py-12">কোনো নগদ আদায় নেই</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি</div>
          )}
        </div>
      </AnimatedModal>
    </motion.div>
  );
}
