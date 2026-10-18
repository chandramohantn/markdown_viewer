# Offline Markdown Studio

A local-first Markdown editor with a side-by-side live preview. It supports GitHub-flavored Markdown tables, Mermaid diagrams, LaTeX math (MathJax), and syntax-highlighted code. JavaScript dependencies are project-scoped and bundled into the frontend; no CDN is used at runtime.

## Features

- Side-by-side rendered preview (left) and Markdown source editor (right).
- Live preview updates while typing.
- Open `.md`, `.markdown`, and `.txt` files.
- Save changes to the original file in Microsoft Edge when the File System Access API is available and permission is granted.
- Save As through the browser file picker where supported.
- Fallback to downloading the edited Markdown when direct file access is unavailable.
- `Ctrl+S` / `Cmd+S` saves the current document.
- Responsive layout: stacked panes on narrow screens.

## Requirements

- Local development: Node.js 22+ and npm.
- Container deployment: Docker Engine or a compatible Docker runtime.
- Edge/Chromium is recommended for direct open/save access to local files. Other browsers can use the file-input and download fallback.

## Local setup

From this directory, run in PowerShell:

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite (typically `http://127.0.0.1:5173`). Use **Open .md** to select a file, edit its source on the right, and review the rendered result on the left.

For a production build:

```powershell
npm run build
npm run preview
```

Dependencies are installed in this project's `node_modules`, not globally. Commit `package-lock.json` after the first install and use `npm ci` for repeatable installs. Keep `node_modules` out of source control.

## Docker Compose

```powershell
docker compose up -d --build
```

Open `http://127.0.0.1:8080`. Stop the service with:

```powershell
docker compose down
```

The container serves static frontend assets using Nginx. The browser reads selected Markdown files locally; their contents are not uploaded to the container. Direct in-place saving is handled by the browser's File System Access API, not by the container.

## Offline build and runtime

The application has no CDN references, so runtime rendering works offline after dependencies have been installed and the frontend has been built. The initial `npm install` and Docker image build generally need access to npm and container registries unless dependencies and base images are already cached or mirrored.

## Dependencies

JavaScript packages are declared in `package.json` and locked in `package-lock.json`. `requirements.txt` is not appropriate for these browser-side dependencies. Use pinned versions and `npm ci` for reproducible installs.

## Security notes

- DOMPurify sanitizes generated HTML before insertion into the preview.
- The viewer does not send Markdown contents to a backend.
- Open trusted Markdown documents and review external links before following them.
- Keep dependencies patched and review package licenses/security advisories for organizational use.
