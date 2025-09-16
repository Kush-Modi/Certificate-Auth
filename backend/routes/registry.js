const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const registryPath = path.join(__dirname, '..', 'storage', 'registry.json');

// Ensure registry exists (for demo)
function ensureRegistry() {
  const dir = path.dirname(registryPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(registryPath)) {
    const demo = [
      { name: 'University A', publicKey: '', address: '0x0000000000000000000000000000000000000001' },
      { name: 'Org B', publicKey: '', address: '0x0000000000000000000000000000000000000002' }
    ];
    fs.writeFileSync(registryPath, JSON.stringify(demo, null, 2));
  }
}

function readRegistry() {
  ensureRegistry();
  const raw = fs.readFileSync(registryPath, 'utf8');
  return JSON.parse(raw);
}

router.get('/', (req, res) => {
  try {
    const list = readRegistry();
    res.json({ success: true, authorities: list });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:name', (req, res) => {
  try {
    const list = readRegistry();
    const item = list.find(a => a.name === req.params.name);
    if (!item) return res.status(404).json({ success: false, error: 'Authority not found' });
    res.json({ success: true, authority: item });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
