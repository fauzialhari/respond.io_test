# Flow Chart Application

A Vue 3 flow-chart application for viewing and editing a workflow made up of connected, typed nodes.

The project is being built as a focused take-home assignment. It will render a supplied JSON payload in Vue Flow, let users manage nodes through a routed details drawer, and keep data changes behind a clear API boundary.

## Tech stack

- Vue 3 with TypeScript and Vite
- [Vue Flow](https://vueflow.dev/) for the canvas, nodes, edges, and interactions
- [TanStack Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview) for payload fetching, caching, and mutations
- [Pinia](https://pinia.vuejs.org/) for client-only UI state
- [Vue Router](https://router.vuejs.org/) for shareable node-detail URLs
- Vitest and Vue Test Utils for automated testing

## Getting started

Prerequisites: Node.js 20.10 or later and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The initial route redirects to `/flow`.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Run TypeScript checks and create a production build. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run the test suite once. |
| `npm run test:watch` | Run tests in watch mode. |

## Architecture

The application separates server-like data from client UI state so that there is one source of truth for each kind of information.

```text
JSON payload / API
        │
        ▼
 API service layer
        │
        ▼
 TanStack Vue Query ──────────► Vue Flow canvas and node components
        │
        └── mutations update the query cache

 Pinia ───────────────────────► selected node, drawer/modal state, viewport
 Vue Router ──────────────────► /flow and /flow/node/:nodeId
```

### Responsibility boundaries

| Tool | Owns |
| --- | --- |
| Vue Query | Flow payload, loading/error state, cached query data, and mutation lifecycle. |
| Pinia | Client-only state such as selected node ID, open drawers/modals, and canvas viewport. |
| Vue Router | The current screen and selected node URL. |
| Vue Flow | Rendering and interacting with workflow nodes and edges. |

The complete payload is deliberately not copied from Vue Query into Pinia. This avoids two independently mutable copies of the same data.

## Payload and mutation strategy

If the assignment supplies a real API, the service layer in `src/api/` will call it directly.

If it supplies only a static `payload.json`, a browser cannot safely write back to that file. In that case, the app will use a small local mock service, initially seeded from the payload and persisted in localStorage. Components will still call Vue Query mutations, so replacing the mock service with a real API later requires no UI rewrite.

```text
payload.json → local mock service → Vue Query query/mutations → UI
```

## Project structure

```text
src/
  api/          Query client and payload service functions
  components/   Reusable UI and custom Vue Flow node components
  composables/  Query and mutation composables
  mocks/        Local payload/mock API support
  router/       Application routes
  stores/       Pinia stores for UI state
  types/        Shared TypeScript domain types
  utils/        Payload adapters and pure helpers
  views/        Route-level views
tests/
  unit/         Unit and component tests
```

## Routes

| Route | Purpose |
| --- | --- |
| `/flow` | Display the workflow canvas. |
| `/flow/node/:nodeId` | Display the canvas with the selected node’s detail drawer open. |

## Current progress

- [x] Vue 3 + Vite + TypeScript boilerplate
- [x] Vue Query, Pinia, Vue Router, Vue Flow, and testing setup
- [x] Query Client defaults
- [x] Initial flow routes and application shell
- [x] Starter component test
- [ ] Payload types and adapters
- [ ] Mock API/service layer
- [ ] Pinia UI store
- [ ] Vue Flow canvas and custom node components
- [ ] Create, edit, delete, and position mutations
- [ ] Node-detail drawer and feature-specific forms

## Testing approach

Features are developed test-first where practical:

1. Write a unit or component test for the expected behaviour.
2. Implement the smallest change that satisfies it.
3. Cover validation, loading, and mutation failure paths.
4. Refactor with the suite green.

Tests will prioritize payload transformations, mock API CRUD operations, query-cache updates, UI stores, route-driven selection, form validation, and critical node editing flows.

## Query defaults

The shared Query Client is configured for the assignment’s requested behaviour:

```ts
queries: {
  refetchOnWindowFocus: false,
  networkMode: 'always',
  staleTime: Infinity,
  gcTime: 60 * 60 * 1000,
}
```
