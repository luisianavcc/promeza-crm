// PROMEZA CRM — Global tasks view

const GlobalTasksView = ({ t, lang, data, go, tasks, onAddTask, onToggleTask, onDeleteTask, users, currentUser }) => {
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState("pending");
  const [filterPersona, setFilterPersona] = React.useState("all");
  const [showForm, setShowForm] = React.useState(false);
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
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          <Icon name="plus" /> {lang === "es" ? "Nueva tarea" : "New task"}
        </button>
      </div>

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
                    {task.text}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
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
