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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[60px]" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Image src="/logo.png" alt="লোগো" width={30} height={30} className="rounded-lg" />
          <span className="text-[14px] font-semibold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.01em" }}>
            ভ্যারাইটিজ কসমেটিক্স
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "#374151", background: "#f3f4f6" }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: "#9ca3af" }}>মেনু</p>
          <div className="flex flex-col gap-0.5">
            {allItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 w-full group"
                    style={{
                      background: active ? "#f9fafb" : "transparent",
                      color: active ? "#111827" : "#4b5563",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {active && <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full" style={{ background: "#66a80f" }} />}
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? "#66a80f" : "#6b7280" }} />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User info + Logout */}
        <div className="px-3 pb-3" style={{ borderTop: "1px solid #e5e7eb" }}>
          <div className="flex items-center gap-3 px-2 py-3 mt-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
              style={{ background: "#f3f4f6", color: "#111827" }}
            >
              {userInfo?.displayName?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>
                {userInfo?.displayName || "..."}
              </p>
              <p className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>
                {userInfo?.role === "admin" ? "এডমিন" : "ইউজার"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 group"
              style={{ background: "#f9fafb" }}
              title="লগআউট"
            >
              <LogOut size={14} strokeWidth={2} className="text-gray-500 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center h-[56px] px-4 lg:px-6 gap-3"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "#374151", background: "#f3f4f6" }}
          >
            <Menu size={17} strokeWidth={2.2} />
          </button>
          <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.01em" }}>
            {allItems.find((i) => isActive(i.href))?.label || "ড্যাশবোর্ড"}
          </h2>
        </header>

        {/* Content */}
        <motion.div
          className="flex-1 p-4 lg:p-6 overflow-y-auto"
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
