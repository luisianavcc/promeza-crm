// PROMEZA CRM — Map components

const _L = () => window.L;

const COUNTY_COLORS = [
  "#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899",
  "#8b5cf6","#14b8a6","#f97316","#ef4444","#06b6d4",
];

const useLeafletMap = (ref, opts) => {
  const mapRef = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || !_L()) return;
    if (mapRef.current) return;
    const map = _L().map(ref.current, {
      center: opts.center || [10, -60],
      zoom: opts.zoom || 2,
      zoomControl: opts.zoomControl !== false,
      scrollWheelZoom: true,
      attributionControl: false,
    });
    _L().tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap, © CartoDB",
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  return mapRef;
};

const MiniMap = ({ personas = [], entities = [], focus = null, go = null, countyColorMap = null }) => {
  const ref = React.useRef(null);
  const mapRef = useLeafletMap(ref, {
    center: focus ? [focus.lat, focus.lng] : [10, -60],
    zoom: focus ? 13 : 2,
  });
  const layerRef = React.useRef(null);

  React.useEffect(() => {
    const L = _L();
    if (!L || !mapRef.current) return;
    if (layerRef.current) { layerRef.current.remove(); }
    const layer = L.layerGroup().addTo(mapRef.current);
    const points = [];

    entities.forEach(e => {
      if (!e.lat && !e.lng) return;
      const color = (countyColorMap && e.county && countyColorMap[e.county]) || "#0ea5e9";
      const ic = L.divIcon({
        html: `<div class="map-marker entity" style="border-color:${color};background:${color}22"></div>`,
        className: "", iconSize: [20, 20], iconAnchor: [10, 10],
      });
      const m = L.marker([e.lat, e.lng], { icon: ic }).addTo(layer);
      m.bindPopup(`<div class="pop-title">${e.name}</div><div class="pop-sub">${e.city}${e.county ? " · " + e.county : ""}</div>`);
      if (go) m.on("click", () => go({ name: "entity", id: e.id }));
      points.push([e.lat, e.lng]);
    });

    personas.forEach(p => {
      if (!p.lat && !p.lng) return;
      const color = (countyColorMap && p.county && countyColorMap[p.county]) || p.color;
      const ic = L.divIcon({
        html: `<div class="map-marker" style="background:${color}"></div>`,
        className: "", iconSize: [16, 16], iconAnchor: [8, 8],
      });
      const m = L.marker([p.lat, p.lng], { icon: ic }).addTo(layer);
      m.bindPopup(`<div class="pop-title">${p.first} ${p.last}</div><div class="pop-sub">${p.city}${p.county ? " · " + p.county : ""}${p.country ? ", " + p.country : ""}</div>`);
      if (go) m.on("click", () => go({ name: "person", id: p.id }));
      points.push([p.lat, p.lng]);
    });

    layerRef.current = layer;

    if (focus) {
      mapRef.current.setView([focus.lat, focus.lng], 13);
    } else if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapRef.current.fitBounds(bounds.pad(0.2), { animate: false });
    }
  }, [personas, entities, focus, countyColorMap]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

const MapPage = ({ t, lang, data, go }) => {
  const [showPersonas, setShowPersonas] = React.useState(true);
  const [showEntities, setShowEntities] = React.useState(true);
  const [sideTab, setSideTab] = React.useState("lista");
  const [selectedCounty, setSelectedCounty] = React.useState(null);
  const es = lang === "es";

  // Build county map
  const allCounties = React.useMemo(() => {
    const set = new Set();
    data.personas.forEach(p => { if (p.county) set.add(p.county); });
    data.entities.forEach(e => { if (e.county) set.add(e.county); });
    return [...set].sort();
  }, [data.personas, data.entities]);

  const countyColorMap = React.useMemo(() => {
    const map = {};
    allCounties.forEach((c, i) => { map[c] = COUNTY_COLORS[i % COUNTY_COLORS.length]; });
    return map;
  }, [allCounties]);

  // Filter by county selection
  const personasFiltered = React.useMemo(() => {
    let p = data.personas;
    if (!showPersonas) return [];
    if (selectedCounty) p = p.filter(x => x.county === selectedCounty);
    return p;
  }, [data.personas, showPersonas, selectedCounty]);

  const entitiesFiltered = React.useMemo(() => {
    let e = data.entities;
    if (!showEntities) return [];
    if (selectedCounty) e = e.filter(x => x.county === selectedCounty);
    return e;
  }, [data.entities, showEntities, selectedCounty]);

  const items = [
    ...entitiesFiltered.map(e => ({ kind: "entity", id: e.id, name: e.name, sub: [e.city, e.county].filter(Boolean).join(" · "), lat: e.lat, lng: e.lng, color: (countyColorMap && e.county) ? countyColorMap[e.county] : "#0ea5e9", county: e.county })),
    ...personasFiltered.map(p => ({ kind: "person", id: p.id, name: fullName(p), sub: [p.city, p.county].filter(Boolean).join(" · "), lat: p.lat, lng: p.lng, color: (countyColorMap && p.county) ? countyColorMap[p.county] : p.color, county: p.county })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  // County stats
  const countyStats = React.useMemo(() => {
    return allCounties.map((county, i) => {
      const personas = data.personas.filter(p => p.county === county);
      const entities = data.entities.filter(e => e.county === county);
      const cityCounts = {};
      personas.forEach(p => { if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1; });
      const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
      return { county, personas, entities, topCities, color: COUNTY_COLORS[i % COUNTY_COLORS.length] };
    }).sort((a, b) => (b.personas.length + b.entities.length) - (a.personas.length + a.entities.length));
  }, [allCounties, data.personas, data.entities]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav.map}</h1>
          <div className="page-sub">
            {selectedCounty
              ? <span style={{ color: "var(--accent)", fontWeight: 600 }}>{selectedCounty} · {items.length} {es ? "registros" : "records"}</span>
              : `${personasFiltered.length + entitiesFiltered.length} ${es ? "ubicaciones" : "locations"}`}
          </div>
        </div>
        <div className="page-actions">
          <button className={"chip " + (showEntities ? "on" : "")} onClick={() => setShowEntities(v => !v)}>
            <Icon name="building" /> {t.nav.entities}
          </button>
          <button className={"chip " + (showPersonas ? "on" : "")} onClick={() => setShowPersonas(v => !v)}>
            <Icon name="users" /> {t.nav.personas}
          </button>
          {selectedCounty && (
            <button className="btn btn-sm" style={{ color: "var(--accent)", borderColor: "var(--accent)" }} onClick={() => setSelectedCounty(null)}>
              × {es ? "Quitar filtro" : "Clear filter"}
            </button>
          )}
        </div>
      </div>

      <div className="map-page">
        <div className="map-side">
          {/* Sidebar tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
            {[
              { id: "lista", label: es ? "Lista" : "List" },
              { id: "condados", label: es ? "Condados" : "Counties", badge: allCounties.length },
            ].map(tb => (
              <button key={tb.id} onClick={() => setSideTab(tb.id)}
                style={{ flex: 1, padding: "10px 4px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: sideTab === tb.id ? 700 : 500, color: sideTab === tb.id ? "var(--accent)" : "var(--ink-3)", borderBottom: sideTab === tb.id ? "2px solid var(--accent)" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                {tb.label}
                {tb.badge > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: sideTab === tb.id ? "var(--accent)" : "var(--line)", color: sideTab === tb.id ? "#fff" : "var(--ink-3)", borderRadius: 10, padding: "0 5px" }}>{tb.badge}</span>}
              </button>
            ))}
          </div>

          {/* Lista tab */}
          {sideTab === "lista" && (
            <div className="list">
              {items.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--ink-4)", fontSize: 12 }}>{es ? "Sin ubicaciones" : "No locations"}</div>}
              {items.map(it => (
                <div key={it.kind + it.id} className="row" onClick={() => go({ name: it.kind, id: it.id })}>
                  {it.kind === "entity" ? (
                    <div className="ent-icon" style={{ width: 28, height: 28, background: it.color + "22", border: "1.5px solid " + it.color + "66" }}><Icon name="building" style={{ color: it.color }} /></div>
                  ) : (
                    <div className="av-circle" style={{ width: 28, height: 28, fontSize: 11, background: it.color }}>{initials(it.name)}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{it.sub || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Condados tab */}
          {sideTab === "condados" && (
            <div className="list" style={{ padding: "8px 0" }}>
              {allCounties.length === 0 && (
                <div style={{ padding: "20px 16px", color: "var(--ink-4)", fontSize: 12, textAlign: "center" }}>
                  {es ? "Sin datos de condado. Edita una persona y escribe la ciudad para auto-detectar." : "No county data. Edit a contact and enter a city to auto-detect."}
                </div>
              )}
              {/* "All" option when one is selected */}
              {selectedCounty && (
                <div className="row" style={{ cursor: "pointer", borderBottom: "1px solid var(--line)", background: "var(--accent-50)", padding: "8px 14px" }} onClick={() => setSelectedCounty(null)}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ink-4)", flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--ink-3)" }}>{es ? "← Mostrar todos" : "← Show all"}</div>
                </div>
              )}
              {countyStats.map(({ county, personas, entities, topCities, color }) => {
                const isSelected = selectedCounty === county;
                const total = personas.length + entities.length;
                return (
                  <div key={county}
                    style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer", background: isSelected ? color + "12" : "transparent", borderLeft: isSelected ? "3px solid " + color : "3px solid transparent", transition: "all .15s" }}
                    onClick={() => setSelectedCounty(isSelected ? null : county)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, flex: 1, color: isSelected ? color : "var(--ink)" }}>{county}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: "-.02em" }}>{total}</span>
                    </div>
                    <div style={{ paddingLeft: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {personas.length > 0 && <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{personas.length} {es ? "personas" : "people"}</span>}
                      {entities.length > 0 && <span style={{ fontSize: 10.5, color: "#0ea5e9" }}>{entities.length} {es ? "entidades" : "entities"}</span>}
                    </div>
                    {topCities.length > 0 && (
                      <div style={{ paddingLeft: 18, marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {topCities.map(city => (
                          <span key={city} style={{ fontSize: 10, background: color + "18", color, padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{city}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="map-canvas">
          <MiniMap
            personas={personasFiltered.filter(p => p.lat && p.lng)}
            entities={entitiesFiltered.filter(e => e.lat && e.lng)}
            go={go}
            countyColorMap={countyColorMap}
          />
          {/* County legend overlay */}
          {sideTab === "condados" && allCounties.length > 0 && (
            <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(255,255,255,.95)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,.12)", zIndex: 1000, maxWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>{es ? "Leyenda" : "Legend"}</div>
              {countyStats.slice(0, 6).map(({ county, color }) => (
                <div key={county} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer", opacity: selectedCounty && selectedCounty !== county ? 0.4 : 1 }}
                  onClick={() => setSelectedCounty(selectedCounty === county ? null : county)}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-2)" }}>{county}</span>
                </div>
              ))}
              {countyStats.length > 6 && <div style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 3 }}>+{countyStats.length - 6} más</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.MiniMap = MiniMap;
window.MapPage = MapPage;
