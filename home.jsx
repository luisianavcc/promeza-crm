// PROMEZA CRM — Dashboard / Home

const Home = ({ t, lang, data, go }) => {
  const { personas, entities } = data;
  const today = new Date().toISOString().slice(0, 10);
  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  // KPIs
  const allTasks = Object.values(data.tasks || {}).flat();
  const pendingTasks = allTasks.filter(tk => !tk.done).length;
  const overdueTasks = allTasks.filter(tk => !tk.done && tk.due && tk.due < today).length;
  const projects = data.projects || [];
  const activeProjects = projects.filter(pr => pr.status === "activo").length;
  const activePersonas = personas.filter(p => stageOf(p) !== "inactivo").length;
  const comprometidos = personas.filter(p => stageOf(p) === "aliado").length;
  const inhabilitados = personas.filter(p => stageOf(p) === "inactivo").length;
  const enProyectos = new Set(projects.flatMap(pr => (pr.members || []).map(m => m.personaId))).size;
  const porRevisar = personas.filter(p => window.hasContactIssue ? window.hasContactIssue(p) : false).length;

  // Activity last 14 days
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    return d.toISOString().slice(0, 10);
  });
  const activityByDay = {};
  last14.forEach(d => { activityByDay[d] = 0; });
  Object.values(data.changelog || {}).flat().forEach(e => {
    const d = (e.date || "").slice(0, 10);
    if (activityByDay[d] !== undefined) activityByDay[d]++;
  });
  Object.values(data.interactions || {}).flat().forEach(e => {
    const d = (e.date || "").slice(0, 10);
    if (activityByDay[d] !== undefined) activityByDay[d]++;
  });
  const maxActivity = Math.max(1, ...Object.values(activityByDay));
  const totalActivity = Object.values(activityByDay).reduce((a, b) => a + b, 0);

  // Top cities
  const cityCounts = {};
  personas.forEach(p => { if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1; });
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCity = topCities.length > 0 ? Math.max(...topCities.map(([, c]) => c)) : 1;

  // Recently registered (by lastContact as proxy — sorted desc, show mixed personas+entities)
  const recentlyAdded = [
    ...personas.map(p => ({ type: "persona", item: p, date: p.lastContact || "" })),
    ...data.entities.map(e => ({ type: "entity", item: e, date: e.lastContact || e.founded || "" })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Upcoming projects (next 30 days)
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const in30str = in30.toISOString().slice(0, 10);
  const upcomingProjects = projects
    .filter(pr => pr.dateStart && pr.dateStart >= today && pr.dateStart <= in30str && pr.status !== "cancelado")
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))
    .slice(0, 5);
  const upcomingTasks = allTasks
    .filter(tk => !tk.done && tk.due && tk.due >= today && tk.due <= in30str)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 3);

  // Recent contacts
  const recentPersonas = [...personas]
    .sort((a, b) => (b.lastContact || "").localeCompare(a.lastContact || ""))
    .slice(0, 6);

  // Birthdays this month
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

  // Goals
  const goals = (data.goals || []).filter(g => !g.archived);

  const getProjType = (id) => {
    const types = window.PROJECT_TYPES || [];
    return types.find(t => t.id === id) || { emoji: "📂", color: "#6366f1", label: id };
  };

  const stages = window.PIPELINE_STAGES || [];

  const KpiCard = ({ label, value, sub, color, bg, icon, route, delay = 0 }) => (
    <div className="kpi-card-new" style={{ animationDelay: delay + "ms", cursor: "pointer" }} onClick={() => go({ name: route })}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "grid", placeItems: "center" }}>
          <Icon name={icon} size={18} style={{ color }} />
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: "-.02em", lineHeight: 1 }}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 5, fontWeight: 500 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ animation: "fadeIn .3s ease-out" }}>
      {/* PROMEZA Marketing Group Logo Banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #14532d 100%)", borderRadius: 16, padding: "20px 28px", marginBottom: 20, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
        {/* Light bulb icon */}
        <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 14, background: "rgba(163,230,53,.12)", border: "1.5px solid rgba(163,230,53,.3)", display: "grid", placeItems: "center", boxShadow: "0 0 24px rgba(132,204,22,.25)" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 3C9.58 3 6 6.58 6 11c0 2.83 1.4 5.33 3.55 6.88V20a1 1 0 001 1h6.9a1 1 0 001-1v-2.12C20.6 16.33 22 13.83 22 11c0-4.42-3.58-8-8-8z" fill="#a3e635" fillOpacity=".85"/>
            <path d="M10.5 22h7" stroke="#a3e635" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M11.5 25h5" stroke="#a3e635" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M14 3v-2M7 5l-1.5-1.5M21 5l1.5-1.5M5 11H3M23 11h2" stroke="#a3e635" strokeWidth="1.6" strokeLinecap="round" strokeOpacity=".6"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.01em", color: "#f8fafc", lineHeight: 1.1, fontFamily: "var(--font-sans)" }}>
            PROME<span style={{ color: "#a3e635" }}>ZA</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".2em", color: "#a3e635", textTransform: "uppercase", marginTop: 2 }}>
            Marketing Group
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#f8fafc" }}>{t.home.hello}</div>
          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{new Date().toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button className="btn" style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "#f8fafc" }} onClick={() => go({ name: "new-entity" })}><Icon name="plus" /> {t.nav.newEntity}</button>
          <button className="btn" style={{ background: "#a3e635", color: "#0f172a", fontWeight: 700, border: "none" }} onClick={() => go({ name: "new-person" })}><Icon name="plus" /> {t.nav.newPerson}</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Personas" value={personas.length} sub={activePersonas + " activas"} color="var(--accent)" icon="users" route="personas" delay={0} />
        <KpiCard label="Entidades" value={entities.length} sub="Organizaciones" color="#0ea5e9" icon="building" route="entities" delay={60} />
        <KpiCard label="Proyectos" value={projects.length} sub={activeProjects > 0 ? activeProjects + " en curso" : "Sin proyectos activos"} color={activeProjects > 0 ? "#8b5cf6" : "var(--ink-4)"} icon="folder" route="projects" delay={120} />
        <KpiCard label="Tareas" value={pendingTasks} sub={overdueTasks > 0 ? overdueTasks + " vencidas ⚠" : "Al día"} color={overdueTasks > 0 ? "var(--bad)" : "var(--good)"} icon="check" route="tasks" delay={180} />
        <KpiCard label="Comprometidos" value={comprometidos} sub={"de " + activePersonas + " activos"} color="#10b981" icon="star" route="pipeline" delay={240} />
      </div>

      {/* Row 2: Contact status + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginBottom: 16 }}>

        {/* Contact status */}
        <div className="card" style={{ animation: "slideUp .35s ease-out" }}>
          <div className="card-head">
            <div className="card-title">Estado de contactos</div>
            <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "personas" })}>Ver lista →</button>
          </div>
          <div style={{ padding: "8px 12px 12px" }}>
            {[
              { label: "Activos", sub: "Con seguimiento vigente", value: activePersonas, color: "var(--good)", icon: "users", route: "personas" },
              { label: "Inhabilitados", sub: "Archivados o inactivos", value: inhabilitados, color: "var(--ink-4)", icon: "shield", route: "personas" },
              { label: "Por revisar", sub: "Información de contacto con problemas", value: porRevisar, color: porRevisar > 0 ? "#f59e0b" : "var(--good)", icon: "alert", route: "personas" },
            ].map((row, i) => (
              <div key={row.label}
                className="status-row-card"
                style={{ animationDelay: (i * 60) + "ms" }}
                onClick={() => go({ name: row.route || "personas" })}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: row.color + "15", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name={row.icon} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--ink-2)" }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 1 }}>{row.sub}</div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: row.color, minWidth: 40, textAlign: "right", letterSpacing: "-.02em" }}>{row.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity + cities */}
        <div className="card" style={{ animation: "slideUp .35s ease-out .05s both" }}>
          <div className="card-head">
            <div className="card-title">Actividad — últimos 14 días</div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--accent)", background: "var(--accent-50)", padding: "2px 8px", borderRadius: 6 }}>{totalActivity} registros</span>
          </div>
          <div style={{ padding: "12px 16px 4px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {last14.map((d, i) => {
                const v = activityByDay[d] || 0;
                const h = Math.max(3, Math.round((v / maxActivity) * 72));
                const isToday = d === today;
                const dayLabel = new Date(d + "T12:00:00").getDate();
                return (
                  <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }} title={d + ": " + v + " eventos"}>
                    <div style={{
                      width: "100%", height: h,
                      background: isToday ? "var(--accent)" : v > 0 ? "var(--accent-100)" : "var(--line)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height .6s cubic-bezier(.34,1.56,.64,1)",
                      transitionDelay: (i * 20) + "ms",
                      boxShadow: isToday ? "0 0 8px rgba(79,70,229,.4)" : "none",
                    }} />
                    {(i === 0 || i === 6 || i === 13) && <span style={{ fontSize: 9, color: "var(--ink-4)" }}>{dayLabel}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: "10px 16px 14px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>Recién registrados</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {recentlyAdded.map(({ type, item }, i) => (
                <div key={item.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", animation: "slideUp .3s ease-out both", animationDelay: (100 + i * 40) + "ms" }}
                  onClick={() => go({ name: type === "persona" ? "person" : "entity", id: item.id })}>
                  {type === "persona"
                    ? <div className="av-circle" style={{ background: item.color, width: 26, height: 26, fontSize: 9, flexShrink: 0 }}>{initials(fullName(item))}</div>
                    : <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-50)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="building" size={12} /></div>
                  }
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {type === "persona" ? fullName(item) : item.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--accent)", background: "var(--accent-50)", padding: "1px 6px", borderRadius: 5, flexShrink: 0, fontWeight: 700 }}>
                    #{window.getUID ? window.getUID(item.id) : item.id}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 9 }}>Top ciudades</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 14px" }}>
              {topCities.map(([city, count], i) => (
                <div key={city} style={{ display: "flex", alignItems: "center", gap: 6, animation: "slideUp .3s ease-out both", animationDelay: (200 + i * 40) + "ms" }}>
                  <div style={{ height: 5, borderRadius: 3, background: "linear-gradient(90deg, var(--accent), #818cf8)", width: Math.max(4, Math.round(count / maxCity * 50)), flexShrink: 0, transition: "width .5s ease" }} />
                  <span style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{city}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{count}</span>
                </div>
              ))}
              {topCities.length === 0 && <span style={{ fontSize: 12, color: "var(--ink-4)" }}>Sin datos de ciudad</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Map + Upcoming + Birthdays */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ animation: "slideUp .35s ease-out .1s both" }}>
          <div className="card-head">
            <div className="card-title">{t.home.coverageMap}</div>
            <div className="card-meta">{personas.length + entities.length} registros</div>
          </div>
          <div style={{ height: 268 }}>
            <MiniMap personas={personas} entities={entities} go={go} />
          </div>
        </div>

        {/* Upcoming */}
        <div className="card" style={{ animation: "slideUp .35s ease-out .15s both" }}>
          <div className="card-head">
            <div className="card-title">Próximos 30 días</div>
            <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "calendar" })}>Calendario →</button>
          </div>
          {upcomingProjects.length === 0 && upcomingTasks.length === 0 ? (
            <div className="empty" style={{ padding: "32px 0", fontSize: 12 }}>Sin eventos próximos</div>
          ) : (
            <div>
              {upcomingProjects.map((pr, i) => {
                const pt = getProjType(pr.type);
                const daysUntil = Math.round((new Date(pr.dateStart + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000);
                return (
                  <div key={pr.id} className="hover-row" style={{ animationDelay: (i * 50) + "ms" }} onClick={() => go({ name: "project", id: pr.id })}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: pt.color + "18", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>{pt.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{fmtDate(pr.dateStart, lang)}</div>
                    </div>
                    <span className="day-badge" style={{ background: pt.color + "15", color: pt.color }}>{daysUntil === 0 ? "Hoy" : "+" + daysUntil + "d"}</span>
                  </div>
                );
              })}
              {upcomingTasks.map((tk, i) => {
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
                  <div key={tk.id} className="hover-row" style={{ animationDelay: ((upcomingProjects.length + i) * 50) + "ms" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f59e0b18", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name="check" size={13} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tk.text}</div>
                      {ownerName && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{ownerName}</div>}
                    </div>
                    <span className="day-badge" style={{ background: "#f59e0b15", color: "#f59e0b" }}>+{daysUntil}d</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Birthdays */}
        <div className="card" style={{ animation: "slideUp .35s ease-out .2s both" }}>
          <div className="card-head">
            <div className="card-title">{t.home.upcomingBdays}</div>
          </div>
          {bdays.length === 0
            ? <div className="empty" style={{ padding: "32px 0", fontSize: 12 }}>Sin cumpleaños registrados</div>
            : bdays.map(({ p, dt, diff }, i) => (
              <div key={p.id} className="hover-row" style={{ animationDelay: (i * 60) + "ms" }}
                onClick={() => go({ name: "person", id: p.id })}>
                <div className="av-circle" style={{ background: p.color, flexShrink: 0 }}>{initials(fullName(p))}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName(p)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{dt.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { day: "numeric", month: "short" })}</div>
                </div>
                <span className="day-badge" style={{
                  background: diff === 0 ? "#ef444415" : diff <= 7 ? "#f59e0b15" : "var(--bg-soft)",
                  color: diff === 0 ? "var(--bad)" : diff <= 7 ? "#f59e0b" : "var(--ink-3)",
                }}>
                  {diff === 0 ? "Hoy" : "+" + diff + "d"}
                </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Row 4: Recent contacts + Goals */}
      <div style={{ display: "grid", gridTemplateColumns: goals.length > 0 ? "1.2fr 1fr" : "1fr", gap: 16 }}>
        <div className="card" style={{ animation: "slideUp .35s ease-out .25s both" }}>
          <div className="card-head">
            <div className="card-title">Contactos recientes</div>
            <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "personas" })}>Ver todos →</button>
          </div>
          <div>
            {recentPersonas.map((p, i) => {
              const stage = stages.find(s => s.id === stageOf(p));
              return (
                <div key={p.id} className="hover-row" style={{ animationDelay: (i * 40) + "ms" }}
                  onClick={() => go({ name: "person", id: p.id })}>
                  <div className="av-circle" style={{ background: p.color, flexShrink: 0 }}>{initials(fullName(p))}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{fullName(p)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{fmtRole(p.role, t)}{p.city ? " · " + p.city : ""}</div>
                  </div>
                  {stage && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: stage.color + "14", color: stage.color, whiteSpace: "nowrap", flexShrink: 0 }}>{stage.label}</span>}
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", flexShrink: 0, minWidth: 60, textAlign: "right" }}>{fmtDate(p.lastContact, lang)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {goals.length > 0 && (
          <div className="card" style={{ animation: "slideUp .35s ease-out .3s both" }}>
            <div className="card-head">
              <div className="card-title">Metas activas</div>
              <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "goals" })}>Ver todas →</button>
            </div>
            <div className="card-pad">
              {goals.slice(0, 4).map((g, i) => {
                const GOAL_METRICS = window.GOAL_METRICS || [];
                const metric = GOAL_METRICS.find(m => m.id === g.metric);
                const current = metric ? metric.compute(data) : 0;
                const pct = Math.min(100, Math.round(current / Math.max(1, g.target) * 100));
                const done = pct >= 100;
                const barColor = done ? "var(--good)" : pct >= 75 ? "var(--accent)" : pct >= 50 ? "#f59e0b" : "#ef4444";
                const isPast = g.deadline && g.deadline < today;
                return (
                  <div key={g.id} style={{ marginBottom: 16, animation: "slideUp .3s ease-out both", animationDelay: (i * 60) + "ms" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}>{g.title}</span>
                      {done
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--good)" }}>✓ Meta lograda</span>
                        : <span style={{ fontSize: 11, fontWeight: 700, color: isPast ? "var(--bad)" : "var(--ink-3)" }}>{pct}%</span>
                      }
                    </div>
                    <div style={{ height: 7, background: "var(--bg-soft)", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 4, transition: "width .8s cubic-bezier(.34,1.56,.64,1)" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-4)", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{current.toLocaleString()} / {g.target.toLocaleString()}</span>
                      {g.deadline && <span style={{ color: isPast ? "var(--bad)" : "var(--ink-4)" }}>{fmtDate(g.deadline, lang)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.Home = Home;
