/**
 * Creates `.lazy.tsx` files for code-splitting route components.
 *
 * Run: node scripts/split-lazy-routes.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES_DIR = join(__dirname, '..', 'src', 'routes');

const SKIP_FILES = new Set(['__root.tsx', 'index.tsx']);

function findMatchingBrace(content, start) {
  let depth = 0, inString = false, stringChar = null, inTemplate = false;
  let inLine = false, inBlock = false;
  for (let i = start; i < content.length; i++) {
    const ch = content[i], next = content[i + 1] || '', prev = content[i - 1] || '';
    // Comments
    if (inLine) { if (ch === '\n') inLine = false; continue; }
    if (inBlock) { if (ch === '*' && next === '/') { inBlock = false; i++; } continue; }
    if (prev !== '/' && ch === '/' && next === '/') { inLine = true; continue; }
    if (prev !== '/' && ch === '/' && next === '*') { inBlock = true; continue; }
    // Strings
    if (!inString && !inTemplate && (ch === '"' || ch === "'")) { inString = true; stringChar = ch; continue; }
    if (inString) { if (ch === stringChar && prev !== '\\') { inString = false; stringChar = null; } continue; }
    // Template literals
    if (ch === '`') { inTemplate = !inTemplate; continue; }
    if (inTemplate) {
      if (ch === '$' && next === '{') { depth++; i++; continue; }
      if (depth > 0 && ch === '}') depth--;
      if (ch === '`' && depth === 0) { inTemplate = false; continue; }
      continue;
    }
    // Braces
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

function extractImports(src) {
  const imports = [];
  const re = /import\s+([^;]+?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*/g;
  let m;
  while ((m = re.exec(src)) !== null) imports.push({ raw: m[0].trim(), spec: m[1].trim(), src: m[2].trim() });
  return imports;
}

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const basename = filePath.replace(/\.tsx$/, '');
  const lazyPath = `${basename}.lazy.tsx`;

  if (existsSync(lazyPath)) return 'skip';

  const pathM = content.match(/create(?:Root)?(?:File)?Route\(['"]([^'"]+)['"]\)/);
  if (!pathM) return 'skip (no path)';
  const routePath = pathM[1];

  const compM = content.match(/component:\s*(\w+)/);
  if (!compM) return 'skip (no component)';
  const compName = compM[1];

  // Support both function ComponentName() and const ComponentName = ...
  let funcStart = -1, funcEnd = -1, componentCode = '';

  // Try function declaration first
  const funcRe = new RegExp(`\\bfunction\\s+${compName}\\s*\\(`);
  const funcM = content.match(funcRe);
  
  if (funcM) {
    funcStart = funcM.index;
    const brace = content.indexOf('{', funcM.index);
    if (brace < 0) return 'skip (no brace)';
    funcEnd = findMatchingBrace(content, brace);
    if (funcEnd < 0) return 'skip (unmatched func)';
    componentCode = content.slice(funcStart, funcEnd);
  } else {
    // Try const ComponentName = (...) => { or const ComponentName = function(...) {
    const constRe = new RegExp(`const\\s+${compName}\\s*=\\s*(?:\\([^)]*\\)|[\\w]+)\\s*=>\\s*\\{`);
    const constM = content.match(constRe);
    if (!constM) return `skip (no ${compName})`;
    funcStart = constM.index;
    const brace = content.indexOf('{', constM.index + constM[0].lastIndexOf('{'));
    // Alternatively, find the first { after the arrow
    const brace2 = content.indexOf('{', constM.index);
    if (brace2 < 0) return 'skip (no brace)';
    funcEnd = findMatchingBrace(content, brace2);
    if (funcEnd < 0) return 'skip (unmatched const)';
    componentCode = content.slice(funcStart, funcEnd);
  }

  // Find route config options { }
  const routeIdx = content.search(/create(?:Root)?(?:File)?Route\(['"][^'"]+['"]\)\s*\(\s*\{/);
  if (routeIdx < 0) return 'skip (route)';
  
  const afterPath = content.indexOf(')', routeIdx);
  const optionsParen = content.indexOf('(', afterPath);
  const optionsBrace = content.indexOf('{', optionsParen);
  if (optionsBrace < 0) return 'skip';
  
  const optionsEnd = findMatchingBrace(content, optionsBrace);
  if (optionsEnd < 0) return 'skip';
  
  let routeLineEnd = optionsEnd;
  while (routeLineEnd < content.length && /\s/.test(content[routeLineEnd])) routeLineEnd++;
  if (content[routeLineEnd] === ')') routeLineEnd++;
  const after = content.slice(routeLineEnd).trimStart();
  if (after.startsWith(';')) routeLineEnd = content.indexOf(';', routeLineEnd) + 1;

  const optionsCode = content.slice(optionsBrace, optionsEnd);
  const allImports = extractImports(content);

  // === Build lazy file ===
  const lazyImports = allImports.map(i => i.raw);
  const rrIdx = lazyImports.findIndex(i => /@tanstack\/react-router/.test(i));
  if (rrIdx >= 0 && !lazyImports[rrIdx].includes('createLazyFileRoute')) {
    lazyImports[rrIdx] = lazyImports[rrIdx].replace(/^import\s+\{/, 'import { createLazyFileRoute,');
  } else if (rrIdx < 0) {
    lazyImports.unshift("import { createLazyFileRoute } from '@tanstack/react-router';");
  }

  const cleanLazy = lazyImports.filter((imp, i, arr) => imp && imp.startsWith('import') && arr.indexOf(imp) === i);
  const lazyFileContent = cleanLazy.map(imp => {
    if (imp.includes('@tanstack/react-router')) {
      return imp
        .replace(/,?\s*createRootRouteWithContext\s*,?/g, ',')
        .replace(/,?\s*createFileRoute\s*,?/g, ',')
        .replace(/,\s*,/g, ',').replace(/\{\s*,/g, '{').replace(/,\s*\}/g, '}')
        .replace(/\{\s*\}/g, '');
    }
    return imp;
  }).filter(imp => {
    if (imp.includes('@tanstack/react-router')) {
      return imp.includes('createLazyFileRoute') || imp.includes('useNavigate') || 
             imp.includes('Outlet') || imp.includes('redirect') || imp.includes('Link');
    }
    return true;
  }).join('\n');

  writeFileSync(lazyPath, `/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

${lazyFileContent}

export const Route = createLazyFileRoute('${routePath}')({
  component: ${compName},
});

${componentCode}
`);

  // === Build minimal original file ===
  const minimalConfig = optionsCode
    .replace(new RegExp(`,\\s*\\n\\s*component:\\s*${compName}`), '')
    .replace(new RegExp(`\\s*component:\\s*${compName},?\\s*`), '')
    .replace(/,\s*(\n\s*\})/g, '$1')
    .replace(/,\s*\)/g, ')')
    .trim();

  const configNeeds = new Set(['createFileRoute']);
  if (/requireAuth/.test(optionsCode)) configNeeds.add('requireAuth');
  if (/\bOutlet\b/.test(optionsCode)) configNeeds.add('Outlet');
  if (/\bredirect\b/.test(optionsCode)) configNeeds.add('redirect');
  if (/\bLink\b/.test(optionsCode)) configNeeds.add('Link');
  if (/\buseRouter\b/.test(optionsCode)) configNeeds.add('useRouter');
  if (/\bnotFound\b/.test(optionsCode)) configNeeds.add('notFound');
  if (/\bcreateRootRouteWithContext\b/.test(optionsCode)) configNeeds.add('createRootRouteWithContext');
  if (/\bHeadContent\b/.test(optionsCode)) configNeeds.add('HeadContent');
  if (/\bScripts\b/.test(optionsCode)) configNeeds.add('Scripts');
  if (/useApp/.test(optionsCode)) configNeeds.add('useApp');

  const configImports = [];
  const routerSyms = [...configNeeds].filter(s => s !== 'requireAuth' && s !== 'useApp');
  if (routerSyms.length > 0) configImports.push(`import { ${routerSyms.join(', ')} } from '@tanstack/react-router';`);
  if (configNeeds.has('requireAuth')) configImports.push(`import { requireAuth } from '@/lib/auth';`);
  if (configNeeds.has('useApp')) configImports.push(`import { useApp } from '@/context/AppContext';`);

  const prefixIdx = content.indexOf('export');
  const prefix = content.slice(prefixIdx, optionsParen + 1).trim();

  writeFileSync(filePath, [...configImports, '', prefix + minimalConfig + ');\n'].join('\n'));
  return 'ok';
}

const files = readdirSync(ROUTES_DIR)
  .filter(f => f.endsWith('.tsx') && !f.includes('.lazy.') && !SKIP_FILES.has(f))
  .sort();

let ok = 0, skip = 0, err = 0;
for (const f of files) {
  process.stdout.write(`  ${f.padEnd(45)} `);
  try {
    const r = processFile(join(ROUTES_DIR, f));
    console.log(r);
    if (r === 'ok') ok++; else skip++;
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    err++;
  }
}
console.log(`\nDone: ${ok} OK, ${skip} skipped, ${err} errors.`);
