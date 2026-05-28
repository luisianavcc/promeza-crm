// PROMEZA CRM — Personas list + Entities list (with CSV export + import)

// ─── CSV parser (handles quoted fields) ───
const parseCSV = (text) => {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const parse = (line) => {
    const cols = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && !inQ) { inQ = true; }
      else if (c === '"' && inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"' && inQ) { inQ = false; }
      else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += c;
    }
    cols.push(cur.trim());
    return cols;
  };
  const headers = parse(lines[0]).map(h => h.toLowerCase().trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parse(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });
    rows.push(obj);
  }
  return { headers, rows };
};

// ─── Parse file to rows (CSV or XLSX) ───
const parseFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "csv") {
    reader.onload = (e) => {
      try { resolve(parseCSV(e.target.result)); }
      catch (err) { reject(err); }
    };
    reader.readAsText(file, "UTF-8");
  } else if (ext === "xlsx" || ext === "xls") {
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!raw.length) return resolve({ headers: [], rows: [] });
        const headers = raw[0].map(h => String(h).toLowerCase().trim());
        const rows = raw.slice(1).map(r => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = String(r[i] || ""); });
          return obj;
        });
        resolve({ headers, rows });
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  } else {
    reject(new Error("Formato no soportado. Usa .csv, .xlsx o .xls"));
  }
});

// ─── Column matcher ───
const findCol = (rowObj, aliases) => {
  const keys = Object.keys(rowObj);
  for (const alias of aliases) {
    const match = keys.find(k => k === alias || k.replace(/[^a-z0-9]/g, "") === alias.replace(/[^a-z0-9]/g, ""));
    if (match !== undefined) return rowObj[match] || "";
  }
  return "";
};

