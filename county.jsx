// PROMEZA CRM — County view (por condado)

const CountyView = ({ t, lang, data, go }) => {
  const [selected, setSelected] = React.useState(null);
  const [tab, setTab] = React.useState("personas");

  const es = lang === "es";

  // Build county groups for personas
  const personasByCounty = React.useMemo(() => {
    const map = {};
    data.personas.forEach(p => {
      const key = p.county || (p.state ? (es ? "Sin condado — " + p.state : "No county — " + p.state) : (es ? "Sin condado" : "No county"));
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [data.personas, lang]);

  // Build county groups for entities
  const entitiesByCounty = React.useMemo(() => {
    const map = {};
    data.entities.forEach(e => {
      const key = e.county || (e.state ? (es ? "Sin condado — " + e.state : "No county — " + e.state) : (es ? "Sin condado" : "No county"));
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [data.entities, lang]);

  // All unique counties across both
  const allCounties = React.useMemo(() => {
    const keys = new Set([...Object.keys(personasByCounty), ...Object.keys(entitiesByCounty)]);
    return [...keys].sort((a, b) => {
      const pa = (personasByCounty[a] || []).length + (entitiesByCounty[a] || []).length;
      const pb = (personasByCounty[b] || []).length + (entitiesByCounty[b] || []).length;
      return pb - pa;
    });
  }, [personasByCounty, entitiesByCounty]);

  const totalPersonas = data.personas.length;
  const totalEntities = data.entities.length;

  const countyColors = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"];
  const colorFor = (i) => countyColors[i % countyColors.length];

  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");
  const stages = window.PIPELINE_STAGES || [];

  if (selected) {
    const personas = personasByCounty[selected] || [];
    const entities = entitiesByCounty[selected] || [];
    const colorIdx = allCounties.indexOf(selected);

    return (
      <div style={{ animation: "fadeIn .2s ease-out" }}>
        <div style={{ marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
            ← {es ? "Todos los condados" : "All counties"}
          </button>
        </div>

        <div className="page-head" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: colorFor(colorIdx), display: "inline-block" }} />
              {selected}
            </h1>
            <div className="page-sub">
              {personas.length} {es ? "personas" : "people"} · {entities.length} {es ? "entidades" : "entities"}
            </div>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          <div className={"tab " + (tab === "personas" ? "on" : "")} onClick={() => setTab("personas")}>
            {es ? "Personas" : "People"} ({personas.length})
          </div>
          <div className={"tab " + (tab === "entities" ? "on" : "")} onClick={() => setTab("entities")}>
            {es ? "Entidades" : "Entities"} ({entities.length})
          </div>
        </div>

        {tab === "personas" && (
          <div className="card">
            {personas.length === 0 && <div className="empty" style={{ padding: 24 }}>{es ? "Sin personas en este condado" : "No people in this county"}</div>}
            {personas.map((p, i) => {
              const stageId = stageOf(p);
              const st = stages.find(s => s.id === stageId);
              return (
                <div key={p.id} className="hover-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", borderBottom: i < personas.length - 1 ? "1px solid var(--line)" : "none", animation: "slideUp .2s ease-out both", animationDelay: (i * 20) + "ms" }}
                  onClick={() => go({ name: "person", id: p.id })}>
                  <div className="av-circle" style={{ background: p.color, flexShrink: 0 }}>{initials(fullName(p))}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{fullName(p)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 1 }}>
                      {p.role === "otro" ? (p.roleOther || t.roles.otro) : (t.roles[p.role] || p.role)}
                      {p.city && " · " + p.city}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {st && <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>}
                    {p.email && <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{p.email}</span>}
                  </div>
                  <Icon name="chevron-right" size={14} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        )}

        {tab === "entities" && (
          <div className="card">
            {entities.length === 0 && <div className="empty" style={{ padding: 24 }}>{es ? "Sin entidades en este condado" : "No entities in this county"}</div>}
            {entities.map((e, i) => (
              <div key={e.id} className="hover-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", borderBottom: i < entities.length - 1 ? "1px solid var(--line)" : "none", animation: "slideUp .2s ease-out both", animationDelay: (i * 20) + "ms" }}
                onClick={() => go({ name: "entity", id: e.id })}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0ea5e918", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="building" size={16} style={{ color: "#0ea5e9" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 1 }}>
                    {t.types[e.type] || e.type}
                    {e.city && " · " + e.city}
                  </div>
                </div>
                {e.phone && <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{e.phone}</span>}
                <Icon name="chevron-right" size={14} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Main county grid ───
  return (
    <div style={{ animation: "fadeIn .2s ease-out" }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">{es ? "Por condado" : "By county"}</h1>
          <div className="page-sub">
            {allCounties.length} {es ? "condados / regiones" : "counties / regions"} · {totalPersonas} {es ? "personas" : "people"} · {totalEntities} {es ? "entidades" : "entities"}
          </div>
        </div>
      </div>

      {allCounties.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{es ? "Sin datos de condado" : "No county data yet"}</div>
          <div style={{ color: "var(--ink-4)", fontSize: 13 }}>
            {es ? "Al agregar o editar una persona con ciudad, el sistema detecta el condado automáticamente." : "When adding or editing a person with a city, the system auto-detects the county."}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
        {allCounties.map((county, i) => {
          const personas = personasByCounty[county] || [];
          const entities = entitiesByCounty[county] || [];
          const total = personas.length + entities.length;
          const color = colorFor(i);
          const activos = personas.filter(p => stageOf(p) !== "inactivo").length;
          const maxTotal = Math.max(...allCounties.map(c => (personasByCounty[c] || []).length + (entitiesByCounty[c] || []).length), 1);
          const pct = Math.round(total / maxTotal * 100);

          // City breakdown within county
          const cityCounts = {};
          personas.forEach(p => { if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1; });
          const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

          return (
            <div key={county} className="card hover-row" style={{ padding: "16px 18px", cursor: "pointer", animation: "slideUp .3s ease-out both", animationDelay: (i * 40) + "ms" }}
              onClick={() => setSelected(county)}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "18", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>🗺️</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{county}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>
                    {personas.length} {es ? "personas" : "people"} · {entities.length} {es ? "entidades" : "entities"}
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: "-.02em" }}>{total}</div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 5, background: "var(--line)", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 3, transition: "width .6s cubic-bezier(.34,1.56,.64,1)", transitionDelay: (i * 40 + 200) + "ms" }} />
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 12, marginBottom: topCities.length > 0 ? 10 : 0 }}>
                {personas.length > 0 && (
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                    <span style={{ fontWeight: 700, color: "var(--good)" }}>{activos}</span> {es ? "activos" : "active"}
                  </div>
                )}
                {personas.length > 0 && personas.filter(p => window.hasContactIssue && window.hasContactIssue(p)).length > 0 && (
                  <div style={{ fontSize: 11.5, color: "#f59e0b", fontWeight: 600 }}>
                    ⚠ {personas.filter(p => window.hasContactIssue && window.hasContactIssue(p)).length} {es ? "por revisar" : "to review"}
                  </div>
                )}
              </div>

              {/* Top cities */}
              {topCities.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {topCities.map(([city, cnt]) => (
                    <span key={city} style={{ fontSize: 11, background: color + "15", color, padding: "1px 7px", borderRadius: 5, fontWeight: 600 }}>
                      {city} {cnt > 1 && <span style={{ opacity: .7 }}>·{cnt}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table view */}
      {allCounties.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">{es ? "Resumen por condado" : "County summary"}</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Condado" : "County"}</th>
                <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Personas" : "People"}</th>
                <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Activos" : "Active"}</th>
                <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Entidades" : "Entities"}</th>
                <th style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Ciudades principales" : "Top cities"}</th>
              </tr>
            </thead>
            <tbody>
              {allCounties.map((county, i) => {
                const personas = personasByCounty[county] || [];
                const entities = entitiesByCounty[county] || [];
                const activos = personas.filter(p => stageOf(p) !== "inactivo").length;
                const cityCounts = {};
                personas.forEach(p => { if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1; });
                const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
                return (
                  <tr key={county} className="hover-row" style={{ borderBottom: "1px solid var(--line)", cursor: "pointer" }} onClick={() => setSelected(county)}>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: colorFor(i), display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{county}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, color: "var(--accent)" }}>{personas.length}</td>
                    <td style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, color: "var(--good)" }}>{activos}</td>
                    <td style={{ textAlign: "center", padding: "10px 12px", color: "#0ea5e9", fontWeight: 700 }}>{entities.length}</td>
                    <td style={{ padding: "10px 16px", color: "var(--ink-3)", fontSize: 12 }}>{topCities.join(", ") || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

window.CountyView = CountyView;
