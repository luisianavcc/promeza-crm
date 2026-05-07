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
                <Field label={st.personasTable || "Tabla Personas"} value={atCfg.personasTable || "PERSONAS PROMEZA CRM"} onChange={v => setAtCfg(c => ({ ...c, personasTable: v }))} placeholder="PERSONAS PROMEZA CRM" />
                <Field label={st.entidadesTable || "Tabla Entidades"} value={atCfg.entidadesTable || "ENTIDADES PROMEZA CRM"} onChange={v => setAtCfg(c => ({ ...c, entidadesTable: v }))} placeholder="ENTIDADES PROMEZA CRM" />
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
  const [modal, setModal] = useState(null); // 'new-person' | 'new-entity' | 'edit-person' | 'edit-entity' | 'settings' | null
  const [editingId, setEditingId] = useState(null);
  const [modalPrefill, setModalPrefill] = useState(null);
  const [dupPairs, setDupPairs] = useState([]);
  const [showDups, setShowDups] = useState(false);

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("promeza_data");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      personas: [...window.PROMEZA_DATA.personas],
      entities: [...window.PROMEZA_DATA.entities],
      comments: { ...window.PROMEZA_DATA.comments },
    };
  });

  useEffect(() => {
    localStorage.setItem("promeza_data", JSON.stringify(data));
  }, [data]);

  const go = (r) => {
    if (r.name === "new-person") { setModalPrefill(r.prefill || null); setModal("new-person"); return; }
    if (r.name === "new-entity") { setModalPrefill(r.prefill || null); setModal("new-entity"); return; }
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
      tags, language: form.language, status: form.status,
      birthday: form.birthday, lastContact: form.lastContact,
      color,
    };
    setData(d => {
      const next = { ...d, personas: [newP, ...d.personas] };
      const pairs = findDuplicatePairs(next.personas, dupPairs);
      if (pairs.length > 0) { setDupPairs(prev => { const existing = new Set(prev.map(p => p.idA+"|"+p.idB)); return [...prev, ...pairs.filter(p => !existing.has(p.idA+"|"+p.idB))]; }); setShowDups(true); }
      return next;
    });
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
      tags, status: "activo",
    };
    setData(d => ({ ...d, entities: [newE, ...d.entities] }));
    setModal(null);
    setRoute({ name: "entity", id });
  };

  const handleImportPersonas = (imported) => {
    setData(d => {
      const next = { ...d, personas: [...imported, ...d.personas] };
      const pairs = findDuplicatePairs(next.personas, dupPairs);
      if (pairs.length > 0) { setDupPairs(prev => { const existing = new Set(prev.map(p => p.idA+"|"+p.idB)); return [...prev, ...pairs.filter(p => !existing.has(p.idA+"|"+p.idB))]; }); setShowDups(true); }
      return next;
    });
  };

  const handleImportEntities = (imported) => {
    setData(d => ({ ...d, entities: [...imported, ...d.entities] }));
  };

  const handleUpdatePerson = (id, updates) => {
    setData(d => ({ ...d, personas: d.personas.map(p => p.id === id ? { ...p, ...updates } : p) }));
  };

  const handleUpdateEntity = (id, updates) => {
    setData(d => ({ ...d, entities: d.entities.map(e => e.id === id ? { ...e, ...updates } : e) }));
  };

  const handleEditPerson = (id) => { setEditingId(id); setModal("edit-person"); };
  const handleSaveEditPerson = (form) => {
    const tags = form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    handleUpdatePerson(editingId, { ...form, tags, entities: form.entities.map(le => ({ id: le.id, role: le.role, roleOther: le.roleOther })) });
    setModal(null);
    setEditingId(null);
  };
  const handleDeletePerson = (id) => {
    if (!confirm(lang === "es" ? "¿Eliminar esta persona? Esta acción no se puede deshacer." : "Delete this person? This cannot be undone.")) return;
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
    setData(d => ({ ...d, entities: d.entities.filter(e => e.id !== id) }));
    setRoute({ name: "entities" });
  };

  const handleMergePersonas = (idA, idB) => {
    setData(d => {
      const keep = d.personas.find(p => p.id === idA);
      const drop = d.personas.find(p => p.id === idB);
      if (!keep || !drop) return d;
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
      return {
        ...d,
        personas: d.personas.map(p => p.id === idA ? merged : p).filter(p => p.id !== idB),
        comments: newComments,
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

  // Not ready yet
  if (!authChecked) return null;

  // Not logged in
  if (!userEmail) {
    return <AuthScreen onLogin={(email) => { setUserEmail(email); }} />;
  }

  let view;
  switch (route.name) {
    case "home": view = <Home t={t} lang={lang} data={data} go={go} />; break;
    case "personas": view = <PersonasList t={t} lang={lang} data={data} go={go} onImportPersonas={handleImportPersonas} globalQ={query} />; break;
    case "entities": view = <EntitiesList t={t} lang={lang} data={data} go={go} onImportEntities={handleImportEntities} globalQ={query} />; break;
    case "person": view = <PersonProfile id={route.id} t={t} lang={lang} data={data} go={go} addComment={addComment} onUpdatePerson={handleUpdatePerson} onEditPerson={handleEditPerson} onDeletePerson={handleDeletePerson} />; break;
    case "entity": view = <EntityProfile id={route.id} t={t} lang={lang} data={data} go={go} addComment={addComment} onUpdateEntity={handleUpdateEntity} onUpdatePerson={handleUpdatePerson} onEditEntity={handleEditEntity} onDeleteEntity={handleDeleteEntity} />; break;
    case "map": view = <MapPage t={t} lang={lang} data={data} go={go} />; break;
    default: view = <Home t={t} lang={lang} data={data} go={go} />;
  }

  return (
    <div className="app">
      <Sidebar route={route} go={go} t={t} counts={counts} />
      <Topbar
        t={t} lang={lang} setLang={setLang}
        query={query} setQuery={setQuery}
        onSearchSubmit={() => { if (query.trim() && route.name !== "personas" && route.name !== "entities") setRoute({ name: "personas" }); }}
        onSettings={() => setModal("settings")}
        userEmail={userEmail}
      />
      <main className="main">
        {dupPairs.filter(p => !p.dismissed).length > 0 && !showDups && (
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <span style={{ flex: 1, color: "#92400e" }}>
              <strong>{dupPairs.filter(p => !p.dismissed).length}</strong> {lang === "es" ? "posibles duplicados pendientes de revisar" : "possible duplicates pending review"}
            </span>
            <button className="btn btn-sm" style={{ borderColor: "#d97706", color: "#92400e" }} onClick={() => setShowDups(true)}>
              {lang === "es" ? "Revisar duplicados" : "Review duplicates"}
            </button>
          </div>
        )}
        {view}
      </main>

      {modal === "new-person" && (
        <NewPersonForm t={t} lang={lang} data={data} onClose={() => { setModal(null); setModalPrefill(null); }} onSave={handleSavePerson} prefillData={modalPrefill} />
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
      {showDups && dupPairs.some(p => !p.dismissed) && (
        <DuplicateReviewModal
          pairs={dupPairs}
          data={data}
          onMerge={handleMergePersonas}
          onDismiss={handleDismissDup}
          onClose={() => setShowDups(false)}
          t={t}
          lang={lang}
        />
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
