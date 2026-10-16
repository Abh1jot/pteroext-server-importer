import { jsxs as t, jsx as e } from "react/jsx-runtime";
import { useState as c, useRef as pe, useEffect as j } from "react";
import { useCurrentServerRequired as me, toast as m } from "@pterodactyl/sdk";
const he = () => {
  const r = document.querySelector('meta[name="csrf-token"]');
  return r && r.getAttribute("content") || "";
};
function R(r) {
  return !r || r <= 0 ? "0 B" : r >= 1073741824 ? (r / 1073741824).toFixed(2) + " GB" : r >= 1048576 ? (r / 1048576).toFixed(2) + " MB" : r >= 1024 ? (r / 1024).toFixed(1) + " KB" : r + " B";
}
function ue(r) {
  return !r || r <= 0 ? "0 KB/s" : r >= 1048576 ? (r / 1048576).toFixed(2) + " MB/s" : (r / 1024).toFixed(1) + " KB/s";
}
function fe(r, g = 0, o = 0, d = 0) {
  let l = r;
  if ((l == null || l <= 0) && d > 0 && o > g && (l = Math.round((o - g) / d)), l == null || l < 0) return "--:--";
  if (l < 5) return "A few seconds left";
  if (l < 60) return `${l}s left`;
  const y = Math.floor(l / 60), b = l % 60;
  if (y < 60)
    return `${y}m ${b < 10 ? "0" : ""}${b}s left`;
  const w = Math.floor(y / 60), h = y % 60;
  return `${w}h ${h}m left`;
}
function ve() {
  const r = me(), g = r?.attributes?.identifier || r?.identifier || "", [o, d] = c(1), [l, y] = c(""), [b, w] = c(2022), [h, Y] = c(""), [f, G] = c(""), [P, X] = c(!1), [z, L] = c(!1), [_, k] = c(null), [x, E] = c("/"), [C, Q] = c("/"), [O, ee] = c([]), [te, ie] = c(!1), [M, D] = c(!1), [v, se] = c(!1), [F, W] = c(!1), [H, ne] = c(!0), [A, re] = c(!0), [U, ae] = c(""), [n, V] = c({
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
  }), [K, q] = c(!1), [J, Z] = c(!1), S = pe(null), u = n.status === "scanning" || n.status === "transferring";
  j(() => {
    const i = (s) => {
      u && (s.preventDefault(), s.returnValue = "");
    };
    return window.addEventListener("beforeunload", i), () => window.removeEventListener("beforeunload", i);
  }, [u]);
  const N = async (i, s = {}) => {
    const a = [
      `/api/client/servers/${g}/extensions/server-importer/${i}`,
      `/api/client/servers/${g}/server-importer/${i}`
    ];
    let p = null;
    for (const $ of a)
      try {
        const T = await fetch($, {
          ...s,
          headers: {
            Accept: "application/json",
            "X-CSRF-TOKEN": he(),
            ...s.headers || {}
          }
        });
        if (T.status !== 404)
          return T;
        p = T;
      } catch {
      }
    return p || fetch(a[0], s);
  }, B = async () => {
    if (g)
      try {
        const i = await N("status");
        if (i.ok) {
          const s = await i.json();
          V(s), (s.status === "scanning" || s.status === "transferring") && d(4);
        }
      } catch {
      }
  };
  j(() => {
    B();
    const i = setInterval(() => {
      (n.status === "scanning" || n.status === "transferring" || o === 4) && B();
    }, 1500);
    return () => clearInterval(i);
  }, [g, n.status, o]), j(() => {
    S.current && (S.current.scrollTop = S.current.scrollHeight);
  }, [n.logs]);
  const le = (i) => {
    let s = i.trim();
    if (s.includes("://") && (s = s.split("://")[1]), s = s.split("/")[0], s.includes(":")) {
      const a = s.split(":");
      y(a[0]);
      const p = Number(a[1]);
      p && !isNaN(p) && w(p);
    } else
      y(s);
  }, ce = async () => {
    const i = l.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    if (!i || !h || !f) {
      m.error("Please enter Host, Username, and Password first.");
      return;
    }
    L(!0), k(null);
    try {
      const s = await N("test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: i, port: b, username: h, password: f })
      }), a = await s.json();
      s.ok && a.success ? (k({ success: !0, message: a.message }), m.success("SFTP Connection verified successfully!")) : (k({ success: !1, message: a.message || "Connection failed" }), m.error(a.message || "Failed to connect to SFTP"));
    } catch (s) {
      k({ success: !1, message: s.message || "Network error" }), m.error(s.message || "Network error");
    } finally {
      L(!1);
    }
  }, I = async (i) => {
    if (!l || !h || !f) return;
    const s = l.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    D(!0);
    try {
      const a = await N("list-remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: s, port: b, username: h, password: f, path: i })
      }), p = await a.json();
      a.ok && p.entries ? (ee(p.entries), E(p.current_path || i), ie(!0)) : m.error(p.error || "Failed to list remote directory");
    } catch (a) {
      m.error(a.message || "Error exploring remote files");
    } finally {
      D(!1);
    }
  }, oe = async () => {
    if (!l || !h || !f) {
      m.error("Missing SFTP credentials."), d(1);
      return;
    }
    if (v && !F) {
      m.error("Please confirm destination wiping before proceeding.");
      return;
    }
    const i = l.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    q(!0);
    try {
      const s = await N("start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: i,
          port: b,
          username: h,
          password: f,
          source_path: x,
          target_path: C,
          wipe_target: v,
          overwrite: H,
          exclude_common: A,
          custom_exclusions: U
        })
      }), a = await s.json();
      s.ok && a.success ? (m.success("Migration initiated!"), d(4), a.status && V(a.status)) : m.error(a.message || "Failed to start import.");
    } catch (s) {
      m.error(s.message || "Connection error starting import.");
    } finally {
      q(!1);
    }
  }, de = async () => {
    if (confirm("Are you sure you want to stop this migration transfer?")) {
      Z(!0);
      try {
        const i = await N("cancel", { method: "POST" }), s = await i.json();
        i.ok && (m.info("Cancellation requested."), B());
      } catch {
        m.error("Failed to cancel import.");
      } finally {
        Z(!1);
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
      u && /* @__PURE__ */ t("span", { className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3", children: [
        /* @__PURE__ */ e("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1.5" }),
        n.status === "scanning" ? "Indexing Files..." : `Transfer Active (${n.progress_percent}%)`
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "imp-stepper", children: [
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: `imp-step-item ${o === 1 ? "active" : ""} ${o > 1 ? "completed" : ""}`,
          onClick: () => !u && d(1),
          disabled: u,
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
          className: `imp-step-item ${o === 2 ? "active" : ""} ${o > 2 ? "completed" : ""}`,
          onClick: () => !u && d(2),
          disabled: u,
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
          className: `imp-step-item ${o === 3 ? "active" : ""} ${o > 3 ? "completed" : ""}`,
          onClick: () => !u && d(3),
          disabled: u,
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
          className: `imp-step-item ${o === 4 ? "active" : ""}`,
          onClick: () => d(4),
          children: [
            /* @__PURE__ */ e("span", { className: "imp-step-badge", children: "4" }),
            /* @__PURE__ */ e("span", { children: "Progress" })
          ]
        }
      )
    ] }),
    o === 1 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
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
              value: l,
              onChange: (i) => le(i.target.value)
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
              value: b,
              onChange: (i) => w(Number(i.target.value))
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
              value: h,
              onChange: (i) => Y(i.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "SFTP Password" }),
          /* @__PURE__ */ t("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ e(
              "input",
              {
                type: P ? "text" : "password",
                className: "imp-input",
                placeholder: "Source account password",
                value: f,
                onChange: (i) => G(i.target.value),
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
                onClick: () => X(!P),
                children: P ? "Hide" : "Show"
              }
            )
          ] })
        ] })
      ] }),
      _ && /* @__PURE__ */ e(
        "div",
        {
          className: `imp-alert ${_.success ? "imp-alert-success" : "imp-alert-warning"}`,
          style: { marginTop: 16 },
          children: /* @__PURE__ */ e("span", { children: _.message })
        }
      ),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-secondary",
            onClick: ce,
            disabled: z || !l || !h || !f,
            children: z ? "Testing Connection..." : "Test Connection"
          }
        ),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary",
            onClick: () => d(2),
            disabled: !l || !h || !f,
            children: "Continue to Paths →"
          }
        )
      ] })
    ] }),
    o === 2 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
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
                value: x,
                onChange: (i) => E(i.target.value)
              }
            ),
            /* @__PURE__ */ e(
              "button",
              {
                type: "button",
                className: "imp-btn imp-btn-secondary",
                onClick: () => I(x || "/"),
                disabled: M,
                children: M ? "Loading..." : "Browse"
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
              value: C,
              onChange: (i) => Q(i.target.value)
            }
          ),
          /* @__PURE__ */ t("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: [
            "Path on this server where files will be placed. Usually ",
            /* @__PURE__ */ e("code", { children: "/" }),
            "."
          ] })
        ] })
      ] }),
      te && /* @__PURE__ */ t("div", { style: { marginTop: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, background: "rgba(0,0,0,0.2)" }, children: [
        /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
          /* @__PURE__ */ t("span", { style: { fontSize: "0.8125rem", fontWeight: 600, color: "#f1f5f9" }, children: [
            "Remote Directory: ",
            /* @__PURE__ */ e("code", { children: x })
          ] }),
          x !== "/" && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              className: "imp-btn imp-btn-secondary !text-xs !py-1",
              onClick: () => {
                const i = x.split("/").filter(Boolean);
                i.pop();
                const s = "/" + i.join("/");
                I(s || "/");
              },
              children: "↑ Up One Level"
            }
          )
        ] }),
        /* @__PURE__ */ e("div", { style: { maxHeight: 200, overflowY: "auto" }, children: O.length === 0 ? /* @__PURE__ */ e("div", { style: { fontSize: "0.75rem", color: "#64748b", textAlign: "center", padding: 16 }, children: "No files found or directory is empty." }) : O.map((i, s) => /* @__PURE__ */ t(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderRadius: 6,
              background: s % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              cursor: i.is_dir ? "pointer" : "default"
            },
            onClick: () => {
              i.is_dir && I(i.path);
            },
            children: [
              /* @__PURE__ */ t("span", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem", color: i.is_dir ? "#60a5fa" : "#cbd5e1" }, children: [
                i.is_dir ? /* @__PURE__ */ e("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ e("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) }) : /* @__PURE__ */ t("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                  /* @__PURE__ */ e("path", { d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
                  /* @__PURE__ */ e("polyline", { points: "13 2 13 9 20 9" })
                ] }),
                i.name
              ] }),
              /* @__PURE__ */ e("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: i.is_dir ? "Directory" : R(i.size) })
            ]
          },
          s
        )) })
      ] }),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-secondary", onClick: () => d(1), children: "← Back" }),
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-primary", onClick: () => d(3), children: "Continue to Options →" })
      ] })
    ] }),
    o === 3 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
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
              checked: H,
              onChange: (i) => ne(i.target.checked),
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
              checked: A,
              onChange: (i) => re(i.target.checked),
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
        /* @__PURE__ */ t("label", { className: "imp-checkbox-row", style: { borderColor: v ? "rgba(239, 68, 68, 0.4)" : void 0 }, children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: v,
              onChange: (i) => {
                se(i.target.checked), i.target.checked || W(!1);
              },
              style: { marginTop: 4 }
            }
          ),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("div", { className: "imp-checkbox-title", style: { color: v ? "#f87171" : void 0 }, children: "Wipe Destination Directory Before Import" }),
            /* @__PURE__ */ t("div", { className: "imp-checkbox-desc", children: [
              "Deletes all existing files in ",
              /* @__PURE__ */ e("code", { children: C }),
              " prior to copying. Ideal for clean server migrations."
            ] })
          ] })
        ] }),
        v && /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-warning", style: { margin: 0 }, children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: F,
              onChange: (i) => W(i.target.checked),
              id: "wipeConfirmCheckbox"
            }
          ),
          /* @__PURE__ */ t("label", { htmlFor: "wipeConfirmCheckbox", style: { cursor: "pointer" }, children: [
            "I confirm that existing files in ",
            /* @__PURE__ */ e("strong", { children: C }),
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
              value: U,
              onChange: (i) => ae(i.target.value)
            }
          ),
          /* @__PURE__ */ e("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: "Comma-separated list of wildcard file or folder patterns to exclude." })
        ] })
      ] }),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-secondary", onClick: () => d(2), children: "← Back" }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary",
            onClick: oe,
            disabled: K || v && !F,
            children: K ? "Starting Migration..." : "Start Migration"
          }
        )
      ] })
    ] }),
    o === 4 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
        /* @__PURE__ */ t("h2", { className: "imp-card-title", style: { margin: 0 }, children: [
          /* @__PURE__ */ t("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ e("polyline", { points: "12 6 12 12 16 14" })
          ] }),
          "Transfer Status:  ",
          /* @__PURE__ */ e("span", { style: {
            textTransform: "uppercase",
            color: n.status === "completed" ? "#34d399" : n.status === "failed" ? "#f87171" : "#60a5fa"
          }, children: n.status })
        ] }),
        /* @__PURE__ */ e("div", { children: u ? /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-danger !text-xs !py-1 !px-3",
            onClick: de,
            disabled: J,
            children: J ? "Cancelling..." : "Cancel Transfer"
          }
        ) : /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3",
            onClick: () => d(1),
            children: "Start New Migration →"
          }
        ) })
      ] }),
      (n.status === "failed" || n.status === "cancelled") && /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-warning", style: { marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ t("div", { children: [
          /* @__PURE__ */ e("strong", { children: n.status === "failed" ? "Import Failed:" : "Transfer Stopped:" }),
          " ",
          n.error || (n.status === "failed" ? "An error occurred during transfer." : "Import was stopped by user.")
        ] }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3",
            onClick: () => d(1),
            children: "Try Again →"
          }
        )
      ] }),
      /* @__PURE__ */ e("div", { className: "imp-progress-track", children: /* @__PURE__ */ e(
        "div",
        {
          className: `imp-progress-fill ${n.status === "scanning" ? "scanning" : ""}`,
          style: {
            width: n.status === "scanning" ? void 0 : `${Math.min(100, n.progress_percent || 0)}%`
          }
        }
      ) }),
      /* @__PURE__ */ t("div", { className: "imp-metrics-grid", children: [
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", children: n.status === "scanning" ? "Indexing..." : `${n.progress_percent}%` }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Total Progress" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", children: n.status === "scanning" ? `${n.files_total} Found` : `${n.files_transferred} / ${n.files_total}` }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: n.status === "scanning" ? "Files Discovered" : "Files Processed" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ t("span", { className: "imp-metric-val", children: [
            R(n.bytes_transferred),
            " / ",
            R(n.bytes_total)
          ] }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Data Volume" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", children: ue(n.speed_bytes_sec) }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Transfer Rate" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", style: { color: "#60a5fa" }, children: n.status === "scanning" ? "Calculating..." : fe(n.eta_seconds, n.bytes_transferred, n.bytes_total, n.speed_bytes_sec) }),
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
        /* @__PURE__ */ e("span", { style: { fontFamily: "monospace", color: "#60a5fa", overflow: "hidden", textOverflow: "ellipsis" }, children: n.current_file || "Idle" })
      ] }),
      /* @__PURE__ */ e("div", { className: "imp-terminal", ref: S, children: n.logs && n.logs.length > 0 ? n.logs.map((i, s) => {
        const a = i.includes("ERROR") || i.includes("Failed"), p = i.includes("successfully") || i.includes("completed"), $ = i.includes("Warning") || i.includes("Skipped") || i.includes("Excluded");
        return /* @__PURE__ */ e(
          "div",
          {
            className: `imp-terminal-line ${a ? "error" : p ? "success" : $ ? "warn" : ""}`,
            children: i
          },
          s
        );
      }) : /* @__PURE__ */ e("div", { style: { color: "#64748b" }, children: "Waiting for transfer stream output..." }) })
    ] })
  ] });
}
export {
  ve as default
};
