"use client";

import { useEffect, useState } from "react";
import { Trash2, Package, Tag } from "lucide-react";
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

  const loadData = () => {
    fetch("/api/dashboard/products")
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("মুছে ফেলতে চান?")) return;
    await fetch(`/api/dashboard/products/${id}`, { method: "DELETE" });
    toast.success("প্রডাক্ট মুছে ফেলা হয়েছে");
    loadData();
  };

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

                {/* Delete */}
                <button
                  onClick={() => handleDelete(p._id)}
                  className="w-full h-8 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150"
                  style={{
                    background: "var(--bg-input)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Trash2 size={12} />
                  মুছুন
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
