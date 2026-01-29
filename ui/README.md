# SIGIL-PS Chat UI

React (Vite) chat interface for Sigil. It is used in two ways:

1. **Served by the core API** – The Flask app in sigil-ps-core serves the built app from `ui/dist` at `/` in production.
2. **Embedded in the VS Code extension** – The extension loads a built version of this UI in a webview (via bundled assets in the extension’s `media/` folder).

## Stack

- **React 19**, **TypeScript**, **Vite 6**
- **Tailwind CSS** for styling
- **Axios** for API calls; **TanStack React Query** for data/state
- Key modules: `ChatApp.tsx`, `useChat.ts` (hooks), `vscodeApi.ts` (when running inside the VS Code webview)

## Setup

From the `ui/` directory:

```bash
pnpm install
```

(or `npm install` if you use npm; the repo includes `pnpm-lock.yaml`.)

## Commands

| Command        | Description |
|----------------|-------------|
| `pnpm run dev` | Start the Vite dev server (e.g. http://localhost:5173). |
| `pnpm run build` | Type-check and build for production; output goes to `dist/`. |
| `pnpm run preview` | Serve the built `dist/` app (e.g. port 5173). |
| `pnpm run lint` | Run ESLint. |

## Environment

If you run the UI in dev and need to point at a specific API, use `ui/.env.template` as a reference. Copy it to `.env` and set:

- `VITE_API_BASE` – Base URL of the Sigil API (e.g. `http://localhost:80` or `http://localhost:5000`). Leave empty if the app gets the API URL from the extension (webview) or from the same origin.

Paths and behavior may depend on how the extension or API serves the app.

## Integration

- **Core API:** After `pnpm run build`, the contents of `dist/` are served by the Flask app as static files at `/`. The API is configured to serve `index.html` for client-side routing (see sigil-ps-core `api/__init__.py`).
- **VS Code extension:** The extension builds or copies this UI and exposes it in a webview. The webview uses `vscodeApi.ts` to talk to the extension host; the extension then calls the Sigil API. API base URL is determined by the extension (e.g. `apiConfig.ts` in sigil-ps-vscode).

## Testing

There are no automated UI tests (e.g. Vitest or Playwright) in this repo at the moment. Manual testing: run `pnpm run dev`, point the app at your local API if needed, and exercise the chat flow.
