// PROMEZA CRM — Map components

const _L = () => window.L;

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

const MiniMap = ({ personas = [], entities = [], focus = null, go = null }) => {
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
      const ic = L.divIcon({
        html: '<div class="map-marker entity"></div>',
        className: "", iconSize: [20, 20], iconAnchor: [10, 10],
      });
      const m = L.marker([e.lat, e.lng], { icon: ic }).addTo(layer);
      m.bindPopup('<div class="pop-title">' + e.name + '</div><div class="pop-sub">' + e.city + ', ' + e.country + '</div>');
      if (go) m.on("click", () => go({ name: "entity", id: e.id }));
      points.push([e.lat, e.lng]);
    });
    personas.forEach(p => {
      if (!p.lat && !p.lng) return;
      const ic = L.divIcon({
        html: '<div class="map-marker" style="background:' + p.color + '"></div>',
        className: "", iconSize: [16, 16], iconAnchor: [8, 8],
      });
      const m = L.marker([p.lat, p.lng], { icon: ic }).addTo(layer);
      m.bindPopup('<div class="pop-title">' + p.first + ' ' + p.last + '</div><div class="pop-sub">' + p.city + ', ' + p.country + '</div>');
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
  }, [personas, entities, focus]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

const MapPage = ({ t, lang, data, go }) => {
  const [showPersonas, setShowPersonas] = React.useState(true);
  const [showEntities, setShowEntities] = React.useState(true);
  const [country, setCountry] = React.useState("all");
  const countries = ["all", ...new Set([
    ...data.personas.map(p => p.country),
    ...data.entities.map(e => e.country),
  ])];

  const personas = data.personas.filter(p => country === "all" || p.country === country);
  const entities = data.entities.filter(e => country === "all" || e.country === country);

  const visiblePersonas = showPersonas ? personas : [];
  const visibleEntities = showEntities ? entities : [];

  const items = [
    ...visibleEntities.map(e => ({ kind: "entity", id: e.id, name: e.name, sub: e.city + ", " + e.country, lat: e.lat, lng: e.lng })),
    ...visiblePersonas.map(p => ({ kind: "person", id: p.id, name: fullName(p), sub: p.city + ", " + p.country, lat: p.lat, lng: p.lng, color: p.color })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav.map}</h1>
          <div className="page-sub">{visiblePersonas.length + visibleEntities.length} {lang === "es" ? "ubicaciones" : "locations"}</div>
        </div>
        <div className="page-actions">
          <button className={"chip " + (showEntities ? "on" : "")} onClick={() => setShowEntities(v => !v)}>
            <Icon name="building" /> {t.nav.entities}
          </button>
          <button className={"chip " + (showPersonas ? "on" : "")} onClick={() => setShowPersonas(v => !v)}>
            <Icon name="users" /> {t.nav.personas}
          </button>
          <select value={country} onChange={e => setCountry(e.target.value)}
            style={{ height: 30, padding: "0 10px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", fontSize: 13 }}>
            {countries.map(c => <option key={c} value={c}>{c === "all" ? t.common.all : c}</option>)}
          </select>
        </div>
      </div>

      <div className="map-page">
        <div className="map-side">
          <div className="head">
            <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === "es" ? "Lista" : "List"}</div>
            <div className="muted" style={{ fontSize: 11 }}>{items.length} {lang === "es" ? "registros" : "records"}</div>
          </div>
          <div className="list">
            {items.map(it => (
              <div key={it.kind + it.id} className="row" onClick={() => go({ name: it.kind, id: it.id })}>
                {it.kind === "entity" ? (
                  <div className="ent-icon" style={{ width: 28, height: 28 }}><Icon name="building" /></div>
                ) : (
                  <div className="av-circle" style={{ width: 28, height: 28, fontSize: 11, background: it.color }}>{initials(it.name)}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{it.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="map-canvas">
          <MiniMap personas={visiblePersonas} entities={visibleEntities} go={go} />
        </div>
      </div>
    </div>
  );
};

window.MiniMap = MiniMap;
window.MapPage = MapPage;
