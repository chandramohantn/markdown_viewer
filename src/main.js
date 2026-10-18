import { marked } from 'marked';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github.css';
import './style.css';

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
marked.setOptions({ gfm: true, breaks: false });

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="toolbar">
    <div class="brand">
      <h1>Markdown Studio</h1>
      <p>Offline editor with live preview</p>
    </div>
    <div class="toolbar-actions">
      <button id="open-file" type="button">Open .md</button>
      <button id="save-file" type="button" class="primary">Save</button>
      <button id="save-as-file" type="button">Save as…</button>
      <input id="file-input" type="file" accept=".md,.markdown,.txt,text/markdown" hidden>
    </div>
  </header>
  <div class="statusbar">
    <span id="document-name">Untitled.md</span>
    <span id="status" role="status">Edit the Markdown on the right to see a live preview.</span>
    <span id="dirty-state" class="dirty-state">Unsaved</span>
  </div>
  <main class="workspace">
    <section class="pane preview-pane" aria-label="Rendered Markdown preview">
      <div class="pane-heading"><h2>Preview</h2><span>Rendered output</span></div>
      <article id="preview" class="markdown-body"></article>
    </section>
    <section class="pane editor-pane" aria-label="Markdown editor">
      <div class="pane-heading"><h2>Editor</h2><span>Markdown source</span></div>
      <textarea id="editor" spellcheck="false" aria-label="Markdown source editor"></textarea>
    </section>
  </main>
`;

const editor = document.querySelector('#editor');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const fileInput = document.querySelector('#file-input');
const documentName = document.querySelector('#document-name');
const dirtyState = document.querySelector('#dirty-state');
const openButton = document.querySelector('#open-file');
const saveButton = document.querySelector('#save-file');
const saveAsButton = document.querySelector('#save-as-file');

let currentFileHandle = null;
let currentFileName = 'Untitled.md';
let isDirty = false;
let renderTimer = null;
let renderRevision = 0;

const starterMarkdown = `# Markdown Studio

Edit this Markdown on the **right**. The rendered preview updates automatically on the **left**.

## Tables

| Component | Purpose |
| --- | --- |
| Marked | Markdown and tables |
| Mermaid | Diagrams |
| MathJax | LaTeX equations |
| highlight.js | Code highlighting |

## Mermaid diagram

\`\`\`mermaid
flowchart LR
  A[Markdown source] --> B[Renderer]
  B --> C[Live preview]
\`\`\`

## Mathematics

Inline math: $E = mc^2$

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$

## Python

\`\`\`python
def predict(features):
    return model.predict(features)
\`\`\`
`;

marked.use({
  renderer: {
    code({ text, lang }) {
      const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      if ((lang || '').trim().toLowerCase() === 'mermaid') {
        return `<pre class="mermaid">${escaped}</pre>\n`;
      }
      const language = /^[\w+-]+$/.test(lang || '') ? ` class="language-${lang}"` : '';
      return `<pre><code${language}>${escaped}</code></pre>\n`;
    }
  }
});

function setDirty(dirty) {
  isDirty = dirty;
  dirtyState.textContent = dirty ? 'Unsaved changes' : 'Saved';
  dirtyState.classList.toggle('is-dirty', dirty);
  saveButton.disabled = !dirty;
}

function setDocumentName(name) {
  currentFileName = name || 'Untitled.md';
  documentName.textContent = currentFileName;
  documentName.title = currentFileName;
}

async function renderMarkdown() {
  const revision = ++renderRevision;
  status.textContent = 'Rendering preview…';
  try {
    const html = await marked.parse(editor.value);
    if (revision !== renderRevision) return;
    if (window.MathJax?.typesetClear) window.MathJax.typesetClear([preview]);
    preview.innerHTML = DOMPurify.sanitize(html);
    preview.querySelectorAll('pre:not(.mermaid) code').forEach((block) => hljs.highlightElement(block));
    await mermaid.run({ nodes: preview.querySelectorAll('pre.mermaid') });
    if (revision !== renderRevision) return;
    if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
    if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise([preview]);
    if (revision === renderRevision) status.textContent = 'Preview updated';
  } catch (error) {
    console.error(error);
    status.textContent = `Preview error: ${error.message}`;
  }
}

function scheduleRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(() => { void renderMarkdown(); }, 180);
  setDirty(true);
}

async function openWithFileSystemAccess() {
  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    types: [{ description: 'Markdown files', accept: { 'text/markdown': ['.md', '.markdown'], 'text/plain': ['.txt'] } }]
  });
  const file = await handle.getFile();
  editor.value = await file.text();
  currentFileHandle = handle;
  setDocumentName(file.name);
  setDirty(false);
  await renderMarkdown();
  status.textContent = `Opened ${file.name}`;
}

openButton.addEventListener('click', async () => {
  if (isDirty && !window.confirm('You have unsaved changes. Continue opening another file?')) return;
  if (window.showOpenFilePicker) {
    try {
      await openWithFileSystemAccess();
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.warn('File System Access API unavailable; using file input.', error);
    }
  }
  fileInput.click();
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  editor.value = await file.text();
  currentFileHandle = null;
  setDocumentName(file.name);
  setDirty(false);
  await renderMarkdown();
  status.textContent = `Opened ${file.name}. Save will download the edited file.`;
  fileInput.value = '';
});

async function downloadMarkdown(name = currentFileName) {
  const blob = new Blob([editor.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name.toLowerCase().endsWith('.md') ? name : `${name}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  const downloadedName = link.download;
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setDirty(false);
  status.textContent = `Downloaded ${downloadedName}`;
}

saveButton.addEventListener('click', async () => {
  if (!currentFileHandle) {
    await downloadMarkdown(currentFileName);
    return;
  }
  try {
    let permission = await currentFileHandle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') permission = await currentFileHandle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      status.textContent = 'Write permission not granted; downloading the edited file instead.';
      await downloadMarkdown(currentFileName);
      return;
    }
    const writable = await currentFileHandle.createWritable();
    await writable.write(editor.value);
    await writable.close();
    setDirty(false);
    status.textContent = `Saved ${currentFileName}`;
  } catch (error) {
    console.error(error);
    status.textContent = `Could not save in place; downloading instead (${error.message}).`;
    await downloadMarkdown(currentFileName);
  }
});

saveAsButton.addEventListener('click', async () => {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: currentFileName || 'Untitled.md',
        types: [{ description: 'Markdown files', accept: { 'text/markdown': ['.md', '.markdown'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(editor.value);
      await writable.close();
      currentFileHandle = handle;
      setDocumentName(handle.name);
      setDirty(false);
      status.textContent = `Saved as ${handle.name}`;
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.warn('Save picker unavailable; using download.', error);
    }
  }
  await downloadMarkdown(currentFileName);
});

editor.addEventListener('input', scheduleRender);
window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    if (!saveButton.disabled) saveButton.click();
  }
});

editor.value = starterMarkdown;
setDirty(false);
void renderMarkdown();
