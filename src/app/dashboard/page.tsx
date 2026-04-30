"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Users, Package, CreditCard, Clock, TrendingUp, Truck, CheckCircle2, AlertCircle, CalendarDays } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface Stats {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  totalDue: number;
  todayOrders: number;
  todayRevenue: number;
  todayDelivered: number;
  todayPending: number;
}

interface ChartDay { date: string; revenue: number; orders: number; }

interface Activity {
  _id: string;
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: "মোট অর্ডার", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "#66a80f" },
          { label: "মোট কাস্টমার", value: stats?.totalCustomers || 0, icon: Users, color: "#2563eb" },
          { label: "মোট প্রডাক্ট", value: stats?.totalProducts || 0, icon: Package, color: "#7c3aed" },
          { label: "মোট বিক্রি", value: `৳${stats?.totalRevenue || 0}`, icon: TrendingUp, color: "#059669" },
          { label: "মোট বাকি", value: `৳${stats?.totalDue || 0}`, icon: CreditCard, color: "#dc2626" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl p-3.5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
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

      {/* Recent Orders */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "var(--text-muted)" }} strokeWidth={1.5} />
            <h3 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>সাম্প্রতিক অর্ডার</h3>
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
              const ds = item.deliveryStatus || "pending";
              return (
                <div key={item._id} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: idx > 0 ? "1px solid var(--border-color)" : "none" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: ds === "delivered" ? "#f0fdf4" : ds === "not_delivered" ? "#fef2f2" : "#fffbeb" }}>
                    {ds === "delivered" ? <CheckCircle2 size={14} style={{ color: "#16a34a" }} /> :
                     ds === "not_delivered" ? <AlertCircle size={14} style={{ color: "#dc2626" }} /> :
                     <Truck size={14} style={{ color: "#d97706" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.customerName}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {item.itemCount} পণ্য · {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>৳{item.totalAmount}</p>
                    {item.dueAmount > 0 && (
                      <p className="text-[9px] font-semibold" style={{ color: "#dc2626" }}>বাকি ৳{item.dueAmount}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
