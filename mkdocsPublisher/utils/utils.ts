import {
	App,
	TFile
} from 'obsidian';
import { Base64 } from "js-base64";
import sha1 from "crypto-js/sha1";
import {mkdocsPublicationSettings} from "../settings";

function arrayBufferToBase64(buffer: ArrayBuffer) {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return Base64.btoa(binary);
}

function getCategory(app: App, file: TFile, settings: mkdocsPublicationSettings) {
	const fileCache = app.metadataCache.getFileCache(file);
	const meta = fileCache?.frontmatter;
	let category = settings.categoryDefault;
	const categoryKey = settings.categoryKey
	if (category == '/') {
		category = '';
	}
	if (meta == undefined || meta[categoryKey] == undefined) {
		return category;
	}
	if (!meta[categoryKey]) {
		return 'hidden'
	}
	category = meta[categoryKey];
	if (!category.endsWith('/') && category != '') {
		category += '/';
	}
	return category

}

function disablePublish(app: App, settings: mkdocsPublicationSettings, file:TFile) {
	const fileCache = app.metadataCache.getFileCache(file);
	const meta = fileCache?.frontmatter;
	const folder_list = settings.ExcludedFolder.split(',');
	if (meta === undefined) {
		return false;
	} else if (folder_list.length > 0) {
		for (let i = 0; i < folder_list.length; i++) {
			if (file.path.contains(folder_list[i].trim())) {
				return false;
			}
		}
	}
	return meta[settings.shareKey];
}

function generateBlobHash(content: string){
	const byteLength = (new TextEncoder().encode(content)).byteLength;
	const header = `blob ${byteLength}\0`;
	const gitBlob = header + content;

	return sha1(gitBlob).toString();
}

export { arrayBufferToBase64, disablePublish, generateBlobHash, getCategory};
