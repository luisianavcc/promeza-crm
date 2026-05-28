// PROMEZA CRM — Calendar view (monthly, projects + tasks)

const CalendarView = ({ lang, data, go }) => {
  const { useState, useMemo } = React;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const es = lang !== "en";

  // Week starts on Monday for Spanish, Sunday for English
  const weekStartsMonday = es;

  const DOW_LABELS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const DOW_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowLabels = weekStartsMonday ? DOW_LABELS_ES : DOW_LABELS_EN;

  const monthName = new Date(year, month, 1).toLocaleDateString(es ? "es-ES" : "en-US", { month: "long", year: "numeric" });
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Day of week of first day (0=Sun, 1=Mon, ... 6=Sat)
    let startDow = firstDay.getDay();
    if (weekStartsMonday) startDow = (startDow + 6) % 7; // rotate so Mon=0

    const days = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) days.push(null);
    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, dateStr });
    }
    // Trailing empty cells to fill grid
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month, weekStartsMonday]);

  // Build events map: dateStr -> array of event objects
  const eventsByDate = useMemo(() => {
    const map = {};

    const addEvent = (dateStr, evt) => {
      if (!dateStr) return;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(evt);
    };

    // Projects: use dateStart
    const projectTypes = window.PROJECT_TYPES || [];
    (data.projects || []).forEach(pr => {
      if (!pr.dateStart) return;
      const pt = projectTypes.find(t => t.id === pr.type) || { color: "#94a3b8" };
      addEvent(pr.dateStart, {
        kind: "project",
        id: pr.id,
        label: pr.name,
        color: pt.color,
      });
    });

    // Tasks: keyed by personaId
    Object.entries(data.tasks || {}).forEach(([personaId, tasks]) => {
      (tasks || []).forEach(task => {
        if (!task.due || task.done) return;
        addEvent(task.due, {
          kind: "task",
          id: task.id,
          ownerId: personaId,
          label: task.text,
          color: "#f59e0b",
        });
      });
    });

    return map;
  }, [data.projects, data.tasks]);

  // Legend: distinct project types that appear in data this month + tasks indicator
  const legendItems = useMemo(() => {
    const projectTypes = window.PROJECT_TYPES || [];
    const usedTypeIds = new Set((data.projects || []).map(pr => pr.type));
    const items = projectTypes
      .filter(pt => usedTypeIds.has(pt.id))
      .map(pt => ({ id: pt.id, label: pt.label, color: pt.color }));

    const hasTasks = Object.values(data.tasks || {}).flat().some(t => !t.done && t.due);
    if (hasTasks) {
      items.push({ id: "task", label: es ? "Tareas pendientes" : "Pending tasks", color: "#f59e0b" });
    }
    return items;
  }, [data.projects, data.tasks]);

  const handleEventClick = (e, evt) => {
    e.stopPropagation();
    if (evt.kind === "project") {
      go({ name: "project", id: evt.id });
    } else if (evt.kind === "task") {
      go({ name: "person", id: evt.ownerId });
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">{es ? "Calendario" : "Calendar"}</h1>
          <div className="page-sub">{es ? "Proyectos y tareas por fecha" : "Projects and tasks by date"}</div>
        </div>
      </div>

      {/* Legend */}
      {legendItems.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, padding: "10px 14px", background: "var(--bg-soft)", borderRadius: 8, border: "1px solid var(--line)" }}>
          {legendItems.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-2)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* Month navigation */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <button className="btn btn-sm btn-ghost" onClick={prevMonth} style={{ padding: "4px 10px" }}>
            <Icon name="chevron-left" />
          </button>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{monthNameCapitalized}</div>
          <button className="btn btn-sm btn-ghost" onClick={nextMonth} style={{ padding: "4px 10px" }}>
            <Icon name="chevron-right" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--line)" }}>
          {dowLabels.map(d => (
            <div key={d} style={{
              textAlign: "center",
              padding: "8px 4px",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-3)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {calendarDays.map((cell, idx) => {
            if (!cell) {
              return (
                <div key={"empty-" + idx} style={{
                  minHeight: 110,
                  borderRight: "1px solid var(--line)",
                  borderBottom: "1px solid var(--line)",
                  background: "var(--bg-soft)",
                  ...(idx % 7 === 6 ? { borderRight: "none" } : {}),
                }} />
              );
            }
            const { day, dateStr } = cell;
            const isToday = dateStr === todayStr;
            const events = eventsByDate[dateStr] || [];
            const visibleEvents = events.slice(0, 3);
            const moreCount = events.length - 3;

            return (
              <div key={dateStr} style={{
                minHeight: 110,
                maxHeight: 130,
                borderRight: idx % 7 === 6 ? "none" : "1px solid var(--line)",
                borderBottom: "1px solid var(--line)",
                padding: "6px 5px 4px",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                overflowY: "auto",
                background: "var(--bg)",
              }}>
                {/* Day number */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? "#fff" : "var(--ink)",
                    background: isToday ? "var(--accent)" : "transparent",
                    flexShrink: 0,
                  }}>{day}</div>
                </div>

                {/* Event chips */}
                {visibleEvents.map((evt, ei) => (
                  <div
                    key={evt.id + "-" + ei}
                    onClick={e => handleEventClick(e, evt)}
                    title={evt.label}
                    style={{
                      borderRadius: 4,
                      padding: "2px 5px",
                      fontSize: 10.5,
                      fontWeight: 500,
                      color: "#fff",
                      background: evt.color,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flexShrink: 0,
                      lineHeight: "16px",
                    }}>
                    {evt.kind === "task" ? "✓ " : ""}{evt.label}
                  </div>
                ))}

                {/* More indicator */}
                {moreCount > 0 && (
                  <div style={{
                    fontSize: 10,
                    color: "var(--ink-3)",
                    fontWeight: 600,
                    paddingLeft: 3,
                  }}>+{moreCount} {es ? "más" : "more"}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

window.CalendarView = CalendarView;
