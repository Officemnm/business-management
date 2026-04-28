"use client";

import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react";
import type { ComponentType } from "react";

interface CardDetailProps {
  id: string;
  label: string;
  value: number;
  prefix: string;
  suffix: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  color: string;
  bg: string;
  trend: string;
  up: boolean;
  onBack: () => void;
}

/* ── Detail data for each card ── */
const detailData: Record<string, {
  subtitle: string;
  rows: { label: string; value: string; change: string; up: boolean }[];
  insights: string[];
  periods: { label: string; value: string }[];
}> = {
  revenue: {
    subtitle: "মাসিক আয়ের বিশ্লেষণ",
    rows: [
      { label: "অনলাইন বিক্রি", value: "৳ ১,২৪,৫০০", change: "+১৫.২%", up: true },
      { label: "শোরুম বিক্রি", value: "৳ ৮৮,২৫০", change: "+৮.৭%", up: true },
      { label: "পাইকারি অর্ডার", value: "৳ ৫২,০০০", change: "+৩.১%", up: true },
      { label: "রপ্তানি", value: "৳ ২০,০০০", change: "-১.৫%", up: false },
    ],
    insights: [
      "অনলাইন বিক্রি গত মাসের তুলনায় ১৫.২% বৃদ্ধি পেয়েছে।",
      "শোরুম থেকে আয় স্থিতিশীল রয়েছে।",
      "পাইকারি খাতে নতুন ক্লায়েন্ট যোগ হওয়ায় আয় বাড়ছে।",
    ],
    periods: [
      { label: "আজকের আয়", value: "৳ ১২,৮৫০" },
      { label: "এই সপ্তাহ", value: "৳ ৬৮,৪২০" },
      { label: "এই মাস", value: "৳ ২,৮৪,৭৫০" },
      { label: "গত মাস", value: "৳ ২,৫৩,১০০" },
    ],
  },
  orders: {
    subtitle: "অর্ডার বিশ্লেষণ ও ট্র্যাকিং",
    rows: [
      { label: "সম্পন্ন অর্ডার", value: "১,৫৬২ টি", change: "+১২.৪%", up: true },
      { label: "প্রক্রিয়াধীন", value: "১৪৮ টি", change: "+৫.২%", up: true },
      { label: "ডেলিভারিতে", value: "৮৯ টি", change: "+৮.৯%", up: true },
      { label: "বাতিল", value: "৪৩ টি", change: "-৩.১%", up: false },
    ],
    insights: [
      "সম্পন্ন অর্ডারের হার ৮৪.৮% — গত মাসের চেয়ে ভালো।",
      "বাতিলের হার কমেছে, গ্রাহক সন্তুষ্টি বাড়ছে।",
      "গড় ডেলিভারি সময় ২.৩ দিন।",
    ],
    periods: [
      { label: "আজকের অর্ডার", value: "২৮ টি" },
      { label: "এই সপ্তাহ", value: "১৮৬ টি" },
      { label: "এই মাস", value: "১,৮৪২ টি" },
      { label: "গত মাস", value: "১,৭০৫ টি" },
    ],
  },
  customers: {
    subtitle: "গ্রাহক বিশ্লেষণ ও প্রবৃদ্ধি",
    rows: [
      { label: "নতুন গ্রাহক (এই মাসে)", value: "৩৮৪ জন", change: "+১৮.৬%", up: true },
      { label: "নিয়মিত গ্রাহক", value: "২,১৫০ জন", change: "+৪.২%", up: true },
      { label: "নিষ্ক্রিয় গ্রাহক", value: "৮৯০ জন", change: "-২.১%", up: false },
      { label: "VIP গ্রাহক", value: "৮৬৭ জন", change: "+৯.৫%", up: true },
    ],
    insights: [
      "নতুন গ্রাহক যোগদানের হার বৃদ্ধি পাচ্ছে।",
      "VIP গ্রাহকদের গড় ক্রয়মূল্য ৳ ৩,৫০০।",
      "SMS ক্যাম্পেইনের মাধ্যমে ১২০ জন নিষ্ক্রিয় গ্রাহক ফিরে এসেছেন।",
    ],
    periods: [
      { label: "আজকের নতুন", value: "১৪ জন" },
      { label: "এই সপ্তাহ", value: "৮৬ জন" },
      { label: "মোট গ্রাহক", value: "৪,২৯১ জন" },
      { label: "গত মাসের মোট", value: "৪,০৭৫ জন" },
    ],
  },
  products: {
    subtitle: "পণ্য ইনভেন্টরি ব্যবস্থাপনা",
    rows: [
      { label: "সক্রিয় পণ্য", value: "১১৮ টি", change: "+৩.৫%", up: true },
      { label: "স্টক শেষ", value: "৮ টি", change: "+২ টি", up: false },
      { label: "নতুন আসছে", value: "১০ টি", change: "+৫ টি", up: true },
      { label: "বন্ধ পণ্য", value: "১৮ টি", change: "—", up: true },
    ],
    insights: [
      "৮টি পণ্যের স্টক শেষ হয়ে গেছে — জরুরি পুনরায় অর্ডার করুন।",
      "রোজ ফেস ক্রিম সবচেয়ে বেশি বিক্রি হচ্ছে।",
      "আগামী সপ্তাহে ১০টি নতুন পণ্য যোগ হবে।",
    ],
    periods: [
      { label: "মোট পণ্য", value: "১৩৬ টি" },
      { label: "সক্রিয়", value: "১১৮ টি" },
      { label: "স্টক আলার্ট", value: "১২ টি" },
      { label: "নতুন (এই মাসে)", value: "৬ টি" },
    ],
  },
  dailySales: {
    subtitle: "দৈনিক বিক্রির বিস্তারিত",
    rows: [
      { label: "সকাল (৯-১২)", value: "৳ ৪,২০০", change: "+১০.১%", up: true },
      { label: "দুপুর (১২-৩)", value: "৳ ৫,৮৫০", change: "+১৪.৩%", up: true },
      { label: "বিকাল (৩-৬)", value: "৳ ৩,৫২০", change: "-২.৮%", up: false },
      { label: "সন্ধ্যা (৬-৯)", value: "৳ ১,৮৫০", change: "+৬.৫%", up: true },
    ],
    insights: [
      "দুপুরের সময় সর্বোচ্চ বিক্রি হচ্ছে।",
      "বিকালের বিক্রি সামান্য কমেছে — প্রোমোশন চালু করা যেতে পারে।",
      "অনলাইন অর্ডার সন্ধ্যায় বৃদ্ধি পাচ্ছে।",
    ],
    periods: [
      { label: "আজকের মোট", value: "৳ ১৫,৪২০" },
      { label: "গতকাল", value: "৳ ১৩,৯৮০" },
      { label: "সপ্তাহের গড়", value: "৳ ১৪,২০০" },
      { label: "সর্বোচ্চ দিন", value: "৳ ২২,৬৫০" },
    ],
  },
  profit: {
    subtitle: "মুনাফা ও ব্যয় বিশ্লেষণ",
    rows: [
      { label: "মোট আয়", value: "৳ ২,৮৪,৭৫০", change: "+১২.৪%", up: true },
      { label: "পণ্য খরচ", value: "৳ ১,৪২,৩০০", change: "+৭.৮%", up: false },
      { label: "পরিচালনা ব্যয়", value: "৳ ৫৩,২৫০", change: "+২.১%", up: false },
      { label: "নিট মুনাফা", value: "৳ ৮৯,২০০", change: "+১৮.৫%", up: true },
    ],
    insights: [
      "নিট মুনাফার মার্জিন ৩১.৩% — লক্ষ্যমাত্রার উপরে।",
      "পণ্য খরচ অনুপাতে কম বেড়েছে, এটি ভালো সংকেত।",
      "ডেলিভারি খরচ কমানোর সুযোগ রয়েছে।",
    ],
    periods: [
      { label: "আজকের মুনাফা", value: "৳ ৪,৫৬০" },
      { label: "এই সপ্তাহ", value: "৳ ২১,৮০০" },
      { label: "এই মাস", value: "৳ ৮৯,২০০" },
      { label: "গত মাস", value: "৳ ৭৫,৩৫০" },
    ],
  },
  pending: {
    subtitle: "পেন্ডিং অর্ডার ট্র্যাকিং",
    rows: [
      { label: "পেমেন্ট অপেক্ষমান", value: "১৮ টি", change: "+৩ টি", up: false },
      { label: "প্যাকেজিং হচ্ছে", value: "১২ টি", change: "-৫ টি", up: true },
      { label: "কুরিয়ারে হস্তান্তর", value: "৯ টি", change: "+২ টি", up: false },
      { label: "ঠিকানা যাচাই বাকি", value: "৮ টি", change: "+১ টি", up: false },
    ],
    insights: [
      "১৮টি অর্ডারে পেমেন্ট কনফার্ম হয়নি — ফলোআপ করুন।",
      "প্যাকেজিং দল গতকালের চেয়ে দ্রুত কাজ করছে।",
      "৮টি অর্ডারে ঠিকানা অসম্পূর্ণ — গ্রাহকের সাথে যোগাযোগ করুন।",
    ],
    periods: [
      { label: "মোট পেন্ডিং", value: "৪৭ টি" },
      { label: "আজকের নতুন", value: "৬ টি" },
      { label: "২৪ ঘণ্টার বেশি", value: "১১ টি" },
      { label: "জরুরি", value: "৫ টি" },
    ],
  },
  returns: {
    subtitle: "রিটার্ন ও রিফান্ড বিশ্লেষণ",
    rows: [
      { label: "পণ্য ত্রুটি", value: "৪ টি", change: "-২ টি", up: true },
      { label: "ভুল পণ্য পাঠানো", value: "৩ টি", change: "+১ টি", up: false },
      { label: "গ্রাহক অসন্তুষ্টি", value: "৩ টি", change: "—", up: true },
      { label: "ডেলিভারি ক্ষতি", value: "২ টি", change: "-১ টি", up: true },
    ],
    insights: [
      "রিটার্নের হার ০.৬৫% — ইন্ডাস্ট্রি গড়ের চেয়ে অনেক কম।",
      "পণ্য ত্রুটির কারণে রিটার্ন কমেছে — QC উন্নত হচ্ছে।",
      "রিফান্ড প্রক্রিয়ার গড় সময় ২.৫ দিন।",
    ],
    periods: [
      { label: "এই মাসে", value: "১২ টি" },
      { label: "গত মাসে", value: "১৫ টি" },
      { label: "রিফান্ড দেওয়া", value: "৳ ১৮,৪০০" },
      { label: "রিটার্ন হার", value: "০.৬৫%" },
    ],
  },
};

