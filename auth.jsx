// PROMEZA CRM — Authentication via Microsoft Entra ID (Azure AD)

// ─── Default MSAL config (pre-configured for promeza.com) ───

const DEFAULT_MSAL_CONFIG = {
  clientId: "20bf3e17-00ad-4316-ae9e-8a06ccb2d0bf",
  tenantId: "6477fab5-91da-4cc6-b4ea-ce35db0d6c51",
  authorizedEmails: "",
  extraKey: "",
};

// ─── Crypto utilities ───

const SESSION_CRYPTO_KEY = "promeza_sk";
const MSAL_CONFIG_KEY    = "promeza_msal_cfg";
const PASS_HASH_KEY      = "promeza_pass_hash";
const PASS_HASH_SALT     = "promeza-crm-v1";

const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const deriveSharedKey = async (clientId, tenantId, extraKey = "") => {
  const material = [clientId, tenantId, extraKey.trim(), "promeza-v1"].filter(Boolean).join(":");
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(material), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode("promeza-shared-2026"), iterations: 100000, hash: "SHA-256" },
    km, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
};

const storeSessionKey = async (key) => {
  const raw = await crypto.subtle.exportKey("raw", key);
  sessionStorage.setItem(SESSION_CRYPTO_KEY, btoa(String.fromCharCode(...new Uint8Array(raw))));
};

const loadSessionKey = async () => {
  const b64 = sessionStorage.getItem(SESSION_CRYPTO_KEY);
  if (!b64) return null;
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  } catch { return null; }
};

const getMSALConfig = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(MSAL_CONFIG_KEY)) || {};
    return { ...DEFAULT_MSAL_CONFIG, ...stored };
  } catch { return { ...DEFAULT_MSAL_CONFIG }; }
};

const buildMSALInstance = (cfg) => {
  if (!cfg.clientId || !cfg.tenantId) return null;
  try {
    return new msal.PublicClientApplication({
      auth: {
        clientId: cfg.clientId,
        authority: `https://login.microsoftonline.com/${cfg.tenantId}`,
        redirectUri: window.location.origin + window.location.pathname,
      },
      cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false },
    });
  } catch { return null; }
};

window.CryptoUtils = {
  sha256, deriveSharedKey, storeSessionKey, loadSessionKey,
  getMSALConfig, buildMSALInstance,
  SESSION_CRYPTO_KEY, MSAL_CONFIG_KEY, PASS_HASH_KEY, PASS_HASH_SALT,

  encrypt: async (str, key) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(str));
    const combined = new Uint8Array(12 + enc.byteLength);
    combined.set(iv, 0); combined.set(new Uint8Array(enc), 12);
    return btoa(String.fromCharCode(...combined));
  },

  decrypt: async (b64, key) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv = bytes.slice(0, 12), data = bytes.slice(12);
    const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(dec);
  },
};

// ─── Session management ───

const SESSION_KEY = "promeza_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

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

// ─── Brand logo ───

const AuthBrand = () => (
  <div className="auth-brand">
    <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #0f172a 0%, #14532d 100%)", display: "grid", placeItems: "center", boxShadow: "0 0 18px rgba(132,204,22,.3)", flexShrink: 0 }}>
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <path d="M14 3C9.58 3 6 6.58 6 11c0 2.83 1.4 5.33 3.55 6.88V20a1 1 0 001 1h6.9a1 1 0 001-1v-2.12C20.6 16.33 22 13.83 22 11c0-4.42-3.58-8-8-8z" fill="#a3e635" fillOpacity=".9"/>
        <path d="M10.5 22h7" stroke="#a3e635" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M11.5 25h5" stroke="#a3e635" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M14 3v-2M7 5l-1.5-1.5M21 5l1.5-1.5M5 11H3M23 11h2" stroke="#a3e635" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".55"/>
      </svg>
    </div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-.02em" }}>PROME<span style={{ color: "#84cc16" }}>ZA</span></div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", marginTop: 1 }}>Base de Datos</div>
    </div>
  </div>
);

const MicrosoftLogo = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

// ─── AuthScreen ───

