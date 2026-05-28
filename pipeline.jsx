// PROMEZA CRM — Pipeline Kanban view (redesigned)

const PipelineView = ({ t, lang, data, go, onUpdatePerson }) => {
  const stages = window.PIPELINE_STAGES || [];
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = React.useState("");
  const [focusStage, setFocusStage] = React.useState(null);

  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  const personas = data.personas.filter(p => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (p.first + " " + p.last + " " + (p.email || "") + " " + (p.city || "")).toLowerCase().includes(s);
  });

  const byStage = Object.fromEntries(stages.map(s => [s.id, []]));
  personas.forEach(p => {
    const s = stageOf(p);
    if (byStage[s]) byStage[s].push(p);
  });

  const allByStage = Object.fromEntries(stages.map(s => [s.id, []]));
  data.personas.forEach(p => {
    const s = stageOf(p);
    if (allByStage[s]) allByStage[s].push(p);
  });

  const moveStage = (p, dir) => {
    const ids = stages.map(s => s.id);
    const idx = ids.indexOf(stageOf(p));
    const next = ids[idx + dir];
    if (!next) return;
    onUpdatePerson(p.id, { stage: next, status: next === "inactivo" ? "inactivo" : "activo" });
  };

  const totalActive = data.personas.filter(p => stageOf(p) !== "inactivo").length;
  const needsAction = data.personas.filter(p => p.nextAction && p.nextAction <= today && stageOf(p) !== "inactivo").length;

  const visibleStages = focusStage ? stages.filter(s => s.id === focusStage) : stages;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <div className="page-sub">
            {totalActive} {lang === "es" ? "contactos activos" : "active contacts"}
            {needsAction > 0 && (
              <span style={{ color: "var(--bad)", fontWeight: 600, marginLeft: 8 }}>
                · {needsAction} {lang === "es" ? "requieren acción" : "need action"}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }}>
              <Icon name="search" size={14} />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === "es" ? "Buscar persona…" : "Search person…"}
              style={{ paddingLeft: 32, width: 200, fontSize: 13, height: 34, borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", fontFamily: "inherit", color: "var(--ink-1)" }}
            />
          </div>
        </div>
      </div>

      {/* Stage summary pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => setFocusStage(null)}
          style={{
            padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
            borderColor: focusStage === null ? "var(--accent)" : "var(--line)",
            background: focusStage === null ? "var(--accent-50)" : "transparent",
            color: focusStage === null ? "var(--accent)" : "var(--ink-3)",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>
          {lang === "es" ? "Todos" : "All"} <span style={{ marginLeft: 4, fontWeight: 700 }}>{data.personas.length}</span>
        </button>
        {stages.map(stage => {
          const cnt = allByStage[stage.id].length;
          const overdueInStage = allByStage[stage.id].filter(p => p.nextAction && p.nextAction < today).length;
          return (
            <button key={stage.id}
              onClick={() => setFocusStage(focusStage === stage.id ? null : stage.id)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                borderColor: focusStage === stage.id ? stage.color : stage.color + "50",
                background: focusStage === stage.id ? stage.bg : "transparent",
                color: focusStage === stage.id ? stage.color : "var(--ink-2)",
                fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 7,
              }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: stage.color }}>{cnt}</span>
              {stage.label}
              {overdueInStage > 0 && (
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 10, fontWeight: 700 }}>
                  {overdueInStage}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Kanban board */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 20, alignItems: "flex-start" }}>
        {visibleStages.map(stage => {
          const cards = byStage[stage.id] || [];
          const overdueCards = cards.filter(p => p.nextAction && p.nextAction < today);
          return (
            <div key={stage.id} style={{ flex: focusStage ? "1 1 0" : "0 0 260px", minWidth: focusStage ? 200 : 260, maxWidth: focusStage ? "none" : 260 }}>
              {/* Column header */}
              <div style={{
                padding: "10px 14px 9px",
                borderRadius: "10px 10px 0 0",
                background: `linear-gradient(135deg, ${stage.color}22, ${stage.color}08)`,
                borderTop: "3px solid " + stage.color,
                borderLeft: "1px solid " + stage.color + "30",
                borderRight: "1px solid " + stage.color + "30",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: stage.color }}>{stage.label}</div>
                  {overdueCards.length > 0 && (
                    <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginTop: 1 }}>
                      ⚠ {overdueCards.length} {lang === "es" ? "vencidas" : "overdue"}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 800, color: stage.color,
                  background: stage.color + "20", borderRadius: 10, padding: "2px 9px",
                  minWidth: 24, textAlign: "center",
                }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards list */}
              <div style={{
                background: "var(--bg-soft)", borderRadius: "0 0 10px 10px",
                border: "1px solid " + stage.color + "20",
                borderTop: "none",
                padding: "8px 7px", display: "flex", flexDirection: "column", gap: 7,
                minHeight: 120,
              }}>
                {cards.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "center", padding: "24px 8px", fontStyle: "italic" }}>
                    {search ? (lang === "es" ? "Sin coincidencias" : "No matches") : (lang === "es" ? "Ninguno" : "None")}
                  </div>
                )}

                {cards.map(p => {
                  const isOverdue = p.nextAction && p.nextAction < today;
                  const isDueSoon = p.nextAction && p.nextAction >= today;
                  const mainEntity = p.entities && p.entities.length > 0
                    ? data.entities.find(e => e.id === p.entities[0].id)
                    : null;
                  const idx = stages.findIndex(s => s.id === stage.id);

                  return (
                    <div key={p.id} style={{
                      background: "var(--bg)", borderRadius: 9,
                      border: "1px solid " + (isOverdue ? "#ef444440" : "var(--line)"),
                      boxShadow: isOverdue ? "0 0 0 1px #ef444420, 0 2px 6px rgba(0,0,0,.06)" : "0 1px 4px rgba(0,0,0,.06)",
                      overflow: "hidden",
                    }}>
                      {isOverdue && (
                        <div style={{ background: "#ef444412", borderBottom: "1px solid #ef444425", padding: "4px 10px", fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                          ⚠ {lang === "es" ? "Acción vencida" : "Action overdue"}
                        </div>
                      )}

                      {/* Card body */}
                      <div style={{ padding: "10px 11px" }}>
                        {/* Name + avatar */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, cursor: "pointer" }}
                          onClick={() => go({ name: "person", id: p.id })}>
                          <div className="av-circle" style={{ background: p.color, width: 30, height: 30, fontSize: 11.5, flexShrink: 0, lineHeight: "30px" }}>
                            {initials(fullName(p))}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-1)" }}>
                              {fullName(p)}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.roles[p.role] || p.role}
                              {mainEntity && <span style={{ opacity: 0.8 }}> · {mainEntity.name}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Next action */}
                        {p.nextAction && (
                          <div style={{
                            fontSize: 11.5, fontWeight: 600, marginBottom: 8, padding: "4px 8px", borderRadius: 6,
                            background: isOverdue ? "#ef444415" : (isDueSoon ? "var(--accent-50)" : "var(--bg-soft)"),
                            color: isOverdue ? "#ef4444" : "var(--accent)",
                            border: "1px solid " + (isOverdue ? "#ef444430" : "var(--accent-100)"),
                            display: "flex", alignItems: "center", gap: 5,
                          }}>
                            <Icon name="calendar" size={11} />
                            {fmtDate(p.nextAction, lang)}
                            {isOverdue && (
                              <span style={{ marginLeft: "auto", fontSize: 10 }}>
                                {Math.round((new Date(today) - new Date(p.nextAction)) / 86400000)}d
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer: last contact + move buttons */}
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <button
                            onClick={() => moveStage(p, -1)}
                            disabled={idx === 0}
                            title={lang === "es" ? "Etapa anterior" : "Previous stage"}
                            style={{
                              padding: "3px 8px", borderRadius: 6, border: "1px solid var(--line)",
                              background: "none", cursor: idx === 0 ? "not-allowed" : "pointer",
                              fontSize: 13, color: "var(--ink-3)", fontFamily: "inherit",
                              opacity: idx === 0 ? 0.3 : 1, flexShrink: 0,
                            }}>
                            ←
                          </button>
                          <span style={{ flex: 1, fontSize: 10.5, color: "var(--ink-4)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.lastContact ? fmtDate(p.lastContact, lang) : (lang === "es" ? "Sin contacto" : "No contact")}
                          </span>
                          <button
                            onClick={() => moveStage(p, 1)}
                            disabled={idx === stages.length - 1}
                            title={lang === "es" ? "Siguiente etapa" : "Next stage"}
                            style={{
                              padding: "3px 8px", borderRadius: 6, border: "1px solid var(--line)",
                              background: "none", cursor: idx === stages.length - 1 ? "not-allowed" : "pointer",
                              fontSize: 13, color: "var(--ink-3)", fontFamily: "inherit",
                              opacity: idx === stages.length - 1 ? 0.3 : 1, flexShrink: 0,
                            }}>
                            →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.PipelineView = PipelineView;
