// PROMEZA CRM — Dashboard / Home

const Home = ({ t, lang, data, go }) => {
  const { personas, entities } = data;
  const today = new Date().toISOString().slice(0, 10);
  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  // KPIs
  const allTasks = Object.values(data.tasks || {}).flat();
  const pendingTasks = allTasks.filter(tk => !tk.done).length;
  const overdueTasks = allTasks.filter(tk => !tk.done && tk.due && tk.due < today).length;
  const activeProjects = (data.projects || []).filter(pr => pr.status === "activo").length;
  const activePersonas = personas.filter(p => stageOf(p) !== "inactivo").length;
  const staleDate = new Date(); staleDate.setDate(staleDate.getDate() - 90);
  const staleStr = staleDate.toISOString().slice(0, 10);
  const staleCount = personas.filter(p => stageOf(p) !== "inactivo" && (!p.lastContact || p.lastContact < staleStr)).length;

  // Pipeline
  const stages = window.PIPELINE_STAGES || [];
  const stageCounts = {};
  stages.forEach(s => { stageCounts[s.id] = 0; });
  personas.forEach(p => { const s = stageOf(p); if (stageCounts[s] !== undefined) stageCounts[s]++; });
  const maxStage = Math.max(1, ...Object.values(stageCounts));

  // Activity last 14 days (from changelog + interactions)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    return d.toISOString().slice(0, 10);
  });
  const activityByDay = {};
  last14.forEach(d => { activityByDay[d] = 0; });
  Object.values(data.changelog || {}).flat().forEach(entry => {
    const d = (entry.date || "").slice(0, 10);
    if (activityByDay[d] !== undefined) activityByDay[d]++;
  });
  Object.values(data.interactions || {}).flat().forEach(entry => {
    const d = (entry.date || "").slice(0, 10);
    if (activityByDay[d] !== undefined) activityByDay[d]++;
  });
  const maxActivity = Math.max(1, ...Object.values(activityByDay));
  const totalActivity = Object.values(activityByDay).reduce((a, b) => a + b, 0);

  // Top cities
  const cityCounts = {};
  personas.forEach(p => { if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1; });
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCity = topCities.length > 0 ? Math.max(...topCities.map(([, c]) => c)) : 1;

  // Upcoming projects (next 30 days)
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const in30str = in30.toISOString().slice(0, 10);
  const upcomingProjects = (data.projects || [])
    .filter(pr => pr.dateStart && pr.dateStart >= today && pr.dateStart <= in30str)
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))
    .slice(0, 4);
  const upcomingTasks = allTasks
    .filter(tk => !tk.done && tk.due && tk.due >= today && tk.due <= in30str)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 3);

  // Recent contacts
  const recentPersonas = [...personas].sort((a, b) => (b.lastContact || "").localeCompare(a.lastContact || "")).slice(0, 6);

  // Birthdays
  const todayDate = new Date();
  const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const todayDOY = dayOfYear(todayDate);
  const bdays = personas
    .filter(p => p.birthday)
    .map(p => {
      const [, m, d] = p.birthday.split("-").map(n => parseInt(n));
      const dt = new Date(todayDate.getFullYear(), m - 1, d);
      let diff = dayOfYear(dt) - todayDOY;
      if (diff < 0) diff += 365;
      return { p, diff, dt };
    })
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5);

  // Goals progress
  const goals = (data.goals || []).filter(g => !g.archived);
  const completedGoals = goals.filter(g => {
    const GOAL_METRICS = window.GOAL_METRICS || [];
    const metric = GOAL_METRICS.find(m => m.id === g.metric);
    if (!metric) return false;
    return metric.compute(data) >= g.target;
  });

  const getProjType = (id) => {
    const types = window.PROJECT_TYPES || [];
    return types.find(t => t.id === id) || { emoji: "📂", color: "#6366f1", label: id };
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.home.hello}</h1>
          <div className="page-sub">{new Date().toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => go({ name: "new-entity" })}><Icon name="plus" /> {t.nav.newEntity}</button>
          <button className="btn btn-primary" onClick={() => go({ name: "new-person" })}><Icon name="plus" /> {t.nav.newPerson}</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Personas", value: personas.length.toLocaleString(), sub: activePersonas + " activas", color: "var(--accent)", route: "personas" },
          { label: "Entidades", value: entities.length, sub: "Organizaciones", color: "#0ea5e9", route: "entities" },
          { label: "Proyectos", value: (data.projects || []).length, sub: activeProjects + " en curso", color: activeProjects > 0 ? "var(--good)" : "var(--ink-4)", route: "projects" },
          { label: "Tareas pendientes", value: pendingTasks, sub: overdueTasks > 0 ? overdueTasks + " vencidas" : "Al día", color: overdueTasks > 0 ? "var(--bad)" : "var(--good)", route: "tasks" },
          { label: "Sin contacto +90d", value: staleCount, sub: "Personas a revisar", color: staleCount > 0 ? "#f59e0b" : "var(--good)", route: "personas" },
        ].map(kpi => (
          <div key={kpi.label} className="kpi" style={{ cursor: "pointer" }} onClick={() => go({ name: kpi.route })}>
            <div className="label">{kpi.label}</div>
            <div className="num" style={{ color: kpi.color, fontSize: 28 }}>{kpi.value}</div>
            <div className="delta" style={{ color: kpi.color }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Pipeline + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16, marginBottom: 16 }}>
        {/* Pipeline funnel */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Pipeline de seguimiento</div>
            <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "pipeline" })}>Ver tablero →</button>
          </div>
          <div className="card-pad">
            {stages.map(s => {
              const count = stageCounts[s.id] || 0;
              const pct = activePersonas > 0 ? Math.round(count / activePersonas * 100) : 0;
              return (
                <div key={s.id} style={{ marginBottom: 14, cursor: "pointer" }} onClick={() => go({ name: "pipeline" })}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      <strong style={{ color: "var(--ink-2)" }}>{count.toLocaleString()}</strong>
                      <span style={{ color: "var(--ink-4)", fontWeight: 400 }}> ({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 7, background: "var(--bg-soft)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: (count / maxStage * 100) + "%", background: s.color, borderRadius: 4, transition: "width .5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity chart + top cities */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Actividad (últimos 14 días)</div>
            <div className="card-meta">{totalActivity} registros</div>
          </div>
          <div style={{ padding: "12px 16px 4px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 72 }}>
              {last14.map((d, i) => {
                const v = activityByDay[d] || 0;
                const h = Math.max(3, Math.round((v / maxActivity) * 64));
                const isToday = d === today;
                const dayLabel = new Date(d + "T12:00:00").getDate();
                return (
                  <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }} title={d + ": " + v + " eventos"}>
                    <div style={{ width: "100%", height: h, background: isToday ? "var(--accent)" : (v > 0 ? "var(--accent-100)" : "var(--line)"), borderRadius: "3px 3px 0 0" }} />
                    {(i === 0 || i === 6 || i === 13) && <span style={{ fontSize: 9, color: "var(--ink-4)" }}>{dayLabel}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: "10px 16px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Top ciudades</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
              {topCities.map(([city, count]) => (
                <div key={city} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: Math.max(4, Math.round(count / maxCity * 48)), height: 5, background: "var(--accent-100)", borderRadius: 3, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{city}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-4)", marginLeft: "auto" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Map + Upcoming + Birthdays */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">{t.home.coverageMap}</div>
            <div className="card-meta">{personas.length + entities.length} registros</div>
          </div>
          <div style={{ height: 270 }}>
            <MiniMap personas={personas} entities={entities} go={go} />
          </div>
        </div>

        {/* Upcoming 30 days */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Próximos 30 días</div>
            <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "calendar" })}>Calendario →</button>
          </div>
          <div>
            {upcomingProjects.length === 0 && upcomingTasks.length === 0 ? (
              <div className="empty" style={{ padding: "28px 0", fontSize: 12 }}>Sin eventos próximos</div>
            ) : (
              <>
                {upcomingProjects.map(pr => {
                  const pt = getProjType(pr.type);
                  const daysUntil = Math.round((new Date(pr.dateStart + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000);
                  return (
                    <div key={pr.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                      onClick={() => go({ name: "project", id: pr.id })}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: pt.color + "18", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>{pt.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{fmtDate(pr.dateStart, lang)}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: pt.color, flexShrink: 0 }}>+{daysUntil}d</div>
                    </div>
                  );
                })}
                {upcomingTasks.map(tk => {
                  let ownerName = "";
                  for (const [pid, tasks] of Object.entries(data.tasks || {})) {
                    if (tasks.some(t => t.id === tk.id)) {
                      const p = personas.find(p => p.id === pid);
                      if (p) ownerName = p.first;
                      break;
                    }
                  }
                  const daysUntil = Math.round((new Date(tk.due + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000);
                  return (
                    <div key={tk.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f59e0b18", display: "grid", placeItems: "center", fontSize: 14, flexShrink: 0 }}>
                        <Icon name="check" size={13} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tk.text}</div>
                        {ownerName && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{ownerName}</div>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", flexShrink: 0 }}>+{daysUntil}d</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Birthdays */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">{t.home.upcomingBdays}</div>
          </div>
          <div>
            {bdays.length === 0 && <div className="empty" style={{ padding: "28px 0", fontSize: 12 }}>Sin cumpleaños registrados</div>}
            {bdays.map(({ p, dt, diff }) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                onClick={() => go({ name: "person", id: p.id })}>
                <div className="av-circle" style={{ background: p.color, flexShrink: 0 }}>{initials(fullName(p))}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName(p)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                    {dt.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: diff === 0 ? "var(--bad)" : diff <= 7 ? "#f59e0b" : "var(--ink-3)", flexShrink: 0 }}>
                  {diff === 0 ? "Hoy" : "+" + diff + "d"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Recent contacts + Goals */}
      <div style={{ display: "grid", gridTemplateColumns: goals.length > 0 ? "1.2fr 1fr" : "1fr", gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Contactos recientes</div>
            <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "personas" })}>Ver todos →</button>
          </div>
          <div>
            {recentPersonas.map(p => {
              const stage = stages.find(s => s.id === stageOf(p));
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                  onClick={() => go({ name: "person", id: p.id })}>
                  <div className="av-circle" style={{ background: p.color, flexShrink: 0 }}>{initials(fullName(p))}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{fullName(p)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{fmtRole(p.role, t)}{p.city ? " · " + p.city : ""}</div>
                  </div>
                  {stage && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: stage.color + "14", color: stage.color, whiteSpace: "nowrap" }}>{stage.label}</span>}
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", flexShrink: 0 }}>{fmtDate(p.lastContact, lang)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals preview (only if there are goals) */}
        {goals.length > 0 && (
          <div className="card">
            <div className="card-head">
              <div className="card-title">Metas activas</div>
              <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "goals" })}>Ver todas →</button>
            </div>
            <div className="card-pad">
              {goals.slice(0, 4).map(g => {
                const GOAL_METRICS = window.GOAL_METRICS || [];
                const metric = GOAL_METRICS.find(m => m.id === g.metric);
                const current = metric ? metric.compute(data) : 0;
                const pct = Math.min(100, Math.round(current / Math.max(1, g.target) * 100));
                const done = pct >= 100;
                const barColor = done ? "var(--good)" : pct >= 75 ? "var(--accent)" : pct >= 50 ? "#f59e0b" : "#ef4444";
                const isPast = g.deadline && g.deadline < today;
                return (
                  <div key={g.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>{g.title}</span>
                      {done
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--good)" }}>Completado</span>
                        : <span style={{ fontSize: 11, fontWeight: 700, color: isPast ? "var(--bad)" : "var(--ink-3)" }}>{pct}%</span>
                      }
                    </div>
                    <div style={{ height: 6, background: "var(--bg-soft)", borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
                      <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 3, transition: "width .5s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-4)", display: "flex", justifyContent: "space-between" }}>
                      <span>{current.toLocaleString()} / {g.target.toLocaleString()}</span>
                      {g.deadline && <span style={{ color: isPast ? "var(--bad)" : "var(--ink-4)" }}>{fmtDate(g.deadline, lang)}</span>}
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <div className="empty" style={{ padding: "20px 0", fontSize: 12 }}>Sin metas activas</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.Home = Home;
