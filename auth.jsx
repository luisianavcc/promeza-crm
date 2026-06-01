// PROMEZA CRM — Authentication with AES-256 crypto + TOTP 2FA

// ─── Crypto utilities ───

const PASS_HASH_KEY  = "promeza_pass_hash";
const PASS_HASH_SALT = "promeza-crm-v1";
const SESSION_CRYPTO_KEY = "promeza_sk";
const TOTP_KEY = "promeza_totp_enc";

const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const deriveAESKey = async (password) => {
  const keyMat = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode("promeza-salt-2026"), iterations: 100000, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
};

const storeSessionKey = async (password) => {
  const key = await deriveAESKey(password);
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

// ─── TOTP (RFC 6238) — works with Microsoft Authenticator ───

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Decode = (s) => {
  s = s.replace(/=+$/, "").toUpperCase();
  let bits = 0, val = 0;
  const out = [];
  for (const c of s) {
    const idx = BASE32.indexOf(c);
    if (idx < 0) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) { bits -= 8; out.push((val >> bits) & 0xff); }
  }
  return new Uint8Array(out);
};

const base32Encode = (bytes) => {
  let bits = 0, val = 0, out = "";
  for (const b of bytes) {
    val = (val << 8) | b;
    bits += 8;
    while (bits >= 5) { bits -= 5; out += BASE32[(val >> bits) & 31]; }
  }
  if (bits > 0) out += BASE32[(val << (5 - bits)) & 31];
  return out;
};

const generateTOTPSecret = () => base32Encode(crypto.getRandomValues(new Uint8Array(20)));

const verifyTOTP = async (secret, token) => {
  const t = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(t)) return false;
  const keyBytes = base32Decode(secret);
  const hmacKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (const delta of [-1, 0, 1]) {
    const c = counter + delta;
    const buf = new ArrayBuffer(8);
    new DataView(buf).setUint32(4, c, false);
    const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, buf));
    const off = hmac[19] & 0xf;
    const code = ((hmac[off] & 0x7f) << 24 | hmac[off + 1] << 16 | hmac[off + 2] << 8 | hmac[off + 3]) % 1000000;
    if (String(code).padStart(6, "0") === t) return true;
  }
  return false;
};

window.CryptoUtils = {
  sha256, deriveAESKey, storeSessionKey, loadSessionKey,
  PASS_HASH_KEY, PASS_HASH_SALT, SESSION_CRYPTO_KEY, TOTP_KEY,
  generateTOTPSecret, verifyTOTP,

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

  changePassword: async (currentPass, newPass, data) => {
    const curHash = await sha256(PASS_HASH_SALT + ":" + currentPass);
    const stored = localStorage.getItem(PASS_HASH_KEY);
    if (curHash !== stored) return { error: "Contraseña actual incorrecta" };
    const oldKey = await loadSessionKey();
    const newHash = await sha256(PASS_HASH_SALT + ":" + newPass);
    localStorage.setItem(PASS_HASH_KEY, newHash);
    await storeSessionKey(newPass);
    const newKey = await loadSessionKey();
    // Re-encrypt data
    const enc = await window.CryptoUtils.encrypt(JSON.stringify(data), newKey);
    localStorage.setItem("promeza_data_enc", enc);
    // Re-encrypt TOTP secret so it stays valid after password change
    const totpEnc = localStorage.getItem(TOTP_KEY);
    if (totpEnc && oldKey) {
      try {
        const totpSecret = await window.CryptoUtils.decrypt(totpEnc, oldKey);
        const newTotpEnc = await window.CryptoUtils.encrypt(totpSecret, newKey);
        localStorage.setItem(TOTP_KEY, newTotpEnc);
      } catch { /* leave as-is if re-encryption fails */ }
    }
    return { key: newKey };
  },
};

// ─── Session management ───

const SESSION_KEY = "promeza_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

const DEMO_USER = "Promeza";
const DEFAULT_PASSWORD = "@Promeza!:2026";

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

