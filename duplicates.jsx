// PROMEZA CRM — Duplicate detection and merge review

const _norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

const _phone = (s) => (s || "").replace(/\D/g, "");

const findDuplicatePairs = (personas, existingPairs = []) => {
  const dismissed = new Set(existingPairs.filter(p => p.dismissed).map(p => p.idA + "|" + p.idB));
  const pairs = [];
  const seen = new Set();

  for (let i = 0; i < personas.length; i++) {
    for (let j = i + 1; j < personas.length; j++) {
      const a = personas[i];
      const b = personas[j];
      const key = [a.id, b.id].sort().join("|");
      if (seen.has(key) || dismissed.has(key)) continue;
      seen.add(key);

      const aName = _norm(a.first + " " + a.last);
      const bName = _norm(b.first + " " + b.last);
      const aEmail = _norm(a.email);
      const bEmail = _norm(b.email);
      const aPhone = _phone(a.phone);
      const bPhone = _phone(b.phone);

      let score = 0;
      if (aEmail && bEmail && aEmail === bEmail) score += 3;
      if (aPhone.length >= 7 && bPhone.length >= 7 && aPhone === bPhone) score += 3;
      if (aName && bName && aName === bName) score += 2;

      if (score >= 2) pairs.push({ idA: a.id, idB: b.id, score, dismissed: false });
    }
  }

  return pairs.sort((a, b) => b.score - a.score);
};

// ─── Side-by-side field row ───

const DupField = ({ label, a, b }) => {
  const na = (a || "").toString().trim();
  const nb = (b || "").toString().trim();
  const diff = na !== nb && (na || nb);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "90px 1fr 1fr", gap: 10,
      padding: "7px 0", borderBottom: "1px solid var(--line)", alignItems: "start",
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--ink-4)", paddingTop: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: diff ? "var(--accent-700)" : "var(--ink-1)", fontWeight: diff ? 600 : 400 }}>
        {na || <span style={{ color: "var(--ink-5)" }}>—</span>}
      </div>
      <div style={{ fontSize: 13, color: diff ? "var(--accent-700)" : "var(--ink-1)", fontWeight: diff ? 600 : 400 }}>
        {nb || <span style={{ color: "var(--ink-5)" }}>—</span>}
      </div>
    </div>
  );
};

// ─── Duplicate Review Modal ───

