// PROMEZA CRM — Sidebar / Topbar shell

const Sidebar = ({ route, go, t, counts }) => {
  const items = [
    { id: "home",      label: t.nav.home,                  icon: "home" },
    { id: "personas",  label: t.nav.personas,              icon: "users",    count: counts.personas },
    { id: "pipeline",  label: "Pipeline",                   icon: "chart" },
    { id: "entities",  label: t.nav.entities,              icon: "building", count: counts.entities },
    { id: "projects",  label: t.nav.projects  || "Proyectos",  icon: "folder",   count: counts.projects  || null },
    { id: "tasks",     label: t.nav.tasks     || "Tareas",     icon: "check",    count: counts.pendingTasks || null, countStyle: counts.overdueCount > 0 ? { background: "#ef4444" } : null },
    { id: "my-tasks",  label: t.nav.myTasks   || "Mis tareas", icon: "clock" },
    { id: "campaigns", label: t.nav.campaigns || "Campañas",   icon: "megaphone" },
    { id: "calendar",  label: t.nav.calendar  || "Calendario", icon: "calendar" },
    { id: "goals",     label: t.nav.goals     || "Metas",      icon: "target",   count: counts.completedGoals || null, countStyle: { background: "var(--good)" } },
    { id: "county",    label: t.nav.county    || "Por condado", icon: "pin" },
    { id: "map",       label: t.nav.map,                   icon: "map" },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">P</div>
        <div>
          <div className="brand-name">{t.appName}</div>
          <div className="brand-tag">{t.appTag}</div>
        </div>
      </div>
      <div className="nav-group">
        <div className="nav-label">CRM</div>
        {items.map(it => (
          <div
            key={it.id}
            className={"nav-item " + (route.name === it.id ? "active" : "")}
            onClick={() => go({ name: it.id })}
          >
            <span className="dot"><Icon name={it.icon} /></span>
            <span>{it.label}</span>
            {it.count != null && it.count > 0 && <span className="badge" style={it.countStyle || {}}>{it.count}</span>}
          </div>
        ))}
      </div>
      <div className="nav-group">
        <div className="nav-label">{t.common.add}</div>
        <div className="nav-item" onClick={() => go({ name: "new-person" })}>
          <span className="dot"><Icon name="plus" /></span>
          <span>{t.nav.newPerson}</span>
        </div>
        <div className="nav-item" onClick={() => go({ name: "new-entity" })}>
          <span className="dot"><Icon name="plus" /></span>
          <span>{t.nav.newEntity}</span>
        </div>
      </div>
      <div className="nav-group">
        <div className="nav-label">Calidad</div>
        <div
          className={"nav-item " + (route.name === "duplicates" ? "active" : "")}
          onClick={() => go({ name: "duplicates" })}
        >
          <span className="dot"><Icon name="copy" /></span>
          <span>Duplicados</span>
          {counts.dups > 0 && (
            <span className="badge" style={{ background: "#f59e0b", color: "#fff" }}>{counts.dups}</span>
          )}
        </div>
      </div>
      <div className="side-cta">
        <div style={{ fontSize: 11, color: "var(--ink-3)", padding: "0 4px 4px" }}>
          v1.0 · {new Date().toLocaleDateString()}
        </div>
      </div>
    </aside>
  );
};

