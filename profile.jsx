// PROMEZA CRM — Profile pages (Person + Entity)

const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs">
    {tabs.map(t => (
      <div key={t.id} className={"tab " + (active === t.id ? "on" : "")} onClick={() => onChange(t.id)}>{t.label}</div>
    ))}
  </div>
);

const SocialRow = ({ social }) => {
  const items = [
    { k: "ig", icon: "ig", label: "Instagram" },
    { k: "fb", icon: "fb", label: "Facebook" },
    { k: "tiktok", icon: "tt", label: "TikTok" },
    { k: "x", icon: "x-tw", label: "X" },
  ];
  const has = items.some(i => social[i.k]);
  if (!has) return <span className="muted">—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map(i => social[i.k] ? (
        <div key={i.k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <Icon name={i.icon} /><span>{social[i.k]}</span>
        </div>
      ) : null)}
    </div>
  );
};

const Comments = ({ items, t, lang, onAdd }) => {
  const [val, setVal] = React.useState("");
  return (
    <div>
      <div className="comment-form">
        <textarea
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder={t.common.writeComment}
        />
        <div className="row">
          <button className="btn btn-sm" onClick={() => setVal("")}>{t.common.cancel}</button>
          <button className="btn btn-sm btn-primary" disabled={!val.trim()}
            onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(""); } }}>
            <Icon name="plus" /> {t.common.post}
          </button>
        </div>
      </div>
      <div style={{ height: 14 }} />
      <div className="timeline">
        {items.length === 0 && <div className="empty">{t.common.noComments}</div>}
        {items.map((c, i) => (
          <div key={i} className="comment">
            <div className="av-circle" style={{ background: "#0f1530" }}>{initials(c.author)}</div>
            <div className="body">
              <div className="head">
                <span className="who">{c.author}</span>
                <span className="when">{fmtDate(c.date, lang)}</span>
              </div>
              <div className="text">{c.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PERSON PROFILE ───

const PersonProfile = ({ id, t, lang, data, go, addComment, onUpdatePerson, onEditPerson, onDeletePerson,
  interactions, onAddInteraction, onDeleteInteraction,
  tasks, onAddTask, onToggleTask, onDeleteTask }) => {
  const p = data.personas.find(x => x.id === id);
  const [tab, setTab] = React.useState("details");
  const [linking, setLinking] = React.useState(false);
  const [linkEntityId, setLinkEntityId] = React.useState("");
  const [linkRole, setLinkRole] = React.useState("miembro");
  if (!p) return <div className="empty">Not found</div>;

  const availableEntities = data.entities.filter(e => !p.entities.some(le => le.id === e.id));

  const doLinkEntity = () => {
    if (!linkEntityId) return;
    onUpdatePerson && onUpdatePerson(p.id, { entities: [...p.entities, { id: linkEntityId, role: linkRole, roleOther: "" }] });
    setLinking(false);
    setLinkEntityId("");
    setLinkRole("miembro");
  };
  const doUnlinkEntity = (entityId) => {
    onUpdatePerson && onUpdatePerson(p.id, { entities: p.entities.filter(le => le.id !== entityId) });
  };

  const linkedEntities = p.entities.map(le => ({
    link: le, entity: data.entities.find(e => e.id === le.id),
  })).filter(x => x.entity);

  const pendingTasks = (tasks || []).filter(tk => !tk.done).length;
  const tabs = [
    { id: "details", label: t.common.details },
    { id: "links", label: t.common.relatedEntities + " (" + linkedEntities.length + ")" },
    { id: "interactions", label: (lang === "es" ? "Interacciones" : "Interactions") + " (" + (interactions || []).length + ")" },
    { id: "tasks", label: (lang === "es" ? "Tareas" : "Tasks") + (pendingTasks > 0 ? " (" + pendingTasks + ")" : "") },
    { id: "comments", label: t.common.comments + " (" + (data.comments[p.id] || []).length + ")" },
    { id: "map", label: t.common.map },
  ];

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => go({ name: "personas" })}>
          ← {t.common.back}
        </button>
      </div>

      <div className="profile-head">
        <div className="av-circle xl" style={{ background: p.color }}>{initials(fullName(p))}</div>
        <div className="meta">
          <h1 className="name">{fullName(p)}</h1>
          <div className="sub">
            <span className="role-pill">{p.role === "otro" ? (p.roleOther || t.roles.otro) : t.roles[p.role]}</span>
            <span><span className={"status-dot " + (p.status === "inactivo" ? "off" : "")} />{t.common[p.status === "inactivo" ? "inactivos" : "activos"]}</span>
            <span><Icon name="pin" /> {p.city}, {p.country}</span>
            {p.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
          </div>
          <div className="vid" style={{ marginTop: 6 }}>VID {p.id.toUpperCase()}-{Math.abs(p.id.charCodeAt(1) * 7919) % 999999}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => window.location.href = "mailto:" + p.email}><Icon name="mail" /> Email</button>
          <button className="btn" onClick={() => window.location.href = "tel:" + p.phone}><Icon name="phone" /></button>
          <button className="btn" style={{ color: "var(--good)", borderColor: "var(--good)" }}
            onClick={() => onUpdatePerson && onUpdatePerson(p.id, { lastContact: new Date().toISOString().slice(0, 10) })}>
            <Icon name="check" /> {lang === "es" ? "Contactado hoy" : "Contacted today"}
          </button>
          <button className="btn" onClick={() => onEditPerson && onEditPerson(p.id)}>
            <Icon name="edit" /> {t.common.edit}
          </button>
          <button className="btn"
            style={p.status !== "inactivo" ? { color: "var(--bad)", borderColor: "var(--bad)" } : { color: "var(--good)", borderColor: "var(--good)" }}
            onClick={() => onUpdatePerson && onUpdatePerson(p.id, { status: p.status === "inactivo" ? "activo" : "inactivo" })}>
            <Icon name={p.status === "inactivo" ? "check" : "x"} />
            {p.status === "inactivo" ? (lang === "es" ? "Reactivar" : "Reactivate") : (lang === "es" ? "Inactivar" : "Deactivate")}
          </button>
          <button className="btn" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
            onClick={() => onDeletePerson && onDeletePerson(p.id)}>
            <Icon name="trash" /> {lang === "es" ? "Eliminar" : "Delete"}
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "details" && (
        <div className="profile-grid">
          <div>
            <div className="section">
              <h3>{t.common.contact}</h3>
              <div className="section-body">
                <dl className="kv">
                  <dt>Email</dt><dd>{p.email || <span className="muted">—</span>}</dd>
                  <dt>{lang === "es" ? "Teléfono" : "Phone"}</dt><dd>{p.phone || <span className="muted">—</span>}</dd>
                  <dt>{t.common.web}</dt><dd>{p.website ? <a href={"https://" + p.website} target="_blank" rel="noopener">{p.website}</a> : <span className="muted">—</span>}</dd>
                  <dt>{t.common.social}</dt><dd><SocialRow social={p.social || {}} /></dd>
                </dl>
              </div>
            </div>

            <div className="section">
              <h3>{t.common.address}</h3>
              <div className="section-body">
                <dl className="kv">
                  <dt>{lang === "es" ? "Calle" : "Street"}</dt><dd>{p.address || <span className="muted">—</span>}</dd>
                  <dt>ZIP</dt><dd className="mono">{p.zip || <span className="muted">—</span>}</dd>
                  <dt>{lang === "es" ? "Ciudad" : "City"}</dt><dd>{p.city}</dd>
                  <dt>{lang === "es" ? "Estado" : "State"}</dt><dd>{p.state}</dd>
                  <dt>{lang === "es" ? "País" : "Country"}</dt><dd>{p.country}</dd>
                </dl>
              </div>
            </div>

            <div className="section">
              <h3>{lang === "es" ? "Datos adicionales" : "Additional data"}</h3>
              <div className="section-body">
                <dl className="kv">
                  <dt>{t.common.birthday}</dt><dd>{fmtDate(p.birthday, lang)}</dd>
                  <dt>{t.common.lastContact}</dt><dd>{fmtDate(p.lastContact, lang)}</dd>
                  <dt>{t.common.language}</dt><dd>{p.language === "en" ? "English" : "Español"}</dd>
                  <dt>{t.common.tags}</dt><dd>{p.tags && p.tags.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
                    </div>
                  ) : <span className="muted">—</span>}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div>
            <div className="section">
              <h3>{t.common.relatedEntities} <span className="muted mono" style={{ fontSize: 11 }}>{linkedEntities.length}</span></h3>
              <div className="section-body">
                {linkedEntities.length === 0 && <div className="muted" style={{ fontSize: 13 }}>{lang === "es" ? "Sin entidad vinculada" : "No linked entity"}</div>}
                {linkedEntities.map(({ link, entity }) => (
                  <div key={link.id} className="link-row" onClick={() => go({ name: "entity", id: entity.id })} style={{ cursor: "pointer" }}>
                    <div className="ent-icon"><Icon name="building" /></div>
                    <div className="grow">
                      <div className="title">{entity.name}</div>
                      <div className="row-sub">{t.types[entity.type]} · {entity.city}</div>
                    </div>
                    <span className="role-pill">{link.role === "otro" ? (link.roleOther || t.roles.otro) : t.roles[link.role]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="section">
              <h3>{t.common.map}</h3>
              <div className="mini-map" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderBottom: 0, height: 220 }}>
                <MiniMap personas={[p]} entities={linkedEntities.map(x => x.entity)} focus={p.lat ? { lat: p.lat, lng: p.lng } : null} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "links" && (
        <div className="section">
          <h3>{t.common.relatedEntities}
            {!linking && availableEntities.length > 0 && (
              <button className="btn btn-sm" onClick={() => { setLinking(true); setLinkEntityId(availableEntities[0]?.id || ""); }}>
                <Icon name="plus" /> {lang === "es" ? "Vincular entidad" : "Link entity"}
              </button>
            )}
          </h3>
          {linking && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "12px 16px", background: "var(--bg-soft)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
              <div className="field" style={{ margin: 0, flex: "1 1 180px" }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Entidad" : "Entity"}</label>
                <select value={linkEntityId} onChange={e => setLinkEntityId(e.target.value)}>
                  {availableEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ margin: 0, flex: "1 1 140px" }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Cargo" : "Role"}</label>
                <select value={linkRole} onChange={e => setLinkRole(e.target.value)}>
                  {Object.keys(t.roles).map(k => <option key={k} value={k}>{t.roles[k]}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, paddingBottom: 1 }}>
                <button className="btn btn-sm btn-primary" onClick={doLinkEntity}><Icon name="check" /> {lang === "es" ? "Vincular" : "Link"}</button>
                <button className="btn btn-sm" onClick={() => setLinking(false)}>{lang === "es" ? "Cancelar" : "Cancel"}</button>
              </div>
            </div>
          )}
          <div className="section-body">
            {linkedEntities.length === 0 && !linking && <div className="empty">{t.common.none}</div>}
            {linkedEntities.map(({ link, entity }) => (
              <div key={link.id} className="link-row">
                <div className="ent-icon" style={{ cursor: "pointer" }} onClick={() => go({ name: "entity", id: entity.id })}><Icon name="building" /></div>
                <div className="grow" style={{ cursor: "pointer" }} onClick={() => go({ name: "entity", id: entity.id })}>
                  <div className="title">{entity.name}</div>
                  <div className="row-sub">{t.types[entity.type]} · {entity.city}, {entity.country}</div>
                </div>
                <span className="role-pill">{link.role === "otro" ? (link.roleOther || t.roles.otro) : t.roles[link.role]}</span>
                <button className="btn btn-sm btn-ghost" style={{ color: "var(--bad)" }} onClick={() => doUnlinkEntity(entity.id)}>
                  <Icon name="x" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "interactions" && (
        <InteractionsTab
          personId={p.id}
          interactions={interactions}
          onAdd={onAddInteraction}
          onDelete={onDeleteInteraction}
          lang={lang}
        />
      )}

      {tab === "tasks" && (
        <TasksTab
          personId={p.id}
          tasks={tasks}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          lang={lang}
        />
      )}

      {tab === "comments" && (
        <div className="section">
          <h3>{t.common.comments}</h3>
          <div className="section-body">
            <Comments items={data.comments[p.id] || []} t={t} lang={lang} onAdd={(text) => addComment(p.id, text)} />
          </div>
        </div>
      )}

      {tab === "map" && (
        <div className="section">
          <h3>{t.common.map}</h3>
          <div style={{ height: 480 }}>
            <MiniMap personas={[p]} entities={linkedEntities.map(x => x.entity)} focus={p.lat ? { lat: p.lat, lng: p.lng } : null} go={go} />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ENTITY PROFILE ───

const EntityProfile = ({ id, t, lang, data, go, addComment, onUpdateEntity, onUpdatePerson, onEditEntity, onDeleteEntity }) => {
  const e = data.entities.find(x => x.id === id);
  const [tab, setTab] = React.useState("details");
  const [linking, setLinking] = React.useState(false);
  const [linkPersonId, setLinkPersonId] = React.useState("");
  const [linkRole, setLinkRole] = React.useState("miembro");
  if (!e) return <div className="empty">Not found</div>;

  const linkedPeople = data.personas
    .map(p => ({ p, link: p.entities.find(le => le.id === e.id) }))
    .filter(x => x.link);

  const children = data.entities.filter(c => c.parent === e.id);
  const parent = e.parent ? data.entities.find(x => x.id === e.parent) : null;

  const linkedPersonIds = new Set(linkedPeople.map(x => x.p.id));
  const availablePersons = data.personas.filter(p => !linkedPersonIds.has(p.id));

  const doLinkPerson = () => {
    if (!linkPersonId) return;
    const target = data.personas.find(p => p.id === linkPersonId);
    if (!target) return;
    onUpdatePerson && onUpdatePerson(linkPersonId, {
      entities: [...target.entities, { id: e.id, role: linkRole, roleOther: "" }],
    });
    setLinking(false);
    setLinkPersonId("");
    setLinkRole("miembro");
  };
  const doUnlinkPerson = (personId) => {
    const target = data.personas.find(p => p.id === personId);
    if (!target) return;
    onUpdatePerson && onUpdatePerson(personId, {
      entities: target.entities.filter(le => le.id !== e.id),
    });
  };

  const tabs = [
    { id: "details", label: t.common.details },
    { id: "people", label: t.common.relatedPersonas + " (" + linkedPeople.length + ")" },
    { id: "comments", label: t.common.comments + " (" + (data.comments[e.id] || []).length + ")" },
    { id: "map", label: t.common.map },
  ];

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => go({ name: "entities" })}>
          ← {t.common.back}
        </button>
      </div>

      <div className="profile-head">
        <div className="ent-icon xl"><Icon name="building" className="i-lg" /></div>
        <div className="meta">
          <h1 className="name">{e.name}</h1>
          <div className="sub">
            <span className="role-pill">{t.types[e.type]}</span>
            <span><span className={"status-dot " + ((e.status || "activo") === "inactivo" ? "off" : "")} />{t.common[(e.status || "activo") === "inactivo" ? "inactivos" : "activos"]}</span>
            <span><Icon name="pin" /> {e.city}, {e.country}</span>
            <span><Icon name="users" /> {linkedPeople.length} {t.common.relatedPersonas.toLowerCase()}</span>
            {e.size && <span>{e.size.toLocaleString()} {t.common.members}</span>}
            {e.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
          </div>
          <div className="vid" style={{ marginTop: 6 }}>EID {e.id.toUpperCase()}-{Math.abs(e.id.charCodeAt(1) * 8819) % 999999}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => window.location.href = "mailto:" + e.email}><Icon name="mail" /> Email</button>
          {e.website && <button className="btn" onClick={() => window.open("https://" + e.website, "_blank")}><Icon name="globe" /> Web</button>}
          <button className="btn btn-primary" onClick={() => go({ name: "new-person", prefill: { entityId: e.id } })}>
            <Icon name="plus" /> {lang === "es" ? "Agregar persona" : "Add person"}
          </button>
          <button className="btn" onClick={() => onEditEntity && onEditEntity(e.id)}>
            <Icon name="edit" /> {t.common.edit}
          </button>
          <button className="btn"
            style={(e.status || "activo") !== "inactivo" ? { color: "var(--bad)", borderColor: "var(--bad)" } : { color: "var(--good)", borderColor: "var(--good)" }}
            onClick={() => onUpdateEntity && onUpdateEntity(e.id, { status: (e.status || "activo") === "inactivo" ? "activo" : "inactivo" })}>
            <Icon name={(e.status || "activo") === "inactivo" ? "check" : "x"} />
            {(e.status || "activo") === "inactivo" ? (lang === "es" ? "Reactivar" : "Reactivate") : (lang === "es" ? "Inactivar" : "Deactivate")}
          </button>
          <button className="btn" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
            onClick={() => onDeleteEntity && onDeleteEntity(e.id)}>
            <Icon name="trash" /> {lang === "es" ? "Eliminar" : "Delete"}
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "details" && (
        <div className="profile-grid">
          <div>
            <div className="section">
              <h3>{t.common.contact}</h3>
              <div className="section-body">
                <dl className="kv">
                  <dt>Email</dt><dd>{e.email || <span className="muted">—</span>}</dd>
                  <dt>{lang === "es" ? "Teléfono" : "Phone"}</dt><dd>{e.phone || <span className="muted">—</span>}</dd>
                  <dt>{t.common.web}</dt><dd>{e.website ? <a href={"https://" + e.website} target="_blank" rel="noopener">{e.website}</a> : <span className="muted">—</span>}</dd>
                  <dt>{t.common.social}</dt><dd><SocialRow social={e.social || {}} /></dd>
                </dl>
              </div>
            </div>
            <div className="section">
              <h3>{t.common.address}</h3>
              <div className="section-body">
                <dl className="kv">
                  <dt>{lang === "es" ? "Calle" : "Street"}</dt><dd>{e.address}</dd>
                  <dt>ZIP</dt><dd className="mono">{e.zip}</dd>
                  <dt>{lang === "es" ? "Ciudad" : "City"}</dt><dd>{e.city}</dd>
                  <dt>{lang === "es" ? "Estado" : "State"}</dt><dd>{e.state}</dd>
                  <dt>{lang === "es" ? "País" : "Country"}</dt><dd>{e.country}</dd>
                </dl>
              </div>
            </div>
            <div className="section">
              <h3>{lang === "es" ? "Información general" : "General info"}</h3>
              <div className="section-body">
                <dl className="kv">
                  <dt>{t.common.type}</dt><dd>{t.types[e.type]}</dd>
                  <dt>{t.common.size}</dt><dd>{e.size ? e.size.toLocaleString() + " " + t.common.members : <span className="muted">—</span>}</dd>
                  <dt>{t.common.founded}</dt><dd>{e.founded || <span className="muted">—</span>}</dd>
                  <dt>{t.common.parent}</dt><dd>{parent ? <a href="#" onClick={ev => { ev.preventDefault(); go({ name: "entity", id: parent.id }); }}>{parent.name}</a> : <span className="muted">—</span>}</dd>
                  <dt>{t.common.tags}</dt><dd>{e.tags && e.tags.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {e.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
                    </div>
                  ) : <span className="muted">—</span>}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div>
            <div className="section">
              <h3>{t.common.relatedPersonas} <span className="muted mono" style={{ fontSize: 11 }}>{linkedPeople.length}</span></h3>
              <div className="section-body" style={{ paddingTop: 4 }}>
                {linkedPeople.length === 0 && <div className="muted" style={{ fontSize: 13 }}>{t.common.none}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {linkedPeople.slice(0, 8).map(({ p, link }) => (
                    <div key={p.id} className="link-row" onClick={() => go({ name: "person", id: p.id })} style={{ cursor: "pointer" }}>
                      <div className="av-circle" style={{ background: p.color }}>{initials(fullName(p))}</div>
                      <div className="grow">
                        <div className="title">{fullName(p)}</div>
                        <div className="row-sub">{p.email}</div>
                      </div>
                      <span className="role-pill">{link.role === "otro" ? (link.roleOther || t.roles.otro) : t.roles[link.role]}</span>
                    </div>
                  ))}
                  {linkedPeople.length > 8 && (
                    <button className="btn btn-sm btn-ghost" onClick={() => setTab("people")}>
                      {lang === "es" ? "Ver todas" : "See all"} ({linkedPeople.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {(parent || children.length > 0) && (
              <div className="section">
                <h3>{lang === "es" ? "Jerarquía" : "Hierarchy"}</h3>
                <div className="section-body">
                  <div className="tree">
                    {parent && (
                      <div className="tree-node" style={{ cursor: "pointer" }} onClick={() => go({ name: "entity", id: parent.id })}>
                        <Icon name="building" /> {parent.name}
                      </div>
                    )}
                    <div className={parent ? "tree-children" : ""}>
                      <div className="tree-node cur"><Icon name="building" /> {e.name}</div>
                      {children.length > 0 && (
                        <div className="tree-children">
                          {children.map(c => (
                            <div key={c.id} className="tree-node" style={{ cursor: "pointer" }} onClick={() => go({ name: "entity", id: c.id })}>
                              <Icon name="building" /> {c.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="section">
              <h3>{t.common.map}</h3>
              <div className="mini-map" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderBottom: 0, height: 220 }}>
                <MiniMap entities={[e]} personas={linkedPeople.map(x => x.p)} focus={e.lat ? { lat: e.lat, lng: e.lng } : null} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "people" && (
        <div className="section">
          <h3>
            <span>{t.common.relatedPersonas} <span className="muted mono" style={{ fontSize: 11, marginLeft: 6 }}>{linkedPeople.length}</span></span>
            <div style={{ display: "flex", gap: 6 }}>
              {availablePersons.length > 0 && !linking && (
                <button className="btn btn-sm" onClick={() => { setLinking(true); setLinkPersonId(availablePersons[0]?.id || ""); }}>
                  <Icon name="plus" /> {lang === "es" ? "Vincular existente" : "Link existing"}
                </button>
              )}
              <button className="btn btn-sm btn-primary" onClick={() => go({ name: "new-person", prefill: { entityId: e.id } })}>
                <Icon name="plus" /> {lang === "es" ? "Nueva persona aquí" : "New person here"}
              </button>
            </div>
          </h3>
          {linking && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "12px 16px", background: "var(--bg-soft)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
              <div className="field" style={{ margin: 0, flex: "1 1 200px" }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Persona" : "Person"}</label>
                <select value={linkPersonId} onChange={e2 => setLinkPersonId(e2.target.value)}>
                  {availablePersons.map(p => <option key={p.id} value={p.id}>{fullName(p)}</option>)}
                </select>
              </div>
              <div className="field" style={{ margin: 0, flex: "1 1 140px" }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Cargo" : "Role"}</label>
                <select value={linkRole} onChange={e2 => setLinkRole(e2.target.value)}>
                  {Object.keys(t.roles).map(k => <option key={k} value={k}>{t.roles[k]}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, paddingBottom: 1 }}>
                <button className="btn btn-sm btn-primary" onClick={doLinkPerson}><Icon name="check" /> {lang === "es" ? "Vincular" : "Link"}</button>
                <button className="btn btn-sm" onClick={() => setLinking(false)}>{lang === "es" ? "Cancelar" : "Cancel"}</button>
              </div>
            </div>
          )}
          <div className="section-body">
            {linkedPeople.length === 0 && !linking && <div className="empty">{t.common.none}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {linkedPeople.map(({ p, link }) => (
                <div key={p.id} className="link-row">
                  <div className="av-circle" style={{ background: p.color, cursor: "pointer" }} onClick={() => go({ name: "person", id: p.id })}>{initials(fullName(p))}</div>
                  <div className="grow" style={{ cursor: "pointer" }} onClick={() => go({ name: "person", id: p.id })}>
                    <div className="title">{fullName(p)}</div>
                    <div className="row-sub">{p.email} · {p.city}</div>
                  </div>
                  <span className="role-pill">{link.role === "otro" ? (link.roleOther || t.roles.otro) : t.roles[link.role]}</span>
                  <button className="btn btn-sm btn-ghost" style={{ color: "var(--bad)" }} onClick={() => doUnlinkPerson(p.id)}>
                    <Icon name="x" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "comments" && (
        <div className="section">
          <h3>{t.common.comments}</h3>
          <div className="section-body">
            <Comments items={data.comments[e.id] || []} t={t} lang={lang} onAdd={(text) => addComment(e.id, text)} />
          </div>
        </div>
      )}

      {tab === "map" && (
        <div className="section">
          <h3>{t.common.map}</h3>
          <div style={{ height: 480 }}>
            <MiniMap entities={[e]} personas={linkedPeople.map(x => x.p)} focus={e.lat ? { lat: e.lat, lng: e.lng } : null} go={go} />
          </div>
        </div>
      )}
    </div>
  );
};

window.PersonProfile = PersonProfile;
window.EntityProfile = EntityProfile;
