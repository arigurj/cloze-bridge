# Cloze Bridge

Obsidian plugin that converts selected text into Anki Cloze cards and exports them as `.tsv` for AnkiConnect.

## Features

- **Inline cloze creation** — select text in any note, run a command, and it becomes `{{c1::selected text}}`
- **Card panel** — sidebar panel showing all cloze cards with jump-to-note and remove actions
- **TSV export** — one-click export of all cards to a `.tsv` file ready for Anki import
- **Auto-increment** — automatically numbers `c1`, `c2`, `c3` across clozes in the same note
- **Tags & deck** — includes note tags and deck name in the export
- **Ribbon icon** — quick toggle from the sidebar ribbon

## Usage

1. Select text in a note
2. Run command **"Add cloze from selection"** (or bind a hotkey like `Ctrl+Shift+C`)
3. The selected text is replaced with `{{c1::selected text}}`
4. Open the Cloze Panel from the ribbon icon or command palette
5. Click **Export TSV** to save all cards to a file

## Import into Anki

1. In Anki: **File → Import**
2. Select the `.tsv` file
3. Choose **Cloze** note type
4. Map fields: Field 1 → Text, Field 2 → Tags (optional)

## Commands

| Command | Description |
|---------|-------------|
| `Add cloze from selection` | Convert selected text to cloze |
| `Toggle cloze panel` | Show/hide the card panel |
| `Export cards to TSV` | Export all cards to a file |
| `Clear all cards` | Remove all stored cards |

## Settings

| Setting | Description |
|---------|-------------|
| Export folder | Subfolder in vault for `.tsv` files |
| Default deck name | Deck name in exported cards |
| Auto-increment c1 | Number clozes automatically (c1, c2, c3…) |
| TSV delimiter | Tab or comma |
| Include tags | Export note tags as Anki tags |

## Installation

1. Download `main.js`, `manifest.json`, `styles.css` from the latest release
2. Create folder `<vault>/.obsidian/plugins/cloze-bridge/`
3. Copy files into the folder
4. Enable in **Settings → Community plugins**

## License

MIT
