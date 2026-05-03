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
    <div className="pb-8 space-y-6">

      {/* Header — iOS large title style */}
      <div className="pt-2 px-1">
        <p className="text-[13px] font-medium" style={{ color: "#86868b" }}>{greeting}</p>
        <h1 className="text-[28px] font-bold mt-1 tracking-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>ড্যাশবোর্ড</h1>
        <p className="text-[12px] font-medium mt-0.5" style={{ color: "#86868b" }}>{todayLabel}</p>
      </div>

      {/* Hero Card — Today Revenue (Apple Wallet style) */}
      <div
        className="rounded-[22px] p-6"
        style={{
          background: "#ffffff",
          boxShadow: "0 0.5px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <p className="text-[12px] font-semibold tracking-wide" style={{ color: "#86868b" }}>আজকের বিক্রি</p>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(102,168,15,0.1)" }}>
            <span className="text-[11px] font-semibold" style={{ color: "#66a80f" }}>{stats?.todayOrders || 0} অর্ডার</span>
          </div>
        </div>
        <p className="text-[40px] font-bold leading-none" style={{ color: "#1d1d1f", letterSpacing: "-0.03em" }}>
          ৳{(stats?.todayRevenue || 0).toLocaleString("en-US")}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5" style={{ borderTop: "1px solid #f2f2f7" }}>
          {[
            { label: "ডেলিভারড", value: stats?.todayDelivered || 0 },
            { label: "পেন্ডিং", value: stats?.todayPending || 0 },
            { label: "বাকি", value: `৳${stats?.totalDue || 0}` },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[19px] font-bold leading-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.01em" }}>{s.value}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: "#86868b" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="px-1 pt-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "#86868b" }}>সারসংক্ষেপ</h2>
      </div>

      {/* Sales — full width row card (iOS list style) */}
      <div
        onClick={openSalesModal}
        className="rounded-[18px] cursor-pointer active:opacity-60 transition-opacity -mt-3"
        style={{
          background: "#ffffff",
          boxShadow: "0 0.5px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center px-5 py-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(102,168,15,0.12)" }}>
            <TrendingUp size={18} strokeWidth={2} style={{ color: "#66a80f" }} />
          </div>
          <div className="flex-1 ml-3.5">
            <p className="text-[13px] font-medium" style={{ color: "#86868b" }}>মোট বিক্রি</p>
            <p className="text-[22px] font-bold mt-0.5 leading-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>
              ৳{(stats?.totalRevenue || 0).toLocaleString("en-US")}
            </p>
          </div>
          <ChevronRight size={20} strokeWidth={2.5} style={{ color: "#c7c7cc" }} />
        </div>
      </div>

      {/* Collection & Due — 2 col cards */}
      <div className="grid grid-cols-2 gap-3 -mt-3">
        <div
          onClick={openCollectionModal}
          className="rounded-[18px] p-5 cursor-pointer active:opacity-60 transition-opacity"
          style={{
            background: "#ffffff",
            boxShadow: "0 0.5px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(102,168,15,0.12)" }}>
            <Banknote size={16} strokeWidth={2} style={{ color: "#66a80f" }} />
          </div>
          <p className="text-[12px] font-medium" style={{ color: "#86868b" }}>মোট আদায়</p>
          <p className="text-[20px] font-bold mt-0.5 leading-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>
            ৳{(stats?.totalCollection || 0).toLocaleString("en-US")}
          </p>
        </div>

        <div
          className="rounded-[18px] p-5"
          style={{
            background: "#ffffff",
            boxShadow: "0 0.5px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4" style={{ background: "#f2f2f7" }}>
            <CreditCard size={16} strokeWidth={2} style={{ color: "#1d1d1f" }} />
          </div>
          <p className="text-[12px] font-medium" style={{ color: "#86868b" }}>মোট বাকি</p>
          <p className="text-[20px] font-bold mt-0.5 leading-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>
            ৳{(stats?.totalDue || 0).toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Counts — 3 col */}
      <div className="grid grid-cols-3 gap-3 -mt-3">
        {[
          { label: "অর্ডার", value: stats?.totalOrders || 0, icon: ShoppingCart },
          { label: "কাস্টমার", value: stats?.totalCustomers || 0, icon: Users },
          { label: "প্রডাক্ট", value: stats?.totalProducts || 0, icon: Package },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-[18px] p-4"
              style={{
                background: "#ffffff",
                boxShadow: "0 0.5px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: "#f2f2f7" }}>
                <Icon size={14} strokeWidth={2} style={{ color: "#1d1d1f" }} />
              </div>
              <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>{item.label}</p>
              <p className="text-[19px] font-bold mt-0.5 leading-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Section Header */}
      <div className="px-1 pt-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "#86868b" }}>ট্রেন্ড</h2>
      </div>

      {/* Revenue Chart */}
      <div
        className="rounded-[18px] p-5 -mt-3"
        style={{
          background: "#ffffff",
          boxShadow: "0 0.5px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[12px] font-medium" style={{ color: "#86868b" }}>৭ দিনের বিক্রি</p>
            <p className="text-[20px] font-bold mt-0.5" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>
              ৳{chartData.reduce((s, d) => s + (d.revenue || 0), 0).toLocaleString("en-US")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(102,168,15,0.12)" }}>
            <TrendingUp size={16} strokeWidth={2} style={{ color: "#66a80f" }} />
          </div>
        </div>
        <div className="h-[140px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#66a80f" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#66a80f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#86868b" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#1d1d1f", border: "none", borderRadius: 12, fontSize: 11, color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", padding: "8px 12px" }} labelStyle={{ color: "#86868b", marginBottom: 4 }} cursor={{ stroke: "#e5e5ea", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="revenue" stroke="#66a80f" strokeWidth={2.5} fill="url(#revGrad)" name="বিক্রি" dot={false} activeDot={{ r: 5, fill: "#66a80f", strokeWidth: 3, stroke: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div
        className="rounded-[18px] p-5 -mt-3"
        style={{
          background: "#ffffff",
          boxShadow: "0 0.5px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[12px] font-medium" style={{ color: "#86868b" }}>৭ দিনের অর্ডার</p>
            <p className="text-[20px] font-bold mt-0.5" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>
              {chartData.reduce((s, d) => s + (d.orders || 0), 0)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#f2f2f7" }}>
            <ShoppingCart size={16} strokeWidth={2} style={{ color: "#1d1d1f" }} />
          </div>
        </div>
        <div className="h-[120px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#86868b" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#1d1d1f", border: "none", borderRadius: 12, fontSize: 11, color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", padding: "8px 12px" }} labelStyle={{ color: "#86868b", marginBottom: 4 }} cursor={{ fill: "transparent" }} />
              <Bar dataKey="orders" fill="#1d1d1f" radius={[6, 6, 0, 0]} name="অর্ডার" barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section Header */}
      <div className="px-1 pt-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "#86868b" }}>সাম্প্রতিক কার্যক্রম</h2>
      </div>

      {/* Recent Activity — iOS grouped list */}
      <div
        className="rounded-[18px] overflow-hidden -mt-3"
        style={{
          background: "#ffffff",
          boxShadow: "0 0.5px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {activity.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium" style={{ color: "#86868b" }}>কোনো কার্যক্রম নেই</p>
          </div>
        ) : (
          <div>
            {activity.map((item, idx) => {
              const isPayment = item.type === "payment";
              const ds = item.deliveryStatus || "pending";
              const iconEl = isPayment
                ? <Banknote size={15} strokeWidth={2} style={{ color: "#66a80f" }} />
                : ds === "delivered"
                ? <CheckCircle2 size={15} strokeWidth={2} style={{ color: "#66a80f" }} />
                : ds === "not_delivered"
                ? <AlertCircle size={15} strokeWidth={2} style={{ color: "#1d1d1f" }} />
                : <Truck size={15} strokeWidth={2} style={{ color: "#1d1d1f" }} />;
              const isGreen = isPayment || ds === "delivered";
              return (
                <div key={item._id} className="flex items-center px-4 py-3" style={{ borderTop: idx > 0 ? "0.5px solid #e5e5ea" : "none" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: isGreen ? "rgba(102,168,15,0.12)" : "#f2f2f7" }}>
                    {iconEl}
                  </div>
                  <div className="flex-1 min-w-0 ml-3">
                    <p className="text-[14px] font-semibold truncate" style={{ color: "#1d1d1f" }}>{item.customerName}</p>
                    <p className="text-[12px] font-medium mt-0.5" style={{ color: "#86868b" }}>
                      {isPayment ? "বাকি আদায়" : `${item.itemCount} পণ্য`} · {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-bold" style={{ color: isPayment ? "#66a80f" : "#1d1d1f", letterSpacing: "-0.01em" }}>
                      {isPayment ? "+" : ""}৳{item.totalAmount}
                    </p>
                    {!isPayment && item.dueAmount > 0 && (
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: "#86868b" }}>বাকি ৳{item.dueAmount}</p>
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
          <div className="grid grid-cols-2 gap-3">
            {loadingPeriods ? (
              <div className="col-span-2 py-8 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
              </div>
            ) : (
              <>
                {[
                  { label: "আজকে", data: periodStats.today },
                  { label: "গতকাল", data: periodStats.yesterday },
                  { label: "গত ৭ দিন", data: periodStats.last7 },
                  { label: "গত ৩০ দিন", data: periodStats.last30 },
                ].map((item) => (
                  <div key={item.label} className="rounded-[16px] p-4" style={{ background: "#f2f2f7" }}>
                    <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>{item.label}</p>
                    <p className="text-[18px] font-bold mt-1 leading-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>৳{(item.data?.revenue || 0).toLocaleString("en-US")}</p>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: "#86868b" }}>{item.data?.count || 0} অর্ডার</p>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="rounded-[16px] p-4" style={{ background: "#f2f2f7" }}>
            <p className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: "#86868b" }}>তারিখ সিলেক্ট করুন</p>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:opacity-60 transition-opacity"
                style={{ background: "#ffffff" }}
              >
                <ChevronLeft size={16} strokeWidth={2.5} style={{ color: "#1d1d1f" }} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="flex-1 h-10 px-3 rounded-[12px] text-[13px] font-medium outline-none"
                style={{ background: "#ffffff", color: "#1d1d1f" }}
              />
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  handleDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:opacity-60 transition-opacity"
                style={{ background: "#ffffff" }}
              >
                <ChevronRight size={16} strokeWidth={2.5} style={{ color: "#1d1d1f" }} />
              </button>
            </div>

            {dateStats && (
              <div className="rounded-[12px] p-4" style={{ background: "#ffffff" }}>
                <p className="text-[12px] font-medium mb-3" style={{ color: "#86868b" }}>
                  {new Date(selectedDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>বিক্রি</p>
                    <p className="text-[16px] font-bold mt-0.5" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>৳{dateStats.revenue}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>অর্ডার</p>
                    <p className="text-[16px] font-bold mt-0.5" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>{dateStats.count}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>পরিশোধ</p>
                    <p className="text-[16px] font-bold mt-0.5" style={{ color: "#66a80f", letterSpacing: "-0.02em" }}>৳{dateStats.paid}</p>
                  </div>
                </div>
                {dateStats.due > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid #e5e5ea" }}>
                    <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>বাকি</p>
                    <p className="text-[16px] font-bold mt-0.5" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>৳{dateStats.due}</p>
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
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:opacity-60 transition-opacity"
              style={{ background: "#f2f2f7" }}
            >
              <ChevronLeft size={16} strokeWidth={2.5} style={{ color: "#1d1d1f" }} />
            </button>
            <input
              type="date"
              value={collectionDate}
              onChange={(e) => handleCollectionDateChange(e.target.value)}
              className="flex-1 h-10 px-3 rounded-[12px] text-[13px] font-medium outline-none"
              style={{ background: "#f2f2f7", color: "#1d1d1f" }}
            />
            <button
              onClick={() => {
                const d = new Date(collectionDate);
                d.setDate(d.getDate() + 1);
                handleCollectionDateChange(d.toISOString().split("T")[0]);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:opacity-60 transition-opacity"
              style={{ background: "#f2f2f7" }}
            >
              <ChevronRight size={16} strokeWidth={2.5} style={{ color: "#1d1d1f" }} />
            </button>
          </div>

          {loadingCollection ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
            </div>
          ) : collectionData ? (
            <>
              {/* Total Hero — Apple Wallet style */}
              <div className="rounded-[20px] p-5" style={{ background: "#f2f2f7" }}>
                <p className="text-[12px] font-semibold" style={{ color: "#86868b" }}>মোট আদায়</p>
                <p className="text-[36px] font-bold mt-1 leading-none" style={{ color: "#1d1d1f", letterSpacing: "-0.03em" }}>
                  ৳{(collectionData.total).toLocaleString("en-US")}
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[16px] p-4" style={{ background: "#f2f2f7" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(102,168,15,0.12)" }}>
                    <Banknote size={14} strokeWidth={2} style={{ color: "#66a80f" }} />
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>বাকি আদায়</p>
                  <p className="text-[17px] font-bold mt-0.5" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>৳{collectionData.dueCollection}</p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: "#86868b" }}>{collectionData.dateCollections.length} টি</p>
                </div>
                <div className="rounded-[16px] p-4" style={{ background: "#f2f2f7" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: "#ffffff" }}>
                    <ShoppingCart size={14} strokeWidth={2} style={{ color: "#1d1d1f" }} />
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>অর্ডার থেকে</p>
                  <p className="text-[17px] font-bold mt-0.5" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>৳{collectionData.orderPaid}</p>
                </div>
              </div>

              {/* List */}
              {collectionData.dateCollections.length > 0 && (
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "#86868b" }}>
                    বাকি আদায় · {new Date(collectionDate).toLocaleDateString("bn-BD", { month: "long", day: "numeric" })}
                  </p>
                  <div className="rounded-[16px] overflow-hidden" style={{ background: "#ffffff" }}>
                    {collectionData.dateCollections.map((c: { _id: string; customerName: string; amount: number; date: string }, idx: number) => (
                      <div
                        key={c._id}
                        className="flex items-center px-4 py-3"
                        style={{ borderTop: idx > 0 ? "0.5px solid #e5e5ea" : "none" }}
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(102,168,15,0.12)" }}>
                          <Banknote size={14} strokeWidth={2} style={{ color: "#66a80f" }} />
                        </div>
                        <div className="flex-1 min-w-0 ml-3">
                          <p className="text-[14px] font-semibold truncate" style={{ color: "#1d1d1f" }}>{c.customerName}</p>
                          <p className="text-[12px] font-medium mt-0.5" style={{ color: "#86868b" }}>
                            {new Date(c.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-[15px] font-bold" style={{ color: "#66a80f", letterSpacing: "-0.01em" }}>+৳{c.amount}</p>
                          {collectionData.isAdmin && (
                            <button
                              onClick={() => deletePayment(c._id)}
                              disabled={deletingPayment === c._id}
                              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50 active:opacity-60 transition-opacity"
                              style={{ background: "#f2f2f7" }}
                              title="ডিলিট করুন"
                            >
                              {deletingPayment === c._id ? (
                                <div className="animate-spin w-3 h-3 border-[1.5px] border-t-transparent rounded-full" style={{ borderColor: "#86868b", borderTopColor: "transparent" }} />
                              ) : (
                                <Trash2 size={12} strokeWidth={2} style={{ color: "#ff3b30" }} />
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
                <div className="py-10 text-center rounded-[16px]" style={{ background: "#f2f2f7" }}>
                  <p className="text-[13px] font-medium" style={{ color: "#86868b" }}>এই তারিখে কোনো আদায় নেই</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-[13px] font-medium" style={{ color: "#86868b" }}>কোনো তথ্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </AnimatedModal>
    </div>
  );
}
