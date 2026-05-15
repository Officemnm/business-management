"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Package, Tag, X, ShoppingBag, ArrowLeft, Check, User, Search, Edit3, Sparkles, UserPlus, CreditCard } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedModal from "@/components/ui/AnimatedModal";

interface Customer { _id: string; name: string; phone: string; address?: string; }
interface Product { _id: string; name: string; sellPrice: number; stock: number; category: string; image?: string; unit: string; }
interface OrderItem { product: string; productName: string; quantity: number; unitPrice: number; total: number; remark: string; image?: string; }

export default function AddOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Order form state
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddressInput, setCustomerAddressInput] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [saveAsNewCustomer, setSaveAsNewCustomer] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Manual product modal state
  const [showManualProduct, setShowManualProduct] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState<number | string>(1);
  const [manualRate, setManualRate] = useState<number | string>("");
  const [manualRemark, setManualRemark] = useState("");

  // Catalog modal state
  const [showCatalog, setShowCatalog] = useState(false);
  
  // Product detail popup state
  const [popupProduct, setPopupProduct] = useState<Product | null>(null);
  const [popupQty, setPopupQty] = useState<number | string>(1);
  const [popupRate, setPopupRate] = useState<number | string>(0);
  const [popupRemark, setPopupRemark] = useState("");

  const customerSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/customers").then((r) => r.json()),
      fetch("/api/dashboard/products").then((r) => r.json()),
    ]).then(([c, p]) => {
      setCustomers(c); setProducts(p);
    }).finally(() => setLoading(false));
  }, []);

  const totalAmount = items.reduce((s, i) => s + i.total, 0);
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  // Open product detail popup
  const openProductPopup = (p: Product) => {
    const existing = items.find((i: OrderItem) => i.product === p._id);
    setPopupProduct(p);
    setPopupQty(existing ? existing.quantity : "");
    setPopupRate(existing ? existing.unitPrice : p.sellPrice);
    setPopupRemark(existing ? existing.remark : "");
  };

  // Add product from popup
  const confirmProduct = () => {
    if (!popupProduct) return;
    const qty = Number(popupQty) || 0;
    const rate = Number(popupRate) || 0;
    if (qty < 1) { toast.error("পরিমাণ ১ এর কম হতে পারে না"); return; }
    
    const exists = items.findIndex((i) => i.product === popupProduct._id);
    if (exists >= 0) {
      setItems(items.map((item, idx) =>
        idx === exists
          ? { ...item, quantity: qty, unitPrice: rate, total: qty * rate, remark: popupRemark }
          : item
      ));
    } else {
      setItems([...items, {
        product: popupProduct._id,
        productName: popupProduct.name,
        quantity: qty,
        unitPrice: rate,
        total: qty * rate,
        remark: popupRemark,
        image: popupProduct.image,
      }]);
    }
    toast.success(`${popupProduct.name} যোগ হয়েছে`);
    setPopupProduct(null);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const resetOrderForm = () => {
    setItems([]);
    setPaidAmount(0);
    setNote("");
    setCustomerName("");
    setSelectedCustomer("");
    setCustomerPhone("");
    setCustomerAddressInput("");
    setCustomerSearch("");
    setSaveAsNewCustomer(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { toast.error("কাস্টমার নাম লিখুন"); return; }
    if (items.length === 0) { toast.error("কমপক্ষে একটি প্রডাক্ট যোগ করুন"); return; }

    setSubmitting(true);
    try {
      let customerIdToUse = selectedCustomer;
      let customerAddress = selectedCustomer ? customers.find((c) => c._id === selectedCustomer)?.address || "" : customerAddressInput.trim();

      // Auto-create instant customer if needed OR if there's any due amount
      const shouldCreateCustomer = (!selectedCustomer && saveAsNewCustomer) || (!selectedCustomer && dueAmount > 0);

      if (shouldCreateCustomer) {
        const custRes = await fetch("/api/dashboard/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customerName.trim(),
            phone: customerPhone.trim() || "N/A",
            address: customerAddressInput.trim(),
          }),
        });
        if (custRes.ok) {
          const newCust = await custRes.json();
          customerIdToUse = newCust._id;
          customerAddress = newCust.address || "";
          toast.success("নতুন কাস্টমার অটো-সেভ হয়েছে");
        }
      }

      const res = await fetch("/api/dashboard/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerIdToUse || undefined,
          customerName: customerName.trim(),
          customerAddress,
          items: items.map(({ product, productName, quantity, unitPrice, total, remark }) => ({ product, productName, quantity, unitPrice, total, remark })),
          totalAmount, paidAmount, dueAmount,
          note,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("অর্ডার সফলভাবে তৈরি হয়েছে");
      resetOrderForm();
      router.push('/dashboard/orders');
    } catch { toast.error("অর্ডার তৈরিতে সমস্যা হয়েছে"); }
    finally { setSubmitting(false); }
  };

  // Add manual product to cart
  const addManualProduct = () => {
    const name = manualName.trim();
    const qty = Number(manualQty) || 0;
    const rate = Number(manualRate) || 0;
    if (!name) { toast.error("পণ্যের নাম লিখুন"); return; }
    if (qty < 1) { toast.error("পরিমাণ ১ এর কম হতে পারে না"); return; }
    if (rate <= 0) { toast.error("দর লিখুন"); return; }

    const newItem = {
      product: `manual-${Date.now()}`,
      productName: name,
      quantity: qty,
      unitPrice: rate,
      total: qty * rate,
      remark: manualRemark.trim(),
    };

    setItems([...items, newItem]);
    
    toast.success(`${name} যোগ হয়েছে`);
    setShowManualProduct(false);
    setManualName(""); setManualQty(1); setManualRate(""); setManualRemark("");
  };

  // Check if a product is already in cart
  const isInCart = (pid: string) => items.some((i) => i.product === pid);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-slate-800 animate-spin"></div>
          <p className="text-[13px] font-medium text-slate-500 tracking-wide">লোড হচ্ছে...</p>
        </motion.div>
      </div>
    );
  }

  // ===================== CATALOG FULLSCREEN MODAL =====================
  if (showCatalog) {
    const currentCartCount = items.length;
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50">
        {/* Catalog header */}
        <div className="flex items-center gap-4 h-[72px] px-6 shrink-0 bg-white border-b border-slate-200/60 shadow-sm">
          <button onClick={() => setShowCatalog(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer outline-none">
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div className="flex-1">
            <h2 className="text-[18px] font-bold tracking-tight text-slate-900">পণ্য নির্বাচন করুন</h2>
            <p className="text-[12px] font-medium text-slate-500">আপনার প্রয়োজনীয় পণ্যগুলো বাছাই করুন</p>
          </div>
          {currentCartCount > 0 && (
            <button
              onClick={() => setShowCatalog(false)}
              className="flex items-center gap-2 h-11 px-5 rounded-[14px] text-[14px] font-bold text-white cursor-pointer bg-slate-900 hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              <ShoppingCart size={18} strokeWidth={2} />
              সম্পন্ন ({currentCartCount})
            </button>
          )}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Package size={56} className="text-slate-200 mb-4" strokeWidth={1} />
              <p className="text-[15px] font-medium text-slate-400">কোনো পণ্য নেই</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 max-w-[1600px] mx-auto">
              {products.map((p) => (
                <div
                  key={p._id}
                  onClick={() => openProductPopup(p)}
                  className={`bg-white rounded-[20px] overflow-hidden cursor-pointer transition-all duration-300 relative group flex flex-col ${isInCart(p._id) ? "border-2 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.15)]" : "border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]"}`}
                >
                  {/* Image Area */}
                  <div className="relative w-full aspect-[4/3] bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100/50">
                    {isInCart(p._id) && (
                      <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-[10px] flex items-center justify-center bg-emerald-500 shadow-md">
                        <Check size={18} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                    {p.image ? (
                      <Image src={p.image} alt={p.name} width={400} height={400} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" unoptimized />
                    ) : (
                      <Package size={40} className="text-slate-300 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
                    )}
                    <div className="absolute bottom-3 right-3">
                      <span className={`text-[11px] px-2.5 py-1 rounded-[8px] font-semibold shadow-sm backdrop-blur-md ${p.stock > 0 ? "bg-emerald-50/90 text-emerald-600 border border-emerald-100" : "bg-rose-50/90 text-rose-600 border border-rose-100"}`}>
                        {p.stock > 0 ? `স্টক: ${p.stock}` : "স্টক নেই"}
                      </span>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-4 md:p-5 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">{p.category}</p>
                      <h3 className="text-[14px] md:text-[15px] font-bold text-slate-800 leading-snug line-clamp-2">{p.name}</h3>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[18px] md:text-[20px] font-bold text-slate-900 tabular-nums">৳{p.sellPrice}</span>
                        <span className="text-[12px] font-medium text-slate-500">/{p.unit}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isInCart(p._id) ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white"}`}>
                        {isInCart(p._id) ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart summary bar at bottom */}
        {items.length > 0 && (
          <div className="sticky bottom-0 z-20 shrink-0 px-6 py-4 flex items-center justify-between bg-white border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col">
              <span className="text-[12px] font-medium text-slate-500">{items.length} পণ্য নির্বাচিত</span>
              <span className="text-[20px] font-bold text-slate-900 tabular-nums">মোট: ৳{items.reduce((s, i) => s + i.total, 0).toLocaleString("en-US")}</span>
            </div>
            <button
              onClick={() => setShowCatalog(false)}
              className="h-12 px-6 rounded-[14px] text-[15px] font-bold text-white cursor-pointer bg-slate-900 hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              অর্ডারে ফিরুন
            </button>
          </div>
        )}

        {/* ========= PRODUCT DETAIL POPUP (Responsive) ========= */}
        {popupProduct && (
          <div className="fixed inset-0 z-[200] flex flex-col justify-end md:justify-center items-center bg-slate-900/40 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
            <div className="w-full bg-white rounded-t-[32px] md:max-w-[440px] md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col transform transition-transform animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
              
              {/* Mobile handle indicator */}
              <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>

              {/* Popup header */}
              <div className="flex items-center justify-between px-6 md:px-8 pt-4 md:pt-8 pb-4">
                <div>
                  <h3 className="text-[18px] md:text-[20px] font-bold text-slate-900 leading-tight">{popupProduct.name}</h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">
                    {popupProduct.category} • স্টক: <span className={popupProduct.stock > 0 ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{popupProduct.stock}</span> {popupProduct.unit}
                  </p>
                </div>
                <button onClick={() => setPopupProduct(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0 outline-none">
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              {/* Popup body */}
              <div className="px-6 md:px-8 pb-8">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-2">রেট (প্রতি {popupProduct.unit})</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">৳</span>
                      <input type="number" value={popupRate} onChange={(e) => setPopupRate(e.target.value === "" ? "" : Number(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        className="w-full h-12 pl-8 pr-4 rounded-[14px] text-[15px] font-bold outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:bg-white focus:border-slate-400 focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)] transition-all tabular-nums" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-2">পরিমাণ ({popupProduct.unit})</label>
                    <input type="number" value={popupQty} onChange={(e) => setPopupQty(e.target.value === "" ? "" : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-12 px-4 rounded-[14px] text-[15px] font-bold outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:bg-white focus:border-slate-400 focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)] transition-all tabular-nums text-center" />
                  </div>
                </div>

                <div className="mb-6 border-b border-slate-100 pb-6">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-2">রিমার্ক / নোট (ঐচ্ছিক)</label>
                  <input value={popupRemark} onChange={(e) => setPopupRemark(e.target.value)} placeholder="অতিরিক্ত তথ্য..."
                    className="w-full h-12 px-4 rounded-[14px] text-[14px] font-medium outline-none bg-slate-50 text-slate-800 border border-slate-200 focus:bg-white focus:border-slate-400 focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)] transition-all" />
                </div>

                {/* Total preview */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[14px] font-medium text-slate-500">মোট মূল্য</span>
                  <span className="text-[24px] md:text-[28px] font-bold text-slate-900 tabular-nums">৳{((Number(popupQty) || 0) * (Number(popupRate) || 0)).toLocaleString("en-US")}</span>
                </div>

                <button onClick={confirmProduct}
                  className={`w-full h-14 rounded-[16px] text-[16px] font-bold text-white cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isInCart(popupProduct._id) ? "bg-slate-900 hover:bg-slate-800" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                  {isInCart(popupProduct._id) ? "তথ্য আপডেট করুন" : "অর্ডারে যোগ করুন"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="-m-5 sm:-m-8 lg:-m-10 flex flex-col min-h-[calc(100vh-80px)] bg-slate-50/50">
      <div className="flex items-center gap-4 h-[72px] px-5 sm:px-8 lg:px-10 shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => router.push('/dashboard/orders')}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:bg-slate-100 bg-slate-50 border border-slate-200/60 text-slate-600"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] md:text-[20px] font-bold tracking-tight text-slate-900 truncate">
            নতুন অর্ডার তৈরি করুন
          </h2>
          <p className="text-[12px] md:text-[13px] font-medium text-slate-500 mt-0.5">
            {items.length > 0 ? `${items.length} টি পণ্য · ৳${totalAmount.toLocaleString("en-US")}` : "কাস্টমার ও পণ্য নির্বাচন করুন"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || items.length === 0 || !customerName.trim()}
          className="hidden sm:flex items-center gap-2 h-11 px-6 rounded-xl text-[14px] font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(16,185,129,0.4)] bg-emerald-500 active:scale-95"
        >
          <Check size={18} strokeWidth={2.5} />
          {submitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার সংরক্ষণ"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 w-full">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28 sm:pb-12 w-full">
          {/* Customer Section */}
          <div className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
                <User size={18} strokeWidth={2.2} className="text-indigo-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900">কাস্টমার তথ্য</h3>
              {selectedCustomer && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full ml-auto bg-emerald-50 text-emerald-600 border border-emerald-100">
                  সেভড কাস্টমার
                </span>
              )}
              {!selectedCustomer && customerName && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full ml-auto bg-amber-50 text-amber-600 border border-amber-100">
                  ইনস্ট্যান্ট
                </span>
              )}
            </div>

            <div className="relative mb-5" ref={customerSearchRef}>
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerPicker(true); }}
                onFocus={() => setShowCustomerPicker(true)}
                onClick={() => setShowCustomerPicker(true)}
                placeholder="কাস্টমার খুঁজুন (নাম অথবা ফোন)"
                className="w-full h-12 pl-11 pr-4 rounded-[14px] text-[14px] font-medium outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => { setSelectedCustomer(""); setCustomerName(""); setCustomerSearch(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              <AnimatePresence>
                {showCustomerPicker && !selectedCustomer && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 rounded-[16px] overflow-hidden z-20 max-h-80 overflow-y-auto bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] custom-scrollbar"
                  >
                    {(() => {
                      const filtered = customerSearch 
                        ? customers.filter((c) =>
                            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.phone.includes(customerSearch)
                          )
                        : customers;
                        
                      return filtered.length > 0 ? (
                        <>
                          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">মোট {filtered.length} জন কাস্টমার</span>
                            {customerSearch && <span className="text-[11px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">সার্চ রেজাল্ট</span>}
                          </div>
                          {filtered.map((c) => (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(c._id);
                                setCustomerName(c.name);
                                setCustomerPhone(c.phone);
                                setCustomerAddressInput(c.address || "");
                                setCustomerSearch(`${c.name} — ${c.phone}`);
                                setShowCustomerPicker(false);
                                setSaveAsNewCustomer(false);
                              }}
                              className="w-full flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                                {c.name[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold truncate text-slate-900">{c.name}</p>
                                <p className="text-[12px] font-medium text-slate-500 mt-0.5 flex flex-wrap gap-1.5 items-center">
                                  <span>{c.phone}</span>
                                  {c.address && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="truncate text-slate-400">{c.address}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="p-5">
                          <div className="text-[13px] font-medium mb-4 text-slate-500 text-center">
                            &ldquo;{customerSearch}&rdquo; খুঁজে পাওয়া যায়নি
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerName(customerSearch);
                              setCustomerPhone("");
                              setCustomerAddressInput("");
                              setSelectedCustomer("");
                              setSaveAsNewCustomer(true);
                              setShowCustomerPicker(false);
                            }}
                            className="w-full h-11 rounded-[14px] text-[13px] font-bold text-white cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 bg-indigo-500 hover:bg-indigo-600"
                          >
                            <UserPlus size={16} strokeWidth={2.2} />
                            নতুন কাস্টমার তৈরি করুন
                          </button>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">নাম <span className="text-rose-500">*</span></label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="কাস্টমার নাম"
                  className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  মোবাইল {saveAsNewCustomer && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  disabled={!!selectedCustomer}
                  className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ঠিকানা (ঐচ্ছিক)</label>
              <input
                value={customerAddressInput}
                onChange={(e) => setCustomerAddressInput(e.target.value)}
                placeholder="ঠিকানা"
                disabled={!!selectedCustomer}
                className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 disabled:bg-slate-100"
              />
            </div>

            {!selectedCustomer && customerName && (
              <label className="flex items-start gap-3 mt-5 p-4 rounded-[14px] cursor-pointer transition-colors bg-indigo-50 hover:bg-indigo-100/50 border border-indigo-100">
                <div className="relative flex items-center justify-center w-5 h-5 mt-0.5">
                  <input
                    type="checkbox"
                    checked={saveAsNewCustomer}
                    onChange={(e) => setSaveAsNewCustomer(e.target.checked)}
                    className="peer relative appearance-none w-5 h-5 border border-indigo-300 rounded-md bg-white checked:bg-indigo-500 checked:border-indigo-500 cursor-pointer transition-all"
                  />
                  <Check size={14} strokeWidth={3} className="text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles size={14} strokeWidth={2.2} className="text-indigo-600" /> কাস্টমার লিস্টে সেভ করুন
                  </p>
                  <p className="text-[12px] font-medium text-indigo-700/80 mt-1">
                    পরবর্তী অর্ডারে সহজে খুঁজে পাবেন (মোবাইল নম্বর দেওয়া বাধ্যতামূলক)
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Products Section */}
          <div className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100">
                <ShoppingBag size={18} strokeWidth={2.2} className="text-emerald-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900">পণ্য তালিকা</h3>
              {items.length > 0 && (
                <span className="text-[12px] font-bold px-3 py-1 rounded-full ml-auto bg-slate-900 text-white shadow-sm">
                  {items.length} টি · ৳{totalAmount.toLocaleString("en-US")}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setShowCatalog(true)}
                className="h-12 rounded-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-md text-[14px] font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                <ShoppingBag size={16} strokeWidth={2.2} />
                ক্যাটালগ থেকে বাছাই
              </button>
              <button
                type="button"
                onClick={() => setShowManualProduct(true)}
                className="h-12 rounded-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all text-[14px] font-bold bg-white text-slate-700 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              >
                <Edit3 size={16} strokeWidth={2.2} />
                ম্যানুয়ালি পণ্য যোগ
              </button>
            </div>

            {items.length > 0 && (
              <div className="rounded-[16px] overflow-hidden mt-4 border border-slate-200/60 bg-slate-50/50">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 px-4 py-3.5 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-slate-50 border border-slate-100">
                      {item.image ? (
                        <Image src={item.image} alt={item.productName} width={48} height={48} className="w-full h-full object-contain p-1" unoptimized />
                      ) : (
                        <Package size={20} className="text-slate-300" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-900 truncate">{item.productName}</p>
                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                        {item.quantity} × ৳{item.unitPrice.toLocaleString("en-US")}
                        {item.remark && <span className="ml-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">· {item.remark}</span>}
                      </p>
                    </div>
                    <p className="text-[15px] font-black text-slate-900 tabular-nums shrink-0">
                      ৳{item.total.toLocaleString("en-US")}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer shrink-0 transition-colors bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100/50 ml-2"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
                <CreditCard size={18} strokeWidth={2.2} className="text-blue-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900">পেমেন্ট</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">মোট বিল</label>
                <div className="text-[20px] font-black text-slate-900 tabular-nums">
                  ৳{totalAmount.toLocaleString("en-US")}
                </div>
              </div>
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">পরিশোধ <span className="text-emerald-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-full h-14 pl-8 pr-4 rounded-[16px] text-[18px] font-black outline-none bg-emerald-50/50 text-emerald-700 border border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all tabular-nums"
                    min={0}
                  />
                </div>
              </div>
              <div className={`p-4 rounded-[16px] border ${dueAmount > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100"}`}>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${dueAmount > 0 ? "text-rose-500" : "text-slate-500"}`}>বাকি</label>
                <div className={`text-[20px] font-black tabular-nums ${dueAmount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                  ৳{dueAmount.toLocaleString("en-US")}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">অতিরিক্ত নোট (ঐচ্ছিক)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="অর্ডারের বিবরণ বা কোনো নোট"
                className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>
        </form>
      </div>
      
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/60 z-20 pb-safe">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || items.length === 0 || !customerName.trim()}
          className="w-full h-14 rounded-full text-[15px] font-bold text-white cursor-pointer disabled:opacity-50 disabled:scale-100 transition-all hover:shadow-lg flex items-center justify-center gap-2 bg-emerald-500 active:scale-[0.98]"
        >
          <Check size={20} strokeWidth={2.5} />
          {submitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার নিশ্চিত করুন"}
        </button>
      </div>

      <AnimatedModal open={showManualProduct} onClose={() => setShowManualProduct(false)} title="ম্যানুয়ালি পণ্য যোগ" maxWidth="max-w-md">
        <div className="flex items-center gap-2 mb-5 p-3.5 rounded-[14px] bg-amber-50 border border-amber-100">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-white shadow-sm shrink-0">
            <Edit3 size={16} strokeWidth={2.2} className="text-amber-600" />
          </div>
          <p className="text-[12px] font-bold text-amber-800 leading-snug">
            ক্যাটালগে না থাকা পণ্য ম্যানুয়ালি যোগ করুন
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">পণ্যের নাম <span className="text-rose-500">*</span></label>
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="পণ্যের নাম লিখুন"
              autoFocus
              className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">পরিমাণ <span className="text-rose-500">*</span></label>
              <input
                type="number"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                min={1}
                className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">দর <span className="text-rose-500">*</span></label>
              <input
                type="number"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                placeholder="০"
                min={0}
                className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">রিমার্ক (ঐচ্ছিক)</label>
            <input
              value={manualRemark}
              onChange={(e) => setManualRemark(e.target.value)}
              placeholder="অতিরিক্ত তথ্য"
              className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50 border border-slate-100 mt-2">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">মোট</span>
            <span className="text-[20px] font-black text-emerald-600 tabular-nums leading-none">
              ৳{((Number(manualQty) || 0) * (Number(manualRate) || 0)).toLocaleString("en-US")}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowManualProduct(false)}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold cursor-pointer transition-colors bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={addManualProduct}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold text-white cursor-pointer transition-all shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 bg-emerald-500 active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              যোগ করুন
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}