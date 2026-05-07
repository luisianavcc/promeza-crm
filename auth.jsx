// PROMEZA CRM — Authentication screen

const AUTH_KEY = "promeza_auth";
const SESSION_KEY = "promeza_session";
const EJS_KEY = "promeza_ejs";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

const hashPass = (pw) => btoa("promeza-crm:" + pw + ":2026");

const getAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
};

const getSession = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!s || s.expires < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch { return null; }
};

const saveSession = (email) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email,
    expires: Date.now() + SESSION_DURATION,
  }));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

const getEjsConfig = () => {
  try { return JSON.parse(localStorage.getItem(EJS_KEY)) || {}; }
  catch { return {}; }
};

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

const ADMIN_EMAIL = "betty@promeza.com";

const AuthScreen = ({ onLogin }) => {
  const auth = getAuth();
  const isFirstTime = !auth;

  // First time → direct password setup (no code needed)
  // Returning user → login with password
  // Forgot password → optionally use EmailJS code
  const [step, setStep] = React.useState(isFirstTime ? "setup" : "login");

  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [code, setCode] = React.useState("");
  const [generatedCode, setGeneratedCode] = React.useState("");
  const [ejsCfg, setEjsCfg] = React.useState(() => getEjsConfig());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [showForgot, setShowForgot] = React.useState(false);

  const clearMessages = () => { setError(""); setNotice(""); };

  const sendCode = async () => {
    clearMessages();
    const cfg = getEjsConfig();
    if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey) {
      setError("Configura las credenciales de EmailJS primero (en el paso anterior).");
      return;
    }
    setLoading(true);
    const newCode = genCode();
    setGeneratedCode(newCode);
    try {
      await emailjs.send(
        cfg.serviceId,
        cfg.templateId,
        { to_email: ADMIN_EMAIL, code: newCode, app_name: "PROMEZA CRM" },
        { publicKey: cfg.publicKey }
      );
      setNotice("Código enviado a " + ADMIN_EMAIL);
    } catch (err) {
      setError("Error al enviar: " + (err?.text || err?.message || "Verifica las credenciales de EmailJS."));
      setGeneratedCode("");
    }
    setLoading(false);
  };

  // First-time setup: no email code needed, just create a password
  const doSetup = () => {
    clearMessages();
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden."); return; }
    localStorage.setItem(AUTH_KEY, JSON.stringify({ email: ADMIN_EMAIL, passwordHash: hashPass(password) }));
    saveSession(ADMIN_EMAIL);
    onLogin(ADMIN_EMAIL);
  };

  const doLogin = () => {
    clearMessages();
    const stored = getAuth();
    if (!stored) { setError("No hay cuenta configurada. Recarga la página."); return; }
    if (hashPass(password) !== stored.passwordHash) { setError("Contraseña incorrecta."); return; }
    saveSession(stored.email);
    onLogin(stored.email);
  };

  const doReset = () => {
    clearMessages();
    if (!generatedCode) { setError("Envía el código primero."); return; }
    if (code.trim() !== generatedCode) { setError("Código incorrecto. Verifica el email."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden."); return; }
    const stored = getAuth();
    localStorage.setItem(AUTH_KEY, JSON.stringify({ ...stored, passwordHash: hashPass(password) }));
    saveSession(stored ? stored.email : ADMIN_EMAIL);
    onLogin(stored ? stored.email : ADMIN_EMAIL);
  };

  const Field = ({ label, type = "text", value, onChange, placeholder, mono, autoFocus, name, id, autoComplete }) => (
    <div className="field" style={{ marginBottom: 14 }}>
      <label htmlFor={id}>{label}</label>
      <input
        type={type}
        id={id}
        name={name}
        autoComplete={autoComplete}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={mono ? { fontFamily: "var(--font-mono)", fontSize: 12 } : {}}
        onKeyDown={e => {
          if (e.key === "Enter") {
            if (step === "login") doLogin();
            if (step === "setup") doSetup();
          }
        }}
      />
    </div>
  );

  return (
    <div className="auth-veil">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-brand">
          <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 22, borderRadius: 12 }}>P</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.02em" }}>PROMEZA CRM</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>Base de datos relacional</div>
          </div>
        </div>

        {/* ─── FIRST TIME SETUP ─── */}
        {step === "setup" && (
          <div>
            <div className="auth-title">Crear tu contraseña</div>
            <div className="auth-sub">
              Primera vez en PROMEZA CRM. Crea una contraseña para acceder.
            </div>
            <div className="auth-email-badge">
              <Icon name="mail" size={14} />
              <span>Cuenta: <strong>{ADMIN_EMAIL}</strong></span>
            </div>
            <Field
              label="Nueva contraseña"
              type="password"
              id="setup-pw1"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 6 caracteres"
              autoFocus
            />
            <Field
              label="Confirmar contraseña"
              type="password"
              id="setup-pw2"
              name="confirm-password"
              autoComplete="new-password"
              value={password2}
              onChange={setPassword2}
              placeholder="Repite la contraseña"
            />
            {error && (
              <div className="auth-error">
                <Icon name="alert" size={14} /> {error}
              </div>
            )}
            <button
              className="btn btn-primary btn-block auth-submit"
              onClick={doSetup}
              style={{ marginTop: 4 }}
            >
              Crear contraseña y entrar
            </button>
          </div>
        )}

        {/* ─── LOGIN ─── */}
        {step === "login" && (
          <div>
            <div className="auth-title">Bienvenido</div>
            <div className="auth-sub">Ingresa tu contraseña para acceder a PROMEZA CRM</div>
            <div className="auth-email-badge">
              <Icon name="mail" size={14} />
              <span>{ADMIN_EMAIL}</span>
            </div>
            <Field
              label="Contraseña"
              type="password"
              id="login-pw"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="Tu contraseña"
              autoFocus
            />
            {error && (
              <div className="auth-error">
                <Icon name="alert" size={14} /> {error}
              </div>
            )}
            {notice && (
              <div className="auth-notice">
                <Icon name="check" size={14} /> {notice}
              </div>
            )}
            <button
              className="btn btn-primary btn-block auth-submit"
              onClick={doLogin}
              style={{ marginTop: 4 }}
            >
              Ingresar
            </button>

            {!showForgot && (
              <button
                className="btn btn-ghost btn-block"
                style={{ marginTop: 8 }}
                onClick={() => { setShowForgot(true); clearMessages(); }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}

            {showForgot && (
              <div className="auth-box">
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Recuperar acceso</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 10, lineHeight: 1.5 }}>
                  Para recuperar tu contraseña necesitas configurar EmailJS. Ve a Configuración → EmailJS, o contáctanos.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-sm btn-primary"
                    onClick={() => { setStep("forgot-ejs"); setShowForgot(false); clearMessages(); }}>
                    Configurar EmailJS
                  </button>
                  <button className="btn btn-sm btn-ghost"
                    onClick={() => setShowForgot(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── FORGOT: EmailJS config ─── */}
        {step === "forgot-ejs" && (
          <div>
            <div className="auth-title">Configurar EmailJS</div>
            <div className="auth-sub">
              Para recuperar tu contraseña necesitas una cuenta gratuita en{" "}
              <a href="https://www.emailjs.com/" target="_blank" rel="noopener">emailjs.com</a>
            </div>
            <div className="auth-hint-box">
              <strong>Pasos:</strong>
              <ol style={{ margin: "6px 0 0 14px", padding: 0, fontSize: 12, lineHeight: 1.8 }}>
                <li>Crea una cuenta gratis en <a href="https://www.emailjs.com/" target="_blank" rel="noopener">emailjs.com</a></li>
                <li>Conecta Gmail o Outlook</li>
                <li>Crea plantilla con <code style={{ background: "var(--accent-50)", padding: "0 4px", borderRadius: 3 }}>{"{{code}}"}</code> en el cuerpo</li>
                <li>Copia los 3 IDs abajo</li>
              </ol>
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
            {notice && <div className="auth-notice"><Icon name="check" size={14} /> {notice}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("login")}>← Volver</button>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => {
                  localStorage.setItem(EJS_KEY, JSON.stringify(ejsCfg));
                  setStep("forgot-send");
                  clearMessages();
                }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ─── FORGOT: Send code ─── */}
        {step === "forgot-send" && (
          <div>
            <div className="auth-title">Enviar código</div>
            <div className="auth-sub">Se enviará un código de 6 dígitos a:</div>
            <div className="auth-email-badge" style={{ marginBottom: 16 }}>
              <Icon name="mail" size={14} />
              <span><strong>{ADMIN_EMAIL}</strong></span>
            </div>
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            {notice && <div className="auth-notice"><Icon name="check" size={14} /> {notice}</div>}
            {!generatedCode ? (
              <button className="btn btn-primary btn-block auth-submit" disabled={loading} onClick={sendCode}>
                {loading ? "Enviando…" : "Enviar código ahora"}
              </button>
            ) : (
              <button className="btn btn-primary btn-block auth-submit"
                onClick={() => { clearMessages(); setStep("forgot-code"); }}>
                Ingresar código recibido →
              </button>
            )}
            <button className="btn btn-ghost btn-block" style={{ marginTop: 6 }}
              onClick={() => setStep("forgot-ejs")}>← Volver</button>
          </div>
        )}

        {/* ─── FORGOT: Enter code + new password ─── */}
        {step === "forgot-code" && (
          <div>
            <div className="auth-title">Nueva contraseña</div>
            <div className="auth-sub">Ingresa el código recibido en {ADMIN_EMAIL}</div>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Código de 6 dígitos</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{ letterSpacing: "0.35em", fontSize: 20, textAlign: "center", fontFamily: "var(--font-mono)" }}
              />
            </div>
            <Field label="Nueva contraseña" type="password" id="reset-pw1" name="new-password" autoComplete="new-password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
            <Field label="Confirmar contraseña" type="password" id="reset-pw2" name="confirm-password" autoComplete="new-password" value={password2} onChange={setPassword2} placeholder="Repite la contraseña" />
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            <button className="btn btn-primary btn-block auth-submit" onClick={doReset}>
              Cambiar contraseña y entrar
            </button>
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
window.getAuth = getAuth;
