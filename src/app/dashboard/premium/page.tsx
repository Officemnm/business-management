"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, CreditCard, ChevronRight, ChevronLeft, CheckCircle2, Package, Banknote, LayoutDashboard, Clock, CalendarDays, ShoppingCart } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedModal from "@/components/ui/AnimatedModal";
import { getBDDateString } from "@/lib/utils";

interface UserProfile {
  _id: string;
  username: string;
  displayName: string;
  role: string;
  active: boolean;
}

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

interface ChartDay { date: string; revenue: number; orders: number; collection?: number }

export default function UserReportPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Collection detail states
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionDate, setCollectionDate] = useState(getBDDateString());
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [collectionTab, setCollectionTab] = useState<"due" | "order">("due");

  useEffect(() => {
    fetch("/api/dashboard/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data.filter((u: UserProfile) => u.role !== "admin"));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleUserClick = (u: UserProfile) => {
    setSelectedUser(u);
    setLoadingStats(true);
    
    fetch(`/api/dashboard/stats?targetUser=${u.username}`)
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
            setStats(data.stats);
            setChartData(data.chartData || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setStats(null);
    setChartData([]);
  };

  const fetchCollectionData = async (date?: string) => {
    if (!selectedUser) return;
    setLoadingCollection(true);
    try {
      const targetDate = date || collectionDate;

      // Fetch payments for the selected date and specific user
      const paymentsRes = await fetch(`/api/dashboard/payments?date=${targetDate}&targetUser=${selectedUser.username}`);
      const datePayments = await paymentsRes.json();

      // Fetch stats for the selected date to get order paid amount
      const statsRes = await fetch(`/api/dashboard/stats?from=${targetDate}&to=${targetDate}&targetUser=${selectedUser.username}`);
      const dateStats = await statsRes.json();

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

      const orderPaid = dateStats.paid || 0;
      const orderCollections = dateStats.paidOrders || [];

      setCollectionData({
        orderPaid,
        dueCollection: dueCollections,
        total: orderPaid + dueCollections,
        dateCollections,
        orderCollections,
      });
    } catch {
      setCollectionData(null);
    } finally {
      setLoadingCollection(false);
    }
  };

  const openCollectionModal = () => {
    setShowCollectionModal(true);
    fetchCollectionData();
  };

  const handleCollectionDateChange = (date: string) => {
    setCollectionDate(date);
    fetchCollectionData(date);
  };

  return (
    <div className="pb-8">
      
      <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div 
            key="user-list"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Header Section */}
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>
                  ইউজার রিপোর্ট
                </h1>
                <p className="text-[13px] font-medium mt-1" style={{ color: "#6b7280" }}>
                  সব ইউজারদের আলাদা আলাদা রিপোর্ট ও বিস্তারিত হিসাব
                </p>
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {loadingUsers ? (
                  <div className="col-span-full flex items-center justify-center h-[40vh]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin w-8 h-8 border-[2.5px] border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
                      <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>ইউজার লোড হচ্ছে...</p>
                    </div>
                  </div>
              ) : users.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-2xl border" style={{ borderColor: "#f3f4f6" }}>
                    <p className="text-[14px] font-medium" style={{ color: "#9ca3af" }}>কোনো ইউজার পাওয়া যায়নি</p>
                  </div>
              ) : (
                  users.map(u => (
                      <div 
                        key={u._id} 
                        onClick={() => handleUserClick(u)}
                        className="bg-white rounded-2xl p-5 border cursor-pointer hover:shadow-sm hover:border-[#d1d5db] transition-all flex flex-col items-center group relative"
                        style={{ borderColor: "#f3f4f6" }}
                      >
                          <div className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-bold shadow-sm mb-3 transition-colors"
                               style={{ background: "#f9fafb", color: "#111827", border: "1px solid #f3f4f6" }}>
                              {u.displayName?.substring(0, 1)?.toUpperCase()}
                          </div>
                          
                          <div className="text-center w-full">
                              <h3 className="text-[15px] font-bold truncate tracking-tight transition-colors group-hover:text-[#66a80f]" style={{ color: "#111827" }}>
                                {u.displayName}
                              </h3>
                              <p className="text-[12px] font-semibold mt-0.5 truncate uppercase tracking-wider" style={{ color: "#6b7280" }}>
                                {u.role === "admin" ? "এডমিন" : u.role === "manager" ? "ম্যানেজার" : "স্টাফ"}
                              </p>
                          </div>
                          
                          <div className="mt-4 w-full pt-3 flex justify-center" style={{ borderTop: "1px solid #f9fafb" }}>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors group-hover:bg-[#66a80f]/10" style={{ background: "rgba(102,168,15,0.05)" }}>
                                  <span className="text-[11px] font-semibold" style={{ color: "#66a80f" }}>বিস্তারিত দেখুন</span>
                                  <ChevronRight size={14} style={{ color: "#66a80f" }} strokeWidth={2.5} />
                              </div>
                          </div>
                      </div>
                  ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="user-detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Header for detail view */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={clearSelection}
                    className="w-10 h-10 rounded-xl bg-white border items-center justify-center flex hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#f3f4f6", color: "#6b7280" }}
                >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 border"
                         style={{ background: "rgba(102,168,15,0.1)", color: "#4d7c0f", borderColor: "rgba(102,168,15,0.2)" }}>
                        {selectedUser.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-[18px] font-bold truncate leading-none" style={{ color: "#111827", letterSpacing: "-0.01em" }}>{selectedUser.displayName}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#66a80f" }}></span>
                            <p className="text-[11px] font-medium truncate uppercase tracking-wider" style={{ color: "#9ca3af" }}>{selectedUser.role === "admin" ? "এডমিন" : selectedUser.role === "manager" ? "ম্যানেজার" : "স্টাফ"} এর রিপোর্ট</p>
                        </div>
                    </div>
                </div>
            </div>

            {loadingStats ? (
                <div className="flex items-center justify-center h-[50vh]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin w-8 h-8 border-[2.5px] border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
                    <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>হিসাব লোড হচ্ছে...</p>
                  </div>
                </div>
            ) : !stats ? (
                <div className="py-24 text-center bg-white rounded-2xl border" style={{ borderColor: "#f3f4f6" }}>
                    <p className="font-medium text-[14px] mb-4" style={{ color: "#9ca3af" }}>ডেটা লোড করা সম্ভব হয়নি</p>
                    <button onClick={clearSelection} className="text-[13px] font-bold px-4 py-2 rounded-xl" style={{ background: "rgba(102,168,15,0.1)", color: "#4d7c0f" }}>ফিরে যান</button>
                </div>
            ) : (
                <div className="space-y-4">
                    
                    {/* TODAY'S SALES & COLLECTION */}
                    <div className="grid grid-cols-2 gap-3 pb-2">
                        {/* Today's Sales Card */}
                        <div className="bg-white border rounded-2xl p-5 relative overflow-hidden" style={{ borderColor: "#f3f4f6" }}>
                            <div className="absolute right-0 top-0 w-32 h-32 rounded-bl-full pointer-events-none -mr-8 -mt-8" style={{ background: "rgba(102,168,15,0.03)" }}></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-1.5 mb-3">
                                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)", color: "#66a80f" }}>
                                      <Clock size={13} />
                                  </div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>আজকের সেলস</p>
                                </div>
                                <p className="text-[28px] sm:text-[32px] font-bold leading-none truncate" style={{ color: "#111827", letterSpacing: "-0.025em" }}>
                                  ৳{stats.todayRevenue.toLocaleString("en-US")}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-[11px] font-semibold" style={{ color: "#66a80f" }}>{stats.todayOrders} টি অর্ডার</span>
                                </div>
                            </div>
                        </div>

                        {/* Today's Collection Card (Clickable) */}
                        <div 
                           onClick={openCollectionModal}
                           className="bg-white border cursor-pointer rounded-2xl p-5 relative overflow-hidden transition-colors hover:bg-green-50/50" 
                           style={{ borderColor: "rgba(102,168,15,0.4)", borderBottomWidth: "3px" }}
                        >
                            <div className="absolute right-0 top-0 w-32 h-32 rounded-bl-full pointer-events-none -mr-8 -mt-8" style={{ background: "rgba(102,168,15,0.03)" }}></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)", color: "#66a80f" }}>
                                        <Banknote size={13} />
                                    </div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>আজকের কালেকশন</p>
                                  </div>
                                  <ChevronRight size={16} style={{ color: "#66a80f" }} />
                                </div>
                                <p className="text-[28px] sm:text-[32px] font-bold leading-none truncate" style={{ color: "#66a80f", letterSpacing: "-0.025em" }}>
                                  ৳{stats.todayCollection.toLocaleString("en-US")}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-[11px] font-semibold" style={{ color: "#9ca3af" }}>বিস্তারিত দেখতে ক্লিক করুন</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OVERALL TOTALS ROW */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                        { title: "মোট সেলস", value: `৳${stats.totalRevenue.toLocaleString("en-US")}`, icon: <TrendingUp size={14} />, textColor: "#111827", iconBg: "rgba(17,24,39,0.05)", iconColor: "#111827" },
                        { title: "মোট কালেকশন", value: `৳${stats.totalCollection.toLocaleString("en-US")}`, icon: <CheckCircle2 size={14} />, textColor: "#059669", iconBg: "rgba(5,150,105,0.1)", iconColor: "#059669" },
                        { title: "মোট বাকি", value: `৳${stats.totalDue.toLocaleString("en-US")}`, icon: <CreditCard size={14} />, textColor: "#e11d48", iconBg: "rgba(225,29,72,0.1)", iconColor: "#e11d48" },
                        { title: "মোট অর্ডার", value: stats.totalOrders, icon: <Package size={14} />, textColor: "#111827", iconBg: "rgba(17,24,39,0.05)", iconColor: "#111827" },
                        ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl border" style={{ borderColor: "#f3f4f6" }}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{stat.title}</p>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: stat.iconBg, color: stat.iconColor }}>
                                    {stat.icon}
                                </div>
                            </div>
                            <p className="text-[24px] font-bold leading-none truncate" style={{ color: stat.textColor, letterSpacing: "-0.025em" }}>{stat.value}</p>
                        </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2">
                        {/* Area Chart */}
                        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border flex flex-col" style={{ borderColor: "#f3f4f6" }}>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[14px] font-bold flex items-center gap-2" style={{ color: "#111827" }}>
                                    গত ৭ দিনের গ্রাফ
                                </h4>
                                <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#6b7280" }}></span>সেলস</div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#66a80f" }}></span>কালেকশন</div>
                                </div>
                            </div>
                            
                            <div className="h-[220px] sm:h-[260px] flex-1">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                        <linearGradient id="colorRevCommon" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorColCommon" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#66a80f" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#66a80f" stopOpacity={0} />
                                        </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} dy={10} />
                                        <Tooltip
                                        cursor={{ stroke: '#f3f4f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 border shadow-sm rounded-xl min-w-[140px]" style={{ borderColor: "#f3f4f6" }}>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 border-b pb-1.5" style={{ color: "#9ca3af", borderColor: "#f9fafb" }}>{label}</p>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full" style={{ background: "#6b7280" }}></div>
                                                                <p className="text-[12px] font-medium" style={{ color: "#6b7280" }}>সেলস</p>
                                                            </div>
                                                            <p className="text-[12px] font-bold" style={{ color: "#111827" }}>৳{Number(payload[0].value).toLocaleString("en-US")}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full" style={{ background: "#66a80f" }}></div>
                                                                <p className="text-[12px] font-medium" style={{ color: "#6b7280" }}>কালেকশন</p>
                                                            </div>
                                                            <p className="text-[12px] font-bold" style={{ color: "#111827" }}>৳{Number(payload[1]?.value || 0).toLocaleString("en-US")}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                            }
                                            return null;
                                        }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#6b7280" strokeWidth={2} fill="url(#colorRevCommon)" activeDot={{ r: 5, fill: "#6b7280", stroke: "#fff", strokeWidth: 2 }} />
                                        <Area type="monotone" dataKey="collection" stroke="#66a80f" strokeWidth={2} fill="url(#colorColCommon)" activeDot={{ r: 5, fill: "#66a80f", stroke: "#fff", strokeWidth: 2 }} />
                                    </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center rounded-xl" style={{ border: "1px dashed #e5e7eb" }}>
                                      <p className="text-[12px] font-medium" style={{ color: "#9ca3af" }}>পর্যাপ্ত ডেটা নেই</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Summary Column */}
                        <div className="bg-white p-5 rounded-2xl border" style={{ borderColor: "#f3f4f6" }}>
                            <div>
                                <h4 className="text-[14px] font-bold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
                                    <div className="w-1.5 h-4 rounded-full" style={{ background: "#66a80f" }}></div>
                                    কাজের বিস্তারিত
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center rounded-xl p-3 border" style={{ background: "#f9fafb", borderColor: "#f3f4f6" }}>
                                        <p className="text-[12px] font-semibold" style={{ color: "#6b7280" }}>আজকের অর্ডার</p>
                                        <p className="text-[14px] font-bold" style={{ color: "#111827" }}>{stats.todayOrders}</p>
                                    </div>
                                    <div className="flex justify-between items-center rounded-xl p-3 border" style={{ background: "rgba(102,168,15,0.05)", borderColor: "rgba(102,168,15,0.1)" }}>
                                        <p className="text-[12px] font-semibold" style={{ color: "#4d7c0f" }}>ডেলিভারী সম্পন্ন</p>
                                        <p className="text-[14px] font-bold" style={{ color: "#4d7c0f" }}>{stats.todayDelivered}</p>
                                    </div>
                                    <div className="flex justify-between items-center rounded-xl p-3 border" style={{ background: "rgba(225,29,72,0.03)", borderColor: "rgba(225,29,72,0.1)" }}>
                                        <p className="text-[12px] font-semibold" style={{ color: "#be123c" }}>পেন্ডিং ডেলিভারী</p>
                                        <p className="text-[14px] font-bold" style={{ color: "#be123c" }}>{stats.todayPending}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedModal open={showCollectionModal} onClose={() => setShowCollectionModal(false)} title="কালেকশনের বিস্তারিত" maxWidth="max-w-md">
        <div className="space-y-5">
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                <Banknote size={15} className="text-[#66a80f]" />
                আদায় রিপোর্ট
              </h4>
            </div>

            <div className="flex items-center justify-between w-full p-1.5 rounded-xl bg-white shadow-sm border border-gray-100 mb-5">
              <button
                onClick={() => {
                  const d = new Date(collectionDate);
                  d.setDate(d.getDate() - 1);
                  handleCollectionDateChange(getBDDateString(d));
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <div className="relative flex-1 flex justify-center items-center">
                <div className="flex items-center gap-2 text-[14px] font-bold text-gray-800">
                  {new Date(collectionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
                </div>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => handleCollectionDateChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <button
                onClick={() => {
                  const d = new Date(collectionDate);
                  d.setDate(d.getDate() + 1);
                  handleCollectionDateChange(getBDDateString(d));
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
                <div className="rounded-2xl p-6 relative overflow-hidden bg-[#66a80f] shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
                  <p className="text-[12px] font-semibold text-green-100 uppercase tracking-wider">সর্বমোট আদায়</p>
                  <p className="text-[36px] font-extrabold mt-1 text-white leading-none tracking-tight">
                    ৳{((collectionData?.total) || 0).toLocaleString("en-US")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setCollectionTab("due")}
                    className={`cursor-pointer rounded-xl p-4 bg-white border shadow-sm transition-all hover:border-[#66a80f]/30 ${collectionTab === "due" ? "border-[#66a80f] ring-1 ring-[#66a80f]" : "border-gray-100"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Banknote size={14} className="text-orange-500" />
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500">বাকি আদায়</p>
                    </div>
                    <p className="text-[20px] font-bold text-gray-900">৳{((collectionData?.dueCollection) || 0).toLocaleString("en-US")}</p>
                    <p className="text-[11px] font-medium mt-1" style={{ color: collectionTab === "due" ? "#66a80f" : "#9ca3af" }}>{collectionData?.dateCollections?.length || 0} জনের থেকে</p>
                  </div>
                  
                  <div 
                    onClick={() => setCollectionTab("order")}
                    className={`cursor-pointer rounded-xl p-4 bg-white border shadow-sm transition-all hover:border-blue-500/30 ${collectionTab === "order" ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-100"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <ShoppingCart size={14} className="text-blue-500" />
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500">নগদ আদায় (অর্ডার)</p>
                    </div>
                    <p className="text-[20px] font-bold text-gray-900">৳{((collectionData?.orderPaid) || 0).toLocaleString("en-US")}</p>
                    <p className="text-[11px] font-medium mt-1" style={{ color: collectionTab === "order" ? "#3b82f6" : "#9ca3af" }}>{collectionData?.orderCollections?.length || 0} টি অর্ডার থেকে</p>
                  </div>
                </div>

                {collectionTab === "due" && (
                  <>
                    {(collectionData?.dateCollections?.length || 0) > 0 ? (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <p className="text-[12px] font-bold text-gray-800">বাকি আদায়ের বিস্তারিত তালিকা</p>
                          <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {collectionData.dateCollections.length} টি
                          </span>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                          {collectionData.dateCollections.map((c: any, idx: number) => (
                            <div key={c._id} className={`flex items-center p-3.5 hover:bg-gray-50 transition-colors ${idx > 0 ? "border-t border-gray-100" : ""}`}>
                              <div className="w-9 h-9 rounded-full bg-[#66a80f]/10 flex items-center justify-center shrink-0">
                                <span className="text-[14px] font-bold text-[#66a80f]">{c.customerName.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0 ml-3">
                                <p className="text-[14px] font-bold text-gray-800 truncate">{c.customerName}</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                                  {new Date(c.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })} · {new Date(c.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <p className="text-[15px] font-bold text-[#66a80f]">+৳{c.amount.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                        <Banknote size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-[13px] font-medium text-gray-500">কোনো বাকি আদায় নেই</p>
                      </div>
                    )}
                  </>
                )}

                {collectionTab === "order" && (
                  <>
                    {(collectionData?.orderCollections?.length || 0) > 0 ? (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <p className="text-[12px] font-bold text-gray-800">অর্ডার থেকে আদায়ের তালিকা</p>
                          <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {collectionData.orderCollections.length} টি
                          </span>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                          {collectionData.orderCollections.map((o: any, idx: number) => (
                            <div key={o._id} className={`flex items-center p-3.5 hover:bg-gray-50 transition-colors ${idx > 0 ? "border-t border-gray-100" : ""}`}>
                              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                <span className="text-[14px] font-bold text-blue-600">{o.customerName.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0 ml-3">
                                <p className="text-[14px] font-bold text-gray-800 truncate">{o.customerName}</p>
                                <p className="text-[11px] font-medium mt-0.5">
                                  {o.dueAmount > 0 ? (
                                     <span className="text-red-500 font-semibold">বাকি আছে: ৳{o.dueAmount.toLocaleString()}</span>
                                  ) : (
                                     <span className="text-[#66a80f] font-semibold">সম্পূর্ণ পরিশোধ</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <p className="text-[15px] font-bold text-blue-600">+৳{o.paidAmount.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                        <ShoppingCart size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-[13px] font-medium text-gray-500">কোনো নগদ আদায় নেই</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}