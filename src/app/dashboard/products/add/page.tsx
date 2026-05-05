"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ImageIcon, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import AnimatedDropdown from "@/components/ui/AnimatedDropdown";

export default function AddProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("পিস");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ছবি আপলোড করুন");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadImage = async (): Promise<{ url: string; publicId: string } | null> => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await fetch("/api/dashboard/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return { url: data.url, publicId: data.publicId };
    } catch {
      toast.error("ছবি আপলোড ব্যর্থ হয়েছে");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellPrice) {
      toast.error("নাম ও বিক্রয় মূল্য আবশ্যক");
      return;
    }

    setSubmitting(true);
    try {
      let imageData: { url: string; publicId: string } | null = null;
      if (imageFile) {
        imageData = await uploadImage();
        if (!imageData) { setSubmitting(false); return; }
      }

      const res = await fetch("/api/dashboard/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || "সাধারণ",
          buyPrice: Number(buyPrice) || 0,
          sellPrice: Number(sellPrice),
          stock: Number(stock) || 0,
          unit,
          description: description.trim(),
          image: imageData?.url || "",
          imagePublicId: imageData?.publicId || "",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("প্রডাক্ট যোগ হয়েছে");
      router.push("/dashboard/products");
    } catch {
      toast.error("সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = "w-full h-10 px-3 rounded-lg text-[13px] outline-none transition-colors";
  const isProcessing = submitting || uploading;
  const labelStyle = "block text-[11px] font-semibold uppercase tracking-wider mb-1.5";
  const inputStyleObj = { background: "#fafafa", color: "#111827", border: "1px solid #e5e7eb" };

  return (
    <div className="pb-8 space-y-5 max-w-3xl">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50"
          style={{ background: "#ffffff", color: "#374151", border: "1px solid #e5e7eb" }}
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div>
          <h1 className="text-[24px] sm:text-[26px] font-bold tracking-tight" style={{ color: "#111827", letterSpacing: "-0.02em" }}>নতুন প্রডাক্ট</h1>
          <p className="text-[12px] font-medium mt-0.5" style={{ color: "#6b7280" }}>নতুন প্রডাক্ট যোগ করুন</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl p-5 sm:p-6" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image upload */}
          <div>
            <label className={labelStyle} style={{ color: "#6b7280" }}>প্রডাক্ট ছবি</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #e5e7eb", maxWidth: "220px" }}
                >
                  <Image
                    src={imagePreview}
                    alt="প্রিভিউ"
                    width={220}
                    height={220}
                    className="w-full h-auto"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shadow-sm"
                  style={{ background: "#dc2626", color: "#fff" }}
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl cursor-pointer transition-colors hover:bg-gray-50"
                style={{
                  background: "#fafafa",
                  border: "2px dashed #e5e7eb",
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
                  <ImageIcon size={20} style={{ color: "#6b7280" }} strokeWidth={1.8} />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: "#374151" }}>
                  ছবি আপলোড করতে ক্লিক করুন
                </p>
                <p className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>
                  JPG, PNG, WEBP সাপোর্টেড
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div>
            <label className={labelStyle} style={{ color: "#6b7280" }}>প্রডাক্ট নাম *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="প্রডাক্ট নাম"
              className={inputStyle}
              style={inputStyleObj}
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle} style={{ color: "#6b7280" }}>ক্যাটেগরি</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ক্যাটেগরি"
                className={inputStyle}
                style={inputStyleObj}
              />
            </div>
            <div>
              <label className={labelStyle} style={{ color: "#6b7280" }}>একক</label>
              <AnimatedDropdown
                options={[
                  { value: "পিস", label: "পিস" },
                  { value: "কেজি", label: "কেজি" },
                  { value: "লিটার", label: "লিটার" },
                  { value: "প্যাকেট", label: "প্যাকেট" },
                  { value: "বক্স", label: "বক্স" },
                ]}
                value={unit}
                onChange={setUnit}
                className="h-10"
              />
            </div>
          </div>

          {/* Prices & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelStyle} style={{ color: "#6b7280" }}>ক্রয় মূল্য</label>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="০"
                className={inputStyle}
                style={inputStyleObj}
              />
            </div>
            <div>
              <label className={labelStyle} style={{ color: "#6b7280" }}>বিক্রয় মূল্য *</label>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="০"
                className={inputStyle}
                style={inputStyleObj}
              />
            </div>
            <div>
              <label className={labelStyle} style={{ color: "#6b7280" }}>স্টক</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="০"
                className={inputStyle}
                style={inputStyleObj}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelStyle} style={{ color: "#6b7280" }}>বিবরণ</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="বিবরণ (ঐচ্ছিক)"
              className={inputStyle}
              style={inputStyleObj}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid #f3f4f6" }}>
            <Link
              href="/dashboard/products"
              className="h-10 px-5 rounded-lg text-[13px] font-semibold flex items-center cursor-pointer transition-colors hover:bg-gray-50"
              style={{ background: "#ffffff", color: "#374151", border: "1px solid #e5e7eb", marginTop: "1rem" }}
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={isProcessing}
              className="h-10 px-6 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all hover:shadow-sm"
              style={{ background: "#66a80f", marginTop: "1rem" }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {uploading ? "ছবি আপলোড হচ্ছে..." : "সংরক্ষণ হচ্ছে..."}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  প্রডাক্ট সংরক্ষণ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
