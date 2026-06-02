// PROMEZA CRM — Interactions timeline + Tasks

const INTERACTION_TYPES = [
  { id: "llamada", label: "Llamada", icon: "phone", color: "#2F6BFF" },
  { id: "email", label: "Email", icon: "mail", color: "#0E7C66" },
  { id: "whatsapp", label: "WhatsApp", icon: "phone", color: "#25D366" },
  { id: "visita", label: "Visita", icon: "pin", color: "#B45309" },
  { id: "reunion", label: "Reunión", icon: "users", color: "#7C3AED" },
  { id: "otro", label: "Otro", icon: "more", color: "#64748b" },
];

const RESULT_OPTS = [
  { id: "", label: "—", color: "var(--ink-3)" },
  { id: "positivo", label: "Positivo", color: "#16a34a" },
  { id: "neutro", label: "Neutro", color: "#d97706" },
  { id: "negativo", label: "Negativo", color: "#dc2626" },
];

const InteractionsTab = ({ personId, interactions, onAdd, onDelete, lang }) => {
  const [showForm, setShowForm] = React.useState(false);
  const [type, setType] = React.useState("llamada");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState("");
  const [result, setResult] = React.useState("");

  const items = (interactions || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const doAdd = () => {
    if (!notes.trim()) return;
    onAdd({ id: "i" + Date.now(), type, date, notes: notes.trim(), result });
    setNotes("");
    setResult("");
    setShowForm(false);
  };

  return (
    <div className="section">
      <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>
          {lang === "es" ? "Historial de interacciones" : "Interaction history"}
          <span className="muted mono" style={{ fontSize: 11, marginLeft: 8 }}>{items.length}</span>
        </span>
        <button className="btn btn-sm btn-primary" onClick={() => setShowForm(v => !v)}>
          <Icon name="plus" /> {lang === "es" ? "Registrar" : "Log"}
        </button>
      </h3>

      {showForm && (
        <div style={{ padding: "14px 16px", background: "var(--bg-soft)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {INTERACTION_TYPES.map(tp => (
              <button
                key={tp.id}
                onClick={() => setType(tp.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                  borderRadius: 20, border: "1.5px solid",
                  borderColor: type === tp.id ? tp.color : "var(--line)",
                  background: type === tp.id ? tp.color + "18" : "transparent",
                  color: type === tp.id ? tp.color : "var(--ink-2)",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                }}>
                <Icon name={tp.icon} size={13} /> {tp.label}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 11 }}>{lang === "es" ? "Fecha" : "Date"}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 11 }}>{lang === "es" ? "Resultado" : "Result"}</label>
              <select value={result} onChange={e => setResult(e.target.value)}>
                {RESULT_OPTS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="field" style={{ margin: 0, marginBottom: 10 }}>
            <label style={{ fontSize: 11 }}>{lang === "es" ? "Notas" : "Notes"}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={lang === "es" ? "¿Qué se habló? ¿Cómo respondió?" : "What was discussed? How did they respond?"}
              style={{ minHeight: 72, resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-sm" onClick={() => setShowForm(false)}>
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
            <button className="btn btn-sm btn-primary" disabled={!notes.trim()} onClick={doAdd}>
              <Icon name="check" /> {lang === "es" ? "Guardar" : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="section-body">
        {items.length === 0 && (
          <div className="empty" style={{ padding: "24px 0" }}>
            {lang === "es" ? "Sin interacciones registradas" : "No interactions logged yet"}
          </div>
        )}
        <div className="timeline">
          {items.map((item, idx) => {
            const tp = INTERACTION_TYPES.find(t => t.id === item.type) || INTERACTION_TYPES[5];
            const res = RESULT_OPTS.find(r => r.id === item.result);
            return (
              <div key={item.id || idx} className="comment">
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: tp.color + "18", border: "1.5px solid " + tp.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, color: tp.color,
                }}>
                  <Icon name={tp.icon} size={14} />
                </div>
                <div className="body" style={{ flex: 1 }}>
                  <div className="head" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: tp.color }}>{tp.label}</span>
                      {res && res.id && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 10,
                          background: res.color + "20", color: res.color,
                        }}>{res.label}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="when">{fmtDate(item.date, lang)}</span>
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ padding: "1px 6px", color: "var(--ink-4)" }}
                        onClick={() => {
                          if (confirm(lang === "es" ? "¿Eliminar esta interacción?" : "Delete this interaction?")) {
                            onDelete(item.id);
                          }
                        }}>
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="text" style={{ whiteSpace: "pre-line", marginTop: 4 }}>{item.notes}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TasksTab = ({ personId, tasks, onAddTask, onToggleTask, onDeleteTask, lang, users, currentUser }) => {
  const [text, setText] = React.useState("");
  const [due, setDue] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState(currentUser || "");

  const items = tasks || [];
  const today = new Date().toISOString().slice(0, 10);

  const pending = items.filter(t => !t.done).sort((a, b) => {
    const da = a.due || "9999-12-31", db = b.due || "9999-12-31";
    return da < db ? -1 : da > db ? 1 : 0;
  });
  const done = items.filter(t => t.done);

  const isOverdue = (task) => task.due && !task.done && task.due < today;
  const userLabel = (email) => {
    const u = (users || []).find(x => x.email === email);
    return u ? u.name.split(" ")[0] : (email || "").split("@")[0];
  };

  const doAdd = () => {
    if (!text.trim()) return;
    onAddTask({ id: "t" + Date.now(), text: text.trim(), due, done: false, createdAt: today, assignedTo: assignedTo || null });
    setText("");
    setDue("");
  };

  return (
    <div className="section">
      <h3>
        {lang === "es" ? "Tareas y seguimiento" : "Tasks & follow-up"}
        {pending.length > 0 && (
          <span className="badge" style={{ background: pending.some(isOverdue) ? "#ef4444" : "var(--accent)", color: "#fff", marginLeft: 8 }}>
            {pending.length}
          </span>
        )}
      </h3>

      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-soft)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div className="field" style={{ margin: 0, flex: 1 }}>
            <label style={{ fontSize: 11 }}>{lang === "es" ? "Nueva tarea" : "New task"}</label>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doAdd()}
              placeholder={lang === "es" ? "Ej: Llamar para hacer seguimiento…" : "E.g. Call for follow-up…"}
            />
          </div>
          <div className="field" style={{ margin: 0, width: 130 }}>
            <label style={{ fontSize: 11 }}>{lang === "es" ? "Fecha límite" : "Due date"}</label>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ flexShrink: 0 }} disabled={!text.trim()} onClick={doAdd}>
            <Icon name="plus" />
          </button>
        </div>
        {(users || []).length > 0 && (
          <div className="field" style={{ margin: "8px 0 0" }}>
            <label style={{ fontSize: 11 }}>{lang === "es" ? "Asignado a" : "Assigned to"}</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">{lang === "es" ? "— Sin asignar —" : "— Unassigned —"}</option>
              {(users || []).map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="section-body">
        {items.length === 0 && (
          <div className="empty" style={{ padding: "24px 0" }}>
            {lang === "es" ? "Sin tareas asignadas" : "No tasks assigned"}
          </div>
        )}

        {pending.map(task => (
          <div key={task.id} style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
            borderBottom: "1px solid var(--line)",
          }}>
            <input
              type="checkbox"
              checked={false}
              onChange={() => onToggleTask(task.id)}
              style={{ marginTop: 3, cursor: "pointer", width: 16, height: 16, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: isOverdue(task) ? "var(--bad)" : "var(--ink-1)" }}>
                {task.text}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
                {task.due && (
                  <span style={{ fontSize: 11.5, color: isOverdue(task) ? "var(--bad)" : "var(--ink-3)", fontWeight: isOverdue(task) ? 600 : 400 }}>
                    <Icon name="calendar" size={11} /> {fmtDate(task.due, lang)}
                    {isOverdue(task) && <span style={{ marginLeft: 4 }}>{lang === "es" ? "¡Vencida!" : "Overdue!"}</span>}
                  </span>
                )}
                {task.assignedTo && (
                  <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 10, background: "var(--accent-50)", color: "var(--accent)", fontWeight: 500 }}>
                    {userLabel(task.assignedTo)}
                  </span>
                )}
              </div>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              style={{ padding: "1px 6px", color: "var(--ink-4)", flexShrink: 0 }}
              onClick={() => onDeleteTask(task.id)}>
              <Icon name="trash" size={13} />
            </button>
          </div>
        ))}

        {done.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--ink-4)", marginBottom: 8 }}>
              {lang === "es" ? "Completadas" : "Completed"} ({done.length})
            </div>
            {done.map(task => (
              <div key={task.id} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0",
                borderBottom: "1px solid var(--line)", opacity: 0.55,
              }}>
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => onToggleTask(task.id)}
                  style={{ marginTop: 3, cursor: "pointer", width: 16, height: 16, flexShrink: 0 }}
                />
                <div style={{ flex: 1, textDecoration: "line-through", fontSize: 13.5, color: "var(--ink-3)" }}>
                  {task.text}
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ padding: "1px 6px", color: "var(--ink-4)", flexShrink: 0 }}
                  onClick={() => onDeleteTask(task.id)}>
                  <Icon name="trash" size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

window.InteractionsTab = InteractionsTab;
window.TasksTab = TasksTab;
