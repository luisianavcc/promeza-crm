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
          <button className="btn btn-sm">{t.common.cancel}</button>
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

// ---------------------------- PERSON PROFILE ----------------------------

const PersonProfile = ({ id, t, lang, data, go, addComment }) => {
  const p = data.personas.find(x => x.id === id);
  const [tab, setTab] = React.useState("details");
  if (!p) return <div className="empty">Not found</div>;

  const linkedEntities = p.entities.map(le => ({
    link: le, entity: data.entities.find(e => e.id === le.id),
  })).filter(x => x.entity);

  const tabs = [
    { id: "details", label: t.common.details },
    { id: "links", label: `${t.common.relatedEntities} (${linkedEntities.length})` },
    { id: "comments", label: `${t.common.comments} (${(data.comments[p.id] || []).length})` },
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
          <h1 className="name">{fullName(p)} <Icon name="star" className="i-lg" /></h1>
          <div className="sub">
            <span className="role-pill">{p.role === "otro" ? (p.roleOther || t.roles.otro) : t.roles[p.role]}</span>
            <span><span className={"status-dot " + (p.status === "inactivo" ? "off" : "")} />{t.common[p.status === "inactivo" ? "inactivos" : "activos"]}</span>
            <span><Icon name="pin" /> {p.city}, {p.country}</span>
            {p.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
          </div>
          <div className="vid" style={{ marginTop: 6 }}>VID {p.id.toUpperCase()}-{Math.abs(p.id.charCodeAt(1) * 7919) % 999999}</div>
        </div>
        <div className="actions">
          <button className="btn"><Icon name="mail" /> Email</button>
          <button className="btn"><Icon name="phone" /></button>
          <button className="btn"><Icon name="edit" /> {t.common.edit}</button>
          <button className="btn"><Icon name="more" /></button>
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
                  <dt>Email</dt><dd>{p.email}</dd>
                  <dt>{lang === "es" ? "Teléfono" : "Phone"}</dt><dd>{p.phone}</dd>
                  <dt>{t.common.web}</dt><dd>{p.website ? <a href={"https://" + p.website} target="_blank">{p.website}</a> : <span className="muted">—</span>}</dd>
                  <dt>{t.common.social}</dt><dd><SocialRow social={p.social} /></dd>
                </dl>
              </div>
            </div>

            <div className="section">
              <h3>{t.common.address}</h3>
              <div className="section-body">
                <dl className="kv">
                  <dt>{lang === "es" ? "Calle" : "Street"}</dt><dd>{p.address}</dd>
                  <dt>ZIP</dt><dd className="mono">{p.zip}</dd>
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
                  <dt>{t.common.tags}</dt><dd>{p.tags.length === 0 ? <span className="muted">—</span> : <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{p.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}</div>}</dd>
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
                <MiniMap personas={[p]} entities={linkedEntities.map(x => x.entity)} focus={{ lat: p.lat, lng: p.lng }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "links" && (
        <div className="section">
          <h3>{t.common.relatedEntities}
            <button className="btn btn-sm"><Icon name="plus" /> {t.common.linkEntity}</button>
          </h3>
          <div className="section-body">
            {linkedEntities.length === 0 && <div className="empty">{t.common.none}</div>}
            {linkedEntities.map(({ link, entity }) => (
              <div key={link.id} className="link-row" style={{ cursor: "pointer" }} onClick={() => go({ name: "entity", id: entity.id })}>
                <div className="ent-icon"><Icon name="building" /></div>
                <div className="grow">
                  <div className="title">{entity.name}</div>
                  <div className="row-sub">{t.types[entity.type]} · {entity.city}, {entity.country}</div>
                </div>
                <span className="role-pill">{link.role === "otro" ? (link.roleOther || t.roles.otro) : t.roles[link.role]}</span>
                <button className="btn btn-sm btn-ghost"><Icon name="x" /></button>
              </div>
            ))}
          </div>
        </div>
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
            <MiniMap personas={[p]} entities={linkedEntities.map(x => x.entity)} focus={{ lat: p.lat, lng: p.lng }} go={go} />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------- ENTITY PROFILE ----------------------------

const EntityProfile = ({ id, t, lang, data, go, addComment }) => {
  const e = data.entities.find(x => x.id === id);
  const [tab, setTab] = React.useState("details");
  if (!e) return <div className="empty">Not found</div>;

  const linkedPeople = data.personas
    .map(p => ({ p, link: p.entities.find(le => le.id === e.id) }))
    .filter(x => x.link);

  const children = data.entities.filter(c => c.parent === e.id);
  const parent = e.parent ? data.entities.find(x => x.id === e.parent) : null;

  const tabs = [
    { id: "details", label: t.common.details },
    { id: "people", label: `${t.common.relatedPersonas} (${linkedPeople.length})` },
    { id: "comments", label: `${t.common.comments} (${(data.comments[e.id] || []).length})` },
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
          <h1 className="name">{e.name} <Icon name="star" className="i-lg" /></h1>
          <div className="sub">
            <span className="role-pill">{t.types[e.type]}</span>
            <span><Icon name="pin" /> {e.city}, {e.country}</span>
            <span><Icon name="users" /> {linkedPeople.length} {t.common.relatedPersonas.toLowerCase()}</span>
            {e.size && <span>{e.size.toLocaleString()} {t.common.members}</span>}
            {e.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
          </div>
          <div className="vid" style={{ marginTop: 6 }}>EID {e.id.toUpperCase()}-{Math.abs(e.id.charCodeAt(1) * 8819) % 999999}</div>
        </div>
        <div className="actions">
          <button className="btn"><Icon name="mail" /> Email</button>
          <button className="btn"><Icon name="globe" /> {t.common.web}</button>
          <button className="btn"><Icon name="edit" /> {t.common.edit}</button>
          <button className="btn"><Icon name="more" /></button>
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
                  <dt>Email</dt><dd>{e.email}</dd>
                  <dt>{lang === "es" ? "Teléfono" : "Phone"}</dt><dd>{e.phone}</dd>
                  <dt>{t.common.web}</dt><dd>{e.website ? <a href={"https://" + e.website} target="_blank">{e.website}</a> : <span className="muted">—</span>}</dd>
                  <dt>{t.common.social}</dt><dd><SocialRow social={e.social} /></dd>
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
                  <dt>{t.common.size}</dt><dd>{e.size?.toLocaleString()} {t.common.members}</dd>
                  <dt>{t.common.founded}</dt><dd>{e.founded}</dd>
                  <dt>{t.common.parent}</dt><dd>{parent ? <a onClick={(ev) => { ev.preventDefault(); go({ name: "entity", id: parent.id }); }} href="#">{parent.name}</a> : <span className="muted">—</span>}</dd>
                  <dt>{t.common.tags}</dt><dd>{e.tags.length === 0 ? <span className="muted">—</span> : <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{e.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}</div>}</dd>
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
                <MiniMap entities={[e]} personas={linkedPeople.map(x => x.p)} focus={{ lat: e.lat, lng: e.lng }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "people" && (
        <div className="section">
          <h3>
            <span>{t.common.relatedPersonas} <span className="muted mono" style={{ fontSize: 11, marginLeft: 6 }}>{linkedPeople.length}</span></span>
            <button className="btn btn-sm"><Icon name="plus" /> {t.common.linkPerson}</button>
          </h3>
          <div className="section-body">
            {linkedPeople.length === 0 && <div className="empty">{t.common.none}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {linkedPeople.map(({ p, link }) => (
                <div key={p.id} className="link-row" style={{ cursor: "pointer" }} onClick={() => go({ name: "person", id: p.id })}>
                  <div className="av-circle" style={{ background: p.color }}>{initials(fullName(p))}</div>
                  <div className="grow">
                    <div className="title">{fullName(p)}</div>
                    <div className="row-sub">{p.email} · {p.city}</div>
                  </div>
                  <span className="role-pill">{link.role === "otro" ? (link.roleOther || t.roles.otro) : t.roles[link.role]}</span>
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
            <MiniMap entities={[e]} personas={linkedPeople.map(x => x.p)} focus={{ lat: e.lat, lng: e.lng }} go={go} />
          </div>
        </div>
      )}
    </div>
  );
};

window.PersonProfile = PersonProfile;
window.EntityProfile = EntityProfile;
