const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');

function files(directory) {
  const full = path.join(root, directory);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    assert.ok(!entry.isSymbolicLink(), `Metadata symlink: ${entry.name}`);
    const name = `${directory}/${entry.name}`;
    return entry.isDirectory() ? files(name) : name.endsWith('.json') ? [name] : [];
  });
}

const providers = JSON.parse(read('providers/index.json'));
assert.ok(Array.isArray(providers) && providers.length > 0, 'Expected a non-empty provider index');
const ids = new Set();
const references = new Set(['providers/index.json']);
for (const { id, file } of providers) {
  assert.match(id, /^[a-z][a-z0-9_-]*$/);
  assert.match(file, /^[a-z0-9][a-z0-9-]*\.json$/);
  assert.ok(!ids.has(id) && !references.has(`providers/${file}`), `Duplicate provider ${id}/${file}`);
  ids.add(id);
  references.add(`providers/${file}`);
}
const display = files('providers').sort();
assert.deepEqual(display, [...references].sort(), 'Unindexed or missing provider files');
const names = ['provider.schema.json', ...display, ...files('models'), ...files('pricing')].sort();
const manifest = { version: 1, files: names.map((file) => {
  const content = read(file);
  const value = JSON.parse(content);
  assert.ok(value && typeof value === 'object', `Invalid JSON document: ${file}`);
  return { file, sha256: createHash('sha256').update(content).digest('hex') };
}) };
const output = JSON.stringify(manifest, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(read('index.json'), output, 'Stale catalog manifest');
else fs.writeFileSync(path.join(root, 'index.json'), output);
console.log(`Catalog manifest ${process.argv.includes('--check') ? 'verified' : 'generated'}.`);
