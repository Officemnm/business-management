"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  DollarSign,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";

interface Customer {
  _id: string;
  shopName: string;
  customerName: string;
  mobile: string;
  address: string;
  photo: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
}

interface OrderItem {
  lineId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remark: string;
}

interface NewOrderCreationProps {
  onBack: () => void;
}

type Step = "customer" | "products" | "confirm";

function makeLineId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function NewOrderCreation({ onBack }: NewOrderCreationProps) {
  const [width, setWidth] = useState<number>(() => (typeof window !== "undefined" ? window.innerWidth : 1280));
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const isMobile = width < 768;

  const [step, setStep] = useState<Step>("customer");
  const [showItems, setShowItems] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [loading, setLoading] = useState({ customers: true, products: true });
  const [submitting, setSubmitting] = useState(false);

  // Modal states (e-commerce style add-to-cart popup)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalUnitPrice, setModalUnitPrice] = useState<number>(0);
  const [modalRemark, setModalRemark] = useState("");

  useEffect(() => {
    if (!isMobile) setShowItems(true);
  }, [isMobile]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();
        if (data.customers) setCustomers(data.customers);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setLoading(prev => ({ ...prev, customers: false }));
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.products) setProducts(data.products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
      }
    };
    fetchProducts();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = searchCustomer.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => {
      return (
        c.shopName.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.mobile.includes(searchCustomer.trim())
      );
    });
  }, [customers, searchCustomer]);

  const filteredProducts = useMemo(() => {
    const q = searchProduct.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, searchProduct]);

  const totalUnits = useMemo(() => orderItems.reduce((sum, it) => sum + it.quantity, 0), [orderItems]);
  const totalOrderAmount = useMemo(() => orderItems.reduce((sum, it) => sum + it.totalPrice, 0), [orderItems]);

  const openProductModal = (product: Product) => {
    setModalProduct(product);
    setModalQuantity(1);
    setModalUnitPrice(product.price);
    setModalRemark("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalProduct(null);
  };

  const addProductFromModal = () => {
    if (!modalProduct) return;

    const qty = Math.max(1, Math.floor(modalQuantity));
    const unitPrice = Math.max(0, Number.isFinite(modalUnitPrice) ? modalUnitPrice : modalProduct.price);
    const remark = (modalRemark || "").trim();

    const next: OrderItem = {
      lineId: makeLineId(),
      productId: modalProduct._id,
      productName: modalProduct.name,
      productImage: modalProduct.imageUrl,
      quantity: qty,
      unitPrice,
      totalPrice: qty * unitPrice,
      remark,
    };

    setOrderItems(items => [...items, next]);
    closeModal();
  };

  const removeLine = (lineId: string) => setOrderItems(items => items.filter(i => i.lineId !== lineId));

  const goBack = () => {
    if (step === "confirm") return setStep("products");
    if (step === "products") return setStep("customer");
    onBack();
  };

  const handleSubmitOrder = async () => {
    if (!selectedCustomer) {
      alert("দয়া করে একজন গ্রাহক নির্বাচন করুন।");
      return;
    }
    if (orderItems.length === 0) {
      alert("অর্ডারে অন্তত একটি পণ্য যোগ করুন।");
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.customerName,
        shopName: selectedCustomer.shopName,
        items: orderItems.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          remark: it.remark,
        })),
        totalAmount: totalOrderAmount,
        status: "pending",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        alert("অর্ডার সফলভাবে তৈরি হয়েছে!");
        setStep("customer");
        setSelectedCustomer(null);
        setOrderItems([]);
      } else {
        const error = await res.json().catch(() => null);
        alert(`অর্ডার তৈরি ব্যর্থ: ${error?.error || "অজানা ত্রুটি"}`);
      }
    } catch (error) {
      console.error("Order submission error:", error);
      alert("নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        paddingBottom: isMobile ? "calc(120px + env(safe-area-inset-bottom))" : 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <motion.button
          whileHover={{ scale: 1.08, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "rgba(139,58,90,0.08)",
            border: "none",
            cursor: "pointer",
            color: "#8b3a5a",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} />
        </motion.button>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(124,58,237,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShoppingBag size={22} color="#7c3aed" />
        </div>

        <div style={{ flex: 1 }}>
          {step === "customer" && (
            <>
              <h2 style={{ fontSize: "1.10rem", fontWeight: 700, color: "#1a0f14", margin: 0 }}>নতুন অর্ডার তৈরি</h2>
              <p style={{ fontSize: "0.72rem", color: "#8a7078", marginTop: 2 }}>প্রথমে কাস্টমার নির্বাচন করুন</p>
            </>
          )}
          {step === "products" && (
            <>
              <h2 style={{ fontSize: "1.10rem", fontWeight: 700, color: "#1a0f14", margin: 0 }}>পণ্য যোগ করুন</h2>
              <p style={{ fontSize: "0.72rem", color: "#8a7078", marginTop: 2 }}>প্রডাক্টে ক্লিক করে পপআপ থেকে দাম/কন্টিটি/রিমার্ক দিন</p>
            </>
          )}
          {step === "confirm" && (
            <>
              <h2 style={{ fontSize: "1.10rem", fontWeight: 700, color: "#1a0f14", margin: 0 }}>অর্ডার কনফার্ম</h2>
              <p style={{ fontSize: "0.72rem", color: "#8a7078", marginTop: 2 }}>টোটাল টাকা ও বিল সামারি দেখুন</p>
            </>
          )}
        </div>
      </div>

      {/* Step 1: Customer */}
      {step === "customer" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(255,253,251,0.97)",
            borderRadius: 12,
            border: "1px solid rgba(235,220,225,0.80)",
            boxShadow: "0 2px 12px rgba(26,15,20,0.05)",
            padding: 20,
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <User size={16} color="#8b3a5a" />
            <h3 style={{ fontSize: "0.90rem", fontWeight: 600, color: "#1a0f14", margin: 0 }}>কাস্টমার/দোকান নির্বাচন</h3>
          </div>

          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search
              size={14}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a7078" }}
            />
            <input
              type="text"
              placeholder="কাস্টমার/দোকানের নাম বা মোবাইল সার্চ করুন..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 10px 10px 34px",
                borderRadius: 8,
                border: "1px solid rgba(139,58,90,0.15)",
                background: "#fff",
                fontSize: "0.78rem",
                color: "#1a0f14",
              }}
            />
          </div>

          {loading.customers ? (
            <div style={{ textAlign: "center", padding: 20, color: "#8a7078", fontSize: "0.78rem" }}>লোড হচ্ছে...</div>
          ) : (
            <div style={{ maxHeight: 330, overflowY: "auto", paddingRight: 4 }}>
              {filteredCustomers.map(customer => (
                <motion.div
                  key={customer._id}
                  whileHover={{ backgroundColor: "rgba(139,58,90,0.04)" }}
                  onClick={() => setSelectedCustomer(customer)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    marginBottom: 6,
                    border: selectedCustomer?._id === customer._id ? "1px solid #7c3aed" : "1px solid rgba(139,58,90,0.08)",
                    background: selectedCustomer?._id === customer._id ? "rgba(124,58,237,0.06)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(139,58,90,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <User size={14} color="#8b3a5a" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a0f14" }}>{customer.shopName}</div>
                      <div style={{ fontSize: "0.70rem", color: "#8a7078" }}>
                        {customer.customerName} • {customer.mobile}
                      </div>
                    </div>
                    {selectedCustomer?._id === customer._id && <Check size={14} color="#7c3aed" />}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {selectedCustomer && (
            <div style={{ marginTop: 12, padding: 14, borderRadius: 8, background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <div style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}>নির্বাচিত কাস্টমার</div>
              <div style={{ fontSize: "0.85rem", color: "#1a0f14", fontWeight: 600 }}>{selectedCustomer.shopName}</div>
              <div style={{ fontSize: "0.75rem", color: "#3d2e35" }}>
                {selectedCustomer.customerName} • {selectedCustomer.address}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              type="button"
              disabled={!selectedCustomer}
              onClick={() => setStep("products")}
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 10,
                border: "none",
                background: !selectedCustomer ? "rgba(124,58,237,0.35)" : "linear-gradient(135deg,#7c3aed,#d4899f)",
                cursor: !selectedCustomer ? "not-allowed" : "pointer",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 950,
                boxShadow: !selectedCustomer ? "none" : "0 10px 24px rgba(124,58,237,0.18)",
              }}
            >
              কাস্টমার কনফার্ম করে পণ্য যোগ করুন
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Products + popup add */}
      {step === "products" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "rgba(255,253,251,0.97)",
              borderRadius: 12,
              border: "1px solid rgba(235,220,225,0.80)",
              boxShadow: "0 2px 12px rgba(26,15,20,0.05)",
              padding: 20,
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Package size={16} color="#d97706" />
              <h3 style={{ fontSize: "0.90rem", fontWeight: 600, color: "#1a0f14", margin: 0 }}>আপলোড করা পণ্য</h3>
            </div>

            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search
                size={14}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a7078" }}
              />
              <input
                type="text"
                placeholder="পণ্যের নাম/ক্যাটাগরি সার্চ করুন..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 34px",
                  borderRadius: 8,
                  border: "1px solid rgba(139,58,90,0.15)",
                  background: "#fff",
                  fontSize: "0.78rem",
                  color: "#1a0f14",
                }}
              />
            </div>

            {loading.products ? (
              <div style={{ textAlign: "center", padding: 20, color: "#8a7078", fontSize: "0.78rem" }}>লোড হচ্ছে...</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 12,
                  maxHeight: isMobile ? "none" : 420,
                  overflowY: isMobile ? "visible" : "auto",
                  paddingRight: isMobile ? 0 : 4,
                  paddingBottom: isMobile ? 140 : 0, // space so last row isn't hidden under bottom action bar
                }}
              >
                {filteredProducts.map(product => (
                  <motion.button
                    key={product._id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => openProductModal(product)}
                    style={{
                      background: "rgba(255,253,251,0.98)",
                      borderRadius: 14,
                      padding: "14px 12px",
                      border: "1px solid rgba(139,58,90,0.12)",
                      boxShadow: "0 6px 18px rgba(26,15,20,0.05)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: 10,
                      minHeight: 180,
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? 66 : 62,
                        height: isMobile ? 66 : 62,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#f5f5f5",
                        flexShrink: 0,
                      }}
                    >
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,58,90,0.08)" }}>
                          <Package size={20} color="#8b3a5a" />
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1a0f14", lineHeight: 1.2 }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#8a7078" }}>{product.category}</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669" }}>
                      ৳ {product.price.toLocaleString("bn-BD")}
                    </div>
                    <div style={{ fontSize: "0.66rem", color: "#8a7078", fontWeight: 900, marginTop: 4 }}>
                      ট্যাপ করে যোগ করুন
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: "rgba(255,253,251,0.97)",
              borderRadius: 12,
              border: "1px solid rgba(235,220,225,0.80)",
              boxShadow: "0 2px 12px rgba(26,15,20,0.05)",
              padding: 20,
              width: isMobile ? "100%" : 360,
              position: isMobile ? "relative" : "sticky",
              top: isMobile ? undefined : 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <ShoppingBag size={16} color="#059669" />
              <h3 style={{ fontSize: "0.90rem", fontWeight: 600, color: "#1a0f14", margin: 0 }}>অর্ডার সামারি</h3>
              <span style={{ fontSize: "0.70rem", color: "#8a7078", marginLeft: "auto" }}>ইউনিট: {totalUnits}</span>
            </div>

            {orderItems.length === 0 ? (
              <div style={{ padding: "10px 0", color: "#8a7078", fontSize: "0.78rem" }}>এখনো কোনো পণ্য যোগ করা হয়নি।</div>
            ) : (
              <>
                {(!isMobile || showItems) && (
                  <div
                    style={{
                      maxHeight: isMobile ? 240 : 360,
                      overflowY: "auto",
                      paddingRight: 4,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {orderItems.map(item => (
                      <div
                        key={item.lineId}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          border: "1px solid rgba(139,58,90,0.12)",
                          background: "rgba(139,58,90,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: "#f5f5f5", flexShrink: 0 }}>
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,58,90,0.08)" }}>
                                <Package size={16} color="#8b3a5a" />
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1a0f14", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.productName}
                            </div>
                            <div style={{ fontSize: "0.70rem", color: "#8a7078" }}>
                              Qty {item.quantity} • ইউনিট ৳ {item.unitPrice.toLocaleString("bn-BD")}
                            </div>
                            {item.remark && <div style={{ fontSize: "0.70rem", color: "#7c3aed", marginTop: 4, fontWeight: 700 }}>রিমার্ক: {item.remark}</div>}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeLine(item.lineId)}
                            disabled={submitting}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              border: "1px solid rgba(220,38,38,0.20)",
                              background: "rgba(220,38,38,0.04)",
                              cursor: submitting ? "not-allowed" : "pointer",
                              color: "#dc2626",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                            aria-label="সরান"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div style={{ textAlign: "right", marginTop: 10 }}>
                          <div style={{ fontSize: "0.70rem", color: "#8a7078", marginBottom: 4, fontWeight: 700 }}>লাইন টোটাল</div>
                          <div style={{ fontSize: "1.05rem", fontWeight: 950, color: "#059669" }}>৳ {item.totalPrice.toLocaleString("bn-BD")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mobile toggle */}
                {isMobile && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowItems(v => !v)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(139,58,90,0.18)",
                        background: "#fff",
                        cursor: "pointer",
                        color: "#8b3a5a",
                        fontSize: "0.82rem",
                        fontWeight: 900,
                      }}
                    >
                      {showItems ? "আইটেম লিস্ট গুটিয়ে নিন" : "আইটেম লিস্ট দেখুন"}
                    </button>
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(139,58,90,0.10)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <DollarSign size={16} color="#8b3a5a" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.70rem", color: "#8a7078", fontWeight: 700 }}>মোট পরিমাণ</div>
                  <div style={{ fontSize: "1.10rem", color: "#1a0f14", fontWeight: 950 }}>৳ {totalOrderAmount.toLocaleString("bn-BD")}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setOrderItems([])}
                  disabled={submitting || orderItems.length === 0}
                  style={{
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(139,58,90,0.18)",
                    background: orderItems.length === 0 ? "rgba(139,58,90,0.03)" : "#fff",
                    cursor: submitting || orderItems.length === 0 ? "not-allowed" : "pointer",
                    color: "#8b3a5a",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    width: isMobile ? "100%" : undefined,
                  }}
                >
                  পণ্য পরিষ্কার
                </button>

                {!isMobile && (
                  <button
                    type="button"
                    onClick={() => setStep("confirm")}
                    disabled={!selectedCustomer || orderItems.length === 0}
                    style={{
                      flex: 1,
                      minWidth: 160,
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: !selectedCustomer || orderItems.length === 0 ? "rgba(124,58,237,0.35)" : "linear-gradient(135deg,#7c3aed,#d4899f)",
                      cursor: submitting || !selectedCustomer || orderItems.length === 0 ? "not-allowed" : "pointer",
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: 950,
                      boxShadow: "0 10px 24px rgba(124,58,237,0.18)",
                      width: isMobile ? "100%" : undefined,
                    }}
                  >
                    অর্ডার কনফার্মে যান
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile bottom action bar (Step 2) */}
      {isMobile && step === "products" && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,253,251,0.98)",
            borderTop: "1px solid rgba(139,58,90,0.12)",
            padding: "10px 12px calc(12px + env(safe-area-inset-bottom))",
            zIndex: 90,
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.66rem", color: "#8a7078", fontWeight: 800 }}>মোট টাকা</div>
              <div style={{ fontSize: "1.02rem", color: "#1a0f14", fontWeight: 1000, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                ৳ {totalOrderAmount.toLocaleString("bn-BD")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={!selectedCustomer || orderItems.length === 0 || submitting}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                background: !selectedCustomer || orderItems.length === 0 || submitting ? "rgba(124,58,237,0.35)" : "linear-gradient(135deg,#7c3aed,#d4899f)",
                cursor: !selectedCustomer || orderItems.length === 0 || submitting ? "not-allowed" : "pointer",
                color: "#fff",
                fontSize: "0.92rem",
                fontWeight: 1000,
                boxShadow: "0 10px 24px rgba(124,58,237,0.18)",
              }}
            >
              অর্ডার কনফার্ম
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm bill */}
      {step === "confirm" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(255,253,251,0.97)",
            borderRadius: 12,
            border: "1px solid rgba(235,220,225,0.80)",
            boxShadow: "0 2px 12px rgba(26,15,20,0.05)",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <ShoppingBag size={16} color="#059669" />
            <h3 style={{ fontSize: "0.90rem", fontWeight: 600, color: "#1a0f14", margin: 0 }}>বিল সামারি</h3>
            <span style={{ fontSize: "0.70rem", color: "#8a7078", marginLeft: "auto" }}>ইউনিট: {totalUnits}</span>
          </div>

          {selectedCustomer && (
            <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, border: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.05)" }}>
              <div style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: 700, marginBottom: 4 }}>কাস্টমার</div>
              <div style={{ fontSize: "0.92rem", color: "#1a0f14", fontWeight: 950 }}>{selectedCustomer.shopName}</div>
              <div style={{ fontSize: "0.75rem", color: "#3d2e35", marginTop: 4 }}>
                {selectedCustomer.customerName} • {selectedCustomer.mobile}
              </div>
            </div>
          )}

          {!isMobile ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(139,58,90,0.06)" }}>
                    {["পণ্য", "Qty", "ইউনিট প্রাইস", "রিমার্ক", "লাইন টোটাল"].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontSize: "0.63rem",
                          color: "#8a7078",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map(it => (
                    <tr key={it.lineId} style={{ borderBottom: "1px solid rgba(139,58,90,0.04)" }}>
                      <td style={{ padding: "11px 12px", fontSize: "0.78rem", color: "#1a0f14", fontWeight: 700 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, overflow: "hidden", background: "#f5f5f5" }}>
                            {it.productImage ? (
                              <img src={it.productImage} alt={it.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,58,90,0.08)" }}>
                                <Package size={16} color="#8b3a5a" />
                              </div>
                            )}
                          </div>
                          <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.productName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: "0.78rem", color: "#1a0f14", fontWeight: 800 }}>{it.quantity}</td>
                      <td style={{ padding: "11px 12px", fontSize: "0.78rem", color: "#3d2e35" }}>৳ {it.unitPrice.toLocaleString("bn-BD")}</td>
                      <td style={{ padding: "11px 12px", fontSize: "0.78rem", color: "#7c3aed", fontWeight: 700 }}>
                        {it.remark ? it.remark : <span style={{ color: "#8a7078", fontWeight: 600 }}>—</span>}
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: "0.86rem", color: "#059669", fontWeight: 950 }}>৳ {it.totalPrice.toLocaleString("bn-BD")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orderItems.map(it => (
                <div
                  key={it.lineId}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid rgba(139,58,90,0.12)",
                    background: "rgba(139,58,90,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", background: "#f5f5f5", flexShrink: 0 }}>
                      {it.productImage ? (
                        <img src={it.productImage} alt={it.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,58,90,0.08)" }}>
                          <Package size={18} color="#8b3a5a" />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.86rem", fontWeight: 900, color: "#1a0f14", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {it.productName}
                      </div>
                      <div style={{ fontSize: "0.70rem", color: "#8a7078", marginTop: 2, fontWeight: 700 }}>
                        Qty {it.quantity} • ইউনিট ৳ {it.unitPrice.toLocaleString("bn-BD")}
                      </div>
                      {it.remark ? (
                        <div style={{ fontSize: "0.70rem", color: "#7c3aed", fontWeight: 800, marginTop: 4 }}>রিমার্ক: {it.remark}</div>
                      ) : (
                        <div style={{ fontSize: "0.70rem", color: "#8a7078", fontWeight: 700, marginTop: 4 }}>রিমার্ক: —</div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.70rem", color: "#8a7078", fontWeight: 700 }}>লাইন টোটাল</div>
                      <div style={{ fontSize: "0.98rem", fontWeight: 1000, color: "#059669" }}>৳ {it.totalPrice.toLocaleString("bn-BD")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(139,58,90,0.10)", display: "flex", alignItems: "center", gap: 12 }}>
            <DollarSign size={16} color="#8b3a5a" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.70rem", color: "#8a7078", fontWeight: 700 }}>মোট টাকা</div>
              <div style={{ fontSize: "1.30rem", color: "#1a0f14", fontWeight: 1000 }}>৳ {totalOrderAmount.toLocaleString("bn-BD")}</div>
            </div>
            {!isMobile && (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || orderItems.length === 0 || !selectedCustomer}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: submitting || orderItems.length === 0 || !selectedCustomer ? "rgba(124,58,237,0.35)" : "linear-gradient(135deg,#7c3aed,#d4899f)",
                  cursor: submitting || orderItems.length === 0 || !selectedCustomer ? "not-allowed" : "pointer",
                  color: "#fff",
                  fontSize: "0.90rem",
                  fontWeight: 1000,
                  boxShadow: "0 10px 24px rgba(124,58,237,0.18)",
                  minWidth: 200,
                  width: isMobile ? "100%" : undefined,
                }}
              >
                {submitting ? "অর্ডার তৈরি হচ্ছে..." : "অর্ডার কনফার্ম"}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Mobile bottom action bar (Step 3) */}
      {isMobile && step === "confirm" && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,253,251,0.98)",
            borderTop: "1px solid rgba(139,58,90,0.12)",
            padding: "10px 12px 12px",
            zIndex: 90,
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.66rem", color: "#8a7078", fontWeight: 800 }}>মোট টাকা</div>
              <div style={{ fontSize: "1.02rem", color: "#1a0f14", fontWeight: 1000, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                ৳ {totalOrderAmount.toLocaleString("bn-BD")}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={submitting || orderItems.length === 0 || !selectedCustomer}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                background: submitting || orderItems.length === 0 || !selectedCustomer ? "rgba(124,58,237,0.35)" : "linear-gradient(135deg,#7c3aed,#d4899f)",
                cursor: submitting || orderItems.length === 0 || !selectedCustomer ? "not-allowed" : "pointer",
                color: "#fff",
                fontSize: "0.92rem",
                fontWeight: 1000,
                boxShadow: "0 10px 24px rgba(124,58,237,0.18)",
                minWidth: 160,
              }}
            >
              {submitting ? "অর্ডার তৈরি হচ্ছে..." : "অর্ডার কনফার্ম"}
            </button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {modalOpen && modalProduct && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26,15,20,0.45)",
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: isMobile ? "center" : "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: isMobile ? "100%" : "min(680px, 100%)",
              background: "rgba(255,253,251,0.99)",
              borderRadius: isMobile ? "16px 16px 0 0" : 14,
              border: "1px solid rgba(235,220,225,0.80)",
              boxShadow: "0 30px 90px rgba(26,15,20,0.24)",
              padding: isMobile ? 16 : 18,
              maxHeight: isMobile ? "85vh" : "90vh",
              overflowY: "auto",
              marginBottom: isMobile ? "env(safe-area-inset-bottom)" : undefined,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: isMobile ? 52 : 58, height: isMobile ? 52 : 58, borderRadius: 12, overflow: "hidden", background: "#f5f5f5" }}>
                {modalProduct.imageUrl ? (
                  <img src={modalProduct.imageUrl} alt={modalProduct.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,58,90,0.08)" }}>
                    <Package size={22} color="#8b3a5a" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 1000, color: "#1a0f14", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{modalProduct.name}</div>
                <div style={{ fontSize: "0.74rem", color: "#8a7078" }}>{modalProduct.category}</div>
                <div style={{ fontSize: "0.86rem", color: "#059669", fontWeight: 1000, marginTop: 6 }}>
                  ডিফল্ট দাম: ৳ {modalProduct.price.toLocaleString("bn-BD")}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid rgba(139,58,90,0.18)",
                  background: "#fff",
                  cursor: "pointer",
                  color: "#8b3a5a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 16 }}>
              <div>
                <div style={{ fontSize: "0.70rem", color: "#8a7078", marginBottom: 6, fontWeight: 800 }}>কন্টিটি</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(q => Math.max(1, Math.floor(q - 1)))}
                    style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(139,58,90,0.18)", background: "#fff", cursor: "pointer", color: "#8b3a5a", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="কমান"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={modalQuantity}
                    onChange={(e) => setModalQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    style={{ flex: 1, padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(139,58,90,0.18)", background: "#fff", fontSize: "0.92rem", color: "#1a0f14" }}
                  />

                  <button
                    type="button"
                    onClick={() => setModalQuantity(q => Math.max(1, Math.floor(q + 1)))}
                    style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(139,58,90,0.18)", background: "#fff", cursor: "pointer", color: "#8b3a5a", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="বাড়ান"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.70rem", color: "#8a7078", marginBottom: 6, fontWeight: 800 }}>দাম (ইউনিট)</div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={modalUnitPrice}
                  onChange={(e) => setModalUnitPrice(Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(139,58,90,0.18)", background: "#fff", fontSize: "0.92rem", color: "#1a0f14" }}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: "0.70rem", color: "#8a7078", marginBottom: 6, fontWeight: 800 }}>রিমার্ক</div>
              <textarea
                value={modalRemark}
                onChange={(e) => setModalRemark(e.target.value)}
                placeholder="যেমন: ডেলিভারি নির্দেশনা / পণ্যের ভ্যারিয়েন্ট..."
                rows={isMobile ? 4 : 3}
                style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(139,58,90,0.18)", background: "#fff", fontSize: "0.86rem", color: "#1a0f14", resize: "vertical" }}
              />
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(139,58,90,0.10)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.70rem", color: "#8a7078", fontWeight: 800 }}>লাইন টোটাল</div>
                <div style={{ fontSize: "1.18rem", color: "#059669", fontWeight: 1000 }}>
                  ৳ {(Math.max(1, Math.floor(modalQuantity)) * Math.max(0, modalUnitPrice)).toLocaleString("bn-BD")}
                </div>
              </div>

              <button
                type="button"
                onClick={addProductFromModal}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#7c3aed,#d4899f)",
                  cursor: "pointer",
                  color: "#fff",
                  fontSize: "0.90rem",
                  fontWeight: 1000,
                  boxShadow: "0 10px 24px rgba(124,58,237,0.18)",
                  minWidth: isMobile ? undefined : 180,
                  width: isMobile ? "100%" : undefined,
                }}
              >
                সাবমিট করে যোগ করুন
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