const AuthScreen = ({ onLogin }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const doMicrosoftLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const cfg = getMSALConfig();
      const msalInstance = buildMSALInstance(cfg);
      if (!msalInstance) { setError("Error de configuración."); setLoading(false); return; }

      const response = await msalInstance.loginPopup({
        scopes: ["User.Read", "openid", "profile", "email"],
        prompt: "select_account",
      });

      const email = (response.account?.username || "").toLowerCase();
      if (!email) { setError("No se pudo obtener el correo."); setLoading(false); return; }

      if (!email.endsWith("@promeza.com")) {
        setError("Solo se permiten cuentas @promeza.com.");
        setLoading(false);
        return;
      }

      const authorized = (cfg.authorizedEmails || "")
        .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (authorized.length > 0 && !authorized.includes(email)) {
        setError("Esta cuenta no está autorizada. Contacta al administrador.");
        setLoading(false);
        return;
      }

      const key = await deriveSharedKey(cfg.clientId, cfg.tenantId, cfg.extraKey || "");
      await storeSessionKey(key);
      saveSession(email);
      onLogin(email);
    } catch (err) {
      if (!err.errorCode?.includes("cancelled") && !err.message?.includes("cancelled")) {
        setError("Error al iniciar sesión: " + (err.message || err.errorCode || "Inténtalo de nuevo."));
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-veil">
      <div className="auth-card">
        <AuthBrand />
        <div className="auth-title">Bienvenido</div>
        <div className="auth-sub" style={{ marginBottom: 24 }}>
          Inicia sesión con tu cuenta <strong>@promeza.com</strong>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 14 }}><Icon name="alert" size={14} /> {error}</div>}

        <button className="btn btn-primary btn-block auth-submit" onClick={doMicrosoftLogin} disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {loading ? "Conectando…" : (<><MicrosoftLogo /> Iniciar sesión con Microsoft</>)}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--ink-4)" }}>
          Si tienes Microsoft Authenticator activo,<br/>te pedirá el código automáticamente.
        </div>

        <div className="auth-footer">PROMEZA CRM v1.0 · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
};

// ─── UnlockScreen ───

const UnlockScreen = ({ email, onUnlock, onLogout }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const displayName = email || "usuario";
  const cfg = getMSALConfig();

  const doReauth = async () => {
    setLoading(true);
    setError("");
    try {
      const msalInstance = buildMSALInstance(cfg);
      if (!msalInstance) { setError("Error de configuración."); setLoading(false); return; }

      let account = null;
      try {
        const r = await msalInstance.ssoSilent({ scopes: ["User.Read", "openid"], loginHint: email });
        account = r.account;
      } catch {
        const r = await msalInstance.loginPopup({ scopes: ["User.Read", "openid"], loginHint: email });
        account = r?.account;
      }

      if (!account || account.username.toLowerCase() !== email.toLowerCase()) {
        setError("La cuenta no coincide con la sesión activa.");
        setLoading(false);
        return;
      }

      const key = await deriveSharedKey(cfg.clientId, cfg.tenantId, cfg.extraKey || "");
      await storeSessionKey(key);
      onUnlock();
    } catch (err) {
      if (!err.errorCode?.includes("cancelled") && !err.message?.includes("cancelled")) {
        setError("Error al verificar: " + (err.message || err.errorCode));
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-veil">
      <div className="auth-card">
        <AuthBrand />
        <div className="auth-title">Bienvenido de vuelta</div>
        <div className="auth-sub" style={{ marginBottom: 24 }}>
          Hola, <strong>{displayName}</strong>. Confirma tu identidad para continuar.
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 14 }}><Icon name="alert" size={14} /> {error}</div>}

        <button className="btn btn-primary btn-block auth-submit" onClick={doReauth} disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {loading ? "Verificando…" : (<><MicrosoftLogo /> Continuar con Microsoft</>)}
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button type="button" onClick={onLogout}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-4)", fontFamily: "inherit", textDecoration: "underline" }}>
            Cerrar sesión
          </button>
        </div>

        <div className="auth-footer">PROMEZA CRM v1.0 · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
};

window.AuthScreen = AuthScreen;
window.UnlockScreen = UnlockScreen;
window.getSession = getSession;
window.saveSession = saveSession;
window.clearSession = clearSession;
window.getPasswords = () => ({});
