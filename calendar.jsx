// PROMEZA CRM — Calendar view (monthly, projects + tasks + custom events)

const EVENT_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#ef4444","#14b8a6"];

const CalendarView = ({ lang, data, go, onAddCalendarEvent, onDeleteCalendarEvent, onAddTask }) => {
  const { useState, useMemo } = React;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [addForm, setAddForm] = useState({ type: "event", title: "", color: "#6366f1", personaId: "", note: "" });
  const [showAddPanel, setShowAddPanel] = useState(false);

  const es = lang !== "en";
  const weekStartsMonday = es;

  const DOW_LABELS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const DOW_LABELS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dowLabels = weekStartsMonday ? DOW_LABELS_ES : DOW_LABELS_EN;

  const monthName = new Date(year, month, 1).toLocaleDateString(es ? "es-ES" : "en-US", { month: "long", year: "numeric" });
  const monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    let startDow = firstDay.getDay();
    if (weekStartsMonday) startDow = (startDow + 6) % 7;
    const days = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      days.push({ day: d, dateStr });
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month, weekStartsMonday]);

  const eventsByDate = useMemo(() => {
    const map = {};
    const addEvent = (dateStr, evt) => {
      if (!dateStr) return;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(evt);
    };

    // Projects: start date
    const projectTypes = window.PROJECT_TYPES || [];
    (data.projects || []).forEach(pr => {
      if (!pr.dateStart) return;
      const pt = projectTypes.find(t => t.id === pr.type) || { color: "#6366f1", emoji: "📂" };
      addEvent(pr.dateStart, { kind: "project", id: pr.id, label: (pt.emoji ? pt.emoji + " " : "") + pr.name, color: pt.color, sub: es ? "Inicio" : "Start" });
      if (pr.dateEnd && pr.dateEnd !== pr.dateStart) {
        addEvent(pr.dateEnd, { kind: "project", id: pr.id, label: (pt.emoji ? pt.emoji + " " : "") + pr.name, color: pt.color + "99", sub: es ? "Fin" : "End" });
      }
    });

    // Tasks with due dates
    Object.entries(data.tasks || {}).forEach(([personaId, tasks]) => {
      (tasks || []).forEach(task => {
        if (!task.due || task.done) return;
        const persona = data.personas.find(p => p.id === personaId);
        addEvent(task.due, { kind: "task", id: task.id, ownerId: personaId, label: task.text, color: "#f59e0b", sub: persona ? (persona.first + " " + persona.last) : "" });
      });
    });

    // Custom calendar events
    (data.calendarEvents || []).forEach(evt => {
      addEvent(evt.date, { kind: "cal", id: evt.id, label: evt.title, color: evt.color || "#6366f1", note: evt.note });
    });

    return map;
  }, [data.projects, data.tasks, data.calendarEvents, data.personas, es]);

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setAddForm({ type: "event", title: "", color: "#6366f1", personaId: "", note: "" });
    setShowAddPanel(true);
  };

  const handleEventClick = (e, evt) => {
    e.stopPropagation();
    if (evt.kind === "project") go({ name: "project", id: evt.id });
    else if (evt.kind === "task") go({ name: "person", id: evt.ownerId });
  };

  const handleAdd = () => {
    if (!addForm.title.trim()) return;
    if (addForm.type === "task") {
      if (!addForm.personaId) return;
      onAddTask && onAddTask(addForm.personaId, {
        id: "t" + Date.now(),
        text: addForm.title.trim(),
        due: selectedDate,
        done: false,
        createdAt: todayStr,
        assignedTo: null,
      });
    } else {
      onAddCalendarEvent && onAddCalendarEvent({
        title: addForm.title.trim(),
        date: selectedDate,
        color: addForm.color,
        note: addForm.note,
      });
    }
    setShowAddPanel(false);
    setSelectedDate(null);
  };

  const handleDeleteCalEvent = (e, id) => {
    e.stopPropagation();
    onDeleteCalendarEvent && onDeleteCalendarEvent(id);
  };

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const fmtSelectedDate = (ds) => {
    if (!ds) return "";
    const d = new Date(ds + "T12:00:00");
    return d.toLocaleDateString(es ? "es-ES" : "en-US", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{es ? "Calendario" : "Calendar"}</h1>
          <div className="page-sub">{es ? "Proyectos, tareas y eventos por fecha" : "Projects, tasks and events by date"}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={goToday}>{es ? "Hoy" : "Today"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showAddPanel ? "1fr 300px" : "1fr", gap: 16, alignItems: "start" }}>
        {/* Calendar */}
        <div className="card">
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
            <button className="btn btn-sm btn-ghost" onClick={prevMonth} style={{ padding: "4px 10px" }}><Icon name="chevron-left" /></button>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{monthNameCap}</div>
            <button className="btn btn-sm btn-ghost" onClick={nextMonth} style={{ padding: "4px 10px" }}><Icon name="chevron-right" /></button>
          </div>

          {/* DOW headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--line)" }}>
            {dowLabels.map(d => (
              <div key={d} style={{ textAlign: "center", padding: "8px 4px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {calendarDays.map((cell, idx) => {
              if (!cell) return (
                <div key={"e-"+idx} style={{ minHeight: 100, borderRight: idx%7===6?"none":"1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--bg-soft)", ...(idx%7===6?{borderRight:"none"}:{}) }} />
              );
              const { day, dateStr } = cell;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const events = eventsByDate[dateStr] || [];
              const visible = events.slice(0, 3);
              const more = events.length - 3;
              return (
                <div key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  style={{
                    minHeight: 100, borderRight: idx%7===6?"none":"1px solid var(--line)", borderBottom: "1px solid var(--line)",
                    padding: "5px 4px 4px", display: "flex", flexDirection: "column", gap: 2,
                    background: isSelected ? "var(--accent-50)" : "var(--bg)",
                    cursor: "pointer", transition: "background .1s",
                    outline: isSelected ? "2px solid var(--accent)" : "none", outlineOffset: "-2px",
                  }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 1 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : "var(--ink)", background: isToday ? "var(--accent)" : "transparent" }}>{day}</div>
                  </div>
                  {visible.map((evt, ei) => (
                    <div key={evt.id+"-"+ei} onClick={e => handleEventClick(e, evt)} title={evt.label}
                      style={{ borderRadius: 3, padding: "1px 4px", fontSize: 10, fontWeight: 500, color: "#fff", background: evt.color, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "15px" }}>
                      {evt.kind === "task" ? "✓ " : evt.kind === "cal" ? "● " : ""}{evt.label}
                    </div>
                  ))}
                  {more > 0 && <div style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 600, paddingLeft: 2 }}>+{more} {es?"más":"more"}</div>}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              ...(window.PROJECT_TYPES||[]).filter(pt => (data.projects||[]).some(pr => pr.type === pt.id)).map(pt => ({ color: pt.color, label: pt.label })),
              ...((Object.values(data.tasks||{}).flat().some(t => !t.done && t.due)) ? [{ color: "#f59e0b", label: es?"Tareas":"Tasks" }] : []),
              ...((data.calendarEvents||[]).length > 0 ? [{ color: "#6366f1", label: es?"Eventos":"Events" }] : []),
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ink-3)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                {item.label}
              </div>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-4)" }}>{es ? "Clic en un día para agregar" : "Click a day to add"}</div>
          </div>
        </div>

        {/* Side panel: day detail + add form */}
        {showAddPanel && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--accent-50)" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)", textTransform: "capitalize" }}>{fmtSelectedDate(selectedDate)}</div>
              <button className="icon-btn" onClick={() => { setShowAddPanel(false); setSelectedDate(null); }}><Icon name="x" size={14} /></button>
            </div>

            {/* Existing events for this day */}
            {selectedEvents.length > 0 && (
              <div style={{ borderBottom: "1px solid var(--line)" }}>
                {selectedEvents.map((evt, i) => (
                  <div key={evt.id+i} style={{ padding: "8px 14px", borderBottom: i < selectedEvents.length-1 ? "1px solid var(--line)" : "none", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: evt.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evt.label}</div>
                      {evt.sub && <div style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{evt.sub}</div>}
                    </div>
                    {evt.kind === "project" && (
                      <button className="btn btn-sm btn-ghost" style={{ padding: "1px 6px", fontSize: 10.5 }} onClick={() => go({ name: "project", id: evt.id })}>Ver →</button>
                    )}
                    {evt.kind === "task" && (
                      <button className="btn btn-sm btn-ghost" style={{ padding: "1px 6px", fontSize: 10.5 }} onClick={() => go({ name: "person", id: evt.ownerId })}>Ver →</button>
                    )}
                    {evt.kind === "cal" && (
                      <button className="icon-btn" style={{ color: "var(--ink-4)" }} onClick={e => handleDeleteCalEvent(e, evt.id)}><Icon name="trash" size={12} /></button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Agregar" : "Add"}</div>

              {/* Type toggle */}
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "event", label: es ? "Evento" : "Event" },
                  { id: "task", label: es ? "Tarea" : "Task" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setAddForm(f => ({ ...f, type: opt.id }))}
                    style={{ flex: 1, padding: "5px 8px", borderRadius: 7, border: "1.5px solid", borderColor: addForm.type === opt.id ? "var(--accent)" : "var(--line)", background: addForm.type === opt.id ? "var(--accent-50)" : "transparent", color: addForm.type === opt.id ? "var(--accent)" : "var(--ink-3)", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10.5 }}>{addForm.type === "task" ? (es ? "Descripción" : "Description") : (es ? "Título" : "Title")} *</label>
                <input value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  placeholder={addForm.type === "task" ? (es ? "¿Qué hay que hacer?" : "What needs to be done?") : (es ? "Nombre del evento…" : "Event name…")}
                  autoFocus />
              </div>

              {/* Task: persona selector */}
              {addForm.type === "task" && (
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 10.5 }}>{es ? "Contacto" : "Contact"} *</label>
                  <select value={addForm.personaId} onChange={e => setAddForm(f => ({ ...f, personaId: e.target.value }))}>
                    <option value="">{es ? "— Selecciona —" : "— Select —"}</option>
                    {data.personas.map(p => <option key={p.id} value={p.id}>{p.first} {p.last}</option>)}
                  </select>
                </div>
              )}

              {/* Event: color picker */}
              {addForm.type === "event" && (
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 5 }}>{es ? "Color" : "Color"}</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {EVENT_COLORS.map(c => (
                      <div key={c} onClick={() => setAddForm(f => ({ ...f, color: c }))}
                        style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: addForm.color === c ? "3px solid var(--ink)" : "2px solid transparent", transition: "border .1s" }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Event: optional note */}
              {addForm.type === "event" && (
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 10.5 }}>{es ? "Nota (opcional)" : "Note (optional)"}</label>
                  <input value={addForm.note} onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))} placeholder={es ? "Descripción breve…" : "Brief description…"} />
                </div>
              )}

              <button className="btn btn-primary btn-sm"
                disabled={!addForm.title.trim() || (addForm.type === "task" && !addForm.personaId)}
                onClick={handleAdd}
                style={{ marginTop: 2 }}>
                <Icon name="plus" size={13} /> {es ? "Agregar" : "Add"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.CalendarView = CalendarView;
