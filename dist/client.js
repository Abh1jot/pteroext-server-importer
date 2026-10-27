await Promise.all(["server-importer.css"].map(file => new Promise((resolve, reject) => {const href = new URL(file, import.meta.url).href;if (document.querySelector('link[href="' + href + '"]')) return resolve();const link = document.createElement('link');link.rel = 'stylesheet';link.href = href;link.onload = () => resolve();link.onerror = () => { link.remove(); reject(new Error('Unable to load extension stylesheet: ' + file)); };document.head.append(link);})));
import { jsxs as t, jsx as e } from "react/jsx-runtime";
import { useState as d, useRef as he, useEffect as _ } from "react";
import { useCurrentServerRequired as te, toast as f, definePterodactylExtension as fe } from "@pterodactyl/sdk";
const ge = () => {
  const i = document.querySelector('meta[name="csrf-token"]');
  return i && i.getAttribute("content") || "";
};
function W(i) {
  return !i || i <= 0 ? "0 B" : i >= 1073741824 ? (i / 1073741824).toFixed(2) + " GB" : i >= 1048576 ? (i / 1048576).toFixed(2) + " MB" : i >= 1024 ? (i / 1024).toFixed(1) + " KB" : i + " B";
}
function be(i) {
  return !i || i <= 0 ? "0 KB/s" : i >= 1048576 ? (i / 1048576).toFixed(2) + " MB/s" : (i / 1024).toFixed(1) + " KB/s";
}
function ye(i, l = 0, a = 0, p = 0) {
  let o = i;
  if ((o == null || o <= 0) && p > 0 && a > l && (o = Math.round((a - l) / p)), o == null || o < 0) return "--:--";
  if (o < 5) return "A few seconds left";
  if (o < 60) return `${o}s left`;
  const v = Math.floor(o / 60), y = o % 60;
  if (v < 60)
    return `${v}m ${y < 10 ? "0" : ""}${y}s left`;
  const m = Math.floor(v / 60), u = v % 60;
  return `${m}h ${u}m left`;
}
function ve() {
  const i = te(), l = i?.attributes?.identifier || i?.identifier || "", [a, p] = d(1), [o, v] = d(""), [y, m] = d(2022), [u, I] = d(""), [g, $] = d(""), [x, N] = d(!1), [L, E] = d(!1), [R, S] = d(null), [w, O] = d("/"), [T, re] = d("/"), [D, ie] = d([]), [ne, se] = d(!1), [A, H] = d(!1), [k, ae] = d(!1), [P, U] = d(!1), [K, oe] = d(!0), [V, le] = d(!0), [q, ce] = d(""), [s, J] = d({
    status: "idle",
    progress_percent: 0,
    files_total: 0,
    files_transferred: 0,
    bytes_total: 0,
    bytes_transferred: 0,
    current_file: "",
    speed_bytes_sec: 0,
    eta_seconds: null,
    logs: [],
    error: null
  }), [Z, G] = d(!1), [Y, X] = d(!1), F = he(null), b = s.status === "scanning" || s.status === "transferring";
  _(() => {
    const r = (n) => {
      b && (n.preventDefault(), n.returnValue = "");
    };
    return window.addEventListener("beforeunload", r), () => window.removeEventListener("beforeunload", r);
  }, [b]);
  const C = async (r, n = {}) => {
    const c = [
      `/api/client/servers/${l}/extensions/server-importer/${r}`,
      `/api/client/servers/${l}/server-importer/${r}`
    ];
    let h = null;
    for (const M of c)
      try {
        const B = await fetch(M, {
          ...n,
          headers: {
            Accept: "application/json",
            "X-CSRF-TOKEN": ge(),
            ...n.headers || {}
          }
        });
        if (B.status !== 404)
          return B;
        h = B;
      } catch {
      }
    return h || fetch(c[0], n);
  }, z = async () => {
    if (l)
      try {
        const r = await C("status");
        if (r.ok) {
          const n = await r.json();
          J(n), (n.status === "scanning" || n.status === "transferring") && p(4);
        }
      } catch {
      }
  };
  _(() => {
    z();
    const r = setInterval(() => {
      (s.status === "scanning" || s.status === "transferring" || a === 4) && z();
    }, 1500);
    return () => clearInterval(r);
  }, [l, s.status, a]), _(() => {
    F.current && (F.current.scrollTop = F.current.scrollHeight);
  }, [s.logs]);
  const de = (r) => {
    let n = r.trim();
    if (n.includes("://") && (n = n.split("://")[1]), n = n.split("/")[0], n.includes(":")) {
      const c = n.split(":");
      v(c[0]);
      const h = Number(c[1]);
      h && !isNaN(h) && m(h);
    } else
      v(n);
  }, pe = async () => {
    const r = o.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    if (!r || !u || !g) {
      f.error("Please enter Host, Username, and Password first.");
      return;
    }
    E(!0), S(null);
    try {
      const n = await C("test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: r, port: y, username: u, password: g })
      }), c = await n.json();
      n.ok && c.success ? (S({ success: !0, message: c.message }), f.success("SFTP Connection verified successfully!")) : (S({ success: !1, message: c.message || "Connection failed" }), f.error(c.message || "Failed to connect to SFTP"));
    } catch (n) {
      S({ success: !1, message: n.message || "Network error" }), f.error(n.message || "Network error");
    } finally {
      E(!1);
    }
  }, j = async (r) => {
    if (!o || !u || !g) return;
    const n = o.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    H(!0);
    try {
      const c = await C("list-remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: n, port: y, username: u, password: g, path: r })
      }), h = await c.json();
      c.ok && h.entries ? (ie(h.entries), O(h.current_path || r), se(!0)) : f.error(h.error || "Failed to list remote directory");
    } catch (c) {
      f.error(c.message || "Error exploring remote files");
    } finally {
      H(!1);
    }
  }, me = async () => {
    if (!o || !u || !g) {
      f.error("Missing SFTP credentials."), p(1);
      return;
    }
    if (k && !P) {
      f.error("Please confirm destination wiping before proceeding.");
      return;
    }
    const r = o.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    G(!0);
    try {
      const n = await C("start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: r,
          port: y,
          username: u,
          password: g,
          source_path: w,
          target_path: T,
          wipe_target: k,
          overwrite: K,
          exclude_common: V,
          custom_exclusions: q
        })
      }), c = await n.json();
      n.ok && c.success ? (f.success("Migration initiated!"), p(4), c.status && J(c.status)) : f.error(c.message || "Failed to start import.");
    } catch (n) {
      f.error(n.message || "Connection error starting import.");
    } finally {
      G(!1);
    }
  }, ue = async () => {
    if (confirm("Are you sure you want to stop this migration transfer?")) {
      X(!0);
      try {
        const r = await C("cancel", { method: "POST" }), n = await r.json();
        r.ok && (f.info("Cancellation requested."), z());
      } catch {
        f.error("Failed to cancel import.");
      } finally {
        X(!1);
      }
    }
  };
  return /* @__PURE__ */ t("div", { className: "imp-container", children: [
    /* @__PURE__ */ t("div", { className: "imp-header", children: [
      /* @__PURE__ */ t("div", { className: "imp-title-wrap", children: [
        /* @__PURE__ */ t("h1", { className: "imp-title", children: [
          /* @__PURE__ */ t("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "#3b82f6", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ e("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
            /* @__PURE__ */ e("polyline", { points: "7 10 12 15 17 10" }),
            /* @__PURE__ */ e("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
          ] }),
          "Server File Importer"
        ] }),
        /* @__PURE__ */ e("p", { className: "imp-subtitle", children: "Direct SFTP file migration for worlds, mods, plugins, and complete server files." })
      ] }),
      b && /* @__PURE__ */ t("span", { className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3", children: [
        /* @__PURE__ */ e("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1.5" }),
        s.status === "scanning" ? "Indexing Files..." : `Transfer Active (${s.progress_percent}%)`
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "imp-stepper", children: [
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: `imp-step-item ${a === 1 ? "active" : ""} ${a > 1 ? "completed" : ""}`,
          onClick: () => !b && p(1),
          disabled: b,
          children: [
            /* @__PURE__ */ e("span", { className: "imp-step-badge", children: "1" }),
            /* @__PURE__ */ e("span", { children: "SFTP Details" })
          ]
        }
      ),
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: `imp-step-item ${a === 2 ? "active" : ""} ${a > 2 ? "completed" : ""}`,
          onClick: () => !b && p(2),
          disabled: b,
          children: [
            /* @__PURE__ */ e("span", { className: "imp-step-badge", children: "2" }),
            /* @__PURE__ */ e("span", { children: "Paths & Files" })
          ]
        }
      ),
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: `imp-step-item ${a === 3 ? "active" : ""} ${a > 3 ? "completed" : ""}`,
          onClick: () => !b && p(3),
          disabled: b,
          children: [
            /* @__PURE__ */ e("span", { className: "imp-step-badge", children: "3" }),
            /* @__PURE__ */ e("span", { children: "Options" })
          ]
        }
      ),
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: `imp-step-item ${a === 4 ? "active" : ""}`,
          onClick: () => p(4),
          children: [
            /* @__PURE__ */ e("span", { className: "imp-step-badge", children: "4" }),
            /* @__PURE__ */ e("span", { children: "Progress" })
          ]
        }
      )
    ] }),
    a === 1 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("h2", { className: "imp-card-title", children: [
        /* @__PURE__ */ t("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ e("rect", { x: "2", y: "2", width: "20", height: "8", rx: "2", ry: "2" }),
          /* @__PURE__ */ e("rect", { x: "2", y: "14", width: "20", height: "8", rx: "2", ry: "2" }),
          /* @__PURE__ */ e("line", { x1: "6", y1: "6", x2: "6.01", y2: "6" }),
          /* @__PURE__ */ e("line", { x1: "6", y1: "18", x2: "6.01", y2: "18" })
        ] }),
        "Remote SFTP Connection"
      ] }),
      /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-info", children: [
        /* @__PURE__ */ t("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ e("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
          /* @__PURE__ */ e("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
        ] }),
        /* @__PURE__ */ t("span", { children: [
          "Enter the SFTP credentials from your source server (under ",
          /* @__PURE__ */ e("strong", { children: "Settings → SFTP Details" }),
          " in the source panel)."
        ] })
      ] }),
      /* @__PURE__ */ t("div", { className: "imp-grid-2", children: [
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "SFTP Host / IP" }),
          /* @__PURE__ */ e(
            "input",
            {
              type: "text",
              className: "imp-input",
              placeholder: "sftp.example.com or 192.168.1.100",
              value: o,
              onChange: (r) => de(r.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "SFTP Port" }),
          /* @__PURE__ */ e(
            "input",
            {
              type: "number",
              className: "imp-input",
              placeholder: "2022",
              value: y,
              onChange: (r) => m(Number(r.target.value))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ t("div", { className: "imp-grid-2", style: { marginTop: 12 }, children: [
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "SFTP Username" }),
          /* @__PURE__ */ e(
            "input",
            {
              type: "text",
              className: "imp-input",
              placeholder: "username.serveruuid",
              value: u,
              onChange: (r) => I(r.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "SFTP Password" }),
          /* @__PURE__ */ t("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ e(
              "input",
              {
                type: x ? "text" : "password",
                className: "imp-input",
                placeholder: "Source account password",
                value: g,
                onChange: (r) => $(r.target.value),
                style: { paddingRight: 60 }
              }
            ),
            /* @__PURE__ */ e(
              "button",
              {
                type: "button",
                style: {
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  cursor: "pointer"
                },
                onClick: () => N(!x),
                children: x ? "Hide" : "Show"
              }
            )
          ] })
        ] })
      ] }),
      R && /* @__PURE__ */ e(
        "div",
        {
          className: `imp-alert ${R.success ? "imp-alert-success" : "imp-alert-warning"}`,
          style: { marginTop: 16 },
          children: /* @__PURE__ */ e("span", { children: R.message })
        }
      ),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-secondary",
            onClick: pe,
            disabled: L || !o || !u || !g,
            children: L ? "Testing Connection..." : "Test Connection"
          }
        ),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary",
            onClick: () => p(2),
            disabled: !o || !u || !g,
            children: "Continue to Paths →"
          }
        )
      ] })
    ] }),
    a === 2 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("h2", { className: "imp-card-title", children: [
        /* @__PURE__ */ e("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ e("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) }),
        "Migration Directory Configuration"
      ] }),
      /* @__PURE__ */ t("div", { className: "imp-grid-2", children: [
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "Remote Source Path" }),
          /* @__PURE__ */ t("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ e(
              "input",
              {
                type: "text",
                className: "imp-input",
                placeholder: "/",
                value: w,
                onChange: (r) => O(r.target.value)
              }
            ),
            /* @__PURE__ */ e(
              "button",
              {
                type: "button",
                className: "imp-btn imp-btn-secondary",
                onClick: () => j(w || "/"),
                disabled: A,
                children: A ? "Loading..." : "Browse"
              }
            )
          ] }),
          /* @__PURE__ */ t("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: [
            "Use ",
            /* @__PURE__ */ e("code", { children: "/" }),
            " for entire server root, or a folder like ",
            /* @__PURE__ */ e("code", { children: "/plugins" }),
            " or ",
            /* @__PURE__ */ e("code", { children: "/world" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "Local Destination Path" }),
          /* @__PURE__ */ e(
            "input",
            {
              type: "text",
              className: "imp-input",
              placeholder: "/",
              value: T,
              onChange: (r) => re(r.target.value)
            }
          ),
          /* @__PURE__ */ t("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: [
            "Path on this server where files will be placed. Usually ",
            /* @__PURE__ */ e("code", { children: "/" }),
            "."
          ] })
        ] })
      ] }),
      ne && /* @__PURE__ */ t("div", { style: { marginTop: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, background: "rgba(0,0,0,0.2)" }, children: [
        /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
          /* @__PURE__ */ t("span", { style: { fontSize: "0.8125rem", fontWeight: 600, color: "#f1f5f9" }, children: [
            "Remote Directory: ",
            /* @__PURE__ */ e("code", { children: w })
          ] }),
          w !== "/" && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              className: "imp-btn imp-btn-secondary !text-xs !py-1",
              onClick: () => {
                const r = w.split("/").filter(Boolean);
                r.pop();
                const n = "/" + r.join("/");
                j(n || "/");
              },
              children: "↑ Up One Level"
            }
          )
        ] }),
        /* @__PURE__ */ e("div", { style: { maxHeight: 200, overflowY: "auto" }, children: D.length === 0 ? /* @__PURE__ */ e("div", { style: { fontSize: "0.75rem", color: "#64748b", textAlign: "center", padding: 16 }, children: "No files found or directory is empty." }) : D.map((r, n) => /* @__PURE__ */ t(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderRadius: 6,
              background: n % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              cursor: r.is_dir ? "pointer" : "default"
            },
            onClick: () => {
              r.is_dir && j(r.path);
            },
            children: [
              /* @__PURE__ */ t("span", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem", color: r.is_dir ? "#60a5fa" : "#cbd5e1" }, children: [
                r.is_dir ? /* @__PURE__ */ e("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ e("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) }) : /* @__PURE__ */ t("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                  /* @__PURE__ */ e("path", { d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
                  /* @__PURE__ */ e("polyline", { points: "13 2 13 9 20 9" })
                ] }),
                r.name
              ] }),
              /* @__PURE__ */ e("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: r.is_dir ? "Directory" : W(r.size) })
            ]
          },
          n
        )) })
      ] }),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-secondary", onClick: () => p(1), children: "← Back" }),
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-primary", onClick: () => p(3), children: "Continue to Options →" })
      ] })
    ] }),
    a === 3 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("h2", { className: "imp-card-title", children: [
        /* @__PURE__ */ t("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ e("line", { x1: "4", y1: "21", x2: "4", y2: "14" }),
          /* @__PURE__ */ e("line", { x1: "4", y1: "10", x2: "4", y2: "3" }),
          /* @__PURE__ */ e("line", { x1: "12", y1: "21", x2: "12", y2: "12" }),
          /* @__PURE__ */ e("line", { x1: "12", y1: "8", x2: "12", y2: "3" }),
          /* @__PURE__ */ e("line", { x1: "20", y1: "21", x2: "20", y2: "16" }),
          /* @__PURE__ */ e("line", { x1: "20", y1: "12", x2: "20", y2: "3" })
        ] }),
        "Transfer Settings"
      ] }),
      /* @__PURE__ */ t("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
        /* @__PURE__ */ t("label", { className: "imp-checkbox-row", children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: K,
              onChange: (r) => oe(r.target.checked),
              style: { marginTop: 4 }
            }
          ),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("div", { className: "imp-checkbox-title", children: "Overwrite Existing Files" }),
            /* @__PURE__ */ e("div", { className: "imp-checkbox-desc", children: "Replace any existing files on this server if they have identical paths." })
          ] })
        ] }),
        /* @__PURE__ */ t("label", { className: "imp-checkbox-row", children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: V,
              onChange: (r) => le(r.target.checked),
              style: { marginTop: 4 }
            }
          ),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("div", { className: "imp-checkbox-title", children: "Exclude System Logs & Caches (Recommended)" }),
            /* @__PURE__ */ t("div", { className: "imp-checkbox-desc", children: [
              "Skips ",
              /* @__PURE__ */ e("code", { children: "*.log" }),
              ", ",
              /* @__PURE__ */ e("code", { children: "crash-reports/" }),
              ", ",
              /* @__PURE__ */ e("code", { children: "backups/" }),
              ", ",
              /* @__PURE__ */ e("code", { children: "cache/" }),
              ", ",
              /* @__PURE__ */ e("code", { children: "libraries/" }),
              ", and lock files to maximize transfer speed."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ t("label", { className: "imp-checkbox-row", style: { borderColor: k ? "rgba(239, 68, 68, 0.4)" : void 0 }, children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: k,
              onChange: (r) => {
                ae(r.target.checked), r.target.checked || U(!1);
              },
              style: { marginTop: 4 }
            }
          ),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("div", { className: "imp-checkbox-title", style: { color: k ? "#f87171" : void 0 }, children: "Wipe Destination Directory Before Import" }),
            /* @__PURE__ */ t("div", { className: "imp-checkbox-desc", children: [
              "Deletes all existing files in ",
              /* @__PURE__ */ e("code", { children: T }),
              " prior to copying. Ideal for clean server migrations."
            ] })
          ] })
        ] }),
        k && /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-warning", style: { margin: 0 }, children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: P,
              onChange: (r) => U(r.target.checked),
              id: "wipeConfirmCheckbox"
            }
          ),
          /* @__PURE__ */ t("label", { htmlFor: "wipeConfirmCheckbox", style: { cursor: "pointer" }, children: [
            "I confirm that existing files in ",
            /* @__PURE__ */ e("strong", { children: T }),
            " will be permanently wiped."
          ] })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-field", style: { marginTop: 8 }, children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "Custom Exclusion Patterns (Optional)" }),
          /* @__PURE__ */ e(
            "input",
            {
              type: "text",
              className: "imp-input",
              placeholder: "e.g. *.tar.gz, dynmap/*, coreprotect/*",
              value: q,
              onChange: (r) => ce(r.target.value)
            }
          ),
          /* @__PURE__ */ e("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: "Comma-separated list of wildcard file or folder patterns to exclude." })
        ] })
      ] }),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-secondary", onClick: () => p(2), children: "← Back" }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary",
            onClick: me,
            disabled: Z || k && !P,
            children: Z ? "Starting Migration..." : "Start Migration"
          }
        )
      ] })
    ] }),
    a === 4 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
        /* @__PURE__ */ t("h2", { className: "imp-card-title", style: { margin: 0 }, children: [
          /* @__PURE__ */ t("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ e("polyline", { points: "12 6 12 12 16 14" })
          ] }),
          "Transfer Status:  ",
          /* @__PURE__ */ e("span", { style: {
            textTransform: "uppercase",
            color: s.status === "completed" ? "#34d399" : s.status === "failed" ? "#f87171" : "#60a5fa"
          }, children: s.status })
        ] }),
        /* @__PURE__ */ e("div", { children: b ? /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-danger !text-xs !py-1 !px-3",
            onClick: ue,
            disabled: Y,
            children: Y ? "Cancelling..." : "Cancel Transfer"
          }
        ) : /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3",
            onClick: () => p(1),
            children: "Start New Migration →"
          }
        ) })
      ] }),
      (s.status === "failed" || s.status === "cancelled") && /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-warning", style: { marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ t("div", { children: [
          /* @__PURE__ */ e("strong", { children: s.status === "failed" ? "Import Failed:" : "Transfer Stopped:" }),
          " ",
          s.error || (s.status === "failed" ? "An error occurred during transfer." : "Import was stopped by user.")
        ] }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3",
            onClick: () => p(1),
            children: "Try Again →"
          }
        )
      ] }),
      /* @__PURE__ */ e("div", { className: "imp-progress-track", children: /* @__PURE__ */ e(
        "div",
        {
          className: `imp-progress-fill ${s.status === "scanning" ? "scanning" : ""}`,
          style: {
            width: s.status === "scanning" ? void 0 : `${Math.min(100, s.progress_percent || 0)}%`
          }
        }
      ) }),
      /* @__PURE__ */ t("div", { className: "imp-metrics-grid", children: [
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", children: s.status === "scanning" ? "Indexing..." : `${s.progress_percent}%` }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Total Progress" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", children: s.status === "scanning" ? `${s.files_total} Found` : `${s.files_transferred} / ${s.files_total}` }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: s.status === "scanning" ? "Files Discovered" : "Files Processed" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ t("span", { className: "imp-metric-val", children: [
            W(s.bytes_transferred),
            " / ",
            W(s.bytes_total)
          ] }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Data Volume" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", children: be(s.speed_bytes_sec) }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Transfer Rate" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", style: { color: "#60a5fa" }, children: s.status === "scanning" ? "Calculating..." : ye(s.eta_seconds, s.bytes_transferred, s.bytes_total, s.speed_bytes_sec) }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Estimated Time" })
        ] })
      ] }),
      /* @__PURE__ */ t("div", { style: {
        padding: "8px 12px",
        background: "rgba(15, 23, 42, 0.6)",
        borderRadius: 6,
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "0.75rem",
        color: "#94a3b8",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis"
      }, children: [
        /* @__PURE__ */ e("strong", { style: { color: "#cbd5e1" }, children: "Current Operation:" }),
        /* @__PURE__ */ e("span", { style: { fontFamily: "monospace", color: "#60a5fa", overflow: "hidden", textOverflow: "ellipsis" }, children: s.current_file || "Idle" })
      ] }),
      /* @__PURE__ */ e("div", { className: "imp-terminal", ref: F, children: s.logs && s.logs.length > 0 ? s.logs.map((r, n) => {
        const c = r.includes("ERROR") || r.includes("Failed"), h = r.includes("successfully") || r.includes("completed"), M = r.includes("Warning") || r.includes("Skipped") || r.includes("Excluded");
        return /* @__PURE__ */ e(
          "div",
          {
            className: `imp-terminal-line ${c ? "error" : h ? "success" : M ? "warn" : ""}`,
            children: r
          },
          n
        );
      }) : /* @__PURE__ */ e("div", { style: { color: "#64748b" }, children: "Waiting for transfer stream output..." }) })
    ] })
  ] });
}
function Q(i) {
  return !i || i <= 0 ? "0 B" : i >= 1073741824 ? (i / 1073741824).toFixed(2) + " GB" : i >= 1048576 ? (i / 1048576).toFixed(2) + " MB" : i >= 1024 ? (i / 1024).toFixed(1) + " KB" : i + " B";
}
function xe(i) {
  return !i || i <= 0 ? "0 KB/s" : i >= 1048576 ? (i / 1048576).toFixed(2) + " MB/s" : (i / 1024).toFixed(1) + " KB/s";
}
function ke(i) {
  if (i == null || i < 0) return "--:--";
  if (i < 5) return "A few seconds left";
  if (i < 60) return `${i}s remaining`;
  const l = Math.floor(i / 60), a = i % 60;
  if (l < 60)
    return `${l}m ${a < 10 ? "0" : ""}${a}s remaining`;
  const p = Math.floor(l / 60), o = l % 60;
  return `${p}h ${o}m remaining`;
}
function ee() {
  const i = te(), l = i?.attributes?.identifier || i?.identifier || "", [a, p] = d(null), o = () => {
    const m = window.location.pathname.toLowerCase();
    return m.endsWith("/import") || m.includes("/import/") || m.includes("/server-importer");
  };
  if (_(() => {
    if (!l) return;
    let m = !0;
    const u = async () => {
      try {
        const g = [
          `/api/client/servers/${l}/extensions/server-importer/status`,
          `/api/client/servers/${l}/server-importer/status`
        ];
        for (const $ of g)
          try {
            const x = await fetch($, {
              headers: { Accept: "application/json" }
            });
            if (x.ok) {
              const N = await x.json();
              m && (p(N), (N.status === "scanning" || N.status === "transferring") && !o() && (window.location.href = `/server/${l}/import`));
              break;
            }
          } catch {
          }
      } catch {
      }
    };
    u();
    const I = setInterval(u, 3e3);
    return () => {
      m = !1, clearInterval(I);
    };
  }, [l]), !(a && (a.status === "scanning" || a.status === "transferring")) || o())
    return null;
  const y = ke(a.eta_seconds);
  return /* @__PURE__ */ e("div", { style: {
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
  }, children: /* @__PURE__ */ t("div", { style: {
    maxWidth: 540,
    width: "100%",
    backgroundColor: "var(--card, rgba(17, 24, 39, 0.95))",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 28,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
    color: "#f8fafc"
  }, children: [
    /* @__PURE__ */ t("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, children: [
      /* @__PURE__ */ t("div", { style: {
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
        /* @__PURE__ */ e("span", { style: {
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#3b82f6",
          display: "inline-block",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        } }),
        a.status === "scanning" ? "Scanning Remote Files" : "Import In Progress"
      ] }),
      /* @__PURE__ */ t("span", { style: { fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }, children: [
        "ID: ",
        l
      ] })
    ] }),
    /* @__PURE__ */ e("h2", { style: { fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }, children: "Server Operations Locked" }),
    /* @__PURE__ */ e("p", { style: { fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 20px" }, children: "Files are actively being imported to this server via SFTP. All console commands, power actions, and file edits are locked to prevent filesystem corruption." }),
    /* @__PURE__ */ e("div", { style: {
      width: "100%",
      height: 10,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 9999,
      overflow: "hidden",
      marginBottom: 16
    }, children: /* @__PURE__ */ e("div", { style: {
      height: "100%",
      width: a.status === "scanning" ? "40%" : `${Math.min(100, a.progress_percent || 0)}%`,
      backgroundColor: "#3b82f6",
      borderRadius: 9999,
      transition: "width 0.3s ease"
    } }) }),
    /* @__PURE__ */ t("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 10,
      marginBottom: 20
    }, children: [
      /* @__PURE__ */ t("div", { style: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 8,
        padding: "10px 12px"
      }, children: [
        /* @__PURE__ */ e("div", { style: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: 2 }, children: "Files" }),
        /* @__PURE__ */ t("div", { style: { fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }, children: [
          a.files_transferred,
          " / ",
          a.files_total
        ] })
      ] }),
      /* @__PURE__ */ t("div", { style: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 8,
        padding: "10px 12px"
      }, children: [
        /* @__PURE__ */ e("div", { style: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: 2 }, children: "Volume" }),
        /* @__PURE__ */ t("div", { style: { fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }, children: [
          Q(a.bytes_transferred),
          " / ",
          Q(a.bytes_total)
        ] })
      ] }),
      /* @__PURE__ */ t("div", { style: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 8,
        padding: "10px 12px"
      }, children: [
        /* @__PURE__ */ e("div", { style: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: 2 }, children: "Speed" }),
        /* @__PURE__ */ e("div", { style: { fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }, children: xe(a.speed_bytes_sec) })
      ] }),
      /* @__PURE__ */ t("div", { style: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 8,
        padding: "10px 12px"
      }, children: [
        /* @__PURE__ */ e("div", { style: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: 2 }, children: "Estimated Time" }),
        /* @__PURE__ */ e("div", { style: { fontSize: "0.9375rem", fontWeight: 600, color: "#60a5fa" }, children: a.status === "scanning" ? "Calculating..." : y })
      ] })
    ] }),
    /* @__PURE__ */ e(
      "a",
      {
        href: `/server/${l}/import`,
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
        onMouseOver: (m) => m.currentTarget.style.backgroundColor = "#1d4ed8",
        onMouseOut: (m) => m.currentTarget.style.backgroundColor = "#2563eb",
        children: "View Import Screen →"
      }
    )
  ] }) });
}
const Se = fe({
  setup({ screens: i, slots: l }) {
    i.register("server-importer", () => Promise.resolve({ default: ve })), l && typeof l.register == "function" && (l.register("server.console.before", ee), l.register("server.console.after", ee));
  }
});
export {
  Se as default
};
