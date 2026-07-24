/**
 * Manually process remaining route files that the auto-script couldn't handle.
 * Run: node scripts/manual-split.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES = join(__dirname, '..', 'src', 'routes');

const files = [
  { name: 'finance_family-payments',   comp: 'FamilyPaymentsPage' },
  { name: 'finance_student-payments',  comp: 'StudentPaymentsPage' },
  { name: 'privacy-policy',            comp: 'PrivacyPolicyPage' },
  { name: 'qirat_notifications',       comp: 'QiratNotificationsPage' },
  { name: 'register',                  comp: 'RegisterPage' },
  { name: 'student_.resources',        comp: 'StudentResources' },
  { name: 'support',                   comp: 'SupportPage' },
  { name: 'teacher_notifications',     comp: 'TeacherNotificationsPage' },
  { name: 'teacher_profile',           comp: 'TeacherProfilePage' },
  { name: 'teachers_.$id.profile',     comp: 'TeacherProfilePage' },
  { name: 'teachers_.$id.schedule.$day', comp: 'TeacherDailySchedulePage' },
  { name: 'terms-of-service',          comp: 'TermsOfServicePage' },
  { name: 'website.resources',         comp: 'WebsiteResources' },
  { name: 'zoom-guide',                comp: 'ZoomGuidePage' },
];

function extractImports(src) {
  const imports = [];
  const re = /import\s+([^;]+?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*/g;
  let m;
  while ((m = re.exec(src)) !== null) imports.push(m[0].trim());
  return imports;
}

function findRouteConfig(content) {
  // Find createFileRoute(...)({ ... })
  const m = content.match(/create(?:Root)?(?:File)?Route\(['"][^'"]+['"]\)\s*\(\s*\{/);
  if (!m) return null;
  
  const start = m.index;
  const afterFirstParen = content.indexOf(')', start);
  const secondParen = content.indexOf('(', afterFirstParen);
  const optsBrace = content.indexOf('{', secondParen);
  
  let depth = 0;
  let optsEnd = optsBrace;
  for (let i = optsBrace; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') { depth--; if (depth === 0) { optsEnd = i + 1; break; } }
  }
  
  return {
    start,
    optsBrace,
    optsEnd,
    secondParen,
    optsCode: content.slice(optsBrace, optsEnd),
    prefix: content.slice(content.lastIndexOf('export', start), secondParen).trim(),
  };
}

for (const { name, comp } of files) {
  const fp = join(ROUTES, name + '.tsx');
  const lazyPath = join(ROUTES, name + '.lazy.tsx');
  
  console.log(`Processing ${name}...`);
  const content = readFileSync(fp, 'utf-8');
  const allImports = extractImports(content);
  
  // Find route config
  const rc = findRouteConfig(content);
  if (!rc) { console.log(`  SKIP: no route config`); continue; }
  
  // Extract route path
  const pathM = content.match(/create(?:Root)?(?:File)?Route\(['"]([^'"]+)['"]\)/);
  const routePath = pathM[1];
  
  // Find component function/const - use simple brace counting (ignoring strings)
  let funcStart = -1, funcEnd = -1;
  const funcRe = new RegExp(`(?:export\\s+default\\s+)?function\\s+${comp}\\s*\\(`);
  let funcM = content.match(funcRe);
  
  if (funcM) {
    funcStart = funcM.index;
    let brace = content.indexOf('{', funcM.index);
    if (brace < 0) { console.log(`  SKIP: no brace`); continue; }
    let depth = 0;
    for (let i = brace; i < content.length; i++) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') { depth--; if (depth === 0) { funcEnd = i + 1; break; } }
    }
    if (funcEnd < 0) { console.log(`  SKIP: unclosed brace`); continue; }
  } else {
    // const Component = (...) => {
    const constRe = new RegExp(`const\\s+${comp}\\s*=\\s*(?:\\([^)]*\\)|\\w+)\\s*=>\\s*\{`);
    const constM = content.match(constRe);
    if (!constM) { console.log(`  SKIP: no ${comp}`); continue; }
    funcStart = constM.index;
    let brace = content.indexOf('{', constM.index + constM[0].indexOf('=>'));
    if (brace < 0) brace = content.indexOf('{', constM.index + constM[0].length);
    if (brace < 0) { console.log(`  SKIP: no brace (const)`); continue; }
    let depth = 0;
    for (let i = brace; i < content.length; i++) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') { depth--; if (depth === 0) { funcEnd = i + 1; break; } }
    }
    if (funcEnd < 0) { console.log(`  SKIP: unclosed const brace`); continue; }
  }
  
  const compCode = content.slice(funcStart, funcEnd);
  
  // === BUILD LAZY FILE ===
  let lazyImports = allImports.map(i => i);
  
  // Add createLazyFileRoute to react-router import
  const rrIdx = lazyImports.findIndex(i => i.includes('@tanstack/react-router'));
  if (rrIdx >= 0 && !lazyImports[rrIdx].includes('createLazyFileRoute')) {
    lazyImports[rrIdx] = lazyImports[rrIdx].replace(/^import\s+\{/, 'import { createLazyFileRoute,');
  }
  
  // Clean up react-router imports in lazy file
  lazyImports = lazyImports
    .map(imp => {
      if (imp.includes('@tanstack/react-router')) {
        return imp
          .replace(/,?\s*createRootRouteWithContext\s*,?/g, ',')
          .replace(/,?\s*createFileRoute\s*,?/g, ',')
          .replace(/,\s*,/g, ',').replace(/\{\s*,/g, '{').replace(/,\s*\}/g, '}').replace(/\{\s*\}/g, '');
      }
      return imp;
    })
    .filter(imp => {
      if (imp.includes('@tanstack/react-router')) {
        return imp.includes('createLazyFileRoute') || imp.includes('useNavigate') || imp.includes('Outlet') || imp.includes('redirect');
      }
      return true;
    });
  
  const lazyContent = `/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split).

${lazyImports.join('\n')}

export const Route = createLazyFileRoute('${routePath}')({
  component: ${comp},
});

${compCode}
`;
  
  writeFileSync(lazyPath, lazyContent);
  
  // === UPDATE ORIGINAL FILE ===
  const cleanOpts = rc.optsCode
    .replace(new RegExp(`,\\s*\\n\\s*component:\\s*${comp}`), '')
    .replace(new RegExp(`\\s*component:\\s*${comp},?`), '')
    .replace(/,\s*(\n\s*\})/g, '$1')
    .trim();
  
  const configNeeds = ['createFileRoute'];
  if (/requireAuth/.test(rc.optsCode)) configNeeds.push('requireAuth');
  if (/\bOutlet\b/.test(rc.optsCode)) configNeeds.push('Outlet');
  if (/\bredirect\b/.test(rc.optsCode)) configNeeds.push('redirect');
  if (/\bLink\b/.test(rc.optsCode)) configNeeds.push('Link');
  
  const keep = [];
  const routerSyms = configNeeds.filter(s => s !== 'requireAuth');
  if (routerSyms.length > 0) keep.push(`import { ${routerSyms.join(', ')} } from '@tanstack/react-router';`);
  if (configNeeds.includes('requireAuth')) keep.push(`import { requireAuth } from '@/lib/auth';`);
  
  writeFileSync(fp, keep.join('\n') + '\n\n' + rc.prefix + '(' + cleanOpts + ');\n');
  console.log(`  OK`);
}

console.log('\nDone! All remaining files processed.');
