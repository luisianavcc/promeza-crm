// PROMEZA CRM — Icons + small UI helpers

const Icon = ({ name, size = 16, className = "" }) => {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round",
    className: "i " + className,
  };
  switch (name) {
    case "home": return <svg {...common}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case "users": return <svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 19c0-2.5-2-4.5-5-4.5"/></svg>;
    case "building": return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-3h4v3"/></svg>;
    case "map": return <svg {...common}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>;
    case "search": return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "plus": return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "phone": return <svg {...common}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>;
    case "mail": return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case "globe": return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case "pin": return <svg {...common}><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case "calendar": return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case "tag": return <svg {...common}><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>;
    case "more": return <svg {...common}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>;
    case "settings": return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case "chev-down": return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case "chev-right": return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case "x": return <svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case "ig": return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".7" fill="currentColor"/></svg>;
    case "fb": return <svg {...common}><path d="M14 22V13h3l1-4h-4V6.5c0-1.1.4-2 2-2h2V1h-3c-3 0-5 1.8-5 5v3H7v4h3v9z"/></svg>;
    case "tt": return <svg {...common}><path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.5 2.5 2.5 4 5 4"/></svg>;
    case "x-tw": return <svg {...common}><path d="M4 4l16 16M20 4 4 20"/></svg>;
    case "link": return <svg {...common}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></svg>;
    case "edit": return <svg {...common}><path d="M4 20h4l11-11-4-4L4 16z"/><path d="M14 5l5 5"/></svg>;
    case "trash": return <svg {...common}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>;
    case "star": return <svg {...common}><path d="m12 3 2.6 5.6 6 .6-4.4 4 1.3 6L12 16l-5.5 3.2 1.3-6L3.4 9.2l6-.6z"/></svg>;
    case "filter": return <svg {...common}><path d="M3 5h18l-7 9v5l-4 2v-7z"/></svg>;
    case "download": return <svg {...common}><path d="M12 3v13M7 11l5 5 5-5"/><path d="M3 20h18"/></svg>;
    case "sync": return <svg {...common}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case "lock": return <svg {...common}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case "log-out": return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case "check": return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>;
    case "alert": return <svg {...common}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "upload": return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
    case "sun": return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>;
    case "copy": return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "git-merge": return <svg {...common}><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M6 8.5v7M8.5 6h5.5a2 2 0 0 1 2 2v3.5M13.5 18H6"/></svg>;
    case "chart": return <svg {...common}><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;
    case "folder": return <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
    case "shield": return <svg {...common}><path d="M12 3l8 4v5c0 4.4-3.3 8.5-8 9.9C7.3 20.5 4 16.4 4 12V7z"/></svg>;
    case "zap": return <svg {...common}><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>;
    default: return null;
  }
};

window.Icon = Icon;

// Helpers
window.fmtRole = (role, t) => t.roles[role] || role;
window.fmtType = (type, t) => t.types[type] || type;
window.initials = (s) => s.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
window.fmtDate = (iso, lang) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) { return iso; }
};
window.fullName = (p) => `${p.first} ${p.last}`;

// CSV export utility
window.exportCSV = (filename, headers, rows) => {
  const escape = (v) => {
    if (v == null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [
    headers.map(h => escape(h.label)).join(","),
    ...rows.map(r => headers.map(h => escape(r[h.key])).join(","))
  ];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
