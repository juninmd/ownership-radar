/**
 * Formats detection results into human-readable notifications for GitHub UI or messages.
 */

/**
 * Creates a structured notification message based on ownership sync analysis.
 *
 * @param {import('./syncDetector.js').detectOwnershipSync extends (...args: any) => infer R ? R : any} syncResult
 * @param {Object} [options]
 * @param {string} [options.format='markdown'] - Output format ('markdown', 'html', or 'plain')
 * @returns {Object} Notification object containing level, title, body, summary, and actionItems
 */
export function generateSyncNotification(syncResult, options = {}) {
  const format = options.format || 'markdown';
  const {
    isOutOfSync,
    divergencePercentage,
    totalFiles,
    divergedFilesCount,
    details = [],
    threshold
  } = syncResult;

  const thresholdPct = Math.round((threshold || 0.2) * 100);

  if (!isOutOfSync) {
    return {
      level: 'info',
      isOutOfSync: false,
      title: 'CODEOWNERS is in sync',
      summary: `CODEOWNERS matches actual commit ownership (${divergedFilesCount}/${totalFiles} files diverged, below ${thresholdPct}% threshold).`,
      body: formatMarkdownSyncBody(syncResult, false),
      actionable: false
    };
  }

  const divergedItems = details.filter(d => !d.inSync);

  const title = `⚠️ CODEOWNERS is significantly out of sync (${divergencePercentage}% divergence)`;
  const summary = `CODEOWNERS is ${divergencePercentage}% out of sync with actual repository ownership (${divergedFilesCount} of ${totalFiles} files differ, exceeding the ${thresholdPct}% threshold).`;

  let body = '';
  if (format === 'html') {
    body = formatHtmlSyncBody(syncResult, divergedItems);
  } else if (format === 'plain') {
    body = formatPlainSyncBody(syncResult, divergedItems);
  } else {
    body = formatMarkdownSyncBody(syncResult, true, divergedItems);
  }

  return {
    level: 'warning',
    isOutOfSync: true,
    title,
    summary,
    body,
    actionable: true,
    divergencePercentage,
    divergedFilesCount,
    totalFiles,
    divergedItems
  };
}

function formatMarkdownSyncBody(syncResult, outOfSync, divergedItems = []) {
  const { divergencePercentage, divergedFilesCount, totalFiles } = syncResult;

  if (!outOfSync) {
    return `### CODEOWNERS Status: Up to date\n\nAll rules closely match recent contributor activity across ${totalFiles} analyzed files.`;
  }

  let md = `### ⚠️ CODEOWNERS Out-of-Sync Warning\n\n`;
  md += `**${divergencePercentage}% of files (${divergedFilesCount}/${totalFiles})** have CODEOWNERS that differ from actual recent ownership.\n\n`;
  md += `| File Path | Declared Owners | Actual Top Contributors | Status |\n`;
  md += `| --- | --- | --- | --- |\n`;

  for (const item of divergedItems.slice(0, 10)) {
    const declared = item.declaredOwners.length > 0 ? item.declaredOwners.join(', ') : '*(None)*';
    const actual = item.actualOwners.length > 0 ? item.actualOwners.join(', ') : '*(None)*';
    const reason = item.reason === 'UNOWNED' ? 'Missing Owner' : 'Owner Mismatch';
    md += `| \`${item.path}\` | ${declared} | ${actual} | ${reason} |\n`;
  }

  if (divergedItems.length > 10) {
    md += `\n*...and ${divergedItems.length - 10} more diverged files.*\n`;
  }

  md += `\n**Recommended Action:** Update your \`.github/CODEOWNERS\` file to accurately reflect current active maintainers.`;
  return md;
}

function formatHtmlSyncBody(syncResult, divergedItems = []) {
  const { divergencePercentage, divergedFilesCount, totalFiles } = syncResult;
  let html = `<div class="codeowners-out-of-sync-banner" style="border: 1px solid #e1e4e8; padding: 12px; border-radius: 6px; background-color: #fff8c5;">`;
  html += `<h4 style="margin-top:0;">⚠️ CODEOWNERS is ${divergencePercentage}% out of sync</h4>`;
  html += `<p>Found <strong>${divergedFilesCount} of ${totalFiles}</strong> files where CODEOWNERS rules diverge from recent repository activity.</p>`;

  if (divergedItems.length > 0) {
    html += `<ul>`;
    for (const item of divergedItems.slice(0, 5)) {
      html += `<li><code>${item.path}</code>: declared <em>${item.declaredOwners.join(', ') || 'none'}</em>, actual <em>${item.actualOwners.join(', ') || 'none'}</em></li>`;
    }
    if (divergedItems.length > 5) {
      html += `<li><em>+ ${divergedItems.length - 5} more files...</em></li>`;
    }
    html += `</ul>`;
  }

  html += `<p style="margin-bottom:0;"><em>Consider updating CODEOWNERS to streamline pull request reviews.</em></p>`;
  html += `</div>`;
  return html;
}

function formatPlainSyncBody(syncResult, divergedItems = []) {
  const { divergencePercentage, divergedFilesCount, totalFiles } = syncResult;
  let text = `CODEOWNERS is ${divergencePercentage}% out of sync (${divergedFilesCount}/${totalFiles} files).\n`;
  for (const item of divergedItems) {
    text += `- ${item.path}: declared [${item.declaredOwners.join(', ')}], actual [${item.actualOwners.join(', ')}]\n`;
  }
  return text.trim();
}
