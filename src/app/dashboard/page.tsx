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
      const res = await fetch(`/api/dashboard/payments?date=${targetDate}`);
      const datePayments = await res.json();

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

      // Fetch total stats for order paid calculation
      const statsRes = await fetch("/api/dashboard/stats");
      const statsData = await statsRes.json();
      const totalDueCollections = statsData.stats?.totalCollection || 0;
      const orderPaid = totalDueCollections - dueCollections;

      setCollectionData({
        orderPaid,
        dueCollection: dueCollections,
        total: dueCollections,
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const todayLabel = new Date().toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* Today Summary — minimal */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>ড্যাশবোর্ড</h2>
          <p className="text-[12px] mt-0.5 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <CalendarDays size={12} /> {todayLabel}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>আজকের বিক্রি</p>
            <p className="text-[18px] font-extrabold" style={{ color: "#66a80f" }}>৳{stats?.todayRevenue || 0}</p>
          </div>
        </div>
      </div>

      {/* Today mini stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "অর্ডার", value: stats?.todayOrders || 0, color: "#66a80f" },
          { label: "ডেলিভারড", value: stats?.todayDelivered || 0, color: "#16a34a" },
          { label: "পেন্ডিং", value: stats?.todayPending || 0, color: "#d97706" },
          { label: "বাকি", value: `৳${stats?.totalDue || 0}`, color: "#dc2626" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-[18px] font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Revenue Chart */}
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>৭ দিনের বিক্রি</h3>
            <TrendingUp size={14} style={{ color: "var(--text-muted)" }} />
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#66a80f" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#66a80f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#66a80f" strokeWidth={2} fill="url(#revGrad)" name="বিক্রি" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>৭ দিনের অর্ডার</h3>
            <ShoppingCart size={14} style={{ color: "var(--text-muted)" }} />
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#66a80f" radius={[4, 4, 0, 0]} name="অর্ডার" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {[
          { label: "মোট অর্ডার", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "#66a80f" },
          { label: "মোট কাস্টমার", value: stats?.totalCustomers || 0, icon: Users, color: "#2563eb" },
          { label: "মোট প্রডাক্ট", value: stats?.totalProducts || 0, icon: Package, color: "#7c3aed" },
          { label: "মোট বিক্রি", value: `৳${stats?.totalRevenue || 0}`, icon: TrendingUp, color: "#059669", onClick: openSalesModal },
          { label: "মোট আদায়", value: `৳${stats?.totalCollection || 0}`, icon: Banknote, color: "#0891b2", onClick: openCollectionModal },
          { label: "মোট বাকি", value: `৳${stats?.totalDue || 0}`, icon: CreditCard, color: "#dc2626" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={card.onClick}
              className={`rounded-xl p-3.5 ${card.onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} style={{ color: card.color }} strokeWidth={1.5} />
                <div>
                  <p className="text-[17px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>{card.value}</p>
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "var(--text-muted)" }} strokeWidth={1.5} />
            <h3 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>সাম্প্রতিক কার্যক্রম</h3>
          </div>
          <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{activity.length} টি</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <ShoppingCart size={32} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} strokeWidth={1} />
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>কোনো অর্ডার নেই</p>
          </div>
        ) : (
          <div>
            {activity.map((item, idx) => {
              const isPayment = item.type === "payment";
              const ds = item.deliveryStatus || "pending";
              return (
                <div key={item._id} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: idx > 0 ? "1px solid var(--border-color)" : "none" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: isPayment ? "#f0fdf4" :
                        ds === "delivered" ? "#f0fdf4" :
                        ds === "not_delivered" ? "#fef2f2" :
                        ds === "payment" ? "#e0f2fe" :
                        "#fffbeb"
                    }}>
                    {isPayment ? <Banknote size={14} style={{ color: "#0891b2" }} /> :
                     ds === "delivered" ? <CheckCircle2 size={14} style={{ color: "#16a34a" }} /> :
                     ds === "not_delivered" ? <AlertCircle size={14} style={{ color: "#dc2626" }} /> :
                     ds === "payment" ? <Banknote size={14} style={{ color: "#0891b2" }} /> :
                     <Truck size={14} style={{ color: "#d97706" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.customerName}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {isPayment ? "বাকি আদায়" : `${item.itemCount} পণ্য`} · {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold" style={{ color: isPayment ? "#0891b2" : "var(--text-primary)" }}>
                      {isPayment ? "+" : ""}৳{item.totalAmount}
                    </p>
                    {!isPayment && item.dueAmount > 0 && (
                      <p className="text-[9px] font-semibold" style={{ color: "#dc2626" }}>বাকি ৳{item.dueAmount}</p>
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
          <div className="grid grid-cols-2 gap-3">
            {loadingPeriods ? (
              <div className="col-span-2 py-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
              </div>
            ) : (
              <>
                <div className="rounded-xl p-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-[10px] font-medium" style={{ color: "#16a34a" }}>আজকের বিক্রি</p>
                  <p className="text-[16px] font-bold" style={{ color: "#166534" }}>৳{periodStats.today?.revenue || 0}</p>
                  <p className="text-[10px]" style={{ color: "#22c55e" }}>{periodStats.today?.count || 0} অর্ডার</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <p className="text-[10px] font-medium" style={{ color: "#2563eb" }}>গতকালের বিক্রি</p>
                  <p className="text-[16px] font-bold" style={{ color: "#1e40af" }}>৳{periodStats.yesterday?.revenue || 0}</p>
                  <p className="text-[10px]" style={{ color: "#3b82f6" }}>{periodStats.yesterday?.count || 0} অর্ডার</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                  <p className="text-[10px] font-medium" style={{ color: "#d97706" }}>গত ৭ দিনে</p>
                  <p className="text-[16px] font-bold" style={{ color: "#92400e" }}>৳{periodStats.last7?.revenue || 0}</p>
                  <p className="text-[10px]" style={{ color: "#f59e0b" }}>{periodStats.last7?.count || 0} অর্ডার</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "#f3f4f6", border: "1px solid #d1d5db" }}>
                  <p className="text-[10px] font-medium" style={{ color: "#6b7280" }}>গত ৩০ দিনে</p>
                  <p className="text-[16px] font-bold" style={{ color: "#374151" }}>৳{periodStats.last30?.revenue || 0}</p>
                  <p className="text-[10px]" style={{ color: "#9ca3af" }}>{periodStats.last30?.count || 0} অর্ডার</p>
                </div>
              </>
            )}
          </div>

          {/* Date Picker Section */}
          <div className="rounded-xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
            <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              তারিখ সিলেক্ট করুন
            </label>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  const newDate = d.toISOString().split("T")[0];
                  handleDateChange(newDate);
                }}
                className="p-2 rounded-lg cursor-pointer"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
              >
                <ChevronLeft size={16} style={{ color: "var(--text-muted)" }} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
              />
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  const newDate = d.toISOString().split("T")[0];
                  handleDateChange(newDate);
                }}
                className="p-2 rounded-lg cursor-pointer"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
              >
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Selected Date Stats */}
            {dateStats && (
              <div className="rounded-lg p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  {new Date(selectedDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>মোট বিক্রি</p>
                    <p className="text-[14px] font-bold" style={{ color: "#66a80f" }}>৳{dateStats.revenue}</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>অর্ডার</p>
                    <p className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>{dateStats.count}</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>পরিশোধ</p>
                    <p className="text-[14px] font-bold" style={{ color: "#16a34a" }}>৳{dateStats.paid}</p>
                  </div>
                </div>
                {dateStats.due > 0 && (
                  <div className="mt-2 pt-2 text-center" style={{ borderTop: "1px solid var(--border-color)" }}>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>বাকি</p>
                    <p className="text-[14px] font-bold" style={{ color: "#dc2626" }}>৳{dateStats.due}</p>
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
              className="p-2 rounded-lg cursor-pointer"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}
            >
              <ChevronLeft size={16} style={{ color: "var(--text-muted)" }} />
            </button>
            <input
              type="date"
              value={collectionDate}
              onChange={(e) => handleCollectionDateChange(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            />
            <button
              onClick={() => {
                const d = new Date(collectionDate);
                d.setDate(d.getDate() + 1);
                handleCollectionDateChange(d.toISOString().split("T")[0]);
              }}
              className="p-2 rounded-lg cursor-pointer"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}
            >
              <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {loadingCollection ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: "#0891b2", borderTopColor: "transparent" }} />
            </div>
          ) : collectionData ? (
            <>
              {/* Collection Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: "#e0f2fe", border: "1px solid #bae6fd" }}>
                  <p className="text-[10px] font-medium" style={{ color: "#0891b2" }}>বাকি আদায়</p>
                  <p className="text-[16px] font-bold" style={{ color: "#0c4a6e" }}>৳{collectionData.dueCollection}</p>
                  <p className="text-[10px]" style={{ color: "#06b6d4" }}>{collectionData.dateCollections.length} টি</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-[10px] font-medium" style={{ color: "#16a34a" }}>অর্ডার থেকে আদায়</p>
                  <p className="text-[16px] font-bold" style={{ color: "#166534" }}>৳{collectionData.orderPaid}</p>
                </div>
              </div>

              {/* Total Collection */}
              <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)" }}>
                <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>মোট আদায়</p>
                <p className="text-[24px] font-bold" style={{ color: "white" }}>৳{collectionData.total}</p>
              </div>

              {/* Date Collections with Delete */}
              {collectionData.dateCollections.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    {new Date(collectionDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })} - বাকি আদায়
                  </h4>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
                    {collectionData.dateCollections.map((c: { _id: string; customerName: string; amount: number; date: string }, idx: number) => (
                      <div
                        key={c._id}
                        className="flex items-center justify-between px-3 py-2.5"
                        style={{ borderTop: idx > 0 ? "1px solid var(--border-color)" : "none", background: "var(--bg-card)" }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.customerName}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {new Date(c.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold" style={{ color: "#0891b2" }}>+৳{c.amount}</p>
                          {collectionData.isAdmin && (
                            <button
                              onClick={() => deletePayment(c._id)}
                              disabled={deletingPayment === c._id}
                              className="p-1.5 rounded-lg cursor-pointer disabled:opacity-50"
                              style={{ background: "#fef2f2", color: "#dc2626" }}
                              title="ডিলিট করুন"
                            >
                              {deletingPayment === c._id ? (
                                <div className="animate-spin w-3 h-3 border-2 border-t-transparent rounded-full" style={{ borderColor: "#dc2626", borderTopColor: "transparent" }} />
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
                <div className="py-8 text-center rounded-xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>এই তারিখে কোনো আদায় নেই</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>কোনো তথ্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </AnimatedModal>
    </div>
  );
}
