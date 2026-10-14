# ownership-radar

A GitHub browser extension that analyzes recent commit history to dynamically suggest code owners per file or folder, displaying transparent 'why' explanations directly in the GitHub UI to reduce misdirected questions and accelerate reviews in scaling teams.

## Features

- **Dynamic Code Ownership Analysis**: Analyzes recent commit history per file or directory.
- **Transparent Explanations**: Displays clear reasons why specific individuals or teams own a component.
- **CSV Export for Onboarding Documentation**: Export ownership analysis as CSV to streamline team onboarding, documentation, and handover processes.

## CSV Export Format

The CSV export includes the following columns:

| Column | Description |
| --- | --- |
| `Path` | File or folder path within the repository |
| `Primary Owner` | Suggested primary owner or team |
| `Ownership (%)` | Calculated ownership proportion |
| `Recent Commits` | Number of recent commits authored by primary owner |
| `Explanation` | Contextual rationale for ownership assignment |

## Usage & Development

### Running Tests

```bash
npm test
```

### Loading Extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the repository root folder.
