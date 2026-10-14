import { PackageInfo } from './types';

/**
 * Normalizes a file or directory path by trimming leading/trailing slashes and replacing backslashes.
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

/**
 * Given a file or folder path and a list of package roots/manifests, determines the owning package boundary.
 */
export function findPackageForPath(
  filePath: string,
  packages: PackageInfo[]
): PackageInfo | null {
  const normPath = normalizePath(filePath);

  // Sort packages by deepest rootPath first to match most specific sub-package
  const sortedPackages = [...packages].sort(
    (a, b) => normalizePath(b.rootPath).length - normalizePath(a.rootPath).length
  );

  for (const pkg of sortedPackages) {
    const pkgRoot = normalizePath(pkg.rootPath);
    if (!pkgRoot || pkgRoot === '.') {
      continue;
    }
    if (normPath === pkgRoot || normPath.startsWith(pkgRoot + '/')) {
      return pkg;
    }
  }

  return null;
}

/**
 * Scans a list of relative repository paths (e.g. file paths in a commit or repo file tree)
 * to infer monorepo package roots based on directory conventions (e.g., `packages/*`, `apps/*`, `services/*`, or nested `package.json` locations).
 */
export function detectPackagesFromPaths(paths: string[]): PackageInfo[] {
  const packagesMap = new Map<string, PackageInfo>();

  for (const rawPath of paths) {
    const path = normalizePath(rawPath);
    const parts = path.split('/');

    // Check if path indicates a nested package (e.g. packages/foo, apps/bar, or package.json location)
    if (path.endsWith('/package.json') || path === 'package.json') {
      if (path !== 'package.json') {
        const rootPath = parts.slice(0, -1).join('/');
        const packageName = parts[parts.length - 2];
        packagesMap.set(rootPath, { name: packageName, rootPath });
      }
    } else if (parts.length >= 2 && ['packages', 'apps', 'services', 'modules', 'libs'].includes(parts[0])) {
      const rootPath = `${parts[0]}/${parts[1]}`;
      const packageName = parts[1];
      if (!packagesMap.has(rootPath)) {
        packagesMap.set(rootPath, { name: packageName, rootPath });
      }
    }
  }

  return Array.from(packagesMap.values());
}
