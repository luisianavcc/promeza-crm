// PROMEZA CRM — Sidebar / Topbar shell

const Sidebar = ({ route, go, t, counts }) => {
  const items = [
    { id: "home", label: t.nav.home, icon: "home" },
    { id: "personas", label: t.nav.personas, icon: "users", count: counts.personas },
    { id: "entities", label: t.nav.entities, icon: "building", count: counts.entities },
    { id: "map", label: t.nav.map, icon: "map" },
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
            {it.count != null && <span className="badge">{it.count}</span>}
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

const Topbar = ({ t, lang, setLang, query, setQuery, onSearchSubmit, onSettings, userEmail }) => {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "??";
  const displayName = userEmail ? userEmail.split("@")[0].replace(".", " ") : "";
  const firstName = displayName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <header className="topbar">
      <div className="search">
        <span className="search-icon"><Icon name="search" /></span>
        <input
          placeholder={t.placeholders.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearchSubmit(); }}
        />
      </div>
      <div className="top-spacer" />
      <div className="lang-toggle">
        <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ES</button>
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
      </div>
      <button className="icon-btn" title={t.settings ? t.settings.title : "Settings"} onClick={onSettings}>
        <Icon name="settings" />
      </button>
      <div className="user-pill" style={{ cursor: "pointer" }} onClick={onSettings} title={userEmail}>
        <div className="av" style={{ background: "var(--accent)" }}>{initials}</div>
        <span style={{ fontSize: 12, fontWeight: 500, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {firstName || userEmail}
        </span>
      </div>
    </header>
  );
};

window.Sidebar = Sidebar;
window.Topbar = Topbar;
