import { useEffect, useState, useMemo } from "react";
import AppLayout from "../../components/AppLayout";
import AlertBanner from "../../components/ui/AlertBanner";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../api/axios";

export default function AttendanceOverview() {
  const [students,    setStudents]    = useState([]);
  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState("name"); // "name" | "pct" | "present"

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      api.get("/admin/students",   { headers }),
      api.get("/admin/attendance", { headers }),
    ])
      .then(([sRes, aRes]) => {
        setStudents(sRes.data);
        setRecords(aRes.data);
      })
      .catch(() => setError("Failed to load attendance data."))
      .finally(() => setLoading(false));
  }, []);

  // Compute per-student stats
  const stats = useMemo(() => {
    // Group records by student_id
    const byStudent = {};
    records.forEach((r) => {
      if (!byStudent[r.student_id]) byStudent[r.student_id] = { present: 0, total: 0 };
      byStudent[r.student_id].total += 1;
      if (r.status === "present") byStudent[r.student_id].present += 1;
    });

    return students.map((s) => {
      const entry  = byStudent[s.id] || { present: 0, total: 0 };
      const pct    = entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0;
      return { ...s, present: entry.present, total: entry.total, pct };
    });
  }, [students, records]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = stats.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.rollNumber && String(s.rollNumber).includes(search))
    );
    if (sortBy === "pct")     list = [...list].sort((a, b) => b.pct - a.pct);
    if (sortBy === "name")    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "present") list = [...list].sort((a, b) => b.present - a.present);
    return list;
  }, [stats, search, sortBy]);

  // Aggregate summary
  const totalStudents = students.length;
  const avgPct = stats.length
    ? Math.round(stats.reduce((sum, s) => sum + s.pct, 0) / stats.length)
    : 0;
  const highAttendance = stats.filter((s) => s.pct >= 75).length;
  const lowAttendance  = stats.filter((s) => s.pct < 50 && s.total > 0).length;

  const pctColor = (pct) => {
    if (pct >= 75) return "text-emerald-400";
    if (pct >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const barColor = (pct) => {
    if (pct >= 75) return "from-emerald-500 to-emerald-400";
    if (pct >= 50) return "from-yellow-500 to-yellow-400";
    return "from-red-500 to-red-400";
  };

  const badgeStyle = (pct) => {
    if (pct >= 75)
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.15)]";
    if (pct >= 50)
      return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
    if (pct > 0)
      return "bg-red-500/15 text-red-400 border border-red-500/30";
    return "bg-[var(--color-surface2)] text-[#64748B] border border-[var(--color-border)]";
  };

  return (
    <AppLayout role="admin" pageTitle="Attendance">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gradient mb-1 tracking-tight">
          Attendance Overview
        </h1>
        <p className="text-[#64748B] text-sm">
          Student attendance percentages synced from Google Sheets
        </p>
      </div>

      {error && (
        <div className="mb-5">
          <AlertBanner variant="error" onClose={() => setError("")}>{error}</AlertBanner>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Students", value: totalStudents, icon: "👥", color: "text-[#0EA5E9]" },
          { label: "Avg Attendance", value: `${avgPct}%`,  icon: "📊", color: "text-purple-400" },
          { label: "≥ 75% Attendance", value: highAttendance, icon: "✅", color: "text-emerald-400" },
          { label: "< 50% Attendance", value: lowAttendance,  icon: "⚠️", color: "text-red-400" },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            className="card p-4 border-[var(--color-border)] hover-lift shadow-sm flex flex-col gap-1"
          >
            <span className="text-lg">{icon}</span>
            <span className={`text-2xl font-extrabold ${color}`}>{loading ? "—" : value}</span>
            <span className="text-[#64748B] text-[11px] font-semibold uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="dart-input pl-9 py-2 text-sm w-full"
            placeholder="Search by name, email or roll number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 p-1 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-xl w-fit shadow-sm flex-shrink-0">
          {[["name", "Name"], ["pct", "% High→Low"], ["present", "Days Present"]].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setSortBy(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                sortBy === v
                  ? "bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                  : "text-[#94A3B8] hover:text-[#0EA5E9] hover:bg-[var(--color-hover)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden hover-lift border-[#0EA5E9]/20 shadow-[0_4px_20px_rgba(14,165,233,0.05)]">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-14 rounded-lg bg-[var(--color-surface2)] border border-[var(--color-border)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState
              icon="📋"
              title={search ? "No matches found" : "No students registered"}
              message={search ? "Try a different search term." : "Students will appear here once registered."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface2)] to-transparent">
                  <th className="text-left py-4 px-5 text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest">#</th>
                  <th className="text-left py-4 px-5 text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest">Student</th>
                  <th className="text-left py-4 px-5 text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest hidden sm:table-cell">Roll No.</th>
                  <th className="text-left py-4 px-5 text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest hidden md:table-cell">Email</th>
                  <th className="text-center py-4 px-5 text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest">Days</th>
                  <th className="py-4 px-5 text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest" style={{ minWidth: 160 }}>Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="dart-tr group hover:bg-[var(--color-hover)] transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3 px-5 text-[#475569] text-xs font-mono">{idx + 1}</td>

                    {/* Student */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm border transition-all duration-300 ${
                          s.pct >= 75
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-[0_0_10px_rgba(52,211,153,0.4)] border-emerald-400"
                            : s.pct >= 50
                            ? "bg-gradient-to-br from-yellow-500 to-yellow-400 text-white border-yellow-400"
                            : s.pct > 0
                            ? "bg-gradient-to-br from-red-500 to-red-400 text-white border-red-400"
                            : "bg-[var(--color-surface2)] text-[#64748B] border-[var(--color-border)] group-hover:border-[#0EA5E9]/50"
                        }`}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[var(--color-text-main)] group-hover:text-[#0EA5E9] transition-colors truncate max-w-[140px]">
                          {s.name}
                        </span>
                      </div>
                    </td>

                    {/* Roll No */}
                    <td className="py-3 px-5 text-[#64748b] text-xs font-mono hidden sm:table-cell">
                      {s.rollNumber || "—"}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-5 text-[#64748b] text-xs font-mono hidden md:table-cell truncate max-w-[200px]">
                      {s.email}
                    </td>

                    {/* Days */}
                    <td className="py-3 px-5 text-center">
                      <span className={`text-xs font-bold font-mono ${pctColor(s.pct)}`}>
                        {s.present}<span className="text-[#475569] font-normal">/{s.total || "—"}</span>
                      </span>
                    </td>

                    {/* Progress bar + badge */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface2)] border border-[var(--color-border)] overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${barColor(s.pct)} transition-all duration-700`}
                            style={{ width: `${s.pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-extrabold font-mono px-2 py-0.5 rounded-md ${badgeStyle(s.pct)}`}>
                          {s.total > 0 ? `${s.pct}%` : "N/A"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-[11px] text-[#64748B]">
        <span className="font-semibold uppercase tracking-widest">Legend:</span>
        {[
          { color: "bg-emerald-400", label: "≥ 75% — Good" },
          { color: "bg-yellow-400",  label: "50–74% — At Risk" },
          { color: "bg-red-400",     label: "< 50% — Low" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} />
            {label}
          </span>
        ))}
      </div>
    </AppLayout>
  );
}
