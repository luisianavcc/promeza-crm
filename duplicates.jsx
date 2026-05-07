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

window.findDuplicatePairs = findDuplicatePairs;
window.DuplicateReviewModal = DuplicateReviewModal;
