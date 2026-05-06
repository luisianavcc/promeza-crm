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
      status: findCol(row, ["estado", "status"]) || "activo",
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
              ? "Nombre, Apellido, Cargo, Email, Teléfono, Dirección, ZIP, Ciudad, País, Instagram, Facebook, TikTok, X, Etiquetas, Idioma, Estado, Cumpleaños"
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

const PersonasList = ({ t, lang, data, go, onImportPersonas }) => {
  const [role, setRole] = React.useState("all");
  const [country, setCountry] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [showImport, setShowImport] = React.useState(false);

  const countries = ["all", ...new Set(data.personas.map(p => p.country))];
  const roles = ["all", ...Object.keys(t.roles)];

  const rows = data.personas.filter(p => {
    if (role !== "all" && p.role !== role) return false;
    if (country !== "all" && p.country !== country) return false;
    if (status !== "all" && p.status !== status) return false;
    if (q) {
      const s = (fullName(p) + " " + p.email + " " + p.city + " " + (p.tags || []).join(" ")).toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const entityById = Object.fromEntries(data.entities.map(e => [e.id, e]));

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
      { key: "cumpleanos", label: "Cumpleaños" },
      { key: "ultimoContacto", label: "Último contacto" },
    ];
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
      cumpleanos: p.birthday,
      ultimoContacto: p.lastContact,
    }));
    const dateStr = new Date().toISOString().slice(0, 10);
    exportCSV("promeza-personas-" + dateStr + ".csv", headers, csvRows);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav.personas}</h1>
          <div className="page-sub">{rows.length} {t.common.count.toLowerCase()}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={doExportCSV}>
            <Icon name="download" /> {t.common.exportCSV}
          </button>
          <button className="btn" onClick={() => setShowImport(true)}>
            <Icon name="upload" /> Importar
          </button>
          <button className="btn btn-primary" onClick={() => go({ name: "new-person" })}>
            <Icon name="plus" /> {t.nav.newPerson}
          </button>
        </div>
      </div>

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

      <div className="card">
        <div className="filters">
          <div style={{ position: "relative", minWidth: 240 }}>
            <span style={{ position: "absolute", left: 10, top: 8, color: "var(--ink-4)" }}><Icon name="search" /></span>
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder={t.placeholders.search}
              style={{ height: 32, padding: "0 10px 0 32px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, background: "var(--bg-soft)", width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 600, marginRight: 4 }}>{t.common.role}:</span>
            {roles.map(r => (
              <button key={r} className={"chip " + (role === r ? "on" : "")} onClick={() => setRole(r)}>
                {r === "all" ? t.common.all : t.roles[r]}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 600, marginRight: 4 }}>{t.common.status}:</span>
            {["all", "activo", "inactivo"].map(s => (
              <button key={s} className={"chip " + (status === s ? "on" : "")} onClick={() => setStatus(s)}>
                {s === "all" ? t.common.all : t.common[s === "activo" ? "activos" : "inactivos"]}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ height: 32, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", fontSize: 13 }}>
              {countries.map(c => <option key={c} value={c}>{c === "all" ? (lang === "es" ? "Todos los países" : "All countries") : c}</option>)}
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
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
              <tr key={p.id} onClick={() => go({ name: "person", id: p.id })}>
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
                <td><div style={{ fontSize: 12.5 }}>{p.city}</div><div className="muted" style={{ fontSize: 12 }}>{p.country}</div></td>
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

const EntitiesList = ({ t, lang, data, go, onImportEntities }) => {
  const [type, setType] = React.useState("all");
  const [country, setCountry] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [showImport, setShowImport] = React.useState(false);

  const types = ["all", ...Object.keys(t.types)];
  const countries = ["all", ...new Set(data.entities.map(e => e.country))];

  const personasByEntity = {};
  data.personas.forEach(p => (p.entities || []).forEach(le => {
    personasByEntity[le.id] = (personasByEntity[le.id] || 0) + 1;
  }));

  const rows = data.entities.filter(e => {
    if (type !== "all" && e.type !== type) return false;
    if (country !== "all" && e.country !== country) return false;
    if (q) {
      const s = (e.name + " " + e.city + " " + e.country).toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  });

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
    const dateStr = new Date().toISOString().slice(0, 10);
    exportCSV("promeza-entidades-" + dateStr + ".csv", headers, csvRows);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav.entities}</h1>
          <div className="page-sub">{rows.length} {t.common.count.toLowerCase()}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={doExportCSV}>
            <Icon name="download" /> {t.common.exportCSV}
          </button>
          <button className="btn" onClick={() => setShowImport(true)}>
            <Icon name="upload" /> Importar
          </button>
          <button className="btn btn-primary" onClick={() => go({ name: "new-entity" })}>
            <Icon name="plus" /> {t.nav.newEntity}
          </button>
        </div>
      </div>

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
        <div className="filters">
          <div style={{ position: "relative", minWidth: 240 }}>
            <span style={{ position: "absolute", left: 10, top: 8, color: "var(--ink-4)" }}><Icon name="search" /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.placeholders.search}
              style={{ height: 32, padding: "0 10px 0 32px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, background: "var(--bg-soft)", width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 600, marginRight: 4 }}>{t.common.type}:</span>
            {types.map(tp => (
              <button key={tp} className={"chip " + (type === tp ? "on" : "")} onClick={() => setType(tp)}>
                {tp === "all" ? t.common.all : t.types[tp]}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto" }}>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ height: 32, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", fontSize: 13 }}>
              {countries.map(c => <option key={c} value={c}>{c === "all" ? (lang === "es" ? "Todos los países" : "All countries") : c}</option>)}
            </select>
          </div>
        </div>

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
                      <div className="num">{e.id.toUpperCase()} · {e.founded}</div>
                    </div>
                  </div>
                </td>
                <td><span className="role-pill muted">{t.types[e.type]}</span></td>
                <td><div style={{ fontSize: 12.5 }}>{e.city}</div><div className="muted" style={{ fontSize: 12 }}>{e.state}, {e.country}</div></td>
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
