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
  UserCheck,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserInfo {
  role: string;
  displayName: string;
}

const navItems = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard, accent: "blue" },
  { href: "/dashboard/summary", label: "সামারি", icon: BarChart3, accent: "violet" },
  { href: "/dashboard/orders", label: "অর্ডার", icon: ShoppingCart, accent: "emerald" },
  { href: "/dashboard/customers", label: "কাস্টমার", icon: Users, accent: "indigo" },
  { href: "/dashboard/products/add", label: "প্রডাক্ট এড", icon: PackagePlus, accent: "amber" },
  { href: "/dashboard/products", label: "সকল প্রডাক্ট", icon: Package, accent: "orange" },
  { href: "/dashboard/dues", label: "বাকি", icon: CreditCard, accent: "rose" },
];

const adminItems = [
  { href: "/dashboard/users", label: "ইউজার ম্যানেজমেন্ট", icon: UserCog, accent: "violet" },
  { href: "/dashboard/premium", label: "ইউজার রিপোর্ট", icon: UserCheck, accent: "fuchsia" },
];

// Map for nav item accent colours (used for icon bg + active state)
const accentMap: Record<string, { bg: string; bgActive: string; text: string; textActive: string; dot: string }> = {
  blue: { bg: "bg-blue-50", bgActive: "bg-blue-100", text: "text-blue-600", textActive: "text-blue-700", dot: "bg-blue-500" },
  violet: { bg: "bg-violet-50", bgActive: "bg-violet-100", text: "text-violet-600", textActive: "text-violet-700", dot: "bg-violet-500" },
  emerald: { bg: "bg-emerald-50", bgActive: "bg-emerald-100", text: "text-emerald-600", textActive: "text-emerald-700", dot: "bg-emerald-500" },
  indigo: { bg: "bg-indigo-50", bgActive: "bg-indigo-100", text: "text-indigo-600", textActive: "text-indigo-700", dot: "bg-indigo-500" },
  amber: { bg: "bg-amber-50", bgActive: "bg-amber-100", text: "text-amber-600", textActive: "text-amber-700", dot: "bg-amber-500" },
  orange: { bg: "bg-orange-50", bgActive: "bg-orange-100", text: "text-orange-600", textActive: "text-orange-700", dot: "bg-orange-500" },
  rose: { bg: "bg-rose-50", bgActive: "bg-rose-100", text: "text-rose-600", textActive: "text-rose-700", dot: "bg-rose-500" },
  fuchsia: { bg: "bg-fuchsia-50", bgActive: "bg-fuchsia-100", text: "text-fuchsia-600", textActive: "text-fuchsia-700", dot: "bg-fuchsia-500" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => { if (data.user) setUserInfo(data.user); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
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
  const currentItem = allItems.find((i) => isActive(i.href));

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50/60 text-gray-900 font-sans selection:bg-violet-100">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden bg-gray-900/40 backdrop-blur-sm"
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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[270px] flex flex-col bg-white border-r border-gray-100 transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand area */}
        <div className="flex items-center gap-3 px-5 h-[68px] shrink-0 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <Image src="/logo.svg" alt="লোগো" width={32} height={32} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">
              ভ্যারাইটিজ কসমেটিক্স
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-0.5">ম্যানেজমেন্ট</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 px-3 mb-3">মেনু</p>
          <div className="flex flex-col gap-0.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const accent = accentMap[item.accent];
              return (
                <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03, duration: 0.25 }}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 group ${
                      active
                        ? "bg-gray-50 font-bold text-gray-900"
                        : "text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full ${accent.dot}`}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? accent.bgActive : accent.bg}`}>
                      <Icon size={16} strokeWidth={active ? 2.4 : 2} className={active ? accent.textActive : accent.text} />
                    </div>
                    <span className="flex-1 tracking-wide">{item.label}</span>
                    {active && <ChevronRight size={14} className="text-gray-400" />}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {userInfo?.role === "admin" && adminItems.length > 0 && (
            <>
              <div className="mt-7 mb-3 px-3 flex items-center gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">এডমিন</p>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <div className="flex flex-col gap-0.5">
                {adminItems.map((item, idx) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const accent = accentMap[item.accent];
                  return (
                    <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (navItems.length + idx) * 0.03, duration: 0.25 }}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 group ${
                          active
                            ? "bg-gray-50 font-bold text-gray-900"
                            : "text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full ${accent.dot}`}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? accent.bgActive : accent.bg}`}>
                          <Icon size={16} strokeWidth={active ? 2.4 : 2} className={active ? accent.textActive : accent.text} />
                        </div>
                        <span className="flex-1 tracking-wide">{item.label}</span>
                        {active && <ChevronRight size={14} className="text-gray-400" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="shrink-0 p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm">
                {userInfo?.displayName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-800 truncate leading-tight">
                {userInfo?.displayName || "..."}
              </p>
              <p className="text-[10px] font-medium text-gray-400 mt-0.5 truncate">
                {userInfo?.role === "admin" ? "অ্যাডমিনিস্ট্রেটর" : userInfo?.role === "manager" ? "ম্যানেজার" : "ইউজার"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="লগআউট"
            >
              <LogOut size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center h-[64px] px-4 sm:px-6 lg:px-8 gap-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Menu size={18} strokeWidth={2} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            {currentItem && (() => {
              const Icon = currentItem.icon;
              const accent = accentMap[currentItem.accent];
              return (
                <div className={`w-8 h-8 rounded-lg ${accent.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={15} className={accent.text} />
                </div>
              );
            })()}
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
              {currentItem?.label || "ড্যাশবোর্ড"}
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 tracking-wide">অনলাইন</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #d1d5db;
        }
      `}} />
    </div>
  );
}
