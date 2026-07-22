const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL;

const STORAGE_KEY = "mixtape_session";

// Logs in directly against Keycloak's token endpoint using the "Direct Access
// Grant" (Resource Owner Password Credentials) flow. This keeps our own
// custom-styled login form instead of redirecting to Keycloak's hosted page.
// Note: ROPC means our frontend handles the raw password briefly in memory
// before sending it straight to Keycloak over HTTPS in production - Keycloak
// itself never stores it with us, but this flow is generally discouraged for
// public-facing apps in favor of the redirect-based Authorization Code flow.
export async function login(usernameOrEmail, password) {
  const url = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    username: usernameOrEmail,
    password,
    scope: "openid",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || "Incorrect username/email or password.");
  }

  const tokens = await res.json();
  const session = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    user: parseJwt(tokens.access_token),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

// Registration has to go through our backend, since creating a user requires
// Keycloak's Admin API (a confidential, server-side-only client) - the public
// frontend client can't do this directly.
export async function register(username, email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed.");
  }
  return res.json();
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

function parseJwt(token) {
  const payload = token.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  const claims = JSON.parse(json);
  return {
    sub: claims.sub,
    username: claims.preferred_username,
    email: claims.email,
  };
}
