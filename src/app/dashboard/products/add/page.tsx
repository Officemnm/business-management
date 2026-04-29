"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

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

  const inputStyle = "w-full h-10 px-3 rounded-lg text-sm outline-none";
  const isProcessing = submitting || uploading;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
        নতুন প্রডাক্ট
      </h2>
      <div
        className="rounded-xl p-5 max-w-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image upload */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              প্রডাক্ট ছবি
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border-color)", maxWidth: "240px" }}
                >
                  <Image
                    src={imagePreview}
                    alt="প্রিভিউ"
                    width={240}
                    height={240}
                    className="w-full h-auto"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "#dc2626", color: "#fff" }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer transition-colors duration-150"
                style={{
                  background: "var(--bg-input)",
                  border: "2px dashed var(--border-color)",
                }}
              >
                <ImageIcon size={28} style={{ color: "var(--text-muted)" }} strokeWidth={1.5} />
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  ছবি আপলোড করতে ক্লিক করুন
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-placeholder)" }}>
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

          <div className="md:col-span-2">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              প্রডাক্ট নাম
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="প্রডাক্ট নাম"
              className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              ক্যাটেগরি
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ক্যাটেগরি"
              className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              একক
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            >
              <option value="পিস">পিস</option>
              <option value="কেজি">কেজি</option>
              <option value="লিটার">লিটার</option>
              <option value="প্যাকেট">প্যাকেট</option>
              <option value="বক্স">বক্স</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              ক্রয় মূল্য
            </label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="০"
              className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              বিক্রয় মূল্য
            </label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="০"
              className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              স্টক
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="০"
              className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              বিবরণ
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="বিবরণ (ঐচ্ছিক)"
              className={inputStyle}
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="h-10 px-6 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50 flex items-center gap-2"
              style={{ background: "#66a80f" }}
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
