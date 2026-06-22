# MSCMS Frontend — Study Narrative

This is a plain-English walkthrough of our front-end, written so you
can read it like a story and explain it confidently in the viva. Each
section flows into the next; the goal is for you to be able to
**talk** about the project, not just point at code.

> **What you're studying:** the Next.js application in
> `sports-club-main/my-app`. It runs on `http://localhost:3000`,
> talks to a Spring Cloud Gateway on `http://localhost:8080`, and to
> two Python ML services that listen on ports 9000 and 9001.

---

## Chapter 1 — What we built and why we chose this stack

MSCMS is a cloud-native platform for a multi-sport club. The
front-end is the layer the user actually sees: an admin who provisions
new users, a head coach who plans training, a doctor who logs an
injury, a sponsor who submits an offer, a fan who browses fixtures.
All of these people share one URL, one login screen, and one menu —
but each of them sees a tailored slice of the system. Our job in the
front-end was to make that tailoring feel natural and invisible.

We chose **Next.js 16** as the framework because it gives us three
things in one place: the App Router for our pages, server-side
middleware that runs at the edge for route protection, and a
rewrite mechanism that lets us proxy the Python ML services through
the same origin. Plain React would have forced us to spin up a
separate server for both the middleware and the proxy; Next.js
absorbed both of those needs without extra moving parts.

On top of Next.js we run **React 19** with the experimental React
Compiler enabled (you can see `reactCompiler: true` in
`next.config.mjs`). The compiler memoises components automatically,
so we don't have to litter our code with `useMemo` and `useCallback`
hooks. The code stays readable, and the compiler does the heavy
lifting under the hood.

Our styling is **Tailwind CSS v4**. We don't have CSS files scattered
around the project — almost every visual decision is made inline as a
class name in JSX. This sounds messy at first but it scales
beautifully: the colours we use, the radii of our cards, the
typography weights, all of them live next to the markup they affect.
The font is **Barlow Condensed**, imported in the root layout — it's
what gives every page that tight, athletic look that fits the sports
theme.