// ─── Shared brand logo ───

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

// ─── TOTP step (shared by AuthScreen + UnlockScreen) ───

const TOTPStep = ({ onVerify, onBack, loading, error }) => {
  const [code, setCode] = React.useState("");
  return (
    <div className="auth-veil">
      <div className="auth-card">
        <AuthBrand />
        <div className="auth-title">Verificación en dos pasos</div>
        <div className="auth-sub" style={{ marginBottom: 20 }}>
          Abre <strong>Microsoft Authenticator</strong> e ingresa el código de 6 dígitos de PROMEZA CRM.
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="totp-code">Código de verificación</label>
          <input
            id="totp-code"
            type="text" inputMode="numeric" maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter" && code.length === 6) onVerify(code); }}
            style={{ letterSpacing: "0.35em", fontSize: 26, textAlign: "center", fontWeight: 700 }}
            disabled={loading}
          />
        </div>

        {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}

        <button className="btn btn-primary btn-block auth-submit" onClick={() => onVerify(code)} disabled={loading || code.length !== 6}>
          {loading ? "Verificando…" : "Verificar →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button type="button" onClick={onBack}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-4)", fontFamily: "inherit", textDecoration: "underline" }}>
            ← Volver
          </button>
        </div>

        <div className="auth-footer">PROMEZA CRM v1.0 · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
};

// ─── AuthScreen ───

