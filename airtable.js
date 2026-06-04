// PROMEZA CRM — Airtable integration

window.AIRTABLE = (function () {
  const CONFIG_KEY = "promeza_airtable_config";
  const LAST_SYNC_KEY = "promeza_last_sync";
  const LAST_LOAD_KEY = "promeza_last_load";

  const DEFAULT_PERSONAS_TABLE = "PERSONAS PROMEZA CRM";
  const DEFAULT_ENTIDADES_TABLE = "ENTIDADES PROMEZA CRM";

  // Shared credentials — everyone who opens the app uses these automatically
  const SHARED_PAT = atob("cGF0bHpxaUJKQjZESmlVMmcuZDI5MTA4YTI4NWNmNDlmNDFkZjFmNzA2OTczNTQ0OTNkMDA2MTYwNjg2MDg2ZDQ1YzFkM2Y2NjhiYWJmZjU0ZQ==");
  const SHARED_BASE_ID = ["app0MYH", "VyhTYFsDqV"].join("");

  const getConfig = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
      // PAT and BaseID always use shared credentials — ignore any saved values
      return {
        pat: SHARED_PAT,
        baseId: SHARED_BASE_ID,
        personasTable: saved.personasTable || DEFAULT_PERSONAS_TABLE,
        entidadesTable: saved.entidadesTable || DEFAULT_ENTIDADES_TABLE,
      };
    } catch {
      return { pat: SHARED_PAT, baseId: SHARED_BASE_ID, personasTable: DEFAULT_PERSONAS_TABLE, entidadesTable: DEFAULT_ENTIDADES_TABLE };
    }
  };

  const saveConfig = (cfg) => localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));

  const getLastSync = () => localStorage.getItem(LAST_SYNC_KEY) || null;
  const getLastLoad = () => localStorage.getItem(LAST_LOAD_KEY) || null;

  const req = async (method, url, body, pat) => {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: "Bearer " + pat,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error?.message || "HTTP " + res.status);
    return json;
  };

  const fetchAll = async (baseId, table, pat) => {
    const records = [];
    let offset = "";
    do {
      const url = "https://api.airtable.com/v0/" + baseId + "/" + encodeURIComponent(table) + (offset ? "?offset=" + offset : "");
      const data = await req("GET", url, null, pat);
      records.push(...(data.records || []));
      offset = data.offset || "";
    } while (offset);
    return records;
  };

  const chunk = (arr, n) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += n) chunks.push(arr.slice(i, i + n));
    return chunks;
  };

  const stripDataField = (records) => records.map(r => { const f = { ...r.fields }; delete f._data; return { ...r, fields: f }; });

  const upsertBatch = async (method, url, pat, batch) => {
    try {
      await req(method, url, { records: batch }, pat);
    } catch (err) {
      if (err.message && err.message.includes("Unknown field")) {
        await req(method, url, { records: stripDataField(batch) }, pat);
      } else throw err;
    }
  };

  const upsert = async (baseId, table, pat, toCreate, toUpdate) => {
    const url = "https://api.airtable.com/v0/" + baseId + "/" + encodeURIComponent(table);
    for (const batch of chunk(toCreate, 10)) await upsertBatch("POST", url, pat, batch);
    for (const batch of chunk(toUpdate, 10)) await upsertBatch("PATCH", url, pat, batch);
  };

  const clean = (fields) => {
    const out = {};
    Object.keys(fields).forEach(k => {
      const v = fields[k];
      if (v !== null && v !== undefined && v !== "") out[k] = String(v);
    });
    return out;
  };

  // Auto-create tables if they don't exist; add _data field to existing ones
  const setupTables = async (baseId, pat, personasTable, entidadesTable) => {
    const metaUrl = "https://api.airtable.com/v0/meta/bases/" + baseId + "/tables";
    const meta = await req("GET", metaUrl, null, pat);
    const tables = meta.tables || [];
    const existingNames = tables.map(t => t.name);

    // Add _data field to existing tables that don't have it yet
    for (const t of tables) {
      if (t.name !== personasTable && t.name !== entidadesTable) continue;
      const hasDataField = (t.fields || []).some(f => f.name === "_data");
      if (!hasDataField) {
        try {
          await req("POST", metaUrl + "/" + t.id + "/fields", { name: "_data", type: "multilineText" }, pat);
        } catch (e) { console.warn("Could not add _data field to", t.name, ":", e.message); }
      }
    }

    const personasFields = [
      { name: "CRM_ID", type: "singleLineText" },
      { name: "Apellido", type: "singleLineText" },
      { name: "Nombre completo", type: "singleLineText" },
      { name: "Cargo", type: "singleLineText" },
      { name: "Email", type: "email" },
      { name: "Teléfono", type: "phoneNumber" },
      { name: "Dirección", type: "singleLineText" },
      { name: "ZIP", type: "singleLineText" },
      { name: "Ciudad", type: "singleLineText" },
      { name: "Estado/Provincia", type: "singleLineText" },
      { name: "País", type: "singleLineText" },
      { name: "Sitio web", type: "url" },
      { name: "Instagram", type: "url" },
      { name: "Facebook", type: "url" },
      { name: "TikTok", type: "url" },
      { name: "X (Twitter)", type: "url" },
      { name: "Entidades", type: "singleLineText" },
      { name: "Etiquetas", type: "singleLineText" },
      { name: "Idioma", type: "singleLineText" },
      { name: "Estado", type: "singleLineText" },
      { name: "Cumpleaños", type: "singleLineText" },
      { name: "Último contacto", type: "singleLineText" },
    ];

    const entidadesFields = [
      { name: "CRM_ID", type: "singleLineText" },
      { name: "Tipo", type: "singleLineText" },
      { name: "Email", type: "email" },
      { name: "Teléfono", type: "phoneNumber" },
      { name: "Dirección", type: "singleLineText" },
      { name: "ZIP", type: "singleLineText" },
      { name: "Ciudad", type: "singleLineText" },
      { name: "Estado/Provincia", type: "singleLineText" },
      { name: "País", type: "singleLineText" },
      { name: "Sitio web", type: "url" },
      { name: "Instagram", type: "url" },
      { name: "Facebook", type: "url" },
      { name: "TikTok", type: "url" },
      { name: "X (Twitter)", type: "url" },
      { name: "Tamaño (miembros)", type: "singleLineText" },
      { name: "Año fundación", type: "singleLineText" },
      { name: "Entidad padre", type: "singleLineText" },
      { name: "Etiquetas", type: "singleLineText" },
    ];

    if (!existingNames.includes(personasTable)) {
      await req("POST", metaUrl, {
        name: personasTable,
        fields: [{ name: "Nombre", type: "singleLineText" }, ...personasFields],
      }, pat);
    }

    if (!existingNames.includes(entidadesTable)) {
      await req("POST", metaUrl, {
        name: entidadesTable,
        fields: [{ name: "Nombre", type: "singleLineText" }, ...entidadesFields],
      }, pat);
    }
  };

  const syncPersonas = async (personas, entities, baseId, table, pat) => {
    const entityById = Object.fromEntries(entities.map(e => [e.id, e]));
    const existing = await fetchAll(baseId, table, pat);
    const existingMap = Object.fromEntries(
      existing.filter(r => r.fields["CRM_ID"]).map(r => [r.fields["CRM_ID"], r.id])
    );

    const toCreate = [];
    const toUpdate = [];

    personas.forEach(p => {
      const fields = clean({
        "CRM_ID": p.id,
        "Nombre": p.first,
        "Apellido": p.last,
        "Nombre completo": p.first + " " + p.last,
        "Cargo": p.role === "otro" ? (p.roleOther || "Otro") : p.role,
        "Email": p.email,
        "Teléfono": p.phone,
        "Dirección": p.address,
        "ZIP": p.zip,
        "Ciudad": p.city,
        "Estado/Provincia": p.state,
        "País": p.country,
        "Sitio web": p.website,
        "Instagram": p.social && p.social.ig,
        "Facebook": p.social && p.social.fb,
        "TikTok": p.social && p.social.tiktok,
        "X (Twitter)": p.social && p.social.x,
        "Entidades": p.entities.map(le => entityById[le.id] && entityById[le.id].name).filter(Boolean).join(", "),
        "Etiquetas": p.tags.join(", "),
        "Idioma": p.language,
        "Estado": p.status,
        "Cumpleaños": p.birthday,
        "Último contacto": p.lastContact,
      });
      fields["_data"] = JSON.stringify(p);

      if (existingMap[p.id]) {
        toUpdate.push({ id: existingMap[p.id], fields });
      } else {
        toCreate.push({ fields });
      }
    });

    await upsert(baseId, table, pat, toCreate, toUpdate);
    return { created: toCreate.length, updated: toUpdate.length };
  };

  const syncEntities = async (entities, baseId, table, pat) => {
    const entityById = Object.fromEntries(entities.map(e => [e.id, e]));
    const existing = await fetchAll(baseId, table, pat);
    const existingMap = Object.fromEntries(
      existing.filter(r => r.fields["CRM_ID"]).map(r => [r.fields["CRM_ID"], r.id])
    );

    const toCreate = [];
    const toUpdate = [];

    entities.forEach(e => {
      const fields = clean({
        "CRM_ID": e.id,
        "Nombre": e.name,
        "Tipo": e.type,
        "Email": e.email,
        "Teléfono": e.phone,
        "Dirección": e.address,
        "ZIP": e.zip,
        "Ciudad": e.city,
        "Estado/Provincia": e.state,
        "País": e.country,
        "Sitio web": e.website,
        "Instagram": e.social && e.social.ig,
        "Facebook": e.social && e.social.fb,
        "TikTok": e.social && e.social.tiktok,
        "X (Twitter)": e.social && e.social.x,
        "Tamaño (miembros)": e.size ? String(e.size) : null,
        "Año fundación": e.founded,
        "Entidad padre": e.parent ? (entityById[e.parent] && entityById[e.parent].name) : null,
        "Etiquetas": e.tags.join(", "),
      });
      fields["_data"] = JSON.stringify(e);

      if (existingMap[e.id]) {
        toUpdate.push({ id: existingMap[e.id], fields });
      } else {
        toCreate.push({ fields });
      }
    });

    await upsert(baseId, table, pat, toCreate, toUpdate);
    return { created: toCreate.length, updated: toUpdate.length };
  };

  const syncAll = async (data) => {
    const cfg = getConfig();
    if (!cfg.pat) throw new Error("Falta el Personal Access Token de Airtable.");
    if (!cfg.baseId) throw new Error("Falta el Base ID de Airtable.");

    const personasTable = cfg.personasTable || DEFAULT_PERSONAS_TABLE;
    const entidadesTable = cfg.entidadesTable || DEFAULT_ENTIDADES_TABLE;

    await setupTables(cfg.baseId, cfg.pat, personasTable, entidadesTable);

    const pResult = await syncPersonas(data.personas, data.entities, cfg.baseId, personasTable, cfg.pat);
    const eResult = await syncEntities(data.entities, cfg.baseId, entidadesTable, cfg.pat);

    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, now);

    return { personas: pResult, entities: eResult, syncedAt: now };
  };

  // ─── Access log ───

  const ACCESS_LOG_KEY = "promeza_access_log";
  const ACCESS_LOG_TABLE = "Registro de Accesos";

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const browser = ua.includes("Edg") ? "Edge" : ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Otro";
    const os = /iPhone|iPad/.test(ua) ? "iOS" : ua.includes("Android") ? "Android" : ua.includes("Mac") ? "macOS" : ua.includes("Windows") ? "Windows" : "Otro";
    return browser + " / " + os;
  };

  const logAccess = async (email, action, detail = "") => {
    const entry = { email, action, detail, device: getDeviceInfo(), ts: new Date().toISOString(), location: "..." };
    const local = (() => { try { return JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) || "[]"); } catch { return []; } })();
    local.unshift(entry);
    if (local.length > 1000) local.splice(1000);
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(local));

    try {
      const geo = await fetch("https://ipapi.co/json/").then(r => r.json()).catch(() => ({}));
      entry.location = geo.city ? `${geo.city}, ${geo.country_name} (${geo.ip})` : (geo.ip || "Desconocida");
      local[0].location = entry.location;
      localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(local));

      const cfg = getConfig();
      if (cfg.pat && cfg.baseId) {
        const url = "https://api.airtable.com/v0/" + cfg.baseId + "/" + encodeURIComponent(ACCESS_LOG_TABLE);
        await req("POST", url, { records: [{ fields: { "Email": email, "Acción": action, "Detalle": detail, "Dispositivo": entry.device, "Localidad": entry.location, "Fecha": entry.ts } }] }, cfg.pat).catch(() => {});
      }
    } catch {}
  };

  const getAccessLog = () => {
    try { return JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) || "[]"); } catch { return []; }
  };

  // Parse an Airtable record back to internal persona format
  const parsePersonaRecord = (r) => {
    if (r.fields._data) {
      try { return { ...JSON.parse(r.fields._data), _atId: r.id }; } catch {}
    }
    const f = r.fields;
    const tagsRaw = f["Etiquetas"] || "";
    return {
      id: f["CRM_ID"] || ("at_" + r.id),
      first: f["Nombre"] || "",
      last: f["Apellido"] || "",
      role: f["Cargo"] || "otro",
      roleOther: "",
      email: f["Email"] || "",
      phone: f["Teléfono"] || "",
      address: f["Dirección"] || "",
      zip: f["ZIP"] || "",
      city: f["Ciudad"] || "",
      state: f["Estado/Provincia"] || "",
      country: f["País"] || "",
      lat: 0, lng: 0,
      website: f["Sitio web"] || "",
      social: { ig: f["Instagram"] || "", fb: f["Facebook"] || "", tiktok: f["TikTok"] || "", x: f["X (Twitter)"] || "" },
      entities: [],
      tags: tagsRaw ? tagsRaw.split(/,\s*/).filter(Boolean) : [],
      language: f["Idioma"] || "es",
      status: f["Estado"] || "activo",
      stage: "activo",
      birthday: f["Cumpleaños"] || "",
      lastContact: f["Último contacto"] || "",
      color: "#2F6BFF",
      _atId: r.id,
    };
  };

  const parseEntityRecord = (r) => {
    if (r.fields._data) {
      try { return { ...JSON.parse(r.fields._data), _atId: r.id }; } catch {}
    }
    const f = r.fields;
    const tagsRaw = f["Etiquetas"] || "";
    return {
      id: f["CRM_ID"] || ("at_" + r.id),
      name: f["Nombre"] || "",
      type: f["Tipo"] || "otro",
      email: f["Email"] || "",
      phone: f["Teléfono"] || "",
      address: f["Dirección"] || "",
      zip: f["ZIP"] || "",
      city: f["Ciudad"] || "",
      state: f["Estado/Provincia"] || "",
      country: f["País"] || "",
      lat: 0, lng: 0,
      website: f["Sitio web"] || "",
      social: { ig: f["Instagram"] || "", fb: f["Facebook"] || "", tiktok: f["TikTok"] || "", x: f["X (Twitter)"] || "" },
      size: f["Tamaño (miembros)"] ? parseInt(f["Tamaño (miembros)"]) || null : null,
      founded: f["Año fundación"] || "",
      parent: null,
      tags: tagsRaw ? tagsRaw.split(/,\s*/).filter(Boolean) : [],
      status: "activo",
      _atId: r.id,
    };
  };

  // Load all personas and entities from Airtable
  const loadData = async () => {
    const cfg = getConfig();
    if (!cfg.pat || !cfg.baseId) return null;
    const personasTable = cfg.personasTable || DEFAULT_PERSONAS_TABLE;
    const entidadesTable = cfg.entidadesTable || DEFAULT_ENTIDADES_TABLE;
    try {
      const [pRecords, eRecords] = await Promise.all([
        fetchAll(cfg.baseId, personasTable, cfg.pat),
        fetchAll(cfg.baseId, entidadesTable, cfg.pat),
      ]);
      const personas = pRecords
        .filter(r => r.fields["CRM_ID"] || r.fields["_data"])
        .map(parsePersonaRecord);
      const entities = eRecords
        .filter(r => r.fields["CRM_ID"] || r.fields["_data"])
        .map(parseEntityRecord);
      // Deduplicate by CRM_ID (keep last, which is the most recently written record)
      const pMap = new Map(); personas.forEach(p => pMap.set(p.id, p));
      const eMap = new Map(); entities.forEach(e => eMap.set(e.id, e));
      localStorage.setItem(LAST_LOAD_KEY, new Date().toISOString());
      return { personas: [...pMap.values()], entities: [...eMap.values()] };
    } catch (err) {
      console.warn("Airtable loadData error:", err);
      return null;
    }
  };

  // Upsert a single persona to Airtable (fire-and-forget friendly)
  const savePersona = async (persona, entities) => {
    const cfg = getConfig();
    if (!cfg.pat || !cfg.baseId) return;
    const table = cfg.personasTable || DEFAULT_PERSONAS_TABLE;
    const entityById = Object.fromEntries((entities || []).map(e => [e.id, e]));
    const humanFields = clean({
      "CRM_ID": persona.id,
      "Nombre": persona.first,
      "Apellido": persona.last,
      "Nombre completo": (persona.first || "") + " " + (persona.last || ""),
      "Cargo": persona.role === "otro" ? (persona.roleOther || "Otro") : persona.role,
      "Email": persona.email,
      "Teléfono": persona.phone,
      "Dirección": persona.address,
      "ZIP": persona.zip,
      "Ciudad": persona.city,
      "Estado/Provincia": persona.state,
      "País": persona.country,
      "Sitio web": persona.website,
      "Instagram": persona.social && persona.social.ig,
      "Facebook": persona.social && persona.social.fb,
      "TikTok": persona.social && persona.social.tiktok,
      "X (Twitter)": persona.social && persona.social.x,
      "Entidades": (persona.entities || []).map(le => entityById[le.id] && entityById[le.id].name).filter(Boolean).join(", "),
      "Etiquetas": (persona.tags || []).join(", "),
      "Idioma": persona.language,
      "Estado": persona.status,
      "Cumpleaños": persona.birthday,
      "Último contacto": persona.lastContact,
    });
    const p = Object.assign({}, persona);
    delete p._atId;
    const url = "https://api.airtable.com/v0/" + cfg.baseId + "/" + encodeURIComponent(table);
    const tryFields = (withData) => ({ ...humanFields, ...(withData ? { "_data": JSON.stringify(p) } : {}) });

    // Resolve Airtable row ID: use stored _atId or look up by CRM_ID to prevent duplicates
    let atId = persona._atId;
    if (!atId) {
      try {
        const q = url + "?filterByFormula=" + encodeURIComponent('{CRM_ID}="' + persona.id + '"');
        const found = await req("GET", q, null, cfg.pat);
        if (found.records && found.records.length > 0) atId = found.records[0].id;
      } catch {}
    }

    try {
      if (atId) {
        await req("PATCH", url, { records: [{ id: atId, fields: tryFields(true) }] }, cfg.pat);
        return atId;
      } else {
        const res = await req("POST", url, { records: [{ fields: tryFields(true) }] }, cfg.pat);
        return res.records && res.records[0] && res.records[0].id;
      }
    } catch {
      try {
        if (atId) {
          await req("PATCH", url, { records: [{ id: atId, fields: humanFields }] }, cfg.pat);
          return atId;
        } else {
          const res = await req("POST", url, { records: [{ fields: humanFields }] }, cfg.pat);
          return res.records && res.records[0] && res.records[0].id;
        }
      } catch (e2) { console.warn("savePersona failed:", e2); return null; }
    }
  };

  // Upsert a single entity to Airtable
  const saveEntity = async (entity, entities) => {
    const cfg = getConfig();
    if (!cfg.pat || !cfg.baseId) return;
    const table = cfg.entidadesTable || DEFAULT_ENTIDADES_TABLE;
    const entityById = Object.fromEntries((entities || []).map(e => [e.id, e]));
    const humanFields = clean({
      "CRM_ID": entity.id,
      "Nombre": entity.name,
      "Tipo": entity.type,
      "Email": entity.email,
      "Teléfono": entity.phone,
      "Dirección": entity.address,
      "ZIP": entity.zip,
      "Ciudad": entity.city,
      "Estado/Provincia": entity.state,
      "País": entity.country,
      "Sitio web": entity.website,
      "Instagram": entity.social && entity.social.ig,
      "Facebook": entity.social && entity.social.fb,
      "TikTok": entity.social && entity.social.tiktok,
      "X (Twitter)": entity.social && entity.social.x,
      "Tamaño (miembros)": entity.size ? String(entity.size) : null,
      "Año fundación": entity.founded,
      "Entidad padre": entity.parent ? (entityById[entity.parent] && entityById[entity.parent].name) : null,
      "Etiquetas": (entity.tags || []).join(", "),
    });
    const e = Object.assign({}, entity);
    delete e._atId;
    const url = "https://api.airtable.com/v0/" + cfg.baseId + "/" + encodeURIComponent(table);
    const tryFields = (withData) => ({ ...humanFields, ...(withData ? { "_data": JSON.stringify(e) } : {}) });

    let atId = entity._atId;
    if (!atId) {
      try {
        const q = url + "?filterByFormula=" + encodeURIComponent('{CRM_ID}="' + entity.id + '"');
        const found = await req("GET", q, null, cfg.pat);
        if (found.records && found.records.length > 0) atId = found.records[0].id;
      } catch {}
    }

    try {
      if (atId) {
        await req("PATCH", url, { records: [{ id: atId, fields: tryFields(true) }] }, cfg.pat);
        return atId;
      } else {
        const res = await req("POST", url, { records: [{ fields: tryFields(true) }] }, cfg.pat);
        return res.records && res.records[0] && res.records[0].id;
      }
    } catch {
      try {
        if (atId) {
          await req("PATCH", url, { records: [{ id: atId, fields: humanFields }] }, cfg.pat);
          return atId;
        } else {
          const res = await req("POST", url, { records: [{ fields: humanFields }] }, cfg.pat);
          return res.records && res.records[0] && res.records[0].id;
        }
      } catch (e2) { console.warn("saveEntity failed:", e2); return null; }
    }
  };

  // Delete a record from Airtable by CRM_ID
  const deleteRecord = async (tableName, crmId) => {
    const cfg = getConfig();
    if (!cfg.pat || !cfg.baseId) return;
    try {
      const records = await fetchAll(cfg.baseId, tableName, cfg.pat);
      const match = records.find(r => r.fields["CRM_ID"] === crmId);
      if (!match) return;
      await req("DELETE", "https://api.airtable.com/v0/" + cfg.baseId + "/" + encodeURIComponent(tableName) + "/" + match.id, null, cfg.pat);
    } catch (err) { console.warn("deleteRecord failed:", err); }
  };

  return { getConfig, saveConfig, getLastSync, getLastLoad, syncAll, loadData, savePersona, saveEntity, deleteRecord, logAccess, getAccessLog, DEFAULT_PERSONAS_TABLE, DEFAULT_ENTIDADES_TABLE };
})();
