import { App, MarkdownView, Editor, TFile, EditorPosition } from 'obsidian';
import ClozeBridgePlugin from './main';

export interface ClozeCard {
  id: string;
  text: string;
  originalText: string;
  line: number;
  chStart: number;
  chEnd: number;
  notePath: string;
  noteName: string;
  tags: string[];
  deckName: string;
  clozeIndex: number;
  cNumber: number;
}

interface CodeMirror6Editor {
  cm?: {
    dom: HTMLElement;
  };
}

export class ClozeCardStore {
  private app: App;
  private plugin: ClozeBridgePlugin;
  private cards: Map<string, ClozeCard> = new Map();

  constructor(app: App, plugin: ClozeBridgePlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  addFromSelection(editor: Editor, view: MarkdownView | null): ClozeCard | null {
    const selection = editor.getSelection();
    if (!selection || selection.trim().length === 0) {
      return null;
    }

    const cursor = editor.getCursor('to');
    const line = cursor.line;
    const chEnd = cursor.ch;

    const file = view?.file;
    if (!file) return null;

    const clozeIndex = this.getNextClozeIndexForNote(file.path);
    const cNumber = this.plugin.settings.autoIncrementC1 ? clozeIndex + 1 : 1;

    const card: ClozeCard = {
      id: `${file.path}:${line}:${clozeIndex}`,
      text: `{{c${cNumber}::${selection}}}`,
      originalText: selection,
      line: line,
      chStart: chEnd - selection.length,
      chEnd: chEnd,
      notePath: file.path,
      noteName: file.basename,
      tags: [],
      deckName: this.plugin.settings.defaultDeckName,
      clozeIndex: clozeIndex,
      cNumber: cNumber,
    };

    // Get note tags
    const fileCache = this.app.metadataCache.getFileCache(file);
    if (fileCache?.tags) {
      card.tags = fileCache.tags.map(t => t.tag.replace('#', ''));
    }

    // Store in memory
    this.cards.set(card.id, card);

    // Replace selection with cloze markup
    editor.replaceSelection(card.text);

    return card;
  }

  getCardsForNote(notePath: string): ClozeCard[] {
    return Array.from(this.cards.values())
      .filter(c => c.notePath === notePath)
      .sort((a, b) => a.line - b.line || a.chStart - b.chStart);
  }

  getAllCards(): ClozeCard[] {
    return Array.from(this.cards.values())
      .sort((a, b) => a.notePath.localeCompare(b.notePath) || a.line - b.line);
  }

  getCardCount(): number {
    return this.cards.size;
  }

  removeCard(id: string): void {
    this.cards.delete(id);
  }

  clearNote(notePath: string): void {
    for (const [id, card] of this.cards) {
      if (card.notePath === notePath) {
        this.cards.delete(id);
      }
    }
  }

  clearAll(): void {
    this.cards.clear();
  }

  private getNextClozeIndexForNote(notePath: string): number {
    let maxIndex = -1;
    for (const card of this.cards.values()) {
      if (card.notePath === notePath && card.clozeIndex > maxIndex) {
        maxIndex = card.clozeIndex;
      }
    }
    return maxIndex + 1;
  }

  generateTSV(): string {
    const delimiter = this.plugin.settings.tsvDelimiter;
    const lines: string[] = [];

    for (const card of this.getAllCards()) {
      // Anki cloze format: Text [tags] [deck]
      // Full line: "Question {{c1::answer}} / tag1 tag2 / DeckName"
      let line = card.text;

      if (this.plugin.settings.includeTagsInExport && card.tags.length > 0) {
        line += ` ${card.tags.map(t => `#${t}`).join(' ')}`;
      }

      line += ` / ${card.deckName}`;

      lines.push(line);
    }

    return lines.join('\n');
  }

  async exportTSV(): Promise<string | null> {
    const tsv = this.generateTSV();
    if (tsv.length === 0) {
      return null;
    }

    const vault = this.app.vault;
    const basePath = this.plugin.settings.exportPath || '';
    const fileName = `cloze-export-${Date.now()}.tsv`;
    const filePath = basePath ? `${basePath}/${fileName}` : fileName;

    // Ensure folder exists
    if (basePath && !vault.getAbstractFileByPath(basePath)) {
      await vault.createFolder(basePath);
    }

    const file = vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      await vault.modify(file, tsv);
    } else {
      await vault.create(filePath, tsv);
    }

    return filePath;
  }
}
