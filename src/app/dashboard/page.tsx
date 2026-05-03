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
    <div className="pb-6 space-y-3">

      {/* Hero Header — premium with green accent */}
      <div className="rounded-3xl overflow-hidden relative" style={{ background: "#ffffff", border: "1px solid #e7e5e4", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        {/* Top green accent strip */}
        <div className="h-1 w-full" style={{ background: "#66a80f" }} />

        <div className="p-5">
          {/* Greeting & Date */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-medium tracking-wide" style={{ color: "#78716c" }}>{greeting} 👋</p>
              <h2 className="text-[18px] font-bold mt-0.5 tracking-tight" style={{ color: "#1c1917" }}>ড্যাশবোর্ড</h2>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "#fafaf9" }}>
              <CalendarDays size={11} strokeWidth={2} style={{ color: "#78716c" }} />
              <p className="text-[10px] font-semibold" style={{ color: "#44403c" }}>{todayLabel}</p>
            </div>
          </div>

          {/* Today Revenue — Hero number */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1 h-1 rounded-full" style={{ background: "#66a80f" }} />
                <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "#66a80f" }}>আজকের বিক্রি</p>
              </div>
              <p className="text-[34px] font-black leading-none tracking-tight" style={{ color: "#1c1917" }}>
                ৳{stats?.todayRevenue || 0}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#66a80f" }}>
                <TrendingUp size={20} strokeWidth={2.5} style={{ color: "#ffffff" }} />
              </div>
              <span className="text-[9px] font-bold" style={{ color: "#66a80f" }}>{stats?.todayOrders || 0} অর্ডার</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "অর্ডার", value: stats?.todayOrders || 0 },
          { label: "ডেলিভারড", value: stats?.todayDelivered || 0 },
          { label: "পেন্ডিং", value: stats?.todayPending || 0 },
          { label: "বাকি", value: `৳${stats?.totalDue || 0}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl py-3 px-1 text-center" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
            <p className="text-[15px] font-black leading-tight tracking-tight" style={{ color: "#1c1917" }}>{s.value}</p>
            <p className="text-[8px] font-semibold mt-1 uppercase tracking-wider" style={{ color: "#a8a29e" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Cards */}
      <div className="space-y-2">
        {/* Sales Card — primary green hero */}
        <div
          onClick={openSalesModal}
          className="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
          style={{ background: "#1c1917" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(102,168,15,0.18) 0%, transparent 70%)", transform: "translate(30%, -40%)" }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#66a80f" }}>
                <TrendingUp size={19} strokeWidth={2.5} style={{ color: "#ffffff" }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "#a8a29e" }}>মোট বিক্রি</p>
                <p className="text-[22px] font-black leading-tight tracking-tight" style={{ color: "#ffffff" }}>৳{stats?.totalRevenue || 0}</p>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2.5} style={{ color: "#66a80f" }} />
          </div>
        </div>

        {/* Collection & Due */}
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={openCollectionModal}
            className="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(102,168,15,0.1)" }}>
              <Banknote size={17} strokeWidth={2} style={{ color: "#66a80f" }} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#a8a29e" }}>মোট আদায়</p>
            <p className="text-[19px] font-black leading-tight tracking-tight" style={{ color: "#1c1917" }}>৳{stats?.totalCollection || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <p className="text-[9px] font-bold" style={{ color: "#66a80f" }}>বিস্তারিত</p>
              <ChevronRight size={10} strokeWidth={2.5} style={{ color: "#66a80f" }} />
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#f5f5f4" }}>
              <CreditCard size={17} strokeWidth={2} style={{ color: "#1c1917" }} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#a8a29e" }}>মোট বাকি</p>
            <p className="text-[19px] font-black leading-tight tracking-tight" style={{ color: "#1c1917" }}>৳{stats?.totalDue || 0}</p>
          </div>
        </div>

        {/* Small counts — minimal with green icons */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "অর্ডার", value: stats?.totalOrders || 0, icon: ShoppingCart },
            { label: "কাস্টমার", value: stats?.totalCustomers || 0, icon: Users },
            { label: "প্রডাক্ট", value: stats?.totalProducts || 0, icon: Package },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl p-3" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} strokeWidth={2} style={{ color: "#66a80f" }} />
                  <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#a8a29e" }}>{item.label}</p>
                </div>
                <p className="text-[18px] font-black leading-tight tracking-tight" style={{ color: "#1c1917" }}>{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[13px] font-bold tracking-tight" style={{ color: "#1c1917" }}>৭ দিনের বিক্রি</h3>
            <p className="text-[9px] font-medium mt-0.5" style={{ color: "#a8a29e" }}>সাপ্তাহিক ট্রেন্ড</p>
          </div>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
            <TrendingUp size={13} strokeWidth={2} style={{ color: "#66a80f" }} />
          </div>
        </div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#66a80f" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#66a80f" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#a8a29e" }} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={{ background: "#1c1917", border: "none", borderRadius: 10, fontSize: 11, color: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} labelStyle={{ color: "#a8a29e" }} />
              <Area type="monotone" dataKey="revenue" stroke="#66a80f" strokeWidth={2.5} fill="url(#revGrad)" name="বিক্রি" dot={{ r: 3, fill: "#66a80f", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5, fill: "#66a80f", strokeWidth: 3, stroke: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[13px] font-bold tracking-tight" style={{ color: "#1c1917" }}>৭ দিনের অর্ডার</h3>
            <p className="text-[9px] font-medium mt-0.5" style={{ color: "#a8a29e" }}>দৈনিক সংখ্যা</p>
          </div>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
            <ShoppingCart size={13} strokeWidth={2} style={{ color: "#66a80f" }} />
          </div>
        </div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#a8a29e" }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1c1917", border: "none", borderRadius: 10, fontSize: 11, color: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} labelStyle={{ color: "#a8a29e" }} cursor={{ fill: "rgba(102,168,15,0.05)" }} />
              <Bar dataKey="orders" fill="#66a80f" radius={[6, 6, 0, 0]} name="অর্ডার" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid #f5f5f4" }}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: "#66a80f" }} />
            <h3 className="text-[12px] font-bold tracking-tight" style={{ color: "#1c1917" }}>সাম্প্রতিক কার্যক্রম</h3>
          </div>
          <span className="text-[9px] font-bold px-2 py-1 rounded-md" style={{ color: "#66a80f", background: "rgba(102,168,15,0.1)" }}>{activity.length}</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <ShoppingCart size={20} className="mx-auto mb-2" strokeWidth={1.5} style={{ color: "#d6d3d1" }} />
            <p className="text-[11px] font-medium" style={{ color: "#a8a29e" }}>কোনো কার্যক্রম নেই</p>
          </div>
        ) : (
          <div>
            {activity.map((item, idx) => {
              const isPayment = item.type === "payment";
              const ds = item.deliveryStatus || "pending";
              const isPositive = isPayment || ds === "delivered";
              const iconEl = isPayment
                ? <Banknote size={14} strokeWidth={2} style={{ color: "#66a80f" }} />
                : ds === "delivered"
                ? <CheckCircle2 size={14} strokeWidth={2} style={{ color: "#66a80f" }} />
                : ds === "not_delivered"
                ? <AlertCircle size={14} strokeWidth={2} style={{ color: "#1c1917" }} />
                : <Truck size={14} strokeWidth={2} style={{ color: "#1c1917" }} />;
              return (
                <div key={item._id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: idx > 0 ? "1px solid #f5f5f4" : "none" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: isPositive ? "rgba(102,168,15,0.1)" : "#f5f5f4" }}>
                    {iconEl}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate" style={{ color: "#1c1917" }}>{item.customerName}</p>
                    <p className="text-[9px] font-medium mt-0.5" style={{ color: "#a8a29e" }}>
                      {isPayment ? "বাকি আদায়" : `${item.itemCount} পণ্য`} · {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-black tracking-tight" style={{ color: isPayment ? "#66a80f" : "#1c1917" }}>
                      {isPayment ? "+" : ""}৳{item.totalAmount}
                    </p>
                    {!isPayment && item.dueAmount > 0 && (
                      <p className="text-[8px] font-bold mt-0.5" style={{ color: "#a8a29e" }}>বাকি ৳{item.dueAmount}</p>
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
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
                  <div key={item.label} className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-1 h-1 rounded-full" style={{ background: "#66a80f" }} />
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#a8a29e" }}>{item.label}</p>
                    </div>
                    <p className="text-[17px] font-black leading-tight tracking-tight" style={{ color: "#1c1917" }}>৳{item.data?.revenue || 0}</p>
                    <p className="text-[9px] font-semibold mt-0.5" style={{ color: "#78716c" }}>{item.data?.count || 0} অর্ডার</p>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="rounded-xl p-3.5" style={{ background: "#fafaf9", border: "1px solid #e7e5e4" }}>
            <label className="block text-[9px] font-bold mb-2 uppercase tracking-wider" style={{ color: "#78716c" }}>তারিখ সিলেক্ট করুন</label>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}
              >
                <ChevronLeft size={14} strokeWidth={2} style={{ color: "#1c1917" }} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg text-[11px] font-semibold outline-none"
                style={{ background: "#ffffff", color: "#1c1917", border: "1px solid #e7e5e4" }}
              />
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  handleDateChange(d.toISOString().split("T")[0]);
                }}
                className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}
              >
                <ChevronRight size={14} strokeWidth={2} style={{ color: "#1c1917" }} />
              </button>
            </div>

            {dateStats && (
              <div className="rounded-lg p-3" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
                <p className="text-[10px] font-bold mb-2.5" style={{ color: "#1c1917" }}>
                  {new Date(selectedDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#a8a29e" }}>বিক্রি</p>
                    <p className="text-[15px] font-black mt-0.5 tracking-tight" style={{ color: "#1c1917" }}>৳{dateStats.revenue}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#a8a29e" }}>অর্ডার</p>
                    <p className="text-[15px] font-black mt-0.5 tracking-tight" style={{ color: "#1c1917" }}>{dateStats.count}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#a8a29e" }}>পরিশোধ</p>
                    <p className="text-[15px] font-black mt-0.5 tracking-tight" style={{ color: "#66a80f" }}>৳{dateStats.paid}</p>
                  </div>
                </div>
                {dateStats.due > 0 && (
                  <div className="mt-2.5 pt-2.5 text-center" style={{ borderTop: "1px solid #f5f5f4" }}>
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#a8a29e" }}>বাকি</p>
                    <p className="text-[15px] font-black mt-0.5 tracking-tight" style={{ color: "#1c1917" }}>৳{dateStats.due}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AnimatedModal>

      {/* Collection Detail Modal */}
      <AnimatedModal open={showCollectionModal} onClose={() => setShowCollectionModal(false)} title="আদায়ের বিস্তারিত" maxWidth="max-w-md">
        <div className="space-y-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(collectionDate);
                d.setDate(d.getDate() - 1);
                handleCollectionDateChange(d.toISOString().split("T")[0]);
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{ background: "#fafaf9", border: "1px solid #e7e5e4" }}
            >
              <ChevronLeft size={14} strokeWidth={2} style={{ color: "#1c1917" }} />
            </button>
            <input
              type="date"
              value={collectionDate}
              onChange={(e) => handleCollectionDateChange(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg text-[11px] font-semibold outline-none"
              style={{ background: "#fafaf9", color: "#1c1917", border: "1px solid #e7e5e4" }}
            />
            <button
              onClick={() => {
                const d = new Date(collectionDate);
                d.setDate(d.getDate() + 1);
                handleCollectionDateChange(d.toISOString().split("T")[0]);
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{ background: "#fafaf9", border: "1px solid #e7e5e4" }}
            >
              <ChevronRight size={14} strokeWidth={2} style={{ color: "#1c1917" }} />
            </button>
          </div>

          {loadingCollection ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
            </div>
          ) : collectionData ? (
            <>
              {/* Total Hero — Premium dark with green accent */}
              <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "#1c1917" }}>
                <div className="absolute top-0 right-0 w-28 h-28 rounded-full" style={{ background: "radial-gradient(circle, rgba(102,168,15,0.18) 0%, transparent 70%)", transform: "translate(30%, -40%)" }} />
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1 h-1 rounded-full" style={{ background: "#66a80f" }} />
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "#66a80f" }}>মোট আদায়</p>
                  </div>
                  <p className="text-[32px] font-black leading-none tracking-tight" style={{ color: "#ffffff" }}>৳{collectionData.total}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3.5" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "rgba(102,168,15,0.1)" }}>
                    <Banknote size={14} strokeWidth={2} style={{ color: "#66a80f" }} />
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: "#a8a29e" }}>বাকি আদায়</p>
                  <p className="text-[16px] font-black tracking-tight" style={{ color: "#1c1917" }}>৳{collectionData.dueCollection}</p>
                  <p className="text-[9px] font-semibold mt-0.5" style={{ color: "#78716c" }}>{collectionData.dateCollections.length} টি</p>
                </div>
                <div className="rounded-xl p-3.5" style={{ background: "#ffffff", border: "1px solid #e7e5e4" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "#f5f5f4" }}>
                    <ShoppingCart size={14} strokeWidth={2} style={{ color: "#1c1917" }} />
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: "#a8a29e" }}>অর্ডার থেকে</p>
                  <p className="text-[16px] font-black tracking-tight" style={{ color: "#1c1917" }}>৳{collectionData.orderPaid}</p>
                </div>
              </div>

              {/* List */}
              {collectionData.dateCollections.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-3 rounded-full" style={{ background: "#66a80f" }} />
                    <h4 className="text-[10px] font-bold tracking-tight" style={{ color: "#1c1917" }}>
                      {new Date(collectionDate).toLocaleDateString("bn-BD", { month: "long", day: "numeric" })} — বাকি আদায়
                    </h4>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e7e5e4" }}>
                    {collectionData.dateCollections.map((c: { _id: string; customerName: string; amount: number; date: string }, idx: number) => (
                      <div
                        key={c._id}
                        className="flex items-center justify-between px-3 py-3"
                        style={{ borderTop: idx > 0 ? "1px solid #f5f5f4" : "none", background: "#ffffff" }}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(102,168,15,0.1)" }}>
                            <Banknote size={12} strokeWidth={2} style={{ color: "#66a80f" }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate" style={{ color: "#1c1917" }}>{c.customerName}</p>
                            <p className="text-[9px] font-medium" style={{ color: "#a8a29e" }}>
                              {new Date(c.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-[12px] font-black tracking-tight" style={{ color: "#66a80f" }}>+৳{c.amount}</p>
                          {collectionData.isAdmin && (
                            <button
                              onClick={() => deletePayment(c._id)}
                              disabled={deletingPayment === c._id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-90 transition-transform"
                              style={{ background: "#f5f5f4", color: "#78716c" }}
                              title="ডিলিট করুন"
                            >
                              {deletingPayment === c._id ? (
                                <div className="animate-spin w-3 h-3 border-[1.5px] border-t-transparent rounded-full" style={{ borderColor: "#78716c", borderTopColor: "transparent" }} />
                              ) : (
                                <Trash2 size={11} />
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
                <div className="py-8 text-center rounded-xl" style={{ background: "#fafaf9", border: "1px solid #e7e5e4" }}>
                  <p className="text-[11px] font-medium" style={{ color: "#78716c" }}>এই তারিখে কোনো আদায় নেই</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-[11px] font-medium" style={{ color: "#78716c" }}>কোনো তথ্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </AnimatedModal>
    </div>
  );
}
