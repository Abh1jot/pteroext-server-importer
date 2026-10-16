import { jsxs as t, jsx as e } from "react/jsx-runtime";
import { useState as l, useRef as pe, useEffect as Z } from "react";
import { useCurrentServerRequired as me, toast as p } from "@pterodactyl/sdk";
const he = () => {
  const a = document.querySelector('meta[name="csrf-token"]');
  return a && a.getAttribute("content") || "";
};
function B(a) {
  return !a || a <= 0 ? "0 B" : a >= 1073741824 ? (a / 1073741824).toFixed(2) + " GB" : a >= 1048576 ? (a / 1048576).toFixed(2) + " MB" : a >= 1024 ? (a / 1024).toFixed(1) + " KB" : a + " B";
}
function ue(a) {
  return !a || a <= 0 ? "0 KB/s" : a >= 1048576 ? (a / 1048576).toFixed(2) + " MB/s" : (a / 1024).toFixed(1) + " KB/s";
}
function be() {
  const a = me(), v = a?.attributes?.identifier || a?.identifier || "", [c, o] = l(1), [u, j] = l(""), [x, R] = l(2022), [m, Y] = l(""), [h, G] = l(""), [S, X] = l(!1), [z, L] = l(!1), [T, N] = l(null), [g, O] = l("/"), [k, Q] = l("/"), [$, ee] = l([]), [te, ie] = l(!1), [E, M] = l(!1), [f, se] = l(!1), [P, W] = l(!1), [D, ne] = l(!0), [H, re] = l(!0), [A, ae] = l(""), [n, U] = l({
    status: "idle",
    progress_percent: 0,
    files_total: 0,
    files_transferred: 0,
    bytes_total: 0,
    bytes_transferred: 0,
    current_file: "",
    speed_bytes_sec: 0,
    logs: [],
    error: null
  }), [K, q] = l(!1), [J, V] = l(!1), w = pe(null), y = async (i, s = {}) => {
    const r = [
      `/api/client/servers/${v}/extensions/server-importer/${i}`,
      `/api/client/servers/${v}/server-importer/${i}`
    ];
    let d = null;
    for (const I of r)
      try {
        const C = await fetch(I, {
          ...s,
          headers: {
            Accept: "application/json",
            "X-CSRF-TOKEN": he(),
            ...s.headers || {}
          }
        });
        if (C.status !== 404)
          return C;
        d = C;
      } catch {
      }
    return d || fetch(r[0], s);
  }, F = async () => {
    if (v)
      try {
        const i = await y("status");
        if (i.ok) {
          const s = await i.json();
          U(s), (s.status === "scanning" || s.status === "transferring") && o(4);
        }
      } catch {
      }
  };
  Z(() => {
    F();
    const i = setInterval(() => {
      (n.status === "scanning" || n.status === "transferring" || c === 4) && F();
    }, 1500);
    return () => clearInterval(i);
  }, [v, n.status, c]), Z(() => {
    w.current && (w.current.scrollTop = w.current.scrollHeight);
  }, [n.logs]);
  const le = (i) => {
    let s = i.trim();
    if (s.includes("://") && (s = s.split("://")[1]), s = s.split("/")[0], s.includes(":")) {
      const r = s.split(":");
      j(r[0]);
      const d = Number(r[1]);
      d && !isNaN(d) && R(d);
    } else
      j(s);
  }, ce = async () => {
    const i = u.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    if (!i || !m || !h) {
      p.error("Please enter Host, Username, and Password first.");
      return;
    }
    L(!0), N(null);
    try {
      const s = await y("test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: i, port: x, username: m, password: h })
      }), r = await s.json();
      s.ok && r.success ? (N({ success: !0, message: r.message }), p.success("SFTP Connection verified successfully!")) : (N({ success: !1, message: r.message || "Connection failed" }), p.error(r.message || "Failed to connect to SFTP"));
    } catch (s) {
      N({ success: !1, message: s.message || "Network error" }), p.error(s.message || "Network error");
    } finally {
      L(!1);
    }
  }, _ = async (i) => {
    if (!u || !m || !h) return;
    const s = u.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    M(!0);
    try {
      const r = await y("list-remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: s, port: x, username: m, password: h, path: i })
      }), d = await r.json();
      r.ok && d.entries ? (ee(d.entries), O(d.current_path || i), ie(!0)) : p.error(d.error || "Failed to list remote directory");
    } catch (r) {
      p.error(r.message || "Error exploring remote files");
    } finally {
      M(!1);
    }
  }, oe = async () => {
    if (!u || !m || !h) {
      p.error("Missing SFTP credentials."), o(1);
      return;
    }
    if (f && !P) {
      p.error("Please confirm destination wiping before proceeding.");
      return;
    }
    const i = u.replace(/^[a-zA-Z0-9]+:\/\//, "").split("/")[0].split(":")[0].trim();
    q(!0);
    try {
      const s = await y("start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: i,
          port: x,
          username: m,
          password: h,
          source_path: g,
          target_path: k,
          wipe_target: f,
          overwrite: D,
          exclude_common: H,
          custom_exclusions: A
        })
      }), r = await s.json();
      s.ok && r.success ? (p.success("Migration initiated!"), o(4), r.status && U(r.status)) : p.error(r.message || "Failed to start import.");
    } catch (s) {
      p.error(s.message || "Connection error starting import.");
    } finally {
      q(!1);
    }
  }, de = async () => {
    if (confirm("Are you sure you want to stop this migration transfer?")) {
      V(!0);
      try {
        const i = await y("cancel", { method: "POST" }), s = await i.json();
        i.ok && (p.info("Cancellation requested."), F());
      } catch {
        p.error("Failed to cancel import.");
      } finally {
        V(!1);
      }
    }
  }, b = n.status === "scanning" || n.status === "transferring";
  return /* @__PURE__ */ t("div", { className: "imp-container", children: [
    /* @__PURE__ */ t("div", { className: "imp-header", children: [
      /* @__PURE__ */ t("div", { className: "imp-title-wrap", children: [
        /* @__PURE__ */ t("h1", { className: "imp-title", children: [
          /* @__PURE__ */ t("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ e("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }),
            /* @__PURE__ */ e("line", { x1: "12", y1: "11", x2: "12", y2: "17" }),
            /* @__PURE__ */ e("polyline", { points: "9 14 12 17 15 14" })
          ] }),
          "Server File Importer"
        ] }),
        /* @__PURE__ */ e("p", { className: "imp-subtitle", children: "Seamlessly import worlds, plugins, mods, and complete server files from any external Pterodactyl panel via SFTP." })
      ] }),
      b && /* @__PURE__ */ t("span", { className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3", children: [
        /* @__PURE__ */ e("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1" }),
        "Transfer Active (",
        n.progress_percent,
        "%)"
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "imp-stepper", children: [
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: `imp-step-item ${c === 1 ? "active" : ""} ${c > 1 ? "completed" : ""}`,
          onClick: () => !b && o(1),
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
          className: `imp-step-item ${c === 2 ? "active" : ""} ${c > 2 ? "completed" : ""}`,
          onClick: () => !b && o(2),
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
          className: `imp-step-item ${c === 3 ? "active" : ""} ${c > 3 ? "completed" : ""}`,
          onClick: () => !b && o(3),
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
          className: `imp-step-item ${c === 4 ? "active" : ""}`,
          onClick: () => o(4),
          children: [
            /* @__PURE__ */ e("span", { className: "imp-step-badge", children: "4" }),
            /* @__PURE__ */ e("span", { children: "Live Progress" })
          ]
        }
      )
    ] }),
    c === 1 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("h2", { className: "imp-card-title", children: [
        /* @__PURE__ */ t("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ e("rect", { x: "2", y: "2", width: "20", height: "8", rx: "2", ry: "2" }),
          /* @__PURE__ */ e("rect", { x: "2", y: "14", width: "20", height: "8", rx: "2", ry: "2" }),
          /* @__PURE__ */ e("line", { x1: "6", y1: "6", x2: "6.01", y2: "6" }),
          /* @__PURE__ */ e("line", { x1: "6", y1: "18", x2: "6.01", y2: "18" })
        ] }),
        "Remote Pterodactyl SFTP Credentials"
      ] }),
      /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-info", children: [
        /* @__PURE__ */ t("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ e("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
          /* @__PURE__ */ e("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
        ] }),
        /* @__PURE__ */ t("span", { children: [
          "To find these credentials, log into the source Pterodactyl panel, open your server, and click ",
          /* @__PURE__ */ e("strong", { children: "Settings → SFTP Details" }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ t("div", { className: "imp-grid-2", children: [
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "SFTP Host / IP Address" }),
          /* @__PURE__ */ e(
            "input",
            {
              type: "text",
              className: "imp-input",
              placeholder: "sftp.example.com or 192.168.1.100",
              value: u,
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
              value: x,
              onChange: (i) => R(Number(i.target.value))
            }
          )
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "SFTP Username" }),
          /* @__PURE__ */ e(
            "input",
            {
              type: "text",
              className: "imp-input",
              placeholder: "e.g. username.8b2c4e1",
              value: m,
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
                type: S ? "text" : "password",
                className: "imp-input",
                placeholder: "Source account / SFTP password",
                value: h,
                onChange: (i) => G(i.target.value),
                style: { paddingRight: 40 }
              }
            ),
            /* @__PURE__ */ e(
              "button",
              {
                type: "button",
                onClick: () => X(!S),
                style: {
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer"
                },
                children: S ? "Hide" : "Show"
              }
            )
          ] })
        ] })
      ] }),
      T && /* @__PURE__ */ e("div", { className: `imp-alert ${T.success ? "imp-alert-success" : "imp-alert-error"}`, children: /* @__PURE__ */ e("span", { children: T.message }) }),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }, children: [
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-secondary",
            onClick: ce,
            disabled: z || !u || !m || !h,
            children: z ? "Testing Connection..." : "Test Connection"
          }
        ),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary",
            onClick: () => o(2),
            disabled: !u || !m || !h,
            children: "Continue to Paths →"
          }
        )
      ] })
    ] }),
    c === 2 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("h2", { className: "imp-card-title", children: [
        /* @__PURE__ */ e("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ e("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) }),
        "Migration Directories & Selective Import"
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
                value: g,
                onChange: (i) => O(i.target.value)
              }
            ),
            /* @__PURE__ */ e(
              "button",
              {
                type: "button",
                className: "imp-btn imp-btn-secondary",
                onClick: () => _(g || "/"),
                disabled: E,
                children: E ? "Loading..." : "Browse"
              }
            )
          ] }),
          /* @__PURE__ */ t("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: [
            "Use ",
            /* @__PURE__ */ e("code", { children: "/" }),
            " for entire server, or specific folder like ",
            /* @__PURE__ */ e("code", { children: "/plugins" }),
            " or ",
            /* @__PURE__ */ e("code", { children: "/world" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "Target Destination Path" }),
          /* @__PURE__ */ e(
            "input",
            {
              type: "text",
              className: "imp-input",
              placeholder: "/",
              value: k,
              onChange: (i) => Q(i.target.value)
            }
          ),
          /* @__PURE__ */ t("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: [
            "Local server path where downloaded files will be placed. Usually ",
            /* @__PURE__ */ e("code", { children: "/" }),
            "."
          ] })
        ] })
      ] }),
      te && /* @__PURE__ */ t("div", { style: { marginTop: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, background: "rgba(0,0,0,0.2)" }, children: [
        /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
          /* @__PURE__ */ t("span", { style: { fontSize: "0.8125rem", fontWeight: 600, color: "#f1f5f9" }, children: [
            "Remote Directory: ",
            /* @__PURE__ */ e("code", { children: g })
          ] }),
          g !== "/" && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              className: "imp-btn imp-btn-secondary !text-xs !py-1",
              onClick: () => {
                const i = g.split("/").filter(Boolean);
                i.pop();
                const s = "/" + i.join("/");
                _(s || "/");
              },
              children: "↑ Up One Level"
            }
          )
        ] }),
        /* @__PURE__ */ e("div", { style: { maxHeight: 200, overflowY: "auto" }, children: $.length === 0 ? /* @__PURE__ */ e("div", { style: { fontSize: "0.75rem", color: "#64748b", textAlign: "center", padding: 16 }, children: "No files found or directory is empty." }) : $.map((i, s) => /* @__PURE__ */ t(
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
              i.is_dir && _(i.path);
            },
            children: [
              /* @__PURE__ */ t("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: i.is_dir ? "#60a5fa" : "#cbd5e1" }, children: [
                i.is_dir ? "📁" : "📄",
                " ",
                i.name
              ] }),
              /* @__PURE__ */ e("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: i.is_dir ? "Folder" : B(i.size) })
            ]
          },
          s
        )) })
      ] }),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-secondary", onClick: () => o(1), children: "← Back" }),
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-primary", onClick: () => o(3), children: "Continue to Options →" })
      ] })
    ] }),
    c === 3 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("h2", { className: "imp-card-title", children: [
        /* @__PURE__ */ t("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ e("line", { x1: "4", y1: "21", x2: "4", y2: "14" }),
          /* @__PURE__ */ e("line", { x1: "4", y1: "10", x2: "4", y2: "3" }),
          /* @__PURE__ */ e("line", { x1: "12", y1: "21", x2: "12", y2: "12" }),
          /* @__PURE__ */ e("line", { x1: "12", y1: "8", x2: "12", y2: "3" }),
          /* @__PURE__ */ e("line", { x1: "20", y1: "21", x2: "20", y2: "16" }),
          /* @__PURE__ */ e("line", { x1: "20", y1: "12", x2: "20", y2: "3" }),
          /* @__PURE__ */ e("line", { x1: "1", y1: "14", x2: "7", y2: "14" }),
          /* @__PURE__ */ e("line", { x1: "9", y1: "8", x2: "15", y2: "8" }),
          /* @__PURE__ */ e("line", { x1: "17", y1: "16", x2: "23", y2: "16" })
        ] }),
        "Migration & Overwrite Settings"
      ] }),
      /* @__PURE__ */ t("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
        /* @__PURE__ */ t("label", { className: "imp-checkbox-row", children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: D,
              onChange: (i) => ne(i.target.checked),
              style: { marginTop: 4 }
            }
          ),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("div", { className: "imp-checkbox-title", children: "Overwrite Existing Files" }),
            /* @__PURE__ */ e("div", { className: "imp-checkbox-desc", children: "Replace any files on this server if they already exist with the same name." })
          ] })
        ] }),
        /* @__PURE__ */ t("label", { className: "imp-checkbox-row", children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: H,
              onChange: (i) => re(i.target.checked),
              style: { marginTop: 4 }
            }
          ),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("div", { className: "imp-checkbox-title", children: "Exclude Temporary & Log Files (Recommended)" }),
            /* @__PURE__ */ t("div", { className: "imp-checkbox-desc", children: [
              "Skips ",
              /* @__PURE__ */ e("code", { children: "*.log" }),
              ", ",
              /* @__PURE__ */ e("code", { children: "crash-reports/" }),
              ", ",
              /* @__PURE__ */ e("code", { children: "backups/" }),
              ", ",
              /* @__PURE__ */ e("code", { children: "cache/" }),
              ", and ",
              /* @__PURE__ */ e("code", { children: "session.lock" }),
              " to optimize transfer speed and prevent file lock conflicts."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ t("label", { className: "imp-checkbox-row", style: { borderColor: f ? "rgba(239, 68, 68, 0.4)" : void 0 }, children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: f,
              onChange: (i) => {
                se(i.target.checked), i.target.checked || W(!1);
              },
              style: { marginTop: 4 }
            }
          ),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("div", { className: "imp-checkbox-title", style: { color: f ? "#f87171" : void 0 }, children: "Wipe Destination Directory Before Import" }),
            /* @__PURE__ */ t("div", { className: "imp-checkbox-desc", children: [
              "Deletes all existing files in target path (",
              /* @__PURE__ */ e("code", { children: k }),
              ") prior to starting. Useful for clean full-server moves."
            ] })
          ] })
        ] }),
        f && /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-warning", style: { margin: 0 }, children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: P,
              onChange: (i) => W(i.target.checked),
              id: "wipeConfirmCheckbox"
            }
          ),
          /* @__PURE__ */ t("label", { htmlFor: "wipeConfirmCheckbox", style: { cursor: "pointer" }, children: [
            "I understand that existing files in ",
            /* @__PURE__ */ e("strong", { children: k }),
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
              value: A,
              onChange: (i) => ae(i.target.value)
            }
          ),
          /* @__PURE__ */ e("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: "Comma-separated list of file or directory patterns to exclude from migration." })
        ] })
      ] }),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ e("button", { type: "button", className: "imp-btn imp-btn-secondary", onClick: () => o(2), children: "← Back" }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary",
            onClick: oe,
            disabled: K || f && !P,
            children: K ? "Starting Migration..." : "Start Server Migration 🚀"
          }
        )
      ] })
    ] }),
    c === 4 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
        /* @__PURE__ */ t("h2", { className: "imp-card-title", style: { margin: 0 }, children: [
          /* @__PURE__ */ t("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ e("polyline", { points: "12 6 12 12 16 14" })
          ] }),
          "Migration Pipeline Status:  ",
          /* @__PURE__ */ e("span", { style: {
            textTransform: "uppercase",
            color: n.status === "completed" ? "#34d399" : n.status === "failed" ? "#f87171" : "#60a5fa"
          }, children: n.status })
        ] }),
        /* @__PURE__ */ e("div", { children: b ? /* @__PURE__ */ e(
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
            onClick: () => o(1),
            children: "Start New Migration →"
          }
        ) })
      ] }),
      (n.status === "failed" || n.status === "cancelled") && /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-warning", style: { marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ t("div", { children: [
          /* @__PURE__ */ e("strong", { children: n.status === "failed" ? "Import Failed:" : "Transfer Stopped:" }),
          " ",
          n.error || (n.status === "failed" ? "An unexpected error occurred during transfer." : "Import was stopped by user.")
        ] }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3",
            onClick: () => o(1),
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
            B(n.bytes_transferred),
            " / ",
            B(n.bytes_total)
          ] }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Data Volume" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", children: ue(n.speed_bytes_sec) }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Transfer Rate" })
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
      /* @__PURE__ */ e("div", { className: "imp-terminal", ref: w, children: n.logs && n.logs.length > 0 ? n.logs.map((i, s) => {
        const r = i.includes("ERROR") || i.includes("Failed"), d = i.includes("successfully") || i.includes("completed"), I = i.includes("Warning") || i.includes("Excluded");
        return /* @__PURE__ */ e(
          "div",
          {
            className: `imp-terminal-line ${r ? "error" : d ? "success" : I ? "warn" : ""}`,
            children: i
          },
          s
        );
      }) : /* @__PURE__ */ e("div", { style: { color: "#64748b" }, children: "Waiting for transfer stream output..." }) })
    ] })
  ] });
}
export {
  be as default
};
