// PROMEZA CRM — Authentication (single user)

const SESSION_KEY = "promeza_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

const DEMO_USER = "Promeza";
const DEMO_PASS_HASH = btoa("promeza-crm:@Promeza!:2026");

const getSession = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!s || s.expires < Date.now()) { localStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch { return null; }
};
const saveSession = (user) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user, expires: Date.now() + SESSION_DURATION }));
};
const clearSession = () => localStorage.removeItem(SESSION_KEY);

// ─── AuthScreen ───

const AuthScreen = ({ onLogin }) => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);

  const doLogin = () => {
    setError("");
    if (!username.trim()) { setError("Ingresa el usuario."); return; }
    if (!password) { setError("Ingresa la contraseña."); return; }
    const isUser = username.trim().toLowerCase() === DEMO_USER.toLowerCase();
    const isPass = btoa("promeza-crm:" + password + ":2026") === DEMO_PASS_HASH;
    if (!isUser || !isPass) { setError("Usuario o contraseña incorrectos."); return; }
    saveSession(DEMO_USER);
    onLogin(DEMO_USER);
  };

  const onKey = (e) => { if (e.key === "Enter") doLogin(); };

  return (
    <div className="auth-veil">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 22, borderRadius: 12 }}>P</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.02em" }}>PROMEZA CRM</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>Base de datos relacional</div>
          </div>
        </div>

        <div className="auth-title">Bienvenido</div>
        <div className="auth-sub">Ingresa tus credenciales para acceder</div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="auth-user">Usuario</label>
          <input
            id="auth-user" type="text" autoComplete="username"
            value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
            placeholder="Promeza" autoFocus onKeyDown={onKey}
          />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="auth-pw" style={{ display: "flex", justifyContent: "space-between" }}>
            Contraseña
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "var(--ink-4)", fontFamily: "inherit", padding: 0 }}>
              {showPw ? "Ocultar" : "Mostrar"}
            </button>
          </label>
          <input
            id="auth-pw" type={showPw ? "text" : "password"} autoComplete="current-password"
            value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
            placeholder="Contraseña" onKeyDown={onKey}
          />
        </div>

        {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}

        <button className="btn btn-primary btn-block auth-submit" onClick={doLogin}>
          Continuar →
        </button>

        <div className="auth-footer">PROMEZA CRM v1.0 · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
};

window.AuthScreen = AuthScreen;
window.getSession = getSession;
window.saveSession = saveSession;
window.clearSession = clearSession;
window.getPasswords = () => ({});
