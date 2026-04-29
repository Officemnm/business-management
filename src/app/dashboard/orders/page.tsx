"use client";

import { useEffect, useState } from "react";
import { Plus, Package, Tag, X, ShoppingBag, ArrowLeft, Check, Eye, Pencil, Calendar, BarChart3 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface Customer { _id: string; name: string; phone: string; }
interface Product { _id: string; name: string; sellPrice: number; stock: number; category: string; image?: string; unit: string; }
interface OrderItem { product: string; productName: string; quantity: number; unitPrice: number; total: number; remark: string; image?: string; }
interface Order { _id: string; customerName: string; items: OrderItem[]; totalAmount: number; paidAmount: number; dueAmount: number; status: string; createdBy: string; createdAt: string; }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Order form state
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Date filter
  const [filterDate, setFilterDate] = useState("");

  // View/Edit modals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewOrder, setViewOrder] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editOrder, setEditOrder] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Catalog modal state
  const [showCatalog, setShowCatalog] = useState(false);

  // Product detail popup state
  const [popupProduct, setPopupProduct] = useState<Product | null>(null);
  const [popupQty, setPopupQty] = useState(1);
  const [popupRate, setPopupRate] = useState(0);
  const [popupRemark, setPopupRemark] = useState("");

  const loadData = () => {
    Promise.all([
      fetch("/api/dashboard/orders").then((r) => r.json()),
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
      loadData();
    } catch { toast.error("আপডেট ব্যর্থ হয়েছে"); }
    finally { setSaving(false); }
  };

  const totalAmount = items.reduce((s, i) => s + i.total, 0);
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  // Open product detail popup
  const openProductPopup = (p: Product) => {
    const existing = items.find((i) => i.product === p._id);
    setPopupProduct(p);
    setPopupQty(existing ? existing.quantity : 1);
    setPopupRate(existing ? existing.unitPrice : p.sellPrice);
    setPopupRemark(existing ? existing.remark : "");
  };

  // Add product from popup
  const confirmProduct = () => {
    if (!popupProduct) return;
    if (popupQty < 1) { toast.error("পরিমাণ ১ এর কম হতে পারে না"); return; }
    const exists = items.findIndex((i) => i.product === popupProduct._id);
    if (exists >= 0) {
      setItems(items.map((item, idx) =>
        idx === exists
          ? { ...item, quantity: popupQty, unitPrice: popupRate, total: popupQty * popupRate, remark: popupRemark }
          : item
      ));
    } else {
      setItems([...items, {
        product: popupProduct._id,
        productName: popupProduct.name,
        quantity: popupQty,
        unitPrice: popupRate,
        total: popupQty * popupRate,
        remark: popupRemark,
        image: popupProduct.image,
      }]);
    }
    toast.success(`${popupProduct.name} যোগ হয়েছে`);
    setPopupProduct(null);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { toast.error("কাস্টমার নাম লিখুন"); return; }
    if (items.length === 0) { toast.error("কমপক্ষে একটি প্রডাক্ট যোগ করুন"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: selectedCustomer || undefined,
          customerName: customerName.trim(),
          items: items.map(({ product, productName, quantity, unitPrice, total, remark }) => ({ product, productName, quantity, unitPrice, total, remark })),
          totalAmount, paidAmount, dueAmount,
          status: dueAmount > 0 ? "pending" : "completed",
          note,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("অর্ডার সফলভাবে তৈরি হয়েছে");
      setShowForm(false);
      setItems([]); setPaidAmount(0); setNote(""); setCustomerName(""); setSelectedCustomer("");
      loadData();
    } catch { toast.error("অর্ডার তৈরিতে সমস্যা হয়েছে"); }
    finally { setSubmitting(false); }
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
                    <input type="number" value={popupRate} onChange={(e) => setPopupRate(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg text-sm outline-none"
                      style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>পরিমাণ ({popupProduct.unit})</label>
                    <input type="number" value={popupQty} onChange={(e) => setPopupQty(parseInt(e.target.value) || 1)} min={1}
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
                  <span className="text-[16px] font-bold" style={{ color: "#66a80f" }}>৳{popupQty * popupRate}</span>
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

  // ===================== VIEW ORDER MODAL =====================
  const renderViewModal = () => {
    if (!viewOrder) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="w-[95%] max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>অর্ডার বিবরণ</h3>
            <button onClick={() => setViewOrder(null)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div className="p-5">
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
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: viewOrder.status === "completed" ? "#f0fdf4" : "#fffbeb", color: viewOrder.status === "completed" ? "#16a34a" : "#d97706" }}>
                  {viewOrder.status === "completed" ? "সম্পন্ন" : "পেন্ডিং"}
                </span>
              </div>
              <div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>তৈরি করেছেন</p>
                <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{viewOrder.createdBy}</p>
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

            <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: "var(--bg-input)" }}>
              <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>মোট</span><b style={{ color: "var(--text-primary)" }}>৳{viewOrder.totalAmount}</b></div>
              <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>পরিশোধ</span><b style={{ color: "#16a34a" }}>৳{viewOrder.paidAmount}</b></div>
              <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>বাকি</span><b style={{ color: viewOrder.dueAmount > 0 ? "#dc2626" : "var(--text-primary)" }}>৳{viewOrder.dueAmount}</b></div>
            </div>
            {viewOrder.note && <p className="mt-3 text-[12px]" style={{ color: "var(--text-muted)" }}>নোট: {viewOrder.note}</p>}
          </div>
        </div>
      </div>
    );
  };

  // ===================== EDIT ORDER MODAL =====================
  const renderEditModal = () => {
    if (!editOrder) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="w-[95%] max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>অর্ডার সম্পাদনা</h3>
            <button onClick={() => setEditOrder(null)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div className="p-5">
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
                <select value={editOrder.status} onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value })}
                  className="w-full h-9 px-2 rounded-lg text-[13px] outline-none"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                  <option value="pending">পেন্ডিং</option>
                  <option value="completed">সম্পন্ন</option>
                  <option value="cancelled">বাতিল</option>
                </select>
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
          </div>
        </div>
      </div>
    );
  };

  // ===================== SUMMARY MODAL =====================
  const renderSummaryModal = () => {
    if (!showSummary) return null;

    // Aggregate products across all currently displayed orders
    const productMap: Record<string, { name: string; qty: number; total: number }> = {};
    let grandTotal = 0;
    let grandPaid = 0;
    let grandDue = 0;

    orders.forEach((o) => {
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="w-[95%] max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>দৈনিক সামারি</h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{dateLabel} &middot; {orders.length} অর্ডার</p>
            </div>
            <button onClick={() => setShowSummary(false)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>

          <div className="p-5">
            {/* Grand totals */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-input)" }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>মোট বিক্রি</p>
                <p className="text-[16px] font-bold" style={{ color: "#66a80f" }}>৳{grandTotal}</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-input)" }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>পরিশোধ</p>
                <p className="text-[16px] font-bold" style={{ color: "#16a34a" }}>৳{grandPaid}</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: grandDue > 0 ? "#fef2f2" : "var(--bg-input)" }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>বাকি</p>
                <p className="text-[16px] font-bold" style={{ color: grandDue > 0 ? "#dc2626" : "var(--text-primary)" }}>৳{grandDue}</p>
              </div>
            </div>

            {/* Product breakdown */}
            <h4 className="text-[12px] font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>পণ্য ভিত্তিক বিবরণ</h4>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
              <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-semibold" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                <span className="col-span-6">পণ্য</span>
                <span className="col-span-3 text-center">পরিমাণ</span>
                <span className="col-span-3 text-right">মোট</span>
              </div>
              {productList.length === 0 ? (
                <div className="py-6 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>কোনো পণ্য নেই</div>
              ) : (
                productList.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 px-3 py-2.5 items-center" style={{ borderTop: "1px solid var(--border-color)" }}>
                    <span className="col-span-6 text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                    <span className="col-span-3 text-center text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>{p.qty} পিছ</span>
                    <span className="col-span-3 text-right text-[13px] font-bold" style={{ color: "#66a80f" }}>৳{p.total}</span>
                  </div>
                ))
              )}
              {/* Footer total */}
              {productList.length > 0 && (
                <div className="grid grid-cols-12 px-3 py-2.5 items-center" style={{ borderTop: "2px solid var(--border-color)", background: "var(--bg-input)" }}>
                  <span className="col-span-6 text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>সর্বমোট</span>
                  <span className="col-span-3 text-center text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>{productList.reduce((s, p) => s + p.qty, 0)} পিছ</span>
                  <span className="col-span-3 text-right text-[13px] font-bold" style={{ color: "#66a80f" }}>৳{grandTotal}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===================== MAIN ORDER PAGE =====================
  // Group orders by date
  const grouped: Record<string, Order[]> = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(o);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>অর্ডার সমূহ</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-white cursor-pointer"
          style={{ background: "#66a80f" }}>
          <Plus size={16} /> নতুন অর্ডার
        </button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: "var(--text-muted)" }} />
          <input type="date" value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); fetchOrders(e.target.value); }}
            className="h-9 px-3 rounded-lg text-[13px] outline-none"
            style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
        </div>
        {filterDate && (
          <button onClick={() => { setFilterDate(""); fetchOrders(""); }}
            className="h-9 px-3 rounded-lg text-[12px] font-medium cursor-pointer"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
            সব দেখুন
          </button>
        )}
        <button onClick={() => setShowSummary(true)}
          className="h-9 px-3 rounded-lg text-[12px] font-medium cursor-pointer flex items-center gap-1.5"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }}>
          <BarChart3 size={14} style={{ color: "#66a80f" }} /> সামারি
        </button>
        <span className="text-[12px] ml-auto" style={{ color: "var(--text-muted)" }}>{orders.length} অর্ডার</span>
      </div>

      {showForm && (
        <div className="rounded-xl p-5 mb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>কাস্টমার</label>
                <select value={selectedCustomer}
                  onChange={(e) => { setSelectedCustomer(e.target.value); const c = customers.find((x) => x._id === e.target.value); if (c) setCustomerName(c.name); }}
                  className={inputStyle}
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                  <option value="">নতুন কাস্টমার</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>কাস্টমার নাম</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="কাস্টমার নাম"
                  className={inputStyle}
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>
            </div>

            {/* Product picker button */}
            <div className="mb-4">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>পণ্য নির্বাচন</label>
              <button type="button" onClick={() => setShowCatalog(true)}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-3 cursor-pointer transition-colors duration-150 text-sm font-medium"
                style={{ background: "var(--bg-input)", border: "2px dashed var(--border-color)", color: "var(--text-secondary)" }}>
                <ShoppingBag size={18} style={{ color: "#66a80f" }} />
                পণ্য ক্যাটালগ থেকে নির্বাচন করুন
                {items.length > 0 && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full text-white font-bold" style={{ background: "#66a80f" }}>{items.length}</span>
                )}
              </button>
            </div>

            {/* Items summary */}
            {items.length > 0 && (
              <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "var(--bg-input)" }}>
                  <span className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>নির্বাচিত পণ্য ({items.length})</span>
                  <span className="text-[13px] font-bold" style={{ color: "#66a80f" }}>৳{totalAmount}</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--bg-input)" }}>
                      {item.image ? (
                        <Image src={item.image} alt={item.productName} width={48} height={48} className="w-full h-full" style={{ objectFit: "contain" }} unoptimized />
                      ) : (
                        <Package size={18} style={{ color: "var(--border-color)" }} strokeWidth={1} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.productName}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {item.quantity} x ৳{item.unitPrice} = <b style={{ color: "var(--text-primary)" }}>৳{item.total}</b>
                        {item.remark && <span className="ml-2" style={{ color: "var(--text-muted)" }}>&middot; {item.remark}</span>}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="cursor-pointer shrink-0" style={{ color: "#dc2626" }}>
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>মোট</label>
                <div className="h-10 px-3 flex items-center rounded-lg text-sm font-bold"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                  ৳{totalAmount}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>পরিশোধ</label>
                <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className={inputStyle} min={0}
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>বাকি</label>
                <div className="h-10 px-3 flex items-center rounded-lg text-sm font-bold"
                  style={{ background: dueAmount > 0 ? "#fef2f2" : "var(--bg-input)", color: dueAmount > 0 ? "#dc2626" : "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                  ৳{dueAmount}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>নোট</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="অতিরিক্ত তথ্য"
                className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>

            <button type="submit" disabled={submitting}
              className="h-10 px-6 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
              style={{ background: "#66a80f" }}>
              {submitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার সংরক্ষণ"}
            </button>
          </form>
        </div>
      )}

      {/* Orders List grouped by date */}
      {orders.length === 0 ? (
        <div className="rounded-xl py-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>কোনো অর্ডার নেই</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dateLabel, dateOrders]) => (
          <div key={dateLabel} className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Calendar size={13} style={{ color: "var(--text-muted)" }} />
              <span className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>{dateLabel}</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>({dateOrders.length})</span>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              {dateOrders.map((order, idx) => (
                <div key={order._id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: idx > 0 ? "1px solid var(--border-color)" : "none" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{order.customerName}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: order.status === "completed" ? "#f0fdf4" : order.status === "cancelled" ? "#fef2f2" : "#fffbeb", color: order.status === "completed" ? "#16a34a" : order.status === "cancelled" ? "#dc2626" : "#d97706" }}>
                        {order.status === "completed" ? "সম্পন্ন" : order.status === "cancelled" ? "বাতিল" : "পেন্ডিং"}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {order.items.length} পণ্য &middot; মোট: <b style={{ color: "var(--text-primary)" }}>৳{order.totalAmount}</b>
                      {order.dueAmount > 0 && <span style={{ color: "#dc2626" }}> &middot; বাকি: ৳{order.dueAmount}</span>}
                      {" "}&middot; {new Date(order.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setViewOrder(order)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }} title="দেখুন">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => setEditOrder(JSON.parse(JSON.stringify(order)))} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }} title="সম্পাদনা">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {renderViewModal()}
      {renderEditModal()}
      {renderSummaryModal()}
    </div>
  );
}
