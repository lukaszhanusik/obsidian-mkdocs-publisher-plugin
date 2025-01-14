// Credit : https://github.com/oleeskild/obsidian-digital-garden @oleeskild

import {MetadataCache, Notice, TFile, Vault, arrayBufferToBase64} from 'obsidian'
import {MkdocsPublicationSettings} from '../settings'
import {Octokit} from '@octokit/core'
import {Base64} from 'js-base64'

export default class MkdocsPublish {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: MkdocsPublicationSettings;

	constructor(vault: Vault, metadataCache: MetadataCache, settings: MkdocsPublicationSettings) {
		this.vault = vault
		this.metadataCache = metadataCache
		this.settings = settings
	}

	async getSharedFiles () {
		const files = this.vault.getMarkdownFiles()
		const shared_File = []
		const sharedkey = this.settings.shareKey
		for (const file of files) {
			try {
				const frontMatter = this.metadataCache.getCache(file.path).frontmatter
				if (frontMatter && frontMatter[sharedkey] === true) {
					shared_File.push(file)
				}
			} catch {
				// ignore
			}
		}
		return shared_File
	}

	getLinkedImage (file: TFile) {
		const embed_files = this.metadataCache.getCache(file.path).embeds
		const image_list = []
		if (embed_files != undefined) {
			for (const embed_file of embed_files) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(embed_file.link, file.path)
					const imgExt = imageLink.extension
					if (imgExt.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
						image_list.push(imageLink)
					}
				} catch (e) {
					console.log('Error with this image : ' + embed_file)
				}
			}
			return image_list
		}
		return []
	}

	checkExcludedFolder (file: TFile) {
		const excludedFolder = this.settings.ExcludedFolder.split(',').filter(x=>x!='')
		if (excludedFolder.length > 0) {
			for (let i = 0; i < excludedFolder.length; i++) {
				if (file.path.contains(excludedFolder[i].trim())) {
					return true
				}
			}
		}
		return false
	}

	async publish (file: TFile, one_file = false) {
		const sharedKey = this.settings.shareKey
		const frontmatter = this.metadataCache.getCache(file.path).frontmatter
		if (!frontmatter || !frontmatter[sharedKey] || this.checkExcludedFolder(file) || file.extension !== 'md') {
			return false
		}
		try {
			const text = await this.vault.cachedRead(file)
			const linkedImage = this.getLinkedImage(file)
			await this.uploadText(file.path, text, file.name)
			if (linkedImage.length > 0) {
				for (const image of linkedImage) {
					await this.uploadImage(image)
				}
			}
			if (one_file) {
				await this.uploadFolder()
			}
			return true
		} catch (e) {
			console.error(e)
			return false
		}
	}

	async uploadFolder () {
		const folder = await this.getSharedFiles()
		if (folder.length > 0) {
			const publishedFiles = folder.map(file => file.name)
			const publishedFilesText = JSON.stringify(publishedFiles).toString()
			await this.uploadText('vault_published.json', publishedFilesText, 'vault_published.json')
		}
	}

	async upload (filePath: string, content: string, title: string) {
		if (!this.settings.githubRepo) {
			new Notice('Config error : You need to define a github repo in the plugin settings')
			throw {}
		}
		if (!this.settings.githubName) {
			new Notice('Config error : You need to define your github username in the plugin settings')
			throw {}
		}
		const octokit = new Octokit({
			auth: this.settings.GhToken
		})
		const path = `source/${title}`

		const payload = {
			owner: this.settings.githubName,
			repo: this.settings.githubRepo,
			path,
			message: `Adding ${title}`,
			content: content,
			sha: ''
		}
		try {
			const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
				owner: this.settings.githubName,
				repo: this.settings.githubRepo,
				path
			})
			// @ts-ignore
			if (response.status === 200 && response.data.type === 'file') {
				// @ts-ignore
				payload.sha = response.data.sha
			}
		} catch {
			console.log('The 404 error is normal ! It means that the file does not exist yet. Don\'t worry ❤️.')
		}
		payload.message = `Update note ${title}`
		await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', payload)
	}

	async uploadImage (imageFile:TFile) {
		const imageBin = await this.vault.readBinary(imageFile)
		const image64 = arrayBufferToBase64(imageBin)
		await this.upload(imageFile.path, image64, imageFile.name)
	}

	async uploadText (filePath: string, text: string, title = '') {
		try {
			const contentBase64 = Base64.encode(text).toString()
			await this.upload(filePath, contentBase64, title)
		} catch (e) {
			console.error(e)
		}
	}

	async workflowGestion () {
		const octokit = new Octokit({
			auth: this.settings.GhToken
		})
		await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
			owner: this.settings.githubName,
			repo: this.settings.githubRepo,
			workflow_id: 'ci.yml',
			ref: 'main'
		})
	}

	async updateSettings () {
		let newSettings = `index_key=${this.settings.indexFolder}
		default_blog=${this.settings.categoryDefault}
		category_key=${this.settings.categoryKey}
		`
		newSettings = newSettings.replace(/\t/gi, '').trim()
		try {
			await this.uploadText('.github-actions', newSettings, '.github-actions')
			return true
		} catch {
			return false
		}
	}
}
