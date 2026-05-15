const fs = require('fs');
const filePath = 'src/app/dashboard/orders/page.tsx';
let data = fs.readFileSync(filePath, 'utf8');

const oldModal = \`  // ===================== VIEW ORDER MODAL =====================
  const renderViewModal = () => {
    if (!viewOrder) return null;
    const ds = viewOrder.deliveryStatus || "pending";
    return (
      <AnimatedModal open={!!viewOrder} onClose={() => { setViewOrder(null); setDeliveryAction("none"); }} title="অর্ডার বিবরণ" maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {viewOrder.orderNumber && (
            <div className="col-span-2 bg-gray-50 p-2 rounded-lg border border-gray-100 mb-1 flex items-center justify-between">
               <span className="text-[11px] font-semibold text-gray-500 uppercase">অর্ডার নং</span>
               <span className="text-[13px] font-bold text-gray-800 tracking-wider">{viewOrder.orderNumber}</span>
            </div>
          )}
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>কাস্টমার</p>
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{viewOrder.customerName}</p>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>তারিখ</p>
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{new Date(viewOrder.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })} {new Date(viewOrder.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" })}</p>
            {ds === "delivered" && viewOrder.deliveryDate && (
              <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle2 size={10} /> ডেলিভারি: {new Date(viewOrder.deliveryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })} {new Date(viewOrder.deliveryDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" })}</p>
            )}
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>স্ট্যাটাস</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: viewOrder.status === "completed" ? "#f0fdf4" : viewOrder.status === "cancelled" ? "#fef2f2" : "#fffbeb", color: viewOrder.status === "completed" ? "#16a34a" : viewOrder.status === "cancelled" ? "#dc2626" : "#d97706" }}>
              {viewOrder.status === "completed" ? "সম্পন্ন" : viewOrder.status === "cancelled" ? "বাতিল" : "পেন্ডিং"}
            </span>
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>ডেলিভারি</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: ds === "delivered" ? "#f0fdf4" : ds === "not_delivered" ? "#fef2f2" : "#fffbeb", color: ds === "delivered" ? "#16a34a" : ds === "not_delivered" ? "#dc2626" : "#d97706" }}>
              {ds === "delivered" ? "ডেলিভারি সম্পন্ন" : ds === "not_delivered" ? "ডেলিভারি হয়নি" : "পেন্ডিং"}
            </span>
            {viewOrder.deliveryNote && <p className="text-[11px] mt-0.5" style={{ color: "#dc2626" }}>{viewOrder.deliveryNote}</p>}
          </div>
        </div>

        <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid var(--border-color)" }}>
          <div className="px-3 py-2 text-[11px] font-semibold" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>পণ্য তালিকা</div>
          {viewOrder.items.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: "1px solid var(--border-color)" }}>
              <div>
                <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{item.productName}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.quantity} x ৳{item.unitPrice}{item.remark ? \` · \${item.remark}\` : ""}</p>
              </div>
              <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>৳{item.total}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 p-3 rounded-lg mb-4" style={{ background: "var(--bg-input)" }}>
          <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>মোট</span><b style={{ color: "var(--text-primary)" }}>৳{viewOrder.totalAmount}</b></div>
          {viewOrder.returnAmount > 0 && (
            <>
              <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>ফেরত</span><b style={{ color: "#d97706" }}>- ৳{viewOrder.returnAmount}</b></div>
              <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>চূড়ান্ত মোট</span><b style={{ color: "var(--text-primary)" }}>৳{viewOrder.finalAmount}</b></div>
            </>
          )}
          <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>পরিশোধ</span><b style={{ color: "#16a34a" }}>৳{viewOrder.paidAmount}</b></div>
          <div className="flex justify-between text-[13px]"><span style={{ color: "var(--text-secondary)" }}>বাকি</span><b style={{ color: viewOrder.dueAmount > 0 ? "#dc2626" : "var(--text-primary)" }}>৳{viewOrder.dueAmount}</b></div>
        </div>
            {/* Return items list if exists */}
            {viewOrder.returnItems?.length > 0 && (
              <div className="mb-4 rounded-lg p-3" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <RotateCcw size={12} style={{ color: "#d97706" }} />
                  <span className="text-[11px] font-bold" style={{ color: "#d97706" }}>ফেরত পণ্য</span>
                </div>
                {viewOrder.returnItems.map((ri: { productName: string; amount: number }, i: number) => (
                  <div key={i} className="flex justify-between text-[12px] py-1" style={{ borderTop: i > 0 ? "1px solid #fef3c7" : "none" }}>
                    <span style={{ color: "var(--text-primary)" }}>{ri.productName}</span>
                    <span className="font-bold" style={{ color: "#d97706" }}>৳{ri.amount}</span>
                  </div>
                ))}
              </div>
            )}
            {viewOrder.note && <p className="mb-4 text-[12px]" style={{ color: "var(--text-muted)" }}>নোট: {viewOrder.note}</p>}

            {/* ===== DELIVERY ACTIONS ===== */}
            {ds === "pending" && deliveryAction === "none" && (
              <div className="flex gap-2">
                <button onClick={() => { setDeliveryAction("complete"); setDeliveryPaid(""); setReturnItems([]); }}
                  className="flex-1 h-11 rounded-xl text-[13px] font-semibold text-white cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: "#16a34a" }}>
                  <CheckCircle2 size={16} /> ডেলিভারি সম্পন্ন
                </button>
                <button onClick={() => setDeliveryAction("not_delivered")}
                  className="flex-1 h-11 rounded-xl text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  <Ban size={16} /> ডেলিভারি হয়নি
                </button>
              </div>
            )}

            {/* Delivery Complete Form */}
            {ds === "pending" && deliveryAction === "complete" && (() => {
              const effectiveTotal = viewOrder.totalAmount - returnTotal;
              const paid = Number(deliveryPaid) || 0;
              const dueAfter = Math.max(0, effectiveTotal - paid);
              return (
              <div className="rounded-xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={16} style={{ color: "#16a34a" }} />
                  <h4 className="text-[13px] font-bold" style={{ color: "#16a34a" }}>ডেলিভারি সম্পন্ন করুন</h4>
                </div>

                {/* Return Items — optional */}
                <div className="mb-3 rounded-lg p-3" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <RotateCcw size={13} style={{ color: "#d97706" }} />
                      <span className="text-[11px] font-bold" style={{ color: "#d97706" }}>পণ্য ফেরত (অপশনাল)</span>
                    </div>
                    <button type="button" onClick={() => setReturnItems([...returnItems, { productName: "", amount: "" }])}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer"
                      style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" }}>
                      + যোগ করুন
                    </button>
                  </div>
                  {returnItems.length === 0 && (
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>কোনো পণ্য ফেরত না থাকলে এড়িয়ে যান</p>
                  )}
                  {returnItems.map((ri, idx) => (
                    <div key={idx} className="flex items-center gap-2 mt-2">
                      <input type="text" value={ri.productName} placeholder="পণ্যের নাম"
                        onChange={(e) => { const n = [...returnItems]; n[idx] = { ...n[idx], productName: e.target.value }; setReturnItems(n); }}
                        className="flex-1 h-8 px-2 rounded-md text-[11px] outline-none"
                        style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #fde68a" }} />
                      <input type="number" value={ri.amount} placeholder="৳ টাকা"
                        onChange={(e) => { const n = [...returnItems]; n[idx] = { ...n[idx], amount: e.target.value === "" ? "" : Number(e.target.value) }; setReturnItems(n); }}
                        onFocus={(e) => e.target.select()}
                        className="w-24 h-8 px-2 rounded-md text-[11px] outline-none font-bold"
                        style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #fde68a" }} min={0} />
                      <button type="button" onClick={() => setReturnItems(returnItems.filter((_, i) => i !== idx))}
                        className="cursor-pointer shrink-0" style={{ color: "#dc2626" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {returnTotal > 0 && (
                    <div className="mt-2 pt-2 flex justify-between text-[11px] font-bold" style={{ borderTop: "1px dashed #fde68a", color: "#d97706" }}>
                      <span>মোট ফেরত</span><span>৳{returnTotal}</span>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="mb-3">
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    {returnTotal > 0
                      ? \`মোট: ৳\${viewOrder.totalAmount} − ফেরত: ৳\${returnTotal} = ৳\${effectiveTotal}\`
                      : \`মোট টাকা: ৳\${viewOrder.totalAmount}\`}
                  </label>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>কত টাকা পেইড করেছে?</label>
                  <input type="number" value={deliveryPaid}
                    onChange={(e) => setDeliveryPaid(e.target.value === "" ? "" : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    placeholder="টাকার পরিমাণ লিখুন"
                    min={0} max={effectiveTotal}
                    className="w-full h-10 px-3 rounded-lg text-sm outline-none font-bold"
                    style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #bbf7d0" }} />
                </div>
                {dueAfter > 0 && (
                  <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: "#fef2f2" }}>
                    <p className="text-[12px] font-semibold" style={{ color: "#dc2626" }}>বাকি থাকবে: ৳{dueAfter}</p>
                    <p className="text-[11px]" style={{ color: "#dc2626" }}>এই বাকি কাস্টমারের হিসাবে যোগ হবে</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setDeliveryAction("none")}
                    className="flex-1 h-10 rounded-lg text-[12px] font-medium cursor-pointer"
                    style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
                    বাতিল
                  </button>
                  <button onClick={handleDeliveryComplete} disabled={deliverySaving}
                    className="flex-1 h-10 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
                    style={{ background: "#16a34a" }}>
                    {deliverySaving ? "সংরক্ষণ হচ্ছে..." : "ডেলিভারি কনফার্ম"}
                  </button>
                </div>
              </div>
              );
            })()}

            {/* Delivery Failed Form */}
            {ds === "pending" && deliveryAction === "not_delivered" && (
              <div className="rounded-xl p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Ban size={16} style={{ color: "#dc2626" }} />
                  <h4 className="text-[13px] font-bold" style={{ color: "#dc2626" }}>ডেলিভারি হয়নি — কারণ নির্বাচন করুন</h4>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["দোকান বন্ধ", "দোকানদার নেই", "অর্ডার নিবে না", "পণ্য পছন্দ হয়নি", "ঠিকানা পাওয়া যায়নি"].map((r) => (
                    <button key={r} onClick={() => setDeliveryReason(r)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors"
                      style={{ background: deliveryReason === r ? "#dc2626" : "#fff", color: deliveryReason === r ? "#fff" : "#dc2626", border: "1px solid #fecaca" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mb-3">
                  <input value={deliveryReason} onChange={(e) => setDeliveryReason(e.target.value)}
                    placeholder="অন্য কারণ লিখুন..."
                    className="w-full h-9 px-3 rounded-lg text-[12px] outline-none"
                    style={{ background: "#fff", color: "var(--text-primary)", border: "1px solid #fecaca" }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setDeliveryAction("none"); setDeliveryReason(""); }}
                    className="flex-1 h-10 rounded-lg text-[12px] font-medium cursor-pointer"
                    style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
                    বাতিল
                  </button>
                  <button onClick={handleDeliveryFailed} disabled={deliverySaving}
                    className="flex-1 h-10 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
                    style={{ background: "#dc2626" }}>
                    {deliverySaving ? "সংরক্ষণ হচ্ছে..." : "নিশ্চিত করুন"}
                  </button>
                </div>
              </div>
            )}

            {/* Already delivered or not delivered badge */}
            {ds === "delivered" && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#16a34a" }}>ডেলিভারি সম্পন্ন হয়েছে</span>
              </div>
            )}
            {ds === "not_delivered" && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <Ban size={18} style={{ color: "#dc2626" }} />
                <div>
                   <span className="text-[13px] font-semibold" style={{ color: "#dc2626" }}>ডেলিভারি হয়নি</span>
                   {viewOrder.deliveryNote && <p className="text-[11px]" style={{ color: "#dc2626" }}>কারণ: {viewOrder.deliveryNote}</p>}
                </div>
              </div>
            )}
          </AnimatedModal>
    );
  };\`;

const newModal = \`  // ===================== VIEW ORDER MODAL =====================
  const renderViewModal = () => {
    if (!viewOrder) return null;
    const ds = viewOrder.deliveryStatus || "pending";
    return (
      <AnimatedModal open={!!viewOrder} onClose={() => { setViewOrder(null); setDeliveryAction("none"); }} title="অর্ডার বিবরণ" maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-4 mb-5">
          {viewOrder.orderNumber && (
            <div className="col-span-2 bg-slate-50 p-3 rounded-[12px] border border-slate-100 flex items-center justify-between">
               <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">অর্ডার নং</span>
               <span className="text-[14px] font-black text-slate-900 tracking-widest">{viewOrder.orderNumber}</span>
            </div>
          )}
          <div className="p-3 bg-white border border-slate-100 rounded-[12px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">কাস্টমার</p>
            <p className="text-[14px] font-bold text-slate-800 line-clamp-1">{viewOrder.customerName}</p>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-[12px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">তারিখ</p>
            <p className="text-[13px] font-bold text-slate-800">
              {new Date(viewOrder.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })} 
              <span className="text-slate-400 font-medium ml-1">
                {new Date(viewOrder.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" })}
              </span>
            </p>
            {ds === "delivered" && viewOrder.deliveryDate && (
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> 
                {new Date(viewOrder.deliveryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" })}
              </p>
            )}
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-[12px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">স্ট্যাটাস</p>
            <span className={\`text-[11px] px-2.5 py-1 rounded-md font-bold inline-block \${
              viewOrder.status === "completed" ? "bg-emerald-50 text-emerald-600" : 
              viewOrder.status === "cancelled" ? "bg-rose-50 text-rose-600" : 
              "bg-amber-50 text-amber-600"
            }\`}>
              {viewOrder.status === "completed" ? "সম্পন্ন" : viewOrder.status === "cancelled" ? "বাতিল" : "পেন্ডিং"}
            </span>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-[12px] shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ডেলিভারি</p>
            <span className={\`text-[11px] px-2.5 py-1 rounded-md font-bold inline-block \${
              ds === "delivered" ? "bg-emerald-50 text-emerald-600" : 
              ds === "not_delivered" ? "bg-rose-50 text-rose-600" : 
              "bg-indigo-50 text-indigo-600"
            }\`}>
              {ds === "delivered" ? "ডেলিভারি সম্পন্ন" : ds === "not_delivered" ? "ডেলিভারি হয়নি" : "পেন্ডিং"}
            </span>
            {viewOrder.deliveryNote && <p className="text-[11px] mt-1.5 font-medium text-rose-500 leading-snug">{viewOrder.deliveryNote}</p>}
          </div>
        </div>

        <div className="rounded-[16px] overflow-hidden mb-5 border border-slate-200/60 shadow-sm bg-white">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">পণ্য তালিকা</div>
          <div className="divide-y divide-slate-100">
            {viewOrder.items.map((item: OrderItem, idx: number) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="pr-4">
                  <p className="text-[14px] font-bold text-slate-800 line-clamp-1">{item.productName}</p>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                    {item.quantity} × <span className="font-semibold text-slate-600">৳{item.unitPrice.toLocaleString("en-US")}</span>
                    {item.remark && <span className="text-slate-400 ml-1">· {item.remark}</span>}
                  </p>
                </div>
                <span className="text-[15px] font-black text-slate-900 tabular-nums shrink-0">৳{item.total.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-4 rounded-[16px] mb-5 bg-slate-50 border border-slate-200/60 shadow-inner">
          <div className="flex justify-between items-center text-[14px]">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">মোট বিল</span>
            <span className="font-black text-slate-800 tabular-nums">৳{viewOrder.totalAmount.toLocaleString("en-US")}</span>
          </div>
          {viewOrder.returnAmount > 0 && (
            <>
              <div className="flex justify-between items-center text-[14px]">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">ফেরত</span>
                <span className="font-black text-rose-500 tabular-nums">- ৳{viewOrder.returnAmount.toLocaleString("en-US")}</span>
              </div>
              <div className="flex justify-between items-center text-[14px] pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">চূড়ান্ত মোট</span>
                <span className="font-black text-slate-900 tabular-nums">৳{(viewOrder.finalAmount || 0).toLocaleString("en-US")}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center text-[14px] pt-1">
            <span className="font-bold text-emerald-600/80 uppercase tracking-wider text-[11px]">পরিশোধ</span>
            <span className="font-black text-emerald-600 tabular-nums">৳{(viewOrder.paidAmount || 0).toLocaleString("en-US")}</span>
          </div>
          <div className="flex justify-between items-center text-[14px] pt-2 border-t border-slate-200">
            <span className={\`font-bold uppercase tracking-wider text-[11px] \${viewOrder.dueAmount > 0 ? 'text-rose-500' : 'text-slate-500'}\`}>বাকি</span>
            <span className={\`font-black tabular-nums \${viewOrder.dueAmount > 0 ? 'text-rose-600' : 'text-slate-800'}\`}>৳{(viewOrder.dueAmount || 0).toLocaleString("en-US")}</span>
          </div>
        </div>

        {/* Return items list if exists */}
        {viewOrder.returnItems?.length > 0 && (
          <div className="mb-5 rounded-[14px] p-4 bg-rose-50/50 border border-rose-100">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw size={14} className="text-rose-500" />
              <span className="text-[12px] font-bold text-rose-600 uppercase tracking-wider">ফেরত পণ্য</span>
            </div>
            <div className="space-y-2">
              {viewOrder.returnItems.map((ri: { productName: string; amount: number }, i: number) => (
                <div key={i} className="flex justify-between items-center text-[13px] py-1">
                  <span className="font-semibold text-slate-700">{ri.productName}</span>
                  <span className="font-bold text-rose-500 tabular-nums">৳{ri.amount.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {viewOrder.note && (
          <div className="mb-5 p-3 rounded-[12px] bg-amber-50 border border-amber-100 flex gap-2 items-start">
            <div className="mt-0.5"><Clock size={14} className="text-amber-500" /></div>
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">নোট</p>
              <p className="text-[13px] font-medium text-amber-800 leading-snug">{viewOrder.note}</p>
            </div>
          </div>
        )}

        {/* ===== DELIVERY ACTIONS ===== */}
        {ds === "pending" && deliveryAction === "none" && (
          <div className="flex gap-3">
            <button onClick={() => { setDeliveryAction("complete"); setDeliveryPaid(""); setReturnItems([]); }}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold text-white shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2">
              <CheckCircle2 size={18} strokeWidth={2.5} /> ডেলিভারি সম্পন্ন
            </button>
            <button onClick={() => setDeliveryAction("not_delivered")}
              className="flex-1 h-12 rounded-[14px] text-[14px] font-bold flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors active:scale-95">
              <Ban size={18} strokeWidth={2.5} /> ডেলিভারি হয়নি
            </button>
          </div>
        )}

        {/* Delivery Complete Form */}
        {ds === "pending" && deliveryAction === "complete" && (() => {
          const effectiveTotal = viewOrder.totalAmount - returnTotal;
          const paid = Number(deliveryPaid) || 0;
          const dueAfter = Math.max(0, effectiveTotal - paid);
          return (
          <div className="rounded-[16px] p-5 bg-emerald-50/50 border border-emerald-100 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Truck size={16} className="text-emerald-600" />
              </div>
              <h4 className="text-[15px] font-bold text-emerald-800 tracking-tight">ডেলিভারি সম্পন্ন করুন</h4>
            </div>

            {/* Return Items optional */}
            <div className="mb-4 rounded-[12px] p-4 bg-white border border-rose-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <RotateCcw size={14} className="text-rose-500" />
                  <span className="text-[12px] font-bold text-rose-600 uppercase tracking-wider">পণ্য ফেরত (অপশনাল)</span>
                </div>
                <button type="button" onClick={() => setReturnItems([...returnItems, { productName: "", amount: "" }])}
                  className="px-3 py-1 rounded-[8px] text-[11px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-1">
                  <Plus size={12} /> যোগ করুন
                </button>
              </div>
              
              {returnItems.length === 0 && (
                <p className="text-[12px] font-medium text-slate-400">কোনো পণ্য ফেরত না থাকলে এড়িয়ে যান</p>
              )}
              
              {returnItems.map((ri, idx) => (
                <div key={idx} className="flex items-center gap-2 mt-2.5 group">
                  <input type="text" value={ri.productName} placeholder="পণ্যের নাম"
                    onChange={(e) => { const n = [...returnItems]; n[idx] = { ...n[idx], productName: e.target.value }; setReturnItems(n); }}
                    className="flex-1 h-10 px-3 rounded-[10px] text-[13px] font-medium outline-none bg-slate-50 border border-slate-200 focus:border-rose-300 focus:bg-white transition-colors" />
                  <input type="number" value={ri.amount} placeholder="৳ টাকা"
                    onChange={(e) => { const n = [...returnItems]; n[idx] = { ...n[idx], amount: e.target.value === "" ? "" : Number(e.target.value) }; setReturnItems(n); }}
                    onFocus={(e) => e.target.select()}
                    className="w-24 h-10 px-3 rounded-[10px] text-[13px] font-bold tabular-nums outline-none bg-slate-50 border border-slate-200 focus:border-rose-300 focus:bg-white transition-colors text-right" min={0} />
                  <button type="button" onClick={() => setReturnItems(returnItems.filter((_, i) => i !== idx))}
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
              
              {returnTotal > 0 && (
                <div className="mt-3 pt-3 flex justify-between items-center border-t border-rose-100">
                  <span className="text-[12px] font-bold text-rose-500 uppercase tracking-wider">মোট ফেরত</span>
                  <span className="text-[16px] font-black text-rose-600 tabular-nums">৳{returnTotal.toLocaleString("en-US")}</span>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">হিসাব</label>
                <div className="text-[12px] font-black text-slate-800 tabular-nums">
                  {returnTotal > 0
                    ? \`৳\${viewOrder.totalAmount} − ৳\${returnTotal} = ৳\${effectiveTotal}\`
                    : \`মোট: ৳\${viewOrder.totalAmount}\`}
                </div>
              </div>
              <div className="relative">
                <label className="absolute left-3 -top-2.5 px-1.5 bg-emerald-50 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">আদায় (৳)</label>
                <input type="number" value={deliveryPaid}
                  onChange={(e) => setDeliveryPaid(e.target.value === "" ? "" : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="কত টাকা দেওয়া হয়েছে?"
                  min={0} max={effectiveTotal}
                  className="w-full h-12 px-4 rounded-[12px] text-[15px] font-bold tabular-nums outline-none bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm" />
              </div>
            </div>
            
            {dueAfter > 0 && (
              <div className="mb-5 p-3 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center justify-between">
                <span className="text-[12px] font-bold text-rose-600 uppercase tracking-wider">বাকি থাকবে</span>
                <span className="text-[15px] font-black text-rose-600 tabular-nums">৳{dueAfter.toLocaleString("en-US")}</span>
              </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setDeliveryAction("none")}
                className="flex-[1] h-12 rounded-[12px] text-[14px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                বাতিল
              </button>
              <button onClick={handleDeliveryComplete} disabled={deliverySaving}
                className="flex-[2] h-12 rounded-[12px] text-[14px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {deliverySaving ? "আপডেট হচ্ছে..." : <><CheckCircle2 size={18} strokeWidth={2.5} /> কনফার্ম করুন</>}
              </button>
            </div>
          </div>
          );
        })()}

        {/* Delivery Failed Form */}
        {ds === "pending" && deliveryAction === "not_delivered" && (
          <div className="rounded-[16px] p-5 bg-rose-50/50 border border-rose-100 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Ban size={16} className="text-rose-600" />
              </div>
              <h4 className="text-[15px] font-bold text-rose-800 tracking-tight">ডেলিভারি ব্যর্থ হয়েছে?</h4>
            </div>
            
            <div className="mb-4">
              <label className="block text-[12px] font-bold text-rose-600 uppercase tracking-wider mb-2 px-1">কারণ নির্বাচন করুন</label>
              <div className="flex flex-wrap gap-2">
                {["দোকান বন্ধ", "দোকানদার নেই", "অর্ডার নিবে না", "পণ্য পছন্দ হয়নি", "ঠিকানা পাওয়া যায়নি"].map((r) => (
                  <button key={r} onClick={() => setDeliveryReason(r)}
                    className={\`px-3 py-2 rounded-[10px] text-[12px] font-bold transition-all \${
                      deliveryReason === r 
                      ? "bg-rose-500 text-white shadow-md border border-rose-500" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200"
                    }\`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-5 relative">
              <label className="absolute left-3 -top-2.5 px-1.5 bg-rose-50 text-[11px] font-bold text-rose-600 uppercase tracking-wider">অথবা নিজে লিখুন</label>
              <input value={deliveryReason} onChange={(e) => setDeliveryReason(e.target.value)}
                placeholder="অন্য কোনো কারণ..."
                className="w-full h-11 px-4 rounded-[12px] text-[13px] font-medium outline-none bg-white border border-rose-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => { setDeliveryAction("none"); setDeliveryReason(""); }}
                className="flex-[1] h-12 rounded-[12px] text-[14px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                বাতিল
              </button>
              <button onClick={handleDeliveryFailed} disabled={deliverySaving}
                className="flex-[2] h-12 rounded-[12px] text-[14px] font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-[0_4px_15px_-3px_rgba(244,63,94,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {deliverySaving ? "আপডেট হচ্ছে..." : <><Ban size={18} strokeWidth={2.5} /> ব্যর্থ কনফার্ম করুন</>}
              </button>
            </div>
          </div>
        )}

        {/* Badges for already processed orders */}
        {ds === "delivered" && (
          <div className="flex items-center gap-3 p-4 rounded-[14px] bg-emerald-50 border border-emerald-100 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-emerald-800">ডেলিভারি সম্পন্ন হয়েছে</p>
              <p className="text-[12px] font-medium text-emerald-600/80 mt-0.5">অর্ডারটি সফলভাবে কাস্টমারকে বুঝিয়ে দেওয়া হয়েছে।</p>
            </div>
          </div>
        )}
        
        {ds === "not_delivered" && (
          <div className="flex items-start gap-3 p-4 rounded-[14px] bg-rose-50 border border-rose-100 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mt-1">
              <Ban size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-rose-800">ডেলিভারি ব্যর্থ হয়েছে</p>
              {viewOrder.deliveryNote && (
                <p className="text-[13px] font-medium text-rose-600 mt-1.5 bg-rose-100/50 p-2 rounded-lg leading-snug border border-rose-100">
                  <span className="font-bold text-rose-700">কারণ:</span> {viewOrder.deliveryNote}
                </p>
              )}
            </div>
          </div>
        )}
      </AnimatedModal>
    );
  };\`;

data = data.replace(oldModal, newModal);
fs.writeFileSync(filePath, data);
console.log('Update complete');
