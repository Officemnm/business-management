"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Phone, MapPin, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";

interface Order {
  _id: string;
  orderNumber?: string;
  createdAt: string;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  items: { productName: string; quantity: number }[];
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  totalDue: number;
}

export default function CustomerDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/customers/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Load failed");
        return r.json();
      })
      .then((data) => {
        setCustomer(data.customer);
        setOrders(data.orders);
      })
      .catch(() => toast.error("তথ্য লোড করতে সমস্যা হয়েছে"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-indigo-600 animate-spin"></div>
          <p className="text-[13px] font-medium text-slate-500">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle size={40} className="text-rose-500 mb-3" />
        <p className="text-slate-600 font-bold mb-4">কাস্টমার পাওয়া যায়নি</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-[14px]">
          ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-[12px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight leading-tight">কাস্টমার বিস্তারিত</h1>
          <p className="text-[13px] font-medium text-slate-500">{customer.name}-এর সকল ইনভয়েস ও হিসাব</p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[18px] bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-[24px] sm:text-[28px] font-bold shrink-0 shadow-inner">
          {customer.name[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] sm:text-[24px] font-black text-slate-900 truncate mb-1.5">{customer.name}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[14px] font-medium text-slate-600">
              <Phone size={14} className="text-slate-400" /> {customer.phone}
            </span>
            {customer.address && (
              <span className="flex items-center gap-1.5 text-[14px] font-medium text-slate-600">
                <MapPin size={14} className="text-slate-400" /> {customer.address}
              </span>
            )}
          </div>
        </div>
        <div className="w-full sm:w-auto bg-slate-50 border border-slate-100 rounded-[16px] p-4 text-center sm:text-right shrink-0">
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-1">মোট বকেয়া</p>
          <p className={`text-[24px] font-black tabular-nums leading-none ${customer.totalDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            ৳{customer.totalDue.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h3 className="text-[18px] font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-indigo-500" /> 
          ইনভয়েস হিস্ট্রি <span className="text-[13px] font-semibold text-slate-400">({orders.length})</span>
        </h3>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/60 py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <FileText size={24} className="text-slate-400" />
            </div>
            <p className="text-[15px] font-semibold text-slate-600 mb-1">কোনো ইনভয়েস নেই</p>
            <p className="text-[13px] text-slate-400">এই কাস্টমারের কোনো অর্ডার বা ইনভয়েস পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-[16px] border border-slate-200/60 shadow-sm p-4 sm:p-5 hover:border-indigo-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 text-[12px] font-bold px-2.5 py-1 rounded-[6px] hover:bg-indigo-100 transition-colors cursor-default">
                      #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </span>
                    <Link href={`/dashboard/orders?invoiceId=${order._id}`} className="w-7 h-7 rounded-[6px] bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group" title="ইনভয়েস দেখুন">
                      <Eye size={13} className="group-hover:scale-110 transition-transform" />
                    </Link>
                    <span className="text-[12px] font-medium text-slate-500 border border-slate-200 px-2 py-1 rounded-[6px] bg-slate-50">
                      {new Date(order.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div>
                    {order.dueAmount <= 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-[6px] bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                        <CheckCircle2 size={14} /> পেইড
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200/50">
                        <AlertCircle size={14} /> বকেয়া: ৳{order.dueAmount.toLocaleString("en-US")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                     <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">মোট আইটেম</p>
                     <p className="text-[14px] font-bold text-slate-800">{order.items?.length || 0} টি</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">মোট বিল</p>
                    <p className="text-[15px] font-black text-slate-800 tabular-nums">৳{order.finalAmount.toLocaleString("en-US")}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">জমা/পেইড</p>
                    <p className="text-[15px] font-black text-emerald-600 tabular-nums">৳{order.paidAmount.toLocaleString("en-US")}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">বাকি</p>
                    <p className={`text-[15px] font-black tabular-nums ${order.dueAmount > 0 ? "text-rose-600" : "text-slate-800"}`}>
                      ৳{order.dueAmount.toLocaleString("en-US")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
