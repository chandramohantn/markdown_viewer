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
    <div>
      <h1>Offline Markdown Viewer</h1>
      <p>Markdown, tables, Mermaid, math, and highlighted code</p>
    </div>
    <label class="file-picker">Open Markdown <input id="file" type="file" accept=".md,.markdown,.txt,text/markdown"></label>
  </header>
  <div id="status" role="status">Choose a local Markdown file.</div>
  <main id="content"><h2>Ready</h2><p>Select a Markdown file to render it locally.</p></main>
`;

const fileInput = document.querySelector('#file');
const content = document.querySelector('#content');
const status = document.querySelector('#status');

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

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  status.textContent = `Rendering ${file.name}…`;
  try {
    const markdown = await file.text();
    content.innerHTML = DOMPurify.sanitize(await marked.parse(markdown));
    content.querySelectorAll('pre:not(.mermaid) code').forEach((block) => hljs.highlightElement(block));
    await mermaid.run({ nodes: content.querySelectorAll('pre.mermaid') });
    if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise([content]);
    status.textContent = `Rendered: ${file.name}`;
  } catch (error) {
    console.error(error);
    status.textContent = `Rendering failed: ${error.message}`;
  }
});
