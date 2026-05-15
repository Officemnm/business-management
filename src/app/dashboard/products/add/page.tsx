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

  const isProcessing = submitting || uploading;

  return (
    <div className="pb-10 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/dashboard/products"
          className="w-11 h-11 rounded-[14px] bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </Link>
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">নতুন প্রডাক্ট</h1>
          <p className="text-[13.5px] font-medium text-slate-500">আপনার শপে নতুন প্রডাক্ট যোগ করুন</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm border border-slate-200/60 relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image upload */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-3">প্রডাক্ট ছবি</label>
            {imagePreview ? (
              <div className="relative inline-block group">
                <div className="rounded-[16px] overflow-hidden border-2 border-indigo-100 shadow-sm transition-all" style={{ maxWidth: "240px" }}>
                  <Image
                    src={imagePreview}
                    alt="প্রিভিউ"
                    width={240}
                    height={240}
                    className="w-full h-auto aspect-square object-contain bg-slate-50 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 cursor-pointer shadow-md transition-colors z-10"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 py-10 rounded-[16px] cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/50 border-2 border-dashed border-slate-200 hover:border-indigo-300 group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                  <ImageIcon size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" strokeWidth={1.8} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-slate-700 group-hover:text-indigo-700 mb-0.5 transition-colors">
                    ছবি আপলোড করতে ক্লিক করুন
                  </p>
                  <p className="text-[12px] font-medium text-slate-400">
                    JPG, PNG, WEBP সাপোর্টেড
                  </p>
                </div>
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
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">প্রডাক্ট নাম <span className="text-rose-500">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="প্রডাক্টের নাম লিখুন"
              className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14.5px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ক্যাটেগরি</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ক্যাটেগরি লিখুন"
                className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14.5px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">একক</label>
              <div className="relative">
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
                  className="h-11 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Prices & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ক্রয় মূল্য</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="০"
                  className="w-full h-11 pl-8 pr-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14.5px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">বিক্রয় মূল্য <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="০"
                  className="w-full h-11 pl-8 pr-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14.5px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400/70 focus:text-indigo-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">স্টক</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="পরিমাণ লিখুন"
                className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14.5px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">বিবরণ (ঐচ্ছিক)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="পণ্য সম্পর্কে বিস্তারিত"
              className="w-full h-11 px-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[14.5px] text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
            <Link
              href="/dashboard/products"
              className="h-11 px-6 rounded-[12px] text-[13.5px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={isProcessing}
              className="h-11 px-8 rounded-[12px] text-[13.5px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {uploading ? "ছবি আপলোড হচ্ছে..." : "সংরক্ষণ হচ্ছে..."}
                </>
              ) : (
                <>
                  <Upload size={16} strokeWidth={2.5} />
                  প্রডাক্ট সংরক্ষণ করুন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
