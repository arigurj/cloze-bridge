import { App, PluginSettingTab, Setting } from 'obsidian';
import ClozeBridgePlugin from './main';

export interface ClozeBridgeSettings {
  exportPath: string;
  defaultDeckName: string;
  autoIncrementC1: boolean;
  useMediaFolderForAudio: boolean;
  tsvDelimiter: '\t' | ',';
  includeTagsInExport: boolean;
}

export const DEFAULT_SETTINGS: ClozeBridgeSettings = {
  exportPath: '',
  defaultDeckName: 'Obsidian',
  autoIncrementC1: true,
  useMediaFolderForAudio: false,
  tsvDelimiter: '\t',
  includeTagsInExport: true,
};

export class ClozeBridgeSettingTab extends PluginSettingTab {
  plugin: ClozeBridgePlugin;

  constructor(app: App, plugin: ClozeBridgePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setHeading().setName('Cloze Bridge Settings');

    new Setting(containerEl)
      .setName('Export folder')
      .setDesc('Folder where .tsv file will be saved. Leave empty for vault root.')
      .addText(text => text
        .setPlaceholder('e.g. Anki Exports')
        .setValue(this.plugin.settings.exportPath)
        .onChange(async (value) => {
          this.plugin.settings.exportPath = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Default deck name')
      .setDesc('Deck name used when exporting to Anki.')
      .addText(text => text
        .setPlaceholder('Obsidian')
        .setValue(this.plugin.settings.defaultDeckName)
        .onChange(async (value) => {
          this.plugin.settings.defaultDeckName = value.trim() || 'Obsidian';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Auto-increment c1')
      .setDesc('Automatically number clozes starting from {{c1::...}} when multiple in one note.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoIncrementC1)
        .onChange(async (value) => {
          this.plugin.settings.autoIncrementC1 = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('TSV delimiter')
      .setDesc('Delimiter for .tsv export file.')
      .addDropdown(dropdown => dropdown
        .addOption('\t', 'Tab (.tsv)')
        .addOption(',', 'Comma (.csv)')
        .setValue(this.plugin.settings.tsvDelimiter)
        .onChange(async (value) => {
          this.plugin.settings.tsvDelimiter = value as '\t' | ',';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include tags in export')
      .setDesc('Include note tags as Anki tags in the TSV file.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeTagsInExport)
        .onChange(async (value) => {
          this.plugin.settings.includeTagsInExport = value;
          await this.plugin.saveSettings();
        }));
  }
}
