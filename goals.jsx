// PROMEZA CRM — Goals & KPI tracker

const GOAL_METRICS = [
  { id: "personas_total",        label: "Total de personas en la base",       compute: (data) => data.personas.length },
  { id: "personas_activas",      label: "Personas activas (no archivadas)",   compute: (data) => data.personas.filter(p => (p.stage || p.status) !== "inactivo").length },
  { id: "stage_contactado",      label: "Personas en etapa Contactado",       compute: (data) => data.personas.filter(p => (p.stage || "conocido") === "conocido").length },
  { id: "stage_en_proceso",      label: "Personas en etapa En proceso",       compute: (data) => data.personas.filter(p => (p.stage || "conocido") === "seguimiento").length },
  { id: "stage_comprometido",    label: "Personas Comprometidas",             compute: (data) => data.personas.filter(p => (p.stage || "conocido") === "aliado").length },
  { id: "proyectos_total",       label: "Total de proyectos",                 compute: (data) => (data.projects || []).length },
  { id: "proyectos_completados", label: "Proyectos completados",              compute: (data) => (data.projects || []).filter(p => p.status === "completado").length },
  { id: "tareas_completadas",    label: "Tareas completadas",                 compute: (data) => Object.values(data.tasks || {}).flat().filter(t => t.done).length },
  { id: "entidades_total",       label: "Total de entidades",                 compute: (data) => data.entities.length },
];

// ─── New Goal Form Modal ───

