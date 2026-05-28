// PROMEZA CRM — Global tasks view

// ─── Batch Task Modal ───
const BatchTaskModal = ({ t, lang, data, onAddTask, users, currentUser, onClose }) => {
  const [bRole, setBRole] = React.useState("all");
  const [bStage, setBStage] = React.useState("all");
  const [bCity, setBCity] = React.useState("");
  const [bState, setBState] = React.useState("");
  const [bTag, setBTag] = React.useState("");
  const [bText, setBText] = React.useState("");
  const [bDue, setBDue] = React.useState("");
  const [bAssignee, setBAssignee] = React.useState(currentUser || "");
  const [done, setDone] = React.useState(false);

  const es = lang === "es";
  const stages = window.PIPELINE_STAGES || [];
  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  const hasFilter = bRole !== "all" || bStage !== "all" || bCity || bState || bTag;

  const matching = React.useMemo(() => {
    if (!hasFilter) return [];
    return data.personas.filter(p => {
      if (bRole !== "all" && p.role !== bRole) return false;
      if (bStage !== "all" && stageOf(p) !== bStage) return false;
      if (bCity && !(p.city || "").toLowerCase().includes(bCity.toLowerCase())) return false;
      if (bState) {
        const s = bState.toLowerCase();
        const allStates = [p.state, ...((p.extraAddresses || []).map(a => a.state))];
        if (!allStates.some(st => (st || "").toLowerCase().includes(s))) return false;
      }
      if (bTag && !(p.tags || []).some(tg => tg.toLowerCase().includes(bTag.toLowerCase()))) return false;
      return true;
    });
  }, [bRole, bStage, bCity, bState, bTag, data.personas, hasFilter]);

  const assign = () => {
    if (!bText.trim() || matching.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    matching.forEach(p => {
      onAddTask(p.id, {
        id: "t" + Date.now() + Math.random().toString(36).slice(2, 6),
        text: bText.trim(), due: bDue, done: false,
        createdAt: today, assignedTo: bAssignee || null,
      });
    });
    setDone(true);
  };

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(580px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 600, fontSize: 15 }}>{es ? "Asignación masiva de tareas" : "Batch task assignment"}</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{es ? `Tarea asignada a ${matching.length} personas` : `Task assigned to ${matching.length} people`}</div>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>{es ? "Cerrar" : "Close"}</button>
            </div>
          ) : (
            <>
              {/* Step 1 */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                {es ? "Paso 1 — Filtra el grupo destinatario" : "Step 1 — Filter the target group"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>{es ? "Cargo" : "Role"}</label>
                  <select value={bRole} onChange={e => setBRole(e.target.value)}>
                    <option value="all">{es ? "Todos los cargos" : "All roles"}</option>
                    {Object.keys(t.roles).map(k => <option key={k} value={k}>{t.roles[k]}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>{es ? "Etapa" : "Stage"}</label>
                  <select value={bStage} onChange={e => setBStage(e.target.value)}>
                    <option value="all">{es ? "Todas las etapas" : "All stages"}</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>{es ? "Ciudad" : "City"}</label>
                  <input value={bCity} onChange={e => setBCity(e.target.value)} placeholder="Miami, Bogotá…" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>{es ? "Estado / Provincia" : "State / Province"}</label>
                  <input value={bState} onChange={e => setBState(e.target.value)} placeholder="FL, CA, CDMX…" />
                </div>
                <div className="field" style={{ margin: 0, gridColumn: "1 / -1" }}>
                  <label>{es ? "Etiqueta" : "Tag"}</label>
                  <input value={bTag} onChange={e => setBTag(e.target.value)} placeholder={es ? "vip, liderazgo, jóvenes…" : "vip, leadership, youth…"} />
                </div>
              </div>

              {/* Result preview */}
              {!hasFilter ? (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", fontSize: 12.5, color: "var(--ink-3)", textAlign: "center" }}>
                  {es ? "Aplica al menos un filtro para seleccionar el grupo" : "Apply at least one filter to select a group"}
                </div>
              ) : matching.length === 0 ? (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", fontSize: 12.5, color: "var(--ink-4)", textAlign: "center" }}>
                  {es ? "Sin resultados para estos filtros" : "No results for these filters"}
                </div>
              ) : (
                <div style={{ borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#166534" }}>
                      {matching.length} {es ? "personas seleccionadas" : "people selected"}
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: -4 }}>
                      {matching.slice(0, 6).map(p => (
                        <div key={p.id} title={p.first + " " + p.last}
                          className="av-circle"
                          style={{ width: 24, height: 24, fontSize: 9, background: p.color, marginLeft: -6, border: "2px solid #f0fdf4" }}>
                          {initials(p.first + " " + p.last)}
                        </div>
                      ))}
                      {matching.length > 6 && <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#166534", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -6, border: "2px solid #f0fdf4" }}>+{matching.length - 6}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "0 12px 8px" }}>
                    {matching.slice(0, 8).map(p => (
                      <span key={p.id} style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "1px 7px", borderRadius: 10, fontWeight: 500 }}>{p.first} {p.last}</span>
                    ))}
                    {matching.length > 8 && <span style={{ fontSize: 11, color: "#166534" }}>+{matching.length - 8} {es ? "más" : "more"}</span>}
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {hasFilter && matching.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                    {es ? "Paso 2 — Define la tarea" : "Step 2 — Define the task"}
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>{es ? "Descripción de la tarea" : "Task description"} *</label>
                    <input value={bText} onChange={e => setBText(e.target.value)} placeholder={es ? "¿Qué hay que hacer?" : "What needs to be done?"} autoFocus />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{es ? "Fecha límite" : "Due date"}</label>
                      <input type="date" value={bDue} onChange={e => setBDue(e.target.value)} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{es ? "Asignado a" : "Assigned to"}</label>
                      <select value={bAssignee} onChange={e => setBAssignee(e.target.value)}>
                        <option value="">{es ? "Sin asignar" : "Unassigned"}</option>
                        {(users || []).map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {!done && (
          <div className="modal-foot">
            <button className="btn" onClick={onClose}>{es ? "Cancelar" : "Cancel"}</button>
            <button className="btn btn-primary" disabled={!bText.trim() || matching.length === 0 || !hasFilter} onClick={assign}>
              <Icon name="check" /> {es ? `Asignar a ${matching.length} persona${matching.length !== 1 ? "s" : ""}` : `Assign to ${matching.length} person${matching.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Global tasks view ───
const GlobalTasksView = ({ t, lang, data, go, tasks, onAddTask, onToggleTask, onDeleteTask, users, currentUser, dupCount = 0 }) => {
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState("pending");
  const [filterPersona, setFilterPersona] = React.useState("all");
  const [filterState, setFilterState] = React.useState("");
  const [filterZip, setFilterZip] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [showBatch, setShowBatch] = React.useState(false);
  const [form, setForm] = React.useState({ personaId: "", text: "", due: "", assignedTo: currentUser || "" });

  const today = new Date().toISOString().slice(0, 10);

  // Flatten all tasks with personaId
  const allTasks = React.useMemo(() => {
    const out = [];
    for (const [personaId, tlist] of Object.entries(tasks || {})) {
      for (const task of (tlist || [])) {
        out.push({ ...task, personaId });
      }
    }
    return out;
  }, [tasks]);

  const isOverdue = (task) => task.due && !task.done && task.due < today;

  const filtered = allTasks.filter(task => {
    if (filterStatus === "pending" && task.done) return false;
    if (filterStatus === "done" && !task.done) return false;
    if (filterStatus === "overdue" && !isOverdue(task)) return false;
    if (filterAssignee !== "all" && task.assignedTo !== filterAssignee) return false;
    if (filterPersona !== "all" && task.personaId !== filterPersona) return false;
    if (filterState || filterZip) {
      const persona = data.personas.find(p => p.id === task.personaId);
      if (!persona) return false;
      const allAddrs = [
        { state: persona.state, zip: persona.zip },
        ...((persona.extraAddresses || []).map(a => ({ state: a.state, zip: a.zip }))),
      ];
      if (filterState) {
        const s = filterState.toLowerCase();
        if (!allAddrs.some(a => (a.state || "").toLowerCase().includes(s))) return false;
      }
      if (filterZip) {
        if (!allAddrs.some(a => (a.zip || "").toLowerCase().includes(filterZip.toLowerCase()))) return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (!a.done && b.done) return -1;
    if (a.done && !b.done) return 1;
    const da = a.due || "9999-12-31", db = b.due || "9999-12-31";
    return da < db ? -1 : da > db ? 1 : 0;
  });

  const pendingCount = allTasks.filter(t => !t.done).length;
  const overdueCount = allTasks.filter(isOverdue).length;

  const userLabel = (email) => {
    const u = (users || []).find(x => x.email === email);
    return u ? u.name.split(" ")[0] : (email || "").split("@")[0];
  };

  const personaName = (id) => {
    const p = data.personas.find(x => x.id === id);
    return p ? p.first + " " + p.last : "?";
  };

  const doAddTask = () => {
    if (!form.personaId || !form.text.trim()) return;
    onAddTask(form.personaId, {
      id: "t" + Date.now(),
      text: form.text.trim(),
      due: form.due,
      done: false,
      createdAt: today,
      assignedTo: form.assignedTo || null,
    });
    setForm({ personaId: form.personaId, text: "", due: "", assignedTo: currentUser || "" });
    setShowForm(false);
  };

  // Personas that have at least one task
  const personasWithTasks = [...new Set(allTasks.map(t => t.personaId))].map(id => data.personas.find(p => p.id === id)).filter(Boolean);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 4px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {lang === "es" ? "Tareas" : "Tasks"}
          </h2>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>
            {pendingCount} {lang === "es" ? "pendientes" : "pending"}
            {overdueCount > 0 && (
              <span style={{ marginLeft: 8, color: "var(--bad)", fontWeight: 600 }}>
                · {overdueCount} {lang === "es" ? "vencidas" : "overdue"}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm" onClick={() => setShowBatch(true)}>
            <Icon name="users" /> {lang === "es" ? "Asignar en lote" : "Batch assign"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
            <Icon name="plus" /> {lang === "es" ? "Nueva tarea" : "New task"}
          </button>
        </div>
      </div>
      {dupCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 14, background: "#faf5ff", border: "1.5px solid #e9d5ff", borderRadius: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#ede9fe", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="users" size={15} style={{ color: "#7c3aed" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#7c3aed" }}>
              Se {dupCount === 1 ? "encontró" : "encontraron"} {dupCount} posible{dupCount !== 1 ? "s" : ""} duplicado{dupCount !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
              {lang === "es" ? "Revisa y fusiona los registros repetidos." : "Review and merge duplicate records."}
            </div>
          </div>
          <button
            className="btn btn-sm"
            style={{ background: "#7c3aed", color: "#fff", borderColor: "#7c3aed", flexShrink: 0 }}
            onClick={() => go({ name: "duplicates" })}>
            <Icon name="users" size={12} /> {lang === "es" ? "Revisar duplicados →" : "Review duplicates →"}
          </button>
        </div>
      )}

      {showBatch && <BatchTaskModal t={t} lang={lang} data={data} onAddTask={onAddTask} users={users} currentUser={currentUser} onClose={() => setShowBatch(false)} />}

      {/* New task form */}
      {showForm && (
        <div className="section" style={{ marginBottom: 18 }}>
          <h3>{lang === "es" ? "Nueva tarea" : "New task"}</h3>
          <div style={{ padding: "14px 16px", background: "var(--bg-soft)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Contacto" : "Contact"} *</label>
                <select value={form.personaId} onChange={e => setForm(f => ({ ...f, personaId: e.target.value }))}>
                  <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
                  {data.personas.map(p => (
                    <option key={p.id} value={p.id}>{p.first} {p.last}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Asignado a" : "Assigned to"}</label>
                <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">{lang === "es" ? "— Sin asignar —" : "— Unassigned —"}</option>
                  {(users || []).map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "flex-end" }}>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Descripción" : "Description"} *</label>
                <input
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && doAddTask()}
                  placeholder={lang === "es" ? "¿Qué hay que hacer?" : "What needs to be done?"}
                />
              </div>
              <div className="field" style={{ margin: 0, width: 140 }}>
                <label style={{ fontSize: 11 }}>{lang === "es" ? "Fecha límite" : "Due date"}</label>
                <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn btn-sm" onClick={() => setShowForm(false)}>{lang === "es" ? "Cancelar" : "Cancel"}</button>
              <button className="btn btn-sm btn-primary" disabled={!form.personaId || !form.text.trim()} onClick={doAddTask}>
                <Icon name="check" /> {lang === "es" ? "Guardar" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {/* Status filter */}
        <div style={{ display: "flex", gap: 4, background: "var(--bg-soft)", borderRadius: 8, padding: 3 }}>
          {[
            { id: "pending", label: lang === "es" ? "Pendientes" : "Pending" },
            { id: "done", label: lang === "es" ? "Completadas" : "Done" },
            { id: "overdue", label: lang === "es" ? "Vencidas" : "Overdue" },
            { id: "all", label: lang === "es" ? "Todas" : "All" },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterStatus(opt.id)}
              style={{
                padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 500, fontFamily: "inherit",
                background: filterStatus === opt.id ? "var(--bg)" : "transparent",
                color: filterStatus === opt.id ? "var(--ink-1)" : "var(--ink-3)",
                boxShadow: filterStatus === opt.id ? "0 1px 3px rgba(0,0,0,.1)" : "none",
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Assignee filter */}
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          style={{ fontSize: 12.5, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)", fontFamily: "inherit" }}>
          <option value="all">{lang === "es" ? "Todos los responsables" : "All assignees"}</option>
          <option value="">{lang === "es" ? "Sin asignar" : "Unassigned"}</option>
          {(users || []).map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
        </select>

        {/* Persona filter */}
        {personasWithTasks.length > 0 && (
          <select
            value={filterPersona}
            onChange={e => setFilterPersona(e.target.value)}
            style={{ fontSize: 12.5, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)", fontFamily: "inherit" }}>
            <option value="all">{lang === "es" ? "Todos los contactos" : "All contacts"}</option>
            {personasWithTasks.map(p => <option key={p.id} value={p.id}>{p.first} {p.last}</option>)}
          </select>
        )}

        {/* State / ZIP filters */}
        <input
          value={filterState}
          onChange={e => setFilterState(e.target.value)}
          placeholder={lang === "es" ? "Estado / Provincia…" : "State / Province…"}
          style={{ fontSize: 12.5, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)", fontFamily: "inherit", width: 150 }}
        />
        <input
          value={filterZip}
          onChange={e => setFilterZip(e.target.value)}
          placeholder="ZIP…"
          style={{ fontSize: 12.5, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)", fontFamily: "inherit", width: 90 }}
        />
        {(filterState || filterZip) && (
          <button className="btn btn-sm btn-ghost" onClick={() => { setFilterState(""); setFilterZip(""); }}>
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="section">
        <div className="section-body" style={{ padding: 0 }}>
          {filtered.length === 0 && (
            <div className="empty" style={{ padding: "28px 0" }}>
              {lang === "es" ? "Sin tareas para mostrar" : "No tasks to show"}
            </div>
          )}
          {filtered.map(task => {
            const overdue = isOverdue(task);
            return (
              <div key={task.id + task.personaId} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 16px", borderBottom: "1px solid var(--line)",
                opacity: task.done ? 0.55 : 1,
                background: overdue ? "rgba(239,68,68,.04)" : undefined,
              }}>
                <input
                  type="checkbox"
                  checked={!!task.done}
                  onChange={() => onToggleTask(task.personaId, task.id)}
                  style={{ marginTop: 3, cursor: "pointer", width: 16, height: 16, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 500,
                    textDecoration: task.done ? "line-through" : "none",
                    color: overdue ? "var(--bad)" : "var(--ink-1)",
                  }}>
                    {task.text.startsWith("Revisar posible duplicado") && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 6, background: "#ede9fe", color: "#7c3aed", borderRadius: 5, padding: "1px 7px", fontSize: 11, fontWeight: 700, verticalAlign: "middle" }}>
                        <Icon name="users" size={11} /> DUP
                      </span>
                    )}
                    {task.text}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5, flexWrap: "wrap" }}>
                    {/* Persona link */}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "1px 6px", fontSize: 11.5, color: "var(--accent)", fontWeight: 600, height: "auto" }}
                      onClick={() => go({ name: "person", id: task.personaId })}>
                      <Icon name="users" size={11} /> {personaName(task.personaId)}
                    </button>
                    {/* Due date */}
                    {task.due && (
                      <span style={{ fontSize: 11.5, color: overdue ? "var(--bad)" : "var(--ink-3)", fontWeight: overdue ? 600 : 400 }}>
                        <Icon name="calendar" size={11} /> {fmtDate(task.due, lang)}
                        {overdue && <span style={{ marginLeft: 4 }}>{lang === "es" ? "¡Vencida!" : "Overdue!"}</span>}
                      </span>
                    )}
                    {/* Assignee badge */}
                    {task.assignedTo && (
                      <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 10, background: "var(--accent-50)", color: "var(--accent)", fontWeight: 500 }}>
                        {userLabel(task.assignedTo)}
                      </span>
                    )}
                    {!task.assignedTo && (
                      <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                        {lang === "es" ? "Sin asignar" : "Unassigned"}
                      </span>
                    )}
                    {/* Duplicate shortcut button */}
                    {task.text.startsWith("Revisar posible duplicado") && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "1px 8px", fontSize: 11, color: "#7c3aed", borderColor: "#ede9fe", background: "#ede9fe", height: "auto" }}
                        onClick={() => go({ name: "duplicates" })}>
                        <Icon name="users" size={11} /> {lang === "es" ? "Revisar duplicados →" : "Review duplicates →"}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ padding: "1px 6px", color: "var(--ink-4)", flexShrink: 0 }}
                  onClick={() => onDeleteTask(task.personaId, task.id)}>
                  <Icon name="trash" size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

window.GlobalTasksView = GlobalTasksView;

// ─── My Tasks — personal dashboard ───

const MyTasksView = ({ t, lang, data, go, tasks, onToggleTask, onDeleteTask, currentUser, users }) => {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7str = in7.toISOString().slice(0, 10);

  const myTasks = React.useMemo(() => {
    const out = [];
    for (const [personaId, tlist] of Object.entries(tasks || {})) {
      for (const task of (tlist || [])) {
        if (task.assignedTo === currentUser) out.push({ ...task, personaId });
      }
    }
    return out;
  }, [tasks, currentUser]);

  const personaName = (id) => {
    const p = data.personas.find(x => x.id === id);
    return p ? p.first + " " + p.last : "?";
  };

  const groups = [
    { id: "overdue", label: lang === "es" ? "Vencidas" : "Overdue", color: "var(--bad)", tasks: myTasks.filter(t => !t.done && t.due && t.due < today) },
    { id: "today", label: lang === "es" ? "Hoy" : "Today", color: "#f59e0b", tasks: myTasks.filter(t => !t.done && t.due === today) },
    { id: "week", label: lang === "es" ? "Esta semana" : "This week", color: "var(--accent)", tasks: myTasks.filter(t => !t.done && t.due && t.due > today && t.due <= in7str) },
    { id: "later", label: lang === "es" ? "Más adelante" : "Later", color: "var(--ink-3)", tasks: myTasks.filter(t => !t.done && (!t.due || t.due > in7str)) },
    { id: "done", label: lang === "es" ? "Completadas" : "Done", color: "var(--good)", tasks: myTasks.filter(t => t.done) },
  ];

  const pending = myTasks.filter(t => !t.done).length;
  const overdue = myTasks.filter(t => !t.done && t.due && t.due < today).length;

  const userLabel = (email) => {
    const u = (users || []).find(x => x.email === email);
    return u ? u.name : (email || "").split("@")[0];
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">{lang === "es" ? "Mis tareas" : "My tasks"}</h1>
          <div className="page-sub">
            {userLabel(currentUser)} · {pending} {lang === "es" ? "pendientes" : "pending"}
            {overdue > 0 && <span style={{ color: "var(--bad)", fontWeight: 600, marginLeft: 8 }}>· {overdue} {lang === "es" ? "vencidas" : "overdue"}</span>}
          </div>
        </div>
      </div>

      {myTasks.length === 0 && (
        <div className="empty" style={{ padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 600 }}>{lang === "es" ? "Sin tareas asignadas" : "No tasks assigned to you"}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{lang === "es" ? "Las tareas que te asignen aparecerán aquí" : "Tasks assigned to you will appear here"}</div>
        </div>
      )}

      {groups.map(group => group.tasks.length === 0 ? null : (
        <div key={group.id} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: group.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: group.color, textTransform: "uppercase", letterSpacing: ".06em" }}>
              {group.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: group.color, background: group.color + "18", borderRadius: 10, padding: "1px 7px" }}>
              {group.tasks.length}
            </span>
          </div>

          <div className="section">
            <div className="section-body" style={{ padding: 0 }}>
              {group.tasks.map(task => {
                const isOverdue = task.due && !task.done && task.due < today;
                const persona = data.personas.find(p => p.id === task.personaId);
                return (
                  <div key={task.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "13px 16px", borderBottom: "1px solid var(--line)",
                    opacity: task.done ? 0.5 : 1,
                    background: isOverdue ? "rgba(220,38,38,.03)" : "transparent",
                  }}>
                    <input
                      type="checkbox"
                      checked={!!task.done}
                      onChange={() => onToggleTask(task.personaId, task.id)}
                      style={{ marginTop: 3, cursor: "pointer", width: 16, height: 16, flexShrink: 0, accentColor: "var(--accent)" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 500,
                        textDecoration: task.done ? "line-through" : "none",
                        color: isOverdue ? "var(--bad)" : "var(--ink)",
                        marginBottom: 4,
                      }}>
                        {task.text}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {persona && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ height: "auto", padding: "1px 7px", fontSize: 11.5, color: "var(--accent)", fontWeight: 600 }}
                            onClick={() => go({ name: "person", id: task.personaId })}>
                            <Icon name="users" size={11} /> {persona.first} {persona.last}
                            {persona.city && <span style={{ color: "var(--ink-3)", fontWeight: 400 }}> · {persona.city}</span>}
                          </button>
                        )}
                        {task.due && (
                          <span style={{ fontSize: 11.5, color: isOverdue ? "var(--bad)" : "var(--ink-3)", fontWeight: isOverdue ? 600 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon name="calendar" size={11} /> {fmtDate(task.due, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ color: "var(--ink-4)", flexShrink: 0 }}
                      onClick={() => onDeleteTask(task.personaId, task.id)}>
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

window.MyTasksView = MyTasksView;
