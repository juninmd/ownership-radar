import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCodeowners, getOwnersForPath, patternToRegex } from '../src/codeowners.js';

test('parseCodeowners parses valid CODEOWNERS lines', () => {
  const content = `
# Global default
* @global-owner

# Directory rule
/src/ @frontend-team @dev1

# Specific file extension
*.js @js-devs
`;

  const rules = parseCodeowners(content);
  assert.equal(rules.length, 3);

  assert.equal(rules[0].pattern, '*');
  assert.deepEqual(rules[0].owners, ['@global-owner']);

  assert.equal(rules[1].pattern, '/src/');
  assert.deepEqual(rules[1].owners, ['@frontend-team', '@dev1']);

  assert.equal(rules[2].pattern, '*.js');
  assert.deepEqual(rules[2].owners, ['@js-devs']);
});

test('getOwnersForPath matches correctly based on last matching rule', () => {
  const content = `
* @default-owner
/src/ @src-team
/src/utils/ @utils-team
`;

  const rules = parseCodeowners(content);

  assert.deepEqual(getOwnersForPath(rules, 'README.md'), ['@default-owner']);
  assert.deepEqual(getOwnersForPath(rules, 'src/index.js'), ['@src-team']);
  assert.deepEqual(getOwnersForPath(rules, 'src/utils/helper.js'), ['@utils-team']);
});

test('patternToRegex converts patterns accurately', () => {
  const reg1 = patternToRegex('*.js');
  assert.ok(reg1.test('file.js'));
  assert.ok(reg1.test('src/file.js'));
  assert.ok(!reg1.test('file.ts'));

  const reg2 = patternToRegex('/docs/');
  assert.ok(reg2.test('docs/README.md'));
  assert.ok(reg2.test('docs/sub/doc.md'));
  assert.ok(!reg2.test('src/docs/README.md'));
});
