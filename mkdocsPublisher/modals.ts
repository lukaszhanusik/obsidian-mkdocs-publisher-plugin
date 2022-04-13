import {mkdocsPublicationSettings} from "./settings";
import { App, ButtonComponent, Modal} from "obsidian";
import MkdocsPublish from './utils/publication';
import {IStatusManager} from "./utils/statusManager";
import mkdocsPublication from "./main";

export class PublishModal {
	modal: Modal;
	settings: mkdocsPublicationSettings;
	statusManager: IStatusManager;
	publisher: MkdocsPublish;

	publisherContainer: HTMLElement;
	changedContainer: HTMLElement;
	deletedContainer: HTMLElement;
	unpublishedContainer: HTMLElement;

	progressContainer : HTMLElement;

	constructor(app: App, statusManager: IStatusManager, publisher: mkdocsPublication, settings: mkdocsPublicationSettings) {
		this.modal = new Modal(app);
		this.settings = settings;
		this.statusManager = statusManager;
		this.initialize();
	}

	 createCollapsable(title: string, buttonText: string, buttonCallback:()=>Promise<void>): HTMLElement {
        const headerContainer = this.modal.contentEl.createEl("div", {attr: {style: "display: flex; justify-content: space-between; margin-bottom: 10px; align-items:center"}});
        const toggleHeader = headerContainer.createEl("h3", { text: `➕️ ${title}`, attr: { class: "collapsable collapsed" } });
        if(buttonText && buttonCallback){

        const button = new ButtonComponent(headerContainer)
            .setButtonText(buttonText)
            .onClick(async () => {
                button.setDisabled(true);
                await buttonCallback();
                button.setDisabled(false);
            });
        }

        const toggledList = this.modal.contentEl.createEl("ul");
        toggledList.hide();

        headerContainer.onClickEvent(() => {
            if (toggledList.isShown()) {
                toggleHeader.textContent = `➕️ ${title}`;
                toggledList.hide();
                toggleHeader.removeClass("open");
                toggleHeader.addClass("collapsed");
            } else {
                toggleHeader.textContent = `➖ ${title}`;
                toggledList.show()
                toggleHeader.removeClass("collapsed");
                toggleHeader.addClass("open");
            }
        });
        return toggledList;
    }
	async initialize() {
        this.modal.titleEl.innerText = "📖 Mkdocs Publisher";

        this.modal.contentEl.addClass("mkdocs-status-view");
        this.modal.contentEl.createEl("h2", { text: "Publication Status" });

        this.progressContainer = this.modal.contentEl.createEl("div", { attr: {style: "height: 30px;" } });

        this.publisherContainer = this.createCollapsable("Published", null, null);
        this.changedContainer = this.createCollapsable("Changed", "Update changed files", async () => {
            const publishStatus = await this.statusManager.getPublishStatus();
            const changed = publishStatus.changedNote;
            let counter = 0;
            for(const note of changed){
                this.progressContainer.innerText = `⌛Publishing changed notes: ${++counter}/${changed.length}`;
                await this.publisher.publish(note);
            }

            const publishedText = `✅ Published all changed notes: ${counter}/${changed.length}`;
            this.progressContainer.innerText = publishedText;
            setTimeout(() => {
                if(this.progressContainer.innerText === publishedText){
                    this.progressContainer.innerText = "";
                }
            }, 5000)

            await this.refreshView();
        });
		this.unpublishedContainer = this.createCollapsable("Unpublished", "Publish unpublished notes", async () => {
            const publishStatus = await this.statusManager.getPublishStatus();
            const unpublished = publishStatus.unpublishedNotes;
            let counter = 0;
            for(const note of unpublished){
                this.progressContainer.innerText = `⌛Publishing unpublished notes: ${++counter}/${unpublished.length}`;
                await this.publisher.publish(note);
            }
            const publishDoneText = `✅ Published all unpublished notes: ${counter}/${unpublished.length}`;
            this.progressContainer.innerText = publishDoneText;
            setTimeout(() => {
                if(this.progressContainer.innerText === publishDoneText){
                    this.progressContainer.innerText = "";
                }
            }, 5000)
            await this.refreshView();
        });


        this.modal.onOpen = () => this.refreshView();
        this.modal.onClose = () => this.clearView();
    }
	async clearView() {
        while (this.publisherContainer.lastElementChild) {
            this.publisherContainer.removeChild(this.publisherContainer.lastElementChild);
        }
        while (this.changedContainer.lastElementChild) {
            this.changedContainer.removeChild(this.changedContainer.lastElementChild);
        }
        while (this.deletedContainer.lastElementChild) {
            this.deletedContainer.removeChild(this.deletedContainer.lastElementChild);
        }
        while (this.unpublishedContainer.lastElementChild) {
            this.unpublishedContainer.removeChild(this.unpublishedContainer.lastElementChild);
        }
    }
	 async populateWithNotes() {
        const publishStatus = await this.statusManager.getPublishStatus();
        publishStatus.publishedNotes.map(file => this.publisherContainer.createEl("li", { text: file.path }));
        publishStatus.unpublishedNotes.map(file => this.unpublishedContainer.createEl("li", { text: file.path }));
        publishStatus.changedNote.map(file => this.changedContainer.createEl("li", { text: file.path }));
        publishStatus.deletedNotePath.map(path => this.deletedContainer.createEl("li", { text: path }));
    }

    private async refreshView(){
        await this.clearView();
        await this.populateWithNotes();
    }

    open() {
        this.modal.open();
    }

}
