/**
 * CSV Exporter for Ownership Radar
 * Exports ownership data as CSV format for team onboarding documentation.
 */

/**
 * Escapes a single value for CSV inclusion.
 * Wraps values in double quotes if they contain commas, quotes, or newlines.
 * Escapes internal quotes by doubling them (" -> "").
 *
 * @param {any} val
 * @returns {string}
 */
export function escapeCsvCell(val) {
  if (val === null || val === undefined) {
    return '""';
  }
  let str = String(val);
  // Neutralize spreadsheet formula injection (CSV injection): cells that start
  // with = + - @ (or tab/CR) are prefixed with a single quote.
  if (/^[=+\-@\t\r]/.test(str) && typeof val !== 'number') {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Default field mapping for ownership data.
 */
export const DEFAULT_COLUMNS = [
  { key: 'path', label: 'Path' },
  { key: 'owner', label: 'Primary Owner' },
  { key: 'ownershipPercentage', label: 'Ownership (%)' },
  { key: 'recentCommits', label: 'Recent Commits' },
  { key: 'explanation', label: 'Explanation' }
];

/**
 * Generates CSV content from ownership records.
 *
 * @param {Array<Object>} records - Array of ownership record objects.
 * @param {Object} [options]
 * @param {Array<{key: string, label: string}>} [options.columns] - Custom columns definition.
 * @returns {string} CSV formatted string.
 */
export function generateOwnershipCsv(records = [], options = {}) {
  const columns = options.columns || DEFAULT_COLUMNS;

  const headerRow = columns.map(col => escapeCsvCell(col.label)).join(',');

  const dataRows = records.map(record => {
    return columns
      .map(col => {
        const value = record[col.key];
        return escapeCsvCell(value !== undefined ? value : '');
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Triggers a download of the CSV data in browser environments.
 * Returns data URL string if browser window/document is available.
 *
 * @param {string} csvContent - The CSV formatted string.
 * @param {string} [filename='ownership-data.csv'] - File name for download.
 * @returns {Object} Result object containing filename and content length.
 */
export function createCsvBlobUrl(csvContent) {
  if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  }
  return null;
}

/**
 * Downloads ownership CSV file in browser environment.
 *
 * @param {Array<Object>} records - Array of ownership records.
 * @param {string} [filename='ownership-data.csv'] - Output CSV filename.
 * @param {Object} [options] - Options passed to generateOwnershipCsv.
 * @returns {string} CSV string.
 */
export function exportOwnershipCsv(records, filename = 'ownership-data.csv', options = {}) {
  const csvContent = generateOwnershipCsv(records, options);

  if (typeof document !== 'undefined') {
    const blobUrl = createCsvBlobUrl(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', blobUrl || 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return csvContent;
}
