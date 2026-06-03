// PROMEZA CRM — Metas y seguimiento

const { useState, useEffect, useMemo } = React;

// ─── Metric definitions ───────────────────────────────────────────────────────

const GOAL_METRICS = [
  {
    id: "personas_total",
    label: "Total de personas registradas",
    icon: "👥",
    compute: (data) => data.personas.length,
  },
  {
    id: "personas_activas",
    label: "Personas activas (no archivadas)",
    icon: "✅",
    compute: (data) =>
      data.personas.filter(
        (p) => (p.stage || "x") !== "inactivo" && p.status !== "inactivo"
      ).length,
  },
  {
    id: "activos_stage",
    label: "Personas activas",
    icon: "⭐",
    compute: (data) => data.personas.filter((p) => p.stage === "activo").length,
  },
  {
    id: "en_proceso",
    label: "Personas en seguimiento activo",
    icon: "🔄",
    compute: (data) =>
      data.personas.filter((p) => p.stage === "seguimiento").length,
  },
  {
    id: "proyectos_completados",
    label: "Proyectos completados",
    icon: "📋",
    compute: (data) =>
      (data.projects || []).filter((p) => p.status === "completado").length,
  },
  {
    id: "proyectos_total",
    label: "Total de proyectos",
    icon: "📁",
    compute: (data) => (data.projects || []).length,
  },
  {
    id: "entidades_total",
    label: "Total de entidades vinculadas",
    icon: "🏛️",
    compute: (data) => data.entities.length,
  },
  {
    id: "participantes_total",
    label: "Total de participantes en proyectos",
    icon: "👤",
    compute: (data) =>
      new Set(
        (data.projects || []).flatMap((pr) =>
          (pr.members || []).map((m) => m.personaId)
        )
      ).size,
  },
];

// ─── Category definitions ─────────────────────────────────────────────────────

