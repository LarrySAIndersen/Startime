/**
 * BFF session + Keycloak OIDC (Authorization Code + PKCE).
 * P0-03: wire login/callback/logout route handlers; no tokens in localStorage.
 */

export type SessionUser = {
  displayName: string;
  initials: string;
  roles: string[];
};

/** Dev/demo session until Keycloak BFF is connected. */
export function getDemoSession(): SessionUser {
  return {
    displayName: "Jan Vinding",
    initials: "JV",
    roles: ["employee", "manager", "admin"],
  };
}

export function keycloakAuthorizeUrl(origin: string): string {
  const base = process.env.KEYCLOAK_URL ?? "http://127.0.0.1:8080";
  const realm = process.env.KEYCLOAK_REALM ?? "star-dev";
  const clientId = process.env.KEYCLOAK_CLIENT_ID ?? "star-hub";
  const redirectUri = `${origin}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
  });
  return `${base}/realms/${realm}/protocol/openid-connect/auth?${params}`;
}
