"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Users, Package, CreditCard, Clock, TrendingUp, Truck, CheckCircle2, AlertCircle, CalendarDays, X, ChevronLeft, ChevronRight, Banknote, Trash2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import AnimatedModal from "@/components/ui/AnimatedModal";

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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Sales detail modal state
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [periodStats, setPeriodStats] = useState<{ [key: string]: PeriodStats }>({});
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [dateStats, setDateStats] = useState<PeriodStats | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  // Collection detail modal state
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionDate, setCollectionDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [collectionData, setCollectionData] = useState<{
    orderPaid: number;
    dueCollection: number;
    total: number;
    dateCollections: { _id: string; customerName: string; amount: number; date: string }[];
    isAdmin: boolean;
  } | null>(null);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null);

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

  // Fetch period stats when modal opens
  const fetchPeriodStats = async () => {
    setLoadingPeriods(true);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Start = new Date(today);
    last7Start.setDate(last7Start.getDate() - 6);
    const last30Start = new Date(today);
    last30Start.setDate(last30Start.getDate() - 29);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

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

      setPeriodStats({
        today: todayData,
        yesterday: yesterdayData,
        last7: last7Data,
        last30: last30Data,
      });
    } catch {
      // Silent fail
    } finally {
      setLoadingPeriods(false);
    }
  };

  // Fetch stats for selected date
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

  // Fetch collection details
  const fetchCollectionData = async (date?: string) => {
    setLoadingCollection(true);
    try {
      // Get user info from localStorage
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}") as { role?: string };
      const isAdmin = userInfo.role === "admin";

      const targetDate = date || collectionDate;

      // Fetch payments for the selected date
      const paymentsRes = await fetch(`/api/dashboard/payments?date=${targetDate}`);
      const datePayments = await paymentsRes.json();

      // Fetch stats for the selected date to get order paid amount
      const statsRes = await fetch(`/api/dashboard/stats?from=${targetDate}&to=${targetDate}`);
      const dateStats = await statsRes.json();

      // Calculate due collections for this date
      const dueCollections = datePayments
        .filter((p: { amount: number }) => p.amount > 0)
        .reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0);

      // Get collections with IDs for this date
      const dateCollections = datePayments
        .filter((p: { amount: number }) => p.amount > 0)
        .map((p: { _id: string; customerName: string; amount: number; createdAt: string }) => ({
          _id: p._id,
          customerName: p.customerName,
          amount: p.amount,
          date: p.createdAt,
        }));

      // Order paid amount from the date stats
      const orderPaid = dateStats.paid || 0;

      setCollectionData({
        orderPaid,
        dueCollection: dueCollections,
        total: orderPaid + dueCollections,
        dateCollections,
        isAdmin,
      });
    } catch {
      setCollectionData(null);
    } finally {
      setLoadingCollection(false);
    }
  };

  // Delete payment - admin only
  const deletePayment = async (paymentId: string) => {
    if (!collectionData?.isAdmin) return;

    setDeletingPayment(paymentId);
    try {
      const res = await fetch(`/api/dashboard/payments?id=${paymentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Refresh collection data
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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-[2.5px] border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>লোড হচ্ছে...</p>
        </div>
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
    <div className="pb-8 space-y-5">

      {/* Page Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>ড্যাশবোর্ড</h1>
          <p className="text-[13px] font-medium mt-1" style={{ color: "#6b7280" }}>{greeting} · {todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(102,168,15,0.1)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#66a80f" }} />
            <span className="text-[12px] font-semibold" style={{ color: "#4d7c0f" }}>আজকে {stats?.todayOrders || 0} টি অর্ডার</span>
          </div>
        </div>
      </div>

      {/* Main KPI Grid — 4 professional cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Revenue */}
        <div
          onClick={openSalesModal}
          className="rounded-2xl p-5 cursor-pointer transition-all hover:border-gray-300 hover:shadow-sm"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট বিক্রি</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
              <TrendingUp size={14} strokeWidth={2.2} style={{ color: "#66a80f" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            ৳{(stats?.totalRevenue || 0).toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[11px] font-semibold" style={{ color: "#66a80f" }}>৳{(stats?.todayRevenue || 0).toLocaleString("en-US")}</span>
            <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>আজ</span>
          </div>
        </div>

        {/* Collection */}
        <div
          onClick={openCollectionModal}
          className="rounded-2xl p-5 cursor-pointer transition-all hover:border-gray-300 hover:shadow-sm"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট আদায়</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <Banknote size={14} strokeWidth={2.2} style={{ color: "#374151" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            ৳{(stats?.totalCollection || 0).toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[11px] font-semibold" style={{ color: "#66a80f" }}>৳{(stats?.todayCollection || 0).toLocaleString("en-US")}</span>
            <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>আজ</span>
          </div>
        </div>

        {/* Due */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট বাকি</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fef2f2" }}>
              <CreditCard size={14} strokeWidth={2.2} style={{ color: "#dc2626" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            ৳{(stats?.totalDue || 0).toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <AlertCircle size={11} strokeWidth={2.2} style={{ color: "#9ca3af" }} />
            <span className="text-[11px] font-medium" style={{ color: "#6b7280" }}>সংগ্রহযোগ্য</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট অর্ডার</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <ShoppingCart size={14} strokeWidth={2.2} style={{ color: "#374151" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {(stats?.totalOrders || 0).toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[11px] font-semibold" style={{ color: "#66a80f" }}>+{stats?.todayOrders || 0}</span>
            <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>আজ</span>
          </div>
        </div>
      </div>

      {/* Today Performance Strip */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <div className="flex items-center gap-2">
            <Clock size={14} strokeWidth={2.2} style={{ color: "#6b7280" }} />
            <h3 className="text-[13px] font-semibold" style={{ color: "#111827" }}>আজকের পারফরম্যান্স</h3>
          </div>
          <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>{todayLabel}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100" style={{ borderColor: "#f3f4f6" }}>
          {[
            { label: "অর্ডার", value: stats?.todayOrders || 0, color: "#111827" },
            { label: "ডেলিভারড", value: stats?.todayDelivered || 0, color: "#66a80f" },
            { label: "পেন্ডিং", value: stats?.todayPending || 0, color: "#374151" },
            { label: "বিক্রি", value: `৳${(stats?.todayRevenue || 0).toLocaleString("en-US")}`, color: "#111827" },
          ].map((s, i) => (
            <div key={s.label} className={`px-5 py-4 ${i >= 2 ? "sm:border-t-0 border-t" : ""} sm:border-t-0`} style={{ borderColor: "#f3f4f6" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>{s.label}</p>
              <p className="text-[20px] font-bold mt-1 leading-none" style={{ color: s.color, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts — 2 column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>৭ দিনের বিক্রি</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-[24px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
                  ৳{totalRevenue7d.toLocaleString("en-US")}
                </p>
                <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>মোট</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>গড়</p>
              <p className="text-[16px] font-bold mt-1" style={{ color: "#111827", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>৳{avgRevenue.toLocaleString("en-US")}</p>
            </div>
          </div>
          <div className="h-[200px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#66a80f" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#66a80f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} dy={5} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString()} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "none", borderRadius: 8, fontSize: 12, color: "#fff", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", padding: "10px 14px" }}
                  labelStyle={{ color: "#9ca3af", marginBottom: 4, fontSize: 11 }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "3 3" }}
                  formatter={(value) => [`৳${Number(value).toLocaleString("en-US")}`, "বিক্রি"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#66a80f" strokeWidth={2.5} fill="url(#revGrad)" name="বিক্রি" dot={{ r: 0 }} activeDot={{ r: 5, fill: "#66a80f", strokeWidth: 3, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>৭ দিনের অর্ডার</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-[24px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
                {totalOrders7d}
              </p>
              <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>মোট</span>
            </div>
          </div>
          <div className="h-[200px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} dy={5} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "none", borderRadius: 8, fontSize: 12, color: "#fff", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", padding: "10px 14px" }}
                  labelStyle={{ color: "#9ca3af", marginBottom: 4, fontSize: 11 }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ fill: "rgba(102,168,15,0.05)" }}
                  formatter={(value) => [String(value), "অর্ডার"]}
                />
                <Bar dataKey="orders" fill="#66a80f" radius={[4, 4, 0, 0]} name="অর্ডার" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f3f4f6" }}>
            <Users size={18} strokeWidth={2} style={{ color: "#374151" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>কাস্টমার</p>
            <p className="text-[22px] font-bold leading-none mt-1" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>{stats?.totalCustomers || 0}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f3f4f6" }}>
            <Package size={18} strokeWidth={2} style={{ color: "#374151" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>প্রডাক্ট</p>
            <p className="text-[22px] font-bold leading-none mt-1" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>{stats?.totalProducts || 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity — Professional table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "#111827", letterSpacing: "-0.01em" }}>সাম্প্রতিক কার্যক্রম</h3>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: "#6b7280" }}>সর্বশেষ {activity.length} টি লেনদেন</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ color: "#374151", background: "#f3f4f6" }}>{activity.length}</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <ShoppingCart size={20} strokeWidth={1.5} style={{ color: "#9ca3af" }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "#6b7280" }}>কোনো কার্যক্রম নেই</p>
          </div>
        ) : (
          <>
            {/* Desktop: table header */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_140px_120px] gap-4 px-5 py-2.5" style={{ background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>কাস্টমার</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>ধরন</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: "#6b7280" }}>পরিমাণ</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: "#6b7280" }}>সময়</p>
            </div>
            <div>
              {activity.map((item, idx) => {
                const isPayment = item.type === "payment";
                const ds = item.deliveryStatus || "pending";
                const statusLabel = isPayment ? "আদায়" : ds === "delivered" ? "ডেলিভারড" : ds === "not_delivered" ? "অনডেলিভারড" : "পেন্ডিং";
                const statusColor = isPayment || ds === "delivered" ? { bg: "rgba(102,168,15,0.1)", text: "#4d7c0f" } : ds === "not_delivered" ? { bg: "#fef2f2", text: "#dc2626" } : { bg: "#f3f4f6", text: "#374151" };
                const iconEl = isPayment
                  ? <Banknote size={14} strokeWidth={2} style={{ color: "#66a80f" }} />
                  : ds === "delivered"
                  ? <CheckCircle2 size={14} strokeWidth={2} style={{ color: "#66a80f" }} />
                  : ds === "not_delivered"
                  ? <AlertCircle size={14} strokeWidth={2} style={{ color: "#dc2626" }} />
                  : <Truck size={14} strokeWidth={2} style={{ color: "#374151" }} />;
                const isGreen = isPayment || ds === "delivered";
                return (
                  <div
                    key={item._id}
                    className="px-5 py-3.5 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_140px_120px] gap-2 sm:gap-4 items-center"
                    style={{ borderTop: idx > 0 ? "1px solid #f3f4f6" : "none" }}
                  >
                    {/* Customer + icon */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: isGreen ? "rgba(102,168,15,0.1)" : "#f3f4f6" }}>
                        {iconEl}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{item.customerName}</p>
                        <p className="text-[11px] font-medium mt-0.5 truncate sm:hidden" style={{ color: "#9ca3af" }}>
                          {isPayment ? "বাকি আদায়" : `${item.itemCount} পণ্য · ${statusLabel}`}
                        </p>
                      </div>
                    </div>

                    {/* Status badge — desktop only */}
                    <div className="hidden sm:block">
                      <span className="inline-block text-[10px] font-semibold px-2 py-1 rounded-md" style={{ background: statusColor.bg, color: statusColor.text }}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Amount + due */}
                    <div className="text-right">
                      <p className="text-[14px] font-bold" style={{ color: isPayment ? "#66a80f" : "#111827", letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
                        {isPayment ? "+" : ""}৳{item.totalAmount.toLocaleString("en-US")}
                      </p>
                      {!isPayment && item.dueAmount > 0 && (
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>বাকি ৳{item.dueAmount.toLocaleString("en-US")}</p>
                      )}
                    </div>

                    {/* Time — desktop only */}
                    <div className="hidden sm:block text-right">
                      <p className="text-[12px] font-medium" style={{ color: "#6b7280" }}>
                        {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: "#9ca3af" }}>
                        {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sales Detail Modal */}
      <AnimatedModal open={showSalesModal} onClose={() => setShowSalesModal(false)} title="বিক্রির বিস্তারিত" maxWidth="max-w-xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {loadingPeriods ? (
              <div className="col-span-2 py-12 text-center">
                <div className="animate-spin w-8 h-8 border-[3px] border-t-transparent rounded-full mx-auto" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
                <p className="text-[12px] font-medium mt-3" style={{ color: "#6b7280" }}>লোড হচ্ছে...</p>
              </div>
            ) : (
              <>
                {[
                  { label: "আজকে", data: periodStats.today, icon: <Clock size={16} className="text-blue-500" />, bg: "bg-blue-50" },
                  { label: "গতকাল", data: periodStats.yesterday, icon: <CalendarDays size={16} className="text-orange-500" />, bg: "bg-orange-50" },
                  { label: "গত ৭ দিন", data: periodStats.last7, icon: <TrendingUp size={16} className="text-[#66a80f]" />, bg: "bg-[#66a80f]/10" },
                  { label: "গত ৩০ দিন", data: periodStats.last30, icon: <CreditCard size={16} className="text-purple-500" />, bg: "bg-purple-50" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg shadow-sm" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50" />
                    <div className="flex items-center gap-2.5 mb-2 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.bg}`}>
                        {item.icon}
                      </div>
                      <p className="text-[12px] font-semibold text-gray-500">{item.label}</p>
                    </div>
                    <p className="text-[22px] font-extrabold mt-1 leading-none text-gray-900 tracking-tight">৳{(item.data?.revenue || 0).toLocaleString("en-US")}</p>
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
                      <p className="text-[12px] font-medium text-gray-500">{item.data?.count || 0} টি অর্ডার</p>
                      <p className="text-[11px] font-semibold px-2 py-0.5 rounded text-gray-600 bg-gray-100">৳{item.data?.count ? Math.round((item.data?.revenue || 0)/item.data?.count).toLocaleString() : 0} /গড়</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                <CalendarDays size={16} className="text-[#66a80f]" />
                দিনভিত্তিক রিপোর্ট
              </h4>
            </div>
            
            <div className="flex items-center justify-center gap-3 w-full p-1.5 rounded-xl bg-white shadow-sm border border-gray-100 mb-5">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="flex-1 h-10 px-4 text-center rounded-lg text-[14px] font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
              />
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  handleDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </div>

            {dateStats ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600" />
                  <p className="text-[11px] font-semibold text-gray-500 mb-1">মোট বিক্রি</p>
                  <p className="text-[20px] font-bold text-gray-900">৳{dateStats.revenue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-purple-600" />
                  <p className="text-[11px] font-semibold text-gray-500 mb-1">মোট অর্ডার</p>
                  <p className="text-[20px] font-bold text-gray-900">{dateStats.count} টি</p>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-3 mt-1">
                  <div className="rounded-xl p-4 bg-[#66a80f]/5 border border-[#66a80f]/20">
                    <p className="text-[11px] font-semibold text-[#5a930d] mb-1">নগদ পরিশোধ</p>
                    <p className="text-[18px] font-bold text-[#4d7c0f]">৳{dateStats.paid.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-red-50 border border-red-100">
                    <p className="text-[11px] font-semibold text-red-600 mb-1">মোট বাকি</p>
                    <p className="text-[18px] font-bold text-red-600">৳{dateStats.due.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-white rounded-xl border border-gray-100">
                <p className="text-[13px] font-medium text-gray-500">কোনো ডাটা নেই</p>
              </div>
            )}
          </div>
        </div>
      </AnimatedModal>

      {/* Collection Detail Modal */}
      <AnimatedModal open={showCollectionModal} onClose={() => setShowCollectionModal(false)} title="আদায়ের বিস্তারিত" maxWidth="max-w-xl">
        <div className="space-y-6">
          {/* Header Stats & Date */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                <Banknote size={16} className="text-[#66a80f]" />
                আদায় রিপোর্ট
              </h4>
            </div>

            <div className="flex items-center justify-center gap-3 w-full p-1.5 rounded-xl bg-white shadow-sm border border-gray-100 mb-6">
              <button
                onClick={() => {
                  const d = new Date(collectionDate);
                  d.setDate(d.getDate() - 1);
                  handleCollectionDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <input
                type="date"
                value={collectionDate}
                onChange={(e) => handleCollectionDateChange(e.target.value)}
                className="flex-1 h-10 px-4 text-center rounded-lg text-[14px] font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
              />
              <button
                onClick={() => {
                  const d = new Date(collectionDate);
                  d.setDate(d.getDate() + 1);
                  handleCollectionDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </div>

            {loadingCollection ? (
              <div className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-[3px] border-t-transparent rounded-full mx-auto" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
                <p className="text-[12px] font-medium mt-3" style={{ color: "#6b7280" }}>লোড হচ্ছে...</p>
              </div>
            ) : collectionData ? (
              <div className="space-y-4">
                <div className="rounded-2xl p-6 relative overflow-hidden bg-[#66a80f] shadow-[0_8px_20px_-6px_rgba(102,168,15,0.4)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
                  <p className="text-[12px] font-semibold text-green-100 uppercase tracking-wider">সর্বমোট আদায়</p>
                  <p className="text-[36px] font-extrabold mt-1 text-white leading-none tracking-tight">
                    ৳{(collectionData.total).toLocaleString("en-US")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-sm transition-all hover:border-[#66a80f]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Banknote size={14} className="text-orange-500" />
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500">বাকি আদায়</p>
                    </div>
                    <p className="text-[20px] font-bold text-gray-900">৳{collectionData.dueCollection.toLocaleString()}</p>
                    <p className="text-[11px] font-medium text-gray-400 mt-1">{collectionData.dateCollections.length} জনের থেকে</p>
                  </div>
                  
                  <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-sm transition-all hover:border-[#66a80f]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <ShoppingCart size={14} className="text-blue-500" />
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500">অর্ডার থেকে</p>
                    </div>
                    <p className="text-[20px] font-bold text-gray-900">৳{collectionData.orderPaid.toLocaleString()}</p>
                    <p className="text-[11px] font-medium text-gray-400 mt-1">ক্যাশ অন ডেলিভারি</p>
                  </div>
                </div>

                {collectionData.dateCollections.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-[12px] font-bold text-gray-800">বাকি আদায়ের তালিকা</p>
                      <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {collectionData.dateCollections.length} টি
                      </span>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                      {collectionData.dateCollections.map((c: any, idx: number) => (
                        <div key={c._id} className={`flex items-center p-3.5 hover:bg-gray-50 transition-colors ${idx > 0 ? "border-t border-gray-100" : ""}`}>
                          <div className="w-9 h-9 rounded-full bg-[#66a80f]/10 flex items-center justify-center shrink-0">
                            <span className="text-[14px] font-bold text-[#66a80f]">{c.customerName.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0 ml-3">
                            <p className="text-[14px] font-bold text-gray-800 truncate">{c.customerName}</p>
                            <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                              {new Date(c.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <p className="text-[15px] font-bold text-[#66a80f]">+৳{c.amount.toLocaleString()}</p>
                            {collectionData.isAdmin && (
                              <button
                                onClick={() => deletePayment(c._id)}
                                disabled={deletingPayment === c._id}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                              >
                                {deletingPayment === c._id ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full border-red-500" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {collectionData.dateCollections.length === 0 && (
                  <div className="mt-6 p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Banknote size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-[13px] font-medium text-gray-500">কোনো বাকি আদায় নেই</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
                <p className="text-[13px] font-medium text-gray-500">কোনো তথ্য পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
