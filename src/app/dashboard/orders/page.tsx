"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Package, Tag, X, ShoppingBag, ArrowLeft, Check, Eye, Pencil, Calendar, BarChart3, Trash2, Clock, User, Hash, Truck, Ban, CheckCircle2, RotateCcw, MapPin, CreditCard, UserPlus, Search, Edit3, Sparkles, Printer, TrendingUp, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedModal from "@/components/ui/AnimatedModal";
import AnimatedDropdown from "@/components/ui/AnimatedDropdown";

interface Customer { _id: string; name: string; phone: string; address?: string; }
interface Product { _id: string; name: string; sellPrice: number; stock: number; category: string; image?: string; unit: string; }
interface OrderItem { product: string; productName: string; quantity: number; unitPrice: number; total: number; remark: string; image?: string; }
interface Order { _id: string; orderNumber?: string; customer?: string; customerName: string; customerAddress?: string; items: OrderItem[]; totalAmount: number; paidAmount: number; dueAmount: number; returnAmount?: number; finalAmount?: number; returnItems?: { productName: string; amount: number }[]; status: string; deliveryStatus?: string; deliveryDate?: string; deliveryNote?: string; createdBy: string; createdAt: string; }

import { getBDDateString } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
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

  // Delivery tab filter
  const [deliveryTab, setDeliveryTab] = useState<"pending" | "delivered" | "not_delivered">("pending");

  // Date filter — default to all dates (empty string)
  const [filterDate, setFilterDate] = useState("");

  // User filter stuff
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState("");

  // View/Edit modals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewOrder, setViewOrder] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editOrder, setEditOrder] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summarySelection, setSummarySelection] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");

  // Delivery action state
  const [deliveryAction, setDeliveryAction] = useState<"none" | "complete" | "not_delivered">("none");
  const [deliveryPaid, setDeliveryPaid] = useState<number | string>("");
  const [deliveryReason, setDeliveryReason] = useState("");
  const [deliverySaving, setDeliverySaving] = useState(false);

  // Return items state
  const [returnItems, setReturnItems] = useState<{ productName: string; amount: number | string }[]>([]);
  const returnTotal = returnItems.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  // Catalog modal state
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogTarget, setCatalogTarget] = useState<"new" | "edit">("new");

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

  const loadData = () => {
    // Fetch auth to conditionally fetch system users
    fetch("/api/auth/me").then(r => r.json()).then(authData => {
      const user = authData?.user;
      setCurrentUser(user);
      
      const admin = user?.role === "admin";
      const initialTarget = admin ? user.username : "";
      if (admin) setTargetUser(initialTarget);

      const userListPromise = admin ? fetch("/api/dashboard/users").then(r => r.json()) : Promise.resolve([]);

      Promise.all([
        fetch(`/api/dashboard/orders${initialTarget ? `?targetUser=${initialTarget}` : ""}`).then((r) => r.json()),
        fetch("/api/dashboard/customers").then((r) => r.json()),
        fetch("/api/dashboard/products").then((r) => r.json()),
        userListPromise
      ]).then(([o, c, p, u]) => {
        setOrders(o); setCustomers(c); setProducts(p); 
        if (admin && Array.isArray(u)) setSystemUsers(u);
      }).finally(() => setLoading(false));
    });
  };

  const fetchOrders = (date?: string, tUser?: string) => {
    const d = date !== undefined ? date : filterDate;
    const t = tUser !== undefined ? tUser : targetUser;
    
    let q = "";
    if (d || t) {
      const params = new URLSearchParams();
      if (d) params.append("date", d);
      if (t) params.append("targetUser", t);
      q = `?${params.toString()}`;
    }
    fetch(`/api/dashboard/orders${q}`).then((r) => r.json()).then(setOrders);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (orders.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const invoiceId = params.get("invoiceId");
      if (invoiceId) {
        const orderToView = orders.find(o => o._id === invoiceId);
        if (orderToView) {
          setInvoiceOrder(orderToView);
          window.history.replaceState({}, '', '/dashboard/orders');
        }
      }
    }
  }, [orders]);

  const confirmDeleteOrder = async () => {
    if (!deleteConfirmation) return;
    try {
      const res = await fetch(`/api/dashboard/orders/${deleteConfirmation}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("অর্ডার মুছে ফেলা হয়েছে");
      fetchOrders(filterDate);
    } catch { toast.error("মুছতে ব্যর্থ হয়েছে"); }
    finally { setDeleteConfirmation(null); }
  };

  const saveEdit = async () => {
    if (!editOrder) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/orders/${editOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editOrder.customerName,
          items: editOrder.items,
          totalAmount: editOrder.totalAmount,
          paidAmount: editOrder.paidAmount,
          dueAmount: editOrder.dueAmount,
          status: editOrder.status,
          note: editOrder.note,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("অর্ডার আপডেট হয়েছে");
      setEditOrder(null);
      fetchOrders(filterDate);
    } catch { toast.error("আপডেট ব্যর্থ হয়েছে"); }
    finally { setSaving(false); }
  };

  const totalAmount = items.reduce((s, i) => s + i.total, 0);
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  // Open product detail popup
  const openProductPopup = (p: Product) => {
    let existing;
    if (catalogTarget === "edit" && editOrder) {
      existing = editOrder.items.find((i: OrderItem) => i.product === p._id);
    } else {
      existing = items.find((i: OrderItem) => i.product === p._id);
    }
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
    
    if (catalogTarget === "edit" && editOrder) {
      const exists = editOrder.items.findIndex((i: OrderItem) => i.product === popupProduct._id);
      let newItems;
      if (exists >= 0) {
        newItems = editOrder.items.map((item: OrderItem, idx: number) =>
          idx === exists
            ? { ...item, quantity: qty, unitPrice: rate, total: qty * rate, remark: popupRemark }
            : item
        );
      } else {
        newItems = [...editOrder.items, {
          product: popupProduct._id,
          productName: popupProduct.name,
          quantity: qty,
          unitPrice: rate,
          total: qty * rate,
          remark: popupRemark,
          image: popupProduct.image,
        }];
      }
      const t = newItems.reduce((s: number, i: OrderItem) => s + i.total, 0);
      setEditOrder({ ...editOrder, items: newItems, totalAmount: t, dueAmount: Math.max(0, t - editOrder.paidAmount) });
      toast.success(`${popupProduct.name} যোগ হয়েছে`);
      setPopupProduct(null);
    } else {
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
    }
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
        if (custRes.status === 409) {
          const data = await custRes.json();
          toast.error("এই কাস্টমার আগে থেকেই বিদ্যমান");
          if (data.existingCustomer) {
            customerIdToUse = data.existingCustomer._id;
            customerAddress = data.existingCustomer.address || "";
          }
        } else if (custRes.ok) {
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
      setShowForm(false);
      resetOrderForm();
      // Reload customers if new one created
      if (shouldCreateCustomer) {
        fetch("/api/dashboard/customers").then((r) => r.json()).then(setCustomers);
      }
      fetchOrders(filterDate);
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

    if (catalogTarget === "edit" && editOrder) {
      const newItems = [...editOrder.items, newItem];
      const t = newItems.reduce((s: number, i: OrderItem) => s + i.total, 0);
      setEditOrder({ ...editOrder, items: newItems, totalAmount: t, dueAmount: Math.max(0, t - editOrder.paidAmount) });
    } else {
      setItems([...items, newItem]);
    }
    
    toast.success(`${name} যোগ হয়েছে`);
    setShowManualProduct(false);
    setManualName(""); setManualQty(1); setManualRate(""); setManualRemark("");
  };

  const inputStyle = "w-full h-10 px-3 rounded-lg text-sm outline-none transition-all duration-150";

  // Check if a product is already in cart
  const isInCart = (pid: string) => {
    if (catalogTarget === "edit" && editOrder) {
      return editOrder.items.some((i: OrderItem) => i.product === pid);
    }
    return items.some((i) => i.product === pid);
  };

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
    const currentCartCount = catalogTarget === "edit" ? editOrder?.items?.length || 0 : items.length;
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

  const handleDeliveryComplete = async () => {
    if (!viewOrder) return;
    setDeliverySaving(true);
    try {
      const validReturns = returnItems.filter((r) => r.productName.trim() && Number(r.amount) > 0)
        .map((r) => ({ productName: r.productName.trim(), amount: Number(r.amount) }));
      const res = await fetch(`/api/dashboard/orders/${viewOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryStatus: "delivered",
          paidAmount: Number(deliveryPaid) || 0,
          returnAmount: returnTotal,
          returnItems: validReturns,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("ডেলিভারি সম্পন্ন");
      setViewOrder(null); setDeliveryAction("none"); setDeliveryPaid(""); setReturnItems([]);
      fetchOrders(filterDate);
    } catch { toast.error("আপডেট ব্যর্থ"); }
    finally { setDeliverySaving(false); }
  };

  const handleDeliveryFailed = async () => {
    if (!viewOrder || !deliveryReason) { toast.error("কারণ নির্বাচন করুন"); return; }
    setDeliverySaving(true);
    try {
      const res = await fetch(`/api/dashboard/orders/${viewOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryStatus: "not_delivered", deliveryNote: deliveryReason, status: "cancelled" }),
      });
      if (!res.ok) throw new Error();
      toast.success("ডেলিভারি স্ট্যাটাস আপডেট হয়েছে");
      setViewOrder(null); setDeliveryAction("none"); setDeliveryReason("");
      fetchOrders(filterDate);
    } catch { toast.error("আপডেট ব্যর্থ"); }
    finally { setDeliverySaving(false); }
  };

  // ===================== VIEW ORDER MODAL =====================
  const renderViewModal = () => {
    if (!viewOrder) return null;
    const ds = viewOrder.deliveryStatus || "pending";
    return (
      <AnimatedModal open={!!viewOrder} onClose={() => { setViewOrder(null); setDeliveryAction("none"); }} title="অর্ডার বিবরণ" maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-4 mb-5">
          {viewOrder.orderNumber && (
            <div className="col-span-2 bg-slate-50 p-3 rounded-[12px] border border-slate-100 flex items-center justify-between">
               <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">অর্ডার নং</span>
               <span className="text-[14px] font-black text-slate-900 tracking-widest">{viewOrder.orderNumber}</span>
            </div>
          )}
          <div className="p-3 bg-white border border-slate-100 rounded-[12px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">কাস্টমার</p>
            <p className="text-[14px] font-bold text-slate-800 line-clamp-1">{viewOrder.customerName}</p>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-[12px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">তারিখ</p>
            <p className="text-[13px] font-bold text-slate-800">
              {new Date(viewOrder.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })} 
              <span className="text-slate-400 font-medium ml-1">
                {new Date(viewOrder.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" }) }
              </span>
            </p>
            {ds === "delivered" && viewOrder.deliveryDate && (
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> 
                {new Date(viewOrder.deliveryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
              </p>
            )}
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-[12px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">স্ট্যাটাস</p>
            <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold inline-block ${
              viewOrder.status === "completed" ? "bg-emerald-50 text-emerald-600" : 
              viewOrder.status === "cancelled" ? "bg-rose-50 text-rose-600" : 
              "bg-amber-50 text-amber-600"
            }`}>
              {viewOrder.status === "completed" ? "সম্পন্ন" : viewOrder.status === "cancelled" ? "বাতিল" : "পেন্ডিং"}
            </span>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-[12px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ডেলিভারি</p>
            <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold inline-block ${
              ds === "delivered" ? "bg-emerald-50 text-emerald-600" : 
              ds === "not_delivered" ? "bg-rose-50 text-rose-600" : 
              "bg-indigo-50 text-indigo-600"
            }`}>
              {ds === "delivered" ? "ডেলিভারি সম্পন্ন" : ds === "not_delivered" ? "ডেলিভারি হয়নি" : "পেন্ডিং"}
            </span>
            {viewOrder.deliveryNote && <p className="text-[11px] mt-1.5 font-medium text-rose-500 leading-snug">{viewOrder.deliveryNote}</p>}
          </div>
        </div>

        <div className="rounded-[16px] overflow-hidden mb-5 border border-slate-200/60 shadow-sm bg-white">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">পণ্য তালিকা</div>
          <div className="divide-y divide-slate-100">
            {viewOrder.items.map((item: OrderItem, idx: number) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="pr-4">
                  <p className="text-[14px] font-bold text-slate-800 line-clamp-1">{item.productName}</p>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                    {item.quantity} × <span className="font-semibold text-slate-600">৳{item.unitPrice.toLocaleString("en-US")}</span>
                    {item.remark && <span className="text-slate-400 ml-1">· {item.remark}</span>}
                  </p>
                </div>
                <span className="text-[15px] font-black text-slate-900 tabular-nums shrink-0">৳{item.total.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-4 rounded-[16px] mb-5 bg-slate-50 border border-slate-200/60 shadow-inner">
          <div className="flex justify-between items-center text-[14px]">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">মোট বিল</span>
            <span className="font-black text-slate-800 tabular-nums">৳{viewOrder.totalAmount.toLocaleString("en-US")}</span>
          </div>
          {viewOrder.returnAmount > 0 && (
            <>
              <div className="flex justify-between items-center text-[14px]">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">ফেরত</span>
                <span className="font-black text-rose-500 tabular-nums">- ৳{viewOrder.returnAmount.toLocaleString("en-US")}</span>
              </div>
              <div className="flex justify-between items-center text-[14px] pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">চূড়ান্ত মোট</span>
                <span className="font-black text-slate-900 tabular-nums">৳{(viewOrder.finalAmount || 0).toLocaleString("en-US")}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center text-[14px] pt-1">
            <span className="font-bold text-emerald-600/80 uppercase tracking-wider text-[11px]">পরিশোধ</span>
            <span className="font-black text-emerald-600 tabular-nums">৳{(viewOrder.paidAmount || 0).toLocaleString("en-US")}</span>
          </div>
          <div className="flex justify-between items-center text-[14px] pt-2 border-t border-slate-200">
            <span className={`font-bold uppercase tracking-wider text-[11px] ${viewOrder.dueAmount > 0 ? "text-rose-500" : "text-slate-500"}`}>বাকি</span>
            <span className={`font-black tabular-nums ${viewOrder.dueAmount > 0 ? "text-rose-600" : "text-slate-800"}`}>৳{(viewOrder.dueAmount || 0).toLocaleString("en-US")}</span>
          </div>
        </div>

        {/* Return items list if exists */}
        {viewOrder.returnItems?.length > 0 && (
          <div className="mb-5 rounded-[14px] p-4 bg-rose-50/50 border border-rose-100">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw size={14} className="text-rose-500" />
              <span className="text-[12px] font-bold text-rose-600 uppercase tracking-wider">ফেরত পণ্য</span>
            </div>
            <div className="space-y-2">
              {viewOrder.returnItems.map((ri: { productName: string; amount: number }, i: number) => (
                <div key={i} className="flex justify-between items-center text-[13px] py-1">
                  <span className="font-semibold text-slate-700">{ri.productName}</span>
                  <span className="font-bold text-rose-500 tabular-nums">৳{ri.amount.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {viewOrder.note && (
          <div className="mb-5 p-3 rounded-[12px] bg-amber-50 border border-amber-100 flex gap-2 items-start">
            <div className="mt-0.5"><Clock size={14} className="text-amber-500" /></div>
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">নোট</p>
              <p className="text-[13px] font-medium text-amber-800 leading-snug">{viewOrder.note}</p>
            </div>
          </div>
        )}

        {/* ===== DELIVERY ACTIONS ===== */}
        {ds === "pending" && deliveryAction === "none" && (
          <div className="flex gap-3">
            <button onClick={() => { setDeliveryAction("complete"); setDeliveryPaid(""); setReturnItems([]); }}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold text-white shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2">
              <CheckCircle2 size={18} strokeWidth={2.5} /> ডেলিভারি সম্পন্ন
            </button>
            <button onClick={() => setDeliveryAction("not_delivered")}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors active:scale-95">
              <Ban size={18} strokeWidth={2.5} /> ডেলিভারি হয়নি
            </button>
          </div>
        )}

        {/* Delivery Complete Form */}
        {ds === "pending" && deliveryAction === "complete" && (() => {
          const effectiveTotal = viewOrder.totalAmount - returnTotal;
          const alreadyPaid = viewOrder.paidAmount || 0;
          const remainingToPay = Math.max(0, effectiveTotal - alreadyPaid);
          const paid = Number(deliveryPaid) || 0;
          const dueAfter = Math.max(0, remainingToPay - paid);
          const isFullyPaid = remainingToPay <= 0;
          return (
          <div className="rounded-[16px] p-5 bg-emerald-50/50 border border-emerald-100 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Truck size={16} className="text-emerald-600" />
              </div>
              <h4 className="text-[15px] font-bold text-emerald-800 tracking-tight">ডেলিভারি সম্পন্ন করুন</h4>
            </div>

            {/* Return Items optional */}
            <div className="mb-4 rounded-[12px] p-4 bg-white border border-rose-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <RotateCcw size={14} className="text-rose-500" />
                  <span className="text-[12px] font-bold text-rose-600 uppercase tracking-wider">পণ্য ফেরত (অপশনাল)</span>
                </div>
                <button type="button" onClick={() => setReturnItems([...returnItems, { productName: "", amount: "" }])}
                  className="px-3 py-1 rounded-[8px] text-[11px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-1">
                  <Plus size={12} /> যোগ করুন
                </button>
              </div>
              
              {returnItems.length === 0 && (
                <p className="text-[12px] font-medium text-slate-400">কোনো পণ্য ফেরত না থাকলে এড়িয়ে যান</p>
              )}
              
              {returnItems.map((ri, idx) => (
                <div key={idx} className="flex items-center gap-2 mt-2.5 group">
                  <input type="text" value={ri.productName} placeholder="পণ্যের নাম"
                    onChange={(e) => { const n = [...returnItems]; n[idx] = { ...n[idx], productName: e.target.value }; setReturnItems(n); }}
                    className="flex-1 h-10 px-3 rounded-[10px] text-[13px] font-medium outline-none bg-slate-50 border border-slate-200 focus:border-rose-300 focus:bg-white transition-colors" />
                  <input type="number" value={ri.amount} placeholder="৳ টাকা"
                    onChange={(e) => { const n = [...returnItems]; n[idx] = { ...n[idx], amount: e.target.value === "" ? "" : Number(e.target.value) }; setReturnItems(n); }}
                    onFocus={(e) => e.target.select()}
                    className="w-24 h-10 px-3 rounded-[10px] text-[13px] font-bold tabular-nums outline-none bg-slate-50 border border-slate-200 focus:border-rose-300 focus:bg-white transition-colors text-right" min={0} />
                  <button type="button" onClick={() => setReturnItems(returnItems.filter((_, i) => i !== idx))}
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
              
              {returnTotal > 0 && (
                <div className="mt-3 pt-3 flex justify-between items-center border-t border-rose-100">
                  <span className="text-[12px] font-bold text-rose-500 uppercase tracking-wider">মোট ফেরত</span>
                  <span className="text-[16px] font-black text-rose-600 tabular-nums">৳{returnTotal.toLocaleString("en-US")}</span>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">হিসাব</label>
                <div className="text-[12px] font-black text-slate-800 tabular-nums">
                  {returnTotal > 0
                    ? `৳${viewOrder.totalAmount} − ৳${returnTotal} = ৳${effectiveTotal}`
                    : `মোট: ৳${viewOrder.totalAmount}`}
                </div>
              </div>
              {/* Show already paid info */}
              {alreadyPaid > 0 && (
                <div className="mb-3 p-3 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-wider">অর্ডারের সময় আদায়</span>
                  <span className="text-[15px] font-black text-emerald-600 tabular-nums">৳{alreadyPaid.toLocaleString("en-US")}</span>
                </div>
              )}

              {isFullyPaid ? (
                <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-emerald-700">সম্পূর্ণ পরিশোধিত</p>
                    <p className="text-[12px] font-medium text-emerald-600 mt-0.5">এই অর্ডারের টাকা আগেই আদায় করা হয়েছে</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <label className="absolute left-3 -top-2.5 px-1.5 bg-emerald-50 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">আদায় (৳)</label>
                  <input type="number" value={deliveryPaid}
                    onChange={(e) => setDeliveryPaid(e.target.value === "" ? "" : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    placeholder={`বাকি ৳${remainingToPay.toLocaleString("en-US")} — কত দিচ্ছে?`}
                    min={0} max={remainingToPay}
                    className="w-full h-12 px-4 rounded-[12px] text-[15px] font-bold tabular-nums outline-none bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm" />
                </div>
              )}
            </div>
            
            {dueAfter > 0 && !isFullyPaid && (
              <div className="mb-5 p-3 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center justify-between">
                <span className="text-[12px] font-bold text-rose-600 uppercase tracking-wider">বাকি থাকবে</span>
                <span className="text-[15px] font-black text-rose-600 tabular-nums">৳{dueAfter.toLocaleString("en-US")}</span>
              </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setDeliveryAction("none")}
                className="flex-[1] h-12 rounded-[12px] text-[14px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                বাতিল
              </button>
              <button onClick={handleDeliveryComplete} disabled={deliverySaving}
                className="flex-[2] h-12 rounded-[12px] text-[14px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {deliverySaving ? "আপডেট হচ্ছে..." : <><CheckCircle2 size={18} strokeWidth={2.5} /> কনফার্ম করুন</>}
              </button>
            </div>
          </div>
          );
        })()}

        {/* Delivery Failed Form */}
        {ds === "pending" && deliveryAction === "not_delivered" && (
          <div className="rounded-[16px] p-5 bg-rose-50/50 border border-rose-100 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Ban size={16} className="text-rose-600" />
              </div>
              <h4 className="text-[15px] font-bold text-rose-800 tracking-tight">ডেলিভারি ব্যর্থ হয়েছে?</h4>
            </div>
            
            <div className="mb-4">
              <label className="block text-[12px] font-bold text-rose-600 uppercase tracking-wider mb-2 px-1">কারণ নির্বাচন করুন</label>
              <div className="flex flex-wrap gap-2">
                {["দোকান বন্ধ", "দোকানদার নেই", "অর্ডার নিবে না", "পণ্য পছন্দ হয়নি", "ঠিকানা পাওয়া যায়নি"].map((r) => (
                  <button key={r} onClick={() => setDeliveryReason(r)}
                    className={`px-3 py-2 rounded-[10px] text-[12px] font-bold transition-all ${
                      deliveryReason === r 
                      ? "bg-rose-500 text-white shadow-md border border-rose-500" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200"
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-5 relative">
              <label className="absolute left-3 -top-2.5 px-1.5 bg-rose-50 text-[11px] font-bold text-rose-600 uppercase tracking-wider">অথবা নিজে লিখুন</label>
              <input value={deliveryReason} onChange={(e) => setDeliveryReason(e.target.value)}
                placeholder="অন্য কোনো কারণ..."
                className="w-full h-11 px-4 rounded-[12px] text-[13px] font-medium outline-none bg-white border border-rose-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => { setDeliveryAction("none"); setDeliveryReason(""); }}
                className="flex-[1] h-12 rounded-[12px] text-[14px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                বাতিল
              </button>
              <button onClick={handleDeliveryFailed} disabled={deliverySaving}
                className="flex-[2] h-12 rounded-[12px] text-[14px] font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-[0_4px_15px_-3px_rgba(244,63,94,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {deliverySaving ? "আপডেট হচ্ছে..." : <><Ban size={18} strokeWidth={2.5} /> ব্যর্থ কনফার্ম করুন</>}
              </button>
            </div>
          </div>
        )}

        {/* Badges for already processed orders */}
        {ds === "delivered" && (
          <div className="flex items-center gap-3 p-4 rounded-[14px] bg-emerald-50 border border-emerald-100 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-emerald-800">ডেলিভারি সম্পন্ন হয়েছে</p>
              <p className="text-[12px] font-medium text-emerald-600/80 mt-0.5">অর্ডারটি সফলভাবে কাস্টমারকে বুঝিয়ে দেওয়া হয়েছে।</p>
            </div>
          </div>
        )}
        
        {ds === "not_delivered" && (
          <div className="flex items-start gap-3 p-4 rounded-[14px] bg-rose-50 border border-rose-100 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mt-1">
              <Ban size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-rose-800">ডেলিভারি ব্যর্থ হয়েছে</p>
              {viewOrder.deliveryNote && (
                <p className="text-[13px] font-medium text-rose-600 mt-1.5 bg-rose-100/50 p-2 rounded-lg leading-snug border border-rose-100">
                  <span className="font-bold text-rose-700">কারণ:</span> {viewOrder.deliveryNote}
                </p>
              )}
            </div>
          </div>
        )}
      </AnimatedModal>
    );
  };

  // ===================== EDIT ORDER MODAL =====================
  const renderEditModal = () => {
    if (!editOrder) return null;
    return (
      <AnimatedModal open={!!editOrder} onClose={() => setEditOrder(null)} title="অর্ডার সম্পাদনা" maxWidth="max-w-lg">
            {editOrder.orderNumber && (
              <div className="mb-4 bg-slate-50 p-2.5 rounded-[12px] border border-slate-200/60 flex items-center justify-between shadow-sm">
                 <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">অর্ডার নং</span>
                 <span className="text-[14px] font-black text-slate-900 tracking-widest">{editOrder.orderNumber}</span>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">কাস্টমার নাম</label>
              <div className="relative">
                <select
                  value={editOrder.customer || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId) {
                      const cust = customers.find((c) => c._id === selectedId);
                      if (cust) {
                        setEditOrder({ ...editOrder, customer: cust._id, customerName: cust.name });
                      }
                    }
                  }}
                  className="w-full h-11 px-3.5 rounded-[12px] text-[14px] font-bold outline-none bg-white text-slate-900 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>কাস্টমার নির্বাচন করুন</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Search size={16} />
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">কাস্টমার লিস্ট থেকে নির্বাচন করুন</p>
            </div>

            <div className="mb-5 bg-slate-50 p-3 rounded-[16px] border border-slate-100 shadow-inner">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">পণ্য তালিকা</label>
                <button
                  type="button"
                  onClick={() => { setCatalogTarget("edit"); setShowCatalog(true); }}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-[8px] text-[11px] font-bold text-white transition-all shadow-sm hover:shadow active:scale-95 bg-indigo-500 hover:bg-indigo-600"
                >
                  <Package size={14} />
                  ক্যাটালগ থেকে যোগ করুন
                </button>
              </div>

              {editOrder.items.map((item: OrderItem, idx: number) => (
                <div key={idx} className="flex items-center gap-2 mb-2 w-full">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 line-clamp-1 truncate" title={item.productName}>{item.productName}</p>
                  </div>
                  <input type="number" value={item.quantity} min={1}
                    onChange={(e) => { const q = parseInt(e.target.value) || 1; const ni = editOrder.items.map((it: OrderItem, i: number) => i === idx ? { ...it, quantity: q, total: q * it.unitPrice } : it); const t = ni.reduce((s: number, i: OrderItem) => s + i.total, 0); setEditOrder({ ...editOrder, items: ni, totalAmount: t, dueAmount: Math.max(0, t - editOrder.paidAmount) }); }}
                    className="w-14 h-9 text-center rounded-[8px] text-[13px] font-bold outline-none bg-white border border-slate-200 focus:border-indigo-400 tabular-nums shadow-sm" />
                  <span className="text-[12px] text-slate-400 font-bold block shrink-0">x</span>
                  <input type="number" value={item.unitPrice}
                    onChange={(e) => { const r = Number(e.target.value); const ni = editOrder.items.map((it: OrderItem, i: number) => i === idx ? { ...it, unitPrice: r, total: it.quantity * r } : it); const t = ni.reduce((s: number, i: OrderItem) => s + i.total, 0); setEditOrder({ ...editOrder, items: ni, totalAmount: t, dueAmount: Math.max(0, t - editOrder.paidAmount) }); }}
                    className="w-20 h-9 text-center rounded-[8px] text-[13px] font-bold outline-none bg-white border border-slate-200 focus:border-indigo-400 tabular-nums shadow-sm" />
                  <span className="text-[13px] font-black w-[4.5rem] text-right text-emerald-600 tabular-nums shrink-0">৳{item.total.toLocaleString("en-US")}</span>
                  <button type="button" onClick={() => { const ni = editOrder.items.filter((_: OrderItem, i: number) => i !== idx); const t = ni.reduce((s: number, i: OrderItem) => s + i.total, 0); setEditOrder({ ...editOrder, items: ni, totalAmount: t, dueAmount: Math.max(0, t - editOrder.paidAmount) }); }}
                    className="cursor-pointer text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg transition-colors shrink-0 outline-none"><X size={16} strokeWidth={2.5} /></button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5 p-3 bg-white border border-slate-200 rounded-[14px] shadow-sm">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">মোট</label>
                <div className="h-10 px-3 flex items-center rounded-[10px] text-[14px] font-black bg-slate-50 border border-slate-100 text-slate-800 tabular-nums">৳{editOrder.totalAmount.toLocaleString("en-US")}</div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">পরিশোধ</label>
                <input type="number" value={editOrder.paidAmount}
                  onChange={(e) => { const p = Number(e.target.value); setEditOrder({ ...editOrder, paidAmount: p, dueAmount: Math.max(0, editOrder.totalAmount - p) }); }}
                  className="w-full h-10 px-3 rounded-[10px] text-[14px] font-black outline-none bg-white border border-emerald-200 text-emerald-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 tabular-nums shadow-sm transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">বাকি</label>
                <div className={`h-10 px-3 flex items-center rounded-[10px] text-[14px] font-black tabular-nums border ${editOrder.dueAmount > 0 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-800"}`}>৳{editOrder.dueAmount.toLocaleString("en-US")}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">স্ট্যাটাস</label>
                <AnimatedDropdown
                  options={[{ value: "pending", label: "পেন্ডিং" }, { value: "completed", label: "সম্পন্ন" }, { value: "cancelled", label: "বাতিল" }]}
                  value={editOrder.status}
                  onChange={(v) => setEditOrder({ ...editOrder, status: v })}
                  className="h-11 rounded-[12px] bg-white border-slate-200 font-bold text-[13px] shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">নোট</label>
                <input value={editOrder.note || ""} onChange={(e) => setEditOrder({ ...editOrder, note: e.target.value })}
                  placeholder="জরুরী নোট"
                  className="w-full h-11 px-3 rounded-[12px] text-[13px] font-semibold outline-none bg-white text-slate-800 border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm" />
              </div>
            </div>

            <button onClick={saveEdit} disabled={saving}
              className="w-full h-12 rounded-[14px] text-[14px] font-bold text-white shadow-md cursor-pointer disabled:opacity-50 disabled:scale-100 bg-emerald-500 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {saving ? "সংরক্ষণ হচ্ছে..." : <><CheckCircle2 size={18} strokeWidth={2.5} /> পরিবর্তন সংরক্ষণ</>}
            </button>
          </AnimatedModal>
    );
  };

  // ===================== SUMMARY MODAL =====================
  const renderSummaryModal = () => {
    if (!showSummary) return null;

    // Only aggregate PENDING orders (as requested)
    const pendingOrdersOnly = orders.filter((o) => (o.deliveryStatus || "pending") === "pending");
    const selectedPendingOrders = pendingOrdersOnly.filter((o) => summarySelection.includes(o._id));

    const productMap: Record<string, { name: string; qty: number; total: number }> = {};
    let grandTotal = 0;
    let grandPaid = 0;
    let grandDue = 0;

    selectedPendingOrders.forEach((o) => {
      grandTotal += o.totalAmount;
      grandPaid += o.paidAmount;
      grandDue += o.dueAmount;
      o.items.forEach((item) => {
        const key = item.productName;
        if (!productMap[key]) {
          productMap[key] = { name: item.productName, qty: 0, total: 0 };
        }
        productMap[key].qty += item.quantity;
        productMap[key].total += item.total;
      });
    });

    const productList = Object.values(productMap).sort((a, b) => b.total - a.total);
    const dateLabel = filterDate
      ? new Date(filterDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dhaka" })
      : "সকল তারিখ";

    return (
      <AnimatedModal open={showSummary} onClose={() => setShowSummary(false)} title="পেন্ডিং অর্ডার সামারি" maxWidth="max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-indigo-50 border border-indigo-100">
              <Truck size={18} strokeWidth={2.2} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900 tracking-tight">পেন্ডিং অর্ডারের সামারি</p>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">{dateLabel} · নির্বাচিত: <span className="font-bold text-indigo-600">{selectedPendingOrders.length}</span> টি</p>
            </div>
          </div>
        </div>

        {/* Grand totals */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-[16px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">মোট বিল</p>
            <p className="text-[18px] font-black text-slate-900 tabular-nums">৳{grandTotal.toLocaleString("en-US")}</p>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-[16px] shadow-sm">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">পরিশোধ</p>
            <p className="text-[18px] font-black text-emerald-700 tabular-nums">৳{grandPaid.toLocaleString("en-US")}</p>
          </div>
          <div className={`p-4 rounded-[16px] border shadow-sm ${grandDue > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100"}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${grandDue > 0 ? "text-rose-500" : "text-slate-500"}`}>বাকি</p>
            <p className={`text-[18px] font-black tabular-nums ${grandDue > 0 ? "text-rose-600" : "text-slate-900"}`}>৳{grandDue.toLocaleString("en-US")}</p>
          </div>
        </div>

        {/* Product breakdown */}
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
          <Package size={14} className="text-slate-400" /> পণ্য ভিত্তিক বিবরণ
        </h4>
        <div className="rounded-[16px] overflow-hidden border border-slate-200/60 bg-white shadow-sm">
          <div className="grid grid-cols-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border-b border-slate-200/60">
            <span className="col-span-6">পণ্য</span>
            <span className="col-span-3 text-center">পরিমাণ</span>
            <span className="col-span-3 text-right">মোট</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {productList.length === 0 ? (
              <div className="py-10 text-center bg-white">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-slate-50 border border-slate-100">
                  <ShoppingBag size={20} strokeWidth={1.5} className="text-slate-400" />
                </div>
                <p className="text-[13px] font-medium text-slate-500">কোনো পেন্ডিং অর্ডারে পণ্য নেই</p>
              </div>
            ) : (
              productList.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 px-4 py-3.5 items-center bg-white hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                  <span className="col-span-6 text-[13px] font-bold text-slate-900 truncate pr-2">{p.name}</span>
                  <span className="col-span-3 text-center text-[13px] font-semibold text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">{p.qty}</span>
                  </span>
                  <span className="col-span-3 text-right text-[14px] font-black text-slate-900 tabular-nums">৳{p.total.toLocaleString("en-US")}</span>
                </div>
              ))
            )}
          </div>
          {/* Footer total */}
          {productList.length > 0 && (
            <div className="grid grid-cols-12 px-4 py-3 items-center border-t-2 border-slate-100 bg-slate-50/80">
              <span className="col-span-6 text-[12px] font-bold uppercase tracking-wider text-slate-600">সর্বমোট</span>
              <span className="col-span-3 text-center text-[13px] font-black text-slate-900 tabular-nums bg-indigo-100 text-indigo-700 rounded-md py-0.5 mx-auto px-2">{productList.reduce((s, p) => s + p.qty, 0)}</span>
              <span className="col-span-3 text-right text-[15px] font-black text-indigo-600 tabular-nums">৳{grandTotal.toLocaleString("en-US")}</span>
            </div>
          )}
        </div>
      </AnimatedModal>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const renderInvoiceModal = () => {
    if (!invoiceOrder) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-slate-100/50 backdrop-blur-sm flex flex-col no-print">
        {/* Top Header Controls (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm no-print">
          <button onClick={() => setInvoiceOrder(null)} className="p-2 bg-white text-slate-500 border border-slate-300 rounded-[12px] hover:bg-slate-50 hover:text-rose-500 transition-colors shadow-sm">
            <X size={18} strokeWidth={2.5} />
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white font-bold rounded-[12px] hover:bg-indigo-600 transition-all shadow-md active:scale-95">
            <Printer size={16} strokeWidth={2.5} /> প্রিন্ট করুন
          </button>
        </div>

        {/* Invoice Printable Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center no-print scroll-smooth custom-scrollbar">
          <div id="print-invoice" className="bg-white p-8 sm:p-12 w-full max-w-[210mm] shadow-2xl relative text-slate-900 rounded-[16px] sm:rounded-none" style={{ minHeight: "297mm" }}>
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-100 -mt-6">
              <div className="flex flex-col items-start pt-2">
                <img src="/logo.svg" alt="লোগো" className="w-28 h-28 object-contain mb-3" />
                <h2 className="text-[28px] font-black text-slate-900 tracking-tight mb-1">ভ্যারাইটিজ কসমেটিক্স</h2>
                <p className="text-[13px] font-medium text-slate-600 max-w-[300px] leading-relaxed">৫১ নং ওয়ার্ড, সাতাইশ রোড, খরতৈল, সুখিনগর, গাজীপুরা, টঙ্গী, গাজীপুর</p>
                <p className="text-[13px] text-slate-700 mt-1 font-bold">মোবাইল: +88016084-19251, +8801962-090245</p>
              </div>
              <div className="text-right pt-6">
                <p className="text-[15px] font-black text-indigo-700 bg-indigo-50/50 px-4 py-2.5 rounded-[12px] inline-block mb-3 border border-indigo-100 uppercase tracking-widest">
                  অর্ডার নং: {invoiceOrder.orderNumber || invoiceOrder._id.slice(-6).toUpperCase()}
                </p>
                <p className="text-[13px] font-bold text-slate-500 block">তারিখ: {new Date(invoiceOrder.createdAt).toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            <div className="mb-10 bg-slate-50/50 p-5 rounded-[16px] border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">কাস্টমার তথ্য</p>
              <h3 className="text-[20px] font-black text-slate-800">{invoiceOrder.customerName}</h3>
              {invoiceOrder.customerPhone && <p className="text-[14px] font-medium text-slate-600 mt-1">মোবাইল: <span className="font-bold text-slate-700">{invoiceOrder.customerPhone}</span></p>}
              {invoiceOrder.customerAddress && <p className="text-[14px] font-medium text-slate-600 mt-1">ঠিকানা: <span className="font-bold text-slate-700">{invoiceOrder.customerAddress}</span></p>}
            </div>

            <table className="w-full text-left border-collapse mb-10">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 px-2 text-[12px] font-bold text-slate-500 uppercase tracking-widest">পণ্য</th>
                  <th className="py-3 px-2 text-[12px] font-bold text-slate-500 uppercase tracking-widest text-center">পরিমাণ</th>
                  <th className="py-3 px-2 text-[12px] font-bold text-slate-500 uppercase tracking-widest text-right">মূল্য</th>
                  <th className="py-3 px-2 text-[12px] font-bold text-slate-500 uppercase tracking-widest text-right">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceOrder.items.map((item: any, idx: number) => (
                  <tr key={idx} className="group">
                    <td className="py-3 px-2 text-[14px] font-bold text-slate-800">{item.productName}</td>
                    <td className="py-3 px-2 text-[14px] font-semibold text-slate-600 text-center">{item.quantity}</td>
                    <td className="py-3 px-2 text-[14px] font-semibold text-slate-600 text-right tabular-nums">৳{item.unitPrice.toLocaleString("en-US")}</td>
                    <td className="py-3 px-2 text-[15px] font-black text-slate-900 text-right tabular-nums">৳{item.total.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-12">
              <div className="w-72 bg-slate-50 p-5 rounded-[16px] border border-slate-100 space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="font-bold text-slate-500 uppercase tracking-wide text-[11px]">মোট বিল</span>
                  <span className="font-black text-slate-900 tabular-nums">৳{invoiceOrder.totalAmount.toLocaleString("en-US")}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="font-bold text-emerald-600/80 uppercase tracking-wide text-[11px]">পরিশোধ</span>
                  <span className="font-black text-emerald-600 tabular-nums">৳{(invoiceOrder.paidAmount || 0).toLocaleString("en-US")}</span>
                </div>
                <div className="flex justify-between items-center text-[14px] pt-3 border-t border-slate-200">
                  <span className="font-bold text-rose-500 uppercase tracking-wide text-[11px]">বাকি</span>
                  <span className="font-black text-rose-600 tabular-nums text-[16px]">৳{invoiceOrder.dueAmount.toLocaleString("en-US")}</span>
                </div>
                {invoiceOrder.dueAmount === 0 && (
                  <div className="text-center mt-5">
                    <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase tracking-widest rounded-lg border border-emerald-100 text-[11px]">
                      PAID
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-12 left-12 right-12 border-t-2 border-slate-100 pt-6 flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <p>ধন্যবাদ আমাদের সাথে থাকার জন্য!</p>
              <p>Developer by Mehedi hasan and mobile +8801601465130</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Calculate today's delivery stats for the display cards
  const todayStr = getBDDateString(new Date());
  const todayLabel = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
  
  
  // General tab counts
  const pendingOrders = orders.filter((o) => {
    if ((o.deliveryStatus || "pending") !== "pending") return false;
    if (filterDate && getBDDateString(new Date(o.createdAt)) !== filterDate) return false;
    return true;
  });
  const deliveredOrders = orders.filter((o) => {
    if (o.deliveryStatus !== "delivered") return false;
    if (filterDate) {
      const dateToUse = o.deliveryDate ? new Date(o.deliveryDate) : new Date(o.createdAt);
      if (getBDDateString(dateToUse) !== filterDate) return false;
    }
    return true;
  });
  const notDeliveredOrders = orders.filter((o) => {
    if (o.deliveryStatus !== "not_delivered") return false;
    if (filterDate) {
      const dateToUse = o.deliveryDate ? new Date(o.deliveryDate) : new Date(o.createdAt);
      if (getBDDateString(dateToUse) !== filterDate) return false;
    }
    return true;
  });
  
  // Stats for the selected date (or today if no filterDate)
  const statsDateStr = filterDate || todayStr;
  const filteredDateDelivered = deliveredOrders.filter((o) => {
    const dateToUse = o.deliveryDate ? new Date(o.deliveryDate) : new Date(o.createdAt);
    return getBDDateString(dateToUse) === statsDateStr;
  });
  
  const todaysDeliveredCount = filteredDateDelivered.length;
  const todaysDeliveredAmount = filteredDateDelivered.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount), 0);
  const todaysDeliveredPaid = filteredDateDelivered.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const todaysDeliveredDue = filteredDateDelivered.reduce((s, o) => s + (o.dueAmount || 0), 0);

  // ===================== MAIN ORDER PAGE =====================
  return (
    <div className="pb-12 space-y-6 max-w-[1400px] mx-auto font-sans w-full">
      {/* App-like Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight text-slate-900 leading-tight">অর্ডার সমূহ</h1>
          <p className="text-[14px] text-slate-500 mt-1 flex items-center gap-2">
            <span>{todayLabel}</span>
          </p>
        </div>
        <div className="flex items-center">
          <Link href="/dashboard/orders/add"
            className="flex items-center gap-2 h-11 px-5 rounded-full text-[14px] font-semibold text-white transition-all shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(16,185,129,0.4)] active:scale-95"
            style={{ background: "#10b981" }}>
            <Plus size={18} strokeWidth={2.5} />
            নতুন অর্ডার
          </Link>
        </div>
      </div>

      {/* KPI Cards (Premium Clean Style) */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Today's Delivery Count */}
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] rounded-[20px] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] p-6 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-700 shadow-md">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <Clock size={12} /> {filterDate ? "নির্বাচিত তারিখ" : "আজকে"}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">ডেলিভারি সংখ্যা</p>
            <p className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-none tabular-nums">
              {todaysDeliveredCount.toLocaleString("en-US")} <span className="text-[16px] text-slate-500">টি</span>
            </p>
          </div>
        </div>

        {/* Today's Delivery Amount */}
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] rounded-[20px] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] p-6 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
              <BarChart3 size={20} className="text-emerald-600" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              <TrendingUp size={12} /> {filterDate ? "নির্বাচিত তারিখ" : "আজকে"}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">মোট এমাউন্ট</p>
            <p className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-none tabular-nums truncate">
              ৳{todaysDeliveredAmount.toLocaleString("en-US")}
            </p>
          </div>
        </div>

        {/* Today's Delivery Paid */}
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] rounded-[20px] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] p-6 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
              <CheckCircle2 size={20} className="text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">মোট আদায়</p>
            <p className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-none tabular-nums">
              ৳{todaysDeliveredPaid.toLocaleString("en-US")}
            </p>
          </div>
        </div>

        {/* Today's Delivery Due */}
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] rounded-[20px] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] p-6 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
              <CreditCard size={20} className="text-rose-600" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">মোট বাকি</p>
            <p className="text-[28px] md:text-[32px] font-bold text-rose-600 tracking-tight leading-none tabular-nums">
              ৳{todaysDeliveredDue.toLocaleString("en-US")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter and Tab Section */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[20px] p-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60 space-y-3">
        
        {/* Date Filter & User Filter */}
        <div className="flex flex-col sm:flex-row gap-3 px-2 pt-2">
            <div className="flex items-center justify-between flex-1 bg-slate-50 rounded-[14px] p-1.5 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200/60">
                    <Calendar size={16} className="text-slate-500" />
                </div>
                <input type="date" value={filterDate}
                  onChange={(e) => { setFilterDate(e.target.value); fetchOrders(e.target.value, targetUser); }}
                  className="h-9 text-[13px] font-medium outline-none bg-transparent w-[130px] text-slate-800"
                  style={{ color: "#1e293b" }} />
              </div>
              {filterDate && (
                <button onClick={() => { setFilterDate(""); fetchOrders("", targetUser); }}
                  className="px-4 h-9 rounded-[10px] text-[12px] font-bold tracking-wide transition-all bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm mr-1">
                  সকল তারিখ
                </button>
              )}
            </div>

            {currentUser?.role === "admin" && systemUsers.length > 0 && (
              <div className="flex-1 rounded-[14px] z-20 relative">
                <AnimatedDropdown
                  options={[
                    { value: "", label: "সকল ইউজার (All)" },
                    ...systemUsers.map(u => ({
                      value: u.username,
                      label: `${u.displayName} - (${u.username})`
                    }))
                  ]}
                  value={targetUser}
                  onChange={(u) => {
                    setTargetUser(u);
                    fetchOrders(filterDate, u);
                  }}
                  className="w-full h-12 shadow-sm rounded-[14px]"
                />
              </div>
            )}

            <div className="flex items-center justify-end sm:justify-start">
            </div>
        </div>

        {/* Select All for Pending Tab */}
        {deliveryTab === "pending" && (
           <div className="flex items-center justify-end px-1 mt-1">
              <button onClick={() => {
                const pending = orders.filter((o) => (o.deliveryStatus || "pending") === "pending");
                setSummarySelection(summarySelection.length === pending.length ? [] : pending.map(o => o._id));
              }}
                className="text-[12px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                {summarySelection.length === pendingOrders.length ? "সব ডি-সিলেক্ট" : "সব সিলেক্ট"}
              </button>
           </div>
        )}

        {/* Search Input */}
        <div className="relative mt-2">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="অর্ডার নং বা কাস্টমার নাম দিয়ে খুঁজুন..."
            className="w-full h-11 pl-11 pr-4 rounded-[14px] text-[13px] font-medium outline-none bg-white text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
          {orderSearch && (
            <button onClick={() => setOrderSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Modern Tabs */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-[16px]">
          {[
            { id: "pending", label: "পেন্ডিং", icon: <Truck size={16} />, count: pendingOrders.length, color: "#f59e0b" },
            { id: "delivered", label: "ডেলিভারড", icon: <CheckCircle2 size={16} />, count: deliveredOrders.length, color: "#10b981" },
            { id: "not_delivered", label: "ব্যর্থ", icon: <Ban size={16} />, count: notDeliveredOrders.length, color: "#f43f5e" },
          ].map((t) => (
             <button key={t.id} onClick={() => setDeliveryTab(t.id as any)}
                className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-[12px] text-[13px] font-bold transition-all relative z-10 ${deliveryTab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                <span style={{ color: deliveryTab === t.id ? t.color : "inherit" }}>{t.icon}</span>
                {t.label} 
                {t.count > 0 && (
                   <span className="ml-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 font-bold">
                      {t.count}
                   </span>
                )}
             </button>
          ))}
        </div>
      </motion.div>

      {/* Orders List (Card Style) */}
      {(() => {
        let filteredOrders = orders.filter((o) => {
          if (deliveryTab === "pending") return (o.deliveryStatus || "pending") === "pending";
          if (deliveryTab === "delivered") return o.deliveryStatus === "delivered";
          return o.deliveryStatus === "not_delivered";
        });
        // Apply search filter
        if (orderSearch.trim()) {
          const q = orderSearch.trim().toLowerCase();
          filteredOrders = filteredOrders.filter((o) =>
            o.customerName.toLowerCase().includes(q) ||
            (o.orderNumber && o.orderNumber.toLowerCase().includes(q))
          );
        }
        return filteredOrders.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[20px] py-20 text-center bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-slate-50 border border-slate-100">
            <ShoppingBag size={24} strokeWidth={1.5} className="text-slate-400" />
          </div>
          <p className="text-[14px] font-medium text-slate-500">
            {deliveryTab === "pending" ? "কোনো পেন্ডিং অর্ডার নেই" : deliveryTab === "delivered" ? "কোনো ডেলিভারড অর্ডার নেই" : "কোনো ব্যর্থ অর্ডার নেই"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {filteredOrders.map((order, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.05 }}
              key={order._id} 
              className="bg-white rounded-[20px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:border-slate-300/80 transition-all duration-300 relative flex flex-col h-full"
            >
              {/* Order Header / Top Section */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                   {deliveryTab === "pending" && (
                    <div className="relative flex items-center justify-center w-5 h-5 cursor-pointer mt-0.5">
                      <input
                        type="checkbox"
                        checked={summarySelection.includes(order._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSummarySelection([...summarySelection, order._id]);
                          else setSummarySelection(summarySelection.filter(id => id !== order._id));
                        }}
                        className="peer relative appearance-none w-5 h-5 border border-slate-300 rounded-md bg-white checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer transition-all"
                      />
                      <Check size={14} strokeWidth={3} className="text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                   )}
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-bold text-slate-900 leading-none">{order.customerName}</h3>
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                        {order.orderNumber && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-bold tracking-wider">{order.orderNumber}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}</span>
                        {order.deliveryStatus === "delivered" && order.deliveryDate && (
                          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 ml-1"><CheckCircle2 size={12} /> {new Date(order.deliveryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}</span>
                        )}
                        {(() => {
                          const addr = order.customerAddress || (order.customer ? customers.find((c) => c._id === order.customer)?.address : undefined);
                          return addr ? (
                            <span className="flex items-center gap-1 max-w-[120px] truncate" title={addr}><MapPin size={12} className="text-slate-400" /> {addr}</span>
                          ) : null;
                        })()}
                     </div>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                   <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold border ${
                      order.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      order.status === "cancelled" ? "bg-rose-50 text-rose-600 border-rose-100" : 
                      "bg-amber-50 text-amber-600 border-amber-100"
                   }`}>
                     {order.status === "completed" ? "সম্পন্ন" : order.status === "cancelled" ? "বাতিল" : "পেন্ডিং"}
                   </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="bg-slate-50 rounded-[14px] p-3.5 mb-4 border border-slate-100 flex-1">
                 <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/60">
                    <span className="bg-white border border-slate-200 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-slate-700 shadow-sm">
                      {order.items.length}
                    </span>
                    <span className="text-[12px] font-bold text-slate-600">পণ্য সমূহ</span>
                 </div>
                 <div className="space-y-2">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[12px]">
                         <span className="text-slate-700 font-medium truncate flex-1 min-w-0 pr-2">{"•"} {item.productName}</span>
                         <span className="text-slate-500 font-semibold shrink-0">{item.quantity} x {item.unitPrice} ৳</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-[11px] font-bold text-indigo-500 pt-1">
                        + আরো {order.items.length - 2} টি...
                      </div>
                    )}
                 </div>
              </div>

              {/* Order Footer & Actions */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                 <div className="flex flex-wrap gap-5">
                    <div>
                       <p className="text-[11px] font-medium text-slate-500 mb-0.5">মোট বিল</p>
                       <p className="text-[16px] font-bold text-slate-900 tabular-nums leading-none">৳{order.totalAmount}</p>
                    </div>
                    {order.dueAmount === 0 ? (
                      <div>
                         <p className="text-[11px] font-medium text-slate-500 mb-0.5">অবস্থা</p>
                         <p className="text-[16px] font-bold text-emerald-600 leading-none">পরিশোধিত</p>
                      </div>
                    ) : (
                      <>
                        <div>
                           <p className="text-[11px] font-medium text-slate-500 mb-0.5">পরিশোধ</p>
                           <p className="text-[16px] font-bold text-emerald-600 tabular-nums leading-none">৳{order.paidAmount || 0}</p>
                        </div>
                        <div>
                           <p className="text-[11px] font-medium text-slate-500 mb-0.5">বাকি</p>
                           <p className="text-[16px] font-bold text-rose-600 tabular-nums leading-none">৳{order.dueAmount}</p>
                        </div>
                      </>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button onClick={() => setInvoiceOrder(order)} className="w-10 h-10 rounded-[14px] bg-white border border-slate-200/80 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-[0_4px_12px_-4px_rgba(99,102,241,0.2)] transition-all shadow-sm group" title="ইনভয়েস">
                      <Printer size={16} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button onClick={() => setViewOrder(order)} className="w-10 h-10 rounded-[14px] bg-white border border-slate-200/80 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 hover:shadow-[0_4px_12px_-4px_rgba(59,130,246,0.2)] transition-all shadow-sm group" title="বিস্তারিত">
                      <Eye size={16} className="group-hover:scale-110 transition-transform" />
                    </button>
                    {!(order.deliveryStatus === "delivered" && currentUser?.role !== "admin") && (
                    <>
                    <button onClick={() => setEditOrder(JSON.parse(JSON.stringify(order)))} className="w-10 h-10 rounded-[14px] bg-white border border-slate-200/80 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)] transition-all shadow-sm group" title="এডিট">
                      <Pencil size={15} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button onClick={() => setDeleteConfirmation(order._id)} className="w-10 h-10 rounded-[14px] bg-white border border-slate-200/80 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 hover:shadow-[0_4px_12px_-4px_rgba(244,63,94,0.2)] transition-all shadow-sm group" title="ডিলিট">
                      <Trash2 size={15} className="group-hover:scale-110 transition-transform" />
                    </button>
                    </>
                    )}
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      );
      })()}

      {renderViewModal()}
      {renderEditModal()}
      {renderSummaryModal()}
      {renderInvoiceModal()}

      {/* Floating Summary Bar */}
      {summarySelection.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-[50] -mb-12">
          <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-900 rounded-t-[18px] shadow-[0_-4px_30px_-10px_rgba(0,0,0,0.3)] border border-slate-700 border-b-0 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-[13px] font-black text-white">{summarySelection.length}</span>
              </div>
              <span className="text-[13px] font-bold text-slate-200">অর্ডার সিলেক্টেড</span>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/dashboard/summary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderIds: summarySelection }),
                  });
                  if (res.status === 409) {
                    toast.error("এই অর্ডারগুলো আগেই সামারিতে আছে");
                    return;
                  }
                  if (!res.ok) throw new Error();
                  toast.success(`${summarySelection.length} টি অর্ডার সামারিতে পাঠানো হয়েছে`);
                  setSummarySelection([]);
                } catch { toast.error("সামারি তৈরিতে সমস্যা হয়েছে"); }
              }}
              className="px-5 py-2.5 rounded-[12px] text-[13px] font-bold text-white bg-indigo-500 hover:bg-indigo-400 transition-colors active:scale-95 flex items-center gap-2 shadow-md cursor-pointer"
            >
              <BarChart3 size={15} />
              সামারিতে পাঠান
            </button>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      <AnimatedModal
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        title=""
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col items-center justify-center pt-4 pb-2 px-2 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center mb-5 shrink-0">
            <Trash2 size={24} className="text-rose-500" strokeWidth={2} />
          </div>
          <h3 className="text-[18px] font-black text-slate-900 mb-2">অর্ডার ডিলিট</h3>
          <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed max-w-[260px]">
            আপনি কি নিশ্চিত যে এই অর্ডারটি রিমুভ করতে চান? এটি একবার ডিলিট করলে আর ফিরে পাওয়া যাবে না।
          </p>
          <div className="flex w-full gap-3">
            <button
              onClick={() => setDeleteConfirmation(null)}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
            >
              বাতিল
            </button>
            <button
              onClick={confirmDeleteOrder}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-[0_4px_15px_-3px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(244,63,94,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              ডিলিট করুন
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* ===================== NEW ORDER FULL-SCREEN ANIMATED PANEL ===================== */}
      <AnimatePresence>
        {showForm && !showCatalog && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col bg-slate-50/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overlay for mobile */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col h-full w-full max-w-[1400px] mx-auto bg-white md:rounded-t-[32px] md:mt-12 md:shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-200/60"
            >
              {/* Header */}
              <div
                className="flex items-center gap-4 h-[72px] px-4 lg:px-8 shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10"
              >
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetOrderForm(); }}
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

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6 pb-24 sm:pb-8">
                  {/* Customer Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.3 }}
                    className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60"
                  >
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

                    {/* Customer search input */}
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

                      {/* Customer dropdown list */}
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

                    {/* Customer name - always editable */}
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

                    {/* Instant customer save toggle */}
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
                  </motion.div>

                  {/* Products Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60"
                  >
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

                    {/* Product action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      <button
                        type="button"
                        onClick={() => { setCatalogTarget("new"); setShowCatalog(true); }}
                        className="h-12 rounded-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-md text-[14px] font-bold bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <ShoppingBag size={16} strokeWidth={2.2} />
                        ক্যাটালগ থেকে বাছাই
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCatalogTarget("new"); setShowManualProduct(true); }}
                        className="h-12 rounded-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all text-[14px] font-bold bg-white text-slate-700 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      >
                        <Edit3 size={16} strokeWidth={2.2} />
                        ম্যানুয়ালি পণ্য যোগ
                      </button>
                    </div>

                    {/* Selected items list */}
                    {items.length > 0 && (
                      <div className="rounded-[16px] overflow-hidden mt-4 border border-slate-200/60 bg-slate-50/50">
                        {items.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 px-4 py-3.5 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                          >
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
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Payment Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60"
                  >
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
                  </motion.div>
                </form>
              </div>
              
              {/* Mobile fixed bottom bar for submit */}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== MANUAL PRODUCT MODAL ===================== */}
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

          {/* Total preview */}
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