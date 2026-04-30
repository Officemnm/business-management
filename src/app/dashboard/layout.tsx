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
            style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }}
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
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border-color)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <Image src="/logo.png" alt="লোগো" width={36} height={36} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            ভ্যারাইটিজ কসমেটিক্স
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {allItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <motion.div key={item.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }} whileHover={{ x: 4 }}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 w-full"
                    style={{
                      background: active ? "rgba(102, 168, 15, 0.1)" : "transparent",
                      color: active ? "#66a80f" : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User info + Logout */}
        <div className="px-3 pb-4">
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-lg mb-2"
            style={{ background: "var(--bg-input)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "#66a80f" }}
            >
              {userInfo?.displayName?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {userInfo?.displayName || "..."}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {userInfo?.role === "admin" ? "এডমিন" : "ইউজার"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors duration-150"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={16} strokeWidth={1.5} />
            লগআউট
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center h-16 px-5 gap-4"
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
          >
            <Menu size={20} />
          </button>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {allItems.find((i) => isActive(i.href))?.label || "ড্যাশবোর্ড"}
          </h2>
        </header>

        {/* Content */}
        <motion.div
          className="flex-1 p-5 overflow-y-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          key={pathname}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
