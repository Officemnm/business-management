"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Package, Pencil, Tag, Search, Boxes, TrendingUp, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import AnimatedModal from "@/components/ui/AnimatedModal";
import Link from "next/link";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  image?: string;
  description?: string;
  createdAt: string;
}

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Edit modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBuyPrice, setEditBuyPrice] = useState<number | string>(0);
  const [editSellPrice, setEditSellPrice] = useState<number | string>(0);
  const [editStock, setEditStock] = useState<number | string>(0);
  const [editUnit, setEditUnit] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const loadData = () => {
    fetch("/api/dashboard/products")
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setEditName(p.name);
    setEditCategory(p.category);
    setEditBuyPrice(p.buyPrice);
    setEditSellPrice(p.sellPrice);
    setEditStock(p.stock);
    setEditUnit(p.unit);
  };

  const handleEditSave = async () => {
    if (!editProduct) return;
    if (!editName.trim()) { toast.error("প্রডাক্টের নাম আবশ্যক"); return; }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/dashboard/products/${editProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          category: editCategory.trim(),
          buyPrice: Number(editBuyPrice) || 0,
          sellPrice: Number(editSellPrice) || 0,
          stock: Number(editStock) || 0,
          unit: editUnit.trim() || "পিস",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("প্রডাক্ট আপডেট হয়েছে");
      setEditProduct(null);
      loadData();
    } catch { toast.error("আপডেট ব্যর্থ"); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("মুছে ফেলতে চান?")) return;
    await fetch(`/api/dashboard/products/${id}`, { method: "DELETE" });
    toast.success("প্রডাক্ট মুছে ফেলা হয়েছে");
    loadData();
  };

  const inputStyle = "w-full h-10 px-3 rounded-lg text-[13px] outline-none transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: "#66a80f", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const inventoryValue = products.reduce((s, p) => s + p.stock * p.buyPrice, 0);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-8 space-y-5">
      {/* Page Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>সকল প্রডাক্ট</h1>
          <p className="text-[13px] font-medium mt-1" style={{ color: "#6b7280" }}>মোট {totalProducts} টি প্রডাক্ট · {categories.length} টি ক্যাটাগরি</p>
        </div>
        <Link
          href="/dashboard/products/add"
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all hover:shadow-sm"
          style={{ background: "#66a80f" }}
        >
          <Plus size={16} /> নতুন প্রডাক্ট
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট প্রডাক্ট</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
              <Package size={14} strokeWidth={2.2} style={{ color: "#66a80f" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {totalProducts.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>মোট স্টক</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <Boxes size={14} strokeWidth={2.2} style={{ color: "#374151" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {totalStock.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>ইনভেন্টরি মূল্য</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(102,168,15,0.1)" }}>
              <TrendingUp size={14} strokeWidth={2.2} style={{ color: "#66a80f" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            ৳{inventoryValue.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>স্টক নেই</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fef2f2" }}>
              <AlertCircle size={14} strokeWidth={2.2} style={{ color: "#dc2626" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold leading-none" style={{ color: "#111827", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {outOfStock.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="প্রডাক্ট বা ক্যাটাগরি খুঁজুন..."
            className="w-full h-10 pl-9 pr-3 rounded-lg text-[13px] font-medium outline-none"
            style={{ background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" }}
          />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter("")}
              className="h-10 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors"
              style={{
                background: categoryFilter === "" ? "#111827" : "#fafafa",
                color: categoryFilter === "" ? "#ffffff" : "#374151",
                border: "1px solid " + (categoryFilter === "" ? "#111827" : "#e5e7eb"),
              }}
            >
              সব
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="h-10 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors"
                style={{
                  background: categoryFilter === cat ? "#111827" : "#fafafa",
                  color: categoryFilter === cat ? "#ffffff" : "#374151",
                  border: "1px solid " + (categoryFilter === cat ? "#111827" : "#e5e7eb"),
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
            <Package size={20} strokeWidth={1.5} style={{ color: "#9ca3af" }} />
          </div>
          <p className="text-[13px] font-medium" style={{ color: "#6b7280" }}>
            {search || categoryFilter ? "কোনো মিল পাওয়া যায়নি" : "কোনো প্রডাক্ট নেই"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              className="rounded-2xl overflow-hidden group transition-all hover:shadow-sm"
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
              }}
            >
              {/* Image */}
              <div
                className="relative w-full flex items-center justify-center overflow-hidden"
                style={{ background: "#fafafa" }}
              >
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    width={400}
                    height={400}
                    className="w-full h-auto"
                    style={{ objectFit: "contain", maxHeight: "200px" }}
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center py-12 w-full">
                    <Package size={40} style={{ color: "#d1d5db" }} strokeWidth={1} />
                  </div>
                )}
                <span
                  className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: p.stock > 0 ? "#f0fdf4" : "#fef2f2",
                    color: p.stock > 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {p.stock > 0 ? `স্টক: ${p.stock}` : "স্টক নেই"}
                </span>
              </div>

              {/* Info */}
              <div className="p-3.5">
                <div className="flex items-center gap-1 mb-1.5">
                  <Tag size={10} style={{ color: "#9ca3af" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                    {p.category}
                  </span>
                </div>
                <h3
                  className="text-[14px] font-semibold leading-snug mb-2.5 line-clamp-2"
                  style={{ color: "#111827" }}
                >
                  {p.name}
                </h3>
                <div className="flex items-baseline justify-between mb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[18px] font-bold" style={{ color: "#111827", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                      ৳{p.sellPrice}
                    </span>
                    <span className="text-[11px]" style={{ color: "#9ca3af" }}>/{p.unit}</span>
                  </div>
                  {p.buyPrice > 0 && (
                    <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>
                      ক্রয়: ৳{p.buyPrice}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 h-9 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors hover:bg-gray-50"
                    style={{
                      background: "#ffffff",
                      color: "#374151",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <Pencil size={12} />
                    এডিট
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="h-9 px-3 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-red-100"
                    style={{
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      <AnimatedModal open={!!editProduct} onClose={() => setEditProduct(null)} title="প্রডাক্ট সম্পাদনা" maxWidth="max-w-md">
        <div className="flex flex-col gap-4">
          {editProduct?.image && (
            <div className="flex justify-center">
              <Image src={editProduct.image} alt={editProduct.name} width={120} height={120} className="rounded-lg" style={{ objectFit: "contain" }} unoptimized />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>নাম</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>ক্যাটাগরি</label>
            <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>ক্রয় মূল্য</label>
              <input type="number" value={editBuyPrice} onChange={(e) => setEditBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()} className={inputStyle} min={0}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>বিক্রয় মূল্য</label>
              <input type="number" value={editSellPrice} onChange={(e) => setEditSellPrice(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()} className={inputStyle} min={0}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>স্টক</label>
              <input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()} className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>ইউনিট</label>
              <input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className={inputStyle}
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
            </div>
          </div>
          <button onClick={handleEditSave} disabled={editSaving}
            className="w-full h-11 rounded-xl text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50"
            style={{ background: "#66a80f" }}>
            {editSaving ? "সংরক্ষণ হচ্ছে..." : "আপডেট করুন"}
          </button>
        </div>
      </AnimatedModal>
    </div>
  );
}