A few smaller libraries glue things together. We use **jwt-decode**
to read the access token client-side after login (so we can pull out
the user's `sub`, email, name and roles). We use **js-cookie** to
write the user's role into a cookie so our middleware can read it.
We use **recharts** for every analytics chart — bar charts, radar
charts, the responsive container that resizes everything when the
window changes. We use **react-icons** pervasively, picking the icon
family that matches the page's tone — Feather icons for navigation,
Material icons for media, Remix icons for teams, Ant Design for
edit/delete actions. And we use **framer-motion** for the tiny
entry animations on the login page and the formation board.

When the examiner asks "why this stack?", the one-line answer is:
*we wanted the smallest, most modern foundation that lets one
developer ship a real product in weeks, not months.*

---

## Chapter 2 — How the project is laid out

When you open the repo, two folders matter on the front-end side:
`app/` and `src/`. The `app/` folder holds the routes — each
sub-folder under `app/` is a URL. So `app/dashboard/players/page.js`
is what loads when you navigate to `/dashboard/players`. The page
files themselves are very thin: they usually just import a component
from `src/components/` and render it. This separation means we can
swap out a page without touching the route registration, and the
routes are easy to scan at a glance.

Inside `src/` we have three sub-folders worth memorising. `src/lib/`
is our small library of cross-cutting helpers: the API layer
(`api.js`), the auth helpers (`auth.js`), the permission map
(`permissions.js`), and a custom React hook for reading the user's
role (`useRole.js`). `src/data/` holds static reference data — the
sport-to-emoji map, the medical-field schemas, the formation
templates. And `src/components/` holds every visual building block,
grouped into sub-folders by domain (`matches/`, `medical/`,
`players/`, `analytics/`, etc.).

There's also a tiny but important file at the project root called
`middleware.js`. It's not in `app/` or `src/` because Next.js looks
for it at the root — it's the edge function that runs before any
dashboard page renders, deciding whether the user is allowed to see
the page they asked for.

---

## Chapter 3 — How a user logs in

The login flow is the most important thing to understand because
everything else assumes it has happened. Picture an admin opening
the app for the first time. The page they land on is
`app/login/page.js`, which renders the `<Login />` component from
`src/components/Login.jsx`. The left half of the screen is a
marketing panel with the Sportify logo and four feature cards. The
right half is a simple form with username and password fields.

When the admin types their credentials and presses *Sign In*, the
component sends a POST request to `http://localhost:8080/auth/login`.
The Spring Cloud Gateway forwards this request to our
`user-management-service`, which in turn calls Keycloak's OAuth 2.0
password-grant endpoint. Keycloak validates the credentials and
returns an access token, a refresh token, and the user's role.

Now the front-end does five things in quick succession. First, it
stores the access token in `localStorage` under the key `token`,
using the small helper in `src/lib/auth.js`. Second, it decodes the
token with `jwt-decode` to read three claims: `sub` (the Keycloak
user UUID), `realm_access.roles` (the array of realm roles the user
has), and `email` and `name` (for the profile page). Third, it picks
the first role from `realm_access.roles`, lowercases it, and writes
it both to `localStorage` under `user_role` AND to a cookie of the
same name. Fourth, it writes a `user_info` object containing the
username, the Keycloak ID, the email, the display name and the login
timestamp — this is what the profile page reads later. Fifth, it
performs a hard navigation to `/dashboard` using
`window.location.href`, not Next.js's `router.push`.

Why two places for the role? Because the front-end's React code can
read `localStorage`, but the Next.js middleware that runs on the
server cannot — it can only read cookies. So we mirror the role into
both. The token itself only ever lives in `localStorage`; we never
put it in a cookie, because cookies are sent on every request and
would expose the token to cross-site request forgery.

Why a hard navigation instead of a soft one? Because the middleware
that runs on the next request reads the cookie we just wrote. A soft
push sometimes races the cookie-write and causes a brief flash of
the login page. A hard navigation guarantees that the next request
goes through the middleware, with the cookie in place.

---

## Chapter 4 — How we keep different roles out of each other's pages

The role-based access control is implemented in three layers, and
the examiner will almost certainly ask you to walk through them.

The first layer is **Keycloak itself**. Every user account in the
system has at least one realm role attached. When the user logs in,
Keycloak signs the JWT with those roles baked in as a claim. Anybody
who pretends to be a different user would have to forge that
signature — which they can't, because the signing key lives only in
Keycloak.

The second layer is the **Next.js middleware** at the edge. The file
`middleware.js` at the project root runs before any page in
`/dashboard/**` renders. It reads the `user_role` cookie, calls our
permission helper, and either lets the request through or redirects
the user. If the user has no role cookie, they go to `/login`. If
they have a role but it's not allowed for the route they're trying
to visit, they get bounced back to `/dashboard`. This is invisible to
the user — the redirect happens before any HTML is rendered.

The third layer is the **Spring gateway**, which sits between the
front-end and every microservice. Even if an attacker bypassed the
front-end entirely and hit the API directly with a stolen JWT, the
gateway still verifies the token signature, extracts the roles, and
rejects calls that aren't allowed. So the front-end and the back-end
have independent defences against the same threat.

The thing that ties all three layers together is the **permission
map** in `src/lib/permissions.js`. This file is the single source of
truth. It exports a flat object called `ROUTE_ROLES` that maps every
`/dashboard/*` URL to the list of roles allowed on that page. It
also exports `SIDEBAR_SECTIONS`, which is the same information
grouped for the menu UI. The Sidebar component and the middleware
both import from this one file, so they cannot drift apart. If you
add a new role tomorrow, you only have to touch this one file and
everything downstream picks it up.

One small but useful detail: we also have a `READ_ONLY_ROLES` set
that currently contains just `fan`. The `useRole` hook reads this
set and returns `canEdit: false` for fans, so every Add/Edit/Delete
button can be guarded with `{canEdit && <Button />}`. The fan and the
admin see exactly the same page component, but the buttons just
don't render for the fan. This means when we add a new field to a
staff view, the fan view picks it up automatically as read-only.

There are nineteen roles in total: admin at the top, sport_manager
and team_manager for leadership, head_coach plus assistant_coach and
specific_coach (like goalkeeper coach) for technical staff,
team_doctor and physiotherapist and fitness_coach for medical,
performance_analyst and scout for analytics, sponsor for commercial,
player and fan for end-users, and national_team for the federation
side. The full list lives in Keycloak's realm export and is mirrored
in our `ROUTE_ROLES`.

---

## Chapter 5 — How the front-end talks to the back-end

Every HTTP call goes through one helper called `apiFetch`, defined
at the top of `src/lib/api.js`. The function is small but it does
three important things. It reads the access token from
`localStorage` and attaches it as a `Bearer` header. If the request
has a body, it sets the `Content-Type` to `application/json`. And it
normalises errors — if the response status is not OK, it tries to
parse the JSON error body, throws an `Error` with the message
inside, and lets the caller's `try/catch` block handle it.

Below the helper, the file exports a single object called `api` with
dozens of methods organised by domain. There's `api.getMatches()`
that calls `GET /matches` on the gateway, `api.createPlayer(data)`
that posts to `/players`, `api.medical.Injuries.get()` that fetches
all injuries, and so on. The naming is uniform: `get*` for list
fetches, `getById` for single fetches, `create*` for posts,
`update*` for puts, `delete*` for deletes. Once you know the
pattern, you can guess the function name for any operation.

There are two special namespaces inside the `api` object. `api.medical`
is nested because the Medical page has seven tabs (Injuries,
Diagnoses, Treatments, Rehabilitation, Recovery, Fitness Tests,
Training Loads) and each tab has its own CRUD. Rather than have
fourteen `getInjuries`-style names cluttering the top level, we
group them as `api.medical.Injuries.get`, `api.medical.Injuries.post`,
and so on. The second special namespace is `api.ml`, which exposes
just two methods: `predictMatch` and `ratePlayer`. These are the
only calls in the entire app that don't go to the gateway — they go
to our ML proxy instead.

That proxy is worth explaining. Our two FastAPI services run as
Docker containers exposing ports 9000 (match prediction) and 9001
(player rating). If the browser called them directly, the FastAPI
services would have to enable CORS for the front-end origin, and we'd
have to deal with pre-flight requests. Instead, we configured Next.js
to rewrite paths starting with `/ml-proxy/match/` to
`http://localhost:9000/`, and paths starting with `/ml-proxy/player/`
to `http://localhost:9001/`. From the browser's perspective, every
request is same-origin; from FastAPI's perspective, every request
arrives without surprises; and we don't have to teach two extra
services about CORS.

---

## Chapter 6 — The dashboard shell and the navigation

After login, the user lands on `/dashboard`. The file
`app/dashboard/layout.js` is the React layout that wraps every
dashboard page. It renders a sidebar on the left, a navbar across
the top, and the current page underneath. This is the shell every
authenticated user sees.

The sidebar is one of the smartest pieces in the whole app. It reads
`SIDEBAR_SECTIONS` from the permissions module, which is a grouped
list like *Overview / People / Operations / Analytics / AI &
Predictions / Finance & Sponsors / Communication*. Each section has
items, each item has a name and a URL. When the sidebar mounts, it
reads `localStorage.user_role`, then for each item it calls
`canAccess(item.href, role)` and only renders the items that pass.
A fan therefore sees a much shorter sidebar than an admin, but
they're both rendering from the same source file.

The icons are kept separate from the permission file on purpose: the
permission file is for what the user is allowed to do, and the icons
file is for how it looks. The sidebar maps each route to a
React-icons component — for example `/dashboard/teams` gets the
volleyball icon from Material Design, `/dashboard/medical` gets the
heart icon from Feather, `/dashboard/ml-predict` gets the CPU icon.

The navbar above the content area shows the user's role chip
(*Admin*, *Sport Manager*, *Fan* etc.) read from `localStorage`, a
bell icon for notifications with an unread count, and a profile
dropdown with a Logout option. The Logout handler clears the
`localStorage` keys, deletes the cookie, and redirects to `/login`.

---

## Chapter 7 — The pages, one role at a time

The best way to study the pages is to walk through them as the
roles that use them.

The **admin** lives across User Management, Staff Management,
Notifications and Teams & Sports. On User Management, they see
every user in the system across every role; they can filter, search,
add a new user (which provisions a Keycloak account and inserts the
matching profile row in `mscms_user`), and delete a user (which
cascades into Keycloak revocation). The add modal uses the same
regex Keycloak does (`/^[a-zA-Z0-9._-]+$/`) so the call never fails
with an *invalid character* error from Keycloak. On Staff
Management, the modal pre-filters role choices to non-player staff
and exposes fields like specialty and team assignment. Notifications
is the broadcast page — pick a target audience, a priority, a
channel, and send.

The **sport manager** lives in the cross-discipline views: the
overview dashboard with W/D/L per discipline, the Transfers page
with three tabs (incoming, outgoing, call-ups), and the Sponsors
page where pending offers wait for accept/reject. The Transfers
tables read the JPA relations (so the cell shows `t.outerPlayer.id`
not `t.outerPlayerId`, and the team names come from `t.fromTeam.name`
not `fromTeamId`). The Sponsors page shows Spotify and Nike accepted
in the seeded data, plus Damm and Beko sitting pending — that's
designed to give you a complete demo of the decision pipeline.

The **team manager** owns one specific team. Their dashboard scopes
itself by reading their `staff_profile.teamId`. They schedule
matches through the Matches page (which has its own modal posting to
`POST /matches`), attach formations to those matches, drag-and-drop
players to fill the line-up, log goals and cards as match events, and
trigger post-match performance reviews. The matches list has a sport
filter that we made case-insensitive so the backend's uppercase
`BASKETBALL` matches the UI button's `"Basketball"`.

The **head coach and assistant coaches** own the Training page and
the tactical board. The Training page has four tabs (Sessions, Plans,
Drills, Attendance) all driven by the shared `FilterTabs` and
`FormModal` components — every CRUD is just `api.get/create/update/
delete` followed by a refresh. The tactical board, which we built as
`FormationBoard.jsx`, is sport-aware: football matches render the
pitch image with players positioned according to the chosen
formation (4-3-3, 4-4-2, or 3-5-2), while non-football matches
render a neutral "tactical pitch is football-only" panel. Players on
the pitch are `IoIosPerson` icons rather than photos — we did this
deliberately because we don't have licensed player photos and a
generic icon avoids any awkwardness. Admins see an extra side panel
on the right with the squad numbers; non-admins see just the pitch.

The **medical staff** (doctors, physios, fitness coaches) all share
the Medical page. It's tabbed across seven sub-domains: Injuries,
Diagnoses, Treatments, Rehabilitation, Recovery, Fitness Tests,
Training Loads. The page uses a `MEDICAL_CONFIG` dictionary that
maps each tab to its field schema, so adding a new field to a tab is
a one-line edit. The Add button opens a `FormModal` with the right
schema, the page sends the payload through `api.medical[tab].post`,
and the list refreshes. We had a bug here at one point where the
seeder file referenced constants that were never declared, so the
seeder failed to compile and every tab looked empty — fixing that
was a matter of declaring the missing identifiers and switching the
skip-guard to be per-table idempotent.

The **scout** lives on the Scouting page with three tabs: Call-Ups,
Tracked Players, Opponent Teams. The page reads
`requestDate` (not `callUpDate` — that field doesn't exist on the
entity), it reads `p.outerTeam.name` (because the team relation is
nested), and the Add buttons send POST payloads that wrap IDs as
nested objects (`{ outerTeam: { id: 1 } }`) so JPA accepts them.
Scout reports go through the Scout Reports page, which uses a
five-axis radar (technical, physical, tactical, mental, potential)
and a recommendation chip.

The **sponsor** sees their own sponsorship offers and a public view
of the club. The Sponsorship page lets them submit a new offer (which
defaults to PENDING) and see the decision status of any previous
offer.

The **performance analyst** is the heaviest consumer of analytics.
They have an Overview page (`<Analytics />`) that aggregates five
endpoints in parallel — team analytics, player analytics, match
analyses, training analytics, active injuries — into one canvas of
headline cards and secondary stats. Below the overview, a `<Filter />`
component renders three live sub-tabs: Team Performance (a bar chart
of W/D/L per team plus a sport distribution pie), Player Statistics
(score and rating per sport plus the top three performers by
rating), and Tactical Analysis (a radar comparing the top two teams
across six derived axes — win rate, defense, attack, resilience,
fitness, decisive). All of these used to be powered by hardcoded
demo data; we rewrote the component to derive every chart from the
live endpoints. The analyst also has the AI & Predictions page,
which is just a thin form over our two FastAPI services.

The **player** has a personal dashboard, a personal stats view, and
a personal medical view — all read-only. The dashboard fan-out
illustrates a nice pattern: the page issues one logical request to
the gateway, the gateway dispatches three parallel calls to
training-match, reports-analytics and medical-fitness, then composes
the answers into one response. The browser sees one round trip.

The **fan** sees a curated read-only surface. The Fan Matches /
Players / Teams / Training / Reports pages reuse the same React
components as the staff pages, but `useRole().canEdit` is false so
every Add/Edit/Delete button is omitted. The Sidebar also hides
medical, scouting and sponsor links from fans entirely.

Then there are the global pages every authenticated user has:
**Messages** (which uses a small `getCurrentKeycloakId` helper that
falls back to decoding the JWT if `localStorage.keycloakId` is
missing), **Alerts** (which calls a slightly unusual API where the
backend takes `?id=` as a query string for the resolve and
acknowledge actions), and **Settings** (whose ProfileTab reads the
displayed name and email and role straight from the decoded JWT so
they always match what Keycloak believes).

---

## Chapter 8 — Shared components and why they exist

Almost every page in the dashboard uses the same handful of building
blocks from `src/components/shared/SharedComponents.jsx`. Knowing
these names by heart is the difference between sounding fluent and
sounding rehearsed.

The `StatusBadge` is a small coloured chip that renders any backend
status enum value with the right colour. Greens for ACTIVE,
COMPLETED, RECOVERED, FINISHED; ambers for PENDING, IN_PROGRESS;
reds for INJURED, CRITICAL, REPORTED; greys for EXPIRED, RETIRED. The
mapping lives in a `statusMap` object at the top of the file, so
adding a new status is a one-line change.

The `SportBadge` is similar but for sport types — it uses
`SPORT_COLORS` and `SPORT_ICONS` from our data module to render an
emoji plus a coloured pill.

The `Toast` is the bottom-right notification that pops up when an
API call succeeds or fails. It auto-dismisses after three seconds
using a `useEffect` timeout. Every page pushes its messages through
the same component, so the visual style is consistent.

The `EmptyState` is what we render when a list comes back empty. It
takes an icon and a title and renders a centred panel that says
"nothing here yet" in different words. This is important because an
empty list with no message is confusing — *did the call fail? am I
filtered out? did the data not seed?* — so we always show a friendly
message.

The `FilterTabs` is the strip of tabs at the top of multi-section
pages (Players, Training, Matches, Medical, Analytics, etc.). It
takes a `tabs` prop which is an array of `[key, label]` pairs. The
label can be a plain string or JSX, so we can embed an icon: for
example the Training Attendance tab is
`["attendance", <span><FaClipboardCheck /> Attendance</span>]`.

The `FormModal` is the workhorse of every CRUD page. It takes a
`fields` array (where each field is `{ key, label, type, options,
required, full, placeholder }`), an `initialData` object for the
edit case, an `onSubmit` callback and an `onClose` callback. The
modal renders text inputs, number inputs, date inputs and dropdowns
based on the `type`. Submitting calls `onSubmit(formData)` and the
page handles the POST or PUT.

`PageHeader`, `AddButton`, `StatCard`, `ProgressBar` round out the
set. `PageHeader` is a two-line title with a button slot on the
right; `AddButton` is the standardised green + button; `StatCard` is
a small KPI box; `ProgressBar` is a 0–100 horizontal bar used on the
team analytics cards.

There are also two charting wrappers in `src/components/charts/`:
`Pie` (built on chart.js) and the bar/radar code embedded in
`analytics/Filter.jsx` (built on recharts). The Pie component counts
items by their `sportType` field and renders a slice per sport, with
a palette of six emerald-cyan-violet-amber-red-blue colours.

---

## Chapter 9 — The patterns that made the code stay simple

When you talk about the project, you can highlight a few patterns
that we kept consistent across the app. They are small but they're
what keep the code from rotting as we added features.

The first pattern is **a single permissions file**. Both the Sidebar
component and the middleware import from `src/lib/permissions.js`,
and there is no second place where role rules live. If somebody
added a duplicate permission map somewhere, the two could drift; by
having only one, they can't.

The second pattern is **defence in depth on routes**. A fan who
manually types `/dashboard/users` into the URL gets redirected by
the middleware. Even if they somehow bypassed it, the Sidebar
wouldn't show the link. Even if they hit the API directly with a
Bearer token, the gateway would reject the call because the JWT
doesn't carry the `ADMIN` role. Three independent layers, all
sourcing from the same permission map.

The third pattern is **sport awareness**. Football and handball
share the names of several positions (LEFT_WING, LEFT_BACK,
GOALKEEPER), so the backend `Position` enum prefixes handball
positions with `HB_`. Our `getSportFromPlayer` helper in the Players
page checks the prefix before falling back to a sport lookup; this
is why our football filter never accidentally shows a handball
player.

The fourth pattern is **hard navigation after login**. We use
`window.location.href` rather than `router.push` so the next request
goes through the middleware with the just-written cookie. A soft
push can occasionally race the cookie-write and cause a flash of the
login page.

The fifth pattern is **bounded ML autocomplete**. The player-rating
form lists only twenty player names that match the training dataset
exactly. The user literally cannot type a name the model doesn't
know, so the `Player not found` 404 path is dead code.

The sixth pattern is **read-only fan mode** through a single boolean.
Every page uses the same React components for everybody. Fans don't
see a custom "fan version" — they see the staff version with the
Add/Edit/Delete buttons collapsed by `useRole().canEdit`.

The seventh pattern is **uniform loading and empty states**. Every
list-fetching page sets `loading = true` before the call, renders a
small animated `LOADING DATA...` message during the fetch, and
shows an `EmptyState` if the response is empty. Errors push a Toast.
No page has a custom loader. This isn't just aesthetic — it means
the user always knows what's happening.

---

## Chapter 10 — What an examiner is likely to ask, and how to answer

Practising answers out loud is the best way to feel confident in
the viva. Here are the questions we expect, with short responses you
can adapt.

**Why Next.js 16 over plain React?** Because the App Router,
server-side middleware, and rewrites all live in one framework. The
middleware gives us route protection at the edge without shipping
auth logic to the browser. The rewrites give us the same-origin ML
proxy. Plain React would have needed a separate server for both.

**Why React 19 and the React Compiler?** The compiler memoises
components automatically, so we don't write `useMemo` or
`useCallback` anywhere. Our code stays readable and rendering stays
fast.

**Why Tailwind v4?** It ships a PostCSS plugin and doesn't need a JS
config. All our styling is utility classes inline in the JSX. We can
ship a new look in minutes by changing class names.

**Walk me through the login flow.** The form posts to the gateway's
`/auth/login`, which delegates to Keycloak via the OAuth 2.0
password grant. On success we get an access token, a refresh token,
and the role. We store the token in `localStorage`, decode it with
`jwt-decode` to read `sub` and `realm_access.roles`, write the role
to both `localStorage` and a cookie, and hard-navigate to
`/dashboard` so the middleware reads the new cookie.

**Why a cookie AND localStorage for the role?** Because the Next.js
middleware runs server-side at the edge and cannot read
`localStorage`. So we mirror the role into a cookie that the
middleware can read. The token stays in `localStorage` only,
because cookies would expose it to CSRF.

**What happens if a fan types `/dashboard/users` in the URL?** The
middleware reads the cookie, calls `canAccess`, gets false, and
redirects to `/dashboard`. Even if they bypassed the middleware, the
Sidebar filters that link out using the same helper. And even if
they hit the API directly with a Bearer token, the Spring gateway
rejects the call because the JWT doesn't have `ADMIN`. Three
independent layers, one shared rule file.

**How do you avoid CORS issues with the FastAPI services?** We use
Next.js rewrites in `next.config.mjs`. The browser calls
`/ml-proxy/match/predict`, which Next.js silently forwards to
`http://localhost:9000/predict`. From the browser's perspective it's
same-origin, so no CORS pre-flight is fired.

**Why no Redux or Zustand?** Our only client-side state is the JWT
and the user role. That's a three-line `useEffect`. A full state
library would be ceremony without benefit. Every page fetches its
own data.

**How does the formation board handle non-football matches?** The
pitch image is football-only. For basketball or handball we render
a neutral panel that says "Tactical pitch is football-only" so the
View Details button stays usable for every sport. The roster-numbers
panel on the right only renders for admins.

**Why bind the AI player rating autocomplete to a fixed list?**
Because the model was trained on a fixed CSV of twenty FC Barcelona
players. If the user could type a free-text name, half the time
they'd hit names the model doesn't know and get a 404. By bounding
the input we made `Player not found` impossible by construction.

**What's the rendering strategy?** Mixed. The login page is mostly
static. Every page under `/dashboard/*` is a Client Component
(`"use client"`) because it reads `localStorage` and calls APIs on
mount. The middleware runs on the edge (server side).

---

## Chapter 11 — The bugs we caught (and what they taught us)

Examiners love war stories. They tell the examiner that you actually
debugged the system, not just built a happy-path demo. Here are
seven real bugs we found and fixed.

The **basketball filter on Matches** wasn't matching anything. The
backend sends `BASKETBALL` (uppercase enum), the front-end button
sends `"Basketball"` (title case). The fix was to lowercase both
sides before comparing.

The **football filter on Players was leaking handball players**.
`LEFT_WING` is a valid position name in both sports. The fix was to
check the `HB_` prefix before falling back to the football list, so
handball wins the tie.

The **sport distribution pie was a single colour**. The `Team`
entity exposes `sport` as a nested object (`team.sport.sportType`),
not a flat field. Our Pie component counts by `item.sportType`, so
every team fell into one "Unknown" bucket. The fix was to flatten
the relation in a `useMemo` before passing the data to the chart.

The **Tactical Comparison radar was empty even though we had
team-analytics data in the database**. The reports-analytics seeder
had a whole-method skip-guard that checked
`matchAnalysisRepository.count() > 0`. An older deploy seeded match
analyses but not team analytics — and from then on, every restart
saw matches and skipped everything. The fix was per-table idempotent
guards.

The **Medical tabs were all empty**. The `MedicalDataSeeder.java`
referenced constants like `PLAYER_1_KC`, `PLAYER_4_ID` that were
never declared. The Java file failed to compile, the seeder never
ran, and the medical service had zero rows in every table. The fix
was declaring the missing constants.

The **Add button in Scouting did nothing useful**. The form schema
had fields like `name`, `age`, `league` that don't exist on the
entities. POSTs silently created malformed rows. The fix was
rewriting the schemas to match the entity shape and wrapping IDs as
nested objects.

The **Incoming/Outgoing Req tables looked empty** even with seeded
data. The cells read `t.outerPlayerId`, but the JPA response sends
`t.outerPlayer.id`. The fix was reading the nested objects (and
also wrapping POSTs in nested objects to match the JPA contract on
the way back).

The thread through all of these bugs is that the front-end and the
back-end have to agree on a contract — the field names, the
nesting, the casing — and when they drift, the UI silently shows
empty. Catching these requires reading the entity files alongside
the API response, which is what we did.

---

## Chapter 12 — Quick reference (look here when you forget a detail)

The full list of endpoints the front-end uses, all under
`http://localhost:8080/...` unless marked ML. User-management
exposes `/auth/login`, `/auth/admin/create-user`, `/users`,
`/staff`, `/scouts`, `/sport-managers`, `/national-teams`. Player-
management exposes `/teams`, `/sports`, `/players`, `/rosters`,
`/player-contracts`, `/transfers/in`, `/transfers/out`,
`/player-callups`, `/outer-players`, `/outer-teams`. Training-match
exposes `/matches`, `/match-formations`, `/match-lineups`,
`/match-events`, `/match-performance-reviews`, `/training-sessions`,
`/training-plans`, `/training-drills`, `/attendance`,
`/player-match-statistics`, `/player-training-assessments`. Medical
exposes `/injuries`, `/diagnoses`, `/treatments`,
`/rehabilitations`, `/recovery-programs`, `/fitness-tests`,
`/training-loads`. Reports-analytics exposes `/team-analytics`,
`/player-analytics`, `/match-analyses`, `/training-analytics`,
`/scout-reports`, `/sponsor-contract-offers`. Notification-mail
exposes `/notifications`, `/alerts`. The two ML services live behind
`/ml-proxy/match/predict` and `/ml-proxy/player/predict/{name}`.

The ten files to open in your IDE while revising are the dashboard
layout, the middleware, the permissions module, the API module, the
useRole hook, the Sidebar component, the Login component, the
shared components file, the next.config.mjs, and one feature
component of your choice for a concrete CRUD example. With those ten
tabs open side by side, you can answer almost any question without
hunting through the codebase.

---

You don't need to memorise every line. You need to understand the
**shapes**: how a request flows from a button click through the
front-end, through the gateway, into a service, into the database,
and back. If you can tell that story in your own words for any
single button on any single page, you'll be fine.

Good luck. 💪
