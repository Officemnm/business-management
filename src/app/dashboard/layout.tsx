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
} from "lucide-react";
import toast from "react-hot-toast";

interface UserInfo {
  role: string;
  displayName: string;
}

const navItems = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-50 group-hover:bg-blue-100" },
  { href: "/dashboard/orders", label: "অর্ডার", icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-50 group-hover:bg-emerald-100" },
  { href: "/dashboard/customers", label: "কাস্টমার", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50 group-hover:bg-indigo-100" },
  { href: "/dashboard/products/add", label: "প্রডাক্ট এড", icon: PackagePlus, color: "text-amber-500", bg: "bg-amber-50 group-hover:bg-amber-100" },
  { href: "/dashboard/products", label: "সকল প্রডাক্ট", icon: Package, color: "text-orange-500", bg: "bg-orange-50 group-hover:bg-orange-100" },
  { href: "/dashboard/dues", label: "বাকি", icon: CreditCard, color: "text-rose-500", bg: "bg-rose-50 group-hover:bg-rose-100" },
];

const adminItems = [
  { href: "/dashboard/users", label: "ইউজার ম্যানেজমেন্ট", icon: UserCog, color: "text-violet-500", bg: "bg-violet-50 group-hover:bg-violet-100" },
  { href: "/dashboard/premium", label: "ইউজার রিপোর্ট", icon: UserCheck, color: "text-fuchsia-500", bg: "bg-fuchsia-50 group-hover:bg-fuchsia-100" },
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
    <div className="h-screen w-full flex overflow-hidden bg-slate-50/50 text-slate-900 font-sans selection:bg-slate-200">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Clean Apple-like Style */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-white border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-4 px-7 h-[80px] shrink-0 border-b border-slate-100">
          <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-transparent">
            <Image src="/logo.svg" alt="লোগো" width={40} height={40} className="object-contain drop-shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-slate-900 truncate">
              ভ্যারাইটিজ কসমেটিক্স
            </p>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">ম্যানেজমেন্ট</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-6 px-4 overflow-y-auto custom-scrollbar">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 px-3 mb-4">মেনু</p>
          <div className="flex flex-col gap-1.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04, duration: 0.3 }}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3.5 px-3 py-2.5 rounded-[16px] text-[14px] transition-all duration-200 group ${
                      active ? "bg-slate-900 text-white shadow-md font-semibold" : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${active ? "bg-white/10" : item.bg}`}>
                      <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? "text-white" : item.color} />
                    </div>
                    <span className="relative z-10 tracking-wide">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {userInfo?.role === "admin" && adminItems.length > 0 && (
            <>
              <div className="mt-10 mb-4 px-3 flex items-center gap-3">
                 <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">এডমিন</p>
                 <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="flex flex-col gap-1.5">
                {adminItems.map((item, idx) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (navItems.length + idx) * 0.04, duration: 0.3 }}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`relative flex items-center gap-3.5 px-3 py-2.5 rounded-[16px] text-[14px] transition-all duration-200 group ${
                          active ? "bg-slate-900 text-white shadow-md font-semibold" : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${active ? "bg-white/10" : item.bg}`}>
                          <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? "text-white" : item.color} />
                        </div>
                        <span className="relative z-10 tracking-wide">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* User Info Bottom */}
        <div className="shrink-0 p-5 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-[16px] border border-slate-200/60 cursor-pointer">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0 bg-slate-900 shadow-sm">
              {userInfo?.displayName?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-slate-900 truncate">
                {userInfo?.displayName || "..."}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {userInfo?.role === "admin" ? "অ্যাডমিনিস্ট্রেটর" : userInfo?.role === "manager" ? "ম্যানেজার" : "ইউজার"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="লগআউট"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Clean Header */}
        <header className="sticky top-0 z-30 flex items-center h-[80px] px-6 lg:px-10 gap-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 tracking-tight">
              {allItems.find((i) => isActive(i.href))?.label || "ড্যাশবোর্ড"}
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-[12px] font-bold text-emerald-700 tracking-wide uppercase">সিস্টেম অনলাইন</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-50/50">
           <div className="p-5 sm:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full">
             <AnimatePresence mode="wait">
               <motion.div
                 key={pathname}
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -15 }}
                 transition={{ duration: 0.3, ease: "easeOut" }}
                 className="h-full"
               >
                 {children}
               </motion.div>
             </AnimatePresence>
           </div>
        </div>
      </main>
      
      {/* Global styles for custom scrollbar to match premium look */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}} />
    </div>
  );
}
