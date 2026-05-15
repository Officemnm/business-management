const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/orders/page.tsx', 'utf8');

// We will use the exact same imports and structure, but strip out the list and edit features.
let addPageCode = code.replace(/export default function OrdersPage\(\) \{/g, "import { useRouter } from 'next/navigation';\nexport default function AddOrderPage() {\n  const router = useRouter();");

// Replace the return statement to just return the form
const returnMatch = addPageCode.match(/return \(\s*<div className=\"pb-12 space-y-6 max-w-\[1400px\] mx-auto font-sans\">/);
if (returnMatch) {
  const startIndex = returnMatch.index;
  // We want to replace everything from the return statement down to the end of the file
  addPageCode = addPageCode.substring(0, startIndex) + `
  // ===================== NEW ORDER PAGE =====================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // If showCatalog is true, render catalog view
  if (showCatalog) {
    const currentCartCount = items.length;
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center gap-3 h-14 px-4 shrink-0" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}>
          <button onClick={() => setShowCatalog(false)} className="cursor-pointer flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-[15px] font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
            পণ্য নির্বাচন করুন
          </h2>
          {currentCartCount > 0 && (
            <button onClick={() => setShowCatalog(false)} className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white cursor-pointer" style={{ background: "#66a80f" }}>
              <ShoppingBag size={14} /> সম্পন্ন ({currentCartCount})
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Package size={40} style={{ color: "var(--text-muted)" }} strokeWidth={1} />
              <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>কোনো পণ্য নেই</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {products.map((p) => (
                <div key={p._id} onClick={() => openProductPopup(p)} className="rounded-xl overflow-hidden cursor-pointer transition-shadow duration-200 relative" style={{ background: "var(--bg-card)", border: isInCart(p._id) ? "2px solid #66a80f" : "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  {isInCart(p._id) && (
                    <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#66a80f" }}>
                      <Check size={14} color="#fff" strokeWidth={2.5} />
                    </div>
                  )}
                  <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ background: "var(--bg-input)" }}>
                    {p.image ? (
                      <Image src={p.image} alt={p.name} width={400} height={400} className="w-full h-auto" style={{ objectFit: "contain", maxHeight: "200px" }} unoptimized />
                    ) : (
                      <div className="flex items-center justify-center py-10 w-full"><Package size={36} style={{ color: "var(--border-color)" }} strokeWidth={1} /></div>
                    )}
                    <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: p.stock > 0 ? "#f0fdf4" : "#fef2f2", color: p.stock > 0 ? "#16a34a" : "#dc2626" }}>
                      {p.stock > 0 ? \`স্টক: \${p.stock}\` : "স্টক নেই"}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-1"><Tag size={10} style={{ color: "var(--text-muted)" }} /><span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{p.category}</span></div>
                    <h3 className="text-[13px] font-semibold leading-snug mb-1.5 line-clamp-2" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
                    <span className="text-[15px] font-bold" style={{ color: "#66a80f" }}>৳{p.sellPrice}</span>
                    <span className="text-[11px] ml-1" style={{ color: "var(--text-muted)" }}>/{p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="shrink-0 px-4 py-3 flex items-center justify-between" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-color)" }}>
            <div><span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{items.length} পণ্য নির্বাচিত</span><span className="text-[15px] font-bold ml-3" style={{ color: "#66a80f" }}>৳{items.reduce((s, i) => s + i.total, 0)}</span></div>
            <button onClick={() => setShowCatalog(false)} className="h-10 px-5 rounded-lg text-[13px] font-semibold text-white cursor-pointer" style={{ background: "#66a80f" }}>অর্ডারে ফিরুন</button>
          </div>
        )}
        {popupProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="w-[90%] max-w-md rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)" }}>
              <div className="relative w-full flex items-center justify-center" style={{ background: "var(--bg-input)" }}>
                {popupProduct.image ? <Image src={popupProduct.image} alt={popupProduct.name} width={400} height={400} className="w-full h-auto" style={{ objectFit: "contain", maxHeight: "250px" }} unoptimized /> : <div className="flex items-center justify-center py-14 w-full"><Package size={48} style={{ color: "var(--border-color)" }} strokeWidth={1} /></div>}
                <button onClick={() => setPopupProduct(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}><X size={16} /></button>
              </div>
              <div className="p-5">
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>{popupProduct.name}</h3>
                <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>{popupProduct.category} &middot; স্টক: {popupProduct.stock} {popupProduct.unit}</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>রেট (প্রতি {popupProduct.unit})</label>
                    <input type="number" value={popupRate} onChange={(e) => setPopupRate(e.target.value === "" ? "" : Number(e.target.value))} onFocus={(e) => e.target.select()} className="w-full h-10 px-3 rounded-lg text-sm outline-none" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>পরিমাণ ({popupProduct.unit})</label>
                    <input type="number" value={popupQty} onChange={(e) => setPopupQty(e.target.value === "" ? "" : Number(e.target.value))} onFocus={(e) => e.target.select()} className="w-full h-10 px-3 rounded-lg text-sm outline-none" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>রিমার্ক</label>
                  <input value={popupRemark} onChange={(e) => setPopupRemark(e.target.value)} placeholder="অতিরিক্ত তথ্য (ঐচ্ছিক)" className="w-full h-10 px-3 rounded-lg text-sm outline-none" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} />
                </div>
                <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-lg" style={{ background: "var(--bg-input)" }}>
                  <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>মোট</span>
                  <span className="text-[16px] font-bold" style={{ color: "#66a80f" }}>৳{(Number(popupQty) || 0) * (Number(popupRate) || 0)}</span>
                </div>
                <button onClick={confirmProduct} className="w-full h-11 rounded-lg text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2" style={{ background: "#66a80f" }}>
                  {isInCart(popupProduct._id) ? "আপডেট করুন" : "যোগ করুন"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
          <div
            className="flex flex-col min-h-screen bg-slate-50/50"
          >
              <div
                className="flex items-center gap-4 h-[72px] px-4 lg:px-8 shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10"
              >
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/orders')}
                  className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:bg-slate-100 bg-slate-50 border border-slate-200/60 text-slate-600"
                >
                  <ArrowLeft size={20} strokeWidth={2} />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[18px] md:text-[20px] font-bold tracking-tight text-slate-900 truncate">
                    নতুন অর্ডার তৈরি করুন
                  </h2>
                  <p className="text-[12px] md:text-[13px] font-medium text-slate-500 mt-0.5">
                    {items.length > 0 ? \`\${items.length} টি পণ্য · ৳\${totalAmount.toLocaleString("en-US")}\` : "কাস্টমার ও পণ্য নির্বাচন করুন"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || items.length === 0 || !customerName.trim()}
                  className="hidden sm:flex items-center gap-2 h-11 px-6 rounded-xl text-[14px] font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(16,185,129,0.4)] bg-emerald-500 active:scale-95"
                >
                  <Check size={18} strokeWidth={2.5} />
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার সংরক্ষণ"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6 pb-24 sm:pb-8">
                  {/* Customer Section */}
                  <div className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
                        <User size={18} strokeWidth={2.2} className="text-indigo-600" />
                      </div>
                      <h3 className="text-[16px] font-bold text-slate-900">কাস্টমার তথ্য</h3>
                      {selectedCustomer && (
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full ml-auto bg-emerald-50 text-emerald-600 border border-emerald-100">
                          সেভড কাস্টমার
                        </span>
                      )}
                      {!selectedCustomer && customerName && (
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full ml-auto bg-amber-50 text-amber-600 border border-amber-100">
                          ইনস্ট্যান্ট
                        </span>
                      )}
                    </div>

                    <div className="relative mb-5">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerPicker(true); }}
                        onFocus={() => setShowCustomerPicker(true)}
                        placeholder="কাস্টমার খুঁজুন (নাম অথবা ফোন)"
                        className="w-full h-12 pl-11 pr-4 rounded-[14px] text-[14px] font-medium outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                      {selectedCustomer && (
                        <button
                          type="button"
                          onClick={() => { setSelectedCustomer(""); setCustomerName(""); setCustomerSearch(""); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}

                      <AnimatePresence>
                        {showCustomerPicker && customerSearch && !selectedCustomer && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-2 rounded-[16px] overflow-hidden z-20 max-h-72 overflow-y-auto bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] custom-scrollbar"
                          >
                            {(() => {
                              const filtered = customers.filter((c) =>
                                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                c.phone.includes(customerSearch)
                              ).slice(0, 8);
                              return filtered.length > 0 ? (
                                filtered.map((c) => (
                                  <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomer(c._id);
                                      setCustomerName(c.name);
                                      setCustomerPhone(c.phone);
                                      setCustomerAddressInput(c.address || "");
                                      setCustomerSearch(\`\${c.name} — \${c.phone}\`);
                                      setShowCustomerPicker(false);
                                      setSaveAsNewCustomer(false);
                                    }}
                                    className="w-full flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                                  >
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold bg-slate-100 text-slate-700">
                                      {c.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[14px] font-bold truncate text-slate-900">{c.name}</p>
                                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">{c.phone}</p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-5">
                                  <div className="text-[13px] font-medium mb-4 text-slate-500 text-center">
                                    &ldquo;{customerSearch}&rdquo; খুঁজে পাওয়া যায়নি
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomerName(customerSearch);
                                      setCustomerPhone("");
                                      setCustomerAddressInput("");
                                      setSelectedCustomer("");
                                      setSaveAsNewCustomer(true);
                                      setShowCustomerPicker(false);
                                    }}
                                    className="w-full h-11 rounded-[12px] text-[13px] font-bold text-white cursor-pointer flex items-center justify-center gap-2 transition-all hover:shadow-md bg-indigo-500 hover:bg-indigo-600"
                                  >
                                    <UserPlus size={16} strokeWidth={2.2} />
                                    নতুন কাস্টমার তৈরি করুন
                                  </button>
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">নাম <span className="text-rose-500">*</span></label>
                        <input
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="কাস্টমার নাম"
                          className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                          মোবাইল {saveAsNewCustomer && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          disabled={!!selectedCustomer}
                          className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">ঠিকানা (ঐচ্ছিক)</label>
                      <input
                        value={customerAddressInput}
                        onChange={(e) => setCustomerAddressInput(e.target.value)}
                        placeholder="ঠিকানা"
                        disabled={!!selectedCustomer}
                        className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 disabled:bg-slate-100"
                      />
                    </div>

                    {!selectedCustomer && customerName && (
                      <label className="flex items-start gap-3 mt-5 p-4 rounded-[14px] cursor-pointer transition-colors bg-indigo-50 hover:bg-indigo-100/50 border border-indigo-100">
                        <div className="relative flex items-center justify-center w-5 h-5 mt-0.5">
                          <input
                            type="checkbox"
                            checked={saveAsNewCustomer}
                            onChange={(e) => setSaveAsNewCustomer(e.target.checked)}
                            className="peer relative appearance-none w-5 h-5 border border-indigo-300 rounded-md bg-white checked:bg-indigo-500 checked:border-indigo-500 cursor-pointer transition-all"
                          />
                          <Check size={14} strokeWidth={3} className="text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-bold text-indigo-900 flex items-center gap-1.5">
                            <Sparkles size={14} strokeWidth={2.2} className="text-indigo-600" /> কাস্টমার লিস্টে সেভ করুন
                          </p>
                          <p className="text-[12px] font-medium text-indigo-700/80 mt-1">
                            পরবর্তী অর্ডারে সহজে খুঁজে পাবেন (মোবাইল নম্বর দেওয়া বাধ্যতামূলক)
                          </p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Products Section */}
                  <div className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100">
                        <ShoppingBag size={18} strokeWidth={2.2} className="text-emerald-600" />
                      </div>
                      <h3 className="text-[16px] font-bold text-slate-900">পণ্য তালিকা</h3>
                      {items.length > 0 && (
                        <span className="text-[12px] font-bold px-3 py-1 rounded-full ml-auto bg-slate-900 text-white shadow-sm">
                          {items.length} টি · ৳{totalAmount.toLocaleString("en-US")}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      <button
                        type="button"
                        onClick={() => setShowCatalog(true)}
                        className="h-12 rounded-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-md text-[14px] font-bold bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <ShoppingBag size={16} strokeWidth={2.2} />
                        ক্যাটালগ থেকে বাছাই
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualProduct(true)}
                        className="h-12 rounded-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all text-[14px] font-bold bg-white text-slate-700 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      >
                        <Edit3 size={16} strokeWidth={2.2} />
                        ম্যানুয়ালি পণ্য যোগ
                      </button>
                    </div>

                    {items.length > 0 && (
                      <div className="rounded-[16px] overflow-hidden mt-4 border border-slate-200/60 bg-slate-50/50">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 px-4 py-3.5 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-slate-50 border border-slate-100">
                              {item.image ? (
                                <Image src={item.image} alt={item.productName} width={48} height={48} className="w-full h-full object-contain p-1" unoptimized />
                              ) : (
                                <Package size={20} className="text-slate-300" strokeWidth={1.5} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-slate-900 truncate">{item.productName}</p>
                              <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                                {item.quantity} × ৳{item.unitPrice.toLocaleString("en-US")}
                                {item.remark && <span className="ml-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">· {item.remark}</span>}
                              </p>
                            </div>
                            <p className="text-[15px] font-black text-slate-900 tabular-nums shrink-0">
                              ৳{item.total.toLocaleString("en-US")}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer shrink-0 transition-colors bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100/50 ml-2"
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Section */}
                  <div className="rounded-[24px] p-6 sm:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
                        <CreditCard size={18} strokeWidth={2.2} className="text-blue-600" />
                      </div>
                      <h3 className="text-[16px] font-bold text-slate-900">পেমেন্ট</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                      <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">মোট বিল</label>
                        <div className="text-[20px] font-black text-slate-900 tabular-nums">
                          ৳{totalAmount.toLocaleString("en-US")}
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">পরিশোধ <span className="text-emerald-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                          <input
                            type="number"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-full h-14 pl-8 pr-4 rounded-[16px] text-[18px] font-black outline-none bg-emerald-50/50 text-emerald-700 border border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all tabular-nums"
                            min={0}
                          />
                        </div>
                      </div>
                      <div className={\`p-4 rounded-[16px] border \${dueAmount > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100"}\`}>
                        <label className={\`block text-[11px] font-bold uppercase tracking-wider mb-2 \${dueAmount > 0 ? "text-rose-500" : "text-slate-500"}\`}>বাকি</label>
                        <div className={\`text-[20px] font-black tabular-nums \${dueAmount > 0 ? "text-rose-600" : "text-slate-900"}\`}>
                          ৳{dueAmount.toLocaleString("en-US")}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2">অতিরিক্ত নোট (ঐচ্ছিক)</label>
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="অর্ডারের বিবরণ বা কোনো নোট"
                        className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/60 z-20 pb-safe">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || items.length === 0 || !customerName.trim()}
                  className="w-full h-14 rounded-full text-[15px] font-bold text-white cursor-pointer disabled:opacity-50 disabled:scale-100 transition-all hover:shadow-lg flex items-center justify-center gap-2 bg-emerald-500 active:scale-[0.98]"
                >
                  <Check size={20} strokeWidth={2.5} />
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার নিশ্চিত করুন"}
                </button>
              </div>

      <AnimatedModal open={showManualProduct} onClose={() => setShowManualProduct(false)} title="ম্যানুয়ালি পণ্য যোগ" maxWidth="max-w-md">
        <div className="flex items-center gap-2 mb-5 p-3.5 rounded-[14px] bg-amber-50 border border-amber-100">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-white shadow-sm shrink-0">
            <Edit3 size={16} strokeWidth={2.2} className="text-amber-600" />
          </div>
          <p className="text-[12px] font-bold text-amber-800 leading-snug">
            ক্যাটালগে না থাকা পণ্য ম্যানুয়ালি যোগ করুন
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">পণ্যের নাম <span className="text-rose-500">*</span></label>
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="পণ্যের নাম লিখুন"
              autoFocus
              className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">পরিমাণ <span className="text-rose-500">*</span></label>
              <input
                type="number"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                min={1}
                className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">দর <span className="text-rose-500">*</span></label>
              <input
                type="number"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value === "" ? "" : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                placeholder="০"
                min={0}
                className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">রিমার্ক (ঐচ্ছিক)</label>
            <input
              value={manualRemark}
              onChange={(e) => setManualRemark(e.target.value)}
              placeholder="অতিরিক্ত তথ্য"
              className="w-full h-11 px-4 rounded-[12px] text-[14px] outline-none bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50 border border-slate-100 mt-2">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">মোট</span>
            <span className="text-[20px] font-black text-emerald-600 tabular-nums leading-none">
              ৳{((Number(manualQty) || 0) * (Number(manualRate) || 0)).toLocaleString("en-US")}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowManualProduct(false)}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold cursor-pointer transition-colors bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={addManualProduct}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold text-white cursor-pointer transition-all shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_-3px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 bg-emerald-500 active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              যোগ করুন
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
\`;
}

// Modify handleSubmit to push to router instead of closing form
addPageCode = addPageCode.replace(/setShowForm\(false\);\n\s*resetOrderForm\(\);\n\s*\/\/\s*Reload customers if new one created/g, "router.push('/dashboard/orders');\\n      // Reload customers if new one created");
addPageCode = addPageCode.replace(/fetchOrders\(filterDate\);/g, "");

fs.writeFileSync('src/app/dashboard/orders/add/page.tsx', addPageCode);
console.log('Successfully created src/app/dashboard/orders/add/page.tsx');
