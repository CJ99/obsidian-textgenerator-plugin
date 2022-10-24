import {App,addIcon, Notice, Plugin, PluginSettingTab, Setting, request, MarkdownView, Editor, parseFrontMatterAliases} from 'obsidian';
import {ExampleModal} from './model';
import {TextGeneratorSettings} from './types';
import {GENERATE_ICON,GENERATE_META_ICON} from './constants';
import TextGeneratorSettingTab from './ui/settingsPage';
import {SetMaxTokens} from './ui/setMaxTokens';
import TextGenerator from './textGenerator';

const DEFAULT_SETTINGS: TextGeneratorSettings = {
	api_key: "",
	engine: "text-davinci-002",
	max_tokens: 160,
	temperature: 0.7,
	frequency_penalty: 0.5,
	prompt: "",
	showStatusBar: true,
	promptsPath:"templates/prompts"
}

export default class TextGeneratorPlugin extends Plugin {
	settings: TextGeneratorSettings;
	statusBarItemEl: any;
	textGenerator:TextGenerator;
	
    updateStatusBar(text: string) {
        let text2 = "";
        if (text.length > 0) {
            text2 = `: ${text}`;
        }
    
        if (this.settings.showStatusBar) {
            this.statusBarItemEl.setText(`Text Generator(${this.settings.max_tokens})${text2}`);
        }
    }

	getActiveView() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView !== null) {
            return activeView
        } else {
            new Notice("The file type should be Markdown!");
            return null
        }
    }

	async onload() {
		addIcon("GENERATE_ICON",GENERATE_ICON);
		addIcon("GENERATE_META_ICON",GENERATE_META_ICON);

		this.textGenerator=new TextGenerator(this.app,this);
		
		await this.loadSettings();
		
		this.statusBarItemEl = this.addStatusBarItem();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('GENERATE_ICON', 'Generate Text!', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const activeFile = this.app.workspace.getActiveFile();
			this.updateStatusBar(`processing... `);const notice = new Notice('✏️Processing...',30000);
			const activeView = this.getActiveView();
			if (activeView !== null) {
			const editor = activeView.editor;
			try {
				await this.textGenerator.generateInEditor(this.settings,false,editor);
				this.updateStatusBar(``);
			} catch (error) {
				new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
				console.error(error);
				this.updateStatusBar(`Error: Check Console`);
				setTimeout(()=>this.updateStatusBar(``),3000);
			}
			}


		});

		this.addCommand({
			id: 'generate-text',
			name: 'Generate Text!',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Ctrl"], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					await this.textGenerator.generateInEditor(this.settings,false,editor);
					this.updateStatusBar(``);
					notice.hide();
				} catch (error) {
					notice.hide();
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});
		
		
		this.addCommand({
			id: 'generate-text-with-metadata',
			name: 'Generate Text (use Metadata))!',
			icon: 'GENERATE_META_ICON',
			hotkeys: [{ modifiers: ["Ctrl",'Alt'], key: "j" }],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					await this.textGenerator.generateInEditor(this.settings,true,editor);
					this.updateStatusBar(``);
					notice.hide();
				} catch (error) {
					notice.hide();
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}
			}
		});

		this.addCommand({
			id: 'insert-generated-text-From-template',
			name: 'Generate and Insert Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Ctrl",'Shift'], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.generateFromTemplate(this.settings, result.path, true, editor);
						this.updateStatusBar(``);
						notice.hide();
					  },'Generate and Insert Template').open();
				} catch (error) {
					notice.hide();
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}
			}
		});


		this.addCommand({
			id: 'create-generated-text-From-template',
			name: 'Generate and Create a New File From Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Ctrl","Meta"], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.generateFromTemplate(this.settings, result.path, true, editor,false);
						this.updateStatusBar(``);
						notice.hide();
					  },'Generate and Create a New File From Template').open();
					
				} catch (error) {
					notice.hide();
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}
			}
		});


		this.addCommand({
			id: 'create-text-From-template',
			name: 'Create a New File From Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ["Ctrl",'Shift','Alt'], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.createToFile(this.settings, result.path, true, editor);
						this.updateStatusBar(``);
						notice.hide();
					  },'Create a New File From Template').open();
				} catch (error) {
					notice.hide();
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});

		this.addCommand({
			id: 'insert-text-From-template',
			name: 'Insert Template',
			icon: 'GENERATE_ICON',
			hotkeys: [{ modifiers: ['Shift','Alt'], key: "j"}],
			editorCallback: async (editor: Editor) => {
				this.updateStatusBar(`processing... `);
				const notice = new Notice('✏️Processing...',30000);
				try {
					new ExampleModal(this.app, this,async (result) => {
						await this.textGenerator.createToFile(this.settings, result.path, true, editor,true);
						this.updateStatusBar(``);
						notice.hide();
					  },'Insert Template').open();
				} catch (error) {
					notice.hide();
					new Notice("Text Generator Plugin: Error check console CTRL+SHIFT+I");
					console.error(error);
					this.updateStatusBar(`Error check console`);
					setTimeout(()=>this.updateStatusBar(``),3000);
				}	
			}
		});



		this.addCommand({
			id: 'set_max_tokens',
			name: 'Set max_tokens',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "1" }],
			editorCallback: async () => {
				new SetMaxTokens(this.app,this.settings.max_tokens.toString(),async (result: string) => {
					this.settings.max_tokens = parseInt(result);
					await this.saveSettings();
				    this.updateStatusBar('');
					new Notice(`Set Max Tokens to ${result}!`);
				  }).open();

			}
		});

		this.addCommand({
			id: 'decrease-max_tokens',
			name: 'decrease max_tokens by 10',
			hotkeys: [{ modifiers: ["Ctrl","Alt"], key: "2" }],
			editorCallback: async () => {
				this.settings.max_tokens -= 10;
				await this.saveSettings();
				this.updateStatusBar('');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TextGeneratorSettingTab(this.app, this));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}