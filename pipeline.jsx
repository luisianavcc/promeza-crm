// PROMEZA CRM — Pipeline / Directorio de Contactos

const PipelineView = ({ t, lang, data, go, onUpdatePerson }) => {
  const [tab, setTab] = React.useState("activos");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all"); // all | personas | entidades
  const today = new Date().toISOString().slice(0, 10);
  const stages = window.PIPELINE_STAGES || [];
  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");
  const getUID = window.getUID || ((id) => id);

  const norm = (s) => (s || "").toLowerCase();
  const matchesSearch = (name, extra = "") => {
    const q = search.trim().toLowerCase();
    return !q || norm(name).includes(q) || norm(extra).includes(q);
  };

  // ─── Counts for tabs ───
  const activePersonas = data.personas.filter(p => p.status !== "inactivo");
  const activeEntities = data.entities.filter(e => (e.status || "activo") !== "inactivo");
  const inactivePersonas = data.personas.filter(p => p.status === "inactivo");
  const inactiveEntities = data.entities.filter(e => (e.status || "activo") === "inactivo");
  const reviewPersonas = data.personas.filter(p => window.hasContactIssue ? window.hasContactIssue(p) : false);

  const TABS = [
    { id: "activos",      label: "Activos",         count: activePersonas.length + activeEntities.length },
    { id: "inhabilitados", label: "Inhabilitados",  count: inactivePersonas.length + inactiveEntities.length },
    { id: "revision",     label: "Por Revisión",    count: reviewPersonas.length },
  ];

  // ─── Filtered sets ───
  const filteredActivePersonas = activePersonas.filter(p =>
    (typeFilter === "all" || typeFilter === "personas") &&
    matchesSearch(fullName(p), p.role + " " + p.city)
  );
  const filteredActiveEntities = activeEntities.filter(e =>
    (typeFilter === "all" || typeFilter === "entidades") &&
    matchesSearch(e.name, e.city + " " + e.type)
  );
  const filteredInactivePersonas = inactivePersonas.filter(p =>
    (typeFilter === "all" || typeFilter === "personas") &&
    matchesSearch(fullName(p), p.city)
  );
  const filteredInactiveEntities = inactiveEntities.filter(e =>
    (typeFilter === "all" || typeFilter === "entidades") &&
    matchesSearch(e.name, e.city)
  );
  const filteredReview = reviewPersonas.filter(p => matchesSearch(fullName(p), p.email + " " + p.phone));

  // ─── Card components ───
  const PersonaCard = ({ p }) => {
    const sid = stageOf(p);
    const stage = stages.find(s => s.id === sid);
    const isOverdue = p.nextAction && p.nextAction < today;
    const mainEntity = p.entities && p.entities.length > 0
      ? data.entities.find(e => e.id === p.entities[0].id) : null;
    const daysUntil = p.nextAction
      ? Math.round((new Date(p.nextAction) - new Date(today)) / 86400000) : null;
    const pendingTasks = (data.tasks?.[p.id] || []).filter(tk => !tk.done).length;
    const overdueTasks = (data.tasks?.[p.id] || []).filter(tk => !tk.done && tk.due && tk.due < today).length;

    return (
      <div style={{
        background: isOverdue ? "#fff8f8" : "var(--bg)",
        borderRadius: 12,
        border: "1px solid " + (isOverdue ? "#fecaca" : "var(--line)"),
        borderLeft: "4px solid " + (stage ? stage.color : "var(--line)"),
        padding: "13px 14px 11px",
        display: "flex", flexDirection: "column", gap: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        transition: "box-shadow .15s, transform .15s",
        cursor: "pointer",
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.09)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
        onClick={() => go({ name: "person", id: p.id })}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div className="av-circle" style={{ background: p.color, width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>
            {initials(fullName(p))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName(p)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", background: "var(--accent-50)", padding: "1px 5px", borderRadius: 4, flexShrink: 0, fontWeight: 700 }}>#{getUID(p.id)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.roles[p.role] || p.role}{mainEntity ? " · " + mainEntity.name : ""}{p.city ? " · " + p.city : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: stage ? stage.color : "var(--ink-4)", flexShrink: 0 }} />
          <select
            value={sid}
            onChange={e => { e.stopPropagation(); const next = e.target.value; onUpdatePerson(p.id, { stage: next, status: next === "inactivo" ? "inactivo" : "activo" }); }}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: stage ? stage.color : "var(--ink-3)", cursor: "pointer", outline: "none", padding: 0 }}>
            {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {(pendingTasks > 0) && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: overdueTasks > 0 ? "var(--bad)" : "var(--ink-3)", background: overdueTasks > 0 ? "#fee2e2" : "var(--bg-soft)", padding: "1px 6px", borderRadius: 5 }}>
              {overdueTasks > 0 ? "⚠" : "✓"} {pendingTasks} tarea{pendingTasks !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}>
          {p.nextAction ? (
            <div style={{ fontSize: 11.5, display: "flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 6, background: isOverdue ? "#fee2e2" : "var(--accent-50)", color: isOverdue ? "var(--bad)" : "var(--accent)", fontWeight: 600 }}>
              <Icon name="calendar" size={11} />
              {fmtDate(p.nextAction, lang)}
              {isOverdue && <span style={{ fontSize: 10 }}> · {Math.abs(daysUntil)}d vencida</span>}
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "var(--ink-4)", fontStyle: "italic" }}>Sin próx. acción</span>
          )}
          <span style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
            {p.lastContact ? fmtDate(p.lastContact, lang) : "—"}
          </span>
        </div>
      </div>
    );
  };

  const EntityCard = ({ e }) => {
    const personaCount = data.personas.filter(p => (p.entities || []).some(le => le.id === e.id)).length;
    const types = window.PROJECT_TYPES || [];
    const daysSince = e.lastContact ? Math.round((new Date(today) - new Date(e.lastContact)) / 86400000) : null;

    return (
      <div style={{
        background: "var(--bg)", borderRadius: 12, border: "1px solid var(--line)",
        borderLeft: "4px solid #0ea5e9",
        padding: "13px 14px 11px", display: "flex", flexDirection: "column", gap: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,.05)", transition: "box-shadow .15s, transform .15s", cursor: "pointer",
      }}
        onMouseEnter={ev => { ev.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.09)"; ev.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={ev => { ev.currentTarget.style.boxShadow = ""; ev.currentTarget.style.transform = ""; }}
        onClick={() => go({ name: "entity", id: e.id })}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0ea5e915", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="building" size={16} style={{ color: "#0ea5e9" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#0ea5e9", background: "#f0f9ff", padding: "1px 5px", borderRadius: 4, flexShrink: 0, fontWeight: 700 }}>#{getUID(e.id)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {(t.types || {})[e.type] || e.type}{e.city ? " · " + e.city : ""}{e.country ? ", " + e.country : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {e.size && (
            <span style={{ fontSize: 11, color: "var(--ink-3)", background: "var(--bg-soft)", padding: "2px 7px", borderRadius: 5 }}>
              {e.size.toLocaleString()} miembros
            </span>
          )}
          <span style={{ fontSize: 11, color: "#0ea5e9", background: "#f0f9ff", padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>
            {personaCount} contacto{personaCount !== 1 ? "s" : ""}
          </span>
          {daysSince !== null && (
            <span style={{ fontSize: 10.5, color: "var(--ink-4)", marginLeft: "auto" }}>
              {daysSince === 0 ? "hoy" : daysSince + "d atrás"}
            </span>
          )}
        </div>
      </div>
    );
  };

  const ReviewCard = ({ p }) => {
    const email = (p.email || "").trim();
    const phone = (p.phone || "").replace(/\D/g, "");
    const issues = [];
    if (!email && phone.length < 7) issues.push("Sin email ni teléfono");
    else {
      if (email && !email.includes("@")) issues.push("Email con formato incorrecto");
      if (p.emailStatus === "bad") issues.push("Email no funciona");
      if (p.phoneStatus === "bad") issues.push("Teléfono no funciona");
      if (!phone || phone.length < 7) issues.push("Sin teléfono");
      if (!email) issues.push("Sin email");
    }

    return (
      <div style={{
        background: "var(--bg)", borderRadius: 12, border: "1px solid #fde68a",
        borderLeft: "4px solid #f59e0b",
        padding: "13px 14px 11px", display: "flex", flexDirection: "column", gap: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,.05)", transition: "box-shadow .15s, transform .15s", cursor: "pointer",
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.09)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
        onClick={() => go({ name: "person", id: p.id })}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div className="av-circle" style={{ background: p.color, width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>
            {initials(fullName(p))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{fullName(p)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#f59e0b", background: "#fffbeb", padding: "1px 5px", borderRadius: 4, flexShrink: 0, fontWeight: 700 }}>#{getUID(p.id)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
              {t.roles[p.role] || p.role}{p.city ? " · " + p.city : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {issues.map(issue => (
            <span key={issue} style={{ fontSize: 11.5, fontWeight: 600, color: "#92400e", background: "#fef3c7", padding: "2px 8px", borderRadius: 5, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="alert" size={11} /> {issue}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "space-between", fontSize: 11, color: "var(--ink-4)" }}>
          <span>{p.email || "—"}</span>
          <span>{p.phone || "—"}</span>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ label, count, icon }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 4 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={14} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-2)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-4)", background: "var(--bg-soft)", padding: "1px 8px", borderRadius: 10 }}>{count}</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Directorio</h1>
          <div className="page-sub">
            {activePersonas.length} personas · {activeEntities.length} entidades activas
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }}>
            <Icon name="search" size={14} />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ciudad…"
            style={{ paddingLeft: 32, width: 220, height: 36, fontSize: 13, borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", fontFamily: "inherit", color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--line)", paddingBottom: 0 }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: "8px 16px", border: "none", background: "none", fontFamily: "inherit",
            fontSize: 13.5, fontWeight: tab === tb.id ? 700 : 500,
            color: tab === tb.id ? "var(--accent)" : "var(--ink-3)",
            borderBottom: tab === tb.id ? "2px solid var(--accent)" : "2px solid transparent",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: -1,
            transition: "color .15s",
          }}>
            {tb.label}
            {tb.count > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: tab === tb.id ? "var(--accent-50)" : "var(--bg-soft)", color: tab === tb.id ? "var(--accent)" : "var(--ink-3)", padding: "1px 7px", borderRadius: 10 }}>
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Type filter (only for activos + inhabilitados) */}
      {(tab === "activos" || tab === "inhabilitados") && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[
            { id: "all", label: "Todo" },
            { id: "personas", label: "Personas" },
            { id: "entidades", label: "Entidades" },
          ].map(f => (
            <button key={f.id} onClick={() => setTypeFilter(f.id)} style={{
              padding: "4px 12px", borderRadius: 999, border: "1.5px solid",
              borderColor: typeFilter === f.id ? "var(--accent)" : "var(--line)",
              background: typeFilter === f.id ? "var(--accent-50)" : "var(--bg)",
              color: typeFilter === f.id ? "var(--accent)" : "var(--ink-3)",
              fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── ACTIVOS ── */}
      {tab === "activos" && (
        <div>
          {(typeFilter === "all" || typeFilter === "personas") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader label="Personas activas" count={filteredActivePersonas.length} icon="users" />
              {filteredActivePersonas.length === 0
                ? <div className="empty" style={{ padding: "24px 0", fontSize: 12 }}>Sin resultados</div>
                : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                    {filteredActivePersonas.map(p => <PersonaCard key={p.id} p={p} />)}
                  </div>
                )
              }
            </div>
          )}
          {(typeFilter === "all" || typeFilter === "entidades") && (
            <div>
              <SectionHeader label="Entidades activas" count={filteredActiveEntities.length} icon="building" />
              {filteredActiveEntities.length === 0
                ? <div className="empty" style={{ padding: "24px 0", fontSize: 12 }}>Sin resultados</div>
                : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                    {filteredActiveEntities.map(e => <EntityCard key={e.id} e={e} />)}
                  </div>
                )
              }
            </div>
          )}
        </div>
      )}

      {/* ── INHABILITADOS ── */}
      {tab === "inhabilitados" && (
        <div>
          {(typeFilter === "all" || typeFilter === "personas") && filteredInactivePersonas.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader label="Personas inhabilitadas" count={filteredInactivePersonas.length} icon="users" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {filteredInactivePersonas.map(p => <PersonaCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
          {(typeFilter === "all" || typeFilter === "entidades") && filteredInactiveEntities.length > 0 && (
            <div>
              <SectionHeader label="Entidades inhabilitadas" count={filteredInactiveEntities.length} icon="building" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {filteredInactiveEntities.map(e => <EntityCard key={e.id} e={e} />)}
              </div>
            </div>
          )}
          {filteredInactivePersonas.length === 0 && filteredInactiveEntities.length === 0 && (
            <div className="empty" style={{ padding: "60px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div>No hay registros inhabilitados</div>
            </div>
          )}
        </div>
      )}

      {/* ── POR REVISIÓN ── */}
      {tab === "revision" && (
        <div>
          {filteredReview.length === 0 ? (
            <div className="empty" style={{ padding: "60px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div>Toda la información de contacto está en orden</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 12.5, color: "#92400e", fontWeight: 500 }}>
                <Icon name="alert" size={13} /> {filteredReview.length} contacto{filteredReview.length !== 1 ? "s" : ""} con información incompleta o incorrecta. Haz clic en cada uno para corregir.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {filteredReview.map(p => <ReviewCard key={p.id} p={p} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

window.PipelineView = PipelineView;
