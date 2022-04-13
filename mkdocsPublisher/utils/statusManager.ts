import {ISiteManager} from "./siteManager";
import {TFile} from "obsidian";
import MkdocsPublish from "./publication";
import {generateBlobHash} from "./utils";

export default class StatusManager implements IStatusManager {
	siteManager: ISiteManager;
	publication: MkdocsPublish;
	constructor(siteManager: ISiteManager, publication: MkdocsPublish) {
		this.siteManager = siteManager;
		this.publication = publication;
	}


}

export interface PublishStatus {
	unpublished: Array<TFile>;
	published: Array<TFile>;
	changedNote: Array<TFile>;
	deletedNotePath: Array<TFile>;
}

export interface IStatusManager {
	getPublishStatus(): Promise<PublishStatus>;
	getDeletedNotePaths(): Promise<Array<string>>;
}
