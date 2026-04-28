"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  UserPlus, Trash2, X, User, Phone, MapPin, Store, Camera,
  CheckCircle, AlertCircle, Search, Edit3, ArrowLeft, ChevronLeft, ChevronRight
} from "lucide-react";

interface CustomerRecord {
  _id: string;
  shopName: string;
  customerName: string;
  address: string;
  mobile: string;
  photo: string;
  createdAt: string;
}

const emptyForm = { shopName: "", customerName: "", address: "", mobile: "", photo: "" };

function resizeImage(file: File, maxW = 300, maxH = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        if (h > maxH) { w = (w * maxH) / h; h = maxH; }
        c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CustomerManagement({ onBack }: { onBack: () => void }) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErr, setFormErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const PER_PAGE = 10;

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500);
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const q = searchQ ? `?search=${encodeURIComponent(searchQ)}` : "";
    const res = await fetch(`/api/customers${q}`);
    if (res.ok) { const d = await res.json(); setCustomers(d.customers); }
    setLoading(false);
  }, [searchQ]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setFormErr(""); setShowModal(true); };
  const openEdit = (c: CustomerRecord) => {
    setEditingId(c._id);
    setForm({ shopName: c.shopName, customerName: c.customerName, address: c.address, mobile: c.mobile, photo: c.photo });
    setFormErr(""); setShowModal(true);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setFormErr("ছবি ৫MB এর কম হতে হবে।"); return; }
    try { const b64 = await resizeImage(f); setForm(p => ({ ...p, photo: b64 })); } catch { setFormErr("ছবি লোড করা যায়নি।"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr("");
    if (!form.shopName || !form.customerName || !form.address || !form.mobile) { setFormErr("সব ঘর পূরণ করুন।"); return; }
    setSubmitting(true);
    const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json(); setSubmitting(false);
    if (!res.ok) { setFormErr(data.error); return; }
    setShowModal(false); setForm(emptyForm); setPage(1); fetchCustomers();
    showToast(editingId ? "গ্রাহক আপডেট হয়েছে!" : "গ্রাহক সফলভাবে যোগ হয়েছে!", true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" মুছে ফেলবেন?`)) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    fetchCustomers(); showToast(`"${name}" মুছে ফেলা হয়েছে।`, true);
  };

  const totalPages = Math.max(1, Math.ceil(customers.length / PER_PAGE));
  const paged = customers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px 10px 34px", border: "1.5px solid rgba(139,58,90,0.18)",
    borderRadius: 8, fontSize: "0.82rem", color: "#1a0f14", outline: "none",
    background: "#fdf8f9", boxSizing: "border-box", transition: "border-color 0.2s",
    fontFamily: "inherit",
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
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a0f14", margin: 0 }}>গ্রাহক ব্যবস্থাপনা</h2>
          <p style={{ fontSize: "0.72rem", color: "#8a7078", marginTop: 3 }}>মোট গ্রাহক: {customers.length} জন</p>
        </div>
        {/* Search */}
        <div style={{ position: "relative", width: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8a7078" }} />
          <input placeholder="খুঁজুন..." value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 30, width: 220, background: "rgba(255,253,251,0.97)" }} />
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#059669,#34d399)",
            color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: "0.82rem",
            fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(5,150,105,0.30)", flexShrink: 0 }}>
          <UserPlus size={15} /> নতুন গ্রাহক
        </motion.button>
      </div>

      {/* Customer List */}
      <div style={{ background: "rgba(255,253,251,0.97)", borderRadius: 12, border: "1px solid rgba(235,220,225,0.80)",
        boxShadow: "0 2px 12px rgba(26,15,20,0.05)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8a7078", fontSize: "0.82rem" }}>লোড হচ্ছে...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: 50, textAlign: "center" }}>
            <User size={36} color="#d4899f" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#8a7078", fontSize: "0.85rem" }}>এখনো কোনো গ্রাহক নেই।</p>
            <p style={{ color: "#b8a8ae", fontSize: "0.72rem" }}>উপরের &quot;নতুন গ্রাহক&quot; বাটনে ক্লিক করে গ্রাহক যোগ করুন।</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(139,58,90,0.08)", background: "rgba(139,58,90,0.03)" }}>
                    {["ছবি", "দোকানের নাম", "গ্রাহকের নাম", "ঠিকানা", "মোবাইল", "তারিখ", "অ্যাকশন"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.63rem",
                        color: "#8a7078", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c, i) => (
                    <motion.tr key={c._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }} whileHover={{ backgroundColor: "rgba(139,58,90,0.025)" }}
                      style={{ borderBottom: "1px solid rgba(139,58,90,0.04)" }}>
                      <td style={{ padding: "10px 14px" }}>
                        {c.photo ? (
                          <img src={c.photo} alt={c.customerName}
                            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(5,150,105,0.2)" }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(5,150,105,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <User size={18} color="#059669" />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "0.80rem", color: "#1a0f14", fontWeight: 600 }}>{c.shopName}</td>
                      <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: "#3d2e35" }}>{c.customerName}</td>
                      <td style={{ padding: "10px 14px", fontSize: "0.74rem", color: "#8a7078", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address}</td>
                      <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: "#059669", fontWeight: 600 }}>{c.mobile}</td>
                      <td style={{ padding: "10px 14px", fontSize: "0.72rem", color: "#8a7078" }}>{new Date(c.createdAt).toLocaleDateString("bn-BD")}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.10 }} whileTap={{ scale: 0.93 }} onClick={() => openEdit(c)}
                            style={{ background: "rgba(37,99,235,0.08)", border: "none", borderRadius: 8,
                              padding: "6px 8px", cursor: "pointer", color: "#2563eb", display: "flex" }}>
                            <Edit3 size={14} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.10 }} whileTap={{ scale: 0.93 }} onClick={() => handleDelete(c._id, c.customerName)}
                            style={{ background: "rgba(220,38,38,0.08)", border: "none", borderRadius: 8,
                              padding: "6px 8px", cursor: "pointer", color: "#dc2626", display: "flex" }}>
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 0",
                borderTop: "1px solid rgba(139,58,90,0.06)" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ background: "none", border: "none", cursor: page === 1 ? "default" : "pointer",
                    color: page === 1 ? "#ccc" : "#8b3a5a", display: "flex", padding: 4 }}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: "0.76rem", color: "#3d2e35" }}>পৃষ্ঠা {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ background: "none", border: "none", cursor: page === totalPages ? "default" : "pointer",
                    color: page === totalPages ? "#ccc" : "#8b3a5a", display: "flex", padding: 4 }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
                boxShadow: "0 20px 60px rgba(26,15,20,0.18), 0 4px 16px rgba(139,58,90,0.12)",
                margin: "auto", flexShrink: 0 }}>
              {/* Modal Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#059669,#34d399)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {editingId ? <Edit3 size={16} color="#fff" /> : <UserPlus size={16} color="#fff" />}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a0f14" }}>
                      {editingId ? "গ্রাহক সম্পাদনা" : "নতুন গ্রাহক"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#8a7078" }}>
                      {editingId ? "তথ্য আপডেট করুন" : "গ্রাহকের তথ্য দিন"}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a7078", display: "flex", padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {formErr && (
                  <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)",
                    borderRadius: 8, padding: "9px 12px", marginBottom: 16, fontSize: "0.76rem", color: "#dc2626", textAlign: "center" }}>
                    {formErr}
                  </div>
                )}

                {/* Photo Upload */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div onClick={() => fileRef.current?.click()}
                    style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto", cursor: "pointer",
                      border: "2.5px dashed rgba(5,150,105,0.3)", background: "rgba(5,150,105,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                      transition: "border-color 0.2s", position: "relative" }}>
                    {form.photo ? (
                      <img src={form.photo} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Camera size={28} color="#059669" style={{ opacity: 0.5 }} />
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
                  <p style={{ fontSize: "0.68rem", color: "#8a7078", marginTop: 6 }}>ছবি আপলোড করুন (ঐচ্ছিক)</p>
                  {form.photo && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, photo: "" }))}
                      style={{ fontSize: "0.68rem", color: "#dc2626", background: "none", border: "none", cursor: "pointer", marginTop: 2 }}>
                      ছবি মুছুন
                    </button>
                  )}
                </div>

                {/* Form Fields */}
                {[
                  { key: "shopName", label: "দোকানের নাম", placeholder: "যেমন: রূপচর্চা কর্নার", icon: Store },
                  { key: "customerName", label: "গ্রাহকের নাম", placeholder: "যেমন: রাহেলা বেগম", icon: User },
                  { key: "address", label: "ঠিকানা", placeholder: "যেমন: মিরপুর-১০, ঢাকা", icon: MapPin },
                  { key: "mobile", label: "মোবাইল নং", placeholder: "যেমন: ০১৭১২৩৪৫৬৭৮", icon: Phone },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#3d2e35", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <div style={{ position: "relative" }}>
                      <f.icon size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a7078" }} />
                      <input type="text" placeholder={f.placeholder}
                        value={form[f.key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "#059669")}
                        onBlur={e => (e.target.style.borderColor = "rgba(139,58,90,0.18)")} />
                    </div>
                  </div>
                ))}

                <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: "100%", padding: "12px", borderRadius: 10,
                    background: "linear-gradient(135deg,#059669,#34d399)", border: "none",
                    color: "#fff", fontSize: "0.86rem", fontWeight: 600, cursor: submitting ? "wait" : "pointer",
                    boxShadow: "0 4px 14px rgba(5,150,105,0.30)", opacity: submitting ? 0.75 : 1, fontFamily: "inherit" }}>
                  {submitting ? "সংরক্ষণ হচ্ছে..." : editingId ? "আপডেট করুন" : "গ্রাহক যোগ করুন"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
