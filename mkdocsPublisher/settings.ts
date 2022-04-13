import {App, PluginSettingTab, Setting} from "obsidian";
import mkdocsPublication from "./main";

export interface mkdocsPublicationSettings {
	githubRepo: string;
	githubName: string;
	GhToken: string;
	shareKey: string;
	ExcludedFolder: string;
	fileMenu: boolean;
	categoryKey: string;
	categoryDefault: string;
}

export const DEFAULT_SETTINGS: mkdocsPublicationSettings = {
	githubRepo: "",
	githubName: "",
	GhToken: "",
	shareKey: "share",
	ExcludedFolder: "",
	fileMenu: false,
	categoryKey: "category",
	categoryDefault: 'notes',
};

export class mkdocsSettingsTab extends PluginSettingTab {
	plugin: mkdocsPublication;
	constructor(app: App, plugin: mkdocsPublication) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): any {
		let {containerEl}=this;
		containerEl.empty();
		containerEl.createEl("h1", {text: "Mkdocs Publication Settings"});
		new Setting(containerEl)
			.setName("Repo Name")
			.setDesc("The name of the repository where you store your blog.")
			.addText((text) =>
				text
					.setPlaceholder("mkdocs-template")
					.setValue(this.plugin.settings.githubRepo)
					.onChange(async(value)=>{
						this.plugin.settings.githubRepo = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Github Username")
			.setDesc("Your github username.")
			.addText((text) =>
				text
					.setPlaceholder("Github-username")
					.setValue(this.plugin.settings.githubName)
					.onChange(async(value)=>{
						this.plugin.settings.githubName = value;
						await this.plugin.saveSettings();
					})
			);
		const desc_ghToken=document.createDocumentFragment();
		desc_ghToken.createEl("span", null, (span)=>{
			span.innerText="A github token with repository permission. You can generate it ";
			span.createEl("a", null, (link)=> {
				link.innerText = "here";
				link.href = "https://github.com/settings/tokens/new?scopes=repo,workflow";
			});
		})
		new Setting(containerEl)
			.setName("Github Token")
			.setDesc(desc_ghToken)
			.addText((text) =>
				text
					.setPlaceholder("ghb-15457498545647987987112184")
					.setValue(this.plugin.settings.GhToken)
					.onChange(async(value)=>{
						this.plugin.settings.GhToken = value;
						await this.plugin.saveSettings();
					})
			);
		containerEl.createEl("h3", {text: "Settings for sharing"});
		new Setting(containerEl)
			.setName("Share Key")
			.setDesc("The frontmatter key to publish your file on the website.")
			.addText((text) =>
				text
					.setPlaceholder("share")
					.setValue(this.plugin.settings.shareKey)
					.onChange(async(value)=>{
						this.plugin.settings.shareKey = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h4", {text: "Settings for categories"});
		containerEl.createEl("p", {text: "Theses settings needs to be the same on your .github-actions file."});

		new Setting(containerEl)
			.setName("Category Key")
			.setDesc("The frontmatter key to set the category of your file.")
			.addText((text) =>
				text
					.setPlaceholder("category")
					.setValue(this.plugin.settings.categoryKey)
					.onChange(async(value)=>{
						this.plugin.settings.categoryKey = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default category")
			.setDesc("The default category of your file : it's the default folder where your files will be published.")
			.addText((text) =>
				text
					.setPlaceholder("notes")
					.setValue(this.plugin.settings.categoryDefault)
					.onChange(async(value)=>{
						this.plugin.settings.categoryDefault = value;
						await this.plugin.saveSettings();
					})
			);


		new Setting(containerEl)
			.setName("Excluded Folder")
			.setDesc("Never publish file in these folder, regardless of the share key. Separate folder name by comma.")
			.addTextArea((textArea) =>
				textArea
					.setPlaceholder("_assets, Archive")
					.setValue(this.plugin.settings.ExcludedFolder)
					.onChange(async(value)=>{
						this.plugin.settings.ExcludedFolder = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("File Menu")
			.setDesc('Add an sharing commands in the file menu')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.fileMenu)
					.onChange(async(value)=>{
						this.plugin.settings.fileMenu = value;
						await this.plugin.saveSettings();
					})
			);

	}
}