const NewGoalForm = ({ onClose, onSave }) => {
  const { useState } = React;

  const [form, setForm] = useState({
    title: "",
    metric: GOAL_METRICS[0].id,
    target: "",
    deadline: "",
    description: "",
  });
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { setError("El título es obligatorio."); return; }
    if (!form.target || isNaN(Number(form.target)) || Number(form.target) <= 0) { setError("El objetivo debe ser un número mayor que 0."); return; }
    if (!form.deadline) { setError("La fecha límite es obligatoria."); return; }
    setError("");
    onSave({
      id: "goal" + Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      metric: form.metric,
      target: Number(form.target),
      deadline: form.deadline,
      createdAt: new Date().toISOString(),
      archived: false,
    });
    onClose();
  };

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(520px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>Nueva meta</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
              {error}
            </div>
          )}

          <div className="field" style={{ margin: 0 }}>
            <label>Título *</label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="ej. 500 aliados Q1"
              autoFocus
            />
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>Métrica</label>
            <select value={form.metric} onChange={e => set("metric", e.target.value)}>
              {GOAL_METRICS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Objetivo (número) *</label>
              <input
                type="number"
                min="1"
                value={form.target}
                onChange={e => set("target", e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Fecha límite *</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => set("deadline", e.target.value)}
              />
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>Descripción (opcional)</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Contexto, notas o criterios de éxito..."
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Icon name="check" /> Guardar meta
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Goal Card ───

const GoalCard = ({ goal, data, onDelete }) => {
  const metricDef = GOAL_METRICS.find(m => m.id === goal.metric) || GOAL_METRICS[0];
  const current = metricDef.compute(data);
  const pct = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;
  const done = current >= goal.target;

  const today = new Date().toISOString().slice(0, 10);
  const isPast = goal.deadline && goal.deadline < today;
  const daysLeft = goal.deadline
    ? Math.round((new Date(goal.deadline) - new Date(today)) / 86400000)
    : null;
  const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft < 30;

  // Progress bar color
  let barColor;
  if (pct >= 100) barColor = "#059669";
  else if (pct >= 75) barColor = "var(--accent)";
  else if (pct >= 50) barColor = "#f59e0b";
  else barColor = isPast ? "#ef4444" : "var(--accent)";

  const deadlineColor = isPast ? "var(--bad)" : isNearDeadline ? "#f59e0b" : "var(--ink-3)";

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "16px 18px 14px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{goal.title}</div>
            {goal.description && (
              <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.4, marginBottom: 6 }}>{goal.description}</div>
            )}
            <div style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 500 }}>{metricDef.label}</div>
          </div>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => onDelete(goal.id)}
            style={{ color: "var(--ink-4)", padding: "3px 7px", flexShrink: 0 }}
            title="Eliminar meta"
          >
            <Icon name="trash-2" />
          </button>
        </div>

        {/* Current value big */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: done ? "#059669" : "var(--ink)" }}>
            {current.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 3 }}>
            / {goal.target.toLocaleString()}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            {done ? (
              <span style={{
                background: "#f0fdf4",
                color: "#059669",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                padding: "2px 10px",
                fontSize: 12,
                fontWeight: 700,
              }}>
                <Icon name="check" /> Completado
              </span>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{pct}%</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 7,
          borderRadius: 4,
          background: "var(--line)",
          overflow: "hidden",
          marginBottom: 10,
        }}>
          <div style={{
            height: "100%",
            width: pct + "%",
            background: barColor,
            borderRadius: 4,
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* Deadline */}
        {goal.deadline && (
          <div style={{ fontSize: 12, color: deadlineColor, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="calendar" />
            {isPast
              ? "Venció el " + fmtDate(goal.deadline, "es")
              : daysLeft === 0
                ? "Vence hoy"
                : daysLeft === 1
                  ? "Vence mañana"
                  : "Vence " + fmtDate(goal.deadline, "es") + (daysLeft !== null ? ` (${daysLeft}d)` : "")}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Goals View ───

const GoalsView = ({ lang, data, go, onAddGoal, onDeleteGoal, onUpdateGoal }) => {
  const { useState, useMemo } = React;

  const [showForm, setShowForm] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const goals = data.goals || [];
  const activeGoals = goals.filter(g => !g.archived);
  const archivedGoals = goals.filter(g => g.archived);

  const handleDelete = (id) => {
    if (!confirm("¿Eliminar esta meta? Esta acción no se puede deshacer.")) return;
    onDeleteGoal(id);
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Metas y KPIs</h1>
          <div className="page-sub">Seguimiento de objetivos del ministerio</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Icon name="plus" /> Nueva meta
          </button>
        </div>
      </div>

      {/* Quick stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Metas activas", value: activeGoals.length },
          { label: "Completadas", value: activeGoals.filter(g => { const m = GOAL_METRICS.find(x => x.id === g.metric); return m && m.compute(data) >= g.target; }).length },
          { label: "Vencidas", value: activeGoals.filter(g => g.deadline && g.deadline < new Date().toISOString().slice(0, 10) && (GOAL_METRICS.find(x => x.id === g.metric) || GOAL_METRICS[0]).compute(data) < g.target).length },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "12px 18px", flex: "0 0 auto" }}>
            <div style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Active goals grid */}
      {activeGoals.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "48px 24px" }}>
            <Icon name="target" />
            <div style={{ marginTop: 12, fontWeight: 600, fontSize: 15 }}>Sin metas activas</div>
            <div style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 13 }}>Crea una meta para hacer seguimiento del progreso del ministerio.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
              <Icon name="plus" /> Nueva meta
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16, marginBottom: 24 }}>
          {activeGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} data={data} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Archived goals collapsible */}
      {archivedGoals.length > 0 && (
        <div className="card" style={{ marginTop: 8 }}>
          <div
            className="card-head"
            style={{ cursor: "pointer", userSelect: "none" }}
            onClick={() => setArchivedOpen(o => !o)}
          >
            <div className="card-title" style={{ color: "var(--ink-3)" }}>
              <Icon name={archivedOpen ? "chevron-down" : "chevron-right"} /> Metas archivadas ({archivedGoals.length})
            </div>
          </div>
          {archivedOpen && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14, padding: "0 16px 16px" }}>
              {archivedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} data={data} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Goal Modal */}
      {showForm && (
        <NewGoalForm
          onClose={() => setShowForm(false)}
          onSave={onAddGoal}
        />
      )}
    </div>
  );
};

window.GoalsView = GoalsView;
window.GOAL_METRICS = GOAL_METRICS;
