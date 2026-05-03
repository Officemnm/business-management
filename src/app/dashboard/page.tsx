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

  const todayLabel = new Date().toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "সুপ্রভাত" : greetHour < 17 ? "শুভ অপরাহ্ণ" : "শুভ সন্ধ্যা";

  return (
    <div className="pb-6 space-y-4">

      {/* Hero Header */}
      <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #66a80f 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="relative z-10">
          <p className="text-[11px] font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{greeting}</p>
          <h2 className="text-[17px] font-bold mb-3" style={{ color: "rgba(255,255,255,0.95)" }}>ড্যাশবোর্ড</h2>
          <div className="flex items-center gap-1.5 mb-4">
            <CalendarDays size={11} style={{ color: "rgba(255,255,255,0.4)" }} />
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{todayLabel}</p>
          </div>

          {/* Today Revenue Hero */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-medium tracking-wider uppercase mb-1" style={{ color: "#66a80f" }}>আজকের বিক্রি</p>
              <p className="text-[28px] font-extrabold leading-none" style={{ color: "white" }}>৳{stats?.todayRevenue || 0}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(102,168,15,0.15)" }}>
              <TrendingUp size={11} style={{ color: "#66a80f" }} />
              <span className="text-[10px] font-bold" style={{ color: "#66a80f" }}>{stats?.todayOrders || 0} অর্ডার</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today Quick Stats — pill style */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "অর্ডার", value: stats?.todayOrders || 0, color: "#66a80f", bg: "rgba(102,168,15,0.08)" },
          { label: "ডেলিভারড", value: stats?.todayDelivered || 0, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
          { label: "পেন্ডিং", value: stats?.todayPending || 0, color: "#d97706", bg: "rgba(217,119,6,0.08)" },
          { label: "মোট বাকি", value: `৳${stats?.totalDue || 0}`, color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl py-2.5 px-1 text-center" style={{ background: s.bg }}>
            <p className="text-[15px] font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[8px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Action Cards — 3 big tappable cards */}
      <div className="space-y-2">
        {/* Sales Card */}
        <div
          onClick={openSalesModal}
          className="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}>
                <TrendingUp size={18} style={{ color: "white" }} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>মোট বিক্রি</p>
                <p className="text-[20px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>৳{stats?.totalRevenue || 0}</p>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
          </div>
        </div>

        {/* Collection & Due — side by side */}
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={openCollectionModal}
            className="rounded-2xl p-3.5 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)" }}>
              <Banknote size={16} style={{ color: "white" }} strokeWidth={2} />
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>মোট আদায়</p>
            <p className="text-[18px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>৳{stats?.totalCollection || 0}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-1 h-1 rounded-full" style={{ background: "#0891b2" }} />
              <p className="text-[8px] font-medium" style={{ color: "#0891b2" }}>বিস্তারিত দেখুন</p>
            </div>
          </div>

          <div
            className="rounded-2xl p-3.5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" }}>
              <CreditCard size={16} style={{ color: "white" }} strokeWidth={2} />
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>মোট বাকি</p>
            <p className="text-[18px] font-extrabold leading-tight" style={{ color: "#dc2626" }}>৳{stats?.totalDue || 0}</p>
          </div>
        </div>

        {/* Small counts row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "মোট অর্ডার", value: stats?.totalOrders || 0, icon: ShoppingCart, gradient: "linear-gradient(135deg, #66a80f 0%, #84cc16 100%)" },
            { label: "কাস্টমার", value: stats?.totalCustomers || 0, icon: Users, gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)" },
            { label: "প্রডাক্ট", value: stats?.totalProducts || 0, icon: Package, gradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl p-3 text-center"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: item.gradient }}>
                  <Icon size={14} style={{ color: "white" }} strokeWidth={2} />
                </div>
                <p className="text-[16px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>{item.value}</p>
                <p className="text-[8px] font-semibold mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>৭ দিনের বিক্রি</h3>
            <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>সাপ্তাহিক ট্রেন্ড</p>
          </div>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
            <TrendingUp size={13} style={{ color: "#66a80f" }} />
          </div>
        </div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#66a80f" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#66a80f" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Area type="monotone" dataKey="revenue" stroke="#66a80f" strokeWidth={2.5} fill="url(#revGrad)" name="বিক্রি" dot={{ r: 3, fill: "#66a80f", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#66a80f", strokeWidth: 2, stroke: "white" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>৭ দিনের অর্ডার</h3>
            <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>দৈনিক অর্ডার সংখ্যা</p>
          </div>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
            <ShoppingCart size={13} style={{ color: "#66a80f" }} />
          </div>
        </div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="orders" fill="#66a80f" radius={[6, 6, 0, 0]} name="অর্ডার" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(120,113,108,0.1)" }}>
              <Clock size={12} style={{ color: "var(--text-muted)" }} strokeWidth={2} />
            </div>
            <h3 className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>সাম্প্রতিক কার্যক্রম</h3>
          </div>
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ color: "var(--text-muted)", background: "var(--bg-input)" }}>{activity.length} টি</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-input)" }}>
              <ShoppingCart size={20} style={{ color: "var(--text-muted)" }} strokeWidth={1.5} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>কোনো কার্যক্রম নেই</p>
          </div>
        ) : (
          <div>
            {activity.map((item, idx) => {
              const isPayment = item.type === "payment";
              const ds = item.deliveryStatus || "pending";
              const iconConfig = isPayment
                ? { bg: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)", icon: <Banknote size={13} style={{ color: "white" }} /> }
                : ds === "delivered"
                ? { bg: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)", icon: <CheckCircle2 size={13} style={{ color: "white" }} /> }
                : ds === "not_delivered"
                ? { bg: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)", icon: <AlertCircle size={13} style={{ color: "white" }} /> }
                : { bg: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)", icon: <Truck size={13} style={{ color: "white" }} /> };
              return (
                <div key={item._id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: idx > 0 ? "1px solid var(--border-color)" : "none" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconConfig.bg }}>
                    {iconConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.customerName}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {isPayment ? "বাকি আদায়" : `${item.itemCount} পণ্য`} · {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-extrabold" style={{ color: isPayment ? "#0891b2" : "var(--text-primary)" }}>
                      {isPayment ? "+" : ""}৳{item.totalAmount}
                    </p>
                    {!isPayment && item.dueAmount > 0 && (
                      <p className="text-[8px] font-bold mt-0.5 px-1.5 py-0.5 rounded-full inline-block" style={{ color: "#dc2626", background: "rgba(220,38,38,0.08)" }}>বাকি ৳{item.dueAmount}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sales Detail Modal */}
      <AnimatedModal open={showSalesModal} onClose={() => setShowSalesModal(false)} title="বিক্রির বিস্তারিত" maxWidth="max-w-md">
        <div className="space-y-4">
          {/* Period Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {loadingPeriods ? (
              <div className="col-span-2 py-8 text-center">
                <div className="animate-spin w-6 h-6 border-[2.5px] border-t-transparent rounded-full mx-auto" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
              </div>
            ) : (
              <>
                {[
                  { label: "আজকের বিক্রি", data: periodStats.today, gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)" },
                  { label: "গতকালের বিক্রি", data: periodStats.yesterday, gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)" },
                  { label: "গত ৭ দিনে", data: periodStats.last7, gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" },
                  { label: "গত ৩০ দিনে", data: periodStats.last30, gradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl p-3.5 relative overflow-hidden" style={{ background: item.gradient }}>
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-full" style={{ background: "rgba(255,255,255,0.1)", transform: "translate(30%, -30%)" }} />
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>{item.label}</p>
                    <p className="text-[18px] font-extrabold mt-1 leading-tight" style={{ color: "white" }}>৳{item.data?.revenue || 0}</p>
                    <p className="text-[9px] font-medium mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{item.data?.count || 0} অর্ডার</p>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Date Picker Section */}
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
            <label className="block text-[10px] font-semibold mb-2.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              তারিখ সিলেক্ট করুন
            </label>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
              >
                <ChevronLeft size={16} style={{ color: "var(--text-muted)" }} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl text-[12px] font-medium outline-none"
                style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
              />
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  handleDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
              >
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Selected Date Stats */}
            {dateStats && (
              <div className="rounded-xl p-3.5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <p className="text-[10px] font-semibold mb-2.5" style={{ color: "var(--text-secondary)" }}>
                  {new Date(selectedDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>বিক্রি</p>
                    <p className="text-[15px] font-extrabold mt-0.5" style={{ color: "#66a80f" }}>৳{dateStats.revenue}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>অর্ডার</p>
                    <p className="text-[15px] font-extrabold mt-0.5" style={{ color: "var(--text-primary)" }}>{dateStats.count}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>পরিশোধ</p>
                    <p className="text-[15px] font-extrabold mt-0.5" style={{ color: "#16a34a" }}>৳{dateStats.paid}</p>
                  </div>
                </div>
                {dateStats.due > 0 && (
                  <div className="mt-2.5 pt-2.5 text-center" style={{ borderTop: "1px solid var(--border-color)" }}>
                    <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>বাকি</p>
                    <p className="text-[15px] font-extrabold mt-0.5" style={{ color: "#dc2626" }}>৳{dateStats.due}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AnimatedModal>

      {/* Collection Detail Modal */}
      <AnimatedModal open={showCollectionModal} onClose={() => setShowCollectionModal(false)} title="আদায়ের বিস্তারিত" maxWidth="max-w-md">
        <div className="space-y-4">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(collectionDate);
                d.setDate(d.getDate() - 1);
                handleCollectionDateChange(d.toISOString().split("T")[0]);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}
            >
              <ChevronLeft size={16} style={{ color: "var(--text-muted)" }} />
            </button>
            <input
              type="date"
              value={collectionDate}
              onChange={(e) => handleCollectionDateChange(e.target.value)}
              className="flex-1 h-10 px-3 rounded-xl text-[12px] font-medium outline-none"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            />
            <button
              onClick={() => {
                const d = new Date(collectionDate);
                d.setDate(d.getDate() + 1);
                handleCollectionDateChange(d.toISOString().split("T")[0]);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}
            >
              <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {loadingCollection ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-[2.5px] border-t-transparent rounded-full mx-auto" style={{ borderColor: "#0891b2", borderTopColor: "transparent" }} />
            </div>
          ) : collectionData ? (
            <>
              {/* Total Collection Hero */}
              <div className="rounded-2xl p-5 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)" }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.1)", transform: "translate(30%, -30%)" }} />
                <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>মোট আদায়</p>
                <p className="text-[30px] font-extrabold leading-tight mt-1" style={{ color: "white" }}>৳{collectionData.total}</p>
              </div>

              {/* Collection Summary Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl p-3.5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(8,145,178,0.1)" }}>
                      <Banknote size={12} style={{ color: "#0891b2" }} />
                    </div>
                    <p className="text-[9px] font-semibold" style={{ color: "#0891b2" }}>বাকি আদায়</p>
                  </div>
                  <p className="text-[17px] font-extrabold" style={{ color: "var(--text-primary)" }}>৳{collectionData.dueCollection}</p>
                  <p className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{collectionData.dateCollections.length} টি</p>
                </div>
                <div className="rounded-2xl p-3.5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(22,163,74,0.1)" }}>
                      <ShoppingCart size={12} style={{ color: "#16a34a" }} />
                    </div>
                    <p className="text-[9px] font-semibold" style={{ color: "#16a34a" }}>অর্ডার থেকে</p>
                  </div>
                  <p className="text-[17px] font-extrabold" style={{ color: "var(--text-primary)" }}>৳{collectionData.orderPaid}</p>
                </div>
              </div>

              {/* Date Collections with Delete */}
              {collectionData.dateCollections.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {new Date(collectionDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })} - বাকি আদায়
                  </h4>
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
                    {collectionData.dateCollections.map((c: { _id: string; customerName: string; amount: number; date: string }, idx: number) => (
                      <div
                        key={c._id}
                        className="flex items-center justify-between px-3.5 py-3"
                        style={{ borderTop: idx > 0 ? "1px solid var(--border-color)" : "none", background: "var(--bg-card)" }}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(8,145,178,0.1)" }}>
                            <Banknote size={12} style={{ color: "#0891b2" }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{c.customerName}</p>
                            <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                              {new Date(c.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-[13px] font-extrabold" style={{ color: "#0891b2" }}>+৳{c.amount}</p>
                          {collectionData.isAdmin && (
                            <button
                              onClick={() => deletePayment(c._id)}
                              disabled={deletingPayment === c._id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-90 transition-transform"
                              style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}
                              title="ডিলিট করুন"
                            >
                              {deletingPayment === c._id ? (
                                <div className="animate-spin w-3 h-3 border-[1.5px] border-t-transparent rounded-full" style={{ borderColor: "#dc2626", borderTopColor: "transparent" }} />
                              ) : (
                                <Trash2 size={12} />
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
                <div className="py-10 text-center rounded-2xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: "var(--bg-card)" }}>
                    <Banknote size={16} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>এই তারিখে কোনো আদায় নেই</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>কোনো তথ্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </AnimatedModal>
    </div>
  );
}
