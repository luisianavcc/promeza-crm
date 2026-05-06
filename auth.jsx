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

  const [step, setStep] = React.useState(isFirstTime ? "welcome" : "login");
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
      setError("Configura las credenciales de EmailJS primero.");
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
      setNotice("Código enviado. Revisa " + ADMIN_EMAIL);
    } catch (err) {
      setError("Error al enviar: " + (err?.text || err?.message || "Verifica las credenciales de EmailJS."));
      setGeneratedCode("");
    }
    setLoading(false);
  };

  const doSetup = () => {
    clearMessages();
    if (!generatedCode) { setError("Envía el código primero."); return; }
    if (code.trim() !== generatedCode) { setError("Código incorrecto. Verifica el email."); return; }
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

  const saveEjs = () => {
    localStorage.setItem(EJS_KEY, JSON.stringify(ejsCfg));
    setNotice("Credenciales guardadas.");
  };

  const Field = ({ label, type = "text", value, onChange, placeholder, mono, hint }) => (
    <div className="field" style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={mono ? { fontFamily: "var(--font-mono)", letterSpacing: ".05em" } : {}}
        autoComplete={type === "password" ? "current-password" : "off"}
      />
      {hint && <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 3, lineHeight: 1.4 }}>{hint}</div>}
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

        {/* ─── LOGIN ─── */}
        {step === "login" && (
          <div>
            <div className="auth-title">Bienvenido</div>
            <div className="auth-sub">Ingresa tu contraseña para acceder</div>
            <div className="auth-email-badge">
              <Icon name="mail" size={14} />
              <span>{ADMIN_EMAIL}</span>
            </div>
            <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            {notice && <div className="auth-notice"><Icon name="check" size={14} /> {notice}</div>}
            <button className="btn btn-primary btn-block auth-submit"
              onClick={doLogin} onKeyDown={e => e.key === "Enter" && doLogin()}>
              Ingresar
            </button>

            {!showForgot && (
              <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }}
                onClick={() => { setShowForgot(true); clearMessages(); }}>
                ¿Olvidaste tu contraseña?
              </button>
            )}

            {showForgot && (
              <div className="auth-box">
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Recuperar acceso</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 10 }}>
                  Se enviará un código a <strong>{ADMIN_EMAIL}</strong>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => { setStep("forgot-ejs"); setShowForgot(false); clearMessages(); }}>
                  Continuar
                </button>
                <button className="btn btn-sm btn-ghost" style={{ marginLeft: 6 }}
                  onClick={() => setShowForgot(false)}>Cancelar</button>
              </div>
            )}
          </div>
        )}

        {/* ─── SETUP: Welcome ─── */}
        {step === "welcome" && (
          <div>
            <div className="auth-title">Configurar acceso</div>
            <div className="auth-sub">
              Primera vez en PROMEZA CRM. Crearás una contraseña para administrador.
            </div>
            <div className="auth-info-row">
              <Icon name="mail" size={15} />
              <span>El código de acceso se enviará a <strong>{ADMIN_EMAIL}</strong></span>
            </div>
            <div className="auth-info-row" style={{ marginTop: 6 }}>
              <Icon name="lock" size={15} />
              <span>Solo necesitas hacer esto <strong>una vez</strong></span>
            </div>
            <button className="btn btn-primary btn-block auth-submit" onClick={() => { clearMessages(); setStep("setup-ejs"); }}>
              Comenzar configuración
            </button>
          </div>
        )}

        {/* ─── EJS CONFIG (setup + forgot) ─── */}
        {(step === "setup-ejs" || step === "forgot-ejs") && (
          <div>
            <div className="auth-title">Configura EmailJS</div>
            <div className="auth-sub">
              Para enviar el código necesitas una cuenta gratuita en{" "}
              <a href="https://www.emailjs.com/" target="_blank" rel="noopener">emailjs.com</a>
            </div>
            <div className="auth-hint-box">
              <strong>Instrucciones:</strong>
              <ol style={{ margin: "6px 0 0 14px", padding: 0, fontSize: 12, lineHeight: 1.7 }}>
                <li>Crea una cuenta en <a href="https://www.emailjs.com/" target="_blank" rel="noopener">emailjs.com</a> (gratis)</li>
                <li>Conecta un servicio de email (Gmail, Outlook, etc.)</li>
                <li>Crea una plantilla de email con la variable <code style={{ background: "var(--accent-50)", padding: "0 4px", borderRadius: 3 }}>{"{{code}}"}</code> en el cuerpo</li>
                <li>Copia los IDs en los campos de abajo</li>
              </ol>
            </div>
            <Field label="Service ID" value={ejsCfg.serviceId} onChange={v => setEjsCfg(c => ({ ...c, serviceId: v }))} placeholder="service_xxxxxxx" mono />
            <Field label="Template ID" value={ejsCfg.templateId} onChange={v => setEjsCfg(c => ({ ...c, templateId: v }))} placeholder="template_xxxxxxx" mono />
            <Field label="Public Key" value={ejsCfg.publicKey} onChange={v => setEjsCfg(c => ({ ...c, publicKey: v }))} placeholder="xxxxxxxxxxxxxxxxxxxx" mono />
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            {notice && <div className="auth-notice"><Icon name="check" size={14} /> {notice}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={saveEjs}>Guardar credenciales</button>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => { saveEjs(); setStep(step === "setup-ejs" ? "setup-send" : "forgot-send"); clearMessages(); }}>
                Continuar →
              </button>
            </div>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 6 }}
              onClick={() => setStep(step === "setup-ejs" ? "welcome" : "login")}>
              ← Volver
            </button>
          </div>
        )}

        {/* ─── SEND CODE ─── */}
        {(step === "setup-send" || step === "forgot-send") && (
          <div>
            <div className="auth-title">Enviar código de acceso</div>
            <div className="auth-sub">Haz clic para enviar el código de 6 dígitos a:</div>
            <div className="auth-email-badge" style={{ marginBottom: 16 }}>
              <Icon name="mail" size={14} />
              <span><strong>{ADMIN_EMAIL}</strong></span>
            </div>
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            {notice && <div className="auth-notice"><Icon name="check" size={14} /> {notice}</div>}
            {!generatedCode && (
              <button className="btn btn-primary btn-block auth-submit" disabled={loading} onClick={sendCode}>
                {loading ? "Enviando…" : "Enviar código ahora"}
              </button>
            )}
            {generatedCode && (
              <button className="btn btn-primary btn-block auth-submit"
                onClick={() => { clearMessages(); setStep(step === "setup-send" ? "setup-code" : "forgot-code"); }}>
                Ingresar el código recibido →
              </button>
            )}
            <button className="btn btn-ghost btn-block" style={{ marginTop: 6 }}
              onClick={() => setStep(step === "setup-send" ? "setup-ejs" : "forgot-ejs")}>
              ← Volver
            </button>
          </div>
        )}

        {/* ─── ENTER CODE + SET PASSWORD ─── */}
        {(step === "setup-code" || step === "forgot-code") && (
          <div>
            <div className="auth-title">
              {step === "setup-code" ? "Verificar y crear contraseña" : "Verificar y cambiar contraseña"}
            </div>
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
            <Field label="Nueva contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
            <Field label="Confirmar contraseña" type="password" value={password2} onChange={setPassword2} placeholder="Repite la contraseña" />
            {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}
            {notice && <div className="auth-notice"><Icon name="check" size={14} /> {notice}</div>}
            <button className="btn btn-primary btn-block auth-submit"
              onClick={step === "setup-code" ? doSetup : doReset}>
              {step === "setup-code" ? "Crear acceso y entrar" : "Cambiar contraseña y entrar"}
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
