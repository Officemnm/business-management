const fs = require('fs');

const filePath = 'src/app/dashboard/products/page.tsx';
let data = fs.readFileSync(filePath, 'utf8');

const oldGrid = `{/* Products Grid */}
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
                  {p.stock > 0 ? \`স্টক: \${p.stock}\` : "স্টক নেই"}
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
      )}`;

const newGrid = \`{/* Products Grid */}
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
                  <span className={\`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-md \${
                    p.stock > 0 
                      ? 'bg-emerald-500/90 text-white' 
                      : 'bg-rose-500/90 text-white'
                  }\`}>
                    {p.stock > 0 ? \`স্টক: \${p.stock}\` : "স্টক নেই"}
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
      )}\`;

const oldModal = \`{/* Edit Product Modal */}
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
      </AnimatedModal>\`;

const newModal = \`{/* Edit Product Modal */}
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
              {editSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </span>
              ) : "আপডেট করুন"}
            </button>
          </div>
        </div>
      </AnimatedModal>\`;

data = data.replace(oldGrid, newGrid);
data = data.replace(oldModal, newModal);
fs.writeFileSync(filePath, data);
console.log("Updated products page.");
