"use client";

import { useEffect, useState } from "react";

interface Customer { _id: string; name: string; phone: string; totalDue: number; }

export default function DuesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(data.filter((c: Customer) => c.totalDue > 0)))
      .finally(() => setLoading(false));
  }, []);

  const totalDue = customers.reduce((s, c) => s + c.totalDue, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#66a80f", borderTopColor: "transparent" }} />
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>বাকি তালিকা</h2>
        <div className="h-10 px-4 flex items-center rounded-lg text-sm font-bold" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          মোট বাকি: ৳{totalDue}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {customers.length === 0 ? (
          <div className="py-12 text-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>কোনো বাকি নেই</p></div>
        ) : (
          <table className="w-full text-[13px]">
            <thead style={{ background: "var(--bg-input)" }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>কাস্টমার</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>ফোন</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>বাকি পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} style={{ borderTop: "1px solid var(--border-color)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{c.phone}</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: "#dc2626" }}>৳{c.totalDue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