// ─── Import Modal ───
const ImportModal = ({ type, lang, onClose, onImport }) => {
  const [dragging, setDragging] = React.useState(false);
  const [preview, setPreview] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef();

  const isPersona = type === "personas";

  const mapPersonaRow = (row, idx, totalExisting) => {
    const first = findCol(row, ["nombre", "first", "first name", "given name"]);
    const last = findCol(row, ["apellido", "last", "last name", "surname"]);
    if (!first && !last) return null;
    const palette = ["#2F6BFF", "#0E7C66", "#B45309", "#7C3AED", "#BE185D", "#0369A1", "#15803D"];
    const color = palette[((first.charCodeAt(0) || 0)) % palette.length];
    const ig = findCol(row, ["instagram"]);
    const fb = findCol(row, ["facebook"]);
    const tiktok = findCol(row, ["tiktok"]);
    const x = findCol(row, ["x", "twitter", "x (twitter)"]);
    const tagsRaw = findCol(row, ["etiquetas", "tags", "labels"]);
    return {
      id: "p" + (totalExisting + idx + 1),
      first,
      last,
      role: findCol(row, ["cargo", "role", "puesto", "title", "position"]) || "otro",
      roleOther: "",
      email: findCol(row, ["email", "correo"]),
      phone: findCol(row, ["teléfono", "telefono", "phone", "celular", "móvil", "movil"]),
      address: findCol(row, ["dirección", "direccion", "address"]),
      zip: findCol(row, ["zip", "código postal", "codigo postal"]),
      city: findCol(row, ["ciudad", "city"]),
      state: findCol(row, ["estado/provincia", "state", "provincia"]),
      country: findCol(row, ["país", "pais", "country"]),
      lat: 0, lng: 0,
      website: findCol(row, ["sitio web", "web", "website"]),
      social: { ig, fb, tiktok, x },
      entities: [],
      tags: tagsRaw ? tagsRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : [],
      language: findCol(row, ["idioma", "language"]) || "es",
      status: "activo",
      stage: findCol(row, ["etapa pipeline", "etapa", "stage", "pipeline"]) || "conocido",
      source: findCol(row, ["fuente", "source", "origen"]),
      nextAction: findCol(row, ["próxima acción", "proxima accion", "next action", "proximaaccion"]),
      birthday: findCol(row, ["cumpleaños", "cumpleanios", "birthday"]),
      lastContact: findCol(row, ["último contacto", "ultimo contacto", "last contact"]),
      color,
    };
  };

  const mapEntityRow = (row, idx, totalExisting) => {
    const name = findCol(row, ["nombre", "name", "entidad"]);
    if (!name) return null;
    const ig = findCol(row, ["instagram"]);
    const fb = findCol(row, ["facebook"]);
    const tiktok = findCol(row, ["tiktok"]);
    const x = findCol(row, ["x", "twitter", "x (twitter)"]);
    const tagsRaw = findCol(row, ["etiquetas", "tags"]);
    const sizeRaw = findCol(row, ["tamaño", "tamano", "size", "miembros"]);
    return {
      id: "e" + (totalExisting + idx + 1),
      name,
      type: findCol(row, ["tipo", "type"]) || "ong",
      email: findCol(row, ["email", "correo"]),
      phone: findCol(row, ["teléfono", "telefono", "phone"]),
      address: findCol(row, ["dirección", "direccion", "address"]),
      zip: findCol(row, ["zip", "código postal"]),
      city: findCol(row, ["ciudad", "city"]),
      state: findCol(row, ["estado/provincia", "state", "provincia"]),
      country: findCol(row, ["país", "pais", "country"]),
      lat: 0, lng: 0,
      website: findCol(row, ["sitio web", "web", "website"]),
      social: { ig, fb, tiktok, x },
      size: sizeRaw ? parseInt(sizeRaw) || null : null,
      founded: findCol(row, ["año fundación", "ano fundacion", "founded", "fundacion"]),
      parent: null,
      tags: tagsRaw ? tagsRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : [],
    };
  };

  const handleFile = async (file) => {
    setError("");
    setPreview(null);
    setLoading(true);
    try {
      const { rows } = await parseFile(file);
      const mapped = rows
        .map((r, i) => isPersona ? mapPersonaRow(r, i, 0) : mapEntityRow(r, i, 0))
        .filter(Boolean);
      if (!mapped.length) throw new Error("No se encontraron registros válidos. Revisa que el archivo tenga columnas Nombre/Apellido.");
      setPreview({ file, rows: mapped });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const confirm = () => {
    if (preview) onImport(preview.rows);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const label = isPersona ? "Personas" : "Entidades";

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(520px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            <Icon name="upload" /> Importar {label}
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: "var(--accent-50)", border: "1px solid var(--accent-100)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
            <strong>Columnas reconocidas automáticamente:</strong><br />
            {isPersona
              ? "Nombre, Apellido, Cargo, Email, Teléfono, Dirección, ZIP, Ciudad, País, Instagram, Facebook, TikTok, X, Etiquetas, Idioma, Estado, Cumpleaños, Etapa Pipeline, Fuente, Próxima acción"
              : "Nombre, Tipo, Email, Teléfono, Dirección, ZIP, Ciudad, País, Instagram, Facebook, Sitio web, Tamaño, Año fundación, Etiquetas"
            }
          </div>

          <div
            onClick={() => inputRef.current && inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
              border: "2px dashed " + (dragging ? "var(--accent)" : "var(--line)"),
              borderRadius: 10, padding: "32px 20px", textAlign: "center",
              cursor: "pointer", background: dragging ? "var(--accent-50)" : "var(--bg-soft)",
              transition: "all .15s",
            }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {loading ? "Procesando…" : "Arrastra tu archivo aquí"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>o haz clic para seleccionar · CSV, XLSX o XLS</div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: "none" }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
            />
          </div>

          {error && (
            <div className="auth-error" style={{ marginTop: 12 }}>
              <Icon name="alert" size={14} /> {error}
            </div>
          )}

          {preview && (
            <div style={{ marginTop: 14, padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: "#166534", marginBottom: 6 }}>
                ✓ {preview.rows.length} {label.toLowerCase()} listas para importar
              </div>
              <div style={{ fontSize: 12, color: "#166534" }}>
                Archivo: <strong>{preview.file.name}</strong>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
                Primeros registros: {preview.rows.slice(0, 3).map(r => isPersona ? (r.first + " " + r.last) : r.name).join(" · ")}
                {preview.rows.length > 3 && " ···"}
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!preview} onClick={confirm}>
            <Icon name="check" /> Importar {preview ? preview.rows.length : ""} {label.toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Shared filter field helpers ───
const FField = ({ label, children }) => (
  <div className="field" style={{ marginBottom: 0 }}>
    <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--ink-3)", fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const PersonasList = ({ t, lang, data, go, onImportPersonas, globalQ = "", onBulkDelete, onBulkUpdateStatus, onBulkAddTag, onBulkAddTask, segments, onAddSegment, onDeleteSegment, users, currentUser }) => {
  const [role, setRole] = React.useState("all");
  const [country, setCountry] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState("all");
  const [langFilter, setLangFilter] = React.useState("all");
  const [city, setCity] = React.useState("");
  const [countyFilter, setCountyFilter] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState("");
  const [emailFilter, setEmailFilter] = React.useState("");
  const [phoneFilter, setPhoneFilter] = React.useState("");
  const [q, setQ] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const [bulkTag, setBulkTag] = React.useState("");
  const [showBulkTagInput, setShowBulkTagInput] = React.useState(false);
  const [showBulkTaskForm, setShowBulkTaskForm] = React.useState(false);
  const [bulkTaskText, setBulkTaskText] = React.useState("");
  const [bulkTaskDue, setBulkTaskDue] = React.useState("");
  const [bulkTaskAssignee, setBulkTaskAssignee] = React.useState("");
  const [savingSegment, setSavingSegment] = React.useState(false);
  const [segmentName, setSegmentName] = React.useState("");

  const countries = ["all", ...new Set(data.personas.map(p => p.country).filter(Boolean))];
  const roles = ["all", ...Object.keys(t.roles)];

  const stageOf = (p) => p.stage || (p.status === "inactivo" ? "inactivo" : "conocido");

  const rows = data.personas.filter(p => {
    if (role !== "all" && p.role !== role) return false;
    if (country !== "all" && p.country !== country) return false;
    if (status !== "all" && p.status !== status) return false;
    if (stageFilter !== "all" && stageOf(p) !== stageFilter) return false;
    if (langFilter !== "all" && p.language !== langFilter) return false;
    if (city && !(p.city || "").toLowerCase().includes(city.toLowerCase())) return false;
    if (countyFilter && !(p.county || "").toLowerCase().includes(countyFilter.toLowerCase())) return false;
    if (zip && !(p.zip || "").toLowerCase().includes(zip.toLowerCase())) return false;
    if (tagFilter && !(p.tags || []).some(tg => tg.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
    if (emailFilter && !(p.email || "").toLowerCase().includes(emailFilter.toLowerCase())) return false;
    if (phoneFilter && !(p.phone || "").toLowerCase().includes(phoneFilter.toLowerCase())) return false;
    const searchStr = (fullName(p) + " " + (p.email || "") + " " + (p.phone || "") + " " + (p.city || "") + " " + (p.tags || []).join(" ")).toLowerCase();
    if (q && !searchStr.includes(q.toLowerCase())) return false;
    if (globalQ && !searchStr.includes(globalQ.toLowerCase())) return false;
    return true;
  });

  const activeFilters = [role !== "all", country !== "all", status !== "all", stageFilter !== "all", langFilter !== "all", city, countyFilter, zip, tagFilter, emailFilter, phoneFilter, q].filter(Boolean).length;

  const clearFilters = () => {
    setRole("all"); setCountry("all"); setStatus("all"); setStageFilter("all"); setLangFilter("all");
    setCity(""); setCountyFilter(""); setZip(""); setTagFilter(""); setEmailFilter(""); setPhoneFilter(""); setQ("");
  };

  const currentFilters = { role, country, status, stageFilter, langFilter, city, countyFilter, zip, tagFilter, emailFilter, phoneFilter, q };
  const loadSegment = (seg) => {
    const f = seg.filters;
    setRole(f.role || "all"); setCountry(f.country || "all"); setStatus(f.status || "all");
    setStageFilter(f.stageFilter || "all"); setLangFilter(f.langFilter || "all");
    setCity(f.city || ""); setCountyFilter(f.countyFilter || ""); setZip(f.zip || ""); setTagFilter(f.tagFilter || "");
    setEmailFilter(f.emailFilter || ""); setPhoneFilter(f.phoneFilter || ""); setQ(f.q || "");
    setShowFilters(true);
  };
  const doSaveSegment = () => {
    if (!segmentName.trim()) return;
    onAddSegment && onAddSegment({ name: segmentName.trim(), filters: currentFilters });
    setSegmentName(""); setSavingSegment(false);
  };

  const entityById = Object.fromEntries(data.entities.map(e => [e.id, e]));

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(selected.size === rows.length ? new Set() : new Set(rows.map(p => p.id)));
  };

  const doExportCSV = () => {
    const headers = [
      { key: "id", label: "ID" },
      { key: "nombre", label: "Nombre" },
      { key: "apellido", label: "Apellido" },
      { key: "cargo", label: "Cargo" },
      { key: "email", label: "Email" },
      { key: "telefono", label: "Teléfono" },
      { key: "direccion", label: "Dirección" },
      { key: "zip", label: "ZIP" },
      { key: "ciudad", label: "Ciudad" },
      { key: "condado", label: "Condado" },
      { key: "estado", label: "Estado/Provincia" },
      { key: "pais", label: "País" },
      { key: "web", label: "Sitio web" },
      { key: "instagram", label: "Instagram" },
      { key: "facebook", label: "Facebook" },
      { key: "tiktok", label: "TikTok" },
      { key: "x", label: "X (Twitter)" },
      { key: "entidades", label: "Entidades vinculadas" },
      { key: "etiquetas", label: "Etiquetas" },
      { key: "idioma", label: "Idioma" },
      { key: "statusReg", label: "Estado" },
      { key: "etapa", label: "Etapa Pipeline" },
      { key: "fuente", label: "Fuente" },
      { key: "proximaAccion", label: "Próxima acción" },
      { key: "cumpleanos", label: "Cumpleaños" },
      { key: "ultimoContacto", label: "Último contacto" },
    ];
    const stageLabel = (id) => (window.PIPELINE_STAGES || []).find(s => s.id === id)?.label || id || "";
    const sourceLabel = (id) => (window.CONTACT_SOURCES || []).find(s => s.id === id)?.label || id || "";
    const csvRows = rows.map(p => ({
      id: p.id,
      nombre: p.first,
      apellido: p.last,
      cargo: p.role === "otro" ? (p.roleOther || "Otro") : (t.roles[p.role] || p.role),
      email: p.email,
      telefono: p.phone,
      direccion: p.address,
      zip: p.zip,
      ciudad: p.city,
      condado: p.county,
      estado: p.state,
      pais: p.country,
      web: p.website,
      instagram: p.social && p.social.ig,
      facebook: p.social && p.social.fb,
      tiktok: p.social && p.social.tiktok,
      x: p.social && p.social.x,
      entidades: (p.entities || []).map(le => entityById[le.id] ? entityById[le.id].name : "").filter(Boolean).join(" | "),
      etiquetas: (p.tags || []).join(", "),
      idioma: p.language,
      statusReg: p.status,
      etapa: stageLabel(p.stage || (p.status === "inactivo" ? "inactivo" : "conocido")),
      fuente: sourceLabel(p.source),
      proximaAccion: p.nextAction,
      cumpleanos: p.birthday,
      ultimoContacto: p.lastContact,
    }));
    exportCSV("promeza-personas-" + new Date().toISOString().slice(0, 10) + ".csv", headers, csvRows);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav.personas}</h1>
          <div className="page-sub">
            {rows.length} {t.common.count.toLowerCase()}
            {activeFilters > 0 && <span style={{ color: "var(--accent)", fontWeight: 600 }}> · {activeFilters} {lang === "es" ? "filtros activos" : "active filters"}</span>}
          </div>
        </div>
        <div className="page-actions">
          <button className={"btn" + (showFilters || activeFilters > 0 ? " btn-primary" : "")} onClick={() => setShowFilters(v => !v)}>
            <Icon name="filter" /> {lang === "es" ? "Filtrar" : "Filter"}{activeFilters > 0 ? ` (${activeFilters})` : ""}
          </button>
          <button className="btn" onClick={doExportCSV} title={lang === "es" ? `Exportar ${rows.length} de ${data.personas.length} personas` : `Export ${rows.length} of ${data.personas.length} people`}>
            <Icon name="download" /> {t.common.exportCSV}{rows.length < data.personas.length ? ` (${rows.length})` : ""}
          </button>
          <button className="btn" onClick={() => setShowImport(true)}>
            <Icon name="upload" /> Importar
          </button>
          <button className="btn btn-primary" onClick={() => go({ name: "new-person" })}>
            <Icon name="plus" /> {t.nav.newPerson}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: 12, padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 16px", marginBottom: 14 }}>
            <FField label={lang === "es" ? "Buscar (nombre, ciudad…)" : "Search (name, city…)"}>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.placeholders.search} />
            </FField>
            <FField label="Email">
              <input value={emailFilter} onChange={e => setEmailFilter(e.target.value)} placeholder="@gmail.com, nombre…" />
            </FField>
            <FField label={lang === "es" ? "Teléfono" : "Phone"}>
              <input value={phoneFilter} onChange={e => setPhoneFilter(e.target.value)} placeholder="+1 305…" />
            </FField>
            <FField label={lang === "es" ? "Ciudad" : "City"}>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Miami, Bogotá…" />
            </FField>
            <FField label={lang === "es" ? "Condado" : "County"}>
              <input value={countyFilter} onChange={e => setCountyFilter(e.target.value)} placeholder={lang === "es" ? "Ventura, Los Ángeles…" : "Ventura, Los Angeles…"} />
            </FField>
            <FField label="ZIP">
              <input value={zip} onChange={e => setZip(e.target.value)} placeholder="33101…" />
            </FField>
            <FField label={lang === "es" ? "País" : "Country"}>
              <select value={country} onChange={e => setCountry(e.target.value)}>
                {countries.map(c => <option key={c} value={c}>{c === "all" ? (lang === "es" ? "Todos" : "All") : c}</option>)}
              </select>
            </FField>
            <FField label={t.common.language}>
              <select value={langFilter} onChange={e => setLangFilter(e.target.value)}>
                <option value="all">{lang === "es" ? "Todos" : "All"}</option>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </FField>
            <FField label={t.common.tags}>
              <input value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder={lang === "es" ? "vip, liderazgo…" : "vip, leadership…"} />
            </FField>
          </div>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", minWidth: 52 }}>{t.common.role}:</span>
              {roles.map(r => (
                <button key={r} className={"chip " + (role === r ? "on" : "")} onClick={() => setRole(r)}>
                  {r === "all" ? t.common.all : t.roles[r]}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", minWidth: 52 }}>Etapa:</span>
              <button className={"chip " + (stageFilter === "all" ? "on" : "")} onClick={() => setStageFilter("all")}>{t.common.all}</button>
              {(window.PIPELINE_STAGES || []).map(s => (
                <button key={s.id} onClick={() => setStageFilter(s.id)} style={{
                  padding: "3px 10px", borderRadius: 20, border: "1.5px solid",
                  borderColor: stageFilter === s.id ? s.color : "var(--line)",
                  background: stageFilter === s.id ? s.bg : "transparent",
                  color: stageFilter === s.id ? s.color : "var(--ink-3)",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className="btn btn-sm" onClick={clearFilters} disabled={activeFilters === 0} style={{ opacity: activeFilters === 0 ? 0.4 : 1 }}>
                <Icon name="x" /> {lang === "es" ? "Limpiar" : "Clear"}
              </button>
              {activeFilters > 0 && !savingSegment && (
                <button className="btn btn-sm" onClick={() => setSavingSegment(true)}>
                  <Icon name="plus" /> {lang === "es" ? "Guardar vista" : "Save view"}
                </button>
              )}
              {savingSegment && (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={segmentName} onChange={e => setSegmentName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && doSaveSegment()}
                    placeholder={lang === "es" ? "Nombre del segmento…" : "Segment name…"}
                    style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", fontFamily: "inherit" }} autoFocus />
                  <button className="btn btn-sm btn-primary" disabled={!segmentName.trim()} onClick={doSaveSegment}><Icon name="check" /></button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setSavingSegment(false)}><Icon name="x" /></button>
                </div>
              )}
            </div>
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}>
              <strong style={{ color: "var(--ink-1)" }}>{rows.length}</strong> {lang === "es" ? "de" : "of"} {data.personas.length}
            </span>
          </div>
        </div>
      )}

      {/* Saved segments */}
      {(segments || []).length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
            {lang === "es" ? "Vistas:" : "Views:"}
          </span>
          {(segments || []).map(seg => (
            <div key={seg.id} style={{ display: "flex", alignItems: "center", background: "var(--accent-50)", borderRadius: 20, overflow: "hidden" }}>
              <button onClick={() => loadSegment(seg)} style={{ padding: "3px 10px", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--accent)", fontFamily: "inherit" }}>{seg.name}</button>
              <button onClick={() => onDeleteSegment && onDeleteSegment(seg.id)} style={{ padding: "3px 7px 3px 2px", background: "none", border: "none", cursor: "pointer", color: "var(--ink-4)", fontFamily: "inherit" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {showImport && (
        <ImportModal
          type="personas"
          lang={lang}
          onClose={() => setShowImport(false)}
          onImport={(rows) => {
            const withIds = rows.map((r, i) => ({ ...r, id: "p" + (data.personas.length + i + 1) }));
            onImportPersonas(withIds);
            setShowImport(false);
          }}
        />
      )}

      {selected.size === 0 && rows.length > 0 && activeFilters > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", marginBottom: 12, background: "var(--accent-50)", border: "1px solid var(--accent-100)", borderRadius: 10, fontSize: 13 }}>
          <span style={{ color: "var(--ink-2)" }}>
            <strong>{rows.length}</strong> {lang === "es" ? "personas coinciden con los filtros" : "people match the filters"}
          </span>
          <button className="btn btn-sm btn-primary" style={{ marginLeft: "auto" }}
            onClick={() => setSelected(new Set(rows.map(p => p.id)))}>
            <Icon name="check" /> {lang === "es" ? `Seleccionar los ${rows.length}` : `Select all ${rows.length}`}
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#0f1530", color: "#fff",
          borderRadius: 12, padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", zIndex: 900,
          flexWrap: "wrap",
        }}>
          <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>{selected.size} {lang === "es" ? "seleccionadas" : "selected"}</span>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />
          <button className="btn btn-sm" style={{ color: "#86efac", borderColor: "rgba(134,239,172,0.4)", background: "transparent" }}
            onClick={() => { onBulkUpdateStatus && onBulkUpdateStatus(selected, { status: "activo" }); setSelected(new Set()); }}>
            <Icon name="check" /> {lang === "es" ? "Activar" : "Activate"}
          </button>
          <button className="btn btn-sm" style={{ color: "#fca5a5", borderColor: "rgba(252,165,165,0.4)", background: "transparent" }}
            onClick={() => { onBulkUpdateStatus && onBulkUpdateStatus(selected, { status: "inactivo" }); setSelected(new Set()); }}>
            <Icon name="x" /> {lang === "es" ? "Inactivar" : "Deactivate"}
          </button>
          {!showBulkTagInput ? (
            <button className="btn btn-sm" style={{ color: "#fde68a", borderColor: "rgba(253,230,138,0.4)", background: "transparent" }}
              onClick={() => setShowBulkTagInput(true)}>
              <Icon name="tag" /> {lang === "es" ? "Etiquetar" : "Tag"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                autoFocus
                value={bulkTag}
                onChange={e => setBulkTag(e.target.value)}
                placeholder={lang === "es" ? "etiqueta…" : "tag…"}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 13, width: 120, fontFamily: "inherit" }}
                onKeyDown={e => {
                  if (e.key === "Enter" && bulkTag.trim()) {
                    onBulkAddTag && onBulkAddTag(selected, bulkTag.trim());
                    setBulkTag(""); setShowBulkTagInput(false); setSelected(new Set());
                  }
                  if (e.key === "Escape") { setShowBulkTagInput(false); setBulkTag(""); }
                }}
              />
              <button className="btn btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", background: "transparent" }}
                disabled={!bulkTag.trim()}
                onClick={() => {
                  onBulkAddTag && onBulkAddTag(selected, bulkTag.trim());
                  setBulkTag(""); setShowBulkTagInput(false); setSelected(new Set());
                }}>OK</button>
              <button className="btn btn-sm" style={{ color: "rgba(255,255,255,0.5)", borderColor: "transparent", background: "transparent" }}
                onClick={() => { setShowBulkTagInput(false); setBulkTag(""); }}>
                <Icon name="x" size={13} />
              </button>
            </div>
          )}
          {!showBulkTaskForm ? (
            <button className="btn btn-sm" style={{ color: "#a5b4fc", borderColor: "rgba(165,180,252,0.4)", background: "transparent" }}
              onClick={() => { setShowBulkTaskForm(true); setShowBulkTagInput(false); }}>
              <Icon name="check" /> {lang === "es" ? "Tarea" : "Task"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <input
                autoFocus
                value={bulkTaskText}
                onChange={e => setBulkTaskText(e.target.value)}
                placeholder={lang === "es" ? "Descripción de la tarea…" : "Task description…"}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 13, width: 200, fontFamily: "inherit" }}
              />
              <input
                type="date"
                value={bulkTaskDue}
                onChange={e => setBulkTaskDue(e.target.value)}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 13, width: 130, fontFamily: "inherit" }}
              />
              {(users || []).length > 0 && (
                <select
                  value={bulkTaskAssignee}
                  onChange={e => setBulkTaskAssignee(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 13, fontFamily: "inherit" }}>
                  <option value="" style={{ color: "#000" }}>{lang === "es" ? "Sin asignar" : "Unassigned"}</option>
                  {(users || []).map(u => <option key={u.email} value={u.email} style={{ color: "#000" }}>{u.name}</option>)}
                </select>
              )}
              <button className="btn btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", background: "transparent" }}
                disabled={!bulkTaskText.trim()}
                onClick={() => {
                  if (!bulkTaskText.trim()) return;
                  const today = new Date().toISOString().slice(0, 10);
                  selected.forEach(pid => {
                    onBulkAddTask && onBulkAddTask(pid, {
                      id: "t" + Date.now() + Math.random().toString(36).slice(2, 6),
                      text: bulkTaskText.trim(), due: bulkTaskDue, done: false,
                      createdAt: today, assignedTo: bulkTaskAssignee || null,
                    });
                  });
                  setBulkTaskText(""); setBulkTaskDue(""); setBulkTaskAssignee("");
                  setShowBulkTaskForm(false); setSelected(new Set());
                }}>
                <Icon name="check" /> {lang === "es" ? `Asignar a ${selected.size}` : `Assign to ${selected.size}`}
              </button>
              <button className="btn btn-sm" style={{ color: "rgba(255,255,255,0.5)", borderColor: "transparent", background: "transparent" }}
                onClick={() => { setShowBulkTaskForm(false); setBulkTaskText(""); }}>
                <Icon name="x" size={13} />
              </button>
            </div>
          )}
          <button className="btn btn-sm" style={{ color: "#fca5a5", borderColor: "rgba(252,165,165,0.4)", background: "transparent" }}
            onClick={() => { onBulkDelete && onBulkDelete(selected); setSelected(new Set()); }}>
            <Icon name="trash" /> {lang === "es" ? "Eliminar" : "Delete"}
          </button>
          <button className="btn btn-sm" style={{ color: "rgba(255,255,255,0.45)", borderColor: "transparent", background: "transparent" }}
            onClick={() => { setSelected(new Set()); setShowBulkTaskForm(false); setShowBulkTagInput(false); }}>
            <Icon name="x" />
          </button>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 32, paddingRight: 0 }}>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < rows.length; }}
                  onChange={toggleSelectAll}
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th style={{ width: 280 }}>{t.common.profile}</th>
              <th>{t.common.role}</th>
              <th>{t.common.relatedEntities}</th>
              <th>{t.common.contact}</th>
              <th>{t.common.address}</th>
              <th>{t.common.lastContact}</th>
              <th>{t.common.tags}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} onClick={() => go({ name: "person", id: p.id })}
                style={{ background: selected.has(p.id) ? "var(--accent-50)" : undefined }}>
                <td style={{ paddingRight: 0 }} onClick={e => toggleSelect(e, p.id)}>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => {}}
                    style={{ cursor: "pointer" }}
                  />
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="av-circle" style={{ background: p.color }}>{initials(fullName(p))}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{fullName(p)}</div>
                      <div className="num">{p.id.toUpperCase()} · <span className={"status-dot " + (p.status === "inactivo" ? "off" : "")} />{t.common[p.status === "inactivo" ? "inactivos" : "activos"]}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="role-pill">{p.role === "otro" ? (p.roleOther || t.roles.otro) : t.roles[p.role]}</span>
                </td>
                <td>
                  {(!p.entities || p.entities.length === 0) ? <span className="muted">—</span> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {p.entities.slice(0, 2).map(le => {
                        const ent = entityById[le.id];
                        return ent ? <span key={le.id} style={{ fontSize: 12.5 }}>{ent.name}</span> : null;
                      })}
                      {p.entities.length > 2 && <span className="muted" style={{ fontSize: 11 }}>+{p.entities.length - 2}</span>}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: 12.5 }}>{p.email}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{p.phone}</div>
                </td>
                <td><div style={{ fontSize: 12.5 }}>{p.city}{p.county ? <span style={{ color: "var(--accent)", marginLeft: 4, fontSize: 11, fontWeight: 600 }}>· {p.county}</span> : ""}</div><div className="muted" style={{ fontSize: 12 }}>{p.country}</div></td>
                <td className="num">{fmtDate(p.lastContact, lang)}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(p.tags || []).map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">{t.common.noResults}</div>}
      </div>
    </div>
  );
};

