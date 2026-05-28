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
    description: initialData?.description || "",
    tags: (initialData?.tags || []).join(", "),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const es = lang === "es";

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(560px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? (es ? "Editar proyecto" : "Edit project") : (es ? "Nuevo proyecto" : "New project")}</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>{es ? "Nombre del proyecto" : "Project name"} *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder={es ? "ej. Rueda de prensa enero 2026" : "e.g. Press conference Jan 2026"} autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{es ? "Tipo" : "Type"}</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}>
                {window.PROJECT_TYPES.map(pt => <option key={pt.id} value={pt.id}>{pt.emoji} {pt.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{es ? "Estado" : "Status"}</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}>
                {window.PROJECT_STATUSES.map(ps => <option key={ps.id} value={ps.id}>{ps.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{es ? "Fecha inicio" : "Start date"}</label>
              <input type="date" value={form.dateStart} onChange={e => set("dateStart", e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{es ? "Fecha fin" : "End date"}</label>
              <input type="date" value={form.dateEnd} onChange={e => set("dateEnd", e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{es ? "Lugar / Plataforma" : "Location / Platform"}</label>
            <input value={form.location} onChange={e => set("location", e.target.value)} placeholder={es ? "ej. Teatro Nacional, Zoom, YouTube Live…" : "e.g. National Theatre, Zoom, YouTube Live…"} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{es ? "Descripción / Notas" : "Description / Notes"}</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder={es ? "Detalles del proyecto, objetivos, contexto…" : "Project details, goals, context…"} style={{ fontFamily: "inherit", fontSize: 13, resize: "vertical" }} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{es ? "Etiquetas" : "Tags"} <span className="muted" style={{ fontSize: 10.5, fontWeight: 400 }}>({es ? "separadas por coma" : "comma separated"})</span></label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="ministerio, internacional…" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{es ? "Cancelar" : "Cancel"}</button>
          <button className="btn btn-primary" disabled={!form.name.trim()} onClick={() => {
            onSave({
              ...form,
              tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
            });
          }}>
            <Icon name="check" /> {isEdit ? (es ? "Guardar cambios" : "Save changes") : (es ? "Crear proyecto" : "Create project")}
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
  const es = lang === "es";

  const projects = data.projects || [];

  const filtered = projects.filter(pr => {
    if (typeFilter !== "all" && pr.type !== typeFilter) return false;
    if (statusFilter !== "all" && pr.status !== statusFilter) return false;
    if (search.trim() && !pr.name.toLowerCase().includes(search.toLowerCase()) && !(pr.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countByType = Object.fromEntries(window.PROJECT_TYPES.map(pt => [pt.id, projects.filter(pr => pr.type === pt.id).length]));
  const today = new Date().toISOString().slice(0, 10);

  const getProjectType = id => window.PROJECT_TYPES.find(pt => pt.id === id) || window.PROJECT_TYPES.at(-1);
  const getProjectStatus = id => window.PROJECT_STATUSES.find(ps => ps.id === id) || window.PROJECT_STATUSES[0];

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">{es ? "Proyectos" : "Projects"}</h1>
          <div className="page-sub">{projects.length} {es ? "proyectos" : "projects"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }}><Icon name="search" size={14} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={es ? "Buscar proyecto…" : "Search project…"}
              style={{ paddingLeft: 32, width: 200, height: 36, fontSize: 13, borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", fontFamily: "inherit", color: "var(--ink)" }} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Icon name="plus" /> {es ? "Nuevo proyecto" : "New project"}</button>
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => setStatusFilter("all")} style={{ padding: "5px 13px", borderRadius: 999, border: "1.5px solid", borderColor: statusFilter === "all" ? "var(--accent)" : "var(--line)", background: statusFilter === "all" ? "var(--accent-50)" : "var(--bg)", color: statusFilter === "all" ? "var(--accent-700)" : "var(--ink-3)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          {es ? "Todos" : "All"} · {projects.length}
        </button>
        {window.PROJECT_STATUSES.map(ps => (
          <button key={ps.id} onClick={() => setStatusFilter(statusFilter === ps.id ? "all" : ps.id)} style={{ padding: "5px 13px", borderRadius: 999, border: "1.5px solid", borderColor: statusFilter === ps.id ? ps.color : ps.color + "40", background: statusFilter === ps.id ? ps.bg : "var(--bg)", color: statusFilter === ps.id ? ps.color : "var(--ink-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            <span style={{ fontWeight: 800 }}>{projects.filter(pr => pr.status === ps.id).length}</span> {ps.label}
          </button>
        ))}
      </div>

      {/* Type filter row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setTypeFilter("all")} style={{ padding: "4px 11px", borderRadius: 6, border: "1px solid", borderColor: typeFilter === "all" ? "var(--accent)" : "var(--line)", background: typeFilter === "all" ? "var(--accent-50)" : "var(--bg)", color: typeFilter === "all" ? "var(--accent)" : "var(--ink-3)", fontFamily: "inherit", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          {es ? "Todos los tipos" : "All types"}
        </button>
        {window.PROJECT_TYPES.filter(pt => countByType[pt.id] > 0).map(pt => (
          <button key={pt.id} onClick={() => setTypeFilter(typeFilter === pt.id ? "all" : pt.id)} style={{ padding: "4px 11px", borderRadius: 6, border: "1px solid", borderColor: typeFilter === pt.id ? pt.color : "var(--line)", background: typeFilter === pt.id ? pt.color + "12" : "var(--bg)", color: typeFilter === pt.id ? pt.color : "var(--ink-2)", fontFamily: "inherit", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            {pt.emoji} {pt.label} · {countByType[pt.id]}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="empty" style={{ padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
          <div>{projects.length === 0 ? (es ? "Aún no hay proyectos. ¡Crea el primero!" : "No projects yet. Create the first one!") : (es ? "Sin resultados para esta búsqueda" : "No results for this search")}</div>
          {projects.length === 0 && <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}><Icon name="plus" /> {es ? "Nuevo proyecto" : "New project"}</button>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {filtered.map(pr => {
            const pt = getProjectType(pr.type);
            const ps = getProjectStatus(pr.status);
            const memberCount = (pr.members || []).length;
            const isUpcoming = pr.dateStart && pr.dateStart > today;
            const isPast = pr.dateEnd && pr.dateEnd < today;
            return (
              <div key={pr.id}
                onClick={() => go({ name: "project", id: pr.id })}
                style={{ background: "var(--bg)", borderRadius: 12, border: "1px solid var(--line)", borderLeft: "4px solid " + pt.color, padding: "16px", cursor: "pointer", boxShadow: "var(--shadow-sm)", transition: "box-shadow .15s, transform .15s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = ""; }}>
                {/* Type + status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: pt.color, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{pt.emoji}</span> {pt.label}
                  </span>
                  <span style={{ padding: "2px 9px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, background: ps.bg, color: ps.color }}>{ps.label}</span>
                </div>
                {/* Name */}
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>{pr.name}</div>
                {/* Date + location */}
                <div style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", flexDirection: "column", gap: 3 }}>
                  {(pr.dateStart || pr.dateEnd) && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Icon name="calendar" size={11} />
                      {pr.dateStart ? fmtDate(pr.dateStart, lang) : ""}
                      {pr.dateStart && pr.dateEnd && pr.dateStart !== pr.dateEnd ? " → " + fmtDate(pr.dateEnd, lang) : ""}
                      {!pr.dateStart && pr.dateEnd ? fmtDate(pr.dateEnd, lang) : ""}
                    </span>
                  )}
                  {pr.location && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={11} /> {pr.location}</span>}
                </div>
                {/* Tags */}
                {(pr.tags || []).length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {pr.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
                  </div>
                )}
                {/* Members count */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {(pr.members || []).slice(0, 4).map((m, i) => {
                      const person = data.personas.find(p => p.id === m.personaId);
                      return person ? (
                        <div key={m.personaId} style={{ width: 24, height: 24, borderRadius: "50%", background: person.color, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, color: "#fff", marginLeft: i > 0 ? -6 : 0, border: "2px solid var(--bg)", zIndex: 4 - i }}>
                          {initials(fullName(person))}
                        </div>
                      ) : null;
                    })}
                    {memberCount > 4 && <span style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: 2 }}>+{memberCount - 4}</span>}
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>
                    <Icon name="users" size={12} /> {memberCount} {es ? "participante" + (memberCount !== 1 ? "s" : "") : "participant" + (memberCount !== 1 ? "s" : "")}
                  </span>
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
const ProjectDetailView = ({ id, lang, data, go, onUpdateProject, onDeleteProject, onAddMember, onRemoveMember }) => {
  const pr = (data.projects || []).find(p => p.id === id);
  const [showEdit, setShowEdit] = React.useState(false);
  const [addingMember, setAddingMember] = React.useState(false);
  const [memberSearch, setMemberSearch] = React.useState("");
  const [memberPersonaId, setMemberPersonaId] = React.useState("");
  const [memberRole, setMemberRole] = React.useState(PROJECT_ROLES[0]);
  const [showMemberDrop, setShowMemberDrop] = React.useState(false);
  const es = lang === "es";

  if (!pr) return (
    <div className="empty">
      <div>{es ? "Proyecto no encontrado" : "Project not found"}</div>
      <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => go({ name: "projects" })}>← {es ? "Volver" : "Back"}</button>
    </div>
  );

  const pt = (window.PROJECT_TYPES || []).find(t => t.id === pr.type) || window.PROJECT_TYPES.at(-1);
  const ps = (window.PROJECT_STATUSES || []).find(s => s.id === pr.status) || window.PROJECT_STATUSES[0];
  const members = (pr.members || []).map(m => ({ ...m, person: data.personas.find(p => p.id === m.personaId) })).filter(m => m.person);
  const availablePersonas = data.personas.filter(p => !(pr.members || []).some(m => m.personaId === p.id));
  const today = new Date().toISOString().slice(0, 10);

  const doAddMember = () => {
    if (!memberPersonaId) return;
    onAddMember(pr.id, { personaId: memberPersonaId, role: memberRole, addedAt: today });
    setAddingMember(false); setMemberSearch(""); setMemberPersonaId(""); setMemberRole(PROJECT_ROLES[0]);
  };

  const filteredAvail = availablePersonas.filter(p =>
    !memberSearch.trim() ||
    (p.first + " " + p.last).toLowerCase().includes(memberSearch.toLowerCase()) ||
    (p.city || "").toLowerCase().includes(memberSearch.toLowerCase()) ||
    (p.role || "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div style={{ animation: "fadeIn .2s ease-out" }}>
      {/* Back */}
      <div style={{ marginBottom: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => go({ name: "projects" })}>← {es ? "Proyectos" : "Projects"}</button>
      </div>

      {/* Project header card */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 14, borderLeft: "5px solid " + pt.color, padding: "20px 22px", marginBottom: 18, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: pt.color + "18", display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0 }}>{pt.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: pt.color }}>{pt.label}</span>
              <span style={{ padding: "2px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: ps.bg, color: ps.color }}>{ps.label}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.2 }}>{pr.name}</h1>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8, fontSize: 12.5, color: "var(--ink-3)" }}>
              {(pr.dateStart || pr.dateEnd) && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="calendar" size={13} />
                  {pr.dateStart ? fmtDate(pr.dateStart, lang) : ""}
                  {pr.dateStart && pr.dateEnd && pr.dateStart !== pr.dateEnd ? " — " + fmtDate(pr.dateEnd, lang) : ""}
                  {!pr.dateStart && pr.dateEnd ? fmtDate(pr.dateEnd, lang) : ""}
                </span>
              )}
              {pr.location && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={13} /> {pr.location}</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="users" size={13} />
                {members.length} {es ? "participante" + (members.length !== 1 ? "s" : "") : "participant" + (members.length !== 1 ? "s" : "")}
              </span>
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <select value={pr.status} onChange={e => onUpdateProject(pr.id, { status: e.target.value })}
              style={{ height: 34, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", fontFamily: "inherit", fontSize: 12.5, color: ps.color, fontWeight: 600, cursor: "pointer" }}>
              {window.PROJECT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button className="btn btn-sm" onClick={() => setShowEdit(true)}><Icon name="edit" /> {es ? "Editar" : "Edit"}</button>
            <button className="btn btn-sm" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
              onClick={() => { if (confirm(es ? "¿Eliminar este proyecto?" : "Delete this project?")) { onDeleteProject(pr.id); go({ name: "projects" }); } }}>
              <Icon name="trash" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {(pr.tags || []).length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12 }}>
            {pr.tags.map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
          </div>
        )}

        {/* Description */}
        {pr.description && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {pr.description}
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="section">
        <h3 style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{es ? "Participantes" : "Participants"} <span style={{ color: "var(--ink-4)", fontWeight: 400, fontSize: 12 }}>({members.length})</span></span>
          {!addingMember && availablePersonas.length > 0 && (
            <button className="btn btn-sm" onClick={() => setAddingMember(true)}><Icon name="plus" /> {es ? "Agregar persona" : "Add person"}</button>
          )}
        </h3>

        {/* Add member form */}
        {addingMember && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "14px 16px", background: "var(--bg-soft)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
            <div className="field" style={{ margin: 0, flex: "2 1 220px", position: "relative" }}>
              <label style={{ fontSize: 11 }}>{es ? "Buscar persona" : "Search person"}</label>
              <input value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setShowMemberDrop(true); setMemberPersonaId(""); }} onFocus={() => setShowMemberDrop(true)} placeholder={es ? "Nombre, ciudad, cargo…" : "Name, city, role…"} style={{ width: "100%" }} />
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
                        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{p.role} {p.city ? "· " + p.city : ""}</div>
                      </div>
                    </div>
                  ))}
                  {filteredAvail.length === 0 && <div style={{ padding: "12px 14px", color: "var(--ink-4)", fontSize: 13 }}>{es ? "Sin resultados" : "No results"}</div>}
                </div>
              )}
            </div>
            <div className="field" style={{ margin: 0, flex: "1 1 160px" }}>
              <label style={{ fontSize: 11 }}>{es ? "Rol en el proyecto" : "Role in project"}</label>
              <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                {PROJECT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 6, paddingBottom: 1 }}>
              <button className="btn btn-sm btn-primary" disabled={!memberPersonaId} onClick={doAddMember}><Icon name="check" /> {es ? "Agregar" : "Add"}</button>
              <button className="btn btn-sm" onClick={() => { setAddingMember(false); setMemberSearch(""); setMemberPersonaId(""); }}>{es ? "Cancelar" : "Cancel"}</button>
            </div>
          </div>
        )}

        <div className="section-body">
          {members.length === 0 && !addingMember ? (
            <div className="empty" style={{ padding: "32px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>👥</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{es ? "Aún no hay participantes. ¡Agrega el primero!" : "No participants yet. Add the first one!"}</div>
            </div>
          ) : (
            members.map(({ person: p, role: mRole, addedAt }) => (
              <div key={p.id} className="link-row" style={{ cursor: "default" }}>
                <div className="av-circle" style={{ background: p.color, width: 36, height: 36, fontSize: 13, flexShrink: 0, cursor: "pointer" }} onClick={() => go({ name: "person", id: p.id })}>{initials(fullName(p))}</div>
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

      {showEdit && (
        <NewProjectForm lang={lang} data={data} initialData={pr} onClose={() => setShowEdit(false)} onSave={form => { onUpdateProject(pr.id, form); setShowEdit(false); }} />
      )}
    </div>
  );
};

// ─── Person projects tab (used inside PersonProfile) ───
const PersonProjectsTab = ({ personId, lang, data, go }) => {
  const es = lang === "es";
  const personProjects = (data.projects || []).filter(pr => (pr.members || []).some(m => m.personaId === personId));

  if (personProjects.length === 0) return (
    <div className="empty" style={{ padding: "40px 0" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
      <div>{es ? "Esta persona no ha participado en ningún proyecto aún." : "This person has not participated in any project yet."}</div>
      <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => go({ name: "projects" })}>{es ? "Ver proyectos →" : "View projects →"}</button>
    </div>
  );

  return (
    <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {personProjects.map(pr => {
        const pt = (window.PROJECT_TYPES || []).find(t => t.id === pr.type) || { emoji: "📋", label: pr.type, color: "#94a3b8" };
        const ps = (window.PROJECT_STATUSES || []).find(s => s.id === pr.status) || { label: pr.status, color: "#94a3b8", bg: "#f8fafc" };
        const member = (pr.members || []).find(m => m.personaId === personId);
        return (
          <div key={pr.id} onClick={() => go({ name: "project", id: pr.id })}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg)", cursor: "pointer", borderLeft: "3px solid " + pt.color, transition: "box-shadow .12s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ""}>
            <span style={{ fontSize: 22 }}>{pt.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{pr.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, display: "flex", gap: 8 }}>
                <span style={{ color: pt.color, fontWeight: 600 }}>{pt.label}</span>
                {pr.dateStart && <span><Icon name="calendar" size={11} /> {fmtDate(pr.dateStart, lang)}</span>}
              </div>
            </div>
            {member?.role && (
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
