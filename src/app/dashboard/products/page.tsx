"use client";

import { useEffect, useState } from "react";
import { Trash2, Package, Tag, Pencil, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

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

  const inputStyle = "w-full h-10 px-3 rounded-lg text-sm outline-none";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          সকল প্রডাক্ট ({products.length})
        </h2>
        <Link
          href="/dashboard/products/add"
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-white"
          style={{ background: "#66a80f" }}
        >
          + নতুন প্রডাক্ট
        </Link>
      </div>

      {products.length === 0 ? (
        <div
          className="rounded-xl py-16 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <Package size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} strokeWidth={1} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            কোনো প্রডাক্ট নেই
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p._id}
              className="rounded-xl overflow-hidden group transition-shadow duration-200"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {/* Image */}
              <div
                className="relative w-full flex items-center justify-center overflow-hidden"
                style={{ background: "var(--bg-input)" }}
              >
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    width={400}
                    height={400}
                    className="w-full h-auto"
                    style={{ objectFit: "contain", maxHeight: "220px" }}
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center py-12 w-full">
                    <Package size={40} style={{ color: "var(--border-color)" }} strokeWidth={1} />
                  </div>
                )}

                {/* Stock badge */}
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
              <div className="p-3">
                {/* Category */}
                <div className="flex items-center gap-1 mb-1.5">
                  <Tag size={10} style={{ color: "var(--text-muted)" }} />
                  <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {p.category}
                  </span>
                </div>

                {/* Name */}
                <h3
                  className="text-[14px] font-semibold leading-snug mb-2 line-clamp-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {p.name}
                </h3>

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[16px] font-bold" style={{ color: "#66a80f" }}>
                      ৳{p.sellPrice}
                    </span>
                    {p.buyPrice > 0 && (
                      <span className="text-[11px] ml-1.5 line-through" style={{ color: "var(--text-muted)" }}>
                        ৳{p.buyPrice}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    /{p.unit}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 h-8 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150"
                    style={{
                      background: "var(--bg-input)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <Pencil size={11} />
                    এডিট
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="h-8 px-3 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150"
                    style={{
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-[92%] max-w-md rounded-2xl max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}>
              <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>প্রডাক্ট সম্পাদনা</h3>
              <button onClick={() => setEditProduct(null)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {editProduct.image && (
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
          </div>
        </div>
      )}
    </div>
  );
}
