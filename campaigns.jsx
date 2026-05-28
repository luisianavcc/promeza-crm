// PROMEZA CRM — Email Campaigns

const { useState, useEffect, useRef, useMemo } = React;

const ROLE_OPTIONS = [
  { id: "", label: "Todos los cargos" },
  { id: "pastor", label: "Pastor" },
  { id: "lider", label: "Líder" },
  { id: "adorador", label: "Adorador" },
  { id: "miembro", label: "Miembro" },
  { id: "influencer", label: "Influencer" },
  { id: "otro", label: "Otro" },
];

// ─── Helpers ───

const applyFilters = (personas, filters) => {
  return personas.filter(p => {
    if (filters.role && p.role !== filters.role) return false;
    if (filters.stage && (p.stage || "conocido") !== filters.stage) return false;
    if (filters.city && !(p.city || "").toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.tag && !(p.tags || []).some(t => t.toLowerCase().includes(filters.tag.toLowerCase()))) return false;
    if (filters.emailOnly && !p.email) return false;
    return true;
  });
};

const interpolate = (body, persona) =>
  body
    .replace(/\{\{nombre\}\}/g, persona.first || "")
    .replace(/\{\{apellido\}\}/g, persona.last || "");

// ─── Status Badge ───

const StatusBadge = ({ status }) => {
  const isDraft = status === "draft";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 999,
      fontSize: 11.5,
      fontWeight: 600,
      background: isDraft ? "var(--bg-soft)" : "var(--accent-50)",
      color: isDraft ? "var(--ink-3)" : "var(--accent-700)",
      border: "1px solid " + (isDraft ? "var(--line)" : "var(--accent-100)"),
      letterSpacing: "0.02em",
    }}>
      {isDraft ? "Borrador" : "Enviada"}
    </span>
  );
};

// ─── Campaign Card ───

const CampaignCard = ({ campaign, lang }) => {
  return (
    <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: "var(--accent-50)", display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--accent)",
      }}>
        <Icon name="mail" size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {campaign.name}
          </div>
          <StatusBadge status={campaign.status} />
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {campaign.subject}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {campaign.sentAt && (
            <span style={{ fontSize: 12, color: "var(--ink-4)", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="calendar" size={12} />
              {fmtDate(campaign.sentAt.slice(0, 10), lang)}
            </span>
          )}
          <span style={{ fontSize: 12, color: "var(--ink-4)", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="users" size={12} />
            {campaign.recipientCount || 0} destinatarios
          </span>
          {campaign.status === "sent" && (
            <span style={{ fontSize: 12, color: "var(--good)", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              <Icon name="check" size={12} />
              {campaign.sentCount || 0} enviados
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Audience Preview ───

const AudiencePreview = ({ personas, filters }) => {
  const matched = useMemo(() => applyFilters(personas, filters), [personas, filters]);
  const preview = matched.slice(0, 8);
  const withEmail = matched.filter(p => p.email).length;
  const withoutEmail = matched.length - withEmail;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12,
      }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          Audiencia
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: matched.length === 0 ? "var(--ink-4)" : "var(--accent-700)",
          background: matched.length === 0 ? "var(--bg-soft)" : "var(--accent-50)",
          border: "1px solid " + (matched.length === 0 ? "var(--line)" : "var(--accent-100)"),
          borderRadius: 999, padding: "2px 12px",
        }}>
          {matched.length} {matched.length === 1 ? "persona" : "personas"}
        </div>
      </div>

      {matched.length > 0 && withoutEmail > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 10px", borderRadius: 8, marginBottom: 10,
          background: "#fff5f5", border: "1px solid #fecaca",
          fontSize: 12, color: "var(--bad)",
        }}>
          <Icon name="alert" size={13} />
          {withoutEmail} {withoutEmail === 1 ? "persona no tiene" : "personas no tienen"} email registrado y no {withoutEmail === 1 ? "recibirá" : "recibirán"} el mensaje.
        </div>
      )}

      {matched.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "24px 0",
          color: "var(--ink-4)", fontSize: 13,
          border: "1px dashed var(--line)", borderRadius: 10,
        }}>
          Ninguna persona coincide con los filtros
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {preview.map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "6px 10px", borderRadius: 8,
              background: p.email ? "var(--bg-soft)" : "#fff5f5",
              border: "1px solid " + (p.email ? "var(--line)" : "#fecaca"),
            }}>
              <div className="av-circle" style={{
                background: p.color || "var(--accent)",
                width: 28, height: 28, fontSize: 11, flexShrink: 0,
              }}>
                {initials(fullName(p))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {fullName(p)}
                </div>
                {p.email ? (
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.email}
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: "var(--bad)", fontStyle: "italic" }}>
                    Sin email
                  </div>
                )}
              </div>
            </div>
          ))}
          {matched.length > 8 && (
            <div style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "center", paddingTop: 4 }}>
              + {matched.length - 8} más
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── New Campaign Form ───

