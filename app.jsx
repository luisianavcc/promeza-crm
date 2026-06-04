// PROMEZA CRM — App root with auth + settings modal

const { useState, useMemo, useEffect, useRef } = React;

// ─── Settings Modal ───

const SettingsModal = ({ t, lang, data, cryptoKey, onClose, onLogout, onRestoreData }) => {
  const [ejsCfg, setEjsCfg] = useState(() => {
    try { return JSON.parse(localStorage.getItem("promeza_ejs")) || {}; } catch { return {}; }
  });
  const [atCfg, setAtCfg] = useState(() => window.AIRTABLE.getConfig());
  const [syncStatus, setSyncStatus] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("airtable");
  const [secMsg, setSecMsg] = useState(null);
  const [secLoading, setSecLoading] = useState(false);
  const [authorizedEmails, setAuthorizedEmails] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(window.CryptoUtils?.MSAL_CONFIG_KEY)) || {}).authorizedEmails || ""; } catch { return ""; }
  });
  const [accessLog, setAccessLog] = useState(() => window.AIRTABLE?.getAccessLog() || []);
  const [backupMsg, setBackupMsg] = React.useState(null);

  const doExport = () => {
    const backup = {
      version: 1,
      exported: new Date().toISOString(),
      personas: data.personas,
      entities: data.entities,
      tasks: data.tasks || {},
      interactions: data.interactions || {},
      projects: data.projects || [],
      campaigns: data.campaigns || [],
      calendarEvents: data.calendarEvents || [],
      comments: data.comments || {},
      attachments: data.attachments || {},
      changelog: data.changelog || {},
      goals: data.goals || [],
      segments: data.segments || [],
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "promeza-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.personas || !parsed.entities) {
          setBackupMsg({ type: "err", text: lang === "es" ? "Archivo inválido: faltan personas o entidades" : "Invalid file: missing personas or entities" });
          return;
        }
        if (window.confirm(lang === "es" ? "¿Restaurar estos datos? Se reemplazarán TODOS los datos actuales." : "Restore this data? ALL current data will be replaced.")) {
          onRestoreData({
            personas: parsed.personas || [],
            entities: parsed.entities || [],
            tasks: parsed.tasks || {},
            interactions: parsed.interactions || {},
            projects: parsed.projects || [],
            campaigns: parsed.campaigns || [],
            calendarEvents: parsed.calendarEvents || [],
            comments: parsed.comments || {},
            attachments: parsed.attachments || {},
            changelog: parsed.changelog || {},
            goals: parsed.goals || [],
            segments: parsed.segments || [],
          });
          setBackupMsg({ type: "ok", text: lang === "es" ? `✓ Datos restaurados: ${parsed.personas.length} personas, ${parsed.entities.length} entidades` : `✓ Data restored: ${parsed.personas.length} people, ${parsed.entities.length} entities` });
        }
      } catch {
        setBackupMsg({ type: "err", text: lang === "es" ? "Error al leer el archivo" : "Error reading file" });
      }
    };
    reader.readAsText(file);
  };

  const st = t.settings || {};
  const tabs = [
    { id: "airtable", label: "Airtable" },
    { id: "emailjs", label: "EmailJS" },
    { id: "security", label: "Seguridad" },
    { id: "account", label: lang === "es" ? "Cuenta" : "Account" },
    { id: "backup", label: lang === "es" ? "Respaldo" : "Backup" },
  ];

  const doChangePassword = async () => {
    setSecMsg(null);
    if (!curPass || !newPass || !confirmPass) { setSecMsg({ type: "err", text: "Completa todos los campos." }); return; }
    if (newPass !== confirmPass) { setSecMsg({ type: "err", text: "Las contraseñas nuevas no coinciden." }); return; }
    if (newPass.length < 8) { setSecMsg({ type: "err", text: "Mínimo 8 caracteres." }); return; }
    setSecLoading(true);
    try {
      const result = await window.CryptoUtils.changePassword(curPass, newPass, data);
      if (result.error) { setSecMsg({ type: "err", text: result.error }); }
      else { setSecMsg({ type: "ok", text: "Contraseña cambiada correctamente." }); setCurPass(""); setNewPass(""); setConfirmPass(""); }
    } catch (err) {
      setSecMsg({ type: "err", text: "Error: " + err.message });
    }
    setSecLoading(false);
  };

  const saveAll = () => {
    localStorage.setItem("promeza_ejs", JSON.stringify(ejsCfg));
    window.AIRTABLE.saveConfig(atCfg);
    // Save authorized emails into MSAL config
    const msalKey = window.CryptoUtils?.MSAL_CONFIG_KEY || "promeza_msal_cfg";
    const msalCfg = (() => { try { return JSON.parse(localStorage.getItem(msalKey)) || {}; } catch { return {}; } })();
    localStorage.setItem(msalKey, JSON.stringify({ ...msalCfg, authorizedEmails }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const doSync = async () => {
    setSyncing(true);
    setSyncStatus("");
    try {
      const result = await window.AIRTABLE.syncAll(data);
      setSyncStatus(
        "✓ " + (st.syncDone || "Sync completed") + " — " +
        result.personas.created + " personas creadas, " + result.personas.updated + " actualizadas · " +
        result.entities.created + " entidades creadas, " + result.entities.updated + " actualizadas"
      );
    } catch (err) {
      setSyncStatus("⚠ " + (st.syncError || "Error:") + " " + err.message);
    }
    setSyncing(false);
  };

  const lastSync = window.AIRTABLE.getLastSync();
  const lastSyncFmt = lastSync ? new Date(lastSync).toLocaleString(lang === "en" ? "en-US" : "es-ES") : (st.never || "Nunca");

  const Field = ({ label, value, onChange, type = "text", placeholder, mono, hint }) => (
    <div className="field" style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={mono ? { fontFamily: "var(--font-mono)", fontSize: 12 } : {}}
      />
      {hint && <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 3, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(640px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 600, fontSize: 16 }}>{st.title || "Configuración"}</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              style={{
                padding: "10px 16px", border: 0, background: "transparent",
                fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                color: tab === tb.id ? "var(--accent-700)" : "var(--ink-3)",
                borderBottom: "2px solid " + (tab === tb.id ? "var(--accent)" : "transparent"),
                cursor: "pointer",
              }}>
              {tb.label}
            </button>
          ))}
        </div>

        <div className="modal-body">

          {/* ─── Airtable ─── */}
          {tab === "airtable" && (
            <div>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#10b981", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="check" size={16} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#166534" }}>{lang === "es" ? "Conectado a la base compartida" : "Connected to shared base"}</div>
                  <div style={{ fontSize: 12, color: "#166534", opacity: 0.8 }}>PROMEZA CRM · app0MYHVyhTYFsDqV</div>
                </div>
              </div>
              <div style={{ background: "var(--bg-soft)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "var(--ink-3)" }}>
                {st.lastSync || "Última sync:"} <strong>{lastSyncFmt}</strong>
              </div>
              {syncStatus && (
                <div style={{
                  marginBottom: 12, padding: "10px 14px", borderRadius: 8, fontSize: 12.5,
                  background: syncStatus.startsWith("✓") ? "#f0fdf4" : "#fff5f5",
                  color: syncStatus.startsWith("✓") ? "#166534" : "#991b1b",
                  border: "1px solid " + (syncStatus.startsWith("✓") ? "#bbf7d0" : "#fecaca"),
                }}>
                  {syncStatus}
                </div>
              )}
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={syncing} onClick={doSync}>
                <Icon name="sync" /> {syncing ? (st.syncing || "Sincronizando…") : (st.sync || "Sincronizar todo a Airtable")}
              </button>
            </div>
          )}

          {/* ─── EmailJS ─── */}
          {tab === "emailjs" && (
            <div>
              <div style={{ background: "var(--accent-50)", border: "1px solid var(--accent-100)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "var(--ink-2)" }}>
                <strong>{lang === "es" ? "EmailJS se usa para recuperar contraseña." : "EmailJS is used for password recovery."}</strong>
                {" "}{lang === "es" ? "Crea una cuenta gratis en" : "Create a free account at"}{" "}
                <a href="https://www.emailjs.com/" target="_blank" rel="noopener">emailjs.com</a>
                {" "}{lang === "es" ? "y una plantilla con la variable" : "and a template with the variable"}{" "}
                <code style={{ background: "var(--accent-100)", padding: "0 4px", borderRadius: 3 }}>{"{{code}}"}</code>
              </div>
              <Field label="Service ID" value={ejsCfg.serviceId} onChange={v => setEjsCfg(c => ({ ...c, serviceId: v }))} placeholder="service_xxxxxxx" mono />
              <Field label="Template ID" value={ejsCfg.templateId} onChange={v => setEjsCfg(c => ({ ...c, templateId: v }))} placeholder="template_xxxxxxx" mono />
              <Field label="Public Key" value={ejsCfg.publicKey} onChange={v => setEjsCfg(c => ({ ...c, publicKey: v }))} placeholder="xxxxxxxxxxxxxxxxxxxx" mono />
            </div>
          )}

          {/* ─── Security ─── */}
          {tab === "security" && (
            <div>
              {/* Info bar */}
              <div style={{ background: "var(--bg-soft)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Microsoft Entra ID · AES-256</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Auto-cierre: 1 hora de inactividad · Solo @promeza.com</div>
                </div>
              </div>

              {/* Authorized emails */}
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Correos autorizados</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
                Deja vacío para permitir cualquier cuenta @promeza.com. Si escribes correos específicos, solo ellos podrán entrar.
              </div>
              <div className="field" style={{ marginBottom: 4 }}>
                <textarea
                  value={authorizedEmails}
                  onChange={e => setAuthorizedEmails(e.target.value)}
                  placeholder={"vanessa@promeza.com\nbetty@promeza.com\njuan@promeza.com"}
                  rows={4}
                  style={{ width: "100%", fontFamily: "var(--mono, monospace)", fontSize: 12, resize: "vertical" }}
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 18 }}>Un correo por línea o separados por coma. Se guarda al presionar "Guardar configuración".</div>

              {/* Access log */}
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Registro de accesos</span>
                <button className="btn" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setAccessLog(window.AIRTABLE?.getAccessLog() || [])}>
                  Actualizar
                </button>
              </div>
              {accessLog.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "20px 0" }}>Sin registros aún</div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "var(--bg-soft)", position: "sticky", top: 0 }}>
                        {["Fecha", "Usuario", "Acción", "Dispositivo", "Localidad"].map(h => (
                          <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--ink-2)", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {accessLog.map((e, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "5px 10px", color: "var(--ink-3)", whiteSpace: "nowrap" }}>{new Date(e.ts).toLocaleString("es")}</td>
                          <td style={{ padding: "5px 10px", fontWeight: 500 }}>{(e.email || "").split("@")[0]}</td>
                          <td style={{ padding: "5px 10px" }}>{e.action}</td>
                          <td style={{ padding: "5px 10px", color: "var(--ink-3)" }}>{e.device}</td>
                          <td style={{ padding: "5px 10px", color: "var(--ink-3)" }}>{e.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <button className="btn" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
                  onClick={() => { if (window.confirm("¿Cerrar esta sesión?")) { clearSession(); sessionStorage.removeItem(window.CryptoUtils?.SESSION_CRYPTO_KEY || "promeza_sk"); onLogout(); } }}>
                  <Icon name="log-out" /> Cerrar esta sesión
                </button>
              </div>
            </div>
          )}


          {/* ─── Account ─── */}
          {tab === "account" && (
            <div>
              <div style={{ background: "var(--bg-soft)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{lang === "es" ? "Cuenta activa" : "Active account"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="av-circle" style={{ background: "var(--accent)" }}>P</div>
                  <span style={{ fontSize: 13 }}>Promeza</span>
                </div>
              </div>
              <button className="btn" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
                onClick={() => {
                  if (confirm(st.logoutConfirm || "¿Cerrar sesión?")) {
                    clearSession();
                    onLogout();
                  }
                }}>
                <Icon name="log-out" /> {st.logout || "Cerrar sesión"}
              </button>
            </div>
          )}

          {/* ─── Backup ─── */}
          {tab === "backup" && (
            <div>
              {/* Export */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{lang === "es" ? "Exportar datos" : "Export data"}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 10 }}>{lang === "es" ? "Descarga una copia completa de todos tus datos como archivo JSON. Guárdala en un lugar seguro." : "Download a complete copy of all your data as a JSON file. Keep it in a safe place."}</div>
                <div style={{ background: "var(--bg-soft)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 12, color: "var(--ink-3)" }}>
                  {data.personas.length} {lang === "es" ? "personas" : "people"} · {data.entities.length} {lang === "es" ? "entidades" : "entities"} · {(data.projects || []).length} {lang === "es" ? "proyectos" : "projects"}
                </div>
                <button className="btn btn-primary" onClick={doExport}>
                  <Icon name="download" /> {lang === "es" ? "Descargar backup JSON" : "Download JSON backup"}
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{lang === "es" ? "Importar / Restaurar" : "Import / Restore"}</div>
                <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 12, color: "#991b1b" }}>
                  ⚠ {lang === "es" ? "Esto reemplazará TODOS los datos actuales con el contenido del archivo." : "This will replace ALL current data with the file contents."}
                </div>
                <label className="btn" style={{ cursor: "pointer" }}>
                  <Icon name="upload" /> {lang === "es" ? "Seleccionar archivo de respaldo…" : "Select backup file…"}
                  <input type="file" accept=".json" style={{ display: "none" }} onChange={e => { doImport(e.target.files[0]); e.target.value = ""; }} />
                </label>
              </div>

              {backupMsg && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 12.5, background: backupMsg.type === "ok" ? "#f0fdf4" : "#fff5f5", color: backupMsg.type === "ok" ? "#166534" : "#991b1b", border: "1px solid " + (backupMsg.type === "ok" ? "#bbf7d0" : "#fecaca") }}>
                  {backupMsg.text}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={saveAll}>
            {saved ? <><Icon name="check" /> {st.saved || "Guardado"}</> : (st.save || "Guardar configuración")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Changelog helpers ───

const PERSON_FIELD_LABELS = {
  first: "Nombre", last: "Apellido", email: "Email", phone: "Teléfono",
  role: "Cargo", status: "Estado", address: "Dirección", city: "Ciudad",
  state: "Estado/Prov.", country: "País", zip: "ZIP", website: "Sitio web",
  birthday: "Cumpleaños", lastContact: "Último contacto", language: "Idioma",
  tags: "Etiquetas", entities: "Entidades",
  stage: "Etapa", source: "Fuente", nextAction: "Próxima acción",
};

const ENTITY_FIELD_LABELS = {
  name: "Nombre", type: "Tipo", email: "Email", phone: "Teléfono",
  address: "Dirección", city: "Ciudad", state: "Estado/Prov.", country: "País",
  zip: "ZIP", website: "Sitio web", founded: "Año fundación",
  size: "Tamaño", tags: "Etiquetas", status: "Estado",
};

const computeChanges = (oldObj, updates, fieldLabels) => {
  const changes = [];
  for (const key of Object.keys(updates)) {
    const label = fieldLabels[key];
    if (!label) continue;
    const oldVal = oldObj[key];
    const newVal = updates[key];
    if (key === "tags" || key === "entities") {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) changes.push({ field: label, type: key });
    } else {
      const o = String(oldVal ?? ""), n = String(newVal ?? "");
      if (o !== n) changes.push({ field: label, old: o, new: n });
    }
  }
  return changes;
};

// ─── Reminders Modal ───

const RemindersModal = ({ lang, data, onClose, go }) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayMMDD = today.slice(5);
  const birthdaysToday = data.personas.filter(p => p.birthday && p.birthday.slice(5) === todayMMDD && p.status !== "inactivo");
  const overdueTasks = [];
  Object.entries(data.tasks || {}).forEach(([pid, tasks]) => {
    tasks.forEach(tk => {
      if (!tk.done && tk.due && tk.due < today) {
        const p = data.personas.find(x => x.id === pid);
        overdueTasks.push({ ...tk, personaName: p ? p.first + " " + (p.last || "") : "" });
      }
    });
  });

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(480px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {lang === "es" ? "Recordatorios de hoy" : "Today's reminders"}
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {birthdaysToday.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#f59e0b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                🎂 {lang === "es" ? "Cumpleaños hoy" : "Birthdays today"}
              </div>
              {birthdaysToday.map(p => (
                <div key={p.id} className="hover-row" onClick={() => { go({ name: "person", id: p.id }); onClose(); }}
                  style={{ borderRadius: 8 }}>
                  <div className="av-circle" style={{ background: p.color, width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                    {(p.first[0] || "") + (p.last ? p.last[0] : "")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.first} {p.last}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{p.role}</div>
                  </div>
                  <span style={{ fontSize: 18 }}>🎂</span>
                </div>
              ))}
            </div>
          )}
          {overdueTasks.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#ef4444", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                ⚠ {overdueTasks.length} {lang === "es" ? "tarea" + (overdueTasks.length !== 1 ? "s vencidas" : " vencida") : "overdue task" + (overdueTasks.length !== 1 ? "s" : "")}
              </div>
              {overdueTasks.slice(0, 5).map(tk => (
                <div key={tk.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#fff5f5", borderRadius: 7, marginBottom: 4, border: "1px solid #fecaca" }}>
                  <Icon name="check" size={12} style={{ color: "#ef4444", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{tk.text}</span>
                  {tk.personaName && <span style={{ fontSize: 11, color: "#b91c1c", fontWeight: 600 }}>{tk.personaName}</span>}
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#ef4444", fontWeight: 700 }}>{tk.due}</span>
                </div>
              ))}
              {overdueTasks.length > 5 && <div style={{ fontSize: 11.5, color: "var(--ink-3)", textAlign: "center", marginTop: 4 }}>+{overdueTasks.length - 5} {lang === "es" ? "más" : "more"}</div>}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <button className="btn" onClick={() => { go({ name: "tasks" }); onClose(); }}>
              <Icon name="check" /> {lang === "es" ? "Ver tareas" : "View tasks"}
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              {lang === "es" ? "Entendido" : "Got it"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── App Root ───

const App = () => {
  const [lang, setLang] = useState("es");
  const t = window.PROMEZA_I18N[lang];

  const [userEmail, setUserEmail] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) setUserEmail(session.email);
    setAuthChecked(true);
  }, []);

  const [route, setRoute] = useState({ name: "home" });
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // 'new-person' | 'new-entity' | 'edit-person' | 'edit-entity' | 'settings' | null
  const [editingId, setEditingId] = useState(null);
  const [modalPrefill, setModalPrefill] = useState(null);
  const [dupPairs, setDupPairs] = useState([]);
  const [entityDupPairs, setEntityDupPairs] = useState([]);
  const [sideOpen, setSideOpen] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [remindersShown, setRemindersShown] = useState(false);

  // Compute stable 7-digit UID from internal ID string
  const computeUID = (id) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
    return String((Math.abs(h) % 9000000) + 1000000);
  };
  const withUIDs = (arr) => arr.map(x => x.uid ? x : { ...x, uid: computeUID(x.id) });

  const [cryptoKey, setCryptoKey] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [data, setData] = useState(null);
  const [needsUnlock, setNeedsUnlock] = useState(false);

  const freshData = () => ({
    personas: withUIDs([...window.PROMEZA_DATA.personas]),
    entities: withUIDs([...window.PROMEZA_DATA.entities]),
    comments: { ...window.PROMEZA_DATA.comments },
    interactions: {},
    tasks: { ...(window.PROMEZA_DATA.tasks || {}) },
    changelog: {},
    segments: [],
    attachments: {},
    projects: [],
    campaigns: [],
    goals: [],
    calendarEvents: [],
  });

  const processLoadedData = (parsed) => {
    const savedPersonaIds = new Set((parsed.personas || []).map(p => p.id));
    const newPersonas = window.PROMEZA_DATA.personas.filter(p => !savedPersonaIds.has(p.id));
    const savedEntityIds = new Set((parsed.entities || []).map(e => e.id));
    const newEntities = window.PROMEZA_DATA.entities.filter(e => !savedEntityIds.has(e.id));
    const demoTasks = window.PROMEZA_DATA.tasks || {};
    const mergedTasks = { ...demoTasks, ...(parsed.tasks || {}) };
    return {
      ...parsed,
      personas: withUIDs([...(parsed.personas || []), ...newPersonas]),
      entities: withUIDs([...(parsed.entities || []), ...newEntities]),
      interactions: parsed.interactions || {},
      tasks: mergedTasks,
      changelog: parsed.changelog || {},
      segments: parsed.segments || [],
      attachments: parsed.attachments || {},
      projects: parsed.projects || [],
      campaigns: parsed.campaigns || [],
      goals: parsed.goals || [],
      calendarEvents: parsed.calendarEvents || [],
    };
  };

  const [atSyncing, setAtSyncing] = useState(false);
  const [atSyncMsg, setAtSyncMsg] = useState(null); // { type:"ok"|"warn"|"err", text }

  const mergeFromAirtable = (atData, prev, prevLastLoad = "") => {
    if (!atData || !prev) return prev;
    // prevLastLoad = BEFORE this fetch started — edits after that moment are "newer than Airtable"
    const atPersonaMap = new Map(atData.personas.map(p => [p.id, p]));
    const atEntityMap = new Map(atData.entities.map(e => [e.id, e]));

    const mergedPersonas = prev.personas.map(local => {
      const remote = atPersonaMap.get(local.id);
      if (!remote) return local;
      if (local._localSavedAt && local._localSavedAt > prevLastLoad) {
        return { ...local, _atId: remote._atId || local._atId };
      }
      return remote;
    });
    const localPersonaIds = new Set(prev.personas.map(p => p.id));
    const remoteOnlyPersonas = atData.personas.filter(p => !localPersonaIds.has(p.id));

    const mergedEntities = prev.entities.map(local => {
      const remote = atEntityMap.get(local.id);
      if (!remote) return local;
      if (local._localSavedAt && local._localSavedAt > prevLastLoad) {
        return { ...local, _atId: remote._atId || local._atId };
      }
      return remote;
    });
    const localEntityIds = new Set(prev.entities.map(e => e.id));
    const remoteOnlyEntities = atData.entities.filter(e => !localEntityIds.has(e.id));

    return {
      ...prev,
      personas: [...mergedPersonas, ...remoteOnlyPersonas],
      entities: [...mergedEntities, ...remoteOnlyEntities],
    };
  };

  const syncFromAirtable = () => {
    setAtSyncing(true);
    // Snapshot prevLastLoad BEFORE fetching so local edits made before now survive the merge
    const prevLastLoad = window.AIRTABLE.getLastLoad() || "";
    window.AIRTABLE.loadData().then(atData => {
      if (atData && (atData.personas.length > 0 || atData.entities.length > 0)) {
        setData(prev => mergeFromAirtable(atData, prev, prevLastLoad));
        setAtSyncMsg({ type: "ok", text: "↓ " + atData.personas.length + " personas · " + atData.entities.length + " entidades recibidas de Airtable" });
      } else if (atData) {
        setAtSyncMsg({ type: "warn", text: "Airtable vacío — haz 'Sincronizar todo' desde la MacBook primero" });
      }
    }).catch(e => {
      setAtSyncMsg({ type: "err", text: "Error Airtable: " + e.message });
      console.warn("syncFromAirtable error:", e);
    }).finally(() => setAtSyncing(false));
  };

  useEffect(() => {
    const initData = async () => {
      // 1. Try to load crypto key from sessionStorage
      let key = await window.CryptoUtils.loadSessionKey();

      if (!key) {
        // Session valid but no key → need to unlock (re-enter password)
        setNeedsUnlock(true);
        setDataReady(true);
        return;
      }

      setCryptoKey(key);

      try {
        // 2. Try to load encrypted data
        const enc = localStorage.getItem("promeza_data_enc");
        if (enc) {
          const json = await window.CryptoUtils.decrypt(enc, key);
          const parsed = JSON.parse(json);
          setData(processLoadedData(parsed));
          setDataReady(true);
          // Load from Airtable in background to pick up teammate changes
          syncFromAirtable();
          return;
        }

        // 3. Migration: old unencrypted data
        const old = localStorage.getItem("promeza_data");
        if (old) {
          const parsed = JSON.parse(old);
          const processed = processLoadedData(parsed);
          setData(processed);
          setDataReady(true);
          localStorage.removeItem("promeza_data"); // will be re-saved encrypted
          return;
        }
      } catch (err) {
        console.error("Data load error:", err);
        // Fall back to fresh data on crypto error
      }

      // 4. Fresh start
      setData(freshData());
      setDataReady(true);
    };

    if (userEmail) initData();
  }, [userEmail]);

  useEffect(() => {
    if (!data || !cryptoKey) return;
    window.CryptoUtils.encrypt(JSON.stringify(data), cryptoKey).then(enc => {
      localStorage.setItem("promeza_data_enc", enc);
    }).catch(console.error);
  }, [data, cryptoKey]);

  // Cross-tab sync: when another tab saves to localStorage, reload data here
  useEffect(() => {
    if (!cryptoKey || !dataReady) return;
    const onStorage = async (e) => {
      if (e.key !== "promeza_data_enc" || !e.newValue) return;
      try {
        const json = await window.CryptoUtils.decrypt(e.newValue, cryptoKey);
        const parsed = JSON.parse(json);
        setData(processLoadedData(parsed));
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [cryptoKey, dataReady]);

  // Periodic Airtable sync every 60 seconds to pick up teammate changes
  useEffect(() => {
    if (!dataReady || !data) return;
    const interval = setInterval(syncFromAirtable, 60000);
    return () => clearInterval(interval);
  }, [dataReady]);

  // Auto-logout on inactivity (1 hour)
  const INACTIVITY_MS = 60 * 60 * 1000;
  useEffect(() => {
    if (!userEmail) return;
    let timer = setTimeout(() => {
      clearSession();
      sessionStorage.removeItem(window.CryptoUtils.SESSION_CRYPTO_KEY || "promeza_sk");
      setUserEmail(null);
    }, INACTIVITY_MS);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        clearSession();
        sessionStorage.removeItem(window.CryptoUtils.SESSION_CRYPTO_KEY || "promeza_sk");
        setUserEmail(null);
      }, INACTIVITY_MS);
    };
    const events = ["mousedown", "keypress", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, reset));
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [userEmail]);

  // Auto-scan for duplicates on load + auto-generate tasks for new pairs
  useEffect(() => {
    if (!data) return;
    const personaPairs = findDuplicatePairs(data.personas, []);
    if (personaPairs.length > 0) {
      setDupPairs(personaPairs);
      // Auto-create a task on each persona in the pair if not already there
      setData(d => {
        if (!d) return d;
        let tasks = { ...d.tasks };
        personaPairs.forEach(pair => {
          const pA = d.personas.find(p => p.id === pair.idA);
          const pB = d.personas.find(p => p.id === pair.idB);
          if (!pA || !pB) return;
          const nameB = pB.first + " " + pB.last;
          const nameA = pA.first + " " + pA.last;
          const textA = "Revisar posible duplicado con: " + nameB;
          const textB = "Revisar posible duplicado con: " + nameA;
          const listA = tasks[pair.idA] || [];
          const listB = tasks[pair.idB] || [];
          if (!listA.some(t => t.text === textA)) {
            tasks[pair.idA] = [...listA, { id: "dup_" + pair.idA + "_" + pair.idB, text: textA, due: null, done: false, createdAt: new Date().toISOString().slice(0, 10), type: "duplicate" }];
          }
          if (!listB.some(t => t.text === textB)) {
            tasks[pair.idB] = [...listB, { id: "dup_" + pair.idB + "_" + pair.idA, text: textB, due: null, done: false, createdAt: new Date().toISOString().slice(0, 10), type: "duplicate" }];
          }
        });
        return { ...d, tasks };
      });
    }
    // Entity duplicates
    if (window.findEntityDuplicatePairs) {
      const entPairs = window.findEntityDuplicatePairs(data.entities, []);
      if (entPairs.length > 0) setEntityDupPairs(entPairs);
    }
  }, [data && data.personas && data.personas.length > 0]); // run once when data loads

  useEffect(() => {
    if (!dataReady || !data || !userEmail || remindersShown) return;
    const today = new Date().toISOString().slice(0, 10);
    const todayMMDD = today.slice(5);
    const birthdaysToday = data.personas.filter(p => p.birthday && p.birthday.slice(5) === todayMMDD && p.status !== "inactivo");
    const overdueTasks = [];
    Object.entries(data.tasks || {}).forEach(([pid, tasks]) => {
      tasks.forEach(tk => {
        if (!tk.done && tk.due && tk.due < today) {
          const p = data.personas.find(x => x.id === pid);
          overdueTasks.push({ ...tk, personaName: p ? p.first + " " + p.last : "" });
        }
      });
    });
    if (birthdaysToday.length > 0 || overdueTasks.length > 0) {
      setShowReminders(true);
    }
    setRemindersShown(true);
  }, [dataReady, data, userEmail, remindersShown]);

  const [routeHistory, setRouteHistory] = useState([]);

  const go = (r) => {
    if (r.name === "new-person") { setModalPrefill(r.prefill || null); setModal("new-person"); return; }
    if (r.name === "new-entity") { setModalPrefill(r.prefill || null); setModal("new-entity"); return; }
    setRouteHistory(h => [...h.slice(-19), route]);
    setRoute(r);
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    if (routeHistory.length === 0) return;
    const prev = routeHistory[routeHistory.length - 1];
    setRouteHistory(h => h.slice(0, -1));
    setRoute(prev);
    window.scrollTo({ top: 0 });
  };

  const allTasksFlat = data ? Object.values(data.tasks).flat() : [];
  const pendingTasks = allTasksFlat.filter(t => !t.done).length;
  const overdueCount = allTasksFlat.filter(t => t.due && !t.done && t.due < new Date().toISOString().slice(0, 10)).length;
  const completedGoals = data ? (data.goals || []).filter(g => {
    if (g.archived) return false;
    const GOAL_METRICS = window.GOAL_METRICS || [];
    const metric = GOAL_METRICS.find(m => m.id === g.metric);
    return metric && metric.compute(data) >= g.target;
  }).length : 0;
  const totalDups = dupPairs.filter(p => !p.dismissed).length + entityDupPairs.filter(p => !p.dismissed).length;
  const counts = data ? { personas: data.personas.length, entities: data.entities.length, dups: totalDups, pendingTasks: pendingTasks || null, overdueCount, projects: (data.projects || []).length || null, completedGoals: completedGoals || null } : {};

  const addComment = (targetId, text) => {
    setData(d => {
      const next = { ...d, comments: { ...d.comments } };
      const list = next.comments[targetId] ? [...next.comments[targetId]] : [];
      list.unshift({ author: userEmail || "Usuario", date: new Date().toISOString().slice(0, 10), text });
      next.comments[targetId] = list;
      return next;
    });
  };

  const handleSavePerson = (form) => {
    const id = "p" + Date.now();
    const tags = form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    const palette = ["#2F6BFF", "#0E7C66", "#B45309", "#7C3AED", "#BE185D", "#0369A1", "#15803D"];
    const color = palette[(form.first.charCodeAt(0) || 0) % palette.length];
    const newP = {
      id, first: form.first, last: form.last,
      role: form.role, roleOther: form.roleOther,
      email: form.email, phone: form.phone,
      address: form.address, zip: form.zip, city: form.city, state: form.state, country: form.country,
      lat: 0, lng: 0,
      website: form.website, social: form.social,
      entities: form.entities.map(le => ({ id: le.id, role: le.role, roleOther: le.roleOther })),
      tags, language: form.language,
      status: form.stage === "inactivo" ? "inactivo" : "activo",
      stage: form.stage || "nuevo",
      source: form.source || "",
      nextAction: form.nextAction || "",
      birthday: form.birthday, lastContact: form.lastContact,
      color,
      uid: computeUID(id),
      _localSavedAt: new Date().toISOString(),
    };
    const createdAt = new Date().toISOString();
    setData(d => {
      const next = { ...d, personas: [newP, ...d.personas] };
      const pairs = findDuplicatePairs(next.personas, dupPairs);
      if (pairs.length > 0) {
        setDupPairs(prev => { const existing = new Set(prev.map(p => p.idA+"|"+p.idB)); return [...prev, ...pairs.filter(p => !existing.has(p.idA+"|"+p.idB))]; });
      }
      next.changelog = { ...(next.changelog || {}), [id]: [{ id: "cl" + id, date: createdAt, author: userEmail || "Usuario", changes: [{ field: "record", type: "created" }] }] };
      return next;
    });
    window.AIRTABLE.savePersona(newP, data.entities)
      .then(atId => { if (atId) setData(d => ({ ...d, personas: d.personas.map(p => p.id === id ? { ...p, _atId: atId } : p) })); })
      .catch(console.warn);
    setModal(null);
    setRoute({ name: "person", id });
  };

  const handleSaveEntity = (form) => {
    const id = "e" + (data.entities.length + 1);
    const tags = form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    const newE = {
      id, name: form.name, type: form.type,
      email: form.email, phone: form.phone,
      address: form.address, zip: form.zip, city: form.city, state: form.state, country: form.country,
      lat: 0, lng: 0,
      website: form.website, social: form.social,
      size: form.size ? parseInt(form.size) : null,
      founded: form.founded, parent: form.parent || null,
      tags, status: "activo", uid: computeUID(id),
      _localSavedAt: new Date().toISOString(),
    };
    const createdAtE = new Date().toISOString();
    setData(d => {
      const next = { ...d, entities: [newE, ...d.entities] };
      next.changelog = { ...(next.changelog || {}), [id]: [{ id: "cl" + id, date: createdAtE, author: userEmail || "Usuario", changes: [{ field: "record", type: "created" }] }] };
      return next;
    });
    window.AIRTABLE.saveEntity(newE, data.entities)
      .then(atId => { if (atId) setData(d => ({ ...d, entities: d.entities.map(e => e.id === id ? { ...e, _atId: atId } : e) })); })
      .catch(console.warn);
    setModal(null);
    setRoute({ name: "entity", id });
  };

  const handleImportPersonas = (imported) => {
    setData(d => {
      const next = { ...d, personas: [...imported, ...d.personas] };
      const pairs = findDuplicatePairs(next.personas, dupPairs);
      if (pairs.length > 0) {
        setDupPairs(prev => { const existing = new Set(prev.map(p => p.idA+"|"+p.idB)); return [...prev, ...pairs.filter(p => !existing.has(p.idA+"|"+p.idB))]; });
        setRoute({ name: "duplicates" });
        window.scrollTo({ top: 0 });
      }
      return next;
    });
  };

  const handleImportEntities = (imported) => {
    setData(d => ({ ...d, entities: [...imported, ...d.entities] }));
  };

  const handleUpdatePerson = (id, updates) => {
    const localSavedAt = new Date().toISOString();
    const current = data.personas.find(p => p.id === id);
    const updated = current ? { ...current, ...updates, _localSavedAt: localSavedAt } : null;
    setData(d => {
      const old = d.personas.find(p => p.id === id);
      const changes = old ? computeChanges(old, updates, PERSON_FIELD_LABELS) : [];
      const cl = changes.length > 0 ? {
        ...d.changelog,
        [id]: [{ id: "cl" + Date.now(), date: new Date().toISOString(), author: userEmail || "Usuario", changes }, ...(d.changelog[id] || [])],
      } : d.changelog;
      return { ...d, personas: d.personas.map(p => p.id === id ? { ...p, ...updates, _localSavedAt: localSavedAt } : p), changelog: cl };
    });
    if (updated) {
      window.AIRTABLE.savePersona(updated, data.entities)
        .then(atId => { if (atId) setData(d => ({ ...d, personas: d.personas.map(p => p.id === id ? { ...p, _atId: atId } : p) })); })
        .catch(console.warn);
    }
  };

  const handleUpdateEntity = (id, updates) => {
    const localSavedAt = new Date().toISOString();
    const current = data.entities.find(e => e.id === id);
    const updated = current ? { ...current, ...updates, _localSavedAt: localSavedAt } : null;
    setData(d => {
      const old = d.entities.find(e => e.id === id);
      const changes = old ? computeChanges(old, updates, ENTITY_FIELD_LABELS) : [];
      const cl = changes.length > 0 ? {
        ...d.changelog,
        [id]: [{ id: "cl" + Date.now(), date: new Date().toISOString(), author: userEmail || "Usuario", changes }, ...(d.changelog[id] || [])],
      } : d.changelog;
      return { ...d, entities: d.entities.map(e => e.id === id ? { ...e, ...updates, _localSavedAt: localSavedAt } : e), changelog: cl };
    });
    if (updated) {
      window.AIRTABLE.saveEntity(updated, data.entities)
        .then(atId => { if (atId) setData(d => ({ ...d, entities: d.entities.map(e => e.id === id ? { ...e, _atId: atId } : e) })); })
        .catch(console.warn);
    }
  };

  const handleEditPerson = (id) => { setEditingId(id); setModal("edit-person"); };
  const handleSaveEditPerson = (form) => {
    const tags = form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    const status = form.stage === "inactivo" ? "inactivo" : "activo";
    const updates = { ...form, tags, status, entities: form.entities.map(le => ({ id: le.id, role: le.role, roleOther: le.roleOther })) };
    handleUpdatePerson(editingId, updates);
    setModal(null);
    setEditingId(null);
  };
  const handleDeletePerson = (id) => {
    if (!confirm(lang === "es" ? "¿Eliminar esta persona? Esta acción no se puede deshacer." : "Delete this person? This cannot be undone.")) return;
    const cfg = window.AIRTABLE.getConfig();
    if (cfg.pat && cfg.baseId) window.AIRTABLE.deleteRecord(cfg.personasTable || "PERSONAS PROMEZA CRM", id).catch(console.warn);
    setData(d => ({ ...d, personas: d.personas.filter(p => p.id !== id) }));
    setRoute({ name: "personas" });
  };

  const handleEditEntity = (id) => { setEditingId(id); setModal("edit-entity"); };
  const handleSaveEditEntity = (form) => {
    const tags = form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    handleUpdateEntity(editingId, { ...form, tags, size: form.size ? parseInt(form.size) : null });
    setModal(null);
    setEditingId(null);
  };
  const handleDeleteEntity = (id) => {
    if (!confirm(lang === "es" ? "¿Eliminar esta entidad? Esta acción no se puede deshacer." : "Delete this entity? This cannot be undone.")) return;
    const cfg = window.AIRTABLE.getConfig();
    if (cfg.pat && cfg.baseId) window.AIRTABLE.deleteRecord(cfg.entidadesTable || "ENTIDADES PROMEZA CRM", id).catch(console.warn);
    setData(d => ({ ...d, entities: d.entities.filter(e => e.id !== id) }));
    setRoute({ name: "entities" });
  };

  const addInteraction = (personId, interaction) => {
    setData(d => ({
      ...d,
      interactions: { ...d.interactions, [personId]: [interaction, ...(d.interactions[personId] || [])] },
    }));
  };

  const deleteInteraction = (personId, id) => {
    setData(d => ({
      ...d,
      interactions: { ...d.interactions, [personId]: (d.interactions[personId] || []).filter(i => i.id !== id) },
    }));
  };

  const addTask = (personId, task) => {
    setData(d => ({
      ...d,
      tasks: { ...d.tasks, [personId]: [...(d.tasks[personId] || []), task] },
    }));
  };

  const toggleTask = (personId, id) => {
    setData(d => ({
      ...d,
      tasks: { ...d.tasks, [personId]: (d.tasks[personId] || []).map(tk => tk.id === id ? { ...tk, done: !tk.done } : tk) },
    }));
  };

  const deleteTask = (personId, id) => {
    setData(d => ({
      ...d,
      tasks: { ...d.tasks, [personId]: (d.tasks[personId] || []).filter(tk => tk.id !== id) },
    }));
  };

  const handleBulkAddTask = (personId, task) => {
    addTask(personId, task);
  };

  const addAttachment = (targetId, attachment) => {
    setData(d => ({
      ...d,
      attachments: { ...d.attachments, [targetId]: [...(d.attachments[targetId] || []), attachment] },
    }));
  };

  const deleteAttachment = (targetId, attId) => {
    setData(d => ({
      ...d,
      attachments: { ...d.attachments, [targetId]: (d.attachments[targetId] || []).filter(a => a.id !== attId) },
    }));
  };

  const addProject = (form) => {
    const id = "proj" + Date.now();
    setData(d => ({ ...d, projects: [{ id, ...form, members: [], createdAt: new Date().toISOString() }, ...d.projects] }));
    setRoute({ name: "project", id });
  };

  const updateProject = (id, updates) => {
    setData(d => ({ ...d, projects: d.projects.map(p => p.id === id ? { ...p, ...updates } : p) }));
  };

  const deleteProject = (id) => {
    setData(d => ({ ...d, projects: d.projects.filter(p => p.id !== id) }));
  };

  const addProjectMember = (projectId, member) => {
    setData(d => ({ ...d, projects: d.projects.map(p => p.id === projectId ? { ...p, members: [...(p.members || []), member] } : p) }));
  };

  const removeProjectMember = (projectId, personaId) => {
    setData(d => ({ ...d, projects: d.projects.map(p => p.id === projectId ? { ...p, members: (p.members || []).filter(m => m.personaId !== personaId) } : p) }));
  };

  const saveCampaign = (campaign) => {
    setData(d => ({ ...d, campaigns: [campaign, ...(d.campaigns || [])] }));
  };

  const addCalendarEvent = (evt) => {
    setData(d => ({ ...d, calendarEvents: [...(d.calendarEvents || []), { id: "cal" + Date.now(), ...evt }] }));
  };
  const deleteCalendarEvent = (id) => {
    setData(d => ({ ...d, calendarEvents: (d.calendarEvents || []).filter(e => e.id !== id) }));
  };

  const addGoal = (goal) => {
    const GOAL_METRICS = window.GOAL_METRICS || [];
    const metric = GOAL_METRICS.find(m => m.id === goal.metric);
    const initialValue = metric ? metric.compute(data) : 0;
    setData(d => ({ ...d, goals: [{ id: "goal" + Date.now(), ...goal, initialValue, createdAt: new Date().toISOString(), archived: false }, ...(d.goals || [])] }));
  };

  const updateGoal = (id, updates) => {
    setData(d => ({ ...d, goals: (d.goals || []).map(g => g.id === id ? { ...g, ...updates } : g) }));
  };

  const deleteGoal = (id) => {
    setData(d => ({ ...d, goals: (d.goals || []).filter(g => g.id !== id) }));
  };

  const handleBulkDeletePersonas = (ids) => {
    if (!confirm(lang === "es" ? `¿Eliminar ${ids.size} personas seleccionadas? Esta acción no se puede deshacer.` : `Delete ${ids.size} selected people? This cannot be undone.`)) return;
    setData(d => ({ ...d, personas: d.personas.filter(p => !ids.has(p.id)) }));
  };

  const handleBulkUpdatePersonas = (ids, updates) => {
    setData(d => ({ ...d, personas: d.personas.map(p => ids.has(p.id) ? { ...p, ...updates } : p) }));
  };

  const addSegment = (segment) => {
    setData(d => ({ ...d, segments: [...(d.segments || []), { ...segment, id: "seg" + Date.now() }] }));
  };
  const deleteSegment = (id) => {
    setData(d => ({ ...d, segments: (d.segments || []).filter(s => s.id !== id) }));
  };

  const handleBulkAddTagPersonas = (ids, tag) => {
    setData(d => ({
      ...d,
      personas: d.personas.map(p => ids.has(p.id) ? { ...p, tags: [...new Set([...(p.tags || []), tag])] } : p),
    }));
  };

  const handleMergeWithData = (keepId, dropId, mergedData) => {
    setData(d => {
      const drop = d.personas.find(p => p.id === dropId);
      const dropName = drop ? (drop.first + " " + drop.last) : dropId;
      const mergedComments = [
        ...(d.comments[keepId] || []),
        ...(d.comments[dropId] || []),
      ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const newComments = { ...d.comments, [keepId]: mergedComments };
      delete newComments[dropId];
      const mergeEntry = { id: "cl" + Date.now(), date: new Date().toISOString(), author: userEmail || "Usuario", changes: [{ field: "record", type: "merge", with: dropName }] };
      const cl = { ...d.changelog, [keepId]: [mergeEntry, ...(d.changelog[keepId] || [])] };
      return {
        ...d,
        personas: d.personas.map(p => p.id === keepId ? mergedData : p).filter(p => p.id !== dropId),
        comments: newComments,
        changelog: cl,
      };
    });
    setDupPairs(ps => ps
      .map(p => (p.idA === keepId && p.idB === dropId) || (p.idA === dropId && p.idB === keepId) ? { ...p, dismissed: true } : p)
      .filter(p => p.idA !== dropId && p.idB !== dropId)
    );
    if (route.id === dropId) setRoute({ name: "person", id: keepId });
  };

  const handleMergePersonas = (idA, idB) => {
    setData(d => {
      const keep = d.personas.find(p => p.id === idA);
      const drop = d.personas.find(p => p.id === idB);
      if (!keep || !drop) return d;
      const dropName = drop.first + " " + drop.last;
      const merged = {
        ...keep,
        email: keep.email || drop.email || "",
        phone: keep.phone || drop.phone || "",
        address: keep.address || drop.address || "",
        zip: keep.zip || drop.zip || "",
        city: keep.city || drop.city || "",
        state: keep.state || drop.state || "",
        country: keep.country || drop.country || "",
        website: keep.website || drop.website || "",
        birthday: keep.birthday || drop.birthday || "",
        lastContact: (keep.lastContact || "") >= (drop.lastContact || "") ? keep.lastContact : drop.lastContact,
        tags: [...new Set([...(keep.tags || []), ...(drop.tags || [])])],
        entities: [
          ...(keep.entities || []),
          ...(drop.entities || []).filter(de => !(keep.entities || []).some(ke => ke.id === de.id)),
        ],
        social: {
          ig: keep.social?.ig || drop.social?.ig || "",
          fb: keep.social?.fb || drop.social?.fb || "",
          tiktok: keep.social?.tiktok || drop.social?.tiktok || "",
          x: keep.social?.x || drop.social?.x || "",
        },
      };
      const mergedComments = [
        ...(d.comments[idA] || []),
        ...(d.comments[idB] || []),
      ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const newComments = { ...d.comments, [idA]: mergedComments };
      delete newComments[idB];
      const mergeEntry = { id: "cl" + Date.now(), date: new Date().toISOString(), author: userEmail || "Usuario", changes: [{ field: "record", type: "merge", with: dropName }] };
      const cl = { ...d.changelog, [idA]: [mergeEntry, ...(d.changelog[idA] || [])] };
      return {
        ...d,
        personas: d.personas.map(p => p.id === idA ? merged : p).filter(p => p.id !== idB),
        comments: newComments,
        changelog: cl,
      };
    });
    setDupPairs(ps => ps
      .map(p => (p.idA === idA && p.idB === idB) || (p.idA === idB && p.idB === idA) ? { ...p, dismissed: true } : p)
      .filter(p => p.idA !== idB && p.idB !== idB)
    );
    if (route.id === idB) setRoute({ name: "person", id: idA });
  };

  const handleDismissDup = (pair) => {
    setDupPairs(ps => ps.map(p =>
      p.idA === pair.idA && p.idB === pair.idB ? { ...p, dismissed: true } : p
    ));
  };

  const handleUndismissDup = (pair) => {
    setDupPairs(ps => ps.map(p =>
      p.idA === pair.idA && p.idB === pair.idB ? { ...p, dismissed: false } : p
    ));
  };

  const handleScanAll = () => {
    const pairs = findDuplicatePairs(data.personas, dupPairs);
    if (pairs.length > 0) {
      setDupPairs(prev => {
        const existing = new Set(prev.map(p => p.idA + "|" + p.idB));
        return [...prev, ...pairs.filter(p => !existing.has(p.idA + "|" + p.idB))];
      });
    }
    setRoute({ name: "duplicates" });
    window.scrollTo({ top: 0 });
  };

  const handleCreateDemo = () => {
    const source = data.personas[0];
    if (!source) return;
    const demoId = "demo-" + Date.now();
    const demo = {
      ...source, id: demoId,
      last: source.last + " (copia)",
      city: source.city,
      status: "activo",
    };
    setData(d => {
      const next = { ...d, personas: [demo, ...d.personas] };
      const pairs = findDuplicatePairs(next.personas, dupPairs);
      if (pairs.length > 0) {
        setDupPairs(prev => {
          const existing = new Set(prev.map(p => p.idA + "|" + p.idB));
          return [...prev, ...pairs.filter(p => !existing.has(p.idA + "|" + p.idB))];
        });
      }
      return next;
    });
  };

  // Not ready yet
  if (!authChecked) return null;

  // Not logged in
  if (!userEmail) {
    return <AuthScreen onLogin={(email) => { setUserEmail(email); }} />;
  }

  // Session valid but sessionStorage key missing (page reload after tab close)
  if (needsUnlock) {
    return <UnlockScreen
      email={userEmail}
      onUnlock={async () => {
        const key = await window.CryptoUtils.loadSessionKey();
        setCryptoKey(key);
        setNeedsUnlock(false);
        setDataReady(false);
        // Trigger re-init of data by toggling userEmail briefly isn't needed;
        // instead reload data directly
        try {
          const enc = localStorage.getItem("promeza_data_enc");
          if (enc && key) {
            const json = await window.CryptoUtils.decrypt(enc, key);
            const parsed = JSON.parse(json);
            setData(processLoadedData(parsed));
          } else {
            const old = localStorage.getItem("promeza_data");
            if (old && key) {
              const parsed = JSON.parse(old);
              setData(processLoadedData(parsed));
              localStorage.removeItem("promeza_data");
            } else {
              setData(freshData());
            }
          }
        } catch (err) {
          console.error("Unlock data load error:", err);
          setData(freshData());
        }
        setDataReady(true);
      }}
      onLogout={() => { clearSession(); sessionStorage.removeItem(window.CryptoUtils.SESSION_CRYPTO_KEY || "promeza_sk"); setUserEmail(null); }}
    />;
  }

  // Loading encrypted data
  if (!dataReady || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12, color: "var(--ink-3)", fontSize: 13 }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
        Cargando datos seguros…
      </div>
    );
  }

  let view;
  switch (route.name) {
    case "home": view = <Home t={t} lang={lang} data={data} go={go} />; break;
    case "personas": view = <PersonasList t={t} lang={lang} data={data} go={go} onImportPersonas={handleImportPersonas} globalQ={query} onBulkDelete={handleBulkDeletePersonas} onBulkUpdateStatus={handleBulkUpdatePersonas} onBulkAddTag={handleBulkAddTagPersonas} onBulkAddTask={handleBulkAddTask} segments={data.segments || []} onAddSegment={addSegment} onDeleteSegment={deleteSegment} users={window.PROMEZA_USERS || []} currentUser={userEmail} />; break;
    case "pipeline": view = <PipelineView t={t} lang={lang} data={data} go={go} onUpdatePerson={handleUpdatePerson} />; break;
    case "entities": view = <EntitiesList t={t} lang={lang} data={data} go={go} onImportEntities={handleImportEntities} globalQ={query} />; break;
    case "person": view = <PersonProfile id={route.id} t={t} lang={lang} data={data} go={go} addComment={addComment}
      onUpdatePerson={handleUpdatePerson} onEditPerson={handleEditPerson} onDeletePerson={handleDeletePerson}
      interactions={data.interactions[route.id] || []}
      onAddInteraction={(item) => addInteraction(route.id, item)}
      onDeleteInteraction={(id) => deleteInteraction(route.id, id)}
      tasks={data.tasks[route.id] || []}
      onAddTask={(task) => addTask(route.id, task)}
      onToggleTask={(id) => toggleTask(route.id, id)}
      onDeleteTask={(id) => deleteTask(route.id, id)}
      changelog={data.changelog[route.id] || []}
      users={window.PROMEZA_USERS || []} currentUser={userEmail}
      attachments={data.attachments[route.id] || []}
      onAddAttachment={(att) => addAttachment(route.id, att)}
      onDeleteAttachment={(attId) => deleteAttachment(route.id, attId)}
    />; break;
    case "tasks": view = <GlobalTasksView t={t} lang={lang} data={data} go={go}
      tasks={data.tasks} users={window.PROMEZA_USERS || []} currentUser={userEmail}
      onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask}
      dupCount={totalDups}
    />; break;
    case "my-tasks": view = <MyTasksView t={t} lang={lang} data={data} go={go}
      tasks={data.tasks} onToggleTask={toggleTask} onDeleteTask={deleteTask}
      currentUser={userEmail} users={window.PROMEZA_USERS || []}
    />; break;
    case "entity": view = <EntityProfile id={route.id} t={t} lang={lang} data={data} go={go} addComment={addComment} onUpdateEntity={handleUpdateEntity} onUpdatePerson={handleUpdatePerson} onEditEntity={handleEditEntity} onDeleteEntity={handleDeleteEntity} changelog={data.changelog[route.id] || []} attachments={data.attachments[route.id] || []} onAddAttachment={(att) => addAttachment(route.id, att)} onDeleteAttachment={(attId) => deleteAttachment(route.id, attId)} />; break;
    case "projects": view = <ProjectsListView lang={lang} data={data} go={go} onAddProject={addProject} />; break;
    case "project": view = <ProjectDetailView id={route.id} lang={lang} data={data} go={go} onUpdateProject={updateProject} onDeleteProject={deleteProject} onAddMember={addProjectMember} onRemoveMember={removeProjectMember} comments={data.comments[route.id] || []} onAddComment={(projectId, text) => addComment(projectId, text)} attachments={data.attachments[route.id] || []} onAddAttachment={(att) => addAttachment(route.id, att)} onDeleteAttachment={(attId) => deleteAttachment(route.id, attId)} />; break;
    case "campaigns": view = <CampaignsView lang={lang} data={data} go={go} onSaveCampaign={saveCampaign} />; break;
    case "calendar": view = <CalendarView lang={lang} data={data} go={go} onAddCalendarEvent={addCalendarEvent} onDeleteCalendarEvent={deleteCalendarEvent} onAddTask={addTask} />; break;
    case "goals": view = <GoalsView lang={lang} data={data} go={go} onAddGoal={addGoal} onUpdateGoal={updateGoal} onDeleteGoal={deleteGoal} />; break;
    case "county": view = <CountyView t={t} lang={lang} data={data} go={go} />; break;
    case "map": view = <MapPage t={t} lang={lang} data={data} go={go} />; break;
    case "duplicates": view = <DuplicatesPage pairs={dupPairs} data={data} onMerge={handleMergePersonas} onMergeWithData={handleMergeWithData} onDismiss={handleDismissDup} onUndismiss={handleUndismissDup} onScanAll={handleScanAll} onCreateDemo={handleCreateDemo} t={t} lang={lang} />; break;
    default: view = <Home t={t} lang={lang} data={data} go={go} />;
  }

  return (
    <div className="app">
      {sideOpen && <div className="sidebar-overlay visible" onClick={() => setSideOpen(false)} />}
      <Sidebar route={route} go={go} t={t} counts={counts} mobileOpen={sideOpen} onClose={() => setSideOpen(false)} />
      <Topbar
        t={t} lang={lang} setLang={setLang}
        query={query} setQuery={setQuery}
        onSearchSubmit={() => { if (query.trim() && route.name !== "personas" && route.name !== "entities") setRoute({ name: "personas" }); }}
        onSettings={() => setModal("settings")}
        onLogout={() => { clearSession(); sessionStorage.removeItem(window.CryptoUtils?.SESSION_CRYPTO_KEY || "promeza_sk"); if (window.AIRTABLE) window.AIRTABLE.logAccess(userEmail, "Cierre de sesión"); setUserEmail(null); }}
        userEmail={userEmail}
        data={data}
        go={go}
        onMenuToggle={() => setSideOpen(v => !v)}
        dupCount={counts.dups}
        onGoBack={goBack}
        canGoBack={routeHistory.length > 0}
        atSyncing={atSyncing}
        onSyncNow={syncFromAirtable}
      />
      {atSyncMsg && (
        <div onClick={() => setAtSyncMsg(null)} style={{
          position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
          background: atSyncMsg.type === "ok" ? "#166534" : atSyncMsg.type === "warn" ? "#92400e" : "#991b1b",
          color: "#fff", padding: "8px 18px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
          zIndex: 9999, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,.25)", maxWidth: "90vw", textAlign: "center",
        }}>
          {atSyncMsg.text}
        </div>
      )}
      <main className="main">{view}</main>

      {modal === "new-person" && (
        <NewPersonForm t={t} lang={lang} data={data} onClose={() => { setModal(null); setModalPrefill(null); }} onSave={handleSavePerson} prefillData={modalPrefill} />
      )}
      {modal === "new-entity" && (
        <NewEntityForm t={t} lang={lang} data={data} onClose={() => setModal(null)} onSave={handleSaveEntity} />
      )}
      {modal === "settings" && (
        <SettingsModal
          t={t} lang={lang} data={data} cryptoKey={cryptoKey}
          onClose={() => setModal(null)}
          onLogout={() => { clearSession(); sessionStorage.removeItem(window.CryptoUtils.SESSION_CRYPTO_KEY || "promeza_sk"); setUserEmail(null); }}
          onRestoreData={setData}
        />
      )}
      {modal === "edit-person" && editingId && (() => {
        const person = data.personas.find(p => p.id === editingId);
        if (!person) return null;
        return <NewPersonForm t={t} lang={lang} data={data} onClose={() => { setModal(null); setEditingId(null); }} onSave={handleSaveEditPerson} initialData={person} editMode />;
      })()}
      {modal === "edit-entity" && editingId && (() => {
        const entity = data.entities.find(e => e.id === editingId);
        if (!entity) return null;
        return <NewEntityForm t={t} lang={lang} data={data} onClose={() => { setModal(null); setEditingId(null); }} onSave={handleSaveEditEntity} initialData={entity} editMode />;
      })()}
      {showReminders && data && (
        <RemindersModal lang={lang} data={data} onClose={() => setShowReminders(false)} go={go} />
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
