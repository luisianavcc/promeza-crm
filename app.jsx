// PROMEZA CRM — App root with auth + settings modal

const { useState, useMemo, useEffect, useRef } = React;

// ─── Settings Modal ───

const SettingsModal = ({ t, lang, data, onClose, onLogout }) => {
  const [ejsCfg, setEjsCfg] = useState(() => {
    try { return JSON.parse(localStorage.getItem("promeza_ejs")) || {}; } catch { return {}; }
  });
  const [atCfg, setAtCfg] = useState(() => window.AIRTABLE.getConfig());
  const [syncStatus, setSyncStatus] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("airtable");

  const st = t.settings || {};
  const tabs = [
    { id: "airtable", label: "Airtable" },
    { id: "emailjs", label: "EmailJS" },
    { id: "account", label: lang === "es" ? "Cuenta" : "Account" },
  ];

  const saveAll = () => {
    localStorage.setItem("promeza_ejs", JSON.stringify(ejsCfg));
    window.AIRTABLE.saveConfig(atCfg);
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
              <div style={{ background: "var(--accent-50)", border: "1px solid var(--accent-100)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "var(--ink-2)" }}>
                <strong>{lang === "es" ? "Instrucciones:" : "Instructions:"}</strong>
                <ol style={{ margin: "6px 0 0 16px", padding: 0, lineHeight: 1.8 }}>
                  <li>{lang === "es" ? "Ve a" : "Go to"} <a href="https://airtable.com/create/tokens" target="_blank" rel="noopener">airtable.com/create/tokens</a> {lang === "es" ? "y crea un token con permisos de lectura/escritura" : "and create a token with read/write permissions"}</li>
                  <li>{lang === "es" ? "Crea dos tablas en tu base:" : "Create two tables in your base:"} <strong>Personas</strong> {lang === "es" ? "y" : "and"} <strong>Entidades</strong></li>
                  <li>{lang === "es" ? "El Base ID empieza con 'app...' — lo encuentras en la URL de tu base" : "The Base ID starts with 'app...' — found in your base URL"}</li>
                </ol>
              </div>
              <Field label={st.pat || "Personal Access Token"} value={atCfg.pat} onChange={v => setAtCfg(c => ({ ...c, pat: v }))} placeholder="patxxxxxxxxxxxxxxxx" mono />
              <Field label={st.baseId || "Base ID"} value={atCfg.baseId} onChange={v => setAtCfg(c => ({ ...c, baseId: v }))} placeholder="appxxxxxxxxxxxxxxxx" mono />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label={st.personasTable || "Tabla Personas"} value={atCfg.personasTable || "Personas"} onChange={v => setAtCfg(c => ({ ...c, personasTable: v }))} placeholder="Personas" />
                <Field label={st.entidadesTable || "Tabla Entidades"} value={atCfg.entidadesTable || "Entidades"} onChange={v => setAtCfg(c => ({ ...c, entidadesTable: v }))} placeholder="Entidades" />
              </div>
              <div style={{ background: "var(--bg-soft)", borderRadius: 8, padding: "10px 14px", marginTop: 4, fontSize: 12, color: "var(--ink-3)" }}>
                {st.lastSync || "Última sync:"} <strong>{lastSyncFmt}</strong>
              </div>
              {syncStatus && (
                <div style={{
                  marginTop: 10, padding: "10px 14px", borderRadius: 8, fontSize: 12.5,
                  background: syncStatus.startsWith("✓") ? "#f0fdf4" : "#fff5f5",
                  color: syncStatus.startsWith("✓") ? "#166534" : "#991b1b",
                  border: "1px solid " + (syncStatus.startsWith("✓") ? "#bbf7d0" : "#fecaca"),
                }}>
                  {syncStatus}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={syncing || !atCfg.pat || !atCfg.baseId} onClick={doSync}>
                  <Icon name="sync" /> {syncing ? (st.syncing || "Sincronizando…") : (st.sync || "Sincronizar todo a Airtable")}
                </button>
              </div>
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

          {/* ─── Account ─── */}
          {tab === "account" && (
            <div>
              <div style={{ background: "var(--bg-soft)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{lang === "es" ? "Cuenta activa" : "Active account"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="av-circle" style={{ background: "var(--accent)" }}>B</div>
                  <span style={{ fontSize: 13 }}>betty@promeza.com</span>
                </div>
              </div>
              <div style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
                {lang === "es"
                  ? "Para cambiar la contraseña, cierra sesión y usa la opción '¿Olvidaste tu contraseña?' en el login."
                  : "To change your password, sign out and use the 'Forgot password?' option on the login screen."}
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
  const [modal, setModal] = useState(null); // 'new-person' | 'new-entity' | 'settings' | null

  const [data, setData] = useState(() => ({
    personas: [...window.PROMEZA_DATA.personas],
    entities: [...window.PROMEZA_DATA.entities],
    comments: { ...window.PROMEZA_DATA.comments },
  }));

  const go = (r) => {
    if (r.name === "new-person") { setModal("new-person"); return; }
    if (r.name === "new-entity") { setModal("new-entity"); return; }
    setRoute(r);
    window.scrollTo({ top: 0 });
  };

  const counts = { personas: data.personas.length, entities: data.entities.length };

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
    const id = "p" + (data.personas.length + 1);
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
      tags, language: form.language, status: form.status,
      birthday: form.birthday, lastContact: form.lastContact,
      color,
    };
    setData(d => ({ ...d, personas: [newP, ...d.personas] }));
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
      tags,
    };
    setData(d => ({ ...d, entities: [newE, ...d.entities] }));
    setModal(null);
    setRoute({ name: "entity", id });
  };

  // Not ready yet
  if (!authChecked) return null;

  // Not logged in
  if (!userEmail) {
    return <AuthScreen onLogin={(email) => { setUserEmail(email); }} />;
  }

  let view;
  switch (route.name) {
    case "home": view = <Home t={t} lang={lang} data={data} go={go} />; break;
    case "personas": view = <PersonasList t={t} lang={lang} data={data} go={go} />; break;
    case "entities": view = <EntitiesList t={t} lang={lang} data={data} go={go} />; break;
    case "person": view = <PersonProfile id={route.id} t={t} lang={lang} data={data} go={go} addComment={addComment} />; break;
    case "entity": view = <EntityProfile id={route.id} t={t} lang={lang} data={data} go={go} addComment={addComment} />; break;
    case "map": view = <MapPage t={t} lang={lang} data={data} go={go} />; break;
    default: view = <Home t={t} lang={lang} data={data} go={go} />;
  }

  return (
    <div className="app">
      <Sidebar route={route} go={go} t={t} counts={counts} />
      <Topbar
        t={t} lang={lang} setLang={setLang}
        query={query} setQuery={setQuery}
        onSearchSubmit={() => { if (query.trim()) setRoute({ name: "personas" }); }}
        onSettings={() => setModal("settings")}
        userEmail={userEmail}
      />
      <main className="main">{view}</main>

      {modal === "new-person" && (
        <NewPersonForm t={t} lang={lang} data={data} onClose={() => setModal(null)} onSave={handleSavePerson} />
      )}
      {modal === "new-entity" && (
        <NewEntityForm t={t} lang={lang} data={data} onClose={() => setModal(null)} onSave={handleSaveEntity} />
      )}
      {modal === "settings" && (
        <SettingsModal
          t={t} lang={lang} data={data}
          onClose={() => setModal(null)}
          onLogout={() => setUserEmail(null)}
        />
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
