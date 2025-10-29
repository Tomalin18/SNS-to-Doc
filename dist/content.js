(async function () {
	// 檢測當前平台
	const currentPlatform = detectPlatform();
	
	// Configuration variables (will be loaded from storage)
	let config = {
		discordWebhookUrl: "",
		discordChannels: [], // 存儲多個 Discord 頻道
		selectedChannelId: "", // 當前選中的頻道 ID
		apiProvider: "openai", // 'openai' or 'anthropic'
		openaiApiKey: "",
		anthropicApiKey: "",
		isConfigured: false,
		language: "en", // 預設語言
	};

	// 國際化系統
	let i18n = {};
	
	// 檢查擴充功能上下文是否有效
	function isExtensionContextValid() {
		try {
			return typeof chrome !== 'undefined' && 
				   chrome.storage && 
				   chrome.storage.sync &&
				   !chrome.runtime.lastError;
		} catch (error) {
			console.warn('Extension context check failed:', error);
			return false;
		}
	}
	
	// 載入語言檔案
	async function loadLanguage(lang = 'en') {
		try {
			// 使用 chrome.runtime.getURL 來取得正確的檔案路徑
			const url = chrome.runtime.getURL(`locales/${lang}.json`);
			console.log(`Attempting to load language file: ${url}`);
			const response = await fetch(url);
			console.log(`Response status: ${response.status}`);
			
			if (response.ok) {
				i18n = await response.json();
				console.log(`Language loaded successfully: ${lang}`);
			} else {
				console.warn(`Failed to load language file: ${lang} (${response.status}), falling back to English`);
				// 如果載入失敗，使用英文作為備用
				const fallbackUrl = chrome.runtime.getURL('locales/en.json');
				console.log(`Attempting to load fallback language file: ${fallbackUrl}`);
				const fallbackResponse = await fetch(fallbackUrl);
				if (fallbackResponse.ok) {
					i18n = await fallbackResponse.json();
					console.log('Fallback language loaded successfully');
				} else {
					throw new Error(`Failed to load fallback language file: ${fallbackResponse.status}`);
				}
			}
		} catch (error) {
			console.error('Failed to load language file:', error);
			// 使用內建的英文翻譯作為最後備用
			i18n = {
				ui: {
					selectChannel: "Select channel...",
					defaultChannel: "Default Channel (Use Webhook URL)",
					addNewChannel: "+ Add new channel...",
					addDiscordChannel: "Add Discord Channel",
					channelName: "Channel Name",
					channelNamePlaceholder: "e.g., Tech Discussion, News Sharing...",
					webhookUrl: "Webhook URL",
					webhookUrlPlaceholder: "https://discord.com/api/webhooks/...",
					webhookHint: "Create a Webhook in your Discord server and copy the URL here",
					cancel: "Cancel",
					addChannel: "Add Channel",
					channelAddedSuccess: "Channel \"{name}\" has been successfully added!",
					enterChannelName: "Please enter channel name",
					enterWebhookUrl: "Please enter Webhook URL",
					enterValidWebhookUrl: "Please enter a valid Discord Webhook URL",
					customTweetProcessing: "Custom Tweet Processing",
					customPrompt: "Custom Prompt",
					customPromptPlaceholder: "Enter your instructions for how AI should process this tweet...\n\nExamples:\n- Rewrite this tweet into a professional technical article summary\n- Extract key information and organize into bullet points\n- Translate to Traditional Chinese and add personal comments",
					selectDiscordChannel: "Select Discord Channel",
					processAndSend: "Process and Send to Discord",
					enterCustomPrompt: "Please enter custom prompt",
					selectDiscordChannelError: "Please select Discord channel",
					sendToDiscord: "Send to Discord",
					socialToDiscordSettings: "Share to Discord Settings",
					discordWebhookUrl: "Discord Webhook URL",
					discordWebhookHint: "Create a webhook in your Discord server (Server Settings → Integrations → Webhooks)",
					aiProcessingService: "AI Processing Service",
					openaiGpt4o: "OpenAI (GPT-4o)",
					openaiDescription: "Supports text and image analysis",
					anthropicClaude: "Anthropic (Claude)",
					anthropicDescription: "Supports text analysis",
					noAi: "No AI",
					noAiDescription: "Simple truncation of long posts",
					aiProcessingMethod: "AI 處理方式",
					noAiOption: "不使用 AI - 只分享連結",
					useOpenAI: "使用 OpenAI (GPT-4o)",
					useAnthropic: "使用 Anthropic (Claude)",
					settings: "設定",
					openaiApiKey: "OpenAI API Key",
					openaiApiKeyPlaceholder: "sk-...",
					openaiApiKeyHint: "Get API key from <a href=\"https://platform.openai.com/account/api-keys\" target=\"_blank\" class=\"discord-link\">OpenAI website</a>",
					anthropicApiKey: "Anthropic API Key",
					anthropicApiKeyPlaceholder: "sk-ant-...",
					anthropicApiKeyHint: "Get API key from <a href=\"https://www.claude.com/platform/api\" target=\"_blank\" class=\"discord-link\">Claude Developer Platform</a>",
					aboutApiKeys: "About API Keys",
					apiKeysDescription: "Your API keys are only stored in your browser and are not sent anywhere else. Processing requests are sent directly from your browser to the API provider.",
					saveSettings: "Save Settings",
					settingsSavedSuccess: "Settings saved successfully!",
					apiKeyWarning: "Warning: You selected an AI provider but did not enter an API key. Without a key, the summary feature will not work properly.",
					processingError: "Error processing post:",
					discordWebhookError: "Discord webhook error"
				},
				ai: {
					tweetContent: "Tweet content",
					postContent: "Post content",
					summarizeTweet: "Please summarize this tweet concisely in Traditional Chinese, keep it under 200 words",
					summarizeTweetEn: "Summarize this tweet concisely. Keep the summary under 200 characters if possible.",
					summarizeTweetWithImages: "Please summarize this tweet and its images concisely in Traditional Chinese, keep it under 200 words",
					summarizeTweetWithImagesEn: "Summarize this tweet and its images concisely. Keep the summary under 200 characters if possible."
				},
				platform: {
					twitter: "Tweet",
					post: "Post"
				}
			};
		}
	}

	// 翻譯函數
	function t(key, params = {}) {
		const keys = key.split('.');
		let value = i18n;
		
		for (const k of keys) {
			value = value?.[k];
		}
		
		if (typeof value !== 'string') {
			console.warn(`Translation missing for key: ${key}`);
			return key;
		}
		
		// 替換參數
		return value.replace(/\{(\w+)\}/g, (match, param) => params[param] || match);
	}
	
	// 平台檢測函數
	function detectPlatform() {
		const hostname = window.location.hostname;
		if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
			return 'twitter';
		}
		return 'unknown';
	}

	// Load configuration
	await loadConfig();
	
	// Load language
	await loadLanguage(config.language);

	// Function to load config from storage
	async function loadConfig() {
		return new Promise((resolve) => {
			try {
				// 檢查擴充功能上下文是否有效
				if (isExtensionContextValid()) {
					chrome.storage.sync.get(
						[
							"discordWebhookUrl",
							"discordChannels",
							"selectedChannelId",
							"apiProvider",
							"openaiApiKey",
							"anthropicApiKey",
							"isConfigured",
							"language",
						],
						(result) => {
							if (result.discordWebhookUrl)
								config.discordWebhookUrl = result.discordWebhookUrl;
							if (result.discordChannels)
								config.discordChannels = result.discordChannels;
							if (result.selectedChannelId)
								config.selectedChannelId = result.selectedChannelId;
							if (result.apiProvider) config.apiProvider = result.apiProvider;
							if (result.openaiApiKey) config.openaiApiKey = result.openaiApiKey;
							if (result.anthropicApiKey)
								config.anthropicApiKey = result.anthropicApiKey;
							if (result.language) config.language = result.language;
							config.isConfigured = result.isConfigured || false;
							console.log('Configuration loaded from chrome.storage');
							resolve();
						}
					);
				} else {
					console.warn('Chrome storage API not available, trying localStorage fallback');
					// 使用 localStorage 作為備用
					const savedConfig = localStorage.getItem('share-to-discord-config');
					if (savedConfig) {
						try {
							const parsedConfig = JSON.parse(savedConfig);
							config.discordWebhookUrl = parsedConfig.discordWebhookUrl || "";
							config.discordChannels = parsedConfig.discordChannels || [];
							config.selectedChannelId = parsedConfig.selectedChannelId || "";
							config.apiProvider = parsedConfig.apiProvider || "openai";
							config.openaiApiKey = parsedConfig.openaiApiKey || "";
							config.anthropicApiKey = parsedConfig.anthropicApiKey || "";
							config.isConfigured = parsedConfig.isConfigured || false;
							config.language = parsedConfig.language || "en";
							console.log('Configuration loaded from localStorage');
						} catch (parseError) {
							console.error('Failed to parse localStorage config:', parseError);
						}
					}
					resolve();
				}
			} catch (error) {
				console.error('Failed to load configuration:', error);
				// 嘗試從 localStorage 載入
				try {
					const savedConfig = localStorage.getItem('share-to-discord-config');
					if (savedConfig) {
						const parsedConfig = JSON.parse(savedConfig);
						config.discordWebhookUrl = parsedConfig.discordWebhookUrl || "";
						config.discordChannels = parsedConfig.discordChannels || [];
						config.selectedChannelId = parsedConfig.selectedChannelId || "";
						config.apiProvider = parsedConfig.apiProvider || "openai";
						config.openaiApiKey = parsedConfig.openaiApiKey || "";
						config.anthropicApiKey = parsedConfig.anthropicApiKey || "";
						config.isConfigured = parsedConfig.isConfigured || false;
						config.language = parsedConfig.language || "en";
						console.log('Configuration loaded from localStorage fallback');
					}
				} catch (localStorageError) {
					console.error('Failed to load from localStorage:', localStorageError);
				}
				resolve();
			}
		});
	}

	// Function to load Discord channels into select dropdown
	function loadDiscordChannels() {
		const channelSelect = document.getElementById('discord-channel-select');
		if (!channelSelect) return;

		// Clear existing options except the first one
		channelSelect.innerHTML = `<option value="">${t('ui.selectChannel')}</option>`;

		// Add default webhook option
		const defaultOption = document.createElement('option');
		defaultOption.value = 'default';
		defaultOption.textContent = t('ui.defaultChannel');
		if (!config.selectedChannelId || config.selectedChannelId === 'default') {
			defaultOption.selected = true;
		}
		channelSelect.appendChild(defaultOption);

		// Add stored channels
		if (config.discordChannels && config.discordChannels.length > 0) {
			config.discordChannels.forEach(channel => {
				const option = document.createElement('option');
				option.value = channel.id;
				option.textContent = `# ${channel.name}`;
				if (channel.id === config.selectedChannelId) {
					option.selected = true;
				}
				channelSelect.appendChild(option);
			});
		}

		// Add "Add new channel" option
		const addOption = document.createElement('option');
		addOption.value = 'add-new';
		addOption.textContent = t('ui.addNewChannel');
		channelSelect.appendChild(addOption);

		// Add event listener for channel selection
		channelSelect.addEventListener('change', (e) => {
			if (e.target.value === 'add-new') {
				showAddChannelDialog();
			}
		});
	}

	// Function to show add channel dialog
	function showAddChannelDialog() {
		// Remove existing modal if any
		const existingModal = document.getElementById("add-channel-modal");
		if (existingModal) {
			existingModal.remove();
		}

		// Create modal container
		const modalContainer = document.createElement("div");
		modalContainer.id = "add-channel-modal";
		modalContainer.className = "discord-modal-container";

		modalContainer.innerHTML = `
      <div class="discord-modal">
        <div class="discord-modal-header">
          <div class="discord-modal-title">
            <svg class="discord-modal-icon" width="20" height="20" viewBox="0 0 71 55" fill="currentColor">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"/>
            </svg>
            <h2>${t('ui.addDiscordChannel')}</h2>
          </div>
          <button type="button" class="discord-modal-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>
        </div>
        <div class="discord-modal-body">
          <form id="add-channel-form">
            <div class="discord-input-block">
              <label class="discord-input-label">${t('ui.channelName')}</label>
              <div class="discord-input-wrapper">
                <input type="text" id="channel-name" name="channel-name" class="discord-input" placeholder="${t('ui.channelNamePlaceholder')}" />
              </div>
            </div>
            
            <div class="discord-input-block">
              <label class="discord-input-label">${t('ui.webhookUrl')}</label>
              <div class="discord-input-wrapper">
                <input type="url" id="channel-webhook" name="channel-webhook" class="discord-input" placeholder="${t('ui.webhookUrlPlaceholder')}" />
              </div>
              <div class="discord-input-hint">
                ${t('ui.webhookHint')}
              </div>
            </div>
            
            <div class="discord-form-actions">
              <button type="button" class="discord-btn discord-btn-secondary" id="add-channel-cancel">${t('ui.cancel')}</button>
              <button type="submit" class="discord-btn discord-btn-primary">${t('ui.addChannel')}</button>
            </div>
          </form>
        </div>
      </div>
    `;

		// Add to page
		document.body.appendChild(modalContainer);

		// Close modal on backdrop click
		modalContainer.addEventListener("click", (e) => {
			if (e.target === modalContainer) {
				modalContainer.remove();
			}
		});

		// Close modal on X button click
		document
			.querySelector(".discord-modal-close")
			.addEventListener("click", () => {
				modalContainer.remove();
			});

		// Close modal on Cancel button click
		document
			.getElementById("add-channel-cancel")
			.addEventListener("click", () => {
				modalContainer.remove();
			});

		// Handle form submission
		document
			.getElementById("add-channel-form")
			.addEventListener("submit", async (e) => {
				e.preventDefault();

				const channelName = document.getElementById("channel-name").value.trim();
				const webhookUrl = document.getElementById("channel-webhook").value.trim();

				if (!channelName) {
					alert(t('ui.enterChannelName'));
					return;
				}

				if (!webhookUrl) {
					alert(t('ui.enterWebhookUrl'));
					return;
				}

				// Validate webhook URL
				if (!webhookUrl.includes('discord.com/api/webhooks/')) {
					alert(t('ui.enterValidWebhookUrl'));
					return;
				}

				// Add channel to config
				const newChannel = {
					id: Date.now().toString(),
					name: channelName,
					webhookUrl: webhookUrl
				};

				if (!config.discordChannels) {
					config.discordChannels = [];
				}
				config.discordChannels.push(newChannel);
				config.selectedChannelId = newChannel.id;

				// Save config
				saveConfig();

				// Close modal
				modalContainer.remove();

				// Reload channels in the original dialog
				const originalModal = document.getElementById("custom-prompt-modal");
				if (originalModal) {
					loadDiscordChannels();
					// Select the newly added channel
					const channelSelect = document.getElementById('discord-channel-select');
					if (channelSelect) {
						channelSelect.value = newChannel.id;
					}
				}

				alert(t('ui.channelAddedSuccess', { name: channelName }));
			});
	}

	// Function to save config to storage
	function saveConfig() {
		try {
			// 檢查擴充功能上下文是否有效
			if (isExtensionContextValid()) {
				chrome.storage.sync.set({
					discordWebhookUrl: config.discordWebhookUrl,
					discordChannels: config.discordChannels,
					selectedChannelId: config.selectedChannelId,
					apiProvider: config.apiProvider,
					openaiApiKey: config.openaiApiKey,
					anthropicApiKey: config.anthropicApiKey,
					isConfigured: config.isConfigured,
					language: config.language,
				});
				console.log('Configuration saved successfully');
			} else {
				console.warn('Chrome storage API not available, using localStorage fallback');
				// 使用 localStorage 作為備用
				localStorage.setItem('share-to-discord-config', JSON.stringify({
					discordWebhookUrl: config.discordWebhookUrl,
					discordChannels: config.discordChannels,
					selectedChannelId: config.selectedChannelId,
					apiProvider: config.apiProvider,
					openaiApiKey: config.openaiApiKey,
					anthropicApiKey: config.anthropicApiKey,
					isConfigured: config.isConfigured,
					language: config.language,
				}));
			}
		} catch (error) {
			console.error('Failed to save configuration:', error);
			// 使用 localStorage 作為備用
			try {
				localStorage.setItem('share-to-discord-config', JSON.stringify({
					discordWebhookUrl: config.discordWebhookUrl,
					discordChannels: config.discordChannels,
					selectedChannelId: config.selectedChannelId,
					apiProvider: config.apiProvider,
					openaiApiKey: config.openaiApiKey,
					anthropicApiKey: config.anthropicApiKey,
					isConfigured: config.isConfigured,
					language: config.language,
				}));
				console.log('Configuration saved to localStorage as fallback');
			} catch (localStorageError) {
				console.error('Failed to save to localStorage:', localStorageError);
			}
		}
	}

	// Function to inject our button into posts
	function injectButtons() {
		let posts, actionBarSelector;
		
		// 根據平台選擇不同的選擇器
		if (currentPlatform === 'twitter') {
			posts = document.querySelectorAll("article");
			actionBarSelector = '[role="group"]';
		} else {
			return;
		}

		posts.forEach((post) => {
			// 檢查是否已經添加過按鈕
			if (post.querySelector(".discord-button-container")) {
				return; // 已經有按鈕，跳過
			}

			// 尋找動作欄
			const actionBar = post.querySelector(actionBarSelector);
			if (!actionBar) {
				return;
			}

			// 創建我們的 Discord 按鈕容器
			const discordButtonContainer = document.createElement("div");
			discordButtonContainer.className = "discord-button-container";

			// 創建按鈕元素
			const discordButton = document.createElement("div");
			discordButton.className = "discord-button";
			discordButton.setAttribute("aria-label", t('ui.sendToDiscord'));
			discordButton.innerHTML = `
        <div class="discord-button-inner">
          <svg width="20" height="20" viewBox="0 0 71 55" fill="currentColor">
            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"/>
          </svg>
        </div>
      `;

			// 添加點擊事件
			discordButton.addEventListener("click", async (e) => {
				e.preventDefault();
				e.stopPropagation();

				// 檢查插件是否已配置
				if (!config.isConfigured) {
					showConfigurationModal();
					return;
				}

				// 顯示自定義 prompt 對話框
				showCustomPromptDialog(post);
			});

			// 將按鈕添加到容器
			discordButtonContainer.appendChild(discordButton);

			// 添加到動作欄
			actionBar.appendChild(discordButtonContainer);
		});
	}

	// Function to show custom prompt dialog
	function showCustomPromptDialog(post) {
		// Remove existing modal if any
		const existingModal = document.getElementById("custom-prompt-modal");
		if (existingModal) {
			existingModal.remove();
		}

		// Create modal container
		const modalContainer = document.createElement("div");
		modalContainer.id = "custom-prompt-modal";
		modalContainer.className = "discord-modal-container";

		modalContainer.innerHTML = `
      <div class="discord-modal">
        <div class="discord-modal-header">
          <div class="discord-modal-title">
            <svg class="discord-modal-icon" width="20" height="20" viewBox="0 0 71 55" fill="currentColor">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"/>
            </svg>
            <h2>${t('ui.customTweetProcessing')}</h2>
          </div>
          <div class="discord-modal-actions">
            <button type="button" class="discord-btn discord-btn-secondary discord-btn-small" id="open-settings-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.63l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.21.07-.48-.12-.63l-2.11-1.66Z"/>
              </svg>
              ${t('ui.settings')}
            </button>
            <button type="button" class="discord-modal-close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="discord-modal-body">
          <form id="custom-prompt-form">
            <div class="discord-input-block">
              <label class="discord-input-label">${t('ui.aiProcessingMethod')}</label>
              <div class="discord-input-wrapper">
                <select id="ai-provider-select" name="ai-provider-select" class="discord-input">
                  <option value="none">${t('ui.noAiOption')}</option>
                  <option value="openai">${t('ui.useOpenAI')}</option>
                  <option value="anthropic">${t('ui.useAnthropic')}</option>
                </select>
              </div>
            </div>
            
            <div id="custom-prompt-block" class="discord-input-block" style="display: none;">
              <label class="discord-input-label">${t('ui.customPrompt')}</label>
              <div class="discord-input-wrapper">
                <textarea id="custom-prompt" name="custom-prompt" class="discord-input" rows="4" placeholder="${t('ui.customPromptPlaceholder')}"></textarea>
              </div>
            </div>
            
            <div class="discord-input-block">
              <label class="discord-input-label">${t('ui.selectDiscordChannel')}</label>
              <div class="discord-input-wrapper">
                <select id="discord-channel-select" name="discord-channel-select" class="discord-input">
                  <option value="">${t('ui.selectChannel')}</option>
                </select>
              </div>
            </div>
            
            <div class="discord-form-actions">
              <button type="button" class="discord-btn discord-btn-secondary" id="custom-prompt-cancel">${t('ui.cancel')}</button>
              <button type="submit" class="discord-btn discord-btn-primary">${t('ui.processAndSend')}</button>
            </div>
          </form>
        </div>
      </div>
    `;

		// Add to page
		document.body.appendChild(modalContainer);

		// Load Discord channels into select dropdown
		loadDiscordChannels();

		// Handle settings button click
		document.getElementById("open-settings-btn").addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			
			// Close current modal
			modalContainer.remove();
			
			// Open settings modal
			showConfigurationModal();
		});

		// Handle AI provider change to show/hide custom prompt field
		document.getElementById("ai-provider-select").addEventListener("change", (e) => {
			const selectedProvider = e.target.value;
			const customPromptBlock = document.getElementById("custom-prompt-block");
			const customPromptField = document.getElementById("custom-prompt");
			
			if (selectedProvider === "none") {
				customPromptBlock.style.display = "none";
				customPromptField.required = false;
			} else {
				customPromptBlock.style.display = "block";
				customPromptField.required = true;
			}
		});

		// Close modal on backdrop click
		modalContainer.addEventListener("click", (e) => {
			if (e.target === modalContainer) {
				modalContainer.remove();
			}
		});

		// Close modal on X button click
		document
			.querySelector(".discord-modal-close")
			.addEventListener("click", () => {
				modalContainer.remove();
			});

		// Close modal on Cancel button click
		document
			.getElementById("custom-prompt-cancel")
			.addEventListener("click", () => {
				modalContainer.remove();
			});

		// Handle form submission
		document
			.getElementById("custom-prompt-form")
			.addEventListener("submit", async (e) => {
				e.preventDefault();

				const selectedProvider = document.getElementById("ai-provider-select").value;
				const customPrompt = document.getElementById("custom-prompt").value.trim();
				const selectedChannelId = document.getElementById("discord-channel-select").value;
				
				// Validate channel selection
				if (!selectedChannelId) {
					alert(t('ui.selectDiscordChannelError'));
					return;
				}

				// Validate custom prompt if AI is selected
				if (selectedProvider !== "none" && !customPrompt) {
					alert(t('ui.enterCustomPrompt'));
					return;
				}

				// Check if API key is available for selected provider
				if (selectedProvider === "openai" && !config.openaiApiKey) {
					alert("請先在設定中配置 OpenAI API 金鑰");
					return;
				}
				if (selectedProvider === "anthropic" && !config.anthropicApiKey) {
					alert("請先在設定中配置 Anthropic API 金鑰");
					return;
				}

				// Close modal
				modalContainer.remove();

				// Process the post based on selected provider
				await processPostWithProvider(post, selectedProvider, customPrompt, selectedChannelId);
			});
	}

	// Function to process post with selected provider
	async function processPostWithProvider(post, selectedProvider, customPrompt, selectedChannelId = null) {
		// Find the button to show loading state
		const discordButton = post.querySelector(".discord-button");
		if (discordButton) {
			discordButton.classList.add("loading");
		}

		try {
			// Extract post data based on platform
			let postText, author, postUrl;
			
			if (currentPlatform === 'twitter') {
				postText = post.querySelector('[data-testid="tweetText"]')?.textContent || "";
				const authorElement = post.querySelector('[data-testid="User-Name"]');
				author = authorElement?.textContent || "";
				
				// Get tweet URL
				const links = post.querySelectorAll("a");
				for (const link of links) {
					if (link.href && link.href.includes("/status/")) {
						postUrl = link.href;
						break;
					}
				}
			}

			let processedContent;
			
			if (selectedProvider === "none") {
				// No AI processing, just use the URL
				processedContent = postUrl;
			} else {
				// Use AI processing with custom prompt
				processedContent = await processWithCustomPrompt(postText, post, customPrompt, selectedProvider);
			}

			// Send to Discord
			await sendToDiscord(processedContent, postText, author, postUrl, selectedChannelId);

			// Show success state
			if (discordButton) {
				discordButton.classList.remove("loading");
				discordButton.classList.add("success");

				// Reset after 2 seconds
				setTimeout(() => {
					discordButton.classList.remove("success");
				}, 2000);
			}
		} catch (error) {
			console.error(t('ui.processingError'), error);

			if (discordButton) {
				discordButton.classList.remove("loading");
				discordButton.classList.add("error");

				// Reset after 2 seconds
				setTimeout(() => {
					discordButton.classList.remove("error");
				}, 2000);
			}
		}
	}

	// Function to process post with custom prompt
	async function processPostWithCustomPrompt(post, customPrompt, selectedChannelId = null) {
		// Find the button to show loading state
		const discordButton = post.querySelector(".discord-button");
		if (discordButton) {
			discordButton.classList.add("loading");
		}

		try {
			// Extract post data based on platform
			let postText, author, postUrl;
			
			if (currentPlatform === 'twitter') {
				postText = post.querySelector('[data-testid="tweetText"]')?.textContent || "";
				const authorElement = post.querySelector('[data-testid="User-Name"]');
				author = authorElement?.textContent || "";
				
				// Get tweet URL
				const links = post.querySelectorAll("a");
				for (const link of links) {
					if (link.href && link.href.includes("/status/")) {
						postUrl = link.href;
						break;
					}
				}
			}

			// Generate content using custom prompt
			const processedContent = await processWithCustomPrompt(postText, post, customPrompt);

			// Send to Discord
			await sendToDiscord(processedContent, postText, author, postUrl, selectedChannelId);

			// Show success state
			if (discordButton) {
				discordButton.classList.remove("loading");
				discordButton.classList.add("success");

				// Reset after 2 seconds
				setTimeout(() => {
					discordButton.classList.remove("success");
				}, 2000);
			}
		} catch (error) {
			console.error(t('ui.processingError'), error);

			if (discordButton) {
				discordButton.classList.remove("loading");
				discordButton.classList.add("error");

				// Reset after 2 seconds
				setTimeout(() => {
					discordButton.classList.remove("error");
				}, 2000);
			}
		}
	}

	// Function to process with custom prompt using selected AI provider
	async function processWithCustomPrompt(text, post, customPrompt, selectedProvider = null) {

		// Check if post contains images
		let imageUrls = [];
		if (currentPlatform === 'twitter') {
			const tweetImages = post.querySelectorAll('img[src*="pbs.twimg.com/media"]');
			imageUrls = Array.from(tweetImages)
				.map((img) => img.src)
				.filter((src) => src);
		}


		try {
			// Detect language
			const containsChinese = /[\u4e00-\u9fa5]/.test(text);
			const containsJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
			const containsKorean = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]/.test(text);
			const isAsianLanguage = containsChinese || containsJapanese || containsKorean;


			// Use selected provider or fall back to config
			const provider = selectedProvider || config.apiProvider;
			
			if (provider === "openai" && config.openaiApiKey) {
				if (imageUrls.length > 0) {
					return await processWithOpenAIVision(text, imageUrls, customPrompt, isAsianLanguage);
				} else {
					return await processWithOpenAI(text, customPrompt, isAsianLanguage);
				}
			} else if (provider === "anthropic" && config.anthropicApiKey) {
				return await processWithAnthropic(text, customPrompt, isAsianLanguage);
			} else {
				return text;
			}
		} catch (error) {
			console.error("[Social->Discord] Error processing with custom prompt:", error);
			return text;
		}
	}

	// Function to summarize tweet using selected AI provider
	async function summarizeTweet(text, tweet) {

		// 檢查推文是否包含圖片
		const tweetImages = tweet.querySelectorAll(
			'img[src*="pbs.twimg.com/media"]'
		);
		const imageUrls = Array.from(tweetImages)
			.map((img) => img.src)
			.filter((src) => src);


		try {
			// 檢測語言
			const containsChinese = /[\u4e00-\u9fa5]/.test(text);
			const containsJapanese =
				/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(
					text
				);
			const containsKorean =
				/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]/.test(
					text
				);
			const isAsianLanguage =
				containsChinese || containsJapanese || containsKorean;


			if (config.apiProvider === "openai" && config.openaiApiKey) {
				if (imageUrls.length > 0) {
					// 使用 Vision API 處理帶圖片的推文
					return await summarizeWithOpenAIVision(
						text,
						imageUrls,
						isAsianLanguage
					);
				} else {
					// 使用標準 API 處理純文字推文
					return await summarizeWithOpenAI(text, isAsianLanguage);
				}
			} else if (config.apiProvider === "anthropic" && config.anthropicApiKey) {
				// Claude 目前不支持傳入圖片，使用標準 API
				return await summarizeWithAnthropic(text, isAsianLanguage);
			} else {
				// 返回原始文本，不進行截斷
				return text;
			}
		} catch (error) {
			console.error("[Twitter->Discord] Error summarizing tweet:", error);
			return text;
		}
	}

	// Function to process with OpenAI using custom prompt
	async function processWithOpenAI(text, customPrompt, isAsianLanguage) {

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.openaiApiKey}`,
			},
			body: JSON.stringify({
				model: "gpt-4o", // 使用最新的 GPT-4o 模型
				messages: [
					{
						role: "system",
						content:
							"You are a helpful assistant that processes social media posts according to user instructions. Respond in the same language as the post unless instructed otherwise.",
					},
					{
						role: "user",
						content: `${customPrompt}\n\n${t(`platform.${currentPlatform}`)}${t('ai.tweetContent')}: "${text}"`,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("[Twitter->Discord] OpenAI API error details:", errorData);
			throw new Error(
				`OpenAI API error: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();
		return data.choices[0].message.content.trim();
	}

	// Function to process with OpenAI Vision using custom prompt
	async function processWithOpenAIVision(text, imageUrls, customPrompt, isAsianLanguage) {

		// 最多處理4張圖片以避免超出token限制
		const limitedImageUrls = imageUrls.slice(0, 4);

		// 準備消息內容，包含文本和圖片
		const messages = [
			{
				role: "system",
				content:
					"You are a helpful assistant that processes social media posts according to user instructions, including both text and image content. Respond in the same language as the post unless instructed otherwise.",
			},
			{
				role: "user",
				content: [
					{ type: "text", text: `${customPrompt}\n\n${t(`platform.${currentPlatform}`)}${t('ai.tweetContent')}: "${text}"` },
				],
			},
		];

		// 添加圖片到消息中
		for (const imageUrl of limitedImageUrls) {
			messages[1].content.push({
				type: "image_url",
				image_url: {
					url: imageUrl,
				},
			});
		}

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.openaiApiKey}`,
			},
			body: JSON.stringify({
				model: "gpt-4o", // 使用最新的 GPT-4o 模型，該模型已整合視覺能力
				messages: messages,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error(
				"[Social->Discord] OpenAI Vision API error details:",
				errorData
			);
			throw new Error(
				`OpenAI Vision API error: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();
		return data.choices[0].message.content.trim();
	}

	// Function to process with Anthropic using custom prompt
	async function processWithAnthropic(text, customPrompt, isAsianLanguage) {

		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": config.anthropicApiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: "claude-3-7-sonnet-20250219", // 使用最新的 Claude 3.7 Sonnet 模型
				messages: [
					{
						role: "user",
						content: `${customPrompt}\n\n${t(`platform.${currentPlatform}`)}${t('ai.tweetContent')}: "${text}"`,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				"[Social->Discord] Anthropic API error details:",
				errorText
			);
			throw new Error(
				`Anthropic API error: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();
		return data.content[0].text;
	}

	// 添加 OpenAI Vision API 支持
	async function summarizeWithOpenAIVision(text, imageUrls, isAsianLanguage) {
		const promptLanguage = isAsianLanguage
			? t('ai.summarizeTweetWithImages')
			: t('ai.summarizeTweetWithImagesEn');


		// 最多處理4張圖片以避免超出token限制
		const limitedImageUrls = imageUrls.slice(0, 4);

		// 準備消息內容，包含文本和圖片
		const messages = [
			{
				role: "system",
				content:
					"You are a helpful assistant that summarizes tweets concisely, including both text and image content. Respond in the same language as the tweet.",
			},
			{
				role: "user",
				content: [
					{ type: "text", text: `${promptLanguage}\n\n${t('platform.twitter')}${t('ai.tweetContent')}: "${text}"` },
				],
			},
		];

		// 添加圖片到消息中
		for (const imageUrl of limitedImageUrls) {
			messages[1].content.push({
				type: "image_url",
				image_url: {
					url: imageUrl,
				},
			});
		}

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.openaiApiKey}`,
			},
			body: JSON.stringify({
				model: "gpt-4o", // 更新為最新的 GPT-4o 模型，該模型已整合視覺能力
				messages: messages,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error(
				"[Twitter->Discord] OpenAI Vision API error details:",
				errorData
			);
			throw new Error(
				`OpenAI Vision API error: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();
		return data.choices[0].message.content.trim();
	}

	// Function to summarize using Anthropic
	async function summarizeWithAnthropic(text, isAsianLanguage) {
		const promptLanguage = isAsianLanguage
			? t('ai.summarizeTweet')
			: t('ai.summarizeTweetEn');


		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": config.anthropicApiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: "claude-3-7-sonnet-20250219", // 使用最新的 Claude 3.7 Sonnet 模型
				messages: [
					{
						role: "user",
						content: `${promptLanguage}\n\n"${text}"`,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				"[Twitter->Discord] Anthropic API error details:",
				errorText
			);
			throw new Error(
				`Anthropic API error: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();
		return data.content[0].text;
	}

	// Function to send to Discord
	async function sendToDiscord(processedContent, originalText, author, url, channelId = null) {

		let content;

		// If processedContent is just a URL (no AI processing), use it directly
		if (processedContent === url) {
			content = url;
		} else {
			// AI processed content
			content = `${processedContent}\n\n${url}`;
		}

		const payload = {
			content: content,
		};


		// 根據頻道 ID 選擇正確的 webhook URL
		let webhookUrl = config.discordWebhookUrl;
		if (channelId && channelId !== 'default' && config.discordChannels) {
			const selectedChannel = config.discordChannels.find(ch => ch.id === channelId);
			if (selectedChannel && selectedChannel.webhookUrl) {
				webhookUrl = selectedChannel.webhookUrl;
			}
		}


		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("[Twitter->Discord] Discord webhook error:", errorText);
			throw new Error("Discord webhook error");
		}

		return true;
	}

	// Function to show configuration modal
	function showConfigurationModal() {
		// Remove existing modal if any
		const existingModal = document.getElementById("discord-config-modal");
		if (existingModal) {
			existingModal.remove();
		}

		// Create modal container
		const modalContainer = document.createElement("div");
		modalContainer.id = "discord-config-modal";
		modalContainer.className = "discord-modal-container";

		modalContainer.innerHTML = `
      <div class="discord-modal">
        <div class="discord-modal-header">
          <div class="discord-modal-title">
            <svg class="discord-modal-icon" width="20" height="20" viewBox="0 0 71 55" fill="currentColor">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"/>
            </svg>
            <h2>${t('ui.socialToDiscordSettings')}</h2>
          </div>
          <button type="button" class="discord-modal-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>
        </div>
        <div class="discord-modal-body">
          <form id="discord-config-form">
            <div class="discord-input-block">
              <label class="discord-input-label">${t('ui.discordWebhookUrl')}</label>
              <div class="discord-input-wrapper">
                <input type="text" id="discord-webhook-url" name="discord-webhook-url" class="discord-input" value="${
									config.discordWebhookUrl
								}" placeholder="https://discord.com/api/webhooks/..." title="${config.discordWebhookUrl || 'Enter Discord Webhook URL'}" required>
              </div>
              <div class="discord-input-hint">${t('ui.discordWebhookHint')}</div>
            </div>
            
            <div class="discord-input-block">
              <label class="discord-input-label">Language / 語言</label>
              <div class="discord-input-wrapper">
                <select id="language-select" name="language-select" class="discord-input">
                  <option value="en" ${config.language === 'en' ? 'selected' : ''}>English</option>
                  <option value="zh-TW" ${config.language === 'zh-TW' ? 'selected' : ''}>繁體中文</option>
                </select>
              </div>
            </div>
            
            <div class="discord-input-block">
              <label class="discord-input-label">${t('ui.openaiApiKey')}</label>
              <div class="discord-input-wrapper">
                <input type="password" id="openai-api-key" name="openai-api-key" class="discord-input" value="${
									config.openaiApiKey
								}" placeholder="sk-...">
              </div>
              <div class="discord-input-hint">
                ${t('ui.openaiApiKeyHint')}
              </div>
            </div>
            
            <div class="discord-input-block">
              <label class="discord-input-label">${t('ui.anthropicApiKey')}</label>
              <div class="discord-input-wrapper">
                <input type="password" id="anthropic-api-key" name="anthropic-api-key" class="discord-input" value="${
									config.anthropicApiKey
								}" placeholder="sk-ant-...">
              </div>
              <div class="discord-input-hint">
                ${t('ui.anthropicApiKeyHint')}
              </div>
            </div>
            
            <div class="discord-info-block">
              <div class="discord-info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="discord-info-content">
                <div class="discord-info-title">${t('ui.aboutApiKeys')}</div>
                <div class="discord-info-text">${t('ui.apiKeysDescription')}</div>
              </div>
            </div>
            
            <div class="discord-form-actions">
              <button type="button" class="discord-btn discord-btn-secondary" id="discord-modal-cancel">${t('ui.cancel')}</button>
              <button type="submit" class="discord-btn discord-btn-primary">${t('ui.saveSettings')}</button>
            </div>
          </form>
        </div>
      </div>
    `;

		// Add to page
		document.body.appendChild(modalContainer);

		// Close modal on backdrop click
		modalContainer.addEventListener("click", (e) => {
			if (e.target === modalContainer) {
				modalContainer.remove();
			}
		});

		// Close modal on X button click
		document
			.querySelector(".discord-modal-close")
			.addEventListener("click", () => {
				modalContainer.remove();
			});

		// Close modal on Cancel button click
		document
			.getElementById("discord-modal-cancel")
			.addEventListener("click", () => {
				modalContainer.remove();
			});

		// Handle language change
		document.getElementById("language-select").addEventListener("change", async (e) => {
			const newLanguage = e.target.value;
			config.language = newLanguage;
			await loadLanguage(newLanguage);
			saveConfig();
			
			// Reload the modal with new language
			modalContainer.remove();
			showConfigurationModal();
		});


		// Handle form submission
		document
			.getElementById("discord-config-form")
			.addEventListener("submit", (e) => {
				e.preventDefault();

				config.discordWebhookUrl = document.getElementById(
					"discord-webhook-url"
				).value;
				config.openaiApiKey = document.getElementById("openai-api-key").value;
				config.anthropicApiKey = document.getElementById("anthropic-api-key").value;


				config.isConfigured = true;
				saveConfig();

				// Show success message
				const successMsg = document.createElement("div");
				successMsg.className = "discord-success-message";
				successMsg.textContent = t('ui.settingsSavedSuccess');
				document.querySelector(".discord-modal-body").appendChild(successMsg);

				// Close modal after delay
				setTimeout(() => {
					modalContainer.remove();
				}, 1500);
			});
	}


	// Debug helper function
	function debugExtensionState() {
		// Check if extension is running
		// Check configuration
		// Check for tweets
		const tweets = document.querySelectorAll("article");
		// Check for action bars
		const actionBars = document.querySelectorAll('[role="group"]');
		// Check for our buttons
		const discordButtons = document.querySelectorAll(
			".discord-button-container"
		);
		// Try to re-inject buttons
		injectButtons();
	}

	// Additional debug function to manually inject buttons
	function forceInjectButtons() {

		// Remove existing buttons to avoid duplicates
		document.querySelectorAll(".discord-button-container").forEach((el) => {
			el.remove();
		});

		// Log the DOM structure of tweets for debugging
		const sampleTweet = document.querySelector("article");
		if (sampleTweet) {

			// Output basic structure info
			const structure = {
				hasActionBar: !!sampleTweet.querySelector('[role="group"]'),
				hasTweetText: !!sampleTweet.querySelector('[data-testid="tweetText"]'),
				hasUserName: !!sampleTweet.querySelector('[data-testid="User-Name"]'),
				hasLikeButton: !!sampleTweet.querySelector('[data-testid="like"]'),
				hasRetweetButton: !!sampleTweet.querySelector(
					'[data-testid="retweet"]'
				),
			};

			// Try to find action bar using alternative selectors
			const actionButtons = sampleTweet.querySelectorAll("[data-testid]");
			const actionTestIds = Array.from(actionButtons).map((el) =>
				el.getAttribute("data-testid")
			);
		}

		// Try injection again
		injectButtons();
	}

	// Add keyboard shortcuts for debugging
	document.addEventListener("keydown", function (e) {
		// Alt+Shift+C for configuration modal
		if (e.altKey && e.shiftKey && e.key === "C") {
			e.preventDefault();
			showConfigurationModal();
		}

		// Alt+Shift+D for debug info
		if (e.altKey && e.shiftKey && e.key === "D") {
			debugExtensionState();
		}

		// Alt+Shift+F to force re-inject buttons
		if (e.altKey && e.shiftKey && e.key === "F") {
			forceInjectButtons();
		}
	});

	// 設置 mutation observer 以處理動態加載的內容
	const observer = new MutationObserver(() => {
		// 每當 DOM 變化時嘗試注入按鈕
		injectButtons();
	});

	// 觀察整個 body 的變化
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// Initialize - run it once right away
	injectButtons();
})();