const DuplicateReviewModal = ({ pairs, data, onMerge, onDismiss, onClose, t, lang }) => {
  const active = pairs.filter(p => !p.dismissed);

  if (active.length === 0) { onClose(); return null; }

  const cur = active[0];
  const pA = data.personas.find(p => p.id === cur.idA);
  const pB = data.personas.find(p => p.id === cur.idB);

  if (!pA || !pB) { onDismiss(cur); return null; }

  const entName = (le) => {
    const ent = data.entities.find(e => e.id === le.id);
    return ent ? ent.name : le.id;
  };

  const scoreLabel = cur.score >= 6
    ? (lang === "es" ? "Muy probable" : "Very likely")
    : cur.score >= 3
    ? (lang === "es" ? "Probable" : "Likely")
    : (lang === "es" ? "Posible" : "Possible");

  const scoreColor = cur.score >= 6 ? "var(--bad)" : cur.score >= 3 ? "#d97706" : "var(--ink-3)";

  return (
    <div className="modal-veil" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="modal" style={{ width: "min(820px,100%)" }} onClick={e => e.stopPropagation()}>

        <div className="modal-head">
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {lang === "es" ? "Revisar posibles duplicados" : "Review possible duplicates"}
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 500, color: "var(--ink-3)" }}>
                {active.length} {lang === "es" ? "por revisar" : "remaining"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: scoreColor, fontWeight: 600, marginTop: 2 }}>
              ⚠ {lang === "es" ? "Coincidencia:" : "Match:"} {scoreLabel}
              {cur.score >= 3 && " · " + (lang === "es" ? "Mismo email o teléfono" : "Same email or phone")}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>

        <div className="modal-body">
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr", gap: 10, marginBottom: 4 }}>
            <div />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="av-circle" style={{ background: pA.color, flexShrink: 0 }}>{initials(fullName(pA))}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{fullName(pA)}</div>
                <div style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>ID {pA.id}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="av-circle" style={{ background: pB.color, flexShrink: 0 }}>{initials(fullName(pB))}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{fullName(pB)}</div>
                <div style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>ID {pB.id}</div>
              </div>
            </div>
          </div>

          <DupField label={lang === "es" ? "Nombre" : "Name"} a={fullName(pA)} b={fullName(pB)} />
          <DupField label={lang === "es" ? "Cargo" : "Role"} a={t.roles[pA.role] || pA.roleOther || pA.role} b={t.roles[pB.role] || pB.roleOther || pB.role} />
          <DupField label="Email" a={pA.email} b={pB.email} />
          <DupField label={lang === "es" ? "Teléfono" : "Phone"} a={pA.phone} b={pB.phone} />
          <DupField label={lang === "es" ? "Ciudad" : "City"} a={pA.city} b={pB.city} />
          <DupField label={lang === "es" ? "País" : "Country"} a={pA.country} b={pB.country} />
          <DupField label={lang === "es" ? "Cumpleaños" : "Birthday"} a={pA.birthday} b={pB.birthday} />
          <DupField label={lang === "es" ? "Ú. contacto" : "Last contact"} a={pA.lastContact} b={pB.lastContact} />
          <DupField label="Tags" a={(pA.tags || []).join(", ")} b={(pB.tags || []).join(", ")} />
          <DupField
            label={lang === "es" ? "Entidades" : "Entities"}
            a={(pA.entities || []).map(entName).join(", ")}
            b={(pB.entities || []).map(entName).join(", ")}
          />

          <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg-soft)", borderRadius: 8, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6 }}>
            {lang === "es"
              ? "Al fusionar se combinan los campos (priorizando los no vacíos), se unen etiquetas y vínculos de entidades, y se eliminará el registro con ID menor. Los campos resaltados son diferentes entre los dos registros."
              : "On merge, fields are combined (non-empty preferred), tags and entity links are joined, and the lower-ID record is removed. Highlighted fields differ between the two records."}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" style={{ marginRight: "auto" }} onClick={onClose}>
            {lang === "es" ? "Revisar después" : "Review later"}
          </button>
          <button className="btn" onClick={() => onDismiss(cur)}>
            👥 {lang === "es" ? "Son personas distintas" : "Different people"}
          </button>
          <button className="btn btn-primary" onClick={() => onMerge(cur.idA, cur.idB)}>
            🔀 {lang === "es" ? "Fusionar — es la misma persona" : "Merge — same person"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Duplicates Page ───

const DuplicatesPage = ({ pairs, data, onMerge, onDismiss, onUndismiss, onScanAll, onCreateDemo, t, lang }) => {
  const [expanded, setExpanded] = React.useState(null);

  const active = pairs.filter(p => !p.dismissed);
  const dismissed = pairs.filter(p => p.dismissed);

  const toggle = (key) => setExpanded(k => k === key ? null : key);

  const ScoreBadge = ({ score }) => {
    const label = score >= 6
      ? (lang === "es" ? "Mismo email/tel." : "Same email/phone")
      : score >= 3
      ? (lang === "es" ? "Mismo teléfono" : "Same phone")
      : (lang === "es" ? "Mismo nombre" : "Same name");
    const color = score >= 6 ? "#dc2626" : score >= 3 ? "#d97706" : "#6b7280";
    return (
      <span style={{ fontSize: 11, fontWeight: 600, color, background: color + "18", padding: "2px 7px", borderRadius: 20 }}>
        ⚠ {label}
      </span>
    );
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{lang === "es" ? "Duplicados" : "Duplicates"}</h1>
          <div className="page-sub">
            {active.length > 0
              ? `${active.length} ${lang === "es" ? "pares pendientes de revisión" : "pairs pending review"}`
              : (lang === "es" ? "Sin duplicados pendientes" : "No pending duplicates")}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={onScanAll}>
            <Icon name="search" /> {lang === "es" ? "Escanear base completa" : "Scan full database"}
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {active.length === 0 && (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✓</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {lang === "es" ? "No hay duplicados pendientes" : "No pending duplicates"}
          </div>
          <div style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: 24, maxWidth: 440, margin: "0 auto 24px" }}>
            {lang === "es"
              ? "Los duplicados se detectan automáticamente al agregar o importar personas. También puedes escanear toda la base en cualquier momento."
              : "Duplicates are detected automatically when adding or importing people. You can also scan the full database at any time."}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn" onClick={onScanAll}>
              <Icon name="search" /> {lang === "es" ? "Escanear toda la base" : "Scan full database"}
            </button>
            <button className="btn btn-primary" onClick={onCreateDemo}>
              <Icon name="copy" /> {lang === "es" ? "Crear ejemplo de prueba" : "Create test example"}
            </button>
          </div>
        </div>
      )}

      {/* ── Active pairs ── */}
      {active.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {active.map((pair) => {
            const pA = data.personas.find(p => p.id === pair.idA);
            const pB = data.personas.find(p => p.id === pair.idB);
            if (!pA || !pB) return null;
            const key = pair.idA + pair.idB;
            const isOpen = expanded === key;

            return (
              <div key={key} className="card" style={{ overflow: "hidden" }}>
                {/* Summary row — click to expand */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", userSelect: "none" }}
                  onClick={() => toggle(key)}
                >
                  {/* Stacked avatars */}
                  <div style={{ display: "flex", flexShrink: 0 }}>
                    <div className="av-circle" style={{ background: pA.color }}>{initials(fullName(pA))}</div>
                    <div className="av-circle" style={{ background: pB.color, marginLeft: -10, boxShadow: "0 0 0 2px var(--bg)" }}>{initials(fullName(pB))}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {fullName(pA)} <span style={{ color: "var(--ink-4)", fontWeight: 400 }}>vs</span> {fullName(pB)}
                    </div>
                    <div style={{ marginTop: 3 }}>
                      <ScoreBadge score={pair.score} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    {!isOpen && (
                      <>
                        <button className="btn btn-sm" style={{ color: "var(--ink-3)" }}
                          onClick={e => { e.stopPropagation(); onDismiss(pair); }}>
                          {lang === "es" ? "Son distintos" : "Different"}
                        </button>
                        <button className="btn btn-sm btn-primary"
                          onClick={e => { e.stopPropagation(); toggle(key); }}>
                          {lang === "es" ? "Revisar" : "Review"}
                        </button>
                      </>
                    )}
                    <span style={{ color: "var(--ink-4)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded: side-by-side comparison */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--line)", padding: 16 }}>
                    {/* Column headers */}
                    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr", gap: 10, marginBottom: 8 }}>
                      <div />
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="av-circle" style={{ background: pA.color, flexShrink: 0 }}>{initials(fullName(pA))}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{fullName(pA)}</div>
                          <div style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>ID {pA.id}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="av-circle" style={{ background: pB.color, flexShrink: 0 }}>{initials(fullName(pB))}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{fullName(pB)}</div>
                          <div style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>ID {pB.id}</div>
                        </div>
                      </div>
                    </div>

                    <DupField label={lang === "es" ? "Nombre" : "Name"} a={fullName(pA)} b={fullName(pB)} />
                    <DupField label={lang === "es" ? "Cargo" : "Role"} a={t.roles[pA.role] || pA.roleOther || pA.role} b={t.roles[pB.role] || pB.roleOther || pB.role} />
                    <DupField label="Email" a={pA.email} b={pB.email} />
                    <DupField label={lang === "es" ? "Teléfono" : "Phone"} a={pA.phone} b={pB.phone} />
                    <DupField label={lang === "es" ? "Ciudad" : "City"} a={pA.city} b={pB.city} />
                    <DupField label={lang === "es" ? "País" : "Country"} a={pA.country} b={pB.country} />
                    <DupField label={lang === "es" ? "Cumpleaños" : "Birthday"} a={pA.birthday} b={pB.birthday} />
                    <DupField label={lang === "es" ? "Ú. contacto" : "Last contact"} a={pA.lastContact} b={pB.lastContact} />
                    <DupField label="Tags" a={(pA.tags || []).join(", ")} b={(pB.tags || []).join(", ")} />
                    <DupField
                      label={lang === "es" ? "Entidades" : "Entities"}
                      a={(pA.entities || []).map(le => { const e = data.entities.find(x => x.id === le.id); return e ? e.name : le.id; }).join(", ")}
                      b={(pB.entities || []).map(le => { const e = data.entities.find(x => x.id === le.id); return e ? e.name : le.id; }).join(", ")}
                    />

                    <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg-soft)", borderRadius: 8, fontSize: 12, color: "var(--ink-3)", marginBottom: 14 }}>
                      {lang === "es"
                        ? "Fusionar combina los datos (prefiere campos no vacíos), une etiquetas, vínculos y comentarios, y elimina el registro duplicado."
                        : "Merge combines data (non-empty fields preferred), joins tags, links and comments, and removes the duplicate record."}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" onClick={() => { onDismiss(pair); setExpanded(null); }}>
                        👥 {lang === "es" ? "Son personas distintas" : "Different people"}
                      </button>
                      <button className="btn btn-primary" onClick={() => { onMerge(pair.idA, pair.idB); setExpanded(null); }}>
                        🔀 {lang === "es" ? "Fusionar — es la misma persona" : "Merge — same person"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dismissed pairs ── */}
      {dismissed.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-4)", marginBottom: 8 }}>
            {lang === "es" ? "Revisados — personas distintas" : "Reviewed — different people"} ({dismissed.length})
          </div>
          {dismissed.map(pair => {
            const pA = data.personas.find(p => p.id === pair.idA);
            const pB = data.personas.find(p => p.id === pair.idB);
            if (!pA || !pB) return null;
            return (
              <div key={pair.idA + pair.idB} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "var(--bg-soft)", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--good)" }}>✓</span>
                <span style={{ flex: 1, color: "var(--ink-3)" }}>{fullName(pA)} · {fullName(pB)}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => onUndismiss(pair)}>
                  {lang === "es" ? "Deshacer" : "Undo"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

window.findDuplicatePairs = findDuplicatePairs;
window.DuplicateReviewModal = DuplicateReviewModal;
window.DuplicatesPage = DuplicatesPage;
