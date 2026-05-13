// PROMEZA CRM — Authentication (multi-user)

const AUTH_PASSWORDS_KEY = "promeza_passwords"; // { email: passwordHash }
const SESSION_KEY = "promeza_session";
const EJS_KEY = "promeza_ejs";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

const hashPass = (pw) => btoa("promeza-crm:" + pw + ":2026");

// Migrate old single-user auth format → new per-user format
(() => {
  try {
    const old = localStorage.getItem("promeza_auth");
    if (old && !localStorage.getItem(AUTH_PASSWORDS_KEY)) {
      const parsed = JSON.parse(old);
      if (parsed.email && parsed.passwordHash) {
        localStorage.setItem(AUTH_PASSWORDS_KEY, JSON.stringify({ [parsed.email]: parsed.passwordHash }));
      }
    }
  } catch {}
})();

const getPasswords = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_PASSWORDS_KEY)) || {}; }
  catch { return {}; }
};
const savePasswords = (pw) => localStorage.setItem(AUTH_PASSWORDS_KEY, JSON.stringify(pw));

const getSession = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!s || s.expires < Date.now()) { localStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch { return null; }
};
const saveSession = (email) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, expires: Date.now() + SESSION_DURATION }));
};
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const getEjsConfig = () => {
  try { return JSON.parse(localStorage.getItem(EJS_KEY)) || {}; }
  catch { return {}; }
};
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

// ─── AuthScreen ───

