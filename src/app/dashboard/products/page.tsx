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
    <div className="pb-10 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">সকল প্রডাক্ট</h1>
          <p className="text-[14px] font-medium text-slate-500 mt-1">মোট {totalProducts} টি প্রডাক্ট · {categories.length} টি ক্যাটাগরি</p>
        </div>
        <Link
          href="/dashboard/products/add"
          className="flex items-center gap-2 h-11 px-5 rounded-[14px] text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} /> নতুন প্রডাক্ট
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package size={60} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Package size={20} strokeWidth={2} />
            </div>
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">মোট প্রডাক্ট</p>
          </div>
          <p className="text-[32px] font-bold text-slate-900 leading-none tabular-nums tracking-tight">
            {totalProducts.toLocaleString("en-US")}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Boxes size={60} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Boxes size={20} strokeWidth={2} />
            </div>
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">মোট স্টক</p>
          </div>
          <p className="text-[32px] font-bold text-slate-900 leading-none tabular-nums tracking-tight">
            {totalStock.toLocaleString("en-US")}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-600">
            <TrendingUp size={60} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} strokeWidth={2} />
            </div>
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">ইনভেন্টরি মূল্য</p>
          </div>
          <p className="text-[32px] font-bold text-slate-900 leading-none tabular-nums tracking-tight">
            ৳{inventoryValue.toLocaleString("en-US")}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-rose-600">
            <AlertCircle size={60} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle size={20} strokeWidth={2} />
            </div>
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">স্টক নেই</p>
          </div>
          <p className="text-[32px] font-bold text-rose-600 leading-none tabular-nums tracking-tight">
            {outOfStock.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-[16px] p-4 flex flex-col sm:flex-row gap-3 shadow-sm border border-slate-200/60">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="প্রডাক্ট বা ক্যাটাগরি খুঁজুন..."
            className="w-full h-11 pl-11 pr-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setCategoryFilter("")}
              className={`h-11 px-4 rounded-[12px] text-[13px] font-bold transition-all border ${
                categoryFilter === "" 
                  ? "bg-slate-800 text-white border-slate-800 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              সব
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`h-11 px-4 rounded-[12px] text-[13px] font-bold transition-all border ${
                  categoryFilter === cat
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[16px] py-16 text-center border border-slate-200/60 shadow-sm">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-slate-50 border border-slate-100">
            <Package size={20} className="text-slate-400" />
          </div>
          <p className="text-[14px] font-medium text-slate-500">
            {search || categoryFilter ? "কোনো মিল পাওয়া যায়নি" : "কোনো প্রডাক্ট নেই"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-[16px] overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1 border border-slate-200/60 flex flex-col h-full"
            >
              {/* Image */}
              <div className="relative w-full pt-[75%] bg-slate-50 border-b border-slate-100 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <Package size={48} className="text-slate-200" strokeWidth={1} />
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-md ${
                    p.stock > 0 
                      ? "bg-emerald-500/90 text-white" 
                      : "bg-rose-500/90 text-white"
                  }`}>
                    {p.stock > 0 ? `স্টক: ${p.stock}` : "স্টক নেই"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag size={12} className="text-indigo-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                    {p.category}
                  </span>
                </div>
                
                <h3 className="text-[15px] font-bold text-slate-800 leading-snug mb-3 line-clamp-2">
                  {p.name}
                </h3>
                
                <div className="mt-auto">
                  <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[20px] font-bold text-slate-900 tabular-nums tracking-tight">
                        ৳{p.sellPrice}
                      </span>
                      <span className="text-[12px] font-medium text-slate-500">/{p.unit}</span>
                    </div>
                    {p.buyPrice > 0 && (
                      <span className="text-[12px] font-medium text-slate-400">
                        ক্রয়: ৳{p.buyPrice}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 h-10 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2 transition-all bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200"
                    >
                      <Pencil size={14} />
                      এডিট
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-all bg-white text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      <AnimatedModal open={!!editProduct} onClose={() => setEditProduct(null)} title="প্রডাক্ট সম্পাদনা" maxWidth="max-w-md">
        <div className="flex flex-col gap-4 p-1">
          {editProduct?.image && (
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-[16px] inline-block">
                <Image src={editProduct.image} alt={editProduct.name} width={100} height={100} className="object-contain" unoptimized />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">প্রডাক্টের নাম</label>
            <input 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" 
            />
          </div>
          
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">ক্যাটাগরি</label>
            <input 
              value={editCategory} 
              onChange={(e) => setEditCategory(e.target.value)} 
              className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">ক্রয় মূল্য (৳)</label>
              <input 
                type="number" 
                value={editBuyPrice} 
                onChange={(e) => setEditBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()} 
                min={0}
                className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-bold tabular-nums" 
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">বিক্রয় মূল্য (৳)</label>
              <input 
                type="number" 
                value={editSellPrice} 
                onChange={(e) => setEditSellPrice(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()} 
                min={0}
                className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-bold tabular-nums" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">বর্তমান স্টক</label>
              <input 
                type="number" 
                value={editStock} 
                onChange={(e) => setEditStock(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()} 
                className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-bold tabular-nums" 
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">পরিমাপের একক</label>
              <input 
                value={editUnit} 
                onChange={(e) => setEditUnit(e.target.value)} 
                className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium" 
                placeholder="যেমন: পিস, কেজি"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <button 
              onClick={handleEditSave} 
              disabled={editSaving}
              className="w-full h-12 rounded-[14px] text-[15px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
            >
              {editSaving ? "সংরক্ষণ হচ্ছে..." : "আপডেট করুন"}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
