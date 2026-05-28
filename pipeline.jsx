// PROMEZA CRM — Pipeline (Emil Kowalski-inspired redesign)

const PipelineView = ({ t, lang, data, go, onUpdatePerson }) => {
  const stages = window.PIPELINE_STAGES || [];
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState("all");

  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  const filtered = data.personas.filter(p => {
    if (stageFilter !== "all" && stageOf(p) !== stageFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const name = (p.first + " " + p.last).toLowerCase();
      const city = (p.city || "").toLowerCase();
      const role = (t.roles[p.role] || p.role || "").toLowerCase();
      if (!name.includes(s) && !city.includes(s) && !role.includes(s)) return false;
    }
    return true;
  });

  const countByStage = Object.fromEntries(stages.map(s => [s.id, data.personas.filter(p => stageOf(p) === s.id).length]));
  const totalActive = data.personas.filter(p => stageOf(p) !== "inactivo").length;
  const overdueTotal = data.personas.filter(p => p.nextAction && p.nextAction < today && stageOf(p) !== "inactivo").length;

  const stageColor = (id) => (stages.find(s => s.id === id) || {}).color || "var(--ink-3)";

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <div className="page-sub">
            {totalActive} {lang === "es" ? "activos" : "active"}
            {overdueTotal > 0 && (
              <span style={{ color: "var(--bad)", fontWeight: 600, marginLeft: 8 }}>
                · {overdueTotal} {lang === "es" ? "vencidas" : "overdue"}
              </span>
            )}
          </div>
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }}>
            <Icon name="search" size={14} />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === "es" ? "Buscar persona…" : "Search person…"}
            style={{ paddingLeft: 32, width: 220, height: 36, fontSize: 13, borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", fontFamily: "inherit", color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* Stage filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setStageFilter("all")} style={{
          padding: "6px 14px", borderRadius: 999, border: "1.5px solid",
          borderColor: stageFilter === "all" ? "var(--accent)" : "var(--line)",
          background: stageFilter === "all" ? "var(--accent-50)" : "var(--bg)",
          color: stageFilter === "all" ? "var(--accent-700)" : "var(--ink-3)",
          fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}>
          {lang === "es" ? "Todas" : "All"} · {data.personas.length}
        </button>
        {stages.map(s => (
          <button key={s.id} onClick={() => setStageFilter(stageFilter === s.id ? "all" : s.id)} style={{
            padding: "6px 14px", borderRadius: 999, border: "1.5px solid",
            borderColor: stageFilter === s.id ? s.color : s.color + "40",
            background: stageFilter === s.id ? s.bg : "var(--bg)",
            color: stageFilter === s.id ? s.color : "var(--ink-2)",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ color: s.color, fontWeight: 800 }}>{countByStage[s.id] || 0}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="empty" style={{ padding: "60px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div>{lang === "es" ? "Sin resultados para esta búsqueda" : "No results for this search"}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {filtered.map(p => {
            const sid = stageOf(p);
            const stage = stages.find(s => s.id === sid);
            const isOverdue = p.nextAction && p.nextAction < today;
            const isDue = p.nextAction && p.nextAction >= today;
            const mainEntity = p.entities && p.entities.length > 0
              ? data.entities.find(e => e.id === p.entities[0].id) : null;
            const daysUntil = p.nextAction
              ? Math.round((new Date(p.nextAction) - new Date(today)) / 86400000)
              : null;

            return (
              <div key={p.id} style={{
                background: isOverdue ? "#fff8f8" : "var(--bg)",
                borderRadius: 12,
                border: "1px solid " + (isOverdue ? "#fecaca" : "var(--line)"),
                borderLeft: "4px solid " + (stage ? stage.color : "var(--line)"),
                boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
                padding: "14px 14px 12px",
                display: "flex", flexDirection: "column", gap: 10,
                transition: "box-shadow .15s, transform .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; e.currentTarget.style.transform = ""; }}
              >
                {/* Top: avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                  onClick={() => go({ name: "person", id: p.id })}>
                  <div className="av-circle" style={{ background: p.color, width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                    {initials(fullName(p))}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fullName(p)}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.roles[p.role] || p.role}
                      {mainEntity && <span> · {mainEntity.name}</span>}
                      {p.city && <span> · {p.city}</span>}
                    </div>
                  </div>
                </div>

                {/* Stage selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage ? stage.color : "var(--ink-4)", flexShrink: 0 }} />
                  <select
                    value={sid}
                    onChange={e => {
                      const next = e.target.value;
                      onUpdatePerson(p.id, { stage: next, status: next === "inactivo" ? "inactivo" : "activo" });
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1, border: "none", background: "transparent",
                      fontFamily: "inherit", fontSize: 12.5, fontWeight: 600,
                      color: stage ? stage.color : "var(--ink-3)",
                      cursor: "pointer", outline: "none", padding: 0,
                    }}>
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Next action */}
                {p.nextAction ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 9px", borderRadius: 7, fontSize: 12,
                    background: isOverdue ? "#fee2e2" : "var(--accent-50)",
                    color: isOverdue ? "var(--bad)" : "var(--accent)",
                    fontWeight: 600,
                  }}>
                    <Icon name="calendar" size={12} />
                    {fmtDate(p.nextAction, lang)}
                    {isOverdue && (
                      <span style={{ marginLeft: "auto", fontSize: 11 }}>
                        {Math.abs(daysUntil)}d {lang === "es" ? "vencida" : "overdue"}
                      </span>
                    )}
                    {!isOverdue && daysUntil === 0 && (
                      <span style={{ marginLeft: "auto", fontSize: 11 }}>{lang === "es" ? "hoy" : "today"}</span>
                    )}
                    {!isOverdue && daysUntil > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)", fontWeight: 400 }}>+{daysUntil}d</span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", fontStyle: "italic" }}>
                    {lang === "es" ? "Sin próxima acción" : "No next action"}
                  </div>
                )}

                {/* Last contact */}
                <div style={{ fontSize: 11, color: "var(--ink-4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{lang === "es" ? "Último contacto:" : "Last contact:"} {p.lastContact ? fmtDate(p.lastContact, lang) : "—"}</span>
                  <button
                    onClick={() => go({ name: "person", id: p.id })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 11, fontFamily: "inherit", fontWeight: 600, padding: 0 }}>
                    {lang === "es" ? "Ver →" : "View →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

window.PipelineView = PipelineView;