const EntitiesList = ({ t, lang, data, go, onImportEntities, globalQ = "" }) => {
  const [type, setType] = React.useState("all");
  const [country, setCountry] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [city, setCity] = React.useState("");
  const [countyFilter, setCountyFilter] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState("");
  const [emailFilter, setEmailFilter] = React.useState("");
  const [phoneFilter, setPhoneFilter] = React.useState("");
  const [q, setQ] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);

  const types = ["all", ...Object.keys(t.types)];
  const countries = ["all", ...new Set(data.entities.map(e => e.country).filter(Boolean))];

  const personasByEntity = {};
  data.personas.forEach(p => (p.entities || []).forEach(le => {
    personasByEntity[le.id] = (personasByEntity[le.id] || 0) + 1;
  }));

  const rows = data.entities.filter(e => {
    if (type !== "all" && e.type !== type) return false;
    if (country !== "all" && e.country !== country) return false;
    if (status !== "all" && (e.status || "activo") !== status) return false;
    if (city && !(e.city || "").toLowerCase().includes(city.toLowerCase())) return false;
    if (countyFilter && !(e.county || "").toLowerCase().includes(countyFilter.toLowerCase())) return false;
    if (zip && !(e.zip || "").toLowerCase().includes(zip.toLowerCase())) return false;
    if (tagFilter && !(e.tags || []).some(tg => tg.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
    if (emailFilter && !(e.email || "").toLowerCase().includes(emailFilter.toLowerCase())) return false;
    if (phoneFilter && !(e.phone || "").toLowerCase().includes(phoneFilter.toLowerCase())) return false;
    const searchStr = (e.name + " " + (e.email || "") + " " + (e.phone || "") + " " + (e.city || "") + " " + (e.country || "")).toLowerCase();
    if (q && !searchStr.includes(q.toLowerCase())) return false;
    if (globalQ && !searchStr.includes(globalQ.toLowerCase())) return false;
    return true;
  });

  const activeFilters = [type !== "all", country !== "all", status !== "all", city, countyFilter, zip, tagFilter, emailFilter, phoneFilter, q].filter(Boolean).length;

  const clearFilters = () => {
    setType("all"); setCountry("all"); setStatus("all");
    setCity(""); setCountyFilter(""); setZip(""); setTagFilter(""); setEmailFilter(""); setPhoneFilter(""); setQ("");
  };

  const doExportCSV = () => {
    const headers = [
      { key: "id", label: "ID" },
      { key: "nombre", label: "Nombre" },
      { key: "tipo", label: "Tipo" },
      { key: "email", label: "Email" },
      { key: "telefono", label: "Teléfono" },
      { key: "direccion", label: "Dirección" },
      { key: "zip", label: "ZIP" },
      { key: "ciudad", label: "Ciudad" },
      { key: "condado", label: "Condado" },
      { key: "estado", label: "Estado/Provincia" },
      { key: "pais", label: "País" },
      { key: "web", label: "Sitio web" },
      { key: "instagram", label: "Instagram" },
      { key: "facebook", label: "Facebook" },
      { key: "tiktok", label: "TikTok" },
      { key: "x", label: "X (Twitter)" },
      { key: "tamano", label: "Tamaño (miembros)" },
      { key: "fundacion", label: "Año fundación" },
      { key: "etiquetas", label: "Etiquetas" },
      { key: "personasVinculadas", label: "Personas vinculadas" },
    ];
    const csvRows = rows.map(e => ({
      id: e.id,
      nombre: e.name,
      tipo: t.types[e.type] || e.type,
      email: e.email,
      telefono: e.phone,
      direccion: e.address,
      zip: e.zip,
      ciudad: e.city,
      condado: e.county,
      estado: e.state,
      pais: e.country,
      web: e.website,
      instagram: e.social && e.social.ig,
      facebook: e.social && e.social.fb,
      tiktok: e.social && e.social.tiktok,
      x: e.social && e.social.x,
      tamano: e.size,
      fundacion: e.founded,
      etiquetas: (e.tags || []).join(", "),
      personasVinculadas: personasByEntity[e.id] || 0,
    }));
    exportCSV("promeza-entidades-" + new Date().toISOString().slice(0, 10) + ".csv", headers, csvRows);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav.entities}</h1>
          <div className="page-sub">
            {rows.length} {t.common.count.toLowerCase()}
            {activeFilters > 0 && <span style={{ color: "var(--accent)", fontWeight: 600 }}> · {activeFilters} {lang === "es" ? "filtros activos" : "active filters"}</span>}
          </div>
        </div>
        <div className="page-actions">
          <button className={"btn" + (showFilters || activeFilters > 0 ? " btn-primary" : "")} onClick={() => setShowFilters(v => !v)}>
            <Icon name="filter" /> {lang === "es" ? "Filtrar" : "Filter"}{activeFilters > 0 ? ` (${activeFilters})` : ""}
          </button>
          <button className="btn" onClick={doExportCSV} title={lang === "es" ? `Exportar ${rows.length} de ${data.entities.length} entidades` : `Export ${rows.length} of ${data.entities.length} entities`}>
            <Icon name="download" /> {t.common.exportCSV}{rows.length < data.entities.length ? ` (${rows.length})` : ""}
          </button>
          <button className="btn" onClick={() => setShowImport(true)}>
            <Icon name="upload" /> Importar
          </button>
          <button className="btn btn-primary" onClick={() => go({ name: "new-entity" })}>
            <Icon name="plus" /> {t.nav.newEntity}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: 12, padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 16px", marginBottom: 14 }}>
            <FField label={lang === "es" ? "Buscar (nombre, ciudad…)" : "Search (name, city…)"}>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.placeholders.search} />
            </FField>
            <FField label="Email">
              <input value={emailFilter} onChange={e => setEmailFilter(e.target.value)} placeholder="@iglesia.com…" />
            </FField>
            <FField label={lang === "es" ? "Teléfono" : "Phone"}>
              <input value={phoneFilter} onChange={e => setPhoneFilter(e.target.value)} placeholder="+1 305…" />
            </FField>
            <FField label={lang === "es" ? "Ciudad" : "City"}>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Miami, Bogotá…" />
            </FField>
            <FField label={lang === "es" ? "Condado" : "County"}>
              <input value={countyFilter} onChange={e => setCountyFilter(e.target.value)} placeholder={lang === "es" ? "Ventura, Los Ángeles…" : "Ventura, Los Angeles…"} />
            </FField>
            <FField label="ZIP">
              <input value={zip} onChange={e => setZip(e.target.value)} placeholder="33101…" />
            </FField>
            <FField label={lang === "es" ? "País" : "Country"}>
              <select value={country} onChange={e => setCountry(e.target.value)}>
                {countries.map(c => <option key={c} value={c}>{c === "all" ? (lang === "es" ? "Todos" : "All") : c}</option>)}
              </select>
            </FField>
            <FField label={t.common.tags}>
              <input value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder={lang === "es" ? "hispana, matriz…" : "hispanic, main…"} />
            </FField>
          </div>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", minWidth: 52 }}>{t.common.type}:</span>
              {types.map(tp => (
                <button key={tp} className={"chip " + (type === tp ? "on" : "")} onClick={() => setType(tp)}>
                  {tp === "all" ? t.common.all : t.types[tp]}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", minWidth: 52 }}>{t.common.status}:</span>
              {["all", "activo", "inactivo"].map(s => (
                <button key={s} className={"chip " + (status === s ? "on" : "")} onClick={() => setStatus(s)}>
                  {s === "all" ? t.common.all : t.common[s === "activo" ? "activos" : "inactivos"]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn btn-sm" onClick={clearFilters} disabled={activeFilters === 0} style={{ opacity: activeFilters === 0 ? 0.4 : 1 }}>
              <Icon name="x" /> {lang === "es" ? "Limpiar filtros" : "Clear filters"}
            </button>
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}>
              <strong style={{ color: "var(--ink-1)" }}>{rows.length}</strong> {lang === "es" ? "de" : "of"} {data.entities.length} {t.nav.entities.toLowerCase()} {lang === "es" ? "se exportarán" : "will be exported"}
            </span>
          </div>
        </div>
      )}

      {showImport && (
        <ImportModal
          type="entidades"
          lang={lang}
          onClose={() => setShowImport(false)}
          onImport={(rows) => {
            const withIds = rows.map((r, i) => ({ ...r, id: "e" + (data.entities.length + i + 1) }));
            onImportEntities(withIds);
            setShowImport(false);
          }}
        />
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 320 }}>{t.common.profile}</th>
              <th>{t.common.type}</th>
              <th>{t.common.address}</th>
              <th>{t.common.contact}</th>
              <th>{t.common.relatedPersonas}</th>
              <th>{t.common.size}</th>
              <th>{t.common.tags}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.id} onClick={() => go({ name: "entity", id: e.id })}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="ent-icon"><Icon name="building" /></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{e.name}</div>
                      <div className="num">{e.id.toUpperCase()} · <span className={"status-dot " + ((e.status || "activo") === "inactivo" ? "off" : "")} />{t.common[(e.status || "activo") === "inactivo" ? "inactivos" : "activos"]}</div>
                    </div>
                  </div>
                </td>
                <td><span className="role-pill muted">{t.types[e.type]}</span></td>
                <td><div style={{ fontSize: 12.5 }}>{e.city}{e.county ? <span style={{ color: "var(--accent)", marginLeft: 4, fontSize: 11, fontWeight: 600 }}>· {e.county}</span> : ""}</div><div className="muted" style={{ fontSize: 12 }}>{e.state}, {e.country}</div></td>
                <td>
                  <div style={{ fontSize: 12.5 }}>{e.email}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{e.phone}</div>
                </td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon name="users" />
                    <strong>{personasByEntity[e.id] || 0}</strong>
                  </span>
                </td>
                <td className="num">{e.size != null ? e.size.toLocaleString() : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(e.tags || []).map(tg => <span key={tg} className="tag-chip">{tg}</span>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">{t.common.noResults}</div>}
      </div>
    </div>
  );
};

window.PersonasList = PersonasList;
window.EntitiesList = EntitiesList;
