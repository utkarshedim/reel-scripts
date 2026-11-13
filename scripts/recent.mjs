/**
 * What has already been made, across every branch. Each run may push to its own branch, so the
 * topics.txt in this checkout can miss stories another run already covered. This fetches every
 * branch on origin, merges their topics.txt lines, and lists the final scripts from the last N
 * days (default 2) with their first line.
 *
 *   node scripts/recent.mjs          # last 48 hours, plus every topic ever covered
 *   node scripts/recent.mjs 7        # last 7 days
 */
import { execFileSync } from 'node:child_process';

const days = Number(process.argv[2] || 2);
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

try {
  git('fetch', '-q', 'origin', '+refs/heads/*:refs/remotes/origin/*');
} catch {
  console.log('(git fetch failed; using refs already in this checkout)');
}

const refs = ['HEAD', ...git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin')
  .split('\n').filter((r) => r && !r.endsWith('/HEAD'))];

const today = new Date();
const cutoff = new Date(today);
cutoff.setUTCDate(cutoff.getUTCDate() - days);
const cutoffStr = cutoff.toISOString().slice(0, 10);

const topics = new Map(); // line -> branches
const scripts = new Map(); // path -> { branches, firstLine }
for (const ref of refs) {
  let t = '';
  try { t = git('show', `${ref}:topics.txt`); } catch { continue; }
  for (const line of t.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (!topics.has(line)) topics.set(line, new Set());
    topics.get(line).add(ref);
  }
  let files = [];
  try { files = git('ls-tree', '--name-only', ref, 'log/').split('\n'); } catch { /* none */ }
  for (const f of files.filter((f) => f.endsWith('.final.txt'))) {
    const date = f.slice(4, 14);
    if (date < cutoffStr) continue;
    const key = `${ref}:${f}`;
    let first = '';
    try { first = git('show', key).trim().split('\n')[0]; } catch { /* skip */ }
    const id = `${f} | ${first}`;
    if (!scripts.has(id)) scripts.set(id, new Set());
    scripts.get(id).add(ref);
  }
}

console.log(`# Scripts already made since ${cutoffStr} (all branches)\n`);
if (scripts.size === 0) console.log('(none)');
for (const [id, b] of [...scripts].sort()) console.log(`- ${id}  [${[...b].join(', ')}]`);

console.log('\n# Every topic already covered (merged from all branches)\n');
for (const line of [...topics.keys()].sort()) console.log(line);
