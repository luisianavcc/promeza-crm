// PROMEZA CRM — Profile pages (Person + Entity)

// ─── Smart alerts ───
const getPersonAlerts = (p, lang) => {
  const today = new Date().toISOString().slice(0, 10);
  const es = lang === "es";
  const out = [];

  if (p.emailStatus === "bad")
    out.push({ level: "error", key: "ebad", icon: "alert", msg: es ? "Email no funciona o rebota" : "Email bouncing or invalid" });
  if (p.phoneStatus === "bad")
    out.push({ level: "error", key: "pbad", icon: "alert", msg: es ? "Teléfono fuera de servicio" : "Phone not reachable" });
  if (!p.email)
    out.push({ level: "warn", key: "noemail", icon: "mail", msg: es ? "Sin dirección de email" : "No email address" });
  if (!p.phone)
    out.push({ level: "warn", key: "nophone", icon: "phone", msg: es ? "Sin número de teléfono" : "No phone number" });
  if (p.nextAction && p.nextAction < today && p.status !== "inactivo") {
    const d = Math.round((new Date(today) - new Date(p.nextAction)) / 86400000);
    out.push({ level: "error", key: "overdue", icon: "calendar", msg: es ? `Acción vencida hace ${d} día${d !== 1 ? "s" : ""}` : `Action overdue by ${d} day${d !== 1 ? "s" : ""}` });
  }
  if (!p.nextAction && p.status !== "inactivo" && p.stage !== "inactivo")
    out.push({ level: "info", key: "noact", icon: "calendar", msg: es ? "Sin próxima acción programada" : "No next action set" });
  if (p.lastContact && p.status !== "inactivo") {
    const d = Math.round((new Date(today) - new Date(p.lastContact)) / 86400000);
    if (d > 180) out.push({ level: "warn", key: "stale", icon: "clock", msg: es ? `Sin contacto en ${d} días` : `No contact in ${d} days` });
  } else if (!p.lastContact && p.status !== "inactivo") {
    out.push({ level: "info", key: "nolast", icon: "clock", msg: es ? "Sin registro de contacto previo" : "No contact history" });
  }
  if (p.birthday) {
    const bday = new Date(p.birthday);
    const yr = new Date(today).getFullYear();
    let bdThis = new Date(yr, bday.getMonth(), bday.getDate()).toISOString().slice(0, 10);
    if (bdThis < today) bdThis = new Date(yr + 1, bday.getMonth(), bday.getDate()).toISOString().slice(0, 10);
    const d = Math.round((new Date(bdThis) - new Date(today)) / 86400000);
    if (d <= 14) out.push({ level: "good", key: "bday", icon: "star", msg: es ? (d === 0 ? "🎂 ¡Cumpleaños hoy!" : `Cumpleaños en ${d} días`) : (d === 0 ? "🎂 Birthday today!" : `Birthday in ${d} days`) });
  }
  if (!p.city && !p.country)
    out.push({ level: "info", key: "noloc", icon: "pin", msg: es ? "Sin ubicación registrada" : "No location recorded" });
  return out;
};

const getCompleteness = (p) => {
  const checks = [!!p.email, !!p.phone, !!p.address, !!p.city, !!p.country, !!p.birthday, !!p.lastContact, (p.entities || []).length > 0, (p.tags || []).length > 0];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
};

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

