import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Calendar,
  Zap,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_BACKEND_API_URL || "https://localhost:5000";
const PAGE_SIZE = 10;

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Generates page numbers with ellipsis: [1, '...', 4, 5, 6, '...', 20]
function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [];
  pages.push(1);
  if (current > 4) pages.push("...");
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push("...");
  pages.push(total);
  return pages;
}

export default function HistoryView({ device, onBack }) {
  const { floor, meter } = device;

  const todayStr = formatDateForInput(new Date());
  const minAllowedDate = new Date();
  minAllowedDate.setDate(minAllowedDate.getDate() - 45);
  const minDateStr = formatDateForInput(minAllowedDate);

  const past7Str = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateForInput(d);
  })();

  const past30Str = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  })();

  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core fetch — takes explicit from/to/page so it never reads stale state
  const fetchHistory = useCallback(
    (from, to, pg) => {
      const effectiveFrom = from < minDateStr ? minDateStr : from;
      const effectiveTo = to > todayStr ? todayStr : to;

      setLoading(true);
      setError(null);

      fetch(
        `${API_BASE}/api/meters/${floor}/${meter}/history` +
          `?from=${effectiveFrom}&to=${effectiveTo}&page=${pg}&limit=${PAGE_SIZE}`,
      )
        .then((res) => {
          if (!res.ok)
            throw new Error(`HTTP ${res.status}: Failed to fetch history`);
          return res.json();
        })
        .then((resData) => {
          setData(resData);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Unable to connect to backend server");
          setLoading(false);
        });
    },
    [floor, meter],
  ); // only recreate when device changes

  // Initial load and device change
  useEffect(() => {
    setPage(1);
    fetchHistory(fromDate, toDate, 1);
  }, [floor, meter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Page change (date range stays the same)
  useEffect(() => {
    if (data !== null) {
      // skip on first mount (handled above)
      fetchHistory(fromDate, toDate, page);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter handlers — always reset to page 1
  const handleApplyFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory(fromDate, toDate, 1);
  };

  const handleSetQuickToday = () => {
    const today = formatDateForInput(new Date());
    setFromDate(today);
    setToDate(today);
    setPage(1);
    fetchHistory(today, today, 1);
  };

  const handleSetQuickPastDays = (numDays) => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - numDays);
    const fromStr = formatDateForInput(past);
    const toStr = formatDateForInput(now);
    setFromDate(fromStr);
    setToDate(toStr);
    setPage(1);
    fetchHistory(fromStr, toStr, 1);
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Navigation & Title Bar */}
      <div className="pb-4 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          {/* Back button — mobile: row 1 left | desktop: left */}
          <button
            onClick={onBack}
            className="order-1 cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 active:scale-95 transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to Dashboard</span>
            </span>
          </button>

          {/* Refresh — mobile: row 1 right | desktop: far right */}
          <button
            onClick={() => fetchHistory(fromDate, toDate, page)}
            disabled={loading}
            className={`order-2 sm:order-3 ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 text-xs font-medium transition-all ${
              loading
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer active:scale-95"
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {/* Title — mobile: row 2 full width | desktop: between */}
          <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight">
              Energy Usage &amp; History
            </h2>
            <p className="text-xs text-cyan-400 font-mono mt-1 truncate">
              Floor - {floor} Room #{meter}
            </p>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form
          onSubmit={handleApplyFilter}
          className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1"
        >
          <div className="flex items-center gap-2 flex-1 min-w-35">
            <span className="text-xs uppercase font-semibold text-slate-400">
              From
            </span>
            <input
              type="date"
              min={minDateStr}
              max={todayStr}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-35">
            <span className="text-xs uppercase font-semibold text-slate-400">
              To
            </span>
            <input
              type="date"
              min={minDateStr}
              max={todayStr}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-xs"
          >
            Apply Filter
          </button>
        </form>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
          <button
            type="button"
            onClick={handleSetQuickToday}
            className={`cursor-pointer flex-1 md:flex-none px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              fromDate === todayStr && toDate === todayStr
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleSetQuickPastDays(7)}
            className={`cursor-pointer flex-1 md:flex-none px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              fromDate === past7Str && toDate === todayStr
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
            }`}
          >
            7d
          </button>
          <button
            type="button"
            onClick={() => handleSetQuickPastDays(30)}
            className={`cursor-pointer flex-1 md:flex-none px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              fromDate === past30Str && toDate === todayStr
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
            }`}
          >
            30d
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading energy usage from database...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-sm">Backend Connection Note</p>
            <p className="mt-1 text-slate-300">{error}</p>
            <p className="mt-2 text-slate-500 text-[11px] wrap-break-word">
              {" "}
              If using self-signed certs, open{" "}
              <a
                href={`${API_BASE}/api/meters/1/1/history`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 underline font-mono break-all"
              >
                {API_BASE}/api/meters/1/1/history
              </a>{" "}
              once in your browser to accept the certificate.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && data && (
        <>
          {/* Energy Summary Hero Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-linear-to-br from-cyan-950/40 via-slate-900/90 to-slate-950/90 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" /> Electricity Consumed
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono text-cyan-300 mt-2">
                {(Number(data.totalKWh) || 0).toFixed(2)}{" "}
                <span className="text-lg font-normal text-slate-400">Units</span>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {fromDate === toDate
                  ? `Today (${fromDate})`
                  : `${fromDate} to ${toDate}`}
              </span>
            </div>
            <div className="sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
              <span className="text-xs text-slate-400 font-mono block">
                1 Unit = 1 kWh · Estimated Real Power
              </span>
            </div>
          </div>

          {/* Historical Snapshots Feed */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5">
            {/* Table header */}
            <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                {fromDate === todayStr && toDate === todayStr
                  ? "Today's Telemetry Snapshots"
                  : "Historical Telemetry Snapshots"}
              </h3>
              <span className="text-xs text-slate-400 font-mono shrink-0">
                {data.readingsCount} records
              </span>
            </div>

            {/* Rows */}
            {data.readings && data.readings.length > 0 ? (
              <div className="space-y-2">
                {data.readings.map((r) => (
                  <div
                    key={r.id}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 font-mono hover:border-slate-700 transition-colors"
                  >
                    <span className="text-slate-400 text-xs">
                      {new Date(r.recordedAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                      {" · "}
                      {new Date(r.recordedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                      <span className="text-cyan-400 font-semibold">
                        {r.current.toFixed(2)} A
                      </span>
                      <span className="text-amber-400 font-semibold">
                        {r.power.toFixed(1)} W
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          r.relayOn
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {r.relayOn ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No recorded snapshots found for this date range.
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800 flex-wrap gap-3">
                <span className="text-xs text-slate-500 font-mono">
                  {data.readingsCount} records &nbsp;·&nbsp; Page {page} of{" "}
                  {totalPages}
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {/* Prev */}
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-medium transition-colors ${
                      page <= 1
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer"
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Page number buttons */}
                  {getPageNumbers(page, totalPages).map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-slate-600 text-xs select-none"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`cursor-pointer min-w-8 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                          p === page
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  {/* Next */}
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-medium transition-colors ${
                      page >= totalPages
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer"
                    }`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
