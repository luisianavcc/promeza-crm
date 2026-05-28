// PROMEZA CRM — Projects

window.PROJECT_TYPES = [
  { id: "prensa",      label: "Rueda de prensa",   color: "#3b82f6", emoji: "🎙" },
  { id: "pelicula",    label: "Película / Serie",  color: "#8b5cf6", emoji: "🎬" },
  { id: "documental",  label: "Documental",        color: "#6366f1", emoji: "🎥" },
  { id: "concierto",   label: "Concierto / Show",  color: "#f59e0b", emoji: "🎵" },
  { id: "conferencia", label: "Conferencia",       color: "#0ea5e9", emoji: "🎤" },
  { id: "virtual",     label: "Evento virtual",    color: "#14b8a6", emoji: "💻" },
  { id: "lanzamiento", label: "Lanzamiento",       color: "#ef4444", emoji: "🚀" },
  { id: "tour",        label: "Tour / Gira",       color: "#f97316", emoji: "✈" },
  { id: "taller",      label: "Taller / Workshop", color: "#84cc16", emoji: "📚" },
  { id: "otro",        label: "Otro",              color: "#94a3b8", emoji: "📋" },
];

window.PROJECT_STATUSES = [
  { id: "planificado", label: "Planificado",  color: "#6366f1", bg: "#eef2ff" },
  { id: "activo",      label: "En curso",     color: "#059669", bg: "#f0fdf4" },
  { id: "completado",  label: "Completado",   color: "#0369a1", bg: "#f0f9ff" },
  { id: "cancelado",   label: "Cancelado",    color: "#94a3b8", bg: "#f8fafc" },
];

const PROJECT_ROLES = [
  "Artista principal", "Vocero", "Productor", "Director", "Actor / Actriz",
  "Presentador", "Invitado especial", "Colaborador", "Organizador", "Miembro del equipo", "Otro",
];

const getProjType = (id) => {
  const types = window.PROJECT_TYPES || [];
  return types.find(t => t.id === id) || types[types.length - 1] || { id: "otro", label: "Otro", color: "#94a3b8", emoji: "📋" };
};
const getProjStatus = (id) => {
  const statuses = window.PROJECT_STATUSES || [];
  return statuses.find(s => s.id === id) || statuses[0] || { id: "planificado", label: "Planificado", color: "#6366f1", bg: "#eef2ff" };
};

