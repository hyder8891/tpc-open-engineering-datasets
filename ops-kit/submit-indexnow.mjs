#!/usr/bin/env node
/**
 * submit-indexnow.mjs
 * Zero-dependency IndexNow submission CLI for The Power Contractor (https://pc-cn.com).
 * Accelerates URL discovery across Bing, ChatGPT Search (OAI-SearchBot / Bing index),
 * and IndexNow-participating search engines.
 *
 * Security rule: Never hardcode keys in source code. Pass key at runtime via
 * environment variable INDEXNOW_KEY (or --dry-run for offline payload verification).
 */

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CANONICAL_HOST = 'pc-cn.com';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const MAX_URLS_PER_BATCH = 10000;

export const DEFAULT_PRIORITY_URLS = Object.freeze([
  'https://pc-cn.com/',
  'https://pc-cn.com/ar',
  'https://pc-cn.com/llms.txt',
  'https://pc-cn.com/llms-full.txt',
  'https://pc-cn.com/openapi.json',
  'https://pc-cn.com/.well-known/agent-card.json',
  'https://pc-cn.com/.well-known/mcp.json',
  'https://pc-cn.com/catalog',
  'https://pc-cn.com/ar/catalog',
  'https://pc-cn.com/regions/iraq',
  'https://pc-cn.com/ar/regions/iraq',
  'https://pc-cn.com/tools/cross-reference',
  'https://pc-cn.com/ar/tools/cross-reference',
  'https://pc-cn.com/tools/bom',
  'https://pc-cn.com/ar/tools/bom',
  'https://pc-cn.com/rfq',
  'https://pc-cn.com/ar/rfq',
  'https://pc-cn.com/contact',
  'https://pc-cn.com/ar/contact',
  'https://pc-cn.com/blog',
  'https://pc-cn.com/ar/blog',
]);

/**
 * Extract canonical https://pc-cn.com URLs from XML sitemap text.
 * @param {string} xmlText
 * @returns {string[]}
 */
export function extractSitemapUrls(xmlText) {
  const urls = new Set();
  const locRe = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;
  while ((match = locRe.exec(String(xmlText || ''))) !== null) {
    const candidate = match[1].trim();
    if (candidate.startsWith(`https://${CANONICAL_HOST}`)) {
      urls.add(candidate);
    }
  }
  return Array.from(urls);
}

/**
 * Split URL list into IndexNow-compliant chunks (<= 10,000 URLs per POST).
 * @param {string[]} urls
 * @param {number} [batchSize]
 * @returns {string[][]}
 */
export function chunkUrls(urls, batchSize = MAX_URLS_PER_BATCH) {
  const deduplicated = Array.from(
    new Set(
      urls
        .map((u) => String(u || '').trim())
        .filter((u) => u.startsWith(`https://${CANONICAL_HOST}`))
    )
  );
  const chunks = [];
  for (let i = 0; i < deduplicated.length; i += batchSize) {
    chunks.push(deduplicated.slice(i, i + batchSize));
  }
  return chunks;
}

/**
 * Build IndexNow JSON request payloads.
 * @param {string[]} urls
 * @param {string} key
 */
export function buildIndexNowPayloads(urls, key) {
  const cleanKey = String(key || '<INDEXNOW_VERIFICATION_KEY>').trim();
  const batches = chunkUrls(urls);
  return batches.map((urlList) => ({
    host: CANONICAL_HOST,
    key: cleanKey,
    keyLocation: `https://${CANONICAL_HOST}/${cleanKey}.txt`,
    urlList,
  }));
}

function parseCliArgs(argv) {
  const opts = {
    dryRun: false,
    sitemapUrl: null,
    urlsFile: null,
    inlineUrls: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--sitemap' && argv[i + 1]) {
      opts.sitemapUrl = argv[i + 1];
      i += 1;
    } else if (arg === '--urls-file' && argv[i + 1]) {
      opts.urlsFile = argv[i + 1];
      i += 1;
    } else if (arg === '--urls' && argv[i + 1]) {
      opts.inlineUrls.push(...argv[i + 1].split(','));
      i += 1;
    }
  }
  return opts;
}

async function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  const envKey = process.env.INDEXNOW_KEY || '';
  const isDryRun = opts.dryRun || !envKey;

  let targetUrls = [];
  if (opts.inlineUrls.length > 0) {
    targetUrls.push(...opts.inlineUrls);
  }
  if (opts.urlsFile) {
    const content = fs.readFileSync(opts.urlsFile, 'utf8');
    targetUrls.push(...content.split(/\r?\n/));
  }
  if (opts.sitemapUrl) {
    const res = await fetch(opts.sitemapUrl, {
      headers: { 'User-Agent': 'TPC-IndexNow-Pusher/1.0 (+https://pc-cn.com)' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch sitemap ${opts.sitemapUrl}: HTTP ${res.status}`);
    }
    const xml = await res.text();
    targetUrls.push(...extractSitemapUrls(xml));
  }
  if (targetUrls.length === 0) {
    targetUrls = [...DEFAULT_PRIORITY_URLS];
  }

  const payloads = buildIndexNowPayloads(
    targetUrls,
    isDryRun ? 'DRY_RUN_PLACEHOLDER_KEY' : envKey
  );

  if (isDryRun) {
    console.log(
      JSON.stringify(
        {
          mode: 'DRY_RUN',
          endpoint: INDEXNOW_ENDPOINT,
          batches: payloads.length,
          totalUrls: payloads.reduce((acc, p) => acc + p.urlList.length, 0),
          samplePayload: {
            ...payloads[0],
            urlList: payloads[0]?.urlList.slice(0, 5) || [],
          },
        },
        null,
        2
      )
    );
    return;
  }

  for (let idx = 0; idx < payloads.length; idx += 1) {
    const body = payloads[idx];
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    if (![200, 202].includes(response.status)) {
      throw new Error(`IndexNow batch ${idx + 1}/${payloads.length} failed with HTTP ${response.status}`);
    }
    console.log(
      `IndexNow batch ${idx + 1}/${payloads.length} accepted (HTTP ${response.status}, ${body.urlList.length} URLs)`
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('[submit-indexnow] Error:', err.message);
    process.exitCode = 1;
  });
}
