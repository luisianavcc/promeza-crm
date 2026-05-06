// PROMEZA CRM — Airtable integration

window.AIRTABLE = (function () {
  const CONFIG_KEY = "promeza_airtable_config";
  const LAST_SYNC_KEY = "promeza_last_sync";

  const DEFAULT_PERSONAS_TABLE = "PERSONAS PROMEZA CRM";
  const DEFAULT_ENTIDADES_TABLE = "ENTIDADES PROMEZA CRM";

  const getConfig = () => {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}; }
    catch { return {}; }
  };

  const saveConfig = (cfg) => localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));

  const getLastSync = () => localStorage.getItem(LAST_SYNC_KEY) || null;

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

  const upsert = async (baseId, table, pat, toCreate, toUpdate) => {
    const url = "https://api.airtable.com/v0/" + baseId + "/" + encodeURIComponent(table);
    for (const batch of chunk(toCreate, 10)) {
      await req("POST", url, { records: batch }, pat);
    }
    for (const batch of chunk(toUpdate, 10)) {
      await req("PATCH", url, { records: batch }, pat);
    }
  };

  const clean = (fields) => {
    const out = {};
    Object.keys(fields).forEach(k => {
      const v = fields[k];
      if (v !== null && v !== undefined && v !== "") out[k] = String(v);
    });
    return out;
  };

  // Auto-create tables if they don't exist
  const setupTables = async (baseId, pat, personasTable, entidadesTable) => {
    const metaUrl = "https://api.airtable.com/v0/meta/bases/" + baseId + "/tables";
    const meta = await req("GET", metaUrl, null, pat);
    const existingNames = (meta.tables || []).map(t => t.name);

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

  return { getConfig, saveConfig, getLastSync, syncAll, DEFAULT_PERSONAS_TABLE, DEFAULT_ENTIDADES_TABLE };
})();