const ChangelogTab = ({ changelog, lang }) => {
  const entries = changelog || [];
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(lang === "en" ? "en-US" : "es-ES", { dateStyle: "medium", timeStyle: "short" }); }
    catch { return iso; }
  };
  return (
    <div className="section">
      <h3>
        {lang === "es" ? "Historial de cambios" : "Change history"}
        <span className="muted mono" style={{ fontSize: 11, marginLeft: 8 }}>{entries.length}</span>
      </h3>
      <div className="section-body">
        {entries.length === 0 && <div className="empty">{lang === "es" ? "Sin cambios registrados" : "No changes recorded"}</div>}
        <div className="timeline">
          {entries.map((entry, i) => (
            <div key={entry.id || i} className="comment">
              <div className="av-circle" style={{ background: "#0f1530" }}>{initials(entry.author)}</div>
              <div className="body">
                <div className="head">
                  <span className="who">{entry.author}</span>
                  <span className="when">{fmtDate(entry.date)}</span>
                </div>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                  {entry.changes.map((ch, j) => (
                    <div key={j} style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
                      {ch.type === "created" ? (
                        <span style={{ fontWeight: 600, color: "var(--good)" }}>✓ {lang === "es" ? "Registro creado" : "Record created"}</span>
                      ) : ch.type === "merge" ? (
                        <span style={{ fontWeight: 600, color: "#7c3aed" }}>⟵ {lang === "es" ? "Fusionado con" : "Merged with"}: {ch.with}</span>
                      ) : ch.type === "tags" || ch.type === "entities" ? (
                        <span><span style={{ fontWeight: 600 }}>{ch.field}</span><span style={{ color: "var(--accent)", marginLeft: 6 }}>{lang === "es" ? "actualizado" : "updated"}</span></span>
                      ) : (
                        <span>
                          <span style={{ fontWeight: 600 }}>{ch.field}:</span>
                          <span style={{ color: "var(--ink-4)", margin: "0 5px" }}>{ch.old || "—"}</span>
                          <span style={{ color: "var(--ink-4)" }}>→</span>
                          <span style={{ color: "var(--good)", marginLeft: 5 }}>{ch.new || "—"}</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PersonProfile = ({ id, t, lang, data, go, addComment, onUpdatePerson, onEditPerson, onDeletePerson,
  interactions, onAddInteraction, onDeleteInteraction,
  tasks, onAddTask, onToggleTask, onDeleteTask, changelog, users, currentUser,
  attachments, onAddAttachment, onDeleteAttachment }) => {
  const p = data.personas.find(x => x.id === id);
  const [tab, setTab] = React.useState("details");
  const [linking, setLinking] = React.useState(false);
  const [linkEntityId, setLinkEntityId] = React.useState("");
  const [linkRole, setLinkRole] = React.useState("miembro");
  const [entitySearch, setEntitySearch] = React.useState("");
  const [showEntityDrop, setShowEntityDrop] = React.useState(false);
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
    { id: "files", label: (lang === "es" ? "Archivos" : "Files") + ((attachments || []).length > 0 ? " (" + (attachments || []).length + ")" : "") },
    { id: "history", label: lang === "es" ? "Cambios" : "Changes" },
    { id: "map", label: t.common.map },
  ];

  const personAlerts = getPersonAlerts(p, lang);
  const completeness = getCompleteness(p);
  const today = new Date().toISOString().slice(0, 10);
  const daysSinceContact = p.lastContact ? Math.round((new Date(today) - new Date(p.lastContact)) / 86400000) : null;

  const cycleEmailStatus = () => {
    const cycle = { "": "ok", "ok": "bad", "bad": "" };
    onUpdatePerson && onUpdatePerson(p.id, { emailStatus: cycle[p.emailStatus || ""] });
  };
  const cyclePhoneStatus = () => {
    const cycle = { "": "ok", "ok": "bad", "bad": "" };
    onUpdatePerson && onUpdatePerson(p.id, { phoneStatus: cycle[p.phoneStatus || ""] });
  };

  const alertColors = {
    error: { bg: "#fff5f5", border: "#fecaca", text: "#dc2626" },
    warn:  { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
    info:  { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" },
    good:  { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
  };

  return (
    <div style={{ animation: "fadeIn .2s ease-out" }}>
      <div style={{ marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => go({ name: "personas" })}>
          ← {t.common.back}
        </button>
      </div>

      <div className="profile-head">
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div className="av-circle xl" style={{ background: p.color }}>{initials(fullName(p))}</div>
          {completeness < 100 && (
            <div title={`Perfil ${completeness}% completo`} style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: completeness >= 80 ? "var(--good)" : completeness >= 50 ? "var(--warn)" : "var(--bad)", border: "2px solid var(--bg)", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 800, color: "#fff", cursor: "default" }}>
              {completeness < 50 ? "!" : ""}
            </div>
          )}
        </div>
        <div className="meta">
          <h1 className="name">{fullName(p)}</h1>
          <div className="sub">
            <span className="role-pill">{p.role === "otro" ? (p.roleOther || t.roles.otro) : t.roles[p.role]}</span>
            {(() => {
              const stageId = p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");
              const st = (window.PIPELINE_STAGES || []).find(s => s.id === stageId);
              return st ? <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11.5, fontWeight: 700, letterSpacing: ".01em", background: st.bg, color: st.color, border: "1px solid " + st.color + "40" }}>{st.label}</span> : null;
            })()}
            {p.city && <span><Icon name="pin" /> {p.city}{p.country ? ", " + p.country : ""}</span>}
            {daysSinceContact !== null && (
              <span style={{ fontSize: 12, color: daysSinceContact > 180 ? "var(--bad)" : daysSinceContact > 90 ? "var(--warn)" : "var(--ink-3)" }}>
                <Icon name="calendar" size={12} /> {daysSinceContact === 0 ? (lang === "es" ? "contactado hoy" : "contacted today") : lang === "es" ? `${daysSinceContact}d sin contacto` : `${daysSinceContact}d no contact`}
              </span>
            )}
            {p.tags && p.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div className="vid">VID {p.id.toUpperCase()}-{Math.abs(p.id.charCodeAt(1) * 7919) % 999999}</div>
            {completeness < 100 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 60, height: 4, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: completeness + "%", height: "100%", background: completeness >= 80 ? "var(--good)" : completeness >= 50 ? "var(--warn)" : "var(--bad)", borderRadius: 4, transition: "width .3s" }} />
                </div>
                <span style={{ fontSize: 10.5, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>{completeness}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="actions">
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button className="btn"
              style={p.emailStatus === "bad" ? { color: "var(--bad)", borderColor: "#fecaca", background: "#fff5f5" } : p.emailStatus === "ok" ? { color: "var(--good)", borderColor: "#bbf7d0", background: "#f0fdf4" } : {}}
              onClick={() => p.email && (window.location.href = "mailto:" + p.email)}>
              <Icon name="mail" />
              {p.emailStatus === "bad" ? (lang === "es" ? "No funciona" : "Not working") : "Email"}
              {p.emailStatus === "ok" && <span style={{ fontSize: 11, fontWeight: 700 }}>✓</span>}
            </button>
            <button onClick={cycleEmailStatus} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 10.5, padding: "0 2px", fontFamily: "inherit", textAlign: "left", color: p.emailStatus === "ok" ? "var(--good)" : p.emailStatus === "bad" ? "var(--bad)" : "var(--ink-4)" }}>
              {p.emailStatus === "ok" ? "✓ Verificado" : p.emailStatus === "bad" ? "⚠ Marcar OK" : "· Marcar como verificado"}
            </button>
          </div>
          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="btn"
                style={p.phoneStatus === "bad" ? { color: "var(--bad)", borderColor: "#fecaca", background: "#fff5f5" } : p.phoneStatus === "ok" ? { color: "var(--good)", borderColor: "#bbf7d0", background: "#f0fdf4" } : {}}
                onClick={() => p.phone && (window.location.href = "tel:" + p.phone)}>
                <Icon name="phone" />
                {p.phoneStatus === "bad" ? (lang === "es" ? "No funciona" : "Not working") : (lang === "es" ? "Llamar" : "Call")}
                {p.phoneStatus === "ok" && <span style={{ fontSize: 11, fontWeight: 700 }}>✓</span>}
              </button>
              {p.phone && (
                <button className="btn" title="WhatsApp"
                  style={{ padding: "0 10px", color: "#25D366", borderColor: "#25D36640", background: "#f0fdf4" }}
                  onClick={() => window.open("https://wa.me/" + p.phone.replace(/\D/g, ""), "_blank")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </button>
              )}
            </div>
            <button onClick={cyclePhoneStatus} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 10.5, padding: "0 2px", fontFamily: "inherit", textAlign: "left", color: p.phoneStatus === "ok" ? "var(--good)" : p.phoneStatus === "bad" ? "var(--bad)" : "var(--ink-4)" }}>
              {p.phoneStatus === "ok" ? "✓ Verificado" : p.phoneStatus === "bad" ? "⚠ Marcar OK" : "· Marcar como verificado"}
            </button>
          </div>
          <button className="btn" style={{ color: "var(--good)", borderColor: "var(--good)" }}
            onClick={() => onUpdatePerson && onUpdatePerson(p.id, { lastContact: new Date().toISOString().slice(0, 10) })}>
            <Icon name="check" /> {lang === "es" ? "Contactado hoy" : "Contacted today"}
          </button>
          <button className="btn" onClick={() => onEditPerson && onEditPerson(p.id)}>
            <Icon name="edit" /> {t.common.edit}
          </button>
          <button className="btn"
            style={p.status !== "inactivo" ? { color: "var(--bad)", borderColor: "var(--bad)" } : { color: "var(--good)", borderColor: "var(--good)" }}
            onClick={() => {
              const goInactive = p.status !== "inactivo";
              onUpdatePerson && onUpdatePerson(p.id, {
                status: goInactive ? "inactivo" : "activo",
                stage: goInactive ? "inactivo" : "conocido",
              });
            }}>
            <Icon name={p.status === "inactivo" ? "check" : "x"} />
            {p.status === "inactivo" ? (lang === "es" ? "Reactivar" : "Reactivate") : (lang === "es" ? "Inactivar" : "Deactivate")}
          </button>
          <button className="btn" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
            onClick={() => onDeletePerson && onDeletePerson(p.id)}>
            <Icon name="trash" /> {lang === "es" ? "Eliminar" : "Delete"}
          </button>
        </div>
      </div>

      {/* Smart alerts strip */}
      {personAlerts.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {personAlerts.map(al => {
            const c = alertColors[al.level];
            return (
              <div key={al.key} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: c.bg, border: "1px solid " + c.border, color: c.text }}>
                <Icon name={al.icon} size={12} />
                {al.msg}
              </div>
            );
          })}
        </div>
      )}

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

            {(p.extraAddresses || []).length > 0 && (
              <div className="section">
                <h3>{lang === "es" ? "Direcciones adicionales" : "Additional addresses"} <span className="muted mono" style={{ fontSize: 11 }}>{p.extraAddresses.length}</span></h3>
                <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {p.extraAddresses.map((addr, i) => (
                    <div key={addr.id || i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ paddingTop: 2, color: "var(--accent)" }}><Icon name="pin" size={14} /></div>
                      <div>
                        {addr.label && <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 2, color: "var(--ink-2)" }}>{addr.label}</div>}
                        <div style={{ fontSize: 13, color: "var(--ink)" }}>{addr.address}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                          {[addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="section">
              <h3>{lang === "es" ? "Datos adicionales" : "Additional data"}</h3>
              <div className="section-body">
                <dl className="kv">
                  <dt>{t.common.birthday}</dt><dd>{fmtDate(p.birthday, lang)}</dd>
                  <dt>{t.common.lastContact}</dt><dd>{fmtDate(p.lastContact, lang)}</dd>
                  <dt>{lang === "es" ? "Próxima acción" : "Next action"}</dt>
                  <dd>{p.nextAction ? (
                    <span style={{ fontWeight: 600, color: p.nextAction < new Date().toISOString().slice(0,10) ? "var(--bad)" : "var(--accent)" }}>
                      {fmtDate(p.nextAction, lang)}
                    </span>
                  ) : <span className="muted">—</span>}</dd>
                  <dt>{lang === "es" ? "Fuente" : "Source"}</dt>
                  <dd>{p.source ? ((window.CONTACT_SOURCES || []).find(s => s.id === p.source)?.label || p.source) : <span className="muted">—</span>}</dd>
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
              <div className="field" style={{ margin: 0, flex: "1 1 240px", position: "relative" }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Buscar entidad" : "Search entity"}</label>
                <input
                  value={entitySearch}
                  onChange={e => { setEntitySearch(e.target.value); setShowEntityDrop(true); setLinkEntityId(""); }}
                  onFocus={() => setShowEntityDrop(true)}
                  placeholder={lang === "es" ? "Nombre de la entidad…" : "Entity name…"}
                  style={{ width: "100%" }}
                />
                {showEntityDrop && (
                  <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,.12)", zIndex: 200, maxHeight: 260, overflowY: "auto" }}>
                    {availableEntities
                      .filter(e => !entitySearch.trim() || e.name.toLowerCase().includes(entitySearch.toLowerCase()) || (e.city || "").toLowerCase().includes(entitySearch.toLowerCase()))
                      .slice(0, 10)
                      .map(e => (
                        <div key={e.id}
                          onClick={() => { setLinkEntityId(e.id); setEntitySearch(e.name); setShowEntityDrop(false); }}
                          style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--line)", transition: "background .1s" }}
                          onMouseEnter={ev => ev.currentTarget.style.background = "var(--bg-soft)"}
                          onMouseLeave={ev => ev.currentTarget.style.background = ""}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)", display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                            {e.city && <span><Icon name="pin" size={10} /> {e.city}{e.state ? ", " + e.state : ""}</span>}
                            {e.phone && <span><Icon name="phone" size={10} /> {e.phone}</span>}
                            {e.type && <span style={{ color: "var(--accent)", fontWeight: 600 }}>{t.types[e.type] || e.type}</span>}
                          </div>
                        </div>
                      ))
                    }
                    {availableEntities.filter(e => !entitySearch.trim() || e.name.toLowerCase().includes(entitySearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: "12px 14px", color: "var(--ink-4)", fontSize: 13 }}>
                        {lang === "es" ? "Sin resultados" : "No results"}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="field" style={{ margin: 0, flex: "1 1 140px" }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Cargo" : "Role"}</label>
                <select value={linkRole} onChange={e => setLinkRole(e.target.value)}>
                  {Object.keys(t.roles).map(k => <option key={k} value={k}>{t.roles[k]}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, paddingBottom: 1 }}>
                <button className="btn btn-sm btn-primary" disabled={!linkEntityId} onClick={doLinkEntity}><Icon name="check" /> {lang === "es" ? "Vincular" : "Link"}</button>
                <button className="btn btn-sm" onClick={() => { setLinking(false); setEntitySearch(""); setLinkEntityId(""); }}>{lang === "es" ? "Cancelar" : "Cancel"}</button>
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
          users={users}
          currentUser={currentUser}
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

      {tab === "files" && (
        <AttachmentsTab
          targetId={p.id}
          attachments={attachments || []}
          onAdd={onAddAttachment}
          onDelete={onDeleteAttachment}
          lang={lang}
          currentUser={currentUser}
        />
      )}

      {tab === "history" && <ChangelogTab changelog={changelog} lang={lang} />}

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

const EntityProfile = ({ id, t, lang, data, go, addComment, onUpdateEntity, onUpdatePerson, onEditEntity, onDeleteEntity, changelog, attachments, onAddAttachment, onDeleteAttachment }) => {
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
    { id: "files", label: (lang === "es" ? "Archivos" : "Files") + ((attachments || []).length > 0 ? " (" + (attachments || []).length + ")" : "") },
    { id: "history", label: lang === "es" ? "Cambios" : "Changes" },
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

      {tab === "files" && (
        <AttachmentsTab
          targetId={e.id}
          attachments={attachments || []}
          onAdd={onAddAttachment}
          onDelete={onDeleteAttachment}
          lang={lang}
          currentUser={undefined}
        />
      )}

      {tab === "history" && <ChangelogTab changelog={changelog} lang={lang} />}

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
