// PROMEZA CRM — File Attachments tab

const MAX_FILE_MB = 3;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const MIME_ICONS = {
  "application/pdf": "📄",
  "image/png": "🖼️",
  "image/jpeg": "🖼️",
  "image/jpg": "🖼️",
  "image/gif": "🖼️",
  "image/webp": "🖼️",
  "image/heic": "🖼️",
};

const fileIcon = (type) => MIME_ICONS[type] || "📎";

const fmtBytes = (b) => {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
};

const AttachmentsTab = ({ targetId, attachments, onAdd, onDelete, lang, currentUser }) => {
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef();

  const totalBytes = (attachments || []).reduce((s, a) => s + (a.size || 0), 0);
  const storageWarning = totalBytes > 4 * 1024 * 1024;

  const handleFiles = async (files) => {
    setError("");
    setUploading(true);
    const results = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setError((lang === "es" ? `"${file.name}" supera el límite de ${MAX_FILE_MB} MB` : `"${file.name}" exceeds the ${MAX_FILE_MB} MB limit`));
        setUploading(false);
        return;
      }
      const data = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      results.push({
        id: "att" + Date.now() + Math.random().toString(36).slice(2, 6),
        name: file.name,
        type: file.type,
        size: file.size,
        data,
        createdAt: new Date().toISOString().slice(0, 10),
        author: currentUser || "Usuario",
      });
    }
    results.forEach(att => onAdd(att));
    setUploading(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const doDownload = (att) => {
    const a = document.createElement("a");
    a.href = att.data;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="section">
      <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>
          {lang === "es" ? "Archivos adjuntos" : "Attachments"}
          <span className="muted mono" style={{ fontSize: 11, marginLeft: 8 }}>{(attachments || []).length}</span>
        </span>
        <button className="btn btn-sm btn-primary" onClick={() => inputRef.current && inputRef.current.click()}>
          <Icon name="upload" /> {lang === "es" ? "Adjuntar" : "Attach"}
        </button>
      </h3>

      <div className="section-body">
        {storageWarning && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#c2410c", marginBottom: 12 }}>
            <Icon name="alert" size={13} /> {lang === "es"
              ? `Uso de almacenamiento: ${fmtBytes(totalBytes)}. Cerca del límite de localStorage (~5 MB por dominio).`
              : `Storage used: ${fmtBytes(totalBytes)}. Near localStorage limit (~5 MB per domain).`}
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current && inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: "2px dashed " + (dragging ? "var(--accent)" : "var(--line)"),
            borderRadius: 10, padding: "20px", textAlign: "center",
            cursor: "pointer", background: dragging ? "var(--accent-50)" : "var(--bg-soft)",
            marginBottom: 14, transition: "all .15s",
          }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>📎</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}>
            {uploading
              ? (lang === "es" ? "Cargando…" : "Loading…")
              : (lang === "es" ? "Arrastra archivos aquí o haz clic para seleccionar" : "Drop files here or click to select")}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>
            PDF, imágenes — máx. {MAX_FILE_MB} MB por archivo
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.heic"
            style={{ display: "none" }}
            onChange={e => e.target.files.length && handleFiles(e.target.files)}
          />
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: 12 }}>
            <Icon name="alert" size={14} /> {error}
          </div>
        )}

        {(attachments || []).length === 0 && !error && (
          <div className="empty">{lang === "es" ? "Sin archivos adjuntos" : "No attachments"}</div>
        )}

        {(attachments || []).map(att => (
          <div key={att.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 8, border: "1px solid var(--line)",
            marginBottom: 8, background: "var(--bg)",
          }}>
            {att.type && att.type.startsWith("image/") ? (
              <img
                src={att.data}
                alt={att.name}
                style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid var(--line)", flexShrink: 0, cursor: "pointer" }}
                onClick={() => window.open(att.data, "_blank")}
              />
            ) : (
              <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                {fileIcon(att.type)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {att.name}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                {fmtBytes(att.size)} · {att.createdAt} · {att.author}
              </div>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              style={{ flexShrink: 0 }}
              title={lang === "es" ? "Descargar" : "Download"}
              onClick={() => doDownload(att)}>
              <Icon name="download" size={14} />
            </button>
            <button
              className="btn btn-sm btn-ghost"
              style={{ color: "var(--bad)", flexShrink: 0 }}
              title={lang === "es" ? "Eliminar" : "Delete"}
              onClick={() => {
                if (confirm(lang === "es" ? `¿Eliminar "${att.name}"?` : `Delete "${att.name}"?`)) {
                  onDelete(att.id);
                }
              }}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

window.AttachmentsTab = AttachmentsTab;
