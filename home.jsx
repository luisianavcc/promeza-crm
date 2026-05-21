// PROMEZA CRM — Dashboard / Home

const Home = ({ t, lang, data, go }) => {
  const { personas, entities } = data;
  const countries = new Set([
    ...personas.map(p => p.country),
    ...entities.map(e => e.country),
  ]);
  const cities = new Set([
    ...personas.map(p => p.city),
    ...entities.map(e => e.city),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date(); in14.setDate(in14.getDate() + 14);
  const in14str = in14.toISOString().slice(0, 10);

  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  // Pipeline funnel
  const stages = window.PIPELINE_STAGES || [];
  const stageCounts = Object.fromEntries(stages.map(s => [s.id, 0]));
  personas.forEach(p => { const s = stageOf(p); if (stageCounts[s] !== undefined) stageCounts[s]++; });
  const maxStageCount = Math.max(1, ...Object.values(stageCounts));

  // Próximas acciones (next 14 days + overdue)
  const nextActions = personas
    .filter(p => p.nextAction && p.nextAction <= in14str && stageOf(p) !== "inactivo")
    .sort((a, b) => a.nextAction.localeCompare(b.nextAction))
    .slice(0, 6);

  const recentPersonas = [...personas].sort((a, b) => (b.lastContact || "").localeCompare(a.lastContact || "")).slice(0, 5);

  const today = new Date();
  const dayOfYear = (d) => {
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  };
  const todayDay = dayOfYear(today);
  const bdays = personas
    .filter(p => p.birthday)
    .map(p => {
      const [, m, d] = p.birthday.split("-").map(n => parseInt(n));
      const dt = new Date(today.getFullYear(), m - 1, d);
      let diff = dayOfYear(dt) - todayDay;
      if (diff < 0) diff += 365;
      return { p, diff, dt };
    })
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5);

  const typeCounts = {};
  entities.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
  const typeRows = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  const roleCounts = {};
  personas.forEach(p => { roleCounts[p.role] = (roleCounts[p.role] || 0) + 1; });
  const roleRows = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.home.hello}</h1>
          <div className="page-sub">{t.home.sub} · {new Date().toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => go({ name: "new-entity" })}><Icon name="plus" /> {t.nav.newEntity}</button>
          <button className="btn btn-primary" onClick={() => go({ name: "new-person" })}><Icon name="plus" /> {t.nav.newPerson}</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">{t.home.kpiPersonas}</div>
          <div className="num">{personas.length}</div>
          <div className="delta">Base de contactos</div>
        </div>
        <div className="kpi">
          <div className="label">{t.home.kpiEntidades}</div>
          <div className="num">{entities.length}</div>
          <div className="delta">Organizaciones vinculadas</div>
        </div>
        <div className="kpi">
          <div className="label">{t.home.kpiCountries}</div>
          <div className="num">{countries.size}</div>
        </div>
        <div className="kpi">
          <div className="label">{t.home.kpiCities}</div>
          <div className="num">{cities.size}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">{t.home.coverageMap}</div>
            <div className="card-meta">{personas.length + entities.length} pins</div>
          </div>
          <div style={{ height: 320 }}>
            <MiniMap personas={personas} entities={entities} go={go} />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">{t.home.recentlyAdded}</div>
          </div>
          <div>
            {recentPersonas.map(p => (
              <div key={p.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                onClick={() => go({ name: "person", id: p.id })}>
                <div className="av-circle" style={{ background: p.color }}>{initials(fullName(p))}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{fullName(p)}</div>
                  <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
                    {fmtRole(p.role, t)} · {p.city}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{fmtDate(p.lastContact, lang)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* Pipeline funnel */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Pipeline</div>
            <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => go({ name: "pipeline" })}>
              Ver tablero →
            </button>
          </div>
          <div className="card-pad">
            {stages.map(s => (
              <div key={s.id} className="bar-row" style={{ cursor: "pointer" }} onClick={() => go({ name: "pipeline" })}>
                <div className="lbl" style={{ color: s.color, fontWeight: 500 }}>{s.label}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(stageCounts[s.id] / maxStageCount) * 100}%`, background: s.color }} />
                </div>
                <div className="num">{stageCounts[s.id]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas acciones */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">{lang === "es" ? "Próximas acciones" : "Upcoming actions"}</div>
            <div className="card-meta" style={{ color: nextActions.filter(p => p.nextAction < today).length > 0 ? "var(--bad)" : "var(--ink-3)" }}>
              {nextActions.filter(p => p.nextAction < today).length > 0
                ? nextActions.filter(p => p.nextAction < today).length + (lang === "es" ? " vencidas" : " overdue")
                : nextActions.length + (lang === "es" ? " esta quincena" : " this fortnight")}
            </div>
          </div>
          <div>
            {nextActions.length === 0 && (
              <div className="empty" style={{ padding: "24px 0" }}>
                {lang === "es" ? "Sin acciones pendientes" : "No pending actions"}
              </div>
            )}
            {nextActions.map(p => {
              const overdue = p.nextAction < today;
              const daysStr = p.nextAction === today
                ? (lang === "es" ? "hoy" : "today")
                : overdue
                  ? Math.round((new Date(today) - new Date(p.nextAction)) / 86400000) + "d " + (lang === "es" ? "vencida" : "overdue")
                  : "+" + Math.round((new Date(p.nextAction) - new Date(today)) / 86400000) + "d";
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                  onClick={() => go({ name: "person", id: p.id })}>
                  <div className="av-circle" style={{ background: p.color }}>{initials(fullName(p))}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{fullName(p)}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {(() => { const st = stages.find(s => s.id === stageOf(p)); return st ? <span style={{ color: st.color, fontWeight: 500 }}>{st.label}</span> : null; })()}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: overdue ? "var(--bad)" : "var(--accent)" }}>{daysStr}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming birthdays */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">{t.home.upcomingBdays}</div>
          </div>
          <div>
            {bdays.map(({ p, dt, diff }) => (
              <div key={p.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                onClick={() => go({ name: "person", id: p.id })}>
                <div className="av-circle" style={{ background: p.color }}>{initials(fullName(p))}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{fullName(p)}</div>
                  <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
                    {dt.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { day: "numeric", month: "short" })}
                    {" · "}
                    {diff === 0 ? (lang === "en" ? "today" : "hoy") : "+" + diff + "d"}
                  </div>
                </div>
                <Icon name="calendar" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Bars = ({ rows, max }) => (
  <div className="bars">
    {rows.map((r, i) => (
      <div key={i} className="bar-row">
        <div className="lbl">{r.label}</div>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        <div className="num">{r.value}</div>
      </div>
    ))}
  </div>
);

window.Home = Home;
