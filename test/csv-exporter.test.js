import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvCell,
  generateOwnershipCsv,
  exportOwnershipCsv,
  DEFAULT_COLUMNS
} from '../src/csv-exporter.js';

test('escapeCsvCell correctly formats simple values', () => {
  assert.equal(escapeCsvCell('hello'), 'hello');
  assert.equal(escapeCsvCell(123), '123');
  assert.equal(escapeCsvCell(null), '""');
  assert.equal(escapeCsvCell(undefined), '""');
});

test('escapeCsvCell handles special characters (commas, double quotes, newlines)', () => {
  assert.equal(escapeCsvCell('hello, world'), '"hello, world"');
  assert.equal(escapeCsvCell('say "hello"'), '"say ""hello"""');
  assert.equal(escapeCsvCell('line1\nline2'), '"line1\nline2"');
});

test('generateOwnershipCsv generates correct header and rows with default columns', () => {
  const records = [
    {
      path: 'src/auth/login.js',
      owner: 'octocat',
      ownershipPercentage: '75%',
      recentCommits: 15,
      explanation: 'Authored 15 out of 20 commits recently'
    },
    {
      path: 'src/utils/math.js',
      owner: 'mona',
      ownershipPercentage: '100%',
      recentCommits: 8,
      explanation: 'Authored all recent commits'
    }
  ];

  const csv = generateOwnershipCsv(records);
  const lines = csv.split('\n');

  assert.equal(lines.length, 3);
  assert.equal(lines[0], 'Path,Primary Owner,Ownership (%),Recent Commits,Explanation');
  assert.equal(lines[1], 'src/auth/login.js,octocat,75%,15,Authored 15 out of 20 commits recently');
  assert.equal(lines[2], 'src/utils/math.js,mona,100%,8,Authored all recent commits');
});

test('generateOwnershipCsv supports custom columns', () => {
  const records = [
    { file: 'README.md', author: 'dev1' }
  ];

  const columns = [
    { key: 'file', label: 'File Name' },
    { key: 'author', label: 'Author' }
  ];

  const csv = generateOwnershipCsv(records, { columns });
  assert.equal(csv, 'File Name,Author\nREADME.md,dev1');
});

test('generateOwnershipCsv handles empty records array', () => {
  const csv = generateOwnershipCsv([]);
  assert.equal(csv, 'Path,Primary Owner,Ownership (%),Recent Commits,Explanation');
});

test('generateOwnershipCsv handles missing or undefined fields in records', () => {
  const records = [
    { path: 'src/index.js' }
  ];

  const csv = generateOwnershipCsv(records);
  assert.equal(csv, 'Path,Primary Owner,Ownership (%),Recent Commits,Explanation\nsrc/index.js,,,,');
});

test('exportOwnershipCsv generates and returns CSV string in Node environment', () => {
  const records = [
    { path: 'docs/onboarding.md', owner: 'team-lead', ownershipPercentage: '90%', recentCommits: 10, explanation: 'Maintained onboarding docs' }
  ];

  const result = exportOwnershipCsv(records, 'onboarding-owners.csv');
  assert.ok(result.includes('docs/onboarding.md'));
  assert.ok(result.includes('team-lead'));
});
