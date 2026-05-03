"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  PackagePlus,
  CreditCard,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserInfo {
  role: string;
  displayName: string;
}

const navItems = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "অর্ডার", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "কাস্টমার", icon: Users },
  { href: "/dashboard/products/add", label: "প্রডাক্ট এড", icon: PackagePlus },
  { href: "/dashboard/products", label: "সকল প্রডাক্ট", icon: Package },
  { href: "/dashboard/dues", label: "বাকি", icon: CreditCard },
];

const adminItems = [
  { href: "/dashboard/users", label: "ইউজার ম্যানেজমেন্ট", icon: UserCog },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUserInfo(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    toast.success("সফলভাবে লগআউট হয়েছে");
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/products") return pathname === "/dashboard/products";
    return pathname.startsWith(href);
  };

  const allItems = userInfo?.role === "admin" ? [...navItems, ...adminItems] : navItems;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.15)", backdropFilter: "blur(6px)" }}
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[270px] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "#ffffff",
          borderRight: "0.5px solid #e5e5ea",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[64px]" style={{ borderBottom: "0.5px solid #e5e5ea" }}>
          <Image src="/logo.png" alt="লোগো" width={32} height={32} className="rounded-[10px]" />
          <span className="text-[14px] font-semibold tracking-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.01em" }}>
            ভ্যারাইটিজ কসমেটিক্স
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden cursor-pointer w-8 h-8 rounded-full flex items-center justify-center active:opacity-60 transition-opacity"
            style={{ color: "#1d1d1f", background: "#f2f2f7" }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 overflow-y-auto">
          <p className="text-[11px] font-semibold uppercase tracking-wider px-3 mb-2.5" style={{ color: "#86868b" }}>মেনু</p>
          <div className="flex flex-col gap-0.5">
            {allItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-all duration-150 w-full"
                    style={{
                      background: active ? "#f2f2f7" : "transparent",
                      color: active ? "#1d1d1f" : "#3c3c43",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: active ? "rgba(102,168,15,0.12)" : "transparent" }}>
                      <Icon size={16} strokeWidth={2} style={{ color: active ? "#66a80f" : "#86868b" }} />
                    </div>
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User info + Logout */}
        <div className="px-3 pb-4" style={{ borderTop: "0.5px solid #e5e5ea" }}>
          <div className="flex items-center gap-3 px-3 py-3 mt-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold"
              style={{ background: "#f2f2f7", color: "#1d1d1f" }}
            >
              {userInfo?.displayName?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: "#1d1d1f" }}>
                {userInfo?.displayName || "..."}
              </p>
              <p className="text-[11px] font-medium" style={{ color: "#86868b" }}>
                {userInfo?.role === "admin" ? "এডমিন" : "ইউজার"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:opacity-60 transition-opacity"
              style={{ color: "#ff3b30", background: "#f2f2f7" }}
              title="লগআউট"
            >
              <LogOut size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center h-[56px] px-4 gap-3"
          style={{
            background: "rgba(242,242,247,0.8)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderBottom: "0.5px solid rgba(0,0,0,0.06)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden cursor-pointer w-9 h-9 rounded-full flex items-center justify-center active:opacity-60 transition-opacity"
            style={{ color: "#1d1d1f", background: "rgba(255,255,255,0.7)" }}
          >
            <Menu size={17} strokeWidth={2.5} />
          </button>
          <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: "#1d1d1f", letterSpacing: "-0.01em" }}>
            {allItems.find((i) => isActive(i.href))?.label || "ড্যাশবোর্ড"}
          </h2>
        </header>

        {/* Content */}
        <motion.div
          className="flex-1 p-4 overflow-y-auto"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          key={pathname}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