const AuthScreen = ({ onLogin }) => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState("password"); // "password" | "totp"
  const [pendingKey, setPendingKey] = React.useState(null);

  const doLogin = async () => {
    setError("");
    if (!username.trim()) { setError("Ingresa el usuario."); return; }
    if (!password) { setError("Ingresa la contraseña."); return; }

    const isUser = username.trim().toLowerCase() === DEMO_USER.toLowerCase();
    if (!isUser) { setError("Usuario o contraseña incorrectos."); return; }

    setLoading(true);
    try {
      let storedHash = localStorage.getItem(PASS_HASH_KEY);
      if (!storedHash) {
        storedHash = await sha256(PASS_HASH_SALT + ":" + DEFAULT_PASSWORD);
        localStorage.setItem(PASS_HASH_KEY, storedHash);
      }

      const inputHash = await sha256(PASS_HASH_SALT + ":" + password);
      if (inputHash !== storedHash) {
        setError("Usuario o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      await storeSessionKey(password);
      const key = await loadSessionKey();

      // If TOTP is configured, require the code before completing login
      if (localStorage.getItem(TOTP_KEY)) {
        setPendingKey(key);
        setStep("totp");
        setLoading(false);
        return;
      }

      saveSession(DEMO_USER);
      onLogin(DEMO_USER);
    } catch (err) {
      console.error("Login error:", err);
      setError("Error de autenticación. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const doTOTP = async (code) => {
    setError("");
    setLoading(true);
    try {
      const totpEnc = localStorage.getItem(TOTP_KEY);
      const secret = await window.CryptoUtils.decrypt(totpEnc, pendingKey);
      const valid = await verifyTOTP(secret, code);
      if (!valid) {
        setError("Código incorrecto. El código cambia cada 30 segundos.");
        setLoading(false);
        return;
      }
      saveSession(DEMO_USER);
      onLogin(DEMO_USER);
    } catch (err) {
      console.error("TOTP error:", err);
      setError("Error al verificar. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const onKey = (e) => { if (e.key === "Enter") doLogin(); };

  if (step === "totp") {
    return <TOTPStep onVerify={doTOTP} onBack={() => { setStep("password"); setError(""); }} loading={loading} error={error} />;
  }

  return (
    <div className="auth-veil">
      <div className="auth-card">
        <AuthBrand />
        <div className="auth-title">Bienvenido</div>
        <div className="auth-sub">Ingresa tus credenciales para acceder</div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="auth-user">Usuario</label>
          <input
            id="auth-user" type="text" autoComplete="username"
            value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
            placeholder="Promeza" autoFocus onKeyDown={onKey}
            disabled={loading}
          />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="auth-pw" style={{ display: "flex", justifyContent: "space-between" }}>
            Contraseña
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "var(--ink-4)", fontFamily: "inherit", padding: 0 }}
              disabled={loading}>
              {showPw ? "Ocultar" : "Mostrar"}
            </button>
          </label>
          <input
            id="auth-pw" type={showPw ? "text" : "password"} autoComplete="current-password"
            value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
            placeholder="Contraseña" onKeyDown={onKey}
            disabled={loading}
          />
        </div>

        {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}

        <button className="btn btn-primary btn-block auth-submit" onClick={doLogin} disabled={loading}>
          {loading ? "Verificando…" : "Continuar →"}
        </button>

        <div className="auth-footer">PROMEZA CRM v1.0 · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
};

// ─── UnlockScreen ───

const UnlockScreen = ({ email, onUnlock, onLogout }) => {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState("password");
  const [pendingKey, setPendingKey] = React.useState(null);

  const displayName = email || "usuario";

  const doUnlock = async () => {
    setError("");
    if (!password) { setError("Ingresa tu contraseña."); return; }

    setLoading(true);
    try {
      const storedHash = localStorage.getItem(PASS_HASH_KEY);
      if (!storedHash) {
        setError("Error de sesión. Inicia sesión de nuevo.");
        setLoading(false);
        return;
      }

      const inputHash = await sha256(PASS_HASH_SALT + ":" + password);
      if (inputHash !== storedHash) {
        setError("Contraseña incorrecta.");
        setLoading(false);
        return;
      }

      await storeSessionKey(password);
      const key = await loadSessionKey();

      if (localStorage.getItem(TOTP_KEY)) {
        setPendingKey(key);
        setStep("totp");
        setLoading(false);
        return;
      }

      onUnlock();
    } catch (err) {
      console.error("Unlock error:", err);
      setError("Error al desbloquear. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const doTOTP = async (code) => {
    setError("");
    setLoading(true);
    try {
      const totpEnc = localStorage.getItem(TOTP_KEY);
      const secret = await window.CryptoUtils.decrypt(totpEnc, pendingKey);
      const valid = await verifyTOTP(secret, code);
      if (!valid) {
        setError("Código incorrecto. El código cambia cada 30 segundos.");
        setLoading(false);
        return;
      }
      onUnlock();
    } catch (err) {
      console.error("TOTP error:", err);
      setError("Error al verificar. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const onKey = (e) => { if (e.key === "Enter") doUnlock(); };

  if (step === "totp") {
    return <TOTPStep onVerify={doTOTP} onBack={() => { setStep("password"); setError(""); }} loading={loading} error={error} />;
  }

  return (
    <div className="auth-veil">
      <div className="auth-card">
        <AuthBrand />
        <div className="auth-title">Bienvenido de vuelta</div>
        <div className="auth-sub" style={{ marginBottom: 20 }}>
          Hola, <strong>{displayName}</strong>. Ingresa tu contraseña para continuar.
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="unlock-pw" style={{ display: "flex", justifyContent: "space-between" }}>
            Contraseña
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "var(--ink-4)", fontFamily: "inherit", padding: 0 }}
              disabled={loading}>
              {showPw ? "Ocultar" : "Mostrar"}
            </button>
          </label>
          <input
            id="unlock-pw" type={showPw ? "text" : "password"} autoComplete="current-password"
            value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
            placeholder="Contraseña" autoFocus onKeyDown={onKey}
            disabled={loading}
          />
        </div>

        {error && <div className="auth-error"><Icon name="alert" size={14} /> {error}</div>}

        <button className="btn btn-primary btn-block auth-submit" onClick={doUnlock} disabled={loading}>
          {loading ? "Verificando…" : "Desbloquear →"}
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
