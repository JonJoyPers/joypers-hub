"use client";

export default function LocalTime({
  timestamp,
  format = "time",
}: {
  timestamp: string;
  format?: "time" | "datetime";
}) {
  const d = new Date(timestamp);
  if (format === "datetime") {
    return <>{d.toLocaleString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", month: "short", day: "numeric" })}</>;
  }
  return <>{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>;
}
