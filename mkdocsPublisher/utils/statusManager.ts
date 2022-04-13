import {ISiteManager} from "./siteManager";
import {TFile, Vault, App} from "obsidian";
import MkdocsPublish from "./publication";
import {mkdocsPublicationSettings} from "../settings";
import {generateBlobHash, getCategory} from "./utils";

export default class StatusManager implements IStatusManager {
	siteManager: ISiteManager;
	publication: MkdocsPublish;
	vault: Vault;
	app: App;
	settings: mkdocsPublicationSettings;

	constructor(siteManager: ISiteManager, publication: MkdocsPublish, vault: Vault, app: App, settings: mkdocsPublicationSettings) {
		this.siteManager = siteManager;
		this.publication = publication;
		this.vault = vault;
		this.app = app;
		this.settings = settings;
	}

	async getDeletedNotePaths(): Promise<Array<string>> {
		const remoteNoteHashes = await this.siteManager.getNoteHashes();
		const marked = await this.publication.getSharedFiles();
		return this.generateDeletedNotePaths(remoteNoteHashes, marked);
	}

	private generateDeletedNotePaths(remoteNoteHashes:{[key:string]:string}, marked:Array<TFile>): Array<string> {
		const deletedNotePaths: Array<string> = [];
		Object.keys(remoteNoteHashes).forEach(key=>{
			if (!marked.find(f=>f.path === key)){
				deletedNotePaths.push(key);
			}
		});
		return deletedNotePaths;
	}

	async getPublishStatus(): Promise<{ publishedNotes: Array<TFile>; changedNotes: Array<TFile>; unpublishedNotes: Array<TFile>; deletedNotePaths: Array<string> }> {
		const unpublishedNotes: Array<TFile> = [];
        const publishedNotes: Array<TFile> = [];
        const changedNotes: Array<TFile> = [];
		const remoteNoteHashes = await this.siteManager.getNoteHashes();
		const marked = await this.publication.getSharedFiles();
		for (const file of marked) {
				const content = await this.vault.cachedRead(file);
				const localHash = generateBlobHash(content);
				const path = getCategory(this.app, file, this.settings)
				const filePath = path + '/' + file.name;
				const remoteHash = remoteNoteHashes[filePath];
				if (!remoteHash) {
					unpublishedNotes.push(file);
				}
				else if (remoteHash === localHash) {
					publishedNotes.push(file);
				}
				else {
					changedNotes.push(file);
				}
		}
		const deletedNotePaths = this.generateDeletedNotePaths(remoteNoteHashes, marked);
		unpublishedNotes.sort((a, b) => a.path > b.path ? 1 : -1);
        publishedNotes.sort((a, b) => a.path > b.path ? 1 : -1);
        changedNotes.sort((a, b) => a.path > b.path ? 1 : -1);
        deletedNotePaths.sort((a, b) => a > b ? 1 : -1);
		return { unpublishedNotes, publishedNotes, changedNotes, deletedNotePaths };
	}

}

export interface PublishStatus {
	unpublished: Array<TFile>;
	published: Array<TFile>;
	changedNote: Array<TFile>;
	deletedNotePath: Array<TFile>;
}

export interface IStatusManager {
	getPublishStatus(): Promise<{ publishedNotes: Array<TFile>; changedNotes: Array<TFile>; unpublishedNotes: Array<TFile>; deletedNotePaths: Array<string> }>;
	getDeletedNotePaths(): Promise<Array<string>>;
}