const NewCampaignForm = ({ data, lang, onSaveCampaign, onBack }) => {
  const stages = window.PIPELINE_STAGES || [];

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filters, setFilters] = useState({ role: "", stage: "", city: "", tag: "", emailOnly: true });

  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, errors: 0 });
  const [sendDone, setSendDone] = useState(false);
  const [error, setError] = useState("");

  const recipients = useMemo(() => applyFilters(data.personas, filters), [data.personas, filters]);
  const recipientsWithEmail = recipients.filter(p => p.email);

  const firstRecipient = recipientsWithEmail[0] || recipients[0];
  const previewText = firstRecipient
    ? interpolate(body, firstRecipient)
    : body;

  const ejsCfg = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("promeza_ejs") || "{}"); } catch { return {}; }
  }, []);
  const ejsReady = ejsCfg.serviceId && ejsCfg.templateId && ejsCfg.publicKey;

  const canSend = ejsReady && recipientsWithEmail.length > 0 && name.trim() && subject.trim() && body.trim() && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setError("");
    setSending(true);
    setSendProgress({ sent: 0, total: recipientsWithEmail.length, errors: 0 });
    setSendDone(false);

    let sent = 0;
    let errors = 0;

    for (const p of recipientsWithEmail) {
      const msg = interpolate(body, p);
      try {
        await window.emailjs.send(
          ejsCfg.serviceId,
          ejsCfg.templateId,
          { to_email: p.email, subject, message: msg, nombre: p.first, apellido: p.last },
          ejsCfg.publicKey
        );
        sent++;
      } catch (e) {
        errors++;
      }
      setSendProgress({ sent, total: recipientsWithEmail.length, errors });
      await new Promise(r => setTimeout(r, 300));
    }

    const campaign = {
      id: "camp" + Date.now(),
      name: name.trim(),
      subject: subject.trim(),
      body,
      filters,
      sentAt: new Date().toISOString(),
      recipientCount: recipients.length,
      sentCount: sent,
      status: "sent",
    };

    onSaveCampaign(campaign);
    setSending(false);
    setSendDone(true);
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn"
            onClick={onBack}
            style={{ padding: "6px 12px" }}
          >
            <Icon name="chev-right" size={14} style={{ transform: "rotate(180deg)" }} />
            Volver
          </button>
          <div>
            <h1 className="page-title">Nueva campaña</h1>
            <div className="page-sub">Crea y envía un email masivo personalizado</div>
          </div>
        </div>
      </div>

      {/* Two-pane layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(280px, 380px) 1fr",
        gap: 20,
        alignItems: "start",
      }}
        className="campaigns-grid"
      >
        {/* ── Left: Audience builder ── */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="filter" size={15} />
            Audiencia
          </div>

          {/* Role filter */}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Cargo</label>
            <select value={filters.role} onChange={e => setFilter("role", e.target.value)}>
              {ROLE_OPTIONS.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Stage filter */}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Etapa del pipeline</label>
            <select value={filters.stage} onChange={e => setFilter("stage", e.target.value)}>
              <option value="">Todas las etapas</option>
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* City filter */}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Ciudad</label>
            <input
              type="text"
              value={filters.city}
              onChange={e => setFilter("city", e.target.value)}
              placeholder="Ej: Miami, Bogotá…"
            />
          </div>

          {/* Tag filter */}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Etiqueta</label>
            <input
              type="text"
              value={filters.tag}
              onChange={e => setFilter("tag", e.target.value)}
              placeholder="Ej: liderazgo, jovenes…"
            />
          </div>

          {/* Email only checkbox */}
          <label style={{
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", fontSize: 13, marginBottom: 20,
            color: "var(--ink-2)", fontWeight: 500,
          }}>
            <input
              type="checkbox"
              checked={filters.emailOnly}
              onChange={e => setFilter("emailOnly", e.target.checked)}
              style={{ width: 15, height: 15, cursor: "pointer", accentColor: "var(--accent)" }}
            />
            Solo con email registrado
          </label>

          {/* Audience preview */}
          <AudiencePreview personas={data.personas} filters={filters} />
        </div>

        {/* ── Right: Compose ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="edit" size={15} />
              Redactar
            </div>

            {/* Campaign name */}
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Nombre interno de la campaña</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Invitación conferencia 2025"
              />
            </div>

            {/* Subject */}
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Asunto del email</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Ej: Te esperamos este domingo"
              />
            </div>

            {/* Body */}
            <div className="field" style={{ marginBottom: 6 }}>
              <label>Cuerpo del mensaje</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={"Hola {{nombre}},\n\nEsperamos contar con tu presencia…"}
                style={{
                  minHeight: 160, resize: "vertical",
                  fontFamily: "inherit", lineHeight: 1.6,
                }}
              />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginBottom: 16 }}>
              Usa <code style={{ background: "var(--accent-50)", padding: "0 4px", borderRadius: 3, fontSize: 11 }}>{"{{nombre}}"}</code> y{" "}
              <code style={{ background: "var(--accent-50)", padding: "0 4px", borderRadius: 3, fontSize: 11 }}>{"{{apellido}}"}</code>{" "}
              para personalizar el mensaje por destinatario.
            </div>

            {/* Preview */}
            {body.trim() && (
              <div style={{
                borderRadius: 10, border: "1px solid var(--line)",
                background: "var(--bg-soft)", padding: "12px 14px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Vista previa {firstRecipient ? `— ${fullName(firstRecipient)}` : ""}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {previewText || <span style={{ fontStyle: "italic", color: "var(--ink-4)" }}>El cuerpo del mensaje aparecerá aquí.</span>}
                </div>
              </div>
            )}

            {/* EmailJS not configured warning */}
            {!ejsReady && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "10px 14px", borderRadius: 8, marginBottom: 14,
                background: "#fff5f5", border: "1px solid #fecaca",
                fontSize: 12.5, color: "var(--bad)",
              }}>
                <Icon name="alert" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Configura EmailJS en <strong>Ajustes</strong> antes de enviar campañas.
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 14,
                background: "#fff5f5", border: "1px solid #fecaca",
                fontSize: 12.5, color: "var(--bad)",
              }}>
                {error}
              </div>
            )}

            {/* Send done */}
            {sendDone && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 8, marginBottom: 14,
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                fontSize: 13, color: "#166534", fontWeight: 600,
              }}>
                <Icon name="check" size={14} />
                Campaña enviada: {sendProgress.sent} de {sendProgress.total} emails enviados correctamente.
                {sendProgress.errors > 0 && (
                  <span style={{ fontWeight: 400, color: "var(--bad)", marginLeft: 4 }}>
                    ({sendProgress.errors} errores)
                  </span>
                )}
              </div>
            )}

            {/* Progress bar while sending */}
            {sending && (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 6, fontSize: 12.5, color: "var(--ink-3)",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="mail" size={13} />
                    Enviando…
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                    {sendProgress.sent} / {sendProgress.total} enviados
                  </span>
                </div>
                <div style={{
                  height: 6, borderRadius: 999,
                  background: "var(--line)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    background: "var(--accent)",
                    width: sendProgress.total > 0
                      ? ((sendProgress.sent / sendProgress.total) * 100) + "%"
                      : "0%",
                    transition: "width 0.3s ease",
                  }} />
                </div>
                {sendProgress.errors > 0 && (
                  <div style={{ fontSize: 11.5, color: "var(--bad)", marginTop: 4 }}>
                    {sendProgress.errors} {sendProgress.errors === 1 ? "error" : "errores"} de envío
                  </div>
                )}
              </div>
            )}

            {/* Send button */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              {recipientsWithEmail.length > 0 && !sending && !sendDone && (
                <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                  Se enviará a {recipientsWithEmail.length} {recipientsWithEmail.length === 1 ? "persona" : "personas"}
                </span>
              )}
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={!canSend || sendDone}
                style={{ opacity: (!canSend || sendDone) ? 0.5 : 1, cursor: (!canSend || sendDone) ? "not-allowed" : "pointer" }}
              >
                <Icon name="mail" size={15} />
                {sending ? "Enviando…" : sendDone ? "Enviada" : "Enviar campaña"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive style tag */}
      <style>{`
        @media (max-width: 768px) {
          .campaigns-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

// ─── CampaignsView (main) ───

const CampaignsView = ({ lang, data, go, onSaveCampaign }) => {
  const [mode, setMode] = useState("list"); // "list" | "new"

  const campaigns = (data.campaigns || []).slice().sort((a, b) => (b.sentAt || "").localeCompare(a.sentAt || ""));

  if (mode === "new") {
    return (
      <NewCampaignForm
        data={data}
        lang={lang}
        onSaveCampaign={(campaign) => {
          onSaveCampaign(campaign);
          setMode("list");
        }}
        onBack={() => setMode("list")}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Campañas de email</h1>
          <div className="page-sub">
            {campaigns.length > 0
              ? `${campaigns.length} ${campaigns.length === 1 ? "campaña enviada" : "campañas enviadas"}`
              : "Envía emails personalizados a tu base de contactos"}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setMode("new")}>
            <Icon name="plus" />
            Nueva campaña
          </button>
        </div>
      </div>

      {/* Empty state */}
      {campaigns.length === 0 ? (
        <div className="empty" style={{ padding: "80px 0" }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: "var(--accent-50)", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", color: "var(--accent)",
          }}>
            <Icon name="mail" size={28} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            Aún no hay campañas
          </div>
          <div style={{ color: "var(--ink-3)", fontSize: 13.5, marginBottom: 20, maxWidth: 340, textAlign: "center" }}>
            Crea tu primera campaña para enviar emails personalizados a tus contactos.
          </div>
          <button className="btn btn-primary" onClick={() => setMode("new")}>
            <Icon name="plus" />
            Crear primera campaña
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
};

window.CampaignsView = CampaignsView;