// ─── New / Edit Project Form ───
const NewProjectForm = ({ lang, data, onClose, onSave, initialData }) => {
  const isEdit = !!initialData;
  const [form, setForm] = React.useState({
    name: initialData?.name || "",
    type: initialData?.type || "prensa",
    dateStart: initialData?.dateStart || "",
    dateEnd: initialData?.dateEnd || "",
    status: initialData?.status || "planificado",
    location: initialData?.location || "",
    attendanceCount: initialData?.attendanceCount || "",
    description: initialData?.description || "",
    tags: (initialData?.tags || []).join(", "),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const es = lang === "es";

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(580px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? "Editar proyecto" : "Nuevo proyecto"}</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Nombre del proyecto *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="ej. Rueda de prensa enero 2026" autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Tipo</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}>
                {(window.PROJECT_TYPES || []).map(pt => <option key={pt.id} value={pt.id}>{pt.emoji} {pt.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Estado</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}>
                {(window.PROJECT_STATUSES || []).map(ps => <option key={ps.id} value={ps.id}>{ps.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Fecha inicio</label>
              <input type="date" value={form.dateStart} onChange={e => set("dateStart", e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Fecha fin</label>
              <input type="date" value={form.dateEnd} onChange={e => set("dateEnd", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Lugar / Plataforma</label>
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Teatro Nacional, Zoom, YouTube Live…" />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Asistentes totales</label>
              <input type="number" min="0" value={form.attendanceCount} onChange={e => set("attendanceCount", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Descripción / Notas</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Detalles, objetivos, contexto…" style={{ fontFamily: "inherit", fontSize: 13, resize: "vertical" }} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Etiquetas <span style={{ fontSize: 10.5, color: "var(--ink-4)", fontWeight: 400 }}>(separadas por coma)</span></label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="ministerio, internacional…" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!form.name.trim()} onClick={() => {
            onSave({ ...form, attendanceCount: form.attendanceCount ? parseInt(form.attendanceCount) : null, tags: form.tags.split(",").map(s => s.trim()).filter(Boolean) });
          }}>
            <Icon name="check" /> {isEdit ? "Guardar cambios" : "Crear proyecto"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Projects List ───
const ProjectsListView = ({ lang, data, go, onAddProject }) => {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [showForm, setShowForm] = React.useState(false);

  const projects = data.projects || [];
  const filtered = projects.filter(pr => {
    if (typeFilter !== "all" && pr.type !== typeFilter) return false;
    if (statusFilter !== "all" && pr.status !== statusFilter) return false;
    if (search.trim() && !pr.name.toLowerCase().includes(search.toLowerCase()) && !(pr.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countByType = {};
  (window.PROJECT_TYPES || []).forEach(pt => { countByType[pt.id] = projects.filter(pr => pr.type === pt.id).length; });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Proyectos</h1>
          <div className="page-sub">{projects.length} proyecto{projects.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }}><Icon name="search" size={14} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyecto…"
              style={{ paddingLeft: 32, width: 200, height: 36, fontSize: 13, borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", fontFamily: "inherit", color: "var(--ink)" }} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Icon name="plus" /> Nuevo proyecto</button>
        </div>
      </div>

      {/* Status pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[{ id: "all", label: "Todos", count: projects.length }].concat(
          (window.PROJECT_STATUSES || []).map(ps => ({ ...ps, count: projects.filter(pr => pr.status === ps.id).length }))
        ).map(ps => (
          <button key={ps.id} onClick={() => setStatusFilter(ps.id)} style={{ padding: "5px 13px", borderRadius: 999, border: "1.5px solid", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer", borderColor: statusFilter === ps.id ? (ps.color || "var(--accent)") : (ps.color ? ps.color + "40" : "var(--line)"), background: statusFilter === ps.id ? (ps.bg || "var(--accent-50)") : "var(--bg)", color: statusFilter === ps.id ? (ps.color || "var(--accent-700)") : "var(--ink-2)" }}>
            <span style={{ fontWeight: 800 }}>{ps.count}</span> {ps.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      {(window.PROJECT_TYPES || []).some(pt => countByType[pt.id] > 0) && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={() => setTypeFilter("all")} style={{ padding: "4px 11px", borderRadius: 6, border: "1px solid", borderColor: typeFilter === "all" ? "var(--accent)" : "var(--line)", background: typeFilter === "all" ? "var(--accent-50)" : "var(--bg)", color: typeFilter === "all" ? "var(--accent)" : "var(--ink-3)", fontFamily: "inherit", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            Todos los tipos
          </button>
          {(window.PROJECT_TYPES || []).filter(pt => countByType[pt.id] > 0).map(pt => (
            <button key={pt.id} onClick={() => setTypeFilter(typeFilter === pt.id ? "all" : pt.id)} style={{ padding: "4px 11px", borderRadius: 6, border: "1px solid", borderColor: typeFilter === pt.id ? pt.color : "var(--line)", background: typeFilter === pt.id ? pt.color + "18" : "var(--bg)", color: typeFilter === pt.id ? pt.color : "var(--ink-2)", fontFamily: "inherit", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
              {pt.emoji} {pt.label} · {countByType[pt.id]}
            </button>
          ))}
        </div>
      )}

      {/* Empty or cards */}
      {filtered.length === 0 ? (
        <div className="empty" style={{ padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
          <div>{projects.length === 0 ? "Aún no hay proyectos. ¡Crea el primero!" : "Sin resultados para esta búsqueda."}</div>
          {projects.length === 0 && <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}><Icon name="plus" /> Nuevo proyecto</button>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {filtered.map(pr => {
            const pt = getProjType(pr.type);
            const ps = getProjStatus(pr.status);
            const memberCount = (pr.members || []).length;
            return (
              <div key={pr.id} onClick={() => go({ name: "project", id: pr.id })}
                style={{ background: "var(--bg)", borderRadius: 12, border: "1px solid var(--line)", borderLeft: "4px solid " + pt.color, padding: "16px", cursor: "pointer", boxShadow: "var(--shadow-sm)", transition: "box-shadow .15s, transform .15s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = ""; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: pt.color }}>{pt.emoji} {pt.label}</span>
                  <span style={{ padding: "2px 9px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, background: ps.bg, color: ps.color }}>{ps.label}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>{pr.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", flexDirection: "column", gap: 3 }}>
                  {(pr.dateStart || pr.dateEnd) && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Icon name="calendar" size={11} />
                      {pr.dateStart ? fmtDate(pr.dateStart, lang) : ""}
                      {pr.dateStart && pr.dateEnd && pr.dateStart !== pr.dateEnd ? " — " + fmtDate(pr.dateEnd, lang) : ""}
                    </span>
                  )}
                  {pr.location && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={11} /> {pr.location}</span>}
                </div>
                {(pr.tags || []).length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {pr.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
                  </div>
                )}
                {/* Footer */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {(pr.members || []).slice(0, 5).map((m, i) => {
                      const person = data.personas.find(p => p.id === m.personaId);
                      return person ? (
                        <div key={m.personaId} style={{ width: 24, height: 24, borderRadius: "50%", background: person.color, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, color: "#fff", marginLeft: i > 0 ? -6 : 0, border: "2px solid var(--bg)", position: "relative", zIndex: 5 - i }}>
                          {initials(fullName(person))}
                        </div>
                      ) : null;
                    })}
                    {memberCount > 5 && <span style={{ fontSize: 10.5, color: "var(--ink-3)", marginLeft: 4 }}>+{memberCount - 5}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>
                    {pr.attendanceCount != null && <span><Icon name="users" size={11} /> {pr.attendanceCount}</span>}
                    <span><Icon name="users" size={11} /> {memberCount} registrados</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <NewProjectForm lang={lang} data={data} onClose={() => setShowForm(false)} onSave={form => { onAddProject(form); setShowForm(false); }} />}
    </div>
  );
};

// ─── Project Detail ───
const ProjectDetailView = ({ id, lang, data, go, onUpdateProject, onDeleteProject, onAddMember, onRemoveMember, comments, onAddComment, attachments, onAddAttachment, onDeleteAttachment }) => {
  const pr = (data.projects || []).find(p => p.id === id);
  const [tab, setTab] = React.useState("participantes");
  const [showEdit, setShowEdit] = React.useState(false);
  const [addingMember, setAddingMember] = React.useState(false);
  const [memberSearch, setMemberSearch] = React.useState("");
  const [memberPersonaId, setMemberPersonaId] = React.useState("");
  const [memberRole, setMemberRole] = React.useState(PROJECT_ROLES[0]);
  const [showMemberDrop, setShowMemberDrop] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const today = new Date().toISOString().slice(0, 10);

  if (!pr) return (
    <div className="empty">
      <div>Proyecto no encontrado</div>
      <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => go({ name: "projects" })}>← Volver</button>
    </div>
  );

  const pt = getProjType(pr.type);
  const ps = getProjStatus(pr.status);
  const members = (pr.members || []).map(m => ({ ...m, person: data.personas.find(p => p.id === m.personaId) })).filter(m => m.person);
  const availablePersonas = data.personas.filter(p => !(pr.members || []).some(m => m.personaId === p.id));
  const projectComments = comments || [];
  const projectAttachments = attachments || [];

  const filteredAvail = availablePersonas.filter(p =>
    !memberSearch.trim() ||
    (p.first + " " + p.last).toLowerCase().includes(memberSearch.toLowerCase()) ||
    (p.city || "").toLowerCase().includes(memberSearch.toLowerCase()) ||
    (p.role || "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  const doAddMember = () => {
    if (!memberPersonaId) return;
    onAddMember(pr.id, { personaId: memberPersonaId, role: memberRole, addedAt: today });
    setAddingMember(false); setMemberSearch(""); setMemberPersonaId(""); setMemberRole(PROJECT_ROLES[0]);
  };

  const doPostComment = () => {
    if (!commentText.trim()) return;
    onAddComment && onAddComment(pr.id, commentText.trim());
    setCommentText("");
  };

  const tabs = [
    { id: "participantes", label: "Participantes (" + members.length + ")" },
    { id: "archivos", label: "Archivos" + (projectAttachments.length > 0 ? " (" + projectAttachments.length + ")" : "") },
    { id: "comentarios", label: "Comentarios" + (projectComments.length > 0 ? " (" + projectComments.length + ")" : "") },
  ];

  return (
    <div style={{ animation: "fadeIn .2s ease-out" }}>
      <div style={{ marginBottom: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => go({ name: "projects" })}>← Proyectos</button>
      </div>

      {/* Project header */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 14, borderLeft: "5px solid " + pt.color, padding: "20px 22px", marginBottom: 18, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: pt.color + "18", display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0 }}>{pt.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: pt.color }}>{pt.label}</span>
              <span style={{ padding: "2px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: ps.bg, color: ps.color }}>{ps.label}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.2 }}>{pr.name}</h1>
            {/* KPIs */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10, fontSize: 12.5 }}>
              {(pr.dateStart || pr.dateEnd) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)" }}>
                  <Icon name="calendar" size={13} />
                  <span>{pr.dateStart ? fmtDate(pr.dateStart, lang) : ""}{pr.dateStart && pr.dateEnd && pr.dateStart !== pr.dateEnd ? " — " + fmtDate(pr.dateEnd, lang) : ""}</span>
                </div>
              )}
              {pr.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)" }}>
                  <Icon name="pin" size={13} /> <span>{pr.location}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent)", fontWeight: 700 }}>
                <Icon name="users" size={13} /> <span>{members.length} registrados</span>
              </div>
              {pr.attendanceCount != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--good)", fontWeight: 700 }}>
                  <Icon name="users" size={13} /> <span>{pr.attendanceCount} asistentes totales</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
            <select value={pr.status} onChange={e => onUpdateProject(pr.id, { status: e.target.value })}
              style={{ height: 34, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", fontFamily: "inherit", fontSize: 12.5, color: ps.color, fontWeight: 600, cursor: "pointer" }}>
              {(window.PROJECT_STATUSES || []).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button className="btn btn-sm" onClick={() => setShowEdit(true)}><Icon name="edit" /> Editar</button>
            <button className="btn btn-sm" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
              onClick={() => { if (confirm("¿Eliminar este proyecto?")) { onDeleteProject(pr.id); go({ name: "projects" }); } }}>
              <Icon name="trash" />
            </button>
          </div>
        </div>
        {(pr.tags || []).length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12 }}>
            {pr.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
          </div>
        )}
        {pr.description && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
            {pr.description}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Participantes tab */}
      {tab === "participantes" && (
        <div className="section">
          <h3 style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            Participantes
            {!addingMember && availablePersonas.length > 0 && (
              <button className="btn btn-sm" onClick={() => setAddingMember(true)}><Icon name="plus" /> Agregar persona</button>
            )}
          </h3>
          {addingMember && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "14px 16px", background: "var(--bg-soft)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
              <div className="field" style={{ margin: 0, flex: "2 1 220px", position: "relative" }}>
                <label style={{ fontSize: 11 }}>Buscar persona</label>
                <input value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setShowMemberDrop(true); setMemberPersonaId(""); }} onFocus={() => setShowMemberDrop(true)} placeholder="Nombre, ciudad, cargo…" style={{ width: "100%" }} />
                {showMemberDrop && (
                  <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,.12)", zIndex: 200, maxHeight: 240, overflowY: "auto" }}>
                    {filteredAvail.slice(0, 10).map(p => (
                      <div key={p.id} onClick={() => { setMemberPersonaId(p.id); setMemberSearch(fullName(p)); setShowMemberDrop(false); }}
                        style={{ padding: "9px 13px", cursor: "pointer", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}
                        onMouseEnter={ev => ev.currentTarget.style.background = "var(--bg-soft)"}
                        onMouseLeave={ev => ev.currentTarget.style.background = ""}>
                        <div className="av-circle" style={{ background: p.color, width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>{initials(fullName(p))}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{fullName(p)}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{p.role}{p.city ? " · " + p.city : ""}</div>
                        </div>
                      </div>
                    ))}
                    {filteredAvail.length === 0 && <div style={{ padding: "12px 14px", color: "var(--ink-4)", fontSize: 13 }}>Sin resultados</div>}
                  </div>
                )}
              </div>
              <div className="field" style={{ margin: 0, flex: "1 1 160px" }}>
                <label style={{ fontSize: 11 }}>Rol en el proyecto</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  {PROJECT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, paddingBottom: 1 }}>
                <button className="btn btn-sm btn-primary" disabled={!memberPersonaId} onClick={doAddMember}><Icon name="check" /> Agregar</button>
                <button className="btn btn-sm" onClick={() => { setAddingMember(false); setMemberSearch(""); setMemberPersonaId(""); }}>Cancelar</button>
              </div>
            </div>
          )}
          <div className="section-body">
            {members.length === 0 && !addingMember ? (
              <div className="empty" style={{ padding: "32px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Aún no hay participantes. ¡Agrega el primero!</div>
              </div>
            ) : (
              members.map(({ person: p, role: mRole, addedAt }) => (
                <div key={p.id} className="link-row">
                  <div className="av-circle" style={{ background: p.color, width: 38, height: 38, fontSize: 13, flexShrink: 0, cursor: "pointer" }} onClick={() => go({ name: "person", id: p.id })}>{initials(fullName(p))}</div>
                  <div className="grow" style={{ cursor: "pointer" }} onClick={() => go({ name: "person", id: p.id })}>
                    <div className="title" style={{ fontWeight: 700 }}>{fullName(p)}</div>
                    <div className="row-sub">{p.role !== "otro" ? p.role : (p.roleOther || "")}{p.city ? " · " + p.city : ""}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{ padding: "2px 9px", borderRadius: 6, background: pt.color + "14", color: pt.color, fontSize: 11.5, fontWeight: 600 }}>{mRole}</span>
                    {addedAt && <span style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{fmtDate(addedAt, lang)}</span>}
                  </div>
                  <button className="btn btn-sm btn-ghost" style={{ color: "var(--bad)" }} onClick={() => onRemoveMember(pr.id, p.id)}><Icon name="x" /></button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Archivos tab */}
      {tab === "archivos" && (
        <div className="section">
          <h3>Archivos y fotos</h3>
          <div className="section-body">
            <AttachmentsTab
              attachments={projectAttachments}
              onAdd={onAddAttachment}
              onDelete={onDeleteAttachment}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* Comentarios tab */}
      {tab === "comentarios" && (
        <div className="section">
          <h3>Comentarios</h3>
          <div className="section-body">
            <div className="comment-form" style={{ marginBottom: 14 }}>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) doPostComment(); }}
                placeholder="Escribe un comentario… (Ctrl+Enter para publicar)"
              />
              <div className="row">
                <button className="btn btn-sm btn-primary" disabled={!commentText.trim()} onClick={doPostComment}><Icon name="check" /> Publicar</button>
              </div>
            </div>
            {projectComments.length === 0 ? (
              <div className="empty" style={{ padding: "24px 0" }}>Sin comentarios aún.</div>
            ) : (
              projectComments.map((c, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)", display: "flex", gap: 10 }}>
                  <div className="av-circle" style={{ background: "var(--accent)", width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                    {(c.author || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
                      <strong style={{ color: "var(--ink-2)" }}>{c.author}</strong> · {fmtDate(c.date, lang)}
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{c.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showEdit && (
        <NewProjectForm lang={lang} data={data} initialData={pr} onClose={() => setShowEdit(false)} onSave={form => { onUpdateProject(pr.id, form); setShowEdit(false); }} />
      )}
    </div>
  );
};

// ─── Person projects tab (inside PersonProfile) ───
const PersonProjectsTab = ({ personId, lang, data, go }) => {
  const personProjects = (data.projects || []).filter(pr => (pr.members || []).some(m => m.personaId === personId));
  if (personProjects.length === 0) return (
    <div className="empty" style={{ padding: "40px 0" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
      <div>Esta persona no ha participado en ningún proyecto aún.</div>
      <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => go({ name: "projects" })}>Ver proyectos →</button>
    </div>
  );
  return (
    <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {personProjects.map(pr => {
        const pt = getProjType(pr.type);
        const ps = getProjStatus(pr.status);
        const member = (pr.members || []).find(m => m.personaId === personId);
        return (
          <div key={pr.id} onClick={() => go({ name: "project", id: pr.id })}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg)", cursor: "pointer", borderLeft: "3px solid " + pt.color, transition: "box-shadow .12s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ""}>
            <span style={{ fontSize: 24 }}>{pt.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{pr.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, display: "flex", gap: 8 }}>
                <span style={{ color: pt.color, fontWeight: 600 }}>{pt.label}</span>
                {pr.dateStart && <span><Icon name="calendar" size={11} /> {fmtDate(pr.dateStart, lang)}</span>}
              </div>
            </div>
            {member && member.role && (
              <span style={{ padding: "2px 9px", borderRadius: 6, background: pt.color + "14", color: pt.color, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{member.role}</span>
            )}
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: ps.bg, color: ps.color }}>{ps.label}</span>
          </div>
        );
      })}
    </div>
  );
};

window.ProjectsListView = ProjectsListView;
window.ProjectDetailView = ProjectDetailView;
window.PersonProjectsTab = PersonProjectsTab;
window.NewProjectForm = NewProjectForm;
