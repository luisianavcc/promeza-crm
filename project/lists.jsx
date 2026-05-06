// PROMEZA CRM — Personas list + Entities list

const PersonasList = ({ t, lang, data, go }) => {
  const [role, setRole] = React.useState("all");
  const [country, setCountry] = React.useState("all");
  const [q, setQ] = React.useState("");

  const countries = ["all", ...new Set(data.personas.map(p => p.country))];
  const roles = ["all", ...Object.keys(t.roles)];

  const rows = data.personas.filter(p => {
    if (role !== "all" && p.role !== role) return false;
    if (country !== "all" && p.country !== country) return false;
    if (q) {
      const s = (fullName(p) + " " + p.email + " " + p.city).toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const entityById = Object.fromEntries(data.entities.map(e => [e.id, e]));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav.personas}</h1>
          <div className="page-sub">{rows.length} {t.common.count.toLowerCase()}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => go({ name: "new-person" })}><Icon name="plus" /> {t.nav.newPerson}</button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div style={{ position: "relative", minWidth: 240 }}>
            <span style={{ position: "absolute", left: 10, top: 8, color: "var(--ink-4)" }}><Icon name="search" /></span>
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder={t.placeholders.search}
              style={{ height: 32, padding: "0 10px 0 32px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, background: "var(--bg-soft)", width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 600, marginRight: 4 }}>{t.common.role}:</span>
            {roles.map(r => (
              <button key={r} className={"chip " + (role === r ? "on" : "")} onClick={() => setRole(r)}>
                {r === "all" ? t.common.all : t.roles[r]}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ height: 32, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", fontSize: 13 }}>
              {countries.map(c => <option key={c} value={c}>{c === "all" ? t.common.all : c}</option>)}
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 280 }}>{t.common.profile}</th>
              <th>{t.common.role}</th>
              <th>{t.common.relatedEntities}</th>
              <th>{t.common.contact}</th>
              <th>{t.common.address}</th>
              <th>{t.common.lastContact}</th>
              <th>{t.common.tags}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} onClick={() => go({ name: "person", id: p.id })}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="av-circle" style={{ background: p.color }}>{initials(fullName(p))}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{fullName(p)}</div>
                      <div className="num">{p.id.toUpperCase()} · <span className={"status-dot " + (p.status === "inactivo" ? "off" : "")}/>{t.common[p.status === "inactivo" ? "inactivos" : "activos"]}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="role-pill">{p.role === "otro" ? (p.roleOther || t.roles.otro) : t.roles[p.role]}</span>
                </td>
                <td>
                  {p.entities.length === 0 ? <span className="muted">—</span> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {p.entities.slice(0, 2).map(le => {
                        const ent = entityById[le.id];
                        return ent ? <span key={le.id} style={{ fontSize: 12.5 }}>{ent.name}</span> : null;
                      })}
                      {p.entities.length > 2 && <span className="muted" style={{ fontSize: 11 }}>+{p.entities.length - 2}</span>}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: 12.5 }}>{p.email}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{p.phone}</div>
                </td>
                <td><div style={{ fontSize: 12.5 }}>{p.city}</div><div className="muted" style={{ fontSize: 12 }}>{p.country}</div></td>
                <td className="num">{fmtDate(p.lastContact, lang)}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {p.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">{t.common.noResults}</div>}
      </div>
    </div>
  );
};

const EntitiesList = ({ t, lang, data, go }) => {
  const [type, setType] = React.useState("all");
  const [q, setQ] = React.useState("");

  const types = ["all", ...Object.keys(t.types)];
  const personasByEntity = {};
  data.personas.forEach(p => p.entities.forEach(le => {
    personasByEntity[le.id] = (personasByEntity[le.id] || 0) + 1;
  }));

  const rows = data.entities.filter(e => {
    if (type !== "all" && e.type !== type) return false;
    if (q) {
      const s = (e.name + " " + e.city + " " + e.country).toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav.entities}</h1>
          <div className="page-sub">{rows.length} {t.common.count.toLowerCase()}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => go({ name: "new-entity" })}><Icon name="plus" /> {t.nav.newEntity}</button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div style={{ position: "relative", minWidth: 240 }}>
            <span style={{ position: "absolute", left: 10, top: 8, color: "var(--ink-4)" }}><Icon name="search" /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.placeholders.search}
              style={{ height: 32, padding: "0 10px 0 32px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, background: "var(--bg-soft)", width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 600, marginRight: 4 }}>{t.common.type}:</span>
            {types.map(tp => (
              <button key={tp} className={"chip " + (type === tp ? "on" : "")} onClick={() => setType(tp)}>
                {tp === "all" ? t.common.all : t.types[tp]}
              </button>
            ))}
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 320 }}>{t.common.profile}</th>
              <th>{t.common.type}</th>
              <th>{t.common.address}</th>
              <th>{t.common.contact}</th>
              <th>{t.common.relatedPersonas}</th>
              <th>{t.common.size}</th>
              <th>{t.common.tags}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.id} onClick={() => go({ name: "entity", id: e.id })}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="ent-icon"><Icon name="building" /></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{e.name}</div>
                      <div className="num">{e.id.toUpperCase()} · {e.founded}</div>
                    </div>
                  </div>
                </td>
                <td><span className="role-pill muted">{t.types[e.type]}</span></td>
                <td><div style={{ fontSize: 12.5 }}>{e.city}</div><div className="muted" style={{ fontSize: 12 }}>{e.state}, {e.country}</div></td>
                <td>
                  <div style={{ fontSize: 12.5 }}>{e.email}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{e.phone}</div>
                </td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon name="users" />
                    <strong>{personasByEntity[e.id] || 0}</strong>
                  </span>
                </td>
                <td className="num">{e.size?.toLocaleString() || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {e.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">{t.common.noResults}</div>}
      </div>
    </div>
  );
};

window.PersonasList = PersonasList;
window.EntitiesList = EntitiesList;
