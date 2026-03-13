---
name: gws
description: Google Workspace CLI for managing Gmail, Calendar, Drive, Docs, Sheets, Slides, Tasks, Keep, Chat, People, Meet, and more via the `gws` CLI tool.
homepage: https://github.com/googleworkspace/cli
metadata:
  {
    "openclaw":
      {
        "emoji": "🔵",
        "requires": { "bins": ["gws"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "@googleworkspace/cli",
              "bins": ["gws"],
              "label": "Install Google Workspace CLI (npm)",
            },
          ],
      },
  }
---

# gws — Google Workspace CLI

Use the `gws` CLI to interact with Google Workspace services from the terminal.

## When to Use

✅ **USE this skill when:**

- Reading, sending, or managing Gmail messages
- Listing or creating Calendar events
- Managing Drive files and folders
- Reading or writing Google Docs, Sheets, Slides
- Managing Tasks, Keep notes, Chat spaces
- Automating repetitive Workspace tasks

❌ **DON'T use this skill when:**

- Google Admin operations (use `gcloud` or Admin SDK directly)
- Bulk operations across many users (use Admin SDK)
- Real-time collaboration features (UI-only)

## Setup

### Prerequisites

- Node.js + npm
- `gcloud` CLI (for `gws auth setup`)

### Install

```bash
npm install -g @googleworkspace/cli
```

### Authenticate

> ⚠️ **WSL users:** `gws auth setup --login` opens a browser. In WSL, set a browser explicitly or run on the Windows side.

```bash
# Option 1: WSL with explicit browser
export BROWSER="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
gws auth setup --login

# Option 2: Windows (PowerShell/CMD)
npm install -g @googleworkspace/cli
gws auth setup --login

# Option 3: Login with specific services only
gws auth login -s gmail,calendar,drive,docs,sheets,slides,tasks,keep,chat,people
```

### Check auth status

```bash
gws auth status
```

## Scopes

| Service | Required Scope |
|---------|---------------|
| Gmail | `gmail` |
| Calendar | `calendar` |
| Drive | `drive` |
| Docs | `docs` |
| Sheets | `sheets` |
| Slides | `slides` (presentations) |
| Tasks | `tasks` |
| Keep | `keep` (re-auth needed if missing) |
| Chat | `chat` (re-auth needed if missing) |
| People | `people` + `profile` (re-auth needed if missing) |

To add missing scopes:
```bash
gws auth login -s gmail,calendar,drive,docs,sheets,slides,tasks,keep,chat,people
```

## Common Commands

### Gmail

```bash
# List latest messages
gws gmail users messages list --params '{"userId": "me", "maxResults": 10}' --format table

# Get a message
gws gmail users messages get --params '{"userId": "me", "id": "<messageId>"}' 

# Send a message (base64-encoded RFC 2822)
gws gmail users messages send --params '{"userId": "me"}' --json '{"raw": "<base64>"}'
```

### Calendar

```bash
# List upcoming events
gws calendar events list --params '{"calendarId": "primary", "maxResults": 10, "orderBy": "startTime", "singleEvents": true, "timeMin": "2025-01-01T00:00:00Z"}' --format table

# Create an event
gws calendar events insert --params '{"calendarId": "primary"}' --json '{"summary": "Meeting", "start": {"dateTime": "2025-06-01T10:00:00Z"}, "end": {"dateTime": "2025-06-01T11:00:00Z"}}'
```

### Drive

```bash
# List files
gws drive files list --params '{"pageSize": 10}' --format table

# List only Docs
gws drive files list --params '{"pageSize": 10, "q": "mimeType=\"application/vnd.google-apps.document\""}' --format table

# Download a file
gws drive files get --params '{"fileId": "<fileId>", "alt": "media"}' --output ./file.pdf

# Upload a file
gws drive files create --upload ./myfile.pdf --json '{"name": "myfile.pdf"}'
```

### Docs

> Docs don't have a `list` command — use Drive to find doc IDs, then use `get`.

```bash
# Get a document
gws docs documents get --params '{"documentId": "<docId>"}' 

# Create a blank document
gws docs documents create --json '{"title": "New Document"}'

# Append text to a document (helper)
gws docs +write --params '{"documentId": "<docId>"}' --json '{"text": "Hello World"}'
```

### Sheets

```bash
# Get a spreadsheet
gws sheets spreadsheets get --params '{"spreadsheetId": "<spreadsheetId>"}' 

# Read values (helper)
gws sheets +read --params '{"spreadsheetId": "<spreadsheetId>", "range": "Sheet1!A1:D10"}'

# Append a row (helper)
gws sheets +append --params '{"spreadsheetId": "<spreadsheetId>", "range": "Sheet1"}' --json '{"values": [["col1", "col2", "col3"]]}'
```

### Tasks

```bash
# List task lists
gws tasks tasklists list --format table

# List tasks in a list
gws tasks tasks list --params '{"tasklist": "<tasklistId>"}' --format table

# Create a task
gws tasks tasks insert --params '{"tasklist": "<tasklistId>"}' --json '{"title": "New Task"}'
```

### Keep

> Requires `keep` scope. Re-authenticate if missing.

```bash
# List notes
gws keep notes list --format table

# Get a note
gws keep notes get --params '{"name": "<noteName>"}' 

# Create a note
gws keep notes create --json '{"title": "My Note", "body": {"text": {"text": "Note content"}}}'
```

### Chat

> Requires `chat` scope. Re-authenticate if missing.

```bash
# List spaces
gws chat spaces list --format table

# Send a message to a space (helper)
gws chat +send --params '{"parent": "spaces/<spaceId>"}' --json '{"text": "Hello from gws!"}'

# List messages in a space
gws chat spaces messages list --params '{"parent": "spaces/<spaceId>"}' --format table
```

### People / Contacts

> Requires `people` + `profile` scopes. Re-authenticate if missing.

```bash
# Get your own profile
gws people people get --params '{"resourceName": "people/me", "personFields": "names,emailAddresses"}'

# Search contacts
gws people people searchContacts --params '{"query": "John", "readMask": "names,emailAddresses"}' --format table

# List contacts
gws people people listDirectoryPeople --params '{"readMask": "names,emailAddresses", "sources": ["DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE"]}' --format table
```

### Meet

```bash
# List conference records
gws meet conferenceRecords list --format table

# Get a Meet space
gws meet spaces get --params '{"name": "spaces/<spaceId>"}' 
```

## Output Formats

All commands support `--format`:

```bash
--format json    # default
--format table   # human-readable table
--format yaml
--format csv
```

## Pagination

```bash
# Auto-paginate all results
gws drive files list --page-all

# Limit pages
gws drive files list --page-all --page-limit 5
```

## Notes

- `gws` is not an officially supported Google product
- Docs, Sheets, Slides have no `list` command — find IDs via `gws drive files list`
- WSL requires explicit browser config for OAuth flow
- Credentials stored encrypted at `~/.config/gws/credentials.enc`
- Project: `vro-gcp-evaluation`
