import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/mathjax/es5');
const destination = resolve(root, 'public/vendor/mathjax/es5');
await mkdir(resolve(root, 'public/vendor/mathjax'), { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log('Copied MathJax runtime assets into public/vendor/mathjax/es5');
