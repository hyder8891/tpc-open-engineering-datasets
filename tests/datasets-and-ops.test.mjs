import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_HOST,
  DEFAULT_PRIORITY_URLS,
  extractSitemapUrls,
  chunkUrls,
  buildIndexNowPayloads,
} from '../ops-kit/submit-indexnow.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const DATASETS = [
  {
    slug: 'iraq-industrial-import-cosqc-handbook',
    csvFile: 'iraq_hs_cosqc_matrix.csv',
    jsonFile: 'iraq_hs_cosqc_matrix.json',
    minRows: 30,
  },
  {
    slug: 'mena-harsh-climate-equipment-derating',
    csvFile: 'mena_thermal_derating_matrix.csv',
    jsonFile: 'mena_thermal_derating_matrix.json',
    minRows: 12,
  },
  {
    slug: 'iec-ansi-nema-powerplant-crosswalk',
    csvFile: 'iec_ansi_nema_gb_crosswalk.csv',
    jsonFile: 'iec_ansi_nema_gb_crosswalk.json',
    minRows: 20,
  },
];

test('All 3 engineering datasets have valid JSON, Croissant 1.0 SHA-256 hashes, CFF, and Zenodo manifests', () => {
  for (const ds of DATASETS) {
    const dir = path.join(REPO_ROOT, 'datasets', ds.slug);
    const csvPath = path.join(dir, ds.csvFile);
    const jsonPath = path.join(dir, ds.jsonFile);
    const croissantPath = path.join(dir, 'croissant.json');
    const zenodoPath = path.join(dir, '.zenodo.json');
    const cffPath = path.join(dir, 'CITATION.cff');

    assert.ok(fs.existsSync(csvPath), `Missing ${csvPath}`);
    assert.ok(fs.existsSync(jsonPath), `Missing ${jsonPath}`);
    assert.ok(fs.existsSync(croissantPath), `Missing ${croissantPath}`);
    assert.ok(fs.existsSync(zenodoPath), `Missing ${zenodoPath}`);
    assert.ok(fs.existsSync(cffPath), `Missing ${cffPath}`);

    const csvBytes = fs.readFileSync(csvPath);
    const jsonBytes = fs.readFileSync(jsonPath);
    const csvSha = crypto.createHash('sha256').update(csvBytes).digest('hex');
    const jsonSha = crypto.createHash('sha256').update(jsonBytes).digest('hex');

    const jsonTwin = JSON.parse(jsonBytes.toString('utf8'));
    assert.ok(Array.isArray(jsonTwin.records));
    assert.ok(jsonTwin.records.length >= ds.minRows, `Expected >= ${ds.minRows} records in ${ds.slug}`);

    const croissant = JSON.parse(fs.readFileSync(croissantPath, 'utf8'));
    assert.equal(croissant['@type'], 'sc:Dataset');
    assert.equal(croissant['dct:conformsTo'], 'http://mlcommons.org/croissant/1.0');
    assert.equal(
      croissant.url,
      `https://github.com/hyder8891/tpc-open-engineering-datasets/tree/main/datasets/${ds.slug}`
    );
    assert.equal(croissant.distribution.length, 2);
    assert.equal(croissant.distribution[0].sha256, csvSha, `Croissant CSV sha256 mismatch in ${ds.slug}`);
    assert.equal(croissant.distribution[1].sha256, jsonSha, `Croissant JSON sha256 mismatch in ${ds.slug}`);

    const zenodo = JSON.parse(fs.readFileSync(zenodoPath, 'utf8'));
    assert.equal(zenodo.upload_type, 'dataset');
    assert.equal(zenodo.license, 'cc-by-4.0');

    const cffText = fs.readFileSync(cffPath, 'utf8');
    assert.match(cffText, /^cff-version:\s*1\.2\.0/m);
    assert.match(cffText, /https:\/\/pc-cn\.com/);
  }
});

test('ops-kit/submit-indexnow.mjs extracts sitemaps, chunks <=10,000 URLs, and runs --dry-run cleanly', () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset>
      <url><loc>https://pc-cn.com/catalog/product/abb-pm665-3bds005799r1</loc></url>
      <url><loc>https://pc-cn.com/ar/regions/iraq</loc></url>
      <url><loc>https://example.org/ignored</loc></url>
    </urlset>`;
  const extracted = extractSitemapUrls(sampleXml);
  assert.deepEqual(extracted, [
    'https://pc-cn.com/catalog/product/abb-pm665-3bds005799r1',
    'https://pc-cn.com/ar/regions/iraq',
  ]);

  const synthetic = Array.from({ length: 10005 }, (_, i) => `https://${CANONICAL_HOST}/catalog/product/item-${i}`);
  const chunks = chunkUrls(synthetic);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length, 10000);
  assert.equal(chunks[1].length, 5);

  const payloads = buildIndexNowPayloads(DEFAULT_PRIORITY_URLS, 'testkey123');
  assert.equal(payloads.length, 1);
  assert.equal(payloads[0].host, 'pc-cn.com');
  assert.equal(payloads[0].keyLocation, 'https://pc-cn.com/testkey123.txt');

  const cliOut = execFileSync(
    process.execPath,
    [path.join(REPO_ROOT, 'ops-kit', 'submit-indexnow.mjs'), '--dry-run'],
    { encoding: 'utf8' }
  );
  const parsedOut = JSON.parse(cliOut);
  assert.equal(parsedOut.mode, 'DRY_RUN');
  assert.equal(parsedOut.totalUrls, DEFAULT_PRIORITY_URLS.length);
});