// ─── Notifications panel ───
const NotificationsPanel = ({ data, lang, go, onClose }) => {
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7str = in7.toISOString().slice(0, 10);

  // Birthdays today / this week
  const todayDate = new Date();
  const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const todayDOY = dayOfYear(todayDate);
  const birthdayAlerts = data.personas
    .filter(p => p.birthday)
    .map(p => {
      const [, m, d] = p.birthday.split("-").map(n => parseInt(n));
      const dt = new Date(todayDate.getFullYear(), m - 1, d);
      const diff = dayOfYear(dt) - todayDOY;
      return { p, diff };
    })
    .filter(({ diff }) => diff >= 0 && diff <= 7)
    .sort((a, b) => a.diff - b.diff);

  // Overdue tasks
  const overdueItems = [];
  Object.entries(data.tasks || {}).forEach(([pid, tasks]) => {
    tasks.filter(tk => !tk.done && tk.due && tk.due < today).forEach(tk => {
      const person = data.personas.find(p => p.id === pid);
      if (person) overdueItems.push({ task: tk, person });
    });
  });
  overdueItems.sort((a, b) => a.task.due.localeCompare(b.task.due));

  // Upcoming projects (next 7 days)
  const upcomingProjects = (data.projects || [])
    .filter(pr => pr.dateStart && pr.dateStart >= today && pr.dateStart <= in7str && pr.status !== "cancelado")
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart));

  // Bad contact info
  const badInfoPersonas = window.hasContactIssue
    ? data.personas.filter(p => window.hasContactIssue(p)).slice(0, 6)
    : [];

  const total = birthdayAlerts.length + overdueItems.length + upcomingProjects.length + (badInfoPersonas.length > 0 ? 1 : 0);

  return (
    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 360, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 500, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Notificaciones {total > 0 && <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 400 }}>({total})</span>}</div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>
      <div style={{ maxHeight: 420, overflowY: "auto" }}>
        {total === 0 && (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
            Todo al día — sin alertas
          </div>
        )}

        {upcomingProjects.length > 0 && (
          <div>
            <div style={{ padding: "8px 16px 4px", fontSize: 10.5, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".06em" }}>Proyectos esta semana</div>
            {upcomingProjects.map(pr => {
              const types = window.PROJECT_TYPES || [];
              const pt = types.find(t => t.id === pr.type) || { emoji: "📂", color: "#6366f1" };
              const daysUntil = Math.round((new Date(pr.dateStart + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000);
              return (
                <div key={pr.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                  onClick={() => { go({ name: "project", id: pr.id }); onClose(); }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: pt.color + "18", display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>{pt.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{fmtDate(pr.dateStart, lang)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pt.color, flexShrink: 0 }}>{daysUntil === 0 ? "Hoy" : "+" + daysUntil + "d"}</span>
                </div>
              );
            })}
          </div>
        )}

        {birthdayAlerts.length > 0 && (
          <div>
            <div style={{ padding: "8px 16px 4px", fontSize: 10.5, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Cumpleaños</div>
            {birthdayAlerts.map(({ p, diff }) => (
              <div key={p.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                onClick={() => { go({ name: "person", id: p.id }); onClose(); }}>
                <div className="av-circle" style={{ background: p.color, width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>{initials(fullName(p))}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{fullName(p)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{diff === 0 ? "Cumpleaños hoy" : "Cumpleaños en " + diff + " días"}</div>
                </div>
                <span style={{ fontSize: 18 }}>{diff === 0 ? "🎂" : "🎉"}</span>
              </div>
            ))}
          </div>
        )}

        {badInfoPersonas.length > 0 && (
          <div>
            <div style={{ padding: "8px 16px 4px", fontSize: 10.5, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Información por corregir · {data.personas.filter(p => window.hasContactIssue && window.hasContactIssue(p)).length} personas
            </div>
            {badInfoPersonas.map(p => {
              const email = (p.email || "").trim();
              const phone = (p.phone || "").replace(/\D/g, "");
              const issues = [];
              if (!email && phone.length < 7) issues.push("Sin email ni teléfono");
              else {
                if (email && !email.includes("@")) issues.push("Email con formato incorrecto");
                if (p.emailStatus === "bad") issues.push("Email no funciona");
                if (p.phoneStatus === "bad") issues.push("Teléfono no funciona");
              }
              return (
                <div key={p.id} style={{ padding: "9px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                  onClick={() => { go({ name: "person", id: p.id }); onClose(); }}>
                  <div className="av-circle" style={{ background: p.color, width: 30, height: 30, fontSize: 10, flexShrink: 0 }}>{initials(fullName(p))}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{fullName(p)}</div>
                    <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 500 }}>{issues.join(" · ")}</div>
                  </div>
                  <Icon name="alert" size={13} style={{ color: "#f59e0b", flexShrink: 0 }} />
                </div>
              );
            })}
            {data.personas.filter(p => window.hasContactIssue && window.hasContactIssue(p)).length > 6 && (
              <div style={{ padding: "7px 16px", fontSize: 11.5, color: "var(--ink-3)", textAlign: "center" }}>
                +{data.personas.filter(p => window.hasContactIssue && window.hasContactIssue(p)).length - 6} más
              </div>
            )}
          </div>
        )}

        {overdueItems.length > 0 && (
          <div>
            <div style={{ padding: "8px 16px 4px", fontSize: 10.5, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: ".06em" }}>Tareas vencidas</div>
            {overdueItems.slice(0, 5).map(({ task, person }) => {
              const daysOver = Math.round((new Date(today) - new Date(task.due)) / 86400000);
              return (
                <div key={task.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                  onClick={() => { go({ name: "person", id: person.id }); onClose(); }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ef444414", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon name="clock" size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.text}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{fullName(person)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--bad)", flexShrink: 0 }}>-{daysOver}d</span>
                </div>
              );
            })}
            {overdueItems.length > 5 && (
              <div style={{ padding: "8px 16px", fontSize: 12, color: "var(--ink-3)", textAlign: "center", cursor: "pointer" }}
                onClick={() => { go({ name: "tasks" }); onClose(); }}>
                +{overdueItems.length - 5} más → Ver tareas
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => { go({ name: "projects" }); onClose(); }}>
          <Icon name="folder" size={13} /> Proyectos
        </button>
        <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => { go({ name: "tasks" }); onClose(); }}>
          <Icon name="check" size={13} /> Tareas
        </button>
      </div>
    </div>
  );
};

const Topbar = ({ t, lang, setLang, query, setQuery, onSearchSubmit, onSettings, userEmail, data, go }) => {
  const [showNotif, setShowNotif] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const notifRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "??";
  const displayName = userEmail ? userEmail.split("@")[0].replace(".", " ") : "";
  const firstName = displayName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Live search results
  const searchResults = React.useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q || q.length < 2 || !data) return null;
    const norm = s => (s || "").toLowerCase();
    const matchP = (p) =>
      norm(p.first + " " + p.last).includes(q) ||
      norm(p.email).includes(q) ||
      norm((p.phone || "").replace(/\D/g, "")).includes(q.replace(/\D/g, "")) ||
      norm(p.city).includes(q) ||
      norm(p.role).includes(q) ||
      (p.tags || []).some(tg => norm(tg).includes(q));
    const matchE = (e) =>
      norm(e.name).includes(q) ||
      norm(e.email).includes(q) ||
      norm(e.city).includes(q) ||
      norm(e.phone).includes(q);
    const matchPr = (pr) =>
      norm(pr.name).includes(q) ||
      norm(pr.description).includes(q) ||
      norm(pr.location).includes(q);
    const personas = data.personas.filter(matchP).slice(0, 5);
    const entities = data.entities.filter(matchE).slice(0, 4);
    const projects = (data.projects || []).filter(matchPr).slice(0, 3);
    return { personas, entities, projects, total: personas.length + entities.length + projects.length };
  }, [query, data]);

  const closeSearch = () => { setShowSearch(false); };
  const pick = (route) => { go(route); setQuery(""); closeSearch(); };

  // Close search on outside click
  React.useEffect(() => {
    if (!showSearch) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) closeSearch();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSearch]);

  // Close notifications on outside click
  React.useEffect(() => {
    if (!showNotif) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotif]);

  // Count notifications
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7str = in7.toISOString().slice(0, 10);
  const todayDate = new Date();
  const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const todayDOY = dayOfYear(todayDate);

  const notifCount = React.useMemo(() => {
    if (!data) return 0;
    let n = 0;
    n += (data.projects || []).filter(pr => pr.dateStart && pr.dateStart >= today && pr.dateStart <= in7str && pr.status !== "cancelado").length;
    n += data.personas.filter(p => {
      if (!p.birthday) return false;
      const [, m, d] = p.birthday.split("-").map(Number);
      const dt = new Date(todayDate.getFullYear(), m - 1, d);
      const diff = dayOfYear(dt) - todayDOY;
      return diff >= 0 && diff <= 7;
    }).length;
    n += Object.values(data.tasks || {}).flat().filter(tk => !tk.done && tk.due && tk.due < today).length;
    if (window.hasContactIssue && data.personas.some(p => window.hasContactIssue(p))) n += 1;
    return Math.min(99, n);
  }, [data, today]);

  const stages = window.PIPELINE_STAGES || [];
  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  return (
    <header className="topbar">
      {/* Search with live dropdown */}
      <div className="search" ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: 520 }}>
        <span className="search-icon"><Icon name="search" /></span>
        <input
          ref={inputRef}
          placeholder={t.placeholders.search}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSearch(true); }}
          onFocus={() => { if (query.trim().length >= 2) setShowSearch(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSearchSubmit(); closeSearch(); }
            if (e.key === "Escape") { setQuery(""); closeSearch(); }
          }}
        />
        {query && (
          <button onClick={() => { setQuery(""); closeSearch(); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-4)", padding: 2, display: "grid", placeItems: "center" }}>
            <Icon name="x" size={13} />
          </button>
        )}

        {/* Live search dropdown */}
        {showSearch && searchResults && query.trim().length >= 2 && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "var(--bg)", border: "1px solid var(--line)",
            borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 600,
            maxHeight: 480, overflowY: "auto", animation: "popIn .15s ease-out",
          }}>
            {searchResults.total === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--ink-4)", fontSize: 13 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>🔍</div>
                Sin resultados para "<strong>{query}</strong>"
              </div>
            ) : (
              <>
                {searchResults.personas.length > 0 && (
                  <div>
                    <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                      Personas · {searchResults.personas.length}
                    </div>
                    {searchResults.personas.map(p => {
                      const stage = stages.find(s => s.id === stageOf(p));
                      return (
                        <div key={p.id}
                          style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderBottom: "1px solid var(--line)", transition: "background .1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-soft)"}
                          onMouseLeave={e => e.currentTarget.style.background = ""}
                          onClick={() => pick({ name: "person", id: p.id })}>
                          <div className="av-circle" style={{ background: p.color, width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>{initials(fullName(p))}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{fullName(p)}</div>
                            <div style={{ fontSize: 11.5, color: "var(--ink-3)", display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {p.role && <span>{fmtRole(p.role, t)}</span>}
                              {p.city && <span>· {p.city}</span>}
                              {p.email && <span style={{ color: "var(--ink-4)" }}>· {p.email}</span>}
                              {p.phone && <span style={{ color: "var(--ink-4)" }}>· {p.phone}</span>}
                            </div>
                          </div>
                          {stage && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: stage.color + "14", color: stage.color, whiteSpace: "nowrap", flexShrink: 0 }}>{stage.label}</span>}
                        </div>
                      );
                    })}
                    {data.personas.filter(p => {
                      const q = query.trim().toLowerCase();
                      const norm = s => (s || "").toLowerCase();
                      return norm(p.first + " " + p.last).includes(q) || norm(p.email).includes(q) || norm(p.city).includes(q);
                    }).length > 5 && (
                      <div style={{ padding: "7px 16px", fontSize: 12, color: "var(--accent)", fontWeight: 600, cursor: "pointer", textAlign: "center" }}
                        onClick={() => { onSearchSubmit(); closeSearch(); }}>
                        Ver todos los resultados →
                      </div>
                    )}
                  </div>
                )}

                {searchResults.entities.length > 0 && (
                  <div>
                    <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                      Entidades · {searchResults.entities.length}
                    </div>
                    {searchResults.entities.map(e => (
                      <div key={e.id}
                        style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderBottom: "1px solid var(--line)", transition: "background .1s" }}
                        onMouseEnter={ev => ev.currentTarget.style.background = "var(--bg-soft)"}
                        onMouseLeave={ev => ev.currentTarget.style.background = ""}
                        onClick={() => pick({ name: "entity", id: e.id })}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-50)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <Icon name="building" size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{e.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)", display: "flex", gap: 6 }}>
                            {e.city && <span>{e.city}</span>}
                            {e.phone && <span>· {e.phone}</span>}
                            {e.email && <span style={{ color: "var(--ink-4)" }}>· {e.email}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, color: "var(--ink-4)", flexShrink: 0 }}>{(t.types || {})[e.type] || e.type}</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.projects.length > 0 && (
                  <div>
                    <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                      Proyectos · {searchResults.projects.length}
                    </div>
                    {searchResults.projects.map(pr => {
                      const types = window.PROJECT_TYPES || [];
                      const pt = types.find(t => t.id === pr.type) || { emoji: "📂", color: "#6366f1" };
                      return (
                        <div key={pr.id}
                          style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderBottom: "1px solid var(--line)", transition: "background .1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-soft)"}
                          onMouseLeave={e => e.currentTarget.style.background = ""}
                          onClick={() => pick({ name: "project", id: pr.id })}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: pt.color + "18", display: "grid", placeItems: "center", fontSize: 17, flexShrink: 0 }}>{pt.emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{pr.name}</div>
                            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                              {pr.dateStart ? fmtDate(pr.dateStart, lang) : ""}
                              {pr.location ? " · " + pr.location : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="top-spacer" />
      <div className="lang-toggle">
        <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ES</button>
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
      </div>

      {/* Notification bell */}
      <div style={{ position: "relative" }} ref={notifRef}>
        <button className="icon-btn" title="Notificaciones" onClick={() => setShowNotif(v => !v)} style={{ position: "relative" }}>
          <Icon name="bell" />
          {notifCount > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4, width: 16, height: 16,
              background: notifCount > 5 ? "var(--bad)" : "#f59e0b",
              borderRadius: "50%", fontSize: 9, fontWeight: 800, color: "#fff",
              display: "grid", placeItems: "center", lineHeight: 1,
            }}>
              {notifCount > 99 ? "99+" : notifCount}
            </span>
          )}
        </button>
        {showNotif && data && (
          <NotificationsPanel data={data} lang={lang} go={go} onClose={() => setShowNotif(false)} />
        )}
      </div>

      <button className="icon-btn" title={t.settings ? t.settings.title : "Settings"} onClick={onSettings}>
        <Icon name="settings" />
      </button>
      <div className="user-pill" style={{ cursor: "pointer" }} onClick={onSettings} title={userEmail}>
        <div className="av" style={{ background: "var(--accent)" }}>{userInitials}</div>
        <span style={{ fontSize: 12, fontWeight: 500, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {firstName || userEmail}
        </span>
      </div>
    </header>
  );
};

window.Sidebar = Sidebar;
window.Topbar = Topbar;
