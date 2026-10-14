/**
 * Utility to parse and match GitHub CODEOWNERS files.
 */

/**
 * Converts a CODEOWNERS pattern into a Regular Expression.
 * @param {string} pattern
 * @returns {RegExp}
 */
export function patternToRegex(pattern) {
  let p = pattern.trim();
  let anchoredToStart = false;

  if (p.startsWith('/')) {
    anchoredToStart = true;
    p = p.slice(1);
  } else {
    // If pattern contains a slash anywhere before the end, it's anchored to root
    const nonTrailingSlashIndex = p.replace(/\/+$/, '').indexOf('/');
    if (nonTrailingSlashIndex !== -1) {
      anchoredToStart = true;
    }
  }

  // If pattern ends with '/', it matches anything under that directory
  if (p.endsWith('/')) {
    p += '**';
  }

  // Escape special regex characters except *, ?
  let regexStr = '';
  let i = 0;
  while (i < p.length) {
    const char = p[i];
    if (char === '*') {
      if (p[i + 1] === '*') {
        if (p[i + 2] === '/') {
          // '**/' matches zero or more directories
          regexStr += '(?:.*/)?';
          i += 3;
          continue;
        } else {
          // '**' matches any character sequence including '/'
          regexStr += '.*';
          i += 2;
          continue;
        }
      } else {
        // '*' matches any character sequence except '/'
        regexStr += '[^/]*';
        i += 1;
        continue;
      }
    } else if (char === '?') {
      regexStr += '[^/]';
      i += 1;
      continue;
    } else if (['.', '+', '^', '$', '(', ')', '[', ']', '{', '}', '|', '\\'].includes(char)) {
      regexStr += '\\' + char;
      i += 1;
    } else {
      regexStr += char;
      i += 1;
    }
  }

  if (anchoredToStart) {
    regexStr = '^' + regexStr + '$';
  } else {
    regexStr = '(?:^|/)' + regexStr + '$';
  }

  return new RegExp(regexStr);
}

/**
 * Parses CODEOWNERS text content.
 * @param {string} content
 * @returns {Array<{ pattern: string, owners: string[], lineNumber: number, rawLine: string, regex: RegExp }>}
 */
export function parseCodeowners(content) {
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  const rules = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // Split line by whitespace, accounting for escaped spaces if needed
    const parts = trimmed.split(/\s+/);
    if (parts.length === 0) return;

    const pattern = parts[0];
    const owners = parts.slice(1);

    rules.push({
      pattern,
      owners,
      lineNumber: index + 1,
      rawLine: line,
      regex: patternToRegex(pattern)
    });
  });

  return rules;
}

/**
 * Finds matching owners for a given relative file path from CODEOWNERS rules.
 * @param {Array<{ pattern: string, owners: string[], regex: RegExp }>} rules
 * @param {string} filePath - Path relative to repo root (e.g. "src/index.js")
 * @returns {string[]}
 */
export function getOwnersForPath(rules, filePath) {
  const normalizedPath = filePath.replace(/^\//, '');
  let matchedOwners = [];

  for (const rule of rules) {
    if (rule.regex.test(normalizedPath)) {
      matchedOwners = rule.owners;
    }
  }

  return matchedOwners;
}
