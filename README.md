# Flow Chart Application

A Vue 3 workflow editor that renders connected nodes with Vue Flow. Users can create, edit, delete, reposition, and inspect workflow nodes through routed details dialogs.

## Requirements

- Node.js 24 (see `.nvmrc`)
- npm 10 or later

## Setup

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The canvas is available at `/`.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm test` | Run the unit and component tests once. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run build` | Create the production bundle. |
| `npm run preview` | Preview the production bundle locally. |

CI runs `npm test` and `npm run build`. Vercel runs the production build during deployment.

## Architecture

```text
public/payload.json
        │
        ▼
flowService.js ── network boundary (GET / POST)
        │
        ▼
Vue Query cache ── server state and optimistic mutations
        │
        ├── flowQueries.js select ── server shape → UI shape
        │
        └── FlowCanvas and node components

Pinia (flowUi.js) ── client-only form, selection, dialog, and positions
Vue Router ────────── canvas and selected-node URLs
Vue Flow ──────────── canvas rendering, edges, dragging, and layout
```

### Data ownership

Vue Query is the single source of truth for workflow data. The initial query reads `public/payload.json` through `flowService.js`; mutations optimistically update the query cache and POST the complete workflow to the configured mutation endpoint. The server response is not used to replace the optimistic workflow because the placeholder endpoint does not return the application payload.

Pinia stores only client state in `src/stores/flowUi.js`:

- selected node ID
- create/details dialog state
- details form draft
- calculated node positions and layout direction

Positions are deliberately not sent as server data. They are calculated and retained on the client, then combined with Vue Query data in `FlowCanvas.vue`.

The query's `select` option transforms raw payload nodes into the smaller UI model. Before mutation, `flowQueries.js` transforms the UI draft back into the server payload shape. This keeps components independent from API-specific nesting.

## Project structure

```text
public/
  payload.json                 Initial workflow payload
src/
  api/queryClient.js           Shared TanStack Query client
  features/flow/
    api/flowService.js         Fetch and POST network boundary
    api/flowQueries.js         Query, optimistic mutations, and adapters
    api/attachmentService.js   Placeholder attachment upload service
    components/                Canvas, dialogs, nodes, and node forms
    utils/                     Position and auto-layout helpers
  router/index.js              Application routes
  stores/flowUi.js             Pinia client/UI state
  views/FlowView.vue           Route-level composition
  style.css                    Global reset and application-wide styles
```

Tests are colocated beside the source files they cover (`*.spec.js`).

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Workflow canvas |
| `/node/:nodeId` | Canvas with that node's details dialog open |

An unknown node ID is replaced with `/` so the invalid URL is not retained in browser history.

## Current progress

- [x] Vue 3 + Vite + JavaScript (ES6) boilerplate
- [x] Node 24 project and CI configuration
- [x] Vue Query, Pinia, Vue Router, Vue Flow, and testing setup
- [x] Query Client defaults
- [x] Flow routes and application shell
- [x] Vue Flow canvas, custom nodes, edges, and responsive auto-layout
- [x] Vue Query fetch, UI transformation, optimistic CRUD mutations, and autosave
- [x] Pinia client/UI store for dialogs, forms, selection, and positions
- [x] Create, edit, delete, and position workflows
- [x] Native details dialogs and feature-specific forms
- [x] Attachment upload placeholder and attachment removal
- [x] Native-first keyboard accessibility and form validation
- [x] Colocated unit and component tests

The application does not use TypeScript payload types. JavaScript adapters in `flowQueries.js` transform between the server payload and the UI model. The service layer is also in place: it fetches the static `public/payload.json` payload and sends mutations to the placeholder POST endpoint. A production API can replace that network boundary without changing the components.

## Accessibility and native-first UI

The implementation prefers native HTML behavior before custom JavaScript:

- Workflow nodes use native `<button type="button">` elements for keyboard focus and Enter/Space activation.
- Dialogs use native `<dialog>` and `showModal()`.
- Forms use `<form>`, `required`, and `novalidate` so custom error copy can be shown while validity still comes from the browser constraint API (`checkValidity()` and `:user-invalid`).
- Upload, delete, save, and retry actions are native buttons with accessible labels.
- Success/failure branch nodes remain non-clickable but are keyboard discoverable through Vue Flow's focusable wrapper.
- Focus indicators use `:focus-visible` and are preserved for keyboard users.

## Styling decisions

Component styles use Vue's `<style scoped>` by default. This prevents node, dialog, and form styles from leaking into unrelated components. Global styles are limited to the reset, typography, root sizing, and shared focus treatment in `src/style.css`.

Vue Flow's own styles are imported from its packages. Styles that must target Vue Flow-generated wrappers use scoped `:deep(...)` selectors, for example the branch focus outline and controls styling.

## Testing approach

Tests cover the behavior at the domain boundary and in the UI:

- service fetch and POST behavior
- query transformations and optimistic CRUD updates
- Pinia form and position state
- auto-layout and new-node placement
- routed node selection and invalid routes
- native form validation and dialogs
- attachment upload and removal
- accessible node and branch rendering

Run the full verification locally:

```bash
npm test
npm run build
```

## Query defaults

The shared Query Client uses the assignment's server-state settings:

```js
queries: {
  refetchOnWindowFocus: false,
  networkMode: "always",
  staleTime: Infinity,
  gcTime: 60 * 60 * 1000,
}
```
