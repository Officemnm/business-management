"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Trash2, X, Package, Camera, CheckCircle, AlertCircle,
  Search, Edit3, ArrowLeft, ChevronLeft, ChevronRight, Tag, Hash, FileText, Loader2
} from "lucide-react";

interface ProductRecord {
  _id: string; name: string; category: string; price: number;
  stock: number; description: string; imageUrl: string; imagePublicId: string;
  createdAt: string;
}

const emptyForm = { name: "", category: "", price: "", stock: "", description: "" };
const CATEGORIES = ["ফেস ক্রিম", "বডি লোশন", "সিরাম", "ফেস ওয়াশ", "সানস্ক্রিন", "শ্যাম্পু", "লিপস্টিক", "ফাউন্ডেশন", "অন্যান্য"];

export default function ProductManagement({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<string>(""); // base64 preview
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [existingPublicId, setExistingPublicId] = useState("");
  const [formErr, setFormErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const PER_PAGE = 10;

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const q = searchQ ? `?search=${encodeURIComponent(searchQ)}` : "";
    const res = await fetch(`/api/products${q}`);
    if (res.ok) { const d = await res.json(); setProducts(d.products); }
    setLoading(false);
  }, [searchQ]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => {
    setEditingId(null); setForm(emptyForm); setImageFile("");
    setExistingImageUrl(""); setExistingPublicId(""); setFormErr(""); setShowModal(true);
  };
  const openEdit = (p: ProductRecord) => {
    setEditingId(p._id);
    setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), description: p.description });
    setImageFile(""); setExistingImageUrl(p.imageUrl); setExistingPublicId(p.imagePublicId);
    setFormErr(""); setShowModal(true);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setFormErr("ছবি ৫MB এর কম হতে হবে।"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setImageFile(ev.target!.result as string); };
    reader.readAsDataURL(f);
  };

  const uploadToCloudinary = async (base64: string): Promise<{ url: string; publicId: string } | null> => {
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, folder: "products" }),
      });
      const data = await res.json();
      if (!res.ok) { setFormErr(data.error || "ছবি আপলোড ব্যর্থ।"); return null; }
      return { url: data.url, publicId: data.publicId };
    } catch { setFormErr("ছবি আপলোড ব্যর্থ।"); return null; }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr("");
    if (!form.name || !form.category || !form.price) { setFormErr("পণ্যের নাম, ক্যাটাগরি ও মূল্য দিন।"); return; }
    if (!imageFile && !existingImageUrl) { setFormErr("পণ্যের ছবি যোগ করুন।"); return; }

    setSubmitting(true);
    let imageUrl = existingImageUrl;
    let imagePublicId = existingPublicId;

    // Upload new image to Cloudinary if selected
    if (imageFile) {
      const result = await uploadToCloudinary(imageFile);
      if (!result) { setSubmitting(false); return; }
      imageUrl = result.url;
      imagePublicId = result.publicId;
    }

    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) || 0, imageUrl, imagePublicId }),
    });
    const data = await res.json(); setSubmitting(false);
    if (!res.ok) { setFormErr(data.error); return; }
    setShowModal(false); setForm(emptyForm); setImageFile(""); setPage(1); fetchProducts();
    showToast(editingId ? "পণ্য আপডেট হয়েছে!" : "পণ্য সফলভাবে যোগ হয়েছে!", true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" মুছে ফেলবেন?`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts(); showToast(`"${name}" মুছে ফেলা হয়েছে।`, true);
  };

  const totalPages = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const paged = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const previewImg = imageFile || existingImageUrl;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px 10px 34px", border: "1.5px solid rgba(139,58,90,0.18)",
    borderRadius: 8, fontSize: "0.82rem", color: "#1a0f14", outline: "none",
    background: "#fdf8f9", boxSizing: "border-box", transition: "border-color 0.2s", fontFamily: "inherit",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
            style={{ position: "fixed", top: 72, right: 20, zIndex: 200, display: "flex", alignItems: "center", gap: 8,
              background: toast.ok ? "#ecfdf5" : "#fef2f2", border: `1px solid ${toast.ok ? "#6ee7b7" : "#fca5a5"}`,
              color: toast.ok ? "#059669" : "#dc2626", padding: "10px 16px", borderRadius: 10,
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)", fontSize: "0.82rem" }}>
            {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <motion.button whileHover={{ scale: 1.08, x: -2 }} whileTap={{ scale: 0.95 }} onClick={onBack}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10,
            background: "rgba(139,58,90,0.08)", border: "none", cursor: "pointer", color: "#8b3a5a", flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </motion.button>
        <div style={{ flex: 1, minWidth: 150 }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a0f14", margin: 0 }}>পণ্য ব্যবস্থাপনা</h2>
          <p style={{ fontSize: "0.72rem", color: "#8a7078", marginTop: 3 }}>মোট পণ্য: {products.length} টি</p>
        </div>
        <div style={{ position: "relative", width: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8a7078" }} />
          <input placeholder="খুঁজুন..." value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 30, width: 220, background: "rgba(255,253,251,0.97)" }} />
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#d97706,#fbbf24)",
            color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: "0.82rem",
            fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(217,119,6,0.30)", flexShrink: 0 }}>
          <Plus size={15} /> নতুন পণ্য
        </motion.button>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#8a7078" }}>লোড হচ্ছে...</div>
      ) : products.length === 0 ? (
        <div style={{ padding: 50, textAlign: "center", background: "rgba(255,253,251,0.97)", borderRadius: 12,
          border: "1px solid rgba(235,220,225,0.80)" }}>
          <Package size={36} color="#d97706" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "#8a7078", fontSize: "0.85rem" }}>এখনো কোনো পণ্য নেই।</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
            {paged.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ background: "rgba(255,253,251,0.97)", borderRadius: 12, border: "1px solid rgba(235,220,225,0.80)",
                  boxShadow: "0 2px 12px rgba(26,15,20,0.05)", overflow: "hidden" }}>
                {/* Product Image */}
                <div style={{ height: 160, background: "#f5f0f2", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Package size={40} color="#d4899f" style={{ opacity: 0.4 }} />
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1a0f14", marginBottom: 4,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: "0.64rem", background: "rgba(217,119,6,0.1)", color: "#d97706",
                      padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>{p.category}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "#8b3a5a" }}>৳{p.price.toLocaleString("bn-BD")}</span>
                    <span style={{ fontSize: "0.70rem", color: p.stock > 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>
                      {p.stock > 0 ? `স্টক: ${p.stock}` : "স্টক শেষ"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => openEdit(p)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        background: "rgba(37,99,235,0.08)", border: "none", borderRadius: 8, padding: "7px 0",
                        cursor: "pointer", color: "#2563eb", fontSize: "0.72rem", fontWeight: 600 }}>
                      <Edit3 size={12} /> এডিট
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => handleDelete(p._id, p.name)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        background: "rgba(220,38,38,0.08)", border: "none", borderRadius: 8, padding: "7px 0",
                        cursor: "pointer", color: "#dc2626", fontSize: "0.72rem", fontWeight: 600 }}>
                      <Trash2 size={12} /> মুছুন
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 0" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "#ccc" : "#8b3a5a", display: "flex" }}>
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: "0.76rem", color: "#3d2e35" }}>পৃষ্ঠা {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: "none", border: "none", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? "#ccc" : "#8b3a5a", display: "flex" }}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(26,15,20,0.45)", backdropFilter: "blur(4px)", padding: "16px", overflowY: "auto" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "#fff", borderRadius: 16, padding: "24px 20px",
                width: "min(100%, 460px)", maxHeight: "calc(100vh - 32px)", overflowY: "auto",
                boxShadow: "0 20px 60px rgba(26,15,20,0.18)", margin: "auto", flexShrink: 0 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#d97706,#fbbf24)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {editingId ? <Edit3 size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a0f14" }}>
                      {editingId ? "পণ্য সম্পাদনা" : "নতুন পণ্য"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#8a7078" }}>
                      {editingId ? "তথ্য আপডেট করুন" : "পণ্যের তথ্য দিন"}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a7078", display: "flex" }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {formErr && (
                  <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)",
                    borderRadius: 8, padding: "9px 12px", marginBottom: 14, fontSize: "0.76rem", color: "#dc2626", textAlign: "center" }}>
                    {formErr}
                  </div>
                )}

                {/* Image Upload */}
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div onClick={() => fileRef.current?.click()}
                    style={{ width: 120, height: 120, borderRadius: 12, margin: "0 auto", cursor: "pointer",
                      border: "2.5px dashed rgba(217,119,6,0.3)", background: "rgba(217,119,6,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {previewImg ? (
                      <img src={previewImg} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <Camera size={28} color="#d97706" style={{ opacity: 0.5 }} />
                        <p style={{ fontSize: "0.62rem", color: "#8a7078", marginTop: 4 }}>ছবি যোগ করুন</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
                  {previewImg && (
                    <button type="button" onClick={() => { setImageFile(""); setExistingImageUrl(""); }}
                      style={{ fontSize: "0.68rem", color: "#dc2626", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>
                      ছবি মুছুন
                    </button>
                  )}
                </div>

                {/* Fields */}
                {[
                  { key: "name", label: "পণ্যের নাম", placeholder: "যেমন: রোজ ফেস ক্রিম", icon: Package, type: "text" },
                  { key: "price", label: "মূল্য (৳)", placeholder: "যেমন: 850", icon: Tag, type: "number" },
                  { key: "stock", label: "স্টক পরিমাণ", placeholder: "যেমন: 100", icon: Hash, type: "number" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#3d2e35", display: "block", marginBottom: 5 }}>{f.label}</label>
                    <div style={{ position: "relative" }}>
                      <f.icon size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a7078" }} />
                      <input type={f.type} placeholder={f.placeholder}
                        value={form[f.key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "#d97706")}
                        onBlur={e => (e.target.style.borderColor = "rgba(139,58,90,0.18)")} />
                    </div>
                  </div>
                ))}

                {/* Category */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#3d2e35", display: "block", marginBottom: 5 }}>ক্যাটাগরি</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => setForm(p => ({ ...p, category: c }))}
                        style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${form.category === c ? "#d97706" : "rgba(139,58,90,0.15)"}`,
                          background: form.category === c ? "rgba(217,119,6,0.1)" : "transparent", cursor: "pointer",
                          color: form.category === c ? "#d97706" : "#8a7078", fontSize: "0.72rem", fontWeight: 600,
                          transition: "all 0.2s", fontFamily: "inherit" }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#3d2e35", display: "block", marginBottom: 5 }}>বিবরণ (ঐচ্ছিক)</label>
                  <div style={{ position: "relative" }}>
                    <FileText size={14} style={{ position: "absolute", left: 12, top: 12, color: "#8a7078" }} />
                    <textarea placeholder="পণ্যের সংক্ষিপ্ত বিবরণ..." value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={2} style={{ ...inputStyle, resize: "vertical", paddingTop: 10 }}
                      onFocus={e => (e.target.style.borderColor = "#d97706")}
                      onBlur={e => (e.target.style.borderColor = "rgba(139,58,90,0.18)")} />
                  </div>
                </div>

                <motion.button type="submit" disabled={submitting || uploading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: "100%", padding: "12px", borderRadius: 10,
                    background: "linear-gradient(135deg,#d97706,#fbbf24)", border: "none",
                    color: "#fff", fontSize: "0.86rem", fontWeight: 600, cursor: (submitting || uploading) ? "wait" : "pointer",
                    boxShadow: "0 4px 14px rgba(217,119,6,0.30)", opacity: (submitting || uploading) ? 0.75 : 1,
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {(submitting || uploading) && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                  {uploading ? "ছবি আপলোড হচ্ছে..." : submitting ? "সংরক্ষণ হচ্ছে..." : editingId ? "আপডেট করুন" : "পণ্য যোগ করুন"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