const AuthScreen = ({ onLogin }) => {
  const users = window.PROMEZA_USERS || [];
  const [email, setEmail] = React.useState(users.length === 1 ? users[0].email : "");
  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [code, setCode] = React.useState("");
  const [generatedCode, setGeneratedCode] = React.useState("");
  const [ejsCfg, setEjsCfg] = React.useState(() => getEjsConfig());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [step, setStep] = React.useState("login");

  const clearMessages = () => { setError(""); setNotice(""); };

  const userForEmail = users.find(u => u.email === email);
  const hasPassword = !!getPasswords()[email];

  const doLogin = () => {
    clearMessages();
    if (!email) { setError("Selecciona un usuario."); return; }
    if (!userForEmail) { setError("Email no autorizado."); return; }
    const pw = getPasswords();
    if (!pw[email]) {
      // First time for this user — go to password setup
      setPassword(""); setPassword2("");
      setStep("setup");
      return;
    }
    if (hashPass(password) !== pw[email]) { setError("Contraseña incorrecta."); return; }
    saveSession(email);
    onLogin(email);
  };

  const doSetup = () => {
    clearMessages();
    if (password.length < 6) { setError("Mínimo 6 caracteres."); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden."); return; }
    const pw = getPasswords();
    pw[email] = hashPass(password);
    savePasswords(pw);
    saveSession(email);
    onLogin(email);
  };

  const sendCode = async () => {
    clearMessages();
    const cfg = getEjsConfig();
    if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey) {
      setError("Configura las credenciales de EmailJS primero.");
      return;
    }
    setLoading(true);
    const newCode = genCode();
    setGeneratedCode(newCode);
    try {
      await emailjs.send(
        cfg.serviceId, cfg.templateId,
        { to_email: email, code: newCode, app_name: "PROMEZA CRM" },
        { publicKey: cfg.publicKey }
      );
      setNotice("Código enviado a " + email);
    } catch (err) {
      setError("Error al enviar: " + (err?.text || err?.message || "Verifica las credenciales."));
      setGeneratedCode("");
    }
    setLoading(false);
  };

  const doReset = () => {
    clearMessages();
    if (!generatedCode) { setError("Envía el código primero."); return; }
    if (code.trim() !== generatedCode) { setError("Código incorrecto."); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres."); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden."); return; }
    const pw = getPasswords();
    pw[email] = hashPass(password);
    savePasswords(pw);
    saveSession(email);
    onLogin(email);
  };

  const Field = ({ label, type = "text", value, onChange, placeholder, autoFocus, id, name, autoComplete }) => (
    <div className="field" style={{ marginBottom: 14 }}>
      <label htmlFor={id}>{label}</label>
      <input
        type={type} id={id} name={name} autoComplete={autoComplete}
        value={value || ""} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        onKeyDown={e => { if (e.key === "Enter") { if (step === "login") doLogin(); if (step === "setup") doSetup(); } }}
      />
    </div>
  );

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

        {/* ─── LOGIN ─── */}
        {step === "login" && (
          <div>
            <div className="auth-title">Bienvenido</div>
            <div className="auth-sub">Ingresa tus credenciales para acceder</div>

            {/* Email selector */}
            {users.length > 1 ? (
              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="auth-email">Usuario</label>
                <select id="auth-email" value={email} onChange={e => { setEmail(e.target.value); clearMessages(); }}>
                  <option value="">— Selecciona tu cuenta —</option>
                  {users.map(u => (
                    <option key={u.email} value={u.email}>{u.name} · {u.email}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="auth-email-badge">
                <Icon name="mail" size={14} />
                <span>{email}</span>
              </div>
            )}

            {/* Password — only if the user has one set */}
            {email && hasPassword && (
              <Field
                label="Contraseña"
                type="password" id="login-pw" name="password" autoComplete="current-password"
                value={password} onChange={setPassword}
                placeholder="Tu contraseña" autoFocus
              />
            )}

            {email && !hasPassword && (
              <div className="auth-notice" style={{ marginBottom: 12 }}>
                <Icon name="check" size={13} /> Primera vez — crearás tu contraseña a continuación
              </div>
            )}

            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}

            <button className="btn btn-primary btn-block auth-submit" disabled={!email} onClick={doLogin}>
              {email && !hasPassword ? "Continuar →" : "Ingresar"}
            </button>

            {email && hasPassword && (
              <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }}
                onClick={() => { clearMessages(); setGeneratedCode(""); setStep("forgot-ejs"); }}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        )}

        {/* ─── SETUP (first time for this user) ─── */}
        {step === "setup" && (
          <div>
            <div className="auth-title">Crear contraseña</div>
            <div className="auth-sub">Primera vez en PROMEZA CRM. Elige tu contraseña.</div>
            <div className="auth-email-badge">
              <Icon name="mail" size={14} />
              <span>{userForEmail?.name || email} · <strong>{email}</strong></span>
            </div>
            <Field label="Nueva contraseña" type="password" id="setup-pw1" name="new-password" autoComplete="new-password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" autoFocus />
            <Field label="Confirmar contraseña" type="password" id="setup-pw2" name="confirm-password" autoComplete="new-password" value={password2} onChange={setPassword2} placeholder="Repite la contraseña" />
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            <button className="btn btn-primary btn-block auth-submit" onClick={doSetup}>
              Crear contraseña y entrar
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => { setStep("login"); clearMessages(); }}>
              ← Volver
            </button>
          </div>
        )}

        {/* ─── FORGOT: EmailJS config ─── */}
        {step === "forgot-ejs" && (
          <div>
            <div className="auth-title">Recuperar contraseña</div>
            <div className="auth-sub">
              Necesitas EmailJS para recibir un código de recuperación en{" "}
              <strong>{email}</strong>.{" "}
              <a href="https://www.emailjs.com/" target="_blank" rel="noopener">emailjs.com</a>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Service ID</label>
              <input type="text" value={ejsCfg.serviceId || ""} onChange={e => setEjsCfg(c => ({ ...c, serviceId: e.target.value }))} placeholder="service_xxxxxxx" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Template ID</label>
              <input type="text" value={ejsCfg.templateId || ""} onChange={e => setEjsCfg(c => ({ ...c, templateId: e.target.value }))} placeholder="template_xxxxxxx" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Public Key</label>
              <input type="text" value={ejsCfg.publicKey || ""} onChange={e => setEjsCfg(c => ({ ...c, publicKey: e.target.value }))} placeholder="xxxxxxxxxxxxxxxxxxxx" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
            </div>
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("login")}>← Volver</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { localStorage.setItem(EJS_KEY, JSON.stringify(ejsCfg)); setStep("forgot-send"); clearMessages(); }}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ─── FORGOT: Send code ─── */}
        {step === "forgot-send" && (
          <div>
            <div className="auth-title">Enviar código</div>
            <div className="auth-sub">Se enviará un código de 6 dígitos a:</div>
            <div className="auth-email-badge" style={{ marginBottom: 16 }}>
              <Icon name="mail" size={14} /><span><strong>{email}</strong></span>
            </div>
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            {notice && <div className="auth-notice"><Icon name="check" size={14} /> {notice}</div>}
            {!generatedCode ? (
              <button className="btn btn-primary btn-block auth-submit" disabled={loading} onClick={sendCode}>
                {loading ? "Enviando…" : "Enviar código ahora"}
              </button>
            ) : (
              <button className="btn btn-primary btn-block auth-submit" onClick={() => { clearMessages(); setStep("forgot-code"); }}>
                Ingresar código recibido →
              </button>
            )}
            <button className="btn btn-ghost btn-block" style={{ marginTop: 6 }} onClick={() => setStep("forgot-ejs")}>← Volver</button>
          </div>
        )}

        {/* ─── FORGOT: Enter code + new password ─── */}
        {step === "forgot-code" && (
          <div>
            <div className="auth-title">Nueva contraseña</div>
            <div className="auth-sub">Ingresa el código recibido en <strong>{email}</strong></div>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Código de 6 dígitos</label>
              <input
                type="text" value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" maxLength={6}
                style={{ letterSpacing: "0.35em", fontSize: 20, textAlign: "center", fontFamily: "var(--font-mono)" }}
              />
            </div>
            <Field label="Nueva contraseña" type="password" id="reset-pw1" name="new-password" autoComplete="new-password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
            <Field label="Confirmar contraseña" type="password" id="reset-pw2" name="confirm-password" autoComplete="new-password" value={password2} onChange={setPassword2} placeholder="Repite la contraseña" />
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            <button className="btn btn-primary btn-block auth-submit" onClick={doReset}>Cambiar contraseña y entrar</button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} disabled={loading} onClick={sendCode}>
              {loading ? "Enviando…" : "Reenviar código"}
            </button>
          </div>
        )}

        <div className="auth-footer">PROMEZA CRM v1.0 · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
};

window.AuthScreen = AuthScreen;
window.getSession = getSession;
window.saveSession = saveSession;
window.clearSession = clearSession;
window.getPasswords = getPasswords;
