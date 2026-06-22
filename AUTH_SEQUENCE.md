# Authentication Sequence Diagrams (Mermaid)

This file contains Mermaid source for the MSCMS authentication flow. To
render to SVG/PNG you can use the official Mermaid CLI:

```bash
npm i -g @mermaid-js/mermaid-cli
mmdc -i AUTH_SEQUENCE.md -o auth.png
```

Or paste the snippets into <https://mermaid.live>.

---

## 1. Login flow (password grant)

```mermaid
sequenceDiagram
    autonumber
    actor U as User (Browser)
    participant FE as Next.js Front-end
    participant GW as Gateway (8080)
    participant UMS as user-management-service
    participant KC as Keycloak

    U->>FE: Submits username + password
    FE->>GW: POST /auth/login {username, password}
    GW->>UMS: forward POST /auth/login
    UMS->>KC: POST /realms/mscms/protocol/openid-connect/token<br/>grant_type=password
    KC-->>UMS: 200 { access_token, refresh_token, expires_in }
    UMS-->>GW: 200 { access_token, role }
    GW-->>FE: 200 { access_token, role }
    FE->>FE: jwtDecode(access_token) → sub, realm_access.roles
    FE->>FE: localStorage.setItem("token", access_token)
    FE->>FE: localStorage.setItem("keycloakId", sub)
    FE->>FE: localStorage.setItem("user_role", role)
    FE->>FE: Cookies.set("user_role", role, expires: 7d)
    FE-->>U: Redirect to /dashboard
```

---

## 2. Authenticated request to a microservice

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Front-end
    participant GW as Gateway
    participant SVC as player-management-service
    participant KC as Keycloak (JWKS)

    U->>FE: Clicks "Players"
    FE->>GW: GET /players<br/>Authorization: Bearer <jwt>
    GW->>KC: Fetch JWKS (cached)
    KC-->>GW: Public keys
    GW->>GW: Verify signature + expiry + audience
    alt Token invalid / expired
        GW-->>FE: 401 Unauthorized
        FE->>FE: Try refresh flow (see diagram 3)
    else Token valid
        GW->>SVC: GET /players<br/>X-User-Role: ADMIN
        SVC-->>GW: 200 [players]
        GW-->>FE: 200 [players]
    end
```

---

## 3. Refresh-token flow (transparent re-auth)

```mermaid
sequenceDiagram
    autonumber
    participant FE as Front-end
    participant GW as Gateway
    participant UMS as user-management-service
    participant KC as Keycloak

    Note over FE: Access token expired<br/>(any API call → 401)
    FE->>GW: POST /auth/refresh { refresh_token }
    GW->>UMS: forward POST /auth/refresh
    UMS->>KC: POST /token<br/>grant_type=refresh_token
    alt Refresh token still valid
        KC-->>UMS: 200 { access_token, refresh_token (rotated) }
        UMS-->>GW: 200 { access_token, refresh_token }
        GW-->>FE: 200 { access_token, refresh_token }
        FE->>FE: Update localStorage with new tokens
        FE->>FE: Retry the original request
    else Refresh token expired/revoked
        KC-->>UMS: 400 invalid_grant
        UMS-->>FE: 401 Unauthorized
        FE->>FE: Clear storage + cookies
        FE->>FE: Redirect to /login
    end
```

---

## 4. Admin creates a new user

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant FE as Front-end
    participant GW as Gateway
    participant UMS as user-management-service
    participant KC as Keycloak

    A->>FE: Fill "Create User" form, role=PLAYER
    FE->>GW: POST /auth/admin/create-user<br/>Bearer <admin_jwt>
    GW->>GW: Verify JWT → role=ADMIN
    GW->>UMS: forward request
    UMS->>KC: Admin API: POST /users (Keycloak)
    KC-->>UMS: 201 { id: <uuid> }
    UMS->>KC: PUT /users/{id}/role-mappings/realm<br/>(assign PLAYER role)
    KC-->>UMS: 204
    UMS->>UMS: Insert into user_profile + player_profile<br/>(keycloakId = <uuid>)
    UMS-->>GW: 201 { keycloakId, role }
    GW-->>FE: 201 { keycloakId }
    FE->>FE: Refresh users list
```

---

## 5. Role-based access denial (middleware)

```mermaid
sequenceDiagram
    autonumber
    actor F as Fan user
    participant MW as Next.js middleware
    participant FE as Front-end page
    participant GW as Gateway

    F->>MW: GET /dashboard/users (admin-only)
    MW->>MW: Read user_role cookie → "fan"
    MW->>MW: canAccess("/dashboard/users", "fan") → false
    MW-->>F: 302 Redirect to /dashboard

    Note over F,GW: Even if the user bypasses middleware<br/>(e.g. by API call), the gateway rejects.

    F->>GW: GET /users<br/>Bearer <fan_jwt>
    GW->>GW: JWT.realm_access.roles = ["FAN"]
    GW->>GW: Endpoint requires ADMIN → reject
    GW-->>F: 403 Forbidden
```
