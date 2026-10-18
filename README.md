# Offline Markdown Viewer

A small frontend that renders Markdown, GitHub-flavored tables, Mermaid diagrams, LaTeX math (MathJax), and syntax-highlighted code. The JavaScript dependencies are project-local; nothing is installed globally. The same `package.json` dependency manifest is used for local development and the Docker build.

## Requirements

- Local development: Node.js 22+ and npm. These are only needed to install dependencies and run/build the app; dependencies live in this project’s `node_modules`.
- Docker runtime: Docker Engine or another compatible Docker runtime. Build requires package/base-image downloads unless they are already cached or mirrored.
- No runtime internet access is needed once dependencies are installed and the app is running/built.

## Local setup

In PowerShell, from this directory:

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite (typically `http://127.0.0.1:5173`). Select `sample.md` or another Markdown file. To make a production build:

```powershell
npm run build
npm run preview
```

`npm install` downloads dependencies into this project’s `node_modules`, not globally. Commit `package-lock.json` after the first install, then use `npm ci` for repeatable installs. Keep `node_modules` out of source control.

## Docker setup

From this directory:

```powershell
docker build -t offline-markdown-viewer:1.0 .
docker run --rm -p 127.0.0.1:8080:8080 offline-markdown-viewer:1.0
```

Open `http://127.0.0.1:8080` in Edge. Select a Markdown file. The file picker reads the chosen file in the browser; it is not uploaded to the container.

## Offline build/runtime

The first `npm install` and `docker build` normally require access to package registries and container registries. For a truly offline build, prepare `node_modules`/npm cache and the base images on a connected machine, or use an internal npm registry and image mirror. The built app itself has no CDN references and runs offline.

## Dependency management

The libraries are JavaScript packages, so `package.json` and `package-lock.json` are the right manifests. `requirements.txt` is for Python packages and does not manage these browser-side libraries. Pin versions and use `npm ci` in CI/reproducible builds. Do not install these packages globally.

## Security notes

- DOMPurify sanitizes generated HTML before it is inserted into the page.
- Only open trusted Markdown files. Markdown can contain links and embedded HTML-like content.
- Keep dependencies patched and review package licenses/security advisories before organizational use.
