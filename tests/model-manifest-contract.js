// Model manifest contract tests
// Run: node tests/model-manifest-contract.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const REQUIRED_FILES = ['model.json', 'metadata.json', 'weights.bin', 'label-map.json'];

let passed = 0;
let failed = 0;

function assert(label, cond, detail = '') {
  if (cond) {
    console.log('  PASS', label);
    passed++;
  } else {
    console.log('  FAIL', label, detail ? `- ${detail}` : '');
    failed++;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadWeaponsConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'weapons-config.js'), 'utf8');
  return vm.runInNewContext(source + '\nWEAPONS_CONFIG;', {});
}

console.log('\n-- Model manifest contract tests ----------------------\n');

const manifestPath = path.join(ROOT, 'models', 'manifest.json');
const manifest = readJson(manifestPath);
const weaponsConfig = loadWeaponsConfig();
const weaponIds = new Set(weaponsConfig.weapons.map(w => w.id));

assert('manifest is a non-empty array', Array.isArray(manifest) && manifest.length > 0);
assert('first manifest entry is lab_final', manifest[0] && manifest[0].id === 'lab_final');

for (const entry of manifest) {
  console.log('\n' + entry.id + ' (' + entry.path + ')');

  assert(entry.id + ' has id/name/path', !!entry.id && !!entry.name && !!entry.path);

  const modelDir = path.resolve(ROOT, entry.path);
  assert(entry.id + ' directory exists', fs.existsSync(modelDir), modelDir);

  for (const fileName of REQUIRED_FILES) {
    assert(entry.id + ' has ' + fileName, fs.existsSync(path.join(modelDir, fileName)));
  }

  if (!fs.existsSync(modelDir)) continue;

  const metadataPath = path.join(modelDir, 'metadata.json');
  const labelMapPath = path.join(modelDir, 'label-map.json');
  if (!fs.existsSync(metadataPath) || !fs.existsSync(labelMapPath)) continue;

  const metadata = readJson(metadataPath);
  const labelMap = readJson(labelMapPath);
  const labels = new Set(metadata.labels || []);

  assert(entry.id + ' metadata has labels', Array.isArray(metadata.labels) && metadata.labels.length > 0);

  for (const className of Object.keys(labelMap)) {
    assert(entry.id + ' label-map class exists in metadata: ' + className, labels.has(className));

    const mapped = labelMap[className];
    const ids = mapped === null ? [] : (Array.isArray(mapped) ? mapped : [mapped]);
    for (const weaponId of ids) {
      assert(entry.id + ' maps ' + className + ' to known weapon ' + weaponId, weaponIds.has(weaponId));
    }
  }
}

console.log(`\n-- Results: ${passed} passed, ${failed} failed --\n`);
process.exit(failed > 0 ? 1 : 0);
