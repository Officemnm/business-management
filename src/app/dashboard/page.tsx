"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Users, Package, CreditCard, Clock, TrendingUp, ArrowRight, Truck, CheckCircle2, AlertCircle } from "lucide-react";

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
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
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
      {/* Today Summary Banner */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: "linear-gradient(135deg, #66a80f 0%, #4d7c0f 100%)" }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} color="#fff" />
          <h2 className="text-[15px] font-bold text-white">আজকের সারাংশ</h2>
          <span className="text-[11px] ml-auto text-white/70">{todayLabel}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.15)" }}>
            <p className="text-[11px] text-white/70">অর্ডার</p>
            <p className="text-[22px] font-bold text-white">{stats?.todayOrders || 0}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.15)" }}>
            <p className="text-[11px] text-white/70">বিক্রি</p>
            <p className="text-[22px] font-bold text-white">৳{stats?.todayRevenue || 0}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.15)" }}>
            <p className="text-[11px] text-white/70">ডেলিভারড</p>
            <p className="text-[22px] font-bold text-white">{stats?.todayDelivered || 0}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.15)" }}>
            <p className="text-[11px] text-white/70">পেন্ডিং</p>
            <p className="text-[22px] font-bold text-white">{stats?.todayPending || 0}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: "মোট অর্ডার", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "#66a80f", bg: "#f0fdf4" },
          { label: "মোট কাস্টমার", value: stats?.totalCustomers || 0, icon: Users, color: "#2563eb", bg: "#eff6ff" },
          { label: "মোট প্রডাক্ট", value: stats?.totalProducts || 0, icon: Package, color: "#7c3aed", bg: "#f5f3ff" },
          { label: "মোট বিক্রি", value: `৳${stats?.totalRevenue || 0}`, icon: TrendingUp, color: "#059669", bg: "#ecfdf5" },
          { label: "মোট বাকি", value: `৳${stats?.totalDue || 0}`, icon: CreditCard, color: "#dc2626", bg: "#fef2f2" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl p-4 transition-shadow duration-200"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon size={20} style={{ color: card.color }} strokeWidth={1.5} />
                </div>
                <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="text-[22px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>{card.value}</p>
              <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: "#66a80f" }} strokeWidth={1.5} />
            <h3 className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>সাম্প্রতিক অর্ডার</h3>
          </div>
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{activity.length} অর্ডার</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <ShoppingCart size={36} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>কোনো অর্ডার নেই</p>
          </div>
        ) : (
          <div>
            {activity.map((item, idx) => {
              const ds = item.deliveryStatus || "pending";
              return (
                <div key={item._id} className="flex items-center gap-3 px-5 py-3.5" style={{ borderTop: idx > 0 ? "1px solid var(--border-color)" : "none" }}>
                  {/* Status icon */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: ds === "delivered" ? "#f0fdf4" : ds === "not_delivered" ? "#fef2f2" : "#fffbeb" }}>
                    {ds === "delivered" ? <CheckCircle2 size={16} style={{ color: "#16a34a" }} /> :
                     ds === "not_delivered" ? <AlertCircle size={16} style={{ color: "#dc2626" }} /> :
                     <Truck size={16} style={{ color: "#d97706" }} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.customerName}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={{
                          background: item.status === "completed" ? "#f0fdf4" : item.status === "cancelled" ? "#fef2f2" : "#fffbeb",
                          color: item.status === "completed" ? "#16a34a" : item.status === "cancelled" ? "#dc2626" : "#d97706",
                        }}>
                        {item.status === "completed" ? "সম্পন্ন" : item.status === "cancelled" ? "বাতিল" : "পেন্ডিং"}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {item.itemCount} পণ্য &middot; {item.createdBy} &middot; {new Date(item.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold" style={{ color: "#66a80f" }}>৳{item.totalAmount}</p>
                    {item.dueAmount > 0 && (
                      <p className="text-[10px] font-semibold" style={{ color: "#dc2626" }}>বাকি ৳{item.dueAmount}</p>
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
