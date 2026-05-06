import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateBengali(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
}

export function formatDateShortBengali(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });
}

export function getBDDateString(date: Date = new Date()): string {
  // Returns YYYY-MM-DD strictly corresponding to the time in Asia/Dhaka
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: "Asia/Dhaka", 
    year: "numeric", 
    month: "2-digit", 
    day: "2-digit" 
  };
  const parts = new Intl.DateTimeFormat("en-GB", options).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}
