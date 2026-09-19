import { ItemView, WorkspaceLeaf, MarkdownView, MarkdownFileInfo, TFile, setIcon } from 'obsidian';
import ClozeBridgePlugin from './main';
import { ClozeCard } from './ClozeCardStore';

export const CLOZE_PANEL_TYPE = 'cloze-bridge-panel';

export class ClozePanel extends ItemView {
  private plugin: ClozeBridgePlugin;

  constructor(leaf: WorkspaceLeaf, plugin: ClozeBridgePlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return CLOZE_PANEL_TYPE;
  }

  getDisplayText(): string {
    return 'Cloze Cards';
  }

  getIcon(): string {
    return 'layers';
  }

  async onOpen() {
    const content = this.containerEl.children[1] as HTMLElement;
    content.empty();
    content.addClass('cloze-panel');
    this.render();
  }

  render() {
    const content = this.containerEl.children[1] as HTMLElement;
    content.empty();

    const header = content.createDiv({ cls: 'cloze-header' });
    header.createEl('h3', { text: 'Cloze Cards', cls: 'cloze-title' });

    const toolbar = content.createDiv({ cls: 'cloze-toolbar' });

    const exportBtn = toolbar.createEl('button', { text: 'Export TSV', cls: 'cloze-btn cloze-btn-primary' });
    exportBtn.addEventListener('click', async () => {
      const path = await this.plugin.exportTSV();
      if (path) {
        this.plugin.showNotice(`Exported to ${path}`);
        this.render();
      } else {
        this.plugin.showNotice('No cards to export');
      }
    });

    const clearBtn = toolbar.createEl('button', { text: 'Clear All', cls: 'cloze-btn cloze-btn-danger' });
    clearBtn.addEventListener('click', () => {
      this.plugin.clearAllCards();
      this.plugin.showNotice('All cards cleared');
      this.render();
    });

    const cards = this.plugin.getAllCards();
    if (cards.length === 0) {
      const empty = content.createDiv({ cls: 'cloze-empty' });
      empty.createEl('p', { text: 'No cloze cards yet.' });
      empty.createEl('p', { text: 'Select text in a note and use "Add cloze from selection"', cls: 'cloze-hint' });
      this.updateStatusBar(0);
      return;
    }

    const list = content.createDiv({ cls: 'cloze-card-list' });
    for (const card of cards) {
      list.appendChild(this.renderCard(card));
    }

    this.updateStatusBar(cards.length);
  }

  private renderCard(card: ClozeCard): HTMLElement {
    const item = createDiv({ cls: 'cloze-card-item' });

    const meta = item.createDiv({ cls: 'cloze-card-meta' });
    meta.createSpan({ text: card.noteName, cls: 'cloze-card-note' });
    meta.createSpan({ text: `L${card.line + 1}`, cls: 'cloze-card-line' });

    const text = item.createDiv({ cls: 'cloze-card-text' });
    text.setText(card.text);

    const footer = item.createDiv({ cls: 'cloze-card-footer' });

    const cNumber = footer.createSpan({ cls: 'cloze-card-c' });
    cNumber.setText(`c${card.cNumber}`);

    const tags = footer.createSpan({ cls: 'cloze-card-tags' });
    for (const tag of card.tags) {
      tags.createSpan({ text: `#${tag}`, cls: 'cloze-card-tag' });
    }

    const deck = footer.createSpan({ cls: 'cloze-card-deck' });
    deck.setText(card.deckName);

    const actions = item.createDiv({ cls: 'cloze-card-actions' });

    const jumpBtn = actions.createEl('button', { cls: 'cloze-card-btn', attr: { title: 'Jump to card' } });
    setIcon(jumpBtn, 'arrow-up-right');
    jumpBtn.addEventListener('click', () => {
      this.jumpToCard(card);
    });

    const removeBtn = actions.createEl('button', { cls: 'cloze-card-btn cloze-card-btn-danger', attr: { title: 'Remove card' } });
    setIcon(removeBtn, 'trash');
    removeBtn.addEventListener('click', () => {
      this.plugin.removeCard(card.id);
      this.render();
      this.plugin.showNotice(`Removed card from ${card.noteName}`);
    });

    return item;
  }

  private jumpToCard(card: ClozeCard) {
    const file = this.app.vault.getAbstractFileByPath(card.notePath);
    if (!(file instanceof TFile)) return;

    const leaf = this.app.workspace.getLeaf(false);
    if (!leaf) return;

    leaf.openFile(file, { active: true }).then(() => {
      const view = leaf.view;
      if (view instanceof MarkdownView) {
        view.editor.setCursor({ line: card.line, ch: 0 });
        view.editor.scrollIntoView({ from: { line: card.line, ch: 0 }, to: { line: card.line, ch: 0 } });
      }
    });
  }

  private updateStatusBar(count: number) {
    const statusBar = this.containerEl.querySelector('.cloze-status-bar') as HTMLElement | null;
    if (statusBar) {
      statusBar.setText(`${count} card${count !== 1 ? 's' : ''}`);
    } else if (count > 0) {
      const bar = this.containerEl.createDiv({ cls: 'cloze-status-bar' });
      bar.setText(`${count} card${count !== 1 ? 's' : ''}`);
    }
  }
}

function createDiv(o: { cls?: string } = {}): HTMLElement {
  const div = document.createElement('div');
  if (o.cls) div.className = o.cls;
  return div;
}
