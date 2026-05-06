// PROMEZA CRM — App root

const { useState, useMemo, useEffect } = React;

const App = () => {
  const [lang, setLang] = useState("es");
  const t = window.PROMEZA_I18N[lang];
  const [route, setRoute] = useState({ name: "home" });
  const [query, setQuery] = useState("");

  // Live data: clone the seed so we can add comments / records mutably-ish
  const [data, setData] = useState(() => ({
    personas: [...window.PROMEZA_DATA.personas],
    entities: [...window.PROMEZA_DATA.entities],
    comments: { ...window.PROMEZA_DATA.comments },
  }));

  const [modal, setModal] = useState(null); // 'new-person' | 'new-entity' | null

  const go = (r) => {
    if (r.name === "new-person") { setModal("new-person"); return; }
    if (r.name === "new-entity") { setModal("new-entity"); return; }
    setRoute(r);
    window.scrollTo({ top: 0 });
  };

  const counts = { personas: data.personas.length, entities: data.entities.length };

  const addComment = (targetId, text) => {
    setData(d => {
      const next = { ...d, comments: { ...d.comments } };
      const list = next.comments[targetId] ? [...next.comments[targetId]] : [];
      list.unshift({ author: "Andrea Lozano", date: new Date().toISOString().slice(0, 10), text });
      next.comments[targetId] = list;
      return next;
    });
  };

  const onSearchSubmit = () => {
    if (!query.trim()) return;
    // simple: jump to personas list with search applied (the list keeps its own filter though)
    setRoute({ name: "personas" });
  };

  const handleSavePerson = (form) => {
    const id = "p" + (data.personas.length + 1);
    const tags = form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    const palette = ["#2F6BFF", "#0E7C66", "#B45309", "#7C3AED", "#BE185D", "#0369A1", "#15803D"];
    const color = palette[(form.first.charCodeAt(0) || 0) % palette.length];
    const newP = {
      id, first: form.first, last: form.last,
      role: form.role, roleOther: form.roleOther,
      email: form.email, phone: form.phone,
      address: form.address, zip: form.zip, city: form.city, state: form.state, country: form.country,
      lat: 0, lng: 0,
      website: form.website, social: form.social,
      entities: form.entities.map(le => ({ id: le.id, role: le.role, roleOther: le.roleOther })),
      tags, language: form.language, status: form.status,
      birthday: form.birthday, lastContact: form.lastContact,
      color,
    };
    setData(d => ({ ...d, personas: [newP, ...d.personas] }));
    setModal(null);
    setRoute({ name: "person", id });
  };

  const handleSaveEntity = (form) => {
    const id = "e" + (data.entities.length + 1);
    const tags = form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    const newE = {
      id, name: form.name, type: form.type,
      email: form.email, phone: form.phone,
      address: form.address, zip: form.zip, city: form.city, state: form.state, country: form.country,
      lat: 0, lng: 0,
      website: form.website, social: form.social,
      size: form.size ? parseInt(form.size) : null,
      founded: form.founded, parent: form.parent || null,
      tags,
    };
    setData(d => ({ ...d, entities: [newE, ...d.entities] }));
    setModal(null);
    setRoute({ name: "entity", id });
  };

  let view;
  switch (route.name) {
    case "home": view = <Home t={t} lang={lang} data={data} go={go} />; break;
    case "personas": view = <PersonasList t={t} lang={lang} data={data} go={go} />; break;
    case "entities": view = <EntitiesList t={t} lang={lang} data={data} go={go} />; break;
    case "person": view = <PersonProfile id={route.id} t={t} lang={lang} data={data} go={go} addComment={addComment} />; break;
    case "entity": view = <EntityProfile id={route.id} t={t} lang={lang} data={data} go={go} addComment={addComment} />; break;
    case "map": view = <MapPage t={t} lang={lang} data={data} go={go} />; break;
    default: view = <Home t={t} lang={lang} data={data} go={go} />;
  }

  return (
    <div className="app">
      <Sidebar route={route} go={go} t={t} counts={counts} />
      <Topbar t={t} lang={lang} setLang={setLang} query={query} setQuery={setQuery} onSearchSubmit={onSearchSubmit} />
      <main className="main">{view}</main>

      {modal === "new-person" && (
        <NewPersonForm t={t} lang={lang} data={data} onClose={() => setModal(null)} onSave={handleSavePerson} />
      )}
      {modal === "new-entity" && (
        <NewEntityForm t={t} lang={lang} data={data} onClose={() => setModal(null)} onSave={handleSaveEntity} />
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