export default function CardDetail({ id, label, icon: Icon, color, bg, trend, up, onBack }: CardDetailProps) {
  const data = detailData[id] || detailData.revenue;

  const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const itemV = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <motion.button
          whileHover={{ scale: 1.08, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(139,58,90,0.08)", border: "none", cursor: "pointer",
            color: "#8b3a5a", flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={22} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "1.10rem", fontWeight: 700, color: "#1a0f14", margin: 0 }}>{label}</h2>
          <p style={{ fontSize: "0.72rem", color: "#8a7078", marginTop: 2 }}>{data.subtitle}</p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem",
          color: up ? "#059669" : "#dc2626",
          background: up ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)",
          padding: "5px 12px", borderRadius: 20, fontWeight: 600,
        }}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {trend}
        </div>
      </div>

      {/* Period Summary Cards */}
      <motion.div
        variants={containerV} initial="hidden" animate="visible"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}
      >
        {data.periods.map((p, i) => (
          <motion.div key={i} variants={itemV}
            style={{
              background: "rgba(255,253,251,0.97)", borderRadius: 12,
              padding: "16px 16px", border: "1px solid rgba(235,220,225,0.80)",
              boxShadow: "0 2px 8px rgba(26,15,20,0.04)",
            }}
          >
            <div style={{ fontSize: "0.68rem", color: "#8a7078", marginBottom: 6, letterSpacing: "0.02em" }}>
              <Calendar size={10} style={{ marginRight: 4, verticalAlign: "middle", opacity: 0.6 }} />
              {p.label}
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1a0f14" }}>{p.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{
          background: "rgba(255,253,251,0.97)", borderRadius: 12,
          border: "1px solid rgba(235,220,225,0.80)", boxShadow: "0 2px 12px rgba(26,15,20,0.05)",
          overflow: "hidden", marginBottom: 18,
        }}
      >
        <div style={{
          padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(139,58,90,0.07)", background: "rgba(139,58,90,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} color="#8b3a5a" />
            <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#1a0f14" }}>বিস্তারিত বিভাজন</span>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(139,58,90,0.06)" }}>
              {["বিবরণ", "পরিমাণ", "পরিবর্তন"].map(h => (
                <th key={h} style={{
                  padding: "11px 18px", textAlign: "left", fontSize: "0.63rem",
                  color: "#8a7078", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <motion.tr key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                whileHover={{ backgroundColor: "rgba(139,58,90,0.025)" }}
                style={{ borderBottom: "1px solid rgba(139,58,90,0.04)" }}
              >
                <td style={{ padding: "13px 18px", fontSize: "0.80rem", color: "#1a0f14", fontWeight: 500 }}>{r.label}</td>
                <td style={{ padding: "13px 18px", fontSize: "0.80rem", color: "#3d2e35", fontWeight: 600 }}>{r.value}</td>
                <td style={{ padding: "13px 18px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.70rem",
                    color: r.up ? "#059669" : "#dc2626",
                    background: r.up ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)",
                    padding: "3px 9px", borderRadius: 20, fontWeight: 600,
                  }}>
                    {r.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {r.change}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{
          background: `linear-gradient(135deg, ${bg}, rgba(212,137,159,0.06))`,
          borderRadius: 12, padding: "18px 20px",
          border: `1px solid ${color}22`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={14} color={color} />
          </div>
          <span style={{ fontSize: "0.80rem", fontWeight: 700, color: "#1a0f14", letterSpacing: "0.02em" }}>
            অন্তর্দৃষ্টি ও পরামর্শ
          </span>
        </div>
        {data.insights.map((ins, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              marginBottom: i < data.insights.length - 1 ? 8 : 0,
            }}
          >
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: color,
              marginTop: 7, flexShrink: 0, opacity: 0.7,
            }} />
            <p style={{ fontSize: "0.76rem", color: "#3d2e35", lineHeight: 1.65, margin: 0 }}>{ins}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
