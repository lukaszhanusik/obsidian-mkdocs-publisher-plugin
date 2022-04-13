// Credits : https://github.com/oleeskild/obsidian-digital-garden

import {mkdocsPublicationSettings} from "../settings";
import {MetadataCache, TFile} from "obsidian";
import { Octokit } from "@octokit/core";

export interface ISiteManager {
    getNoteHashes(): Promise<{ [key: string]: string }>;
}

export default class SiteManager implements  ISiteManager {
	settings: mkdocsPublicationSettings;
	metadataCache: MetadataCache;

	constructor(settings: mkdocsPublicationSettings, metadataCache: MetadataCache) {
		this.settings = settings;
		this.metadataCache = metadataCache;
	}

	async getNoteHashes(): Promise<{ [key: string]: string }> {
		const octokit = new Octokit({auth: this.settings.GhToken});
		const response = await octokit.request(`GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=${Math.ceil(Math.random() * 1000)}`,{
			owner:this.settings.githubName,
			repo:this.settings.githubRepo,
			tree_sha:'main'
		});
		const files = response.data.tree;
		const notes: Array<{ path: string, sha: string }> = files.filter(
            (x: { path: string; type: string; }) => x.path.startsWith("docs/") && x.type === "blob");
        const hashes: { [key: string]: string } = {};
        for (const note of notes) {
            const vaultPath = note.path.replace("docs/", "");
			// this will keep category/note_name.md
            hashes[vaultPath] = note.sha;
        }
        return hashes;
	}
}
