// PROMEZA CRM — Forms: New Person / New Entity (modal style)

const TextField = ({ label, value, onChange, type = "text", placeholder, full, optional, hint }) => (
  <div className={"field" + (full ? " full" : "")}>
    <label>{label}{optional && <span style={{ marginLeft: 6, color: "var(--ink-4)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>}</label>
    <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    {hint && <div className="muted" style={{ fontSize: 11 }}>{hint}</div>}
  </div>
);

const SelectField = ({ label, value, onChange, options, full }) => (
  <div className={"field" + (full ? " full" : "")}>
    <label>{label}</label>
    <select value={value || ""} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ─── New Person ───

const NewPersonForm = ({ t, lang, data, onClose, onSave, initialData, editMode, prefillData }) => {
  const [form, setForm] = React.useState(() => initialData ? {
    first: initialData.first || "",
    last: initialData.last || "",
    role: initialData.role || "miembro",
    roleOther: initialData.roleOther || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
    zip: initialData.zip || "",
    city: initialData.city || "",
    state: initialData.state || "",
    country: initialData.country || "",
    website: initialData.website || "",
    social: initialData.social || { ig: "", fb: "", tiktok: "", x: "" },
    entities: initialData.entities || [],
    tags: Array.isArray(initialData.tags) ? initialData.tags.join(", ") : (initialData.tags || ""),
    language: initialData.language || "es",
    status: initialData.status || "activo",
    stage: initialData.stage || (initialData.status === "inactivo" ? "inactivo" : "conocido"),
    source: initialData.source || "",
    nextAction: initialData.nextAction || "",
    birthday: initialData.birthday || "",
    lastContact: initialData.lastContact || "",
    extraAddresses: initialData.extraAddresses || [],
  } : {
    first: "", last: "", role: "miembro", roleOther: "",
    email: "", phone: "",
    address: "", zip: "", city: "", state: "", country: "",
    website: "",
    social: { ig: "", fb: "", tiktok: "", x: "" },
    entities: prefillData?.entityId ? [{ id: prefillData.entityId, role: prefillData.entityRole || "miembro", roleOther: "", comment: "" }] : [],
    tags: "", language: "es", status: "activo",
    stage: "nuevo", source: "", nextAction: "",
    birthday: "", lastContact: "",
    extraAddresses: [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSoc = (k, v) => setForm(f => ({ ...f, social: { ...f.social, [k]: v } }));

  const addAddress = () => set("extraAddresses", [...(form.extraAddresses || []), { id: "addr" + Date.now(), label: "", address: "", city: "", state: "", country: "", zip: "" }]);
  const removeAddress = (idx) => set("extraAddresses", form.extraAddresses.filter((_, i) => i !== idx));
  const updateAddress = (idx, k, v) => set("extraAddresses", form.extraAddresses.map((a, i) => i === idx ? { ...a, [k]: v } : a));

  const roleOpts = Object.keys(t.roles).map(k => ({ value: k, label: t.roles[k] }));
  const langOpts = [{ value: "es", label: "Español" }, { value: "en", label: "English" }];
  const statusOpts = [{ value: "activo", label: t.common.activos }, { value: "inactivo", label: t.common.inactivos }];

  const addEntityLink = () => set("entities", [...form.entities, { id: data.entities[0]?.id || "", role: "miembro", roleOther: "", comment: "" }]);
  const removeEntityLink = (idx) => set("entities", form.entities.filter((_, i) => i !== idx));
  const updateEntityLink = (idx, k, v) => set("entities", form.entities.map((e, i) => i === idx ? { ...e, [k]: v } : e));

  const addrLabels = [
    lang === "es" ? "Domicilio" : "Home",
    lang === "es" ? "Iglesia" : "Church",
    lang === "es" ? "Trabajo" : "Work",
    lang === "es" ? "Ministerio" : "Ministry",
    lang === "es" ? "Otro" : "Other",
  ];

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{editMode ? (lang === "es" ? "Editar persona" : "Edit person") : t.forms.newPersonTitle}</div>
            <div className="muted" style={{ fontSize: 12 }}>{t.forms.basic}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <h4 style={{ margin: "0 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.basic}</h4>
          <div className="form-grid">
            <TextField label={t.forms.first} value={form.first} onChange={v => set("first", v)} placeholder="Marcos" />
            <TextField label={t.forms.last} value={form.last} onChange={v => set("last", v)} placeholder="Rivera" />
            <SelectField label={t.common.role} value={form.role} onChange={v => set("role", v)} options={roleOpts} />
            {form.role === "otro" && <TextField label={t.common.roleOther} value={form.roleOther} onChange={v => set("roleOther", v)} placeholder="Coordinador, Director…" />}
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.contact}</h4>
          <div className="form-grid">
            <TextField label="Email" type="email" value={form.email} onChange={v => set("email", v)} placeholder="nombre@dominio.com" />
            <TextField label={lang === "es" ? "Teléfono" : "Phone"} value={form.phone} onChange={v => set("phone", v)} placeholder="+1 305 555 0000" />
          </div>

          {/* Primary address */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 8px" }}>
            <h4 style={{ margin: 0, fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              {lang === "es" ? "Dirección principal" : "Primary address"}
            </h4>
          </div>
          <div className="form-grid">
            <TextField full label={lang === "es" ? "Dirección completa" : "Full address"} value={form.address} onChange={v => set("address", v)} placeholder="Calle, número, depto." />
            <TextField label="ZIP" value={form.zip} onChange={v => set("zip", v)} />
            <TextField label={lang === "es" ? "Ciudad" : "City"} value={form.city} onChange={v => set("city", v)} />
            <TextField label={lang === "es" ? "Estado / Provincia" : "State / Province"} value={form.state} onChange={v => set("state", v)} />
            <TextField label={lang === "es" ? "País" : "Country"} value={form.country} onChange={v => set("country", v)} />
          </div>

          {/* Extra addresses */}
          {(form.extraAddresses || []).map((addr, idx) => (
            <div key={addr.id || idx} className="entity-block" style={{ marginTop: 10 }}>
              <div className="head">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="pin" size={14} />
                  <select
                    value={addr.label}
                    onChange={e => updateAddress(idx, "label", e.target.value)}
                    style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>
                    <option value="">{lang === "es" ? "Tipo de dirección…" : "Address type…"}</option>
                    {addrLabels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => removeAddress(idx)} style={{ color: "var(--bad)" }}>
                  <Icon name="x" size={13} /> {lang === "es" ? "Quitar" : "Remove"}
                </button>
              </div>
              <div className="form-grid">
                <TextField full label={lang === "es" ? "Dirección" : "Address"} value={addr.address} onChange={v => updateAddress(idx, "address", v)} placeholder="Calle, número…" />
                <TextField label="ZIP" value={addr.zip} onChange={v => updateAddress(idx, "zip", v)} />
                <TextField label={lang === "es" ? "Ciudad" : "City"} value={addr.city} onChange={v => updateAddress(idx, "city", v)} />
                <TextField label={lang === "es" ? "Estado" : "State"} value={addr.state} onChange={v => updateAddress(idx, "state", v)} />
                <TextField label={lang === "es" ? "País" : "Country"} value={addr.country} onChange={v => updateAddress(idx, "country", v)} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-sm btn-ghost" onClick={addAddress}>
              <Icon name="plus" /> {lang === "es" ? "Agregar otra dirección" : "Add another address"}
            </button>
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            {t.forms.affiliation} <span className="muted" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 4 }}>· {t.common.optional}</span>
          </h4>
          {form.entities.length === 0 && <div className="muted" style={{ fontSize: 13, padding: "4px 2px" }}>{t.forms.noEntity}</div>}
          {form.entities.map((le, i) => (
            <div key={i} className="entity-block">
              <div className="head">
                <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === "es" ? "Entidad" : "Entity"} #{i + 1}</div>
                <button className="btn btn-sm btn-ghost" onClick={() => removeEntityLink(i)}><Icon name="x" /> {t.forms.removeEntity}</button>
              </div>
              <div className="form-grid">
                <SelectField full label={lang === "es" ? "Entidad" : "Entity"} value={le.id} onChange={v => updateEntityLink(i, "id", v)}
                  options={data.entities.map(e => ({ value: e.id, label: e.name }))} />
                <SelectField label={lang === "es" ? "Cargo en la entidad" : "Role at entity"} value={le.role} onChange={v => updateEntityLink(i, "role", v)} options={roleOpts} />
                {le.role === "otro" && <TextField label={t.common.roleOther} value={le.roleOther} onChange={v => updateEntityLink(i, "roleOther", v)} />}
                <TextField full label={t.common.comments} value={le.comment} onChange={v => updateEntityLink(i, "comment", v)} placeholder={lang === "es" ? "Notas sobre la afiliación" : "Notes about the affiliation"} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-sm" onClick={addEntityLink}><Icon name="plus" /> {t.forms.addEntity}</button>
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.socialBlock}</h4>
          <div className="form-grid">
            <TextField full label={t.common.web} value={form.website} onChange={v => set("website", v)} placeholder="dominio.com" />
            <TextField label="Instagram" value={form.social.ig} onChange={v => setSoc("ig", v)} placeholder="@usuario" />
            <TextField label="Facebook" value={form.social.fb} onChange={v => setSoc("fb", v)} placeholder="usuario" />
            <TextField label="TikTok" value={form.social.tiktok} onChange={v => setSoc("tiktok", v)} placeholder="@usuario" />
            <TextField label="X (Twitter)" value={form.social.x} onChange={v => setSoc("x", v)} placeholder="@usuario" />
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Pipeline CRM</h4>
          <div className="form-grid">
            <div className="field full">
              <label>{lang === "es" ? "Etapa en el pipeline" : "Pipeline stage"}</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(window.PIPELINE_STAGES || []).map(s => (
                  <button key={s.id} type="button" onClick={() => set("stage", s.id)} style={{
                    padding: "5px 12px", borderRadius: 20, border: "1.5px solid",
                    borderColor: form.stage === s.id ? s.color : "var(--line)",
                    background: form.stage === s.id ? s.bg : "transparent",
                    color: form.stage === s.id ? s.color : "var(--ink-3)",
                    fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
            <SelectField label={lang === "es" ? "Fuente del contacto" : "Contact source"} value={form.source} onChange={v => set("source", v)}
              options={[{ value: "", label: lang === "es" ? "— Sin especificar —" : "— Not specified —" }, ...(window.CONTACT_SOURCES || []).map(s => ({ value: s.id, label: s.label }))]} />
            <TextField type="date" label={lang === "es" ? "Próxima acción" : "Next action date"} value={form.nextAction} onChange={v => set("nextAction", v)} />
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.extra}</h4>
          <div className="form-grid">
            <TextField label={t.common.tags} value={form.tags} onChange={v => set("tags", v)} placeholder="liderazgo, vip" hint={lang === "es" ? "Separadas por coma" : "Comma separated"} />
            <SelectField label={t.common.language} value={form.language} onChange={v => set("language", v)} options={langOpts} />
            <TextField type="date" label={t.common.birthday} value={form.birthday} onChange={v => set("birthday", v)} />
            <TextField type="date" label={t.common.lastContact} value={form.lastContact} onChange={v => set("lastContact", v)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.first || !form.last}>
            {editMode ? <><Icon name="check" /> {lang === "es" ? "Guardar cambios" : "Save changes"}</> : <><Icon name="plus" /> {t.forms.saveCreate}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── New Entity ───

const NewEntityForm = ({ t, lang, data, onClose, onSave, initialData, editMode }) => {
  const [form, setForm] = React.useState(() => initialData ? {
    name: initialData.name || "",
    type: initialData.type || "iglesia",
    typeOther: initialData.typeOther || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
    zip: initialData.zip || "",
    city: initialData.city || "",
    state: initialData.state || "",
    country: initialData.country || "",
    website: initialData.website || "",
    social: initialData.social || { ig: "", fb: "", tiktok: "", x: "" },
    size: initialData.size ? String(initialData.size) : "",
    founded: initialData.founded || "",
    parent: initialData.parent || "",
    tags: Array.isArray(initialData.tags) ? initialData.tags.join(", ") : (initialData.tags || ""),
  } : {
    name: "", type: "iglesia", typeOther: "",
    email: "", phone: "",
    address: "", zip: "", city: "", state: "", country: "",
    website: "",
    social: { ig: "", fb: "", tiktok: "", x: "" },
    size: "", founded: "", parent: "",
    tags: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSoc = (k, v) => setForm(f => ({ ...f, social: { ...f.social, [k]: v } }));

  const typeOpts = Object.keys(t.types).map(k => ({ value: k, label: t.types[k] }));
  const parentOpts = [{ value: "", label: lang === "es" ? "— Ninguna —" : "— None —" }, ...data.entities.map(e => ({ value: e.id, label: e.name }))];

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{editMode ? (lang === "es" ? "Editar entidad" : "Edit entity") : t.forms.newEntityTitle}</div>
            <div className="muted" style={{ fontSize: 12 }}>{t.forms.basic}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <h4 style={{ margin: "0 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.basic}</h4>
          <div className="form-grid">
            <TextField full label={t.forms.entityName} value={form.name} onChange={v => set("name", v)} placeholder={lang === "es" ? "Iglesia / Fundación / Estudio…" : "Church / Foundation / Studio…"} />
            <SelectField label={t.common.type} value={form.type} onChange={v => set("type", v)} options={typeOpts} />
            {form.type === "otro" && <TextField label={lang === "es" ? "Especificar tipo" : "Specify type"} value={form.typeOther} onChange={v => set("typeOther", v)} />}
            <SelectField label={t.common.parent + " · " + t.common.optional} value={form.parent} onChange={v => set("parent", v)} options={parentOpts} />
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.contact}</h4>
          <div className="form-grid">
            <TextField label="Email" type="email" value={form.email} onChange={v => set("email", v)} />
            <TextField label={lang === "es" ? "Teléfono" : "Phone"} value={form.phone} onChange={v => set("phone", v)} />
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.addressBlock}</h4>
          <div className="form-grid">
            <TextField full label={lang === "es" ? "Dirección completa" : "Full address"} value={form.address} onChange={v => set("address", v)} />
            <TextField label="ZIP" value={form.zip} onChange={v => set("zip", v)} />
            <TextField label={lang === "es" ? "Ciudad" : "City"} value={form.city} onChange={v => set("city", v)} />
            <TextField label={lang === "es" ? "Estado / Provincia" : "State / Province"} value={form.state} onChange={v => set("state", v)} />
            <TextField label={lang === "es" ? "País" : "Country"} value={form.country} onChange={v => set("country", v)} />
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.socialBlock}</h4>
          <div className="form-grid">
            <TextField full label={t.common.web} value={form.website} onChange={v => set("website", v)} placeholder="dominio.com" />
            <TextField label="Instagram" value={form.social.ig} onChange={v => setSoc("ig", v)} />
            <TextField label="Facebook" value={form.social.fb} onChange={v => setSoc("fb", v)} />
            <TextField label="TikTok" value={form.social.tiktok} onChange={v => setSoc("tiktok", v)} />
            <TextField label="X (Twitter)" value={form.social.x} onChange={v => setSoc("x", v)} />
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.forms.extra}</h4>
          <div className="form-grid">
            <TextField label={t.common.size + " (" + t.common.members + ")"} type="number" value={form.size} onChange={v => set("size", v)} />
            <TextField label={t.common.founded} value={form.founded} onChange={v => set("founded", v)} placeholder="2014" />
            <TextField full label={t.common.tags} value={form.tags} onChange={v => set("tags", v)} placeholder="matriz, hispana" hint={lang === "es" ? "Separadas por coma" : "Comma separated"} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.name}>
            {editMode ? <><Icon name="check" /> {lang === "es" ? "Guardar cambios" : "Save changes"}</> : <><Icon name="plus" /> {t.forms.saveCreate}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

window.NewPersonForm = NewPersonForm;
window.NewEntityForm = NewEntityForm;
