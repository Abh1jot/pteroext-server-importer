await Promise.all(["server-importer.css"].map(file => new Promise((resolve, reject) => {const href = new URL(file, import.meta.url).href;if (document.querySelector('link[href="' + href + '"]')) return resolve();const link = document.createElement('link');link.rel = 'stylesheet';link.href = href;link.onload = () => resolve();link.onerror = () => { link.remove(); reject(new Error('Unable to load extension stylesheet: ' + file)); };document.head.append(link);})));
import { useCurrentServerRequired as b, definePterodactylExtension as x } from "@pterodactyl/sdk";
import { jsx as i, jsxs as n } from "react/jsx-runtime";
import { useState as v, useEffect as y } from "react";
function p(e) {
  return !e || e <= 0 ? "0 B" : e >= 1073741824 ? (e / 1073741824).toFixed(2) + " GB" : e >= 1048576 ? (e / 1048576).toFixed(2) + " MB" : e >= 1024 ? (e / 1024).toFixed(1) + " KB" : e + " B";
}
function k(e) {
  return !e || e <= 0 ? "0 KB/s" : e >= 1048576 ? (e / 1048576).toFixed(2) + " MB/s" : (e / 1024).toFixed(1) + " KB/s";
}
function S(e) {
  if (e == null || e < 0) return "--:--";
  if (e < 5) return "A few seconds left";
  if (e < 60) return `${e}s remaining`;
  const r = Math.floor(e / 60), t = e % 60;
  if (r < 60)
    return `${r}m ${t < 10 ? "0" : ""}${t}s remaining`;
  const a = Math.floor(r / 60), s = r % 60;
  return `${a}h ${s}m remaining`;
}
function u() {
  const e = b(), r = e?.attributes?.identifier || e?.identifier || "", [t, a] = v(null), s = () => {
    const o = window.location.pathname.toLowerCase();
    return o.endsWith("/import") || o.includes("/import/") || o.includes("/server-importer");
  };
  if (y(() => {
    if (!r) return;
    let o = !0;
    const c = async () => {
      try {
        const f = [
          `/api/client/servers/${r}/extensions/server-importer/status`,
          `/api/client/servers/${r}/server-importer/status`
        ];
        for (const h of f)
          try {
            const d = await fetch(h, {
              headers: { Accept: "application/json" }
            });
            if (d.ok) {
              const l = await d.json();
              o && (a(l), (l.status === "scanning" || l.status === "transferring") && !s() && (window.location.href = `/server/${r}/import`));
              break;
            }
          } catch {
          }
      } catch {
      }
    };
    c();
    const m = setInterval(c, 3e3);
    return () => {
      o = !1, clearInterval(m);
    };
  }, [r]), !(t && (t.status === "scanning" || t.status === "transferring")) || s())
    return null;
  const g = S(t.eta_seconds);
  return /* @__PURE__ */ i("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 999999,
    backgroundColor: "rgba(9, 13, 22, 0.95)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
  }, children: /* @__PURE__ */ n("div", { style: {
    maxWidth: 540,
    width: "100%",
    backgroundColor: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 28,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
    color: "#f8fafc"
  }, children: [
    /* @__PURE__ */ n("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, children: [
      /* @__PURE__ */ n("div", { style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px",
        backgroundColor: "rgba(59, 130, 246, 0.12)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        borderRadius: 9999,
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#60a5fa",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }, children: [
        /* @__PURE__ */ i("span", { style: {
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#3b82f6",
          display: "inline-block",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        } }),
        t.status === "scanning" ? "Scanning Remote Files" : "Import In Progress"
      ] }),
      /* @__PURE__ */ n("span", { style: { fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }, children: [
        "ID: ",
        r
      ] })
    ] }),
    /* @__PURE__ */ i("h2", { style: { fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }, children: "Server Operations Locked" }),
    /* @__PURE__ */ i("p", { style: { fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 20px" }, children: "Files are actively being imported to this server via SFTP. All console commands, power actions, and file edits are locked to prevent filesystem corruption." }),
    /* @__PURE__ */ i("div", { style: {
      width: "100%",
      height: 10,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 9999,
      overflow: "hidden",
      marginBottom: 16
    }, children: /* @__PURE__ */ i("div", { style: {
      height: "100%",
      width: t.status === "scanning" ? "40%" : `${Math.min(100, t.progress_percent || 0)}%`,
      backgroundColor: "#3b82f6",
      borderRadius: 9999,
      transition: "width 0.3s ease"
    } }) }),
    /* @__PURE__ */ n("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 10,
      marginBottom: 20
    }, children: [
      /* @__PURE__ */ n("div", { style: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 8,
        padding: "10px 12px"
      }, children: [
        /* @__PURE__ */ i("div", { style: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: 2 }, children: "Files" }),
        /* @__PURE__ */ n("div", { style: { fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }, children: [
          t.files_transferred,
          " / ",
          t.files_total
        ] })
      ] }),
      /* @__PURE__ */ n("div", { style: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 8,
        padding: "10px 12px"
      }, children: [
        /* @__PURE__ */ i("div", { style: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: 2 }, children: "Volume" }),
        /* @__PURE__ */ n("div", { style: { fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }, children: [
          p(t.bytes_transferred),
          " / ",
          p(t.bytes_total)
        ] })
      ] }),
      /* @__PURE__ */ n("div", { style: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 8,
        padding: "10px 12px"
      }, children: [
        /* @__PURE__ */ i("div", { style: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: 2 }, children: "Speed" }),
        /* @__PURE__ */ i("div", { style: { fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }, children: k(t.speed_bytes_sec) })
      ] }),
      /* @__PURE__ */ n("div", { style: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 8,
        padding: "10px 12px"
      }, children: [
        /* @__PURE__ */ i("div", { style: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: 2 }, children: "Estimated Time" }),
        /* @__PURE__ */ i("div", { style: { fontSize: "0.9375rem", fontWeight: 600, color: "#60a5fa" }, children: t.status === "scanning" ? "Calculating..." : g })
      ] })
    ] }),
    /* @__PURE__ */ i(
      "a",
      {
        href: `/server/${r}/import`,
        style: {
          display: "block",
          textAlign: "center",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          fontWeight: 600,
          fontSize: "0.875rem",
          padding: "10px 16px",
          borderRadius: 8,
          textDecoration: "none",
          transition: "background-color 0.2s"
        },
        onMouseOver: (o) => o.currentTarget.style.backgroundColor = "#1d4ed8",
        onMouseOut: (o) => o.currentTarget.style.backgroundColor = "#2563eb",
        children: "View Import Screen →"
      }
    )
  ] }) });
}
const I = x({
  setup({ screens: e, slots: r }) {
    e.register("server-importer", () => import("./chunk.ServerImporterScreen.DLFpD35h.js")), r && typeof r.register == "function" && (r.register("server.console.before", u), r.register("server.console.after", u));
  }
});
export {
  I as default
};
