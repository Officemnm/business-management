"use client";

import { useEffect, useState } from "react";
import { Plus, Package, Tag, X, ShoppingBag, ArrowLeft, Check, Eye, Pencil, Calendar, BarChart3, Trash2, Clock, User, Hash, Truck, Ban, CheckCircle2, RotateCcw, MapPin, CreditCard, UserPlus, Search, Edit3, Sparkles } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedModal from "@/components/ui/AnimatedModal";
import AnimatedDropdown from "@/components/ui/AnimatedDropdown";

interface Customer { _id: string; name: string; phone: string; address?: string; }
interface Product { _id: string; name: string; sellPrice: number; stock: number; category: string; image?: string; unit: string; }
interface OrderItem { product: string; productName: string; quantity: number; unitPrice: number; total: number; remark: string; image?: string; }
interface Order { _id: string; customer?: string; customerName: string; customerAddress?: string; items: OrderItem[]; totalAmount: number; paidAmount: number; dueAmount: number; returnAmount?: number; finalAmount?: number; returnItems?: { productName: string; amount: number }[]; status: string; deliveryStatus?: string; deliveryNote?: string; createdBy: string; createdAt: string; }

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

  // Date filter — default to today
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  });

  // View/Edit modals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewOrder, setViewOrder] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editOrder, setEditOrder] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

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

  // Product detail popup state
  const [popupProduct, setPopupProduct] = useState<Product | null>(null);
  const [popupQty, setPopupQty] = useState<number | string>(1);
  const [popupRate, setPopupRate] = useState<number | string>(0);
  const [popupRemark, setPopupRemark] = useState("");

  const loadData = () => {
    const today = new Date();
    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    Promise.all([
      fetch(`/api/dashboard/orders?date=${todayStr}`).then((r) => r.json()),
      fetch("/api/dashboard/customers").then((r) => r.json()),
      fetch("/api/dashboard/products").then((r) => r.json()),
    ]).then(([o, c, p]) => {
      setOrders(o); setCustomers(c); setProducts(p);
    }).finally(() => setLoading(false));
  };

  const fetchOrders = (date?: string) => {
    const q = date ? `?date=${date}` : "";
    fetch(`/api/dashboard/orders${q}`).then((r) => r.json()).then(setOrders);
  };

  useEffect(() => { loadData(); }, []);

  const deleteOrder = async (id: string) => {
    if (!confirm("এই অর্ডারটি স্থায়ীভাবে মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/dashboard/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("অর্ডার মুছে ফেলা হয়েছে");
      fetchOrders(filterDate);
    } catch { toast.error("মুছতে ব্যর্থ হয়েছে"); }
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
    const existing = items.find((i) => i.product === p._id);
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

      // Auto-create instant customer if needed
      if (!selectedCustomer && saveAsNewCustomer && customerPhone.trim()) {
        const custRes = await fetch("/api/dashboard/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customerName.trim(),
            phone: customerPhone.trim(),
            address: customerAddressInput.trim(),
          }),
        });
        if (custRes.ok) {
          const newCust = await custRes.json();
          customerIdToUse = newCust._id;
          customerAddress = newCust.address || "";
          toast.success("নতুন কাস্টমার সেভ হয়েছে");
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
      if (saveAsNewCustomer) {
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

    setItems([...items, {
      product: `manual-${Date.now()}`,
      productName: name,
      quantity: qty,
      unitPrice: rate,
      total: qty * rate,
      remark: manualRemark.trim(),
    }]);
    toast.success(`${name} যোগ হয়েছে`);
    setShowManualProduct(false);
    setManualName(""); setManualQty(1); setManualRate(""); setManualRemark("");
  };

  const inputStyle = "w-full h-10 px-3 rounded-lg text-sm outline-none transition-all duration-150";

  // Check if a product is already in cart
  const isInCart = (pid: string) => items.some((i) => i.product === pid);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // ===================== CATALOG FULLSCREEN MODAL =====================
  if (showCatalog) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "var(--bg-primary)" }}>
        {/* Catalog header */}
        <div className="flex items-center gap-3 h-14 px-4 shrink-0" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}>
          <button onClick={() => setShowCatalog(false)} className="cursor-pointer flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-[15px] font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
            পণ্য নির্বাচন করুন
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => setShowCatalog(false)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white cursor-pointer"
              style={{ background: "#66a80f" }}
            >
              <ShoppingBag size={14} />
              সম্পন্ন ({items.length})
            </button>
          )}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Package size={40} style={{ color: "var(--text-muted)" }} strokeWidth={1} />
              <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>কোনো পণ্য নেই</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {products.map((p) => (
                <div
                  key={p._id}
                  onClick={() => openProductPopup(p)}
                  className="rounded-xl overflow-hidden cursor-pointer transition-shadow duration-200 relative"
                  style={{
                    background: "var(--bg-card)",
                    border: isInCart(p._id) ? "2px solid #66a80f" : "1px solid var(--border-color)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* In-cart badge */}
                  {isInCart(p._id) && (
                    <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#66a80f" }}>
                      <Check size={14} color="#fff" strokeWidth={2.5} />
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ background: "var(--bg-input)" }}>
                    {p.image ? (
                      <Image src={p.image} alt={p.name} width={400} height={400} className="w-full h-auto" style={{ objectFit: "contain", maxHeight: "200px" }} unoptimized />
                    ) : (
                      <div className="flex items-center justify-center py-10 w-full">
                        <Package size={36} style={{ color: "var(--border-color)" }} strokeWidth={1} />
                      </div>
                    )}
                    <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: p.stock > 0 ? "#f0fdf4" : "#fef2f2", color: p.stock > 0 ? "#16a34a" : "#dc2626" }}>
                      {p.stock > 0 ? `স্টক: ${p.stock}` : "স্টক নেই"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Tag size={10} style={{ color: "var(--text-muted)" }} />
                      <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{p.category}</span>
                    </div>
                    <h3 className="text-[13px] font-semibold leading-snug mb-1.5 line-clamp-2" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
                    <span className="text-[15px] font-bold" style={{ color: "#66a80f" }}>৳{p.sellPrice}</span>
                    <span className="text-[11px] ml-1" style={{ color: "var(--text-muted)" }}>/{p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart summary bar at bottom */}
        {items.length > 0 && (
          <div className="shrink-0 px-4 py-3 flex items-center justify-between" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-color)" }}>
            <div>
              <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{items.length} পণ্য নির্বাচিত</span>
              <span className="text-[15px] font-bold ml-3" style={{ color: "#66a80f" }}>৳{items.reduce((s, i) => s + i.total, 0)}</span>
            </div>
            <button
              onClick={() => setShowCatalog(false)}
              className="h-10 px-5 rounded-lg text-[13px] font-semibold text-white cursor-pointer"
              style={{ background: "#66a80f" }}
            >
              অর্ডারে ফিরুন
            </button>
          </div>
        )}

        {/* ========= PRODUCT DETAIL POPUP ========= */}
        {popupProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="w-[90%] max-w-md rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)" }}>
              {/* Popup image */}
              <div className="relative w-full flex items-center justify-center" style={{ background: "var(--bg-input)" }}>
                {popupProduct.image ? (
                  <Image src={popupProduct.image} alt={popupProduct.name} width={400} height={400} className="w-full h-auto" style={{ objectFit: "contain", maxHeight: "250px" }} unoptimized />
                ) : (
                  <div className="flex items-center justify-center py-14 w-full">
                    <Package size={48} style={{ color: "var(--border-color)" }} strokeWidth={1} />
                  </div>
                )}
                <button onClick={() => setPopupProduct(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}>
                  <X size={16} />
                </button>
              </div>

              {/* Popup body */}
              <div className="p-5">
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>{popupProduct.name}</h3>
                <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>{popupProduct.category} &middot; স্টক: {popupProduct.stock} {popupProduct.unit}</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>রেট (প্রতি {popupProduct.unit})</label>
                    <input type="number" value={popupRate} onChange={(e) => setPopupRate(e.target.value === "" ? "" : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-10 px-3 rounded-lg text-sm outline-none"
                      style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>পরিমাণ ({popupProduct.unit})</label>
                    <input type="number" value={popupQty} onChange={(e) => setPopupQty(e.target.value === "" ? "" : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-10 px-3 rounded-lg text-sm outline-none"
                      style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>রিমার্ক</label>
                  <input value={popupRemark} onChange={(e) => setPopupRemark(e.target.value)} placeholder="অতিরিক্ত তথ্য (ঐচ্ছিক)"
                    className="w-full h-10 px-3 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                </div>

                {/* Total preview */}
                <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-lg" style={{ background: "var(--bg-input)" }}>
                  <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>মোট</span>
                  <span className="text-[16px] font-bold" style={{ color: "#66a80f" }}>৳{(Number(popupQty) || 0) * (Number(popupRate) || 0)}</span>
                </div>

                <button onClick={confirmProduct}
                  className="w-full h-11 rounded-lg text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: "#66a80f" }}>
                  {isInCart(popupProduct._id) ? "আপডেট করুন" : "যোগ করুন"}
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
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>কাস্টমার</p>
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{viewOrder.customerName}</p>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>তারিখ</p>
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{new Date(viewOrder.createdAt).toLocaleDateString("bn-BD")} {new Date(viewOrder.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>স্ট্যাটাস</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: viewOrder.status === "completed" ? "#f0fdf4" : viewOrder.status === "cancelled" ? "#fef2f2" : "#fffbeb", color: viewOrder.status === "completed" ? "#16a34a" : viewOrder.status === "cancelled" ? "#dc2626" : "#d97706" }}>
              {viewOrder.status === "completed" ? "সম্পন্ন" : viewOrder.status === "cancelled" ? "বাতিল" : "পেন্ডিং"}
            </span>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>ডেলিভারি</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: ds === "delivered" ? "#f0fdf4" : ds === "not_delivered" ? "#fef2f2" : "#fffbeb", color: ds === "delivered" ? "#16a34a" : ds === "not_delivered" ? "#dc2626" : "#d97706" }}>
              {ds === "delivered" ? "ডেলিভারি সম্পন্ন" : ds === "not_delivered" ? "ডেলিভারি হয়নি" : "পেন্ডিং"}
            </span>
            {viewOrder.deliveryNote && <p className="text-[11px] mt-0.5" style={{ color: "#dc2626" }}>{viewOrder.deliveryNote}</p>}
          </div>
        </div>

        <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid var(--border-color)" }}>
          <div className="px-3 py-2 text-[11px] font-semibold" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>পণ্য তালিকা</div>
          {viewOrder.items.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: "1px solid var(--border-color)" }}>
              <div>
                <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{item.productName}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.quantity} x ৳{item.unitPrice}{item.remark ? ` · ${item.remark}` : ""}</p>
              </div>
              <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>৳{item.total}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 p-3 rounded-lg mb-4" style={{ background: "var(--bg-input)" }}>
          <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>মোট</span><b style={{ color: "var(--text-primary)" }}>৳{viewOrder.totalAmount}</b></div>
          {viewOrder.returnAmount > 0 && (
            <>
              <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>ফেরত</span><b style={{ color: "#d97706" }}>- ৳{viewOrder.returnAmount}</b></div>
              <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>চূড়ান্ত মোট</span><b style={{ color: "var(--text-primary)" }}>৳{viewOrder.finalAmount}</b></div>
            </>
          )}
          <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>পরিশোধ</span><b style={{ color: "#16a34a" }}>৳{viewOrder.paidAmount}</b></div>
          <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>বাকি</span><b style={{ color: viewOrder.dueAmount > 0 ? "#dc2626" : "var(--text-primary)" }}>৳{viewOrder.dueAmount}</b></div>
        </div>
            {/* Return items list if exists */}
            {viewOrder.returnItems?.length > 0 && (
              <div className="mb-4 rounded-lg p-3" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <RotateCcw size={12} style={{ color: "#d97706" }} />
                  <span className="text-[11px] font-bold" style={{ color: "#d97706" }}>ফেরত পণ্য</span>
                </div>
                {viewOrder.returnItems.map((ri: { productName: string; amount: number }, i: number) => (
                  <div key={i} className="flex justify-between text-[12px] py-1" style={{ borderTop: i > 0 ? "1px solid #fef3c7" : "none" }}>
                    <span style={{ color: "var(--text-primary)" }}>{ri.productName}</span>
                    <span className="font-bold" style={{ color: "#d97706" }}>৳{ri.amount}</span>
                  </div>
                ))}
              </div>
            )}
            {viewOrder.note && <p className="mb-4 text-[12px]" style={{ color: "var(--text-muted)" }}>নোট: {viewOrder.note}</p>}

            {/* ===== DELIVERY ACTIONS ===== */}
            {ds === "pending" && deliveryAction === "none" && (
              <div className="flex gap-2">
                <button onClick={() => { setDeliveryAction("complete"); setDeliveryPaid(""); setReturnItems([]); }}
                  className="flex-1 h-11 rounded-xl text-[13px] font-semibold text-white cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: "#16a34a" }}>
                  <CheckCircle2 size={16} /> ডেলিভারি সম্পন্ন
                </button>
                <button onClick={() => setDeliveryAction("not_delivered")}
                  className="flex-1 h-11 rounded-xl text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  <Ban size={16} /> ডেলিভারি হয়নি
                </button>
              </div>
            )}

            {/* Delivery Complete Form */}
            {ds === "pending" && deliveryAction === "complete" && (() => {
              const effectiveTotal = viewOrder.totalAmount - returnTotal;
              const paid = Number(deliveryPaid) || 0;
              const dueAfter = Math.max(0, effectiveTotal - paid);
              return (
              <div className="rounded-xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={16} style={{ color: "#16a34a" }} />
                  <h4 className="text-[13px] font-bold" style={{ color: "#16a34a" }}>ডেলিভারি সম্পন্ন করুন</h4>
                </div>

                {/* Return Items — optional */}
                <div className="mb-3 rounded-lg p-3" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <RotateCcw size={13} style={{ color: "#d97706" }} />
                      <span className="text-[11px] font-bold" style={{ color: "#d97706" }}>পণ্য ফেরত (অপশনাল)</span>
                    </div>
                    <button type="button" onClick={() => setReturnItems([...returnItems, { productName: "", amount: "" }])}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer"
                      style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" }}>
                      + যোগ করুন
                    </button>
                  </div>
                  {returnItems.length === 0 && (
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>কোনো পণ্য ফেরত না থাকলে এড়িয়ে যান</p>
                  )}
                  {returnItems.map((ri, idx) => (
                    <div key={idx} className="flex items-center gap-2 mt-2">
                      <input type="text" value={ri.productName} placeholder="পণ্যের নাম"
                        onChange={(e) => { const n = [...returnItems]; n[idx] = { ...n[idx], productName: e.target.value }; setReturnItems(n); }}
                        className="flex-1 h-8 px-2 rounded-md text-[11px] outline-none"
                        style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #fde68a" }} />
                      <input type="number" value={ri.amount} placeholder="৳ টাকা"
                        onChange={(e) => { const n = [...returnItems]; n[idx] = { ...n[idx], amount: e.target.value === "" ? "" : Number(e.target.value) }; setReturnItems(n); }}
                        onFocus={(e) => e.target.select()}
                        className="w-24 h-8 px-2 rounded-md text-[11px] outline-none font-bold"
                        style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #fde68a" }} min={0} />
                      <button type="button" onClick={() => setReturnItems(returnItems.filter((_, i) => i !== idx))}
                        className="cursor-pointer shrink-0" style={{ color: "#dc2626" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {returnTotal > 0 && (
                    <div className="mt-2 pt-2 flex justify-between text-[11px] font-bold" style={{ borderTop: "1px dashed #fde68a", color: "#d97706" }}>
                      <span>মোট ফেরত</span><span>৳{returnTotal}</span>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="mb-3">
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    {returnTotal > 0
                      ? `মোট: ৳${viewOrder.totalAmount} − ফেরত: ৳${returnTotal} = ৳${effectiveTotal}`
                      : `মোট টাকা: ৳${viewOrder.totalAmount}`}
                  </label>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>কত টাকা পেইড করেছে?</label>
                  <input type="number" value={deliveryPaid}
                    onChange={(e) => setDeliveryPaid(e.target.value === "" ? "" : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    placeholder="টাকার পরিমাণ লিখুন"
                    min={0} max={effectiveTotal}
                    className="w-full h-10 px-3 rounded-lg text-sm outline-none font-bold"
                    style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #bbf7d0" }} />
                </div>
                {dueAfter > 0 && (
                  <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: "#fef2f2" }}>
                    <p className="text-[12px] font-semibold" style={{ color: "#dc2626" }}>বাকি থাকবে: ৳{dueAfter}</p>
                    <p className="text-[11px]" style={{ color: "#dc2626" }}>এই বাকি কাস্টমারের হিসাবে যোগ হবে</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setDeliveryAction("none")}
                    className="flex-1 h-10 rounded-lg text-[12px] font-medium cursor-pointer"
                    style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
                    বাতিল
                  </button>
                  <button onClick={handleDeliveryComplete} disabled={deliverySaving}
                    className="flex-1 h-10 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
                    style={{ background: "#16a34a" }}>
                    {deliverySaving ? "সংরক্ষণ হচ্ছে..." : "ডেলিভারি কনফার্ম"}
                  </button>
                </div>
              </div>
              );
            })()}

            {/* Delivery Failed Form */}
            {ds === "pending" && deliveryAction === "not_delivered" && (
              <div className="rounded-xl p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Ban size={16} style={{ color: "#dc2626" }} />
                  <h4 className="text-[13px] font-bold" style={{ color: "#dc2626" }}>ডেলিভারি হয়নি — কারণ নির্বাচন করুন</h4>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["দোকান বন্ধ", "দোকানদার নেই", "অর্ডার নিবে না", "পণ্য পছন্দ হয়নি", "ঠিকানা পাওয়া যায়নি"].map((r) => (
                    <button key={r} onClick={() => setDeliveryReason(r)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors"
                      style={{ background: deliveryReason === r ? "#dc2626" : "#fff", color: deliveryReason === r ? "#fff" : "#dc2626", border: "1px solid #fecaca" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mb-3">
                  <input value={deliveryReason} onChange={(e) => setDeliveryReason(e.target.value)}
                    placeholder="অন্য কারণ লিখুন..."
                    className="w-full h-9 px-3 rounded-lg text-[12px] outline-none"
                    style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #fecaca" }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setDeliveryAction("none"); setDeliveryReason(""); }}
                    className="flex-1 h-10 rounded-lg text-[12px] font-medium cursor-pointer"
                    style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
                    বাতিল
                  </button>
                  <button onClick={handleDeliveryFailed} disabled={deliverySaving}
                    className="flex-1 h-10 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
                    style={{ background: "#dc2626" }}>
                    {deliverySaving ? "সংরক্ষণ হচ্ছে..." : "নিশ্চিত করুন"}
                  </button>
                </div>
              </div>
            )}

            {/* Already delivered or not delivered badge */}
            {ds === "delivered" && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#16a34a" }}>ডেলিভারি সম্পন্ন হয়েছে</span>
              </div>
            )}
            {ds === "not_delivered" && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <Ban size={18} style={{ color: "#dc2626" }} />
                <div>
                  <span className="text-[13px] font-semibold" style={{ color: "#dc2626" }}>ডেলিভারি হয়নি</span>
                  {viewOrder.deliveryNote && <p className="text-[11px]" style={{ color: "#dc2626" }}>কারণ: {viewOrder.deliveryNote}</p>}
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
            <div className="mb-3">
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>কাস্টমার নাম</label>
              <input value={editOrder.customerName} onChange={(e) => setEditOrder({ ...editOrder, customerName: e.target.value })}
                className="w-full h-10 px-3 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>

            <div className="mb-3">
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>পণ্য তালিকা</label>
              {editOrder.items.map((item: OrderItem, idx: number) => (
                <div key={idx} className="flex items-center gap-2 mb-2 p-2.5 rounded-lg" style={{ background: "var(--bg-input)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.productName}</p>
                  </div>
                  <input type="number" value={item.quantity} min={1}
                    onChange={(e) => { const q = parseInt(e.target.value) || 1; const ni = editOrder.items.map((it: OrderItem, i: number) => i === idx ? { ...it, quantity: q, total: q * it.unitPrice } : it); const t = ni.reduce((s: number, i: OrderItem) => s + i.total, 0); setEditOrder({ ...editOrder, items: ni, totalAmount: t, dueAmount: Math.max(0, t - editOrder.paidAmount) }); }}
                    className="w-14 h-8 text-center rounded-md text-[12px] outline-none"
                    style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>x</span>
                  <input type="number" value={item.unitPrice}
                    onChange={(e) => { const r = Number(e.target.value); const ni = editOrder.items.map((it: OrderItem, i: number) => i === idx ? { ...it, unitPrice: r, total: it.quantity * r } : it); const t = ni.reduce((s: number, i: OrderItem) => s + i.total, 0); setEditOrder({ ...editOrder, items: ni, totalAmount: t, dueAmount: Math.max(0, t - editOrder.paidAmount) }); }}
                    className="w-20 h-8 text-center rounded-md text-[12px] outline-none"
                    style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                  <span className="text-[12px] font-bold w-16 text-right" style={{ color: "#66a80f" }}>৳{item.total}</span>
                  <button type="button" onClick={() => { const ni = editOrder.items.filter((_: OrderItem, i: number) => i !== idx); const t = ni.reduce((s: number, i: OrderItem) => s + i.total, 0); setEditOrder({ ...editOrder, items: ni, totalAmount: t, dueAmount: Math.max(0, t - editOrder.paidAmount) }); }}
                    className="cursor-pointer" style={{ color: "#dc2626" }}><X size={13} /></button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>মোট</label>
                <div className="h-9 px-2 flex items-center rounded-lg text-[13px] font-bold" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}>৳{editOrder.totalAmount}</div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>পরিশোধ</label>
                <input type="number" value={editOrder.paidAmount}
                  onChange={(e) => { const p = Number(e.target.value); setEditOrder({ ...editOrder, paidAmount: p, dueAmount: Math.max(0, editOrder.totalAmount - p) }); }}
                  className="w-full h-9 px-2 rounded-lg text-[13px] outline-none"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>বাকি</label>
                <div className="h-9 px-2 flex items-center rounded-lg text-[13px] font-bold" style={{ background: editOrder.dueAmount > 0 ? "#fef2f2" : "var(--bg-input)", color: editOrder.dueAmount > 0 ? "#dc2626" : "var(--text-primary)" }}>৳{editOrder.dueAmount}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>স্ট্যাটাস</label>
                <AnimatedDropdown
                  options={[{ value: "pending", label: "পেন্ডিং" }, { value: "completed", label: "সম্পন্ন" }, { value: "cancelled", label: "বাতিল" }]}
                  value={editOrder.status}
                  onChange={(v) => setEditOrder({ ...editOrder, status: v })}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>নোট</label>
                <input value={editOrder.note || ""} onChange={(e) => setEditOrder({ ...editOrder, note: e.target.value })}
                  className="w-full h-9 px-2 rounded-lg text-[13px] outline-none"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>
            </div>

            <button onClick={saveEdit} disabled={saving}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
              style={{ background: "#66a80f" }}>
              {saving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ"}
            </button>
          </AnimatedModal>
    );
  };

  // ===================== SUMMARY MODAL =====================
  const renderSummaryModal = () => {
    if (!showSummary) return null;

    // Only aggregate PENDING orders (as requested)
    const pendingOrdersOnly = orders.filter((o) => (o.deliveryStatus || "pending") === "pending");

    const productMap: Record<string, { name: string; qty: number; total: number }> = {};
    let grandTotal = 0;
    let grandPaid = 0;
    let grandDue = 0;

    pendingOrdersOnly.forEach((o) => {
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
      ? new Date(filterDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
      : "সকল তারিখ";

    return (
      <AnimatedModal open={showSummary} onClose={() => setShowSummary(false)} title="পেন্ডিং অর্ডার সামারি" maxWidth="max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fffbeb" }}>
            <Truck size={15} strokeWidth={2.2} style={{ color: "#d97706" }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#111827" }}>পেন্ডিং অর্ডারের সামারি</p>
            <p className="text-[11px] font-medium" style={{ color: "#6b7280" }}>{dateLabel} · {pendingOrdersOnly.length} টি অর্ডার</p>
          </div>
        </div>

        {/* Grand totals */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-4 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>মোট বিক্রি</p>
            <p className="text-[18px] font-bold" style={{ color: "#111827", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>৳{grandTotal.toLocaleString("en-US")}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>পরিশোধ</p>
            <p className="text-[18px] font-bold" style={{ color: "#16a34a", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>৳{grandPaid.toLocaleString("en-US")}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: grandDue > 0 ? "#fef2f2" : "#ffffff", border: grandDue > 0 ? "1px solid #fecaca" : "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>বাকি</p>
            <p className="text-[18px] font-bold" style={{ color: grandDue > 0 ? "#dc2626" : "#111827", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>৳{grandDue.toLocaleString("en-US")}</p>
          </div>
        </div>

        {/* Product breakdown */}
        <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>পণ্য ভিত্তিক বিবরণ</h4>
        <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: "#fafafa", color: "#6b7280" }}>
            <span className="col-span-6">পণ্য</span>
            <span className="col-span-3 text-center">পরিমাণ</span>
            <span className="col-span-3 text-right">মোট</span>
          </div>
          {productList.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
                <ShoppingBag size={16} strokeWidth={1.5} style={{ color: "#9ca3af" }} />
              </div>
              <p className="text-[12px] font-medium" style={{ color: "#6b7280" }}>কোনো পেন্ডিং অর্ডারে পণ্য নেই</p>
            </div>
          ) : (
            productList.map((p, idx) => (
              <div key={idx} className="grid grid-cols-12 px-4 py-3 items-center" style={{ borderTop: idx > 0 ? "1px solid #f3f4f6" : "none" }}>
                <span className="col-span-6 text-[13px] font-medium truncate" style={{ color: "#111827" }}>{p.name}</span>
                <span className="col-span-3 text-center text-[13px] font-semibold" style={{ color: "#374151" }}>{p.qty} পিছ</span>
                <span className="col-span-3 text-right text-[13px] font-bold" style={{ color: "#66a80f" }}>৳{p.total.toLocaleString("en-US")}</span>
              </div>
            ))
          )}
          {/* Footer total */}
          {productList.length > 0 && (
            <div className="grid grid-cols-12 px-4 py-3 items-center" style={{ borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
              <span className="col-span-6 text-[11px] font-bold" style={{ color: "#111827" }}>সর্বমোট</span>
              <span className="col-span-3 text-center text-[11px] font-bold" style={{ color: "#111827" }}>{productList.reduce((s, p) => s + p.qty, 0)} পিছ</span>
              <span className="col-span-3 text-right text-[13px] font-bold" style={{ color: "#111827" }}>৳{grandTotal.toLocaleString("en-US")}</span>
            </div>
          )}
        </div>
      </AnimatedModal>
    );
  };

  // Calculate stats for display
  const todayLabel = new Date().toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
  const pendingOrders = orders.filter((o) => (o.deliveryStatus || "pending") === "pending");
  const deliveredOrders = orders.filter((o) => o.deliveryStatus === "delivered");
  const notDeliveredOrders = orders.filter((o) => o.deliveryStatus === "not_delivered");
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalDue = orders.reduce((s, o) => s + o.dueAmount, 0);
  const pendingRevenue = pendingOrders.reduce((s, o) => s + o.totalAmount, 0);
  const pendingDue = pendingOrders.reduce((s, o) => s + o.dueAmount, 0);

  // ===================== MAIN ORDER PAGE =====================
  return (
    <div className="pb-8 space-y-5">
      {/* Page Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>অর্ডার সমূহ</h1>
          <p className="text-[13px] font-medium mt-1" style={{ color: "#6b7280" }}>{todayLabel} · মোট {orders.length} টি অর্ডার</p>
        </div>
        <button onClick={() => { resetOrderForm(); setShowForm(true); }}
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all hover:shadow-sm"
          style={{ background: "#66a80f" }}>
          <Plus size={16} /> নতুন অর্ডার
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Orders */}
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট অর্ডার</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <ShoppingBag size={14} strokeWidth={2.2} style={{ color: "#374151" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {orders.length.toLocaleString("en-US")}
          </p>
        </div>

        {/* Pending Orders */}
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>পেন্ডিং</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fffbeb" }}>
              <Truck size={14} strokeWidth={2.2} style={{ color: "#d97706" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {pendingOrders.length.toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[11px] font-semibold" style={{ color: "#d97706" }}>{notDeliveredOrders.length} ব্যর্থ</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট বিক্রি</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
              <BarChart3 size={14} strokeWidth={2.2} style={{ color: "#66a80f" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            ৳{totalRevenue.toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[11px] font-semibold" style={{ color: "#66a80f" }}>৳{pendingRevenue.toLocaleString("en-US")}</span>
            <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>পেন্ডিং</span>
          </div>
        </div>

        {/* Total Due */}
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট বাকি</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fef2f2" }}>
              <CreditCard size={14} strokeWidth={2.2} style={{ color: "#dc2626" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            ৳{totalDue.toLocaleString("en-US")}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[11px] font-semibold" style={{ color: "#dc2626" }}>৳{pendingDue.toLocaleString("en-US")}</span>
            <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>পেন্ডিং</span>
          </div>
        </div>
      </div>

      {/* Date filter & Actions */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: "#6b7280" }} />
            <input type="date" value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); fetchOrders(e.target.value); }}
              className="h-10 px-3 rounded-lg text-[13px] font-medium outline-none"
              style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }} />
          </div>
          {filterDate && (
            <button onClick={() => { setFilterDate(""); fetchOrders(""); }}
              className="h-10 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors hover:bg-gray-50"
              style={{ background: "#fafafa", color: "#374151", border: "1px solid #e5e7eb" }}>
              সব দেখুন
            </button>
          )}
        </div>
        <button onClick={() => setShowSummary(true)}
          className="h-10 px-4 rounded-lg text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all hover:shadow-sm"
          style={{ background: "#111827", color: "#ffffff" }}>
          <BarChart3 size={15} /> পেন্ডিং সামারি
        </button>
      </div>

      {/* Delivery Status Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => setDeliveryTab("pending")}
          className="h-12 rounded-xl text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all"
          style={{
            background: deliveryTab === "pending" ? "#ffffff" : "#fafafa",
            color: deliveryTab === "pending" ? "#111827" : "#6b7280",
            border: deliveryTab === "pending" ? "1px solid #e5e7eb" : "1px solid transparent",
            boxShadow: deliveryTab === "pending" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
          }}>
          <Truck size={15} strokeWidth={2.2} style={{ color: deliveryTab === "pending" ? "#d97706" : "#9ca3af" }} /> 
          পেন্ডিং
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: deliveryTab === "pending" ? "#fffbeb" : "#f3f4f6", color: deliveryTab === "pending" ? "#d97706" : "#6b7280" }}>
            {pendingOrders.length}
          </span>
        </button>
        <button onClick={() => setDeliveryTab("delivered")}
          className="h-12 rounded-xl text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all"
          style={{
            background: deliveryTab === "delivered" ? "#ffffff" : "#fafafa",
            color: deliveryTab === "delivered" ? "#111827" : "#6b7280",
            border: deliveryTab === "delivered" ? "1px solid #e5e7eb" : "1px solid transparent",
            boxShadow: deliveryTab === "delivered" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
          }}>
          <CheckCircle2 size={15} strokeWidth={2.2} style={{ color: deliveryTab === "delivered" ? "#16a34a" : "#9ca3af" }} /> 
          ডেলিভারড
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: deliveryTab === "delivered" ? "#f0fdf4" : "#f3f4f6", color: deliveryTab === "delivered" ? "#16a34a" : "#6b7280" }}>
            {deliveredOrders.length}
          </span>
        </button>
        <button onClick={() => setDeliveryTab("not_delivered")}
          className="h-12 rounded-xl text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all"
          style={{
            background: deliveryTab === "not_delivered" ? "#ffffff" : "#fafafa",
            color: deliveryTab === "not_delivered" ? "#111827" : "#6b7280",
            border: deliveryTab === "not_delivered" ? "1px solid #e5e7eb" : "1px solid transparent",
            boxShadow: deliveryTab === "not_delivered" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
          }}>
          <Ban size={15} strokeWidth={2.2} style={{ color: deliveryTab === "not_delivered" ? "#dc2626" : "#9ca3af" }} /> 
          ব্যর্থ
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: deliveryTab === "not_delivered" ? "#fef2f2" : "#f3f4f6", color: deliveryTab === "not_delivered" ? "#dc2626" : "#6b7280" }}>
            {notDeliveredOrders.length}
          </span>
        </button>
      </div>

      {/* Orders List */}
      {(() => {
        const filteredOrders = orders.filter((o) => {
          if (deliveryTab === "pending") return (o.deliveryStatus || "pending") === "pending";
          if (deliveryTab === "delivered") return o.deliveryStatus === "delivered";
          return o.deliveryStatus === "not_delivered";
        });
        return filteredOrders.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
            <ShoppingBag size={20} strokeWidth={1.5} style={{ color: "#9ca3af" }} />
          </div>
          <p className="text-[13px] font-medium" style={{ color: "#6b7280" }}>
            {deliveryTab === "pending" ? "কোনো পেন্ডিং অর্ডার নেই" : deliveryTab === "delivered" ? "কোনো ডেলিভারড অর্ডার নেই" : "কোনো ব্যর্থ অর্ডার নেই"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrders.map((order) => (
            <div key={order._id} className="rounded-2xl overflow-hidden transition-all hover:shadow-sm"
              style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
              {/* Order header */}
              <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
                  <User size={16} style={{ color: "#66a80f" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{order.customerName}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                      style={{ background: order.status === "completed" ? "#f0fdf4" : order.status === "cancelled" ? "#fef2f2" : "#fffbeb", color: order.status === "completed" ? "#16a34a" : order.status === "cancelled" ? "#dc2626" : "#d97706" }}>
                      {order.status === "completed" ? "সম্পন্ন" : order.status === "cancelled" ? "বাতিল" : "পেন্ডিং"}
                    </span>
                  </div>
                  {(() => {
                    const addr = order.customerAddress || (order.customer ? customers.find((c) => c._id === order.customer)?.address : undefined);
                    return addr ? (
                      <p className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        <MapPin size={10} /> {addr}
                      </p>
                    ) : null;
                  })()}
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <Hash size={10} /> {order.items.length} পণ্য
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: (order.deliveryStatus || "pending") === "delivered" ? "#16a34a" : (order.deliveryStatus || "pending") === "not_delivered" ? "#dc2626" : "#d97706" }}>
                      <Truck size={10} /> {(order.deliveryStatus || "pending") === "delivered" ? "ডেলিভারড" : (order.deliveryStatus || "pending") === "not_delivered" ? "ডেলিভারি হয়নি" : "ডেলিভারি পেন্ডিং"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product list compact */}
              <div className="px-4 py-2">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-[12px] truncate flex-1" style={{ color: "var(--text-secondary)" }}>{item.productName}</span>
                    <span className="text-[11px] shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>{item.quantity} x ৳{item.unitPrice}</span>
                    <span className="text-[12px] font-semibold shrink-0 ml-2 w-16 text-right" style={{ color: "var(--text-primary)" }}>৳{item.total}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-[11px] py-0.5" style={{ color: "var(--text-muted)" }}>+{order.items.length - 3} আরো পণ্য</p>
                )}
              </div>

              {/* Order footer */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-input)" }}>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>মোট</p>
                    <p className="text-[14px] font-bold" style={{ color: "#66a80f" }}>৳{order.totalAmount}</p>
                  </div>
                  {order.paidAmount > 0 && (
                    <div>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>পরিশোধ</p>
                      <p className="text-[13px] font-semibold" style={{ color: "#16a34a" }}>৳{order.paidAmount}</p>
                    </div>
                  )}
                  {order.dueAmount > 0 && (
                    <div>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>বাকি</p>
                      <p className="text-[13px] font-bold" style={{ color: "#dc2626" }}>৳{order.dueAmount}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setViewOrder(order)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors" style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }} title="দেখুন">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => setEditOrder(JSON.parse(JSON.stringify(order)))} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors" style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }} title="সম্পাদনা">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteOrder(order._id)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }} title="মুছুন">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
      })()}

      {renderViewModal()}
      {renderEditModal()}
      {renderSummaryModal()}

      {/* ===================== NEW ORDER FULL-SCREEN ANIMATED PANEL ===================== */}
      <AnimatePresence>
        {showForm && !showCatalog && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col"
            style={{ background: "#fafafa" }}
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
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 h-[60px] px-4 lg:px-6 shrink-0"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "saturate(180%) blur(20px)",
                  WebkitBackdropFilter: "saturate(180%) blur(20px)",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetOrderForm(); }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-100"
                  style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#374151" }}
                >
                  <ArrowLeft size={16} strokeWidth={2} />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[16px] font-bold tracking-tight truncate" style={{ color: "#111827", letterSpacing: "-0.01em" }}>
                    নতুন অর্ডার তৈরি করুন
                  </h2>
                  <p className="text-[11px] font-medium" style={{ color: "#6b7280" }}>
                    {items.length > 0 ? `${items.length} টি পণ্য · ৳${totalAmount.toLocaleString("en-US")}` : "কাস্টমার ও পণ্য নির্বাচন করুন"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || items.length === 0 || !customerName.trim()}
                  className="hidden sm:flex items-center gap-2 h-10 px-5 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                  style={{ background: "#66a80f" }}
                >
                  <Check size={15} strokeWidth={2.5} />
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার সংরক্ষণ"}
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 lg:p-6 space-y-5">
                  {/* Customer Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.3 }}
                    className="rounded-2xl p-5"
                    style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
                        <User size={15} strokeWidth={2.2} style={{ color: "#66a80f" }} />
                      </div>
                      <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>কাস্টমার</h3>
                      {selectedCustomer && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                          সেভড কাস্টমার
                        </span>
                      )}
                      {!selectedCustomer && customerName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto" style={{ background: "#fffbeb", color: "#d97706" }}>
                          ইনস্ট্যান্ট
                        </span>
                      )}
                    </div>

                    {/* Customer search input */}
                    <div className="relative mb-3">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerPicker(true); }}
                        onFocus={() => setShowCustomerPicker(true)}
                        placeholder="কাস্টমার খুঁজুন (নাম অথবা ফোন)"
                        className="w-full h-10 pl-9 pr-3 rounded-lg text-[13px] font-medium outline-none"
                        style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
                      />
                      {selectedCustomer && (
                        <button
                          type="button"
                          onClick={() => { setSelectedCustomer(""); setCustomerName(""); setCustomerSearch(""); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100"
                        >
                          <X size={13} style={{ color: "#6b7280" }} />
                        </button>
                      )}

                      {/* Customer dropdown list */}
                      <AnimatePresence>
                        {showCustomerPicker && customerSearch && !selectedCustomer && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-20 max-h-72 overflow-y-auto"
                            style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                          >
                            {(() => {
                              const filtered = customers.filter((c) =>
                                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                c.phone.includes(customerSearch)
                              ).slice(0, 8);
                              return filtered.length > 0 ? (
                                filtered.map((c) => (
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
                                    className="w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 text-left"
                                  >
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold" style={{ background: "#f3f4f6", color: "#111827" }}>
                                      {c.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{c.name}</p>
                                      <p className="text-[11px] font-medium" style={{ color: "#6b7280" }}>{c.phone}</p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4">
                                  <div className="text-[12px] font-medium mb-3" style={{ color: "#6b7280" }}>
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
                                    className="w-full h-10 rounded-lg text-[12px] font-semibold text-white cursor-pointer flex items-center justify-center gap-2 transition-all hover:shadow-sm"
                                    style={{ background: "#66a80f" }}
                                  >
                                    <UserPlus size={14} strokeWidth={2.2} />
                                    ইনস্ট্যান্ট কাস্টমার হিসেবে যোগ করুন
                                  </button>
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Customer name - always editable */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>নাম *</label>
                        <input
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="কাস্টমার নাম"
                          className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
                          style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>
                          মোবাইল {saveAsNewCustomer && "*"}
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          disabled={!!selectedCustomer}
                          className="w-full h-10 px-3 rounded-lg text-[13px] outline-none disabled:opacity-60"
                          style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>ঠিকানা (ঐচ্ছিক)</label>
                      <input
                        value={customerAddressInput}
                        onChange={(e) => setCustomerAddressInput(e.target.value)}
                        placeholder="ঠিকানা"
                        disabled={!!selectedCustomer}
                        className="w-full h-10 px-3 rounded-lg text-[13px] outline-none disabled:opacity-60"
                        style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
                      />
                    </div>

                    {/* Instant customer save toggle */}
                    {!selectedCustomer && customerName && (
                      <label className="flex items-start gap-2.5 mt-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-amber-50" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
                        <input
                          type="checkbox"
                          checked={saveAsNewCustomer}
                          onChange={(e) => setSaveAsNewCustomer(e.target.checked)}
                          className="mt-0.5 w-4 h-4 cursor-pointer accent-amber-600"
                        />
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: "#92400e" }}>
                            <Sparkles size={12} strokeWidth={2.2} /> কাস্টমার লিস্টে সেভ করুন
                          </p>
                          <p className="text-[11px] font-medium mt-0.5" style={{ color: "#a16207" }}>
                            পরবর্তী অর্ডারে সহজে খুঁজে পাবেন (মোবাইল লাগবে)
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
                    className="rounded-2xl p-5"
                    style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
                        <ShoppingBag size={15} strokeWidth={2.2} style={{ color: "#66a80f" }} />
                      </div>
                      <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>পণ্য</h3>
                      {items.length > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-auto" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                          {items.length} টি · ৳{totalAmount.toLocaleString("en-US")}
                        </span>
                      )}
                    </div>

                    {/* Product action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setShowCatalog(true)}
                        className="h-12 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-sm text-[13px] font-semibold"
                        style={{ background: "#66a80f", color: "#ffffff" }}
                      >
                        <ShoppingBag size={15} strokeWidth={2.2} />
                        ক্যাটালগ থেকে বাছাই
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualProduct(true)}
                        className="h-12 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-sm text-[13px] font-semibold"
                        style={{ background: "#ffffff", color: "#374151", border: "1px dashed #d1d5db" }}
                      >
                        <Edit3 size={14} strokeWidth={2.2} />
                        ম্যানুয়ালি পণ্য যোগ
                      </button>
                    </div>

                    {/* Selected items list */}
                    {items.length > 0 && (
                      <div className="rounded-xl overflow-hidden mt-3" style={{ background: "#fafafa", border: "1px solid #e5e7eb" }}>
                        {items.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 px-3.5 py-3"
                            style={{ borderTop: idx > 0 ? "1px solid #f3f4f6" : "none" }}
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
                              {item.image ? (
                                <Image src={item.image} alt={item.productName} width={40} height={40} className="w-full h-full" style={{ objectFit: "contain" }} unoptimized />
                              ) : (
                                <Package size={16} style={{ color: "#9ca3af" }} strokeWidth={1.5} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold truncate" style={{ color: "#111827" }}>{item.productName}</p>
                              <p className="text-[11px] font-medium" style={{ color: "#6b7280" }}>
                                {item.quantity} × ৳{item.unitPrice.toLocaleString("en-US")}
                                {item.remark && <span className="ml-1">· {item.remark}</span>}
                              </p>
                            </div>
                            <p className="text-[14px] font-bold shrink-0" style={{ color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                              ৳{item.total.toLocaleString("en-US")}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer shrink-0 transition-colors hover:bg-red-100"
                              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                            >
                              <X size={12} strokeWidth={2.2} />
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
                    className="rounded-2xl p-5"
                    style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
                        <CreditCard size={15} strokeWidth={2.2} style={{ color: "#66a80f" }} />
                      </div>
                      <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>পেমেন্ট</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>মোট</label>
                        <div className="h-11 px-3 flex items-center rounded-lg text-[14px] font-bold" style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb", fontVariantNumeric: "tabular-nums" }}>
                          ৳{totalAmount.toLocaleString("en-US")}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>পরিশোধ</label>
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-full h-11 px-3 rounded-lg text-[14px] font-bold outline-none"
                          min={0}
                          style={{ background: "#fafafa", color: "#16a34a", border: "1px solid #e5e7eb", fontVariantNumeric: "tabular-nums" }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>বাকি</label>
                        <div className="h-11 px-3 flex items-center rounded-lg text-[14px] font-bold"
                          style={{ background: dueAmount > 0 ? "#fef2f2" : "#fafafa", color: dueAmount > 0 ? "#dc2626" : "#111827", border: "1px solid " + (dueAmount > 0 ? "#fecaca" : "#e5e7eb"), fontVariantNumeric: "tabular-nums" }}>
                          ৳{dueAmount.toLocaleString("en-US")}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>নোট (ঐচ্ছিক)</label>
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="অতিরিক্ত তথ্য"
                        className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
                        style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
                      />
                    </div>
                  </motion.div>

                  {/* Mobile submit button */}
                  <button
                    type="submit"
                    disabled={submitting || items.length === 0 || !customerName.trim()}
                    className="sm:hidden w-full h-12 rounded-xl text-[14px] font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-sm flex items-center justify-center gap-2"
                    style={{ background: "#66a80f" }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                    {submitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার সংরক্ষণ"}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== MANUAL PRODUCT MODAL ===================== */}
      <AnimatedModal open={showManualProduct} onClose={() => setShowManualProduct(false)} title="ম্যানুয়ালি পণ্য যোগ" maxWidth="max-w-md">
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#ffffff" }}>
            <Edit3 size={14} strokeWidth={2.2} style={{ color: "#d97706" }} />
          </div>
          <p className="text-[11px] font-medium" style={{ color: "#92400e" }}>
            ক্যাটালগে না থাকা পণ্য ম্যানুয়ালি যোগ করুন
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>পণ্যের নাম *</label>
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="পণ্যের নাম লিখুন"
              autoFocus
              className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
              style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>পরিমাণ *</label>
              <input
                type="number"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                min={1}
                className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
                style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>দর *</label>
              <input
                type="number"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                placeholder="০"
                min={0}
                className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
                style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>রিমার্ক (ঐচ্ছিক)</label>
            <input
              value={manualRemark}
              onChange={(e) => setManualRemark(e.target.value)}
              placeholder="অতিরিক্ত তথ্য"
              className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
              style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
            />
          </div>

          {/* Total preview */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#fafafa", border: "1px solid #e5e7eb" }}>
            <span className="text-[12px] font-semibold" style={{ color: "#6b7280" }}>মোট</span>
            <span className="text-[16px] font-bold" style={{ color: "#66a80f", fontVariantNumeric: "tabular-nums" }}>
              ৳{((Number(manualQty) || 0) * (Number(manualRate) || 0)).toLocaleString("en-US")}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowManualProduct(false)}
              className="flex-1 h-10 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors hover:bg-gray-50"
              style={{ background: "#ffffff", color: "#374151", border: "1px solid #e5e7eb" }}
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={addManualProduct}
              className="flex-1 h-10 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all hover:shadow-sm flex items-center justify-center gap-2"
              style={{ background: "#66a80f" }}
            >
              <Plus size={14} strokeWidth={2.2} />
              যোগ করুন
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}