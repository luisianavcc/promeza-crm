// PROMEZA CRM — Pipeline Kanban view

const PipelineView = ({ t, lang, data, go, onUpdatePerson }) => {
  const stages = window.PIPELINE_STAGES || [];
  const today = new Date().toISOString().slice(0, 10);

  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  const byStage = Object.fromEntries(stages.map(s => [s.id, []]));
  data.personas.forEach(p => {
    const s = stageOf(p);
    if (byStage[s]) byStage[s].push(p);
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
      </div>

      {/* Stage summary bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {stages.map(stage => (
          <div key={stage.id} style={{
            padding: "8px 14px", borderRadius: 10, background: stage.bg,
            border: "1px solid " + stage.color + "30", display: "flex", gap: 10, alignItems: "center",
          }}>
            <span style={{ fontWeight: 700, color: stage.color, fontSize: 20 }}>{byStage[stage.id].length}</span>
            <span style={{ fontSize: 12, color: stage.color, fontWeight: 500 }}>{stage.label}</span>
          </div>
        ))}
      </div>

      {/* Kanban columns */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
        {stages.map(stage => (
          <div key={stage.id} style={{ flex: "0 0 220px", minWidth: 220 }}>
            {/* Column header */}
            <div style={{
              padding: "8px 12px", borderRadius: "8px 8px 0 0",
              background: stage.bg, borderBottom: "2px solid " + stage.color,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 1,
            }}>
              <span style={{ fontWeight: 700, fontSize: 12.5, color: stage.color }}>{stage.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: stage.color, background: stage.color + "25", borderRadius: 10, padding: "1px 7px" }}>
                {byStage[stage.id].length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ background: "var(--bg-soft)", borderRadius: "0 0 8px 8px", padding: 8, display: "flex", flexDirection: "column", gap: 7, minHeight: 120 }}>
              {byStage[stage.id].length === 0 && (
                <div style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "center", padding: "16px 8px" }}>
                  {lang === "es" ? "Ninguno" : "None"}
                </div>
              )}
              {byStage[stage.id].map(p => {
                const isOverdue = p.nextAction && p.nextAction < today;
                const isDueNear = p.nextAction && p.nextAction >= today;
                const mainEntity = p.entities && p.entities.length > 0
                  ? data.entities.find(e => e.id === p.entities[0].id)
                  : null;

                return (
                  <div key={p.id} style={{
                    background: "var(--bg)", borderRadius: 8, padding: "10px 11px",
                    border: "1px solid " + (isOverdue ? "var(--bad)" : "var(--line)"),
                    boxShadow: isOverdue ? "0 0 0 1px var(--bad)20" : "none",
                  }}>
                    {/* Name + avatar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, cursor: "pointer" }}
                      onClick={() => go({ name: "person", id: p.id })}>
                      <div className="av-circle" style={{ background: p.color, width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
                        {initials(fullName(p))}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {fullName(p)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.roles[p.role] || p.role}{mainEntity ? " · " + mainEntity.name : ""}
                        </div>
                      </div>
                    </div>

                    {/* Next action */}
                    {p.nextAction && (
                      <div style={{
                        fontSize: 11, fontWeight: 600, marginBottom: 6, padding: "2px 7px", borderRadius: 6,
                        background: isOverdue ? "var(--bad)15" : "var(--accent-50)",
                        color: isOverdue ? "var(--bad)" : "var(--accent)",
                      }}>
                        {isOverdue ? "⚠ " : "📅 "}{fmtDate(p.nextAction, lang)}
                        {isOverdue && <span style={{ marginLeft: 4 }}>{lang === "es" ? "¡Vencida!" : "Overdue!"}</span>}
                      </div>
                    )}

                    {/* Last contact + move buttons */}
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button
                        onClick={() => moveStage(p, -1)}
                        disabled={stage.id === stages[0].id}
                        title={lang === "es" ? "Etapa anterior" : "Previous stage"}
                        style={{ padding: "2px 7px", borderRadius: 5, border: "1px solid var(--line)", background: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-3)", fontFamily: "inherit", opacity: stage.id === stages[0].id ? 0.3 : 1 }}>
                        ←
                      </button>
                      <span style={{ flex: 1, fontSize: 10, color: "var(--ink-4)", textAlign: "center" }}>
                        {p.lastContact ? fmtDate(p.lastContact, lang) : "—"}
                      </span>
                      <button
                        onClick={() => moveStage(p, 1)}
                        disabled={stage.id === stages[stages.length - 1].id}
                        title={lang === "es" ? "Siguiente etapa" : "Next stage"}
                        style={{ padding: "2px 7px", borderRadius: 5, border: "1px solid var(--line)", background: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-3)", fontFamily: "inherit", opacity: stage.id === stages[stages.length - 1].id ? 0.3 : 1 }}>
                        →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.PipelineView = PipelineView;
