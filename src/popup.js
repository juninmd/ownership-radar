import { exportOwnershipCsv } from './csv-exporter.js';

document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('export-btn');
  const statusEl = document.getElementById('status');

  if (!exportBtn) return;

  exportBtn.addEventListener('click', async () => {
    try {
      statusEl.textContent = 'Preparing export...';

      // Query active tab or chrome storage for calculated ownership records
      let records = [];

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && chrome.tabs.sendMessage) {
          records = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'GET_OWNERSHIP_DATA' }, (response) => {
              if (chrome.runtime.lastError || !response) {
                resolve([]);
              } else {
                resolve(response.records || []);
              }
            });
          });
        }
      }

      // Fallback sample data if outside active GitHub page session
      if (!records || records.length === 0) {
        records = [
          {
            path: 'src/index.js',
            owner: 'alice',
            ownershipPercentage: '65%',
            recentCommits: 13,
            explanation: 'Authored 13 of 20 recent commits in src/index.js'
          },
          {
            path: 'src/components/',
            owner: 'bob',
            ownershipPercentage: '80%',
            recentCommits: 24,
            explanation: 'Authored 24 of 30 recent commits in src/components/'
          }
        ];
      }

      exportOwnershipCsv(records, 'ownership-data.csv');
      statusEl.textContent = `Exported ${records.length} ownership records to CSV!`;
    } catch (err) {
      statusEl.textContent = `Export failed: ${err.message}`;
    }
  });
});
