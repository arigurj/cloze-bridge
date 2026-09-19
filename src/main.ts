import { Plugin, MarkdownView, MarkdownFileInfo, Editor, Notice } from 'obsidian';
import { ClozeBridgeSettingTab, ClozeBridgeSettings, DEFAULT_SETTINGS } from './settings';
import { ClozeCardStore, ClozeCard } from './ClozeCardStore';
import { ClozePanel, CLOZE_PANEL_TYPE } from './ClozePanel';

export default class ClozeBridgePlugin extends Plugin {
  settings: ClozeBridgeSettings = DEFAULT_SETTINGS;
  private cardStore!: ClozeCardStore;

  async onload() {
    await this.loadSettings();
    this.cardStore = new ClozeCardStore(this.app, this);

    this.addSettingTab(new ClozeBridgeSettingTab(this.app, this));

    this.registerView(
      CLOZE_PANEL_TYPE,
      (leaf) => new ClozePanel(leaf, this)
    );

    this.addCommand({
      id: 'add-cloze-from-selection',
      name: 'Add cloze from selection',
      editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
        if (!(ctx instanceof MarkdownView)) return;
        const card = this.cardStore.addFromSelection(editor, ctx);
        if (card) {
          this.showNotice(`Added c${card.cNumber} cloze`);
          this.refreshPanel();
        } else {
          this.showNotice('Select text first');
        }
      },
    });

    this.addCommand({
      id: 'toggle-cloze-panel',
      name: 'Toggle cloze panel',
      callback: () => this.togglePanel(),
    });

    this.addCommand({
      id: 'export-tsv',
      name: 'Export cards to TSV',
      callback: async () => {
        const path = await this.cardStore.exportTSV();
        if (path) {
          this.showNotice(`Exported to ${path}`);
        } else {
          this.showNotice('No cards to export');
        }
      },
    });

    this.addCommand({
      id: 'clear-all-cards',
      name: 'Clear all cards',
      callback: () => {
        this.cardStore.clearAll();
        this.showNotice('All cards cleared');
        this.refreshPanel();
      },
    });

    this.addRibbonIcon('layers', 'Cloze Bridge', () => {
      this.togglePanel();
    });

    this.app.workspace.onLayoutReady(() => {
      this.activatePanel();
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(CLOZE_PANEL_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  getCardStore(): ClozeCardStore {
    return this.cardStore;
  }

  getAllCards(): ClozeCard[] {
    return this.cardStore.getAllCards();
  }

  removeCard(id: string): void {
    this.cardStore.removeCard(id);
    this.refreshPanel();
  }

  clearAllCards(): void {
    this.cardStore.clearAll();
    this.refreshPanel();
  }

  async exportTSV(): Promise<string | null> {
    return this.cardStore.exportTSV();
  }

  async togglePanel() {
    const leaves = this.app.workspace.getLeavesOfType(CLOZE_PANEL_TYPE);
    if (leaves.length > 0) {
      this.app.workspace.detachLeavesOfType(CLOZE_PANEL_TYPE);
    } else {
      await this.activatePanel();
    }
  }

  private async activatePanel() {
    const { workspace } = this.app;
    const leaf = workspace.getRightLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: CLOZE_PANEL_TYPE, active: true });
    workspace.revealLeaf(leaf);
  }

  private refreshPanel() {
    const leaves = this.app.workspace.getLeavesOfType(CLOZE_PANEL_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view as ClozePanel;
      if (view && typeof view.render === 'function') {
        view.render();
      }
    }
  }

  showNotice(message: string) {
    new Notice(message);
  }
}
