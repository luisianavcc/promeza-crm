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

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("promeza_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge any new personas/entities from PROMEZA_DATA not yet in localStorage
        const savedPersonaIds = new Set((parsed.personas || []).map(p => p.id));
        const newPersonas = window.PROMEZA_DATA.personas.filter(p => !savedPersonaIds.has(p.id));
        const savedEntityIds = new Set((parsed.entities || []).map(e => e.id));
        const newEntities = window.PROMEZA_DATA.entities.filter(e => !savedEntityIds.has(e.id));
        // Merge demo tasks for new personas only (don't overwrite existing task lists)
        const demoTasks = window.PROMEZA_DATA.tasks || {};
        const mergedTasks = { ...demoTasks, ...(parsed.tasks || {}) };
        return {
          ...parsed,
          personas: [...(parsed.personas || []), ...newPersonas],
          entities: [...(parsed.entities || []), ...newEntities],
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
      }
    } catch {}
    return {
      personas: [...window.PROMEZA_DATA.personas],
      entities: [...window.PROMEZA_DATA.entities],
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
    };
  });

  useEffect(() => {
    localStorage.setItem("promeza_data", JSON.stringify(data));
  }, [data]);

  // Auto-scan for duplicates on load + auto-generate tasks for new pairs
  useEffect(() => {
    const personaPairs = findDuplicatePairs(data.personas, []);
    if (personaPairs.length > 0) {
      setDupPairs(personaPairs);
      // Auto-create a task on each persona in the pair if not already there
      setData(d => {
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
  }, []); // run once on mount

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

  const allTasksFlat = Object.values(data.tasks).flat();
  const pendingTasks = allTasksFlat.filter(t => !t.done).length;
  const overdueCount = allTasksFlat.filter(t => t.due && !t.done && t.due < new Date().toISOString().slice(0, 10)).length;
  const completedGoals = (data.goals || []).filter(g => {
    if (g.archived) return false;
    const GOAL_METRICS = window.GOAL_METRICS || [];
    const metric = GOAL_METRICS.find(m => m.id === g.metric);
    return metric && metric.compute(data) >= g.target;
  }).length;
  const totalDups = dupPairs.filter(p => !p.dismissed).length + entityDupPairs.filter(p => !p.dismissed).length;
  const counts = { personas: data.personas.length, entities: data.entities.length, dups: totalDups, pendingTasks: pendingTasks || null, overdueCount, projects: (data.projects || []).length || null, completedGoals: completedGoals || null };

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
    const createdAtE = new Date().toISOString();
    setData(d => {
      const next = { ...d, entities: [newE, ...d.entities] };
      next.changelog = { ...(next.changelog || {}), [id]: [{ id: "cl" + id, date: createdAtE, author: userEmail || "Usuario", changes: [{ field: "record", type: "created" }] }] };
      return next;
    });
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
    setData(d => {
      const old = d.personas.find(p => p.id === id);
      const changes = old ? computeChanges(old, updates, PERSON_FIELD_LABELS) : [];
      const cl = changes.length > 0 ? {
        ...d.changelog,
        [id]: [{ id: "cl" + Date.now(), date: new Date().toISOString(), author: userEmail || "Usuario", changes }, ...(d.changelog[id] || [])],
      } : d.changelog;
      return { ...d, personas: d.personas.map(p => p.id === id ? { ...p, ...updates } : p), changelog: cl };
    });
  };

  const handleUpdateEntity = (id, updates) => {
    setData(d => {
      const old = d.entities.find(e => e.id === id);
      const changes = old ? computeChanges(old, updates, ENTITY_FIELD_LABELS) : [];
      const cl = changes.length > 0 ? {
        ...d.changelog,
        [id]: [{ id: "cl" + Date.now(), date: new Date().toISOString(), author: userEmail || "Usuario", changes }, ...(d.changelog[id] || [])],
      } : d.changelog;
      return { ...d, entities: d.entities.map(e => e.id === id ? { ...e, ...updates } : e), changelog: cl };
    });
  };

  const handleEditPerson = (id) => { setEditingId(id); setModal("edit-person"); };
  const handleSaveEditPerson = (form) => {
    const tags = form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    const status = form.stage === "inactivo" ? "inactivo" : "activo";
    handleUpdatePerson(editingId, { ...form, tags, status, entities: form.entities.map(le => ({ id: le.id, role: le.role, roleOther: le.roleOther })) });
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
        userEmail={userEmail}
        data={data}
        go={go}
        onMenuToggle={() => setSideOpen(v => !v)}
        dupCount={counts.dups}
        onGoBack={goBack}
        canGoBack={routeHistory.length > 0}
      />
      <main className="main">{view}</main>

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
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
