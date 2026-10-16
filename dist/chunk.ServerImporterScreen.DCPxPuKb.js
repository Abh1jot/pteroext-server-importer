import { jsxs as t, jsx as e } from "react/jsx-runtime";
import { useState as a, useRef as oe, useEffect as K } from "react";
import { useCurrentServerRequired as de, toast as c } from "@pterodactyl/sdk";
const b = () => {
  const n = document.querySelector('meta[name="csrf-token"]');
  return n && n.getAttribute("content") || "";
};
function F(n) {
  return !n || n <= 0 ? "0 B" : n >= 1073741824 ? (n / 1073741824).toFixed(2) + " GB" : n >= 1048576 ? (n / 1048576).toFixed(2) + " MB" : n >= 1024 ? (n / 1024).toFixed(1) + " KB" : n + " B";
}
function pe(n) {
  return !n || n <= 0 ? "0 KB/s" : n >= 1048576 ? (n / 1048576).toFixed(2) + " MB/s" : (n / 1024).toFixed(1) + " KB/s";
}
function fe() {
  const n = de(), h = n?.attributes?.identifier || n?.identifier || "", [l, o] = a(1), [d, U] = a(""), [v, X] = a(2022), [p, q] = a(""), [m, J] = a(""), [w, V] = a(!1), [j, _] = a(!1), [C, x] = a(null), [f, R] = a("/"), [N, Y] = a("/"), [B, G] = a([]), [Q, Z] = a(!1), [I, O] = a(!1), [u, ee] = a(!1), [S, L] = a(!1), [E, te] = a(!0), [$, ie] = a(!0), [z, se] = a(""), [r, M] = a({
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
  }), [W, D] = a(!1), [A, H] = a(!1), k = oe(null), T = async () => {
    if (h)
      try {
        const i = await fetch(`/api/client/servers/${h}/extensions/server-importer/status`, {
          headers: {
            Accept: "application/json",
            "X-CSRF-TOKEN": b()
          }
        });
        if (i.ok) {
          const s = await i.json();
          M(s), (s.status === "scanning" || s.status === "transferring") && o(4);
        }
      } catch {
      }
  };
  K(() => {
    T();
    const i = setInterval(() => {
      (r.status === "scanning" || r.status === "transferring" || l === 4) && T();
    }, 1500);
    return () => clearInterval(i);
  }, [h, r.status, l]), K(() => {
    k.current && (k.current.scrollTop = k.current.scrollHeight);
  }, [r.logs]);
  const ne = async () => {
    if (!d || !p || !m) {
      c.error("Please enter Host, Username, and Password first.");
      return;
    }
    _(!0), x(null);
    try {
      const i = await fetch(`/api/client/servers/${h}/extensions/server-importer/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN": b()
        },
        body: JSON.stringify({ host: d, port: v, username: p, password: m })
      }), s = await i.json();
      i.ok && s.success ? (x({ success: !0, message: s.message }), c.success("SFTP Connection verified successfully!")) : (x({ success: !1, message: s.message || "Connection failed" }), c.error(s.message || "Failed to connect to SFTP"));
    } catch (i) {
      x({ success: !1, message: i.message || "Network error" }), c.error(i.message || "Network error");
    } finally {
      _(!1);
    }
  }, P = async (i) => {
    if (!(!d || !p || !m)) {
      O(!0);
      try {
        const s = await fetch(`/api/client/servers/${h}/extensions/server-importer/list-remote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN": b()
          },
          body: JSON.stringify({ host: d, port: v, username: p, password: m, path: i })
        }), g = await s.json();
        s.ok && g.entries ? (G(g.entries), R(g.current_path || i), Z(!0)) : c.error(g.error || "Failed to list remote directory");
      } catch (s) {
        c.error(s.message || "Error exploring remote files");
      } finally {
        O(!1);
      }
    }
  }, re = async () => {
    if (!d || !p || !m) {
      c.error("Missing SFTP credentials."), o(1);
      return;
    }
    if (u && !S) {
      c.error("Please confirm destination wiping before proceeding.");
      return;
    }
    D(!0);
    try {
      const i = await fetch(`/api/client/servers/${h}/extensions/server-importer/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN": b()
        },
        body: JSON.stringify({
          host: d,
          port: v,
          username: p,
          password: m,
          source_path: f,
          target_path: N,
          wipe_target: u,
          overwrite: E,
          exclude_common: $,
          custom_exclusions: z
        })
      }), s = await i.json();
      i.ok && s.success ? (c.success("Migration initiated!"), o(4), s.status && M(s.status)) : c.error(s.message || "Failed to start import.");
    } catch (i) {
      c.error(i.message || "Connection error starting import.");
    } finally {
      D(!1);
    }
  }, ae = async () => {
    if (confirm("Are you sure you want to stop this migration transfer?")) {
      H(!0);
      try {
        const i = await fetch(`/api/client/servers/${h}/extensions/server-importer/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN": b()
          }
        }), s = await i.json();
        i.ok && (c.info("Cancellation requested."), T());
      } catch {
        c.error("Failed to cancel import.");
      } finally {
        H(!1);
      }
    }
  }, y = r.status === "scanning" || r.status === "transferring";
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
      y && /* @__PURE__ */ t("span", { className: "imp-btn imp-btn-primary !text-xs !py-1 !px-3", children: [
        /* @__PURE__ */ e("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1" }),
        "Transfer Active (",
        r.progress_percent,
        "%)"
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "imp-stepper", children: [
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: `imp-step-item ${l === 1 ? "active" : ""} ${l > 1 ? "completed" : ""}`,
          onClick: () => !y && o(1),
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
          className: `imp-step-item ${l === 2 ? "active" : ""} ${l > 2 ? "completed" : ""}`,
          onClick: () => !y && o(2),
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
          className: `imp-step-item ${l === 3 ? "active" : ""} ${l > 3 ? "completed" : ""}`,
          onClick: () => !y && o(3),
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
          className: `imp-step-item ${l === 4 ? "active" : ""}`,
          onClick: () => o(4),
          children: [
            /* @__PURE__ */ e("span", { className: "imp-step-badge", children: "4" }),
            /* @__PURE__ */ e("span", { children: "Live Progress" })
          ]
        }
      )
    ] }),
    l === 1 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
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
              value: d,
              onChange: (i) => U(i.target.value)
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
              value: v,
              onChange: (i) => X(Number(i.target.value))
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
              value: p,
              onChange: (i) => q(i.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-field", children: [
          /* @__PURE__ */ e("label", { className: "imp-label", children: "SFTP Password" }),
          /* @__PURE__ */ t("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ e(
              "input",
              {
                type: w ? "text" : "password",
                className: "imp-input",
                placeholder: "Source account / SFTP password",
                value: m,
                onChange: (i) => J(i.target.value),
                style: { paddingRight: 40 }
              }
            ),
            /* @__PURE__ */ e(
              "button",
              {
                type: "button",
                onClick: () => V(!w),
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
                children: w ? "Hide" : "Show"
              }
            )
          ] })
        ] })
      ] }),
      C && /* @__PURE__ */ e("div", { className: `imp-alert ${C.success ? "imp-alert-success" : "imp-alert-error"}`, children: /* @__PURE__ */ e("span", { children: C.message }) }),
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }, children: [
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-secondary",
            onClick: ne,
            disabled: j || !d || !p || !m,
            children: j ? "Testing Connection..." : "Test Connection"
          }
        ),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-primary",
            onClick: () => o(2),
            disabled: !d || !p || !m,
            children: "Continue to Paths →"
          }
        )
      ] })
    ] }),
    l === 2 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
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
                value: f,
                onChange: (i) => R(i.target.value)
              }
            ),
            /* @__PURE__ */ e(
              "button",
              {
                type: "button",
                className: "imp-btn imp-btn-secondary",
                onClick: () => P(f || "/"),
                disabled: I,
                children: I ? "Loading..." : "Browse"
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
              value: N,
              onChange: (i) => Y(i.target.value)
            }
          ),
          /* @__PURE__ */ t("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: [
            "Local server path where downloaded files will be placed. Usually ",
            /* @__PURE__ */ e("code", { children: "/" }),
            "."
          ] })
        ] })
      ] }),
      Q && /* @__PURE__ */ t("div", { style: { marginTop: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, background: "rgba(0,0,0,0.2)" }, children: [
        /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
          /* @__PURE__ */ t("span", { style: { fontSize: "0.8125rem", fontWeight: 600, color: "#f1f5f9" }, children: [
            "Remote Directory: ",
            /* @__PURE__ */ e("code", { children: f })
          ] }),
          f !== "/" && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              className: "imp-btn imp-btn-secondary !text-xs !py-1",
              onClick: () => {
                const i = f.split("/").filter(Boolean);
                i.pop();
                const s = "/" + i.join("/");
                P(s || "/");
              },
              children: "↑ Up One Level"
            }
          )
        ] }),
        /* @__PURE__ */ e("div", { style: { maxHeight: 200, overflowY: "auto" }, children: B.length === 0 ? /* @__PURE__ */ e("div", { style: { fontSize: "0.75rem", color: "#64748b", textAlign: "center", padding: 16 }, children: "No files found or directory is empty." }) : B.map((i, s) => /* @__PURE__ */ t(
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
              i.is_dir && P(i.path);
            },
            children: [
              /* @__PURE__ */ t("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: i.is_dir ? "#60a5fa" : "#cbd5e1" }, children: [
                i.is_dir ? "📁" : "📄",
                " ",
                i.name
              ] }),
              /* @__PURE__ */ e("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: i.is_dir ? "Folder" : F(i.size) })
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
    l === 3 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
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
              checked: E,
              onChange: (i) => te(i.target.checked),
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
              checked: $,
              onChange: (i) => ie(i.target.checked),
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
        /* @__PURE__ */ t("label", { className: "imp-checkbox-row", style: { borderColor: u ? "rgba(239, 68, 68, 0.4)" : void 0 }, children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: u,
              onChange: (i) => {
                ee(i.target.checked), i.target.checked || L(!1);
              },
              style: { marginTop: 4 }
            }
          ),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("div", { className: "imp-checkbox-title", style: { color: u ? "#f87171" : void 0 }, children: "Wipe Destination Directory Before Import" }),
            /* @__PURE__ */ t("div", { className: "imp-checkbox-desc", children: [
              "Deletes all existing files in target path (",
              /* @__PURE__ */ e("code", { children: N }),
              ") prior to starting. Useful for clean full-server moves."
            ] })
          ] })
        ] }),
        u && /* @__PURE__ */ t("div", { className: "imp-alert imp-alert-warning", style: { margin: 0 }, children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              checked: S,
              onChange: (i) => L(i.target.checked),
              id: "wipeConfirmCheckbox"
            }
          ),
          /* @__PURE__ */ t("label", { htmlFor: "wipeConfirmCheckbox", style: { cursor: "pointer" }, children: [
            "I understand that existing files in ",
            /* @__PURE__ */ e("strong", { children: N }),
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
              value: z,
              onChange: (i) => se(i.target.value)
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
            onClick: re,
            disabled: W || u && !S,
            children: W ? "Starting Migration..." : "Start Server Migration 🚀"
          }
        )
      ] })
    ] }),
    l === 4 && /* @__PURE__ */ t("div", { className: "imp-card", children: [
      /* @__PURE__ */ t("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
        /* @__PURE__ */ t("h2", { className: "imp-card-title", style: { margin: 0 }, children: [
          /* @__PURE__ */ t("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "#60a5fa", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ e("polyline", { points: "12 6 12 12 16 14" })
          ] }),
          "Migration Pipeline Status:  ",
          /* @__PURE__ */ e("span", { style: {
            textTransform: "uppercase",
            color: r.status === "completed" ? "#34d399" : r.status === "failed" ? "#f87171" : "#60a5fa"
          }, children: r.status })
        ] }),
        /* @__PURE__ */ e("div", { children: y ? /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-danger !text-xs !py-1 !px-3",
            onClick: ae,
            disabled: A,
            children: A ? "Cancelling..." : "Cancel Transfer"
          }
        ) : /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "imp-btn imp-btn-secondary !text-xs !py-1 !px-3",
            onClick: () => o(1),
            children: "New Migration"
          }
        ) })
      ] }),
      /* @__PURE__ */ e("div", { className: "imp-progress-track", children: /* @__PURE__ */ e(
        "div",
        {
          className: "imp-progress-fill",
          style: { width: `${Math.min(100, r.progress_percent || 0)}%` }
        }
      ) }),
      /* @__PURE__ */ t("div", { className: "imp-metrics-grid", children: [
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ t("span", { className: "imp-metric-val", children: [
            r.progress_percent,
            "%"
          ] }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Total Progress" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ t("span", { className: "imp-metric-val", children: [
            r.files_transferred,
            " / ",
            r.files_total
          ] }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Files Processed" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ t("span", { className: "imp-metric-val", children: [
            F(r.bytes_transferred),
            " / ",
            F(r.bytes_total)
          ] }),
          /* @__PURE__ */ e("span", { className: "imp-metric-lbl", children: "Data Volume" })
        ] }),
        /* @__PURE__ */ t("div", { className: "imp-metric-card", children: [
          /* @__PURE__ */ e("span", { className: "imp-metric-val", children: pe(r.speed_bytes_sec) }),
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
        /* @__PURE__ */ e("span", { style: { fontFamily: "monospace", color: "#60a5fa", overflow: "hidden", textOverflow: "ellipsis" }, children: r.current_file || "Idle" })
      ] }),
      /* @__PURE__ */ e("div", { className: "imp-terminal", ref: k, children: r.logs && r.logs.length > 0 ? r.logs.map((i, s) => {
        const g = i.includes("ERROR") || i.includes("Failed"), le = i.includes("successfully") || i.includes("completed"), ce = i.includes("Warning") || i.includes("Excluded");
        return /* @__PURE__ */ e(
          "div",
          {
            className: `imp-terminal-line ${g ? "error" : le ? "success" : ce ? "warn" : ""}`,
            children: i
          },
          s
        );
      }) : /* @__PURE__ */ e("div", { style: { color: "#64748b" }, children: "Waiting for transfer stream output..." }) })
    ] })
  ] });
}
export {
  fe as default
};
