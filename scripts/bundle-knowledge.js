import fs from 'fs';
import path from 'path';

const KB_ROOT = path.resolve(process.cwd(), 'knowledge');
const OUTPUT_JSON = path.resolve(process.cwd(), 'src', 'lib', 'ai', 'knowledge-data.json');
const OUTPUT_TS = path.resolve(process.cwd(), 'src', 'lib', 'ai', 'knowledge-data.ts');

function parseFrontmatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return { meta: {}, body: raw };
  }
  const meta = {};
  let i = 1;
  while (i < lines.length && lines[i].trim() !== '---') {
    const line = lines[i];
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      } else if (value.startsWith('[')) {
        try { value = JSON.parse(value); } catch { /* ignore */ }
      } else if (value.startsWith('- ')) {
        value = value.split('\n').map((v) => v.replace(/^-\s*/, '').trim()).filter(Boolean);
      }
      meta[key] = value;
    }
    i++;
  }
  const body = lines.slice(i + 1).join('\n').trim();
  return { meta, body };
}

function walk(dir) {
  const docs = [];
  if (!fs.existsSync(dir)) return docs;

  function traverse(currentDir, relativeBase, type) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.join(relativeBase, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__' && !entry.name.startsWith('.')) {
          traverse(fullPath, relPath, type);
        }
      } else if (entry.name.endsWith('.md') && entry.name !== 'index.json') {
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const { meta, body } = parseFrontmatter(raw);
          const id = relPath.replace(/\.md$/i, '').replace(/\//g, '-');
          docs.push({
            id,
            type,
            title: meta.title || meta.Title || path.basename(entry.name, '.md'),
            path: relPath,
            content: ([meta.description, body].filter(Boolean).join('\n\n')).trim(),
            tags: [
              ...(meta.categories ? (Array.isArray(meta.categories) ? meta.categories : [meta.categories]) : []),
              ...(meta.tags ? (Array.isArray(meta.tags) ? meta.tags : [meta.tags]) : []),
            ],
            metadata: { ...meta, relativePath: relPath },
          });
        } catch {
          // skip
        }
      }
    }
  }

  traverse(dir, '', 'root');
  return docs;
}

const docs = walk(KB_ROOT);
const json = JSON.stringify(docs, null, 2);

fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
fs.writeFileSync(OUTPUT_JSON, json);
console.log(`Bundled ${docs.length} documents into JSON`);

const tsContent = `export interface KnowledgeDoc {
  id: string;
  type: string;
  title: string;
  path: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
}

export const knowledgeDocs: KnowledgeDoc[] = ${json};
`;

fs.writeFileSync(OUTPUT_TS, tsContent);
console.log(`Bundled ${docs.length} documents into TypeScript`);

const apiAiDir = path.resolve(process.cwd(), 'api', 'ai');
fs.mkdirSync(apiAiDir, { recursive: true });
console.log(`Knowledge data written to ${OUTPUT_TS} (api/ai/knowledge-data.ts imports from src/lib/ai/knowledge-data.json)`);
