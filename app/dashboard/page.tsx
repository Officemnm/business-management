"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Users, TrendingUp, Package,
  Bell, Settings, LogOut, Menu, X, ChevronUp, ChevronDown,
  Star, ArrowUpRight, Sparkles, DollarSign, Eye, ShoppingCart,
  Wallet, PiggyBank, Clock, RotateCcw
} from "lucide-react";
import UserManagement from "./UserManagement";
import CardDetail from "./CardDetail";
import CustomerManagement from "./CustomerManagement";
import ProductManagement from "./ProductManagement";
import NewOrderCreation from "./NewOrderCreation";

/* ── useWindowWidth ── */
function useWindowWidth() {
  const [w, setW] = useState(1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

/* ── Animated Counter ── */
function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const inc = to / (1800 / 16);
    const t = setInterval(() => {
      start += inc;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [to]);
  return <>{prefix}{val.toLocaleString("bn-BD")}{suffix}</>;
}

function PulsingRing({ color }: { color: string }) {
  return (
    <motion.span
      style={{ position: "absolute", inset: -6, borderRadius: "50%", border: `1.5px solid ${color}`, opacity: 0 }}
      animate={{ opacity: [0, 0.5, 0], scale: [0.85, 1.25, 1.45] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

const stats = [
  { id: "revenue", label: "মোট আয়", value: 284750, prefix: "৳", suffix: "", icon: DollarSign, color: "#8b3a5a", bg: "rgba(139,58,90,0.1)", trend: "+12.4%", up: true },
  { id: "orders", label: "মোট অর্ডার", value: 1842, prefix: "", suffix: "টি", icon: ShoppingCart, color: "#2563eb", bg: "rgba(37,99,235,0.08)", trend: "+8.1%", up: true },
  { id: "customers", label: "গ্রাহক", value: 4291, prefix: "", suffix: "জন", icon: Users, color: "#059669", bg: "rgba(5,150,105,0.08)", trend: "+5.3%", up: true },
  { id: "products", label: "পণ্য", value: 136, prefix: "", suffix: "টি", icon: Package, color: "#d97706", bg: "rgba(217,119,6,0.08)", trend: "-2.1%", up: false },
  { id: "dailySales", label: "নতুন অর্ডার", value: 15420, prefix: "", suffix: "টি", icon: ShoppingCart, color: "#7c3aed", bg: "rgba(124,58,237,0.08)", trend: "+10.3%", up: true },
  { id: "profit", label: "মুনাফা", value: 89200, prefix: "৳", suffix: "", icon: PiggyBank, color: "#0891b2", bg: "rgba(8,145,178,0.08)", trend: "+18.5%", up: true },
  { id: "pending", label: "পেন্ডিং অর্ডার", value: 47, prefix: "", suffix: "টি", icon: Clock, color: "#ea580c", bg: "rgba(234,88,12,0.08)", trend: "-6.2%", up: true },
  { id: "returns", label: "রিটার্ন", value: 12, prefix: "", suffix: "টি", icon: RotateCcw, color: "#dc2626", bg: "rgba(220,38,38,0.08)", trend: "-8.4%", up: true },
];

const recentOrders = [
  { id: "#VC-1091", customer: "রাহেলা বেগম", product: "রোজ ফেস ক্রিম", amount: "৳ ৮৫০", status: "সম্পন্ন", dot: "#059669" },
  { id: "#VC-1090", customer: "নিলুফার খানম", product: "ল্যাভেন্ডার সিরাম", amount: "৳ ১,২৫০", status: "প্রক্রিয়াধীন", dot: "#d97706" },
  { id: "#VC-1089", customer: "সাবরিনা আক্তার", product: "গোল্ড নাইট ক্রিম", amount: "৳ ২,১০০", status: "সম্পন্ন", dot: "#059669" },
  { id: "#VC-1088", customer: "তানিয়া ইসলাম", product: "ভিটামিন-সি ওয়াশ", amount: "৳ ৬৫০", status: "ডেলিভারি", dot: "#2563eb" },
  { id: "#VC-1087", customer: "মৌসুমী রহমান", product: "পার্ল হাইড্রেটর", amount: "৳ ১,৮০০", status: "বাতিল", dot: "#dc2626" },
];

const topProducts = [
  { name: "রোজ ফেস ক্রিম", sold: 312, pct: 88 },
  { name: "গোল্ড নাইট ক্রিম", sold: 248, pct: 70 },
  { name: "ল্যাভেন্ডার সিরাম", sold: 196, pct: 55 },
  { name: "ভিটামিন-সি ওয়াশ", sold: 164, pct: 46 },
];

const navItems = [
  { icon: LayoutDashboard, label: "ড্যাশবোর্ড", section: "dashboard" },
  { icon: ShoppingBag, label: "অর্ডার", section: "orders" },
  { icon: Package, label: "পণ্যসমূহ", section: "products" },
  { icon: Users, label: "ব্যবহারকারী", section: "users" },
  { icon: TrendingUp, label: "রিপোর্ট", section: "reports" },
  { icon: Settings, label: "সেটিংস", section: "settings" },
];

export default function DashboardPage() {
  const router = useRouter();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notif, setNotif] = useState(3);
  const [activeSection, setActiveSection] = useState("dashboard");

  // On desktop default open, mobile default closed
  useEffect(() => { setSidebarOpen(!isMobile); }, [isMobile]);

  const closeSidebar = useCallback(() => { if (isMobile) setSidebarOpen(false); }, [isMobile]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
  const itemV = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } } };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#fdf6f8 0%,#f8f4f6 100%)", fontFamily: "var(--font-kalpurush),'Georgia',serif", position: "relative" }}>

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeSidebar}
            style={{ position: "fixed", inset: 0, background: "rgba(26,15,20,0.45)", zIndex: 60, backdropFilter: "blur(2px)" }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: 240, flexShrink: 0, display: "flex", flexDirection: "column",
              background: "rgba(255,253,251,0.99)",
              borderRight: "1px solid rgba(139,58,90,0.10)",
              boxShadow: "4px 0 28px rgba(26,15,20,0.10)",
              // mobile: fixed overlay; desktop: sticky
              ...(isMobile
                ? { position: "fixed", top: 0, left: 0, height: "100%", zIndex: 70 }
                : { position: "sticky", top: 0, height: "100vh", zIndex: 50 }),
              overflowY: "auto",
            }}
          >
            {/* Brand */}
            <div style={{ padding: "24px 20px 18px", borderBottom: "1px solid rgba(139,58,90,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ position: "relative", width: 36, height: 36 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#8b3a5a,#d4899f)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(139,58,90,0.35)" }}>
                    <Sparkles size={16} color="#fff" />
                  </motion.div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "#1a0f14", letterSpacing: "0.05em" }}>ভ্যারাইটিজ কসমেটিক্স</div>
                  <div style={{ fontSize: "0.62rem", color: "#8a7078", letterSpacing: "0.08em" }}>COSMETICS</div>
                </div>
              </motion.div>
              {isMobile && (
                <button onClick={closeSidebar} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a7078", display: "flex", padding: 4 }}>
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "14px 10px" }}>
              {navItems.map((n, i) => {
                const isActive = activeSection === n.section;
                return (
                  <motion.button key={n.label}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05 }}
                    onClick={() => { setActiveSection(n.section); closeSidebar(); }}
                    whileHover={{ x: 3, backgroundColor: "rgba(139,58,90,0.06)" }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "11px 14px", marginBottom: 3,
                      borderRadius: 8, border: "none", cursor: "pointer",
                      background: isActive ? "rgba(139,58,90,0.10)" : "transparent",
                      color: isActive ? "#8b3a5a" : "#3d2e35",
                      fontSize: "0.83rem", letterSpacing: "0.02em", textAlign: "left",
                    }}>
                    <n.icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                    {n.label}
                    {isActive && <motion.div layoutId="nav-dot" style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#8b3a5a" }} />}
                  </motion.button>
                );
              })}
            </nav>

            {/* Logout */}
            <div style={{ padding: "14px 10px", borderTop: "1px solid rgba(139,58,90,0.08)" }}>
              <motion.button whileHover={{ x: 3 }} onClick={handleLogout}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "#8a7078", fontSize: "0.83rem" }}>
                <LogOut size={15} style={{ opacity: 0.65 }} />
                লগ আউট
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, width: "100%" }}>

        {/* Topbar */}
        <motion.header
          initial={{ y: -56, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", height: 58,
            background: "rgba(255,253,251,0.96)", backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(139,58,90,0.08)",
            boxShadow: "0 2px 12px rgba(26,15,20,0.04)",
            position: "sticky", top: 0, zIndex: 40,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={() => setSidebarOpen(p => !p)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#3d2e35", display: "flex", padding: 6, borderRadius: 8 }}>
              <Menu size={20} />
            </motion.button>
            <div>
              <div style={{ fontSize: isMobile ? "0.82rem" : "0.90rem", fontWeight: 600, color: "#1a0f14" }}>স্বাগতম, Admin! 👋</div>
              {!isMobile && <div style={{ fontSize: "0.67rem", color: "#8a7078" }}>আজকের ব্যবসায়িক সারসংক্ষেপ</div>}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={() => setNotif(0)}
              style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "#3d2e35", display: "flex", padding: 6 }}>
              <Bell size={19} />
              <AnimatePresence>
                {notif > 0 && (
                  <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#8b3a5a", color: "#fff", fontSize: "0.52rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {notif}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.div whileHover={{ scale: 1.06 }}
              style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#8b3a5a,#d4899f)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.80rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(139,58,90,0.28)", flexShrink: 0 }}>
              A
            </motion.div>
          </div>
        </motion.header>

        {/* Content */}
        <main style={{ flex: 1, padding: isMobile ? "16px 12px 32px" : "24px 24px 40px", overflowY: "auto" }}>
          {activeSection === "users" && <UserManagement />}

          {/* Customer Management Page */}
          {activeSection === "customers" && (
            <CustomerManagement onBack={() => setActiveSection("dashboard")} />
          )}

          {/* Product Management Page */}
          {activeSection === "products" && (
            <ProductManagement onBack={() => setActiveSection("dashboard")} />
          )}

          {/* New Order creation */}
          {activeSection === "dailySales" && (
            <NewOrderCreation onBack={() => setActiveSection("dashboard")} />
          )}

          {/* Card Detail Pages (exclude customers & products — have their own pages) */}
          {!["customers", "products", "dailySales"].includes(activeSection) && stats.map(s => s.id).includes(activeSection) && (
            <CardDetail
              key={activeSection}
              {...stats.find(s => s.id === activeSection)!}
              onBack={() => setActiveSection("dashboard")}
            />
          )}

          {/* Stats Grid — 2 cols on mobile, 4 on desktop */}
          {activeSection === "dashboard" && <>
          <motion.div variants={containerV} initial="hidden" animate="visible"
            style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 14 : 22 }}>
            {stats.map(s => (
              <motion.div key={s.id} variants={itemV}
                onClick={() => setActiveSection(s.id)}
                whileHover={{ y: -3, boxShadow: "0 10px 32px rgba(26,15,20,0.10)", cursor: "pointer" }}
                whileTap={{ scale: 0.97 }}
                style={{ background: "rgba(255,253,251,0.97)", borderRadius: 12, padding: isMobile ? "14px 12px" : "20px 18px", border: "1px solid rgba(235,220,225,0.80)", boxShadow: "0 2px 12px rgba(26,15,20,0.05)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ position: "relative", width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <PulsingRing color={s.color} />
                    <s.icon size={isMobile ? 16 : 19} color={s.color} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: "0.62rem", color: s.up ? "#059669" : "#dc2626", background: s.up ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)", padding: "2px 6px", borderRadius: 20 }}>
                    {s.up ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    {s.trend}
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? "1.15rem" : "1.45rem", fontWeight: 700, color: "#1a0f14", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  <Counter to={s.value} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: "0.68rem", color: "#8a7078", marginTop: 5 }}>{s.label}</div>
                {/* Hover shimmer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  style={{ position: "absolute", inset: 0, borderRadius: 12, background: `linear-gradient(135deg, ${s.color}05, ${s.color}0a)`, pointerEvents: "none" }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Lower — stacked on mobile, side-by-side on desktop */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: isMobile ? 14 : 18 }}>

            {/* Recent Orders */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: "rgba(255,253,251,0.97)", borderRadius: 12, border: "1px solid rgba(235,220,225,0.80)", boxShadow: "0 2px 12px rgba(26,15,20,0.05)", overflow: "hidden" }}>
              <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(139,58,90,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <ShoppingBag size={15} color="#8b3a5a" />
                  <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#1a0f14" }}>সাম্প্রতিক অর্ডার</span>
                </div>
                <button style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", fontSize: "0.70rem", color: "#8b3a5a" }}>
                  সব দেখুন <ArrowUpRight size={11} />
                </button>
              </div>

              {/* Mobile: card list; Desktop: table */}
              {isMobile ? (
                <div style={{ padding: "8px 0" }}>
                  {recentOrders.map((o, i) => (
                    <motion.div key={o.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.06 }}
                      style={{ padding: "11px 16px", borderBottom: "1px solid rgba(139,58,90,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.72rem", color: "#8b3a5a", fontWeight: 600, marginBottom: 2 }}>{o.id}</div>
                        <div style={{ fontSize: "0.78rem", color: "#1a0f14", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer}</div>
                        <div style={{ fontSize: "0.70rem", color: "#8a7078", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.product}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "0.78rem", color: "#1a0f14", fontWeight: 600, marginBottom: 4 }}>{o.amount}</div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.65rem", color: o.dot, background: `${o.dot}14`, padding: "2px 7px", borderRadius: 20 }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: o.dot, display: "inline-block" }} />
                          {o.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(139,58,90,0.06)" }}>
                        {["অর্ডার আইডি", "গ্রাহক", "পণ্য", "পরিমাণ", "অবস্থা"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.63rem", color: "#8a7078", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o, i) => (
                        <motion.tr key={o.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 + i * 0.06 }}
                          whileHover={{ backgroundColor: "rgba(139,58,90,0.025)" }}
                          style={{ borderBottom: "1px solid rgba(139,58,90,0.04)" }}>
                          <td style={{ padding: "11px 16px", fontSize: "0.74rem", color: "#8b3a5a", fontWeight: 600 }}>{o.id}</td>
                          <td style={{ padding: "11px 16px", fontSize: "0.77rem", color: "#1a0f14" }}>{o.customer}</td>
                          <td style={{ padding: "11px 16px", fontSize: "0.77rem", color: "#3d2e35" }}>{o.product}</td>
                          <td style={{ padding: "11px 16px", fontSize: "0.77rem", color: "#1a0f14", fontWeight: 600 }}>{o.amount}</td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: o.dot, background: `${o.dot}14`, padding: "3px 9px", borderRadius: 20 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: o.dot, display: "inline-block" }} />
                              {o.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Top Products */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ background: "rgba(255,253,251,0.97)", borderRadius: 12, border: "1px solid rgba(235,220,225,0.80)", boxShadow: "0 2px 12px rgba(26,15,20,0.05)", padding: "18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
                <Star size={15} color="#d97706" fill="#d97706" />
                <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#1a0f14" }}>শীর্ষ পণ্য</span>
              </div>
              {topProducts.map((p, i) => (
                <motion.div key={p.name}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48 + i * 0.08 }}
                  style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: "0.77rem", color: "#1a0f14" }}>{p.name}</span>
                    <span style={{ fontSize: "0.70rem", color: "#8a7078", flexShrink: 0, marginLeft: 8 }}>{p.sold} বিক্রি</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 8, background: "rgba(139,58,90,0.08)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${p.pct}%` }}
                      transition={{ delay: 0.52 + i * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: "100%", borderRadius: 8, background: "linear-gradient(90deg,#8b3a5a,#d4899f)" }} />
                  </div>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                style={{ marginTop: 20, padding: "13px 14px", borderRadius: 10, background: "linear-gradient(135deg,rgba(139,58,90,0.07),rgba(212,137,159,0.07))", border: "1px solid rgba(139,58,90,0.12)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <Eye size={12} color="#8b3a5a" />
                  <span style={{ fontSize: "0.68rem", color: "#8b3a5a", fontWeight: 600, letterSpacing: "0.04em" }}>আজকের অন্তর্দৃষ্টি</span>
                </div>
                <p style={{ fontSize: "0.73rem", color: "#3d2e35", lineHeight: 1.65 }}>
                  রোজ ফেস ক্রিম এ সপ্তাহে সর্বোচ্চ বিক্রি হয়েছে। স্টক পুনরায় পূরণ করুন।
                </p>
              </motion.div>
            </motion.div>
          </div>
          </> }
        </main>
      </div>
    </div>
  );
}
