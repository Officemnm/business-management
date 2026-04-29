"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Users, Package, CreditCard, Clock } from "lucide-react";

interface Stats {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  totalDue: number;
}

interface Activity {
  _id: string;
  description: string;
  status: string;
  dueAmount: number;
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

  const cards = [
    { label: "মোট অর্ডার", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "#66a80f" },
    { label: "মোট কাস্টমার", value: stats?.totalCustomers || 0, icon: Users, color: "#2563eb" },
    { label: "মোট প্রডাক্ট", value: stats?.totalProducts || 0, icon: Package, color: "#7c3aed" },
    { label: "মোট বিক্রি", value: `৳${stats?.totalRevenue || 0}`, icon: ShoppingCart, color: "#059669" },
    { label: "মোট বাকি", value: `৳${stats?.totalDue || 0}`, icon: CreditCard, color: "#dc2626" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl p-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}15` }}
                >
                  <Icon size={18} style={{ color: card.color }} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>
                {card.value}
              </p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <Clock size={16} style={{ color: "var(--text-muted)" }} strokeWidth={1.5} />
          <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
            সাম্প্রতিক কার্যকলাপ
          </h3>
        </div>

        {activity.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              কোনো কার্যকলাপ নেই
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
            {activity.map((item) => (
              <div key={item._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.description}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {item.createdBy} • {new Date(item.createdAt).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.dueAmount > 0 && (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#fef2f2", color: "#dc2626" }}
                    >
                      বাকি ৳{item.dueAmount}
                    </span>
                  )}
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: item.status === "completed" ? "#f0fdf4" : item.status === "pending" ? "#fffbeb" : "#fef2f2",
                      color: item.status === "completed" ? "#16a34a" : item.status === "pending" ? "#d97706" : "#dc2626",
                    }}
                  >
                    {item.status === "completed" ? "সম্পন্ন" : item.status === "pending" ? "পেন্ডিং" : "বাতিল"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
