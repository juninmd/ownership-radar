# ownership-radar
A GitHub browser extension that analyzes recent commit history to dynamically suggest code owners per file or folder, displaying transparent 'why' explanations directly in the GitHub UI to reduce misdirected questions and accelerate reviews in scaling teams.

## Features
- **File Ownership Analysis**: Evaluates commit history across touched files in a PR to calculate file maintainership percentages.
- **Recent Collaboration Weighting**: Uses exponential recency decay (90-day half-life) to prioritize recent activity over stale contributions.
- **Transparent "Why" Explanations**: Provides detailed breakdown badges and bullet points explaining why each reviewer is recommended.
- **PR Author Filtering**: Automatically excludes the PR creator from reviewer suggestions.
- **GitHub UI Integration**: Injects a custom widget into the GitHub PR sidebar.

## Project Structure
- `src/types.ts`: TypeScript definitions for commits, PR details, file ownership, and reviewer suggestions.
- `src/ownership.ts`: Core algorithm for recency weighting, file ownership aggregation, and reviewer ranking.
- `src/github.ts`: API client to fetch PR changed files and commit histories from GitHub REST API.
- `src/content.ts`: DOM content script to parse GitHub PR pages and render the sidebar widget.
- `manifest.json`: WebExtension Manifest V3 configuration.

## Setup & Testing

### Installation
```bash
npm install
```

### Build Extension
```bash
npm run build
```
The bundled content script will be generated at `dist/content.iife.js`.

### Run Tests
```bash
npm test
```

### Type Check
```bash
npm run typecheck
```
