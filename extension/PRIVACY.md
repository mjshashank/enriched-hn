# Privacy Policy for Enriched HN

**Last updated:** January 2, 2026

## Overview

Enriched HN is a browser extension that enhances your Hacker News browsing experience by displaying AI-generated metadata on stories. This policy explains how the extension handles data.

## Data Collection

**Enriched HN does not collect, store, or transmit any personal data.**

## Data Handling

### Local Storage
User preferences (filter settings, tag visibility options, enabled state) are stored locally in your browser using Chrome's storage API. This data never leaves your device.

### API Communication
The extension sends public Hacker News story IDs to a self-hosted API to retrieve pre-computed metadata (topic, content type, tags).

- Only story IDs are transmitted
- No personal information is sent
- No browsing history is collected
- No analytics or tracking

## Third-Party Services

| Service | Purpose | Data Sent |
|---------|---------|-----------|
| Self-hosted API (Cloudflare Workers) | Fetch story metadata | Public HN story IDs only |

## Permissions Used

| Permission | Purpose |
|------------|---------|
| `storage` | Save user preferences locally |
| `host_permissions` (news.ycombinator.com) | Display tags on HN pages |
| `host_permissions` (API) | Fetch story metadata |

## Changes to This Policy

Any updates to this privacy policy will be reflected in this document with an updated date.

## Contact

For questions about this privacy policy, please open an issue on the GitHub repository.