const GOAL_CATEGORIES = [
  {
    id: "crecimiento",
    label: "Crecimiento de base",
    icon: "📈",
    color: "#6366f1",
    desc: "Ampliar el número de contactos registrados",
  },
  {
    id: "conversion",
    label: "Conversión",
    icon: "⭐",
    color: "#10b981",
    desc: "Avanzar personas en el proceso de compromiso",
  },
  {
    id: "proyectos",
    label: "Proyectos",
    icon: "📁",
    color: "#8b5cf6",
    desc: "Metas relacionadas a eventos y proyectos",
  },
  {
    id: "alcance",
    label: "Alcance ministerial",
    icon: "🌐",
    color: "#0ea5e9",
    desc: "Cobertura geográfica y entidades",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const fmtNum = (n) =>
  typeof n === "number" ? n.toLocaleString("es") : "—";

const fmtDateShort = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
};

const daysUntil = (iso) => {
  if (!iso) return null;
  return Math.round((new Date(iso) - new Date(today())) / 86400000);
};

const deadlineLabel = (iso) => {
  const d = daysUntil(iso);
  if (d === null) return null;
  if (d < 0) return { text: `Venció ${fmtDateShort(iso)}`, color: "var(--bad)" };
  if (d === 0) return { text: "Vence hoy", color: "#f59e0b" };
  if (d === 1) return { text: "Vence mañana", color: "#f59e0b" };
  if (d < 30) return { text: `${d} días restantes`, color: "#f59e0b" };
  return { text: `Hasta ${fmtDateShort(iso)}`, color: "var(--ink-3)" };
};

const progressColor = (pct) => {
  if (pct >= 100) return "var(--good)";
  if (pct >= 75) return "#3b82f6";
  if (pct >= 50) return "#f59e0b";
  return "var(--bad)";
};

// ─── NewGoalForm modal ────────────────────────────────────────────────────────

const NewGoalForm = ({ data, onClose, onSave }) => {
  const [step, setStep] = useState(0); // 0 = category, 1 = details
  const [form, setForm] = useState({
    category: "",
    title: "",
    metric: GOAL_METRICS[0].id,
    target: "",
    deadline: "",
    description: "",
  });
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedCategory = GOAL_CATEGORIES.find((c) => c.id === form.category);
  const selectedMetric = GOAL_METRICS.find((m) => m.id === form.metric) || GOAL_METRICS[0];
  const currentValue = useMemo(() => selectedMetric.compute(data), [selectedMetric, data]);

  const handleNext = () => {
    if (!form.category) { setError("Selecciona una categoría."); return; }
    setError("");
    setStep(1);
  };

  const handleSave = () => {
    if (!form.title.trim()) { setError("El título es obligatorio."); return; }
    if (!form.target || isNaN(Number(form.target)) || Number(form.target) <= 0) {
      setError("El objetivo debe ser un número mayor que 0.");
      return;
    }
    if (!form.deadline) { setError("La fecha límite es obligatoria."); return; }
    setError("");
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      metric: form.metric,
      target: Number(form.target),
      deadline: form.deadline,
    });
    onClose();
  };

  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="modal"
        style={{ width: "min(540px, 100%)", animation: "popIn .18s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === 1 && (
              <button
                className="btn btn-sm btn-ghost"
                style={{ padding: "3px 8px" }}
                onClick={() => setStep(0)}
              >
                ←
              </button>
            )}
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {step === 0 ? "Nueva meta — Categoría" : "Nueva meta — Detalles"}
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" style={{ padding: "3px 8px" }} onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div
              style={{
                background: "#fff5f5",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#991b1b",
              }}
            >
              {error}
            </div>
          )}

          {/* Step 0 — Category picker */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
                ¿Qué tipo de objetivo quieres establecer?
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {GOAL_CATEGORIES.map((cat) => {
                  const selected = form.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => set("category", cat.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 6,
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: selected
                          ? `2px solid ${cat.color}`
                          : "2px solid var(--line)",
                        background: selected
                          ? cat.color + "12"
                          : "var(--bg-soft)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all .15s",
                        outline: "none",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{cat.icon}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: selected ? cat.color : "var(--ink)",
                        }}
                      >
                        {cat.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ink-3)",
                          lineHeight: 1.4,
                        }}
                      >
                        {cat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedCategory && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: selectedCategory.color + "12",
                    border: `1px solid ${selectedCategory.color}40`,
                    fontSize: 13,
                    color: "var(--ink-2)",
                  }}
                >
                  <strong style={{ color: selectedCategory.color }}>
                    {selectedCategory.icon} {selectedCategory.label}
                  </strong>{" "}
                  — {selectedCategory.desc}
                </div>
              )}
            </div>
          )}

          {/* Step 1 — Details */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Category badge */}
              {selectedCategory && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: selectedCategory.color + "18",
                    border: `1px solid ${selectedCategory.color}40`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: selectedCategory.color,
                    width: "fit-content",
                  }}
                >
                  {selectedCategory.icon} {selectedCategory.label}
                </div>
              )}

              {/* Title */}
              <div className="field" style={{ margin: 0 }}>
                <label>¿Qué quieres lograr? *</label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder='ej. "Llegar a 500 aliados este trimestre"'
                  autoFocus
                />
              </div>

              {/* Metric */}
              <div className="field" style={{ margin: 0 }}>
                <label>Métrica que mide este objetivo</label>
                <select
                  value={form.metric}
                  onChange={(e) => set("metric", e.target.value)}
                >
                  {GOAL_METRICS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.icon} {m.label}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    marginTop: 6,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "var(--accent-50)",
                    fontSize: 12,
                    color: "var(--ink-2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 15 }}>{selectedMetric.icon}</span>
                  <span>
                    Valor actual:{" "}
                    <strong style={{ color: "var(--accent)" }}>
                      {fmtNum(currentValue)}
                    </strong>{" "}
                    — {selectedMetric.label.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Target + deadline */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Meta numérica *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.target}
                    onChange={(e) => set("target", e.target.value)}
                    placeholder={String(currentValue + 50)}
                  />
                  {form.target && !isNaN(Number(form.target)) && Number(form.target) > 0 && (
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-3)" }}>
                      Necesitas{" "}
                      <strong>
                        +{Math.max(0, Number(form.target) - currentValue)}
                      </strong>{" "}
                      más desde hoy
                    </div>
                  )}
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Fecha límite *</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                    min={today()}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="field" style={{ margin: 0 }}>
                <label>Descripción / notas (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Contexto, criterios de éxito, pasos clave..."
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          {step === 0 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              Continuar →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSave}>
              ✓ Guardar meta
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── GoalCard ─────────────────────────────────────────────────────────────────

const GoalCard = ({ goal, data, onDelete }) => {
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const metricDef = GOAL_METRICS.find((m) => m.id === goal.metric) || GOAL_METRICS[0];
  const category = GOAL_CATEGORIES.find((c) => c.id === goal.category) || GOAL_CATEGORIES[0];

  const current = metricDef.compute(data);
  const initial = typeof goal.initialValue === "number" ? goal.initialValue : current;
  const gained = current - initial;
  const pct = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;
  const done = current >= goal.target;

  const dl = deadlineLabel(goal.deadline);
  const barColor = progressColor(pct);

  const handleDelete = () => {
    if (!confirm("¿Eliminar esta meta? Esta acción no se puede deshacer.")) return;
    onDelete(goal.id);
  };

  return (
    <div
      className="card"
      style={{
        padding: 0,
        borderLeft: `3px solid ${category.color}`,
        animation: "fadeIn .25s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar: category + deadline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 0",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 20,
            background: category.color + "18",
            border: `1px solid ${category.color}40`,
            fontSize: 11,
            fontWeight: 700,
            color: category.color,
            letterSpacing: "0.02em",
          }}
        >
          {category.icon} {category.label}
        </span>
        {dl && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: dl.color,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            📅 {dl.text}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Metric big number */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              lineHeight: 1,
              color: done ? "var(--good)" : "var(--ink)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmtNum(current)}
          </div>
          <div style={{ marginBottom: 4, display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)" }}>
              {metricDef.icon} {metricDef.label}
            </div>
            {done ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--good)",
                  width: "fit-content",
                }}
              >
                ✓ ¡Meta alcanzada!
              </span>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>
                {pct}% completado
              </span>
            )}
          </div>
        </div>

        {/* Progress context line */}
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span>Inicio: <strong style={{ color: "var(--ink-2)" }}>{fmtNum(initial)}</strong></span>
          <span style={{ color: "var(--line)" }}>→</span>
          <span>Ahora: <strong style={{ color: "var(--ink)" }}>{fmtNum(current)}</strong></span>
          <span style={{ color: "var(--line)" }}>→</span>
          <span>Meta: <strong style={{ color: category.color }}>{fmtNum(goal.target)}</strong></span>
        </div>

        {/* Progress bar */}
        <div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "var(--line)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: barReady ? pct + "%" : "0%",
                background: barColor,
                borderRadius: 4,
                transition: "width .8s cubic-bezier(.34,1.56,.64,1)",
              }}
            />
          </div>
          {gained !== 0 && (
            <div style={{ marginTop: 5, fontSize: 11, color: "var(--ink-4)" }}>
              Desde que se creó esta meta:{" "}
              <strong style={{ color: gained > 0 ? "var(--good)" : "var(--bad)" }}>
                {gained > 0 ? "+" : ""}
                {fmtNum(gained)}
              </strong>
            </div>
          )}
        </div>

        {/* Title + description */}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
              {goal.title}
            </div>
            {goal.description && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "var(--ink-3)",
                  lineHeight: 1.5,
                }}
              >
                {goal.description}
              </div>
            )}
          </div>
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleDelete}
            title="Eliminar meta"
            style={{
              color: "var(--ink-4)",
              padding: "4px 8px",
              flexShrink: 0,
              opacity: 0.6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── GoalsView ────────────────────────────────────────────────────────────────

const GoalsView = ({ lang, data, go, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
  const [showForm, setShowForm] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [filterCat, setFilterCat] = useState("all");

  const goals = data.goals || [];
  const activeGoals = goals.filter((g) => !g.archived);
  const archivedGoals = goals.filter((g) => g.archived);

  const todayStr = today();

  const stats = useMemo(() => {
    const completed = activeGoals.filter((g) => {
      const m = GOAL_METRICS.find((x) => x.id === g.metric);
      return m && m.compute(data) >= g.target;
    });
    const overdue = activeGoals.filter((g) => {
      const m = GOAL_METRICS.find((x) => x.id === g.metric);
      const isDone = m && m.compute(data) >= g.target;
      return !isDone && g.deadline && g.deadline < todayStr;
    });
    return { active: activeGoals.length, completed: completed.length, overdue: overdue.length };
  }, [activeGoals, data, todayStr]);

  const filteredGoals =
    filterCat === "all"
      ? activeGoals
      : activeGoals.filter((g) => g.category === filterCat);

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Metas y seguimiento</h1>
          <div className="page-sub">
            Visualiza el progreso del ministerio hacia sus objetivos
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nueva meta
          </button>
        </div>
      </div>

      {/* Quick stats pills */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 22,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {[
          { label: "Metas activas", value: stats.active, color: "var(--accent)", bg: "var(--accent-50)" },
          { label: "Completadas", value: stats.completed, color: "var(--good)", bg: "#f0fdf4" },
          { label: "Vencidas", value: stats.overdue, color: stats.overdue > 0 ? "var(--bad)" : "var(--ink-4)", bg: stats.overdue > 0 ? "#fff5f5" : "var(--bg-soft)" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 20,
              background: s.bg,
              border: `1px solid ${s.color}30`,
              fontSize: 13,
            }}
          >
            <strong style={{ fontSize: 18, fontWeight: 800, color: s.color }}>
              {s.value}
            </strong>
            <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Category filter tabs */}
      {activeGoals.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <button
            className={`btn btn-sm ${filterCat === "all" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterCat("all")}
          >
            Todas
          </button>
          {GOAL_CATEGORIES.filter((cat) =>
            activeGoals.some((g) => g.category === cat.id)
          ).map((cat) => (
            <button
              key={cat.id}
              className="btn btn-sm btn-ghost"
              onClick={() => setFilterCat(cat.id)}
              style={
                filterCat === cat.id
                  ? {
                      background: cat.color + "18",
                      border: `1px solid ${cat.color}60`,
                      color: cat.color,
                      fontWeight: 700,
                    }
                  : {}
              }
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Goals grid */}
      {activeGoals.length === 0 ? (
        <div
          className="card"
          style={{ padding: "56px 24px", textAlign: "center", animation: "slideUp .25s ease" }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            Aún no hay metas definidas
          </div>
          <div
            style={{ color: "var(--ink-3)", fontSize: 14, maxWidth: 380, margin: "0 auto 20px" }}
          >
            Las metas te permiten hacer seguimiento al progreso real del
            ministerio — cuántas personas se están sumando, cuántos están
            comprometidos, qué proyectos avanzan.
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Crear primera meta
          </button>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div
          className="card"
          style={{ padding: "32px 24px", textAlign: "center" }}
        >
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>
            No hay metas en esta categoría.{" "}
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setFilterCat("all")}
            >
              Ver todas
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              data={data}
              onDelete={onDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Archived section */}
      {archivedGoals.length > 0 && (
        <div className="card" style={{ marginTop: 8, overflow: "hidden" }}>
          <div
            className="card-head"
            style={{ cursor: "pointer", userSelect: "none" }}
            onClick={() => setArchivedOpen((o) => !o)}
          >
            <div
              className="card-title"
              style={{
                color: "var(--ink-3)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13 }}>
                {archivedOpen ? "▾" : "▸"}
              </span>
              Metas archivadas ({archivedGoals.length})
            </div>
          </div>
          {archivedOpen && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 14,
                padding: "0 16px 16px",
                animation: "slideUp .2s ease",
              }}
            >
              {archivedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  data={data}
                  onDelete={onDeleteGoal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Goal Modal */}
      {showForm && (
        <NewGoalForm
          data={data}
          onClose={() => setShowForm(false)}
          onSave={onAddGoal}
        />
      )}
    </div>
  );
};

// ─── Exports ──────────────────────────────────────────────────────────────────

window.GoalsView = GoalsView;
window.GOAL_METRICS = GOAL_METRICS;
