import { describe, it, expect } from 'vitest';
import { detectPackagesFromPaths, findPackageForPath, normalizePath } from '../src/monorepo';
import { PackageInfo } from '../src/types';

describe('Monorepo utilities', () => {
  it('normalizes path strings properly', () => {
    expect(normalizePath('/packages/core/src/index.ts/')).toBe('packages/core/src/index.ts');
    expect(normalizePath('packages\\ui\\button.tsx')).toBe('packages/ui/button.tsx');
  });

  it('detects monorepo packages from directory conventions and package manifests', () => {
    const paths = [
      'packages/ui/package.json',
      'packages/ui/src/button.tsx',
      'apps/web/package.json',
      'services/auth/src/server.ts',
      'README.md',
    ];

    const packages = detectPackagesFromPaths(paths);

    expect(packages).toHaveLength(3);
    expect(packages).toContainEqual({ name: 'ui', rootPath: 'packages/ui' });
    expect(packages).toContainEqual({ name: 'web', rootPath: 'apps/web' });
    expect(packages).toContainEqual({ name: 'auth', rootPath: 'services/auth' });
  });

  it('finds the matching package boundary for a file path', () => {
    const packages: PackageInfo[] = [
      { name: 'ui', rootPath: 'packages/ui' },
      { name: 'ui-core', rootPath: 'packages/ui/core' },
    ];

    expect(findPackageForPath('packages/ui/src/Button.tsx', packages)).toEqual({
      name: 'ui',
      rootPath: 'packages/ui',
    });

    expect(findPackageForPath('packages/ui/core/src/Button.tsx', packages)).toEqual({
      name: 'ui-core',
      rootPath: 'packages/ui/core',
    });

    expect(findPackageForPath('docs/readme.md', packages)).toBeNull();
  });
});
