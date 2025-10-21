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
	};
	
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

	// Function to load config from storage
	async function loadConfig() {
		return new Promise((resolve) => {
			chrome.storage.sync.get(
				[
					"discordWebhookUrl",
					"discordChannels",
					"selectedChannelId",
					"apiProvider",
					"openaiApiKey",
					"anthropicApiKey",
					"isConfigured",
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
					config.isConfigured = result.isConfigured || false;
					resolve();
				}
			);
		});
	}

	// Function to load Discord channels into select dropdown
	function loadDiscordChannels() {
		const channelSelect = document.getElementById('discord-channel-select');
		if (!channelSelect) return;

		// Clear existing options except the first one
		channelSelect.innerHTML = '<option value="">請選擇頻道...</option>';

		// Add default webhook option
		const defaultOption = document.createElement('option');
		defaultOption.value = 'default';
		defaultOption.textContent = '預設頻道 (使用 Webhook URL)';
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
		addOption.textContent = '+ 新增頻道...';
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
            <h2>新增 Discord 頻道</h2>
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
              <label class="discord-input-label">頻道名稱</label>
              <div class="discord-input-wrapper">
                <input type="text" id="channel-name" class="discord-input" placeholder="例如：技術討論、新聞分享..." />
              </div>
            </div>
            
            <div class="discord-input-block">
              <label class="discord-input-label">Webhook URL</label>
              <div class="discord-input-wrapper">
                <input type="url" id="channel-webhook" class="discord-input" placeholder="https://discord.com/api/webhooks/..." />
              </div>
              <div class="discord-input-hint">
                在 Discord 伺服器中創建 Webhook 並複製 URL 到此處
              </div>
            </div>
            
            <div class="discord-form-actions">
              <button type="button" class="discord-btn discord-btn-secondary" id="add-channel-cancel">取消</button>
              <button type="submit" class="discord-btn discord-btn-primary">新增頻道</button>
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
					alert("請輸入頻道名稱");
					return;
				}

				if (!webhookUrl) {
					alert("請輸入 Webhook URL");
					return;
				}

				// Validate webhook URL
				if (!webhookUrl.includes('discord.com/api/webhooks/')) {
					alert("請輸入有效的 Discord Webhook URL");
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

				alert(`頻道 "${channelName}" 已成功新增！`);
			});
	}

	// Function to save config to storage
	function saveConfig() {
		chrome.storage.sync.set({
			discordWebhookUrl: config.discordWebhookUrl,
			discordChannels: config.discordChannels,
			selectedChannelId: config.selectedChannelId,
			apiProvider: config.apiProvider,
			openaiApiKey: config.openaiApiKey,
			anthropicApiKey: config.anthropicApiKey,
			isConfigured: config.isConfigured,
		});
	}

	// Function to inject our button into posts
	function injectButtons() {
		let posts, actionBarSelector;
		
		// 根據平台選擇不同的選擇器
		if (currentPlatform === 'twitter') {
			posts = document.querySelectorAll("article");
			actionBarSelector = '[role="group"]';
			console.log(`[Social->Discord] 找到 ${posts.length} 個 Twitter 推文`);
		} else {
			console.log("[Social->Discord] 不支援的平台");
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
				console.log(`[Social->Discord] 找不到動作欄 (${currentPlatform})`);
				return;
			}

			// 創建我們的 Discord 按鈕容器
			const discordButtonContainer = document.createElement("div");
			discordButtonContainer.className = "discord-button-container";

			// 創建按鈕元素
			const discordButton = document.createElement("div");
			discordButton.className = "discord-button";
			discordButton.setAttribute("aria-label", "發送到 Discord");
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
				console.log('[Discord Button] 點擊處理 - 顯示自定義 prompt 對話框');
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
            <h2>自定義處理推文</h2>
          </div>
          <button type="button" class="discord-modal-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>
        </div>
        <div class="discord-modal-body">
          <form id="custom-prompt-form">
            <div class="discord-input-block">
              <label class="discord-input-label">自定義 Prompt</label>
              <div class="discord-input-wrapper">
                <textarea id="custom-prompt" class="discord-input" rows="4" placeholder="請輸入您希望 AI 如何處理這篇推文的指令...

例如：
- 將這篇推文改寫成專業的技術文章摘要
- 提取關鍵資訊並整理成條列式
- 翻譯成繁體中文並加上個人評論"></textarea>
              </div>
            </div>
            
            <div class="discord-input-block">
              <label class="discord-input-label">選擇 Discord 頻道</label>
              <div class="discord-input-wrapper">
                <select id="discord-channel-select" class="discord-input">
                  <option value="">請選擇頻道...</option>
                </select>
              </div>
            </div>
            
            <div class="discord-form-actions">
              <button type="button" class="discord-btn discord-btn-secondary" id="custom-prompt-cancel">取消</button>
              <button type="submit" class="discord-btn discord-btn-primary">處理並發送到 Discord</button>
            </div>
          </form>
        </div>
      </div>
    `;

		// Add to page
		document.body.appendChild(modalContainer);

		// Load Discord channels into select dropdown
		loadDiscordChannels();

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

				const customPrompt = document.getElementById("custom-prompt").value.trim();
				if (!customPrompt) {
					alert("請輸入自定義 prompt");
					return;
				}

				const selectedChannelId = document.getElementById("discord-channel-select").value;
				if (!selectedChannelId) {
					alert("請選擇 Discord 頻道");
					return;
				}

				// Close modal
				modalContainer.remove();

				// Process the post with custom prompt and selected channel
				await processPostWithCustomPrompt(post, customPrompt, selectedChannelId);
			});
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
			console.error("處理貼文時出錯:", error);

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
	async function processWithCustomPrompt(text, post, customPrompt) {
		console.log("[Social->Discord] Starting custom prompt processing");
		console.log("[Social->Discord] Processing details:", {
			textLength: text.length,
			textPreview: text.substring(0, 100) + '...',
			customPrompt: customPrompt,
			apiProvider: config.apiProvider,
			hasOpenAIKey: !!config.openaiApiKey,
			hasAnthropicKey: !!config.anthropicApiKey
		});

		// Check if post contains images
		let imageUrls = [];
		if (currentPlatform === 'twitter') {
			const tweetImages = post.querySelectorAll('img[src*="pbs.twimg.com/media"]');
			imageUrls = Array.from(tweetImages)
				.map((img) => img.src)
				.filter((src) => src);
		}

		console.log(`[Social->Discord] 貼文包含 ${imageUrls.length} 張圖片`);

		try {
			// Detect language
			const containsChinese = /[\u4e00-\u9fa5]/.test(text);
			const containsJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
			const containsKorean = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]/.test(text);
			const isAsianLanguage = containsChinese || containsJapanese || containsKorean;

			console.log(`[Social->Discord] Language detection:`, {
				containsChinese,
				containsJapanese,
				containsKorean,
				isAsianLanguage
			});

			if (config.apiProvider === "openai" && config.openaiApiKey) {
				console.log("[Social->Discord] Using OpenAI for custom processing");
				if (imageUrls.length > 0) {
					console.log("[Social->Discord] Using OpenAI Vision API");
					return await processWithOpenAIVision(text, imageUrls, customPrompt, isAsianLanguage);
				} else {
					console.log("[Social->Discord] Using OpenAI text API");
					return await processWithOpenAI(text, customPrompt, isAsianLanguage);
				}
			} else if (config.apiProvider === "anthropic" && config.anthropicApiKey) {
				console.log("[Social->Discord] Using Anthropic for custom processing");
				return await processWithAnthropic(text, customPrompt, isAsianLanguage);
			} else {
				console.log("[Social->Discord] No API configured, using original text");
				console.log("[Social->Discord] Config check:", {
					apiProvider: config.apiProvider,
					openaiKey: config.openaiApiKey ? '有' : '無',
					anthropicKey: config.anthropicApiKey ? '有' : '無'
				});
				return text;
			}
		} catch (error) {
			console.error("[Social->Discord] Error processing with custom prompt:", error);
			return text;
		}
	}

	// Function to summarize tweet using selected AI provider
	async function summarizeTweet(text, tweet) {
		console.log("[Twitter->Discord] Starting tweet summarization");

		// 檢查推文是否包含圖片
		const tweetImages = tweet.querySelectorAll(
			'img[src*="pbs.twimg.com/media"]'
		);
		const imageUrls = Array.from(tweetImages)
			.map((img) => img.src)
			.filter((src) => src);

		console.log(`[Twitter->Discord] 推文包含 ${imageUrls.length} 張圖片`);

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

			console.log(
				`[Twitter->Discord] Language detection - Chinese: ${containsChinese}, Japanese: ${containsJapanese}, Korean: ${containsKorean}`
			);

			if (config.apiProvider === "openai" && config.openaiApiKey) {
				console.log("[Twitter->Discord] Using OpenAI for summarization");
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
				console.log("[Twitter->Discord] Using Anthropic for summarization");
				// Claude 目前不支持傳入圖片，使用標準 API
				return await summarizeWithAnthropic(text, isAsianLanguage);
			} else {
				console.log(
					"[Twitter->Discord] No API configured, using original text"
				);
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
		console.log(
			`[Social->Discord] OpenAI custom prompt processing: ${
				isAsianLanguage ? "繁體中文" : "English"
			}`
		);

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
						content: `${customPrompt}\n\n${currentPlatform === 'twitter' ? '推文' : '貼文'}內容: "${text}"`,
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
		console.log("[Twitter->Discord] OpenAI API response received");
		return data.choices[0].message.content.trim();
	}

	// Function to process with OpenAI Vision using custom prompt
	async function processWithOpenAIVision(text, imageUrls, customPrompt, isAsianLanguage) {
		console.log(
			`[Social->Discord] OpenAI Vision custom prompt processing: ${
				isAsianLanguage ? "繁體中文" : "English"
			}`
		);
		console.log(
			`[Social->Discord] Processing ${imageUrls.length} images with GPT-4o`
		);

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
					{ type: "text", text: `${customPrompt}\n\n${currentPlatform === 'twitter' ? '推文' : '貼文'}文字: "${text}"` },
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
		console.log("[Social->Discord] OpenAI Vision API response received");
		return data.choices[0].message.content.trim();
	}

	// Function to process with Anthropic using custom prompt
	async function processWithAnthropic(text, customPrompt, isAsianLanguage) {
		console.log(
			`[Social->Discord] Anthropic custom prompt processing: ${
				isAsianLanguage ? "繁體中文" : "English"
			}`
		);

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
						content: `${customPrompt}\n\n${currentPlatform === 'twitter' ? '推文' : '貼文'}內容: "${text}"`,
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
		console.log("[Social->Discord] Anthropic API response received");
		return data.content[0].text;
	}

	// 添加 OpenAI Vision API 支持
	async function summarizeWithOpenAIVision(text, imageUrls, isAsianLanguage) {
		const promptLanguage = isAsianLanguage
			? "請用繁體中文簡明扼要地總結這個推文及其圖片內容，保持在200字以內"
			: "Summarize this tweet and its images concisely. Keep the summary under 200 characters if possible.";

		console.log(
			`[Twitter->Discord] OpenAI Vision prompt language: ${
				isAsianLanguage ? "繁體中文" : "English"
			}`
		);
		console.log(
			`[Twitter->Discord] Processing ${imageUrls.length} images with GPT-4o`
		);

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
					{ type: "text", text: `${promptLanguage}\n\n推文文字: "${text}"` },
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
		console.log("[Twitter->Discord] OpenAI Vision API response received");
		return data.choices[0].message.content.trim();
	}

	// Function to summarize using Anthropic
	async function summarizeWithAnthropic(text, isAsianLanguage) {
		const promptLanguage = isAsianLanguage
			? "請用繁體中文簡明扼要地總結這個推文，保持在200字以內"
			: "Summarize this tweet concisely in under 200 characters if possible.";

		console.log(
			`[Twitter->Discord] Anthropic prompt language: ${
				isAsianLanguage ? "繁體中文" : "English"
			}`
		);

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
		console.log("[Twitter->Discord] Anthropic API response received");
		return data.content[0].text;
	}

	// Function to send to Discord
	async function sendToDiscord(summary, originalText, author, url, channelId = null) {
		console.log("[Twitter->Discord] Sending summary to Discord:", summary);

		let content;

		if (config.apiProvider === "none") {
			content = url;
		} else {
			content = `${summary}\n\n${url}`;
		}

		const payload = {
			content: content,
		};

		// 記錄完整的 payload 以便調試
		console.log(
			"[Twitter->Discord] Discord payload:",
			JSON.stringify(payload, null, 2)
		);

		// 根據頻道 ID 選擇正確的 webhook URL
		let webhookUrl = config.discordWebhookUrl;
		if (channelId && channelId !== 'default' && config.discordChannels) {
			const selectedChannel = config.discordChannels.find(ch => ch.id === channelId);
			if (selectedChannel && selectedChannel.webhookUrl) {
				webhookUrl = selectedChannel.webhookUrl;
			}
		}

		console.log(`[Twitter->Discord] 使用 webhook URL: ${webhookUrl}`);

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

		console.log("[Twitter->Discord] Successfully sent to Discord");
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
            <h2>Social to Discord 設定</h2>
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
              <label class="discord-input-label">Discord Webhook URL</label>
              <div class="discord-input-wrapper">
                <input type="text" id="discord-webhook-url" class="discord-input" value="${
									config.discordWebhookUrl
								}" placeholder="https://discord.com/api/webhooks/..." required>
              </div>
              <div class="discord-input-hint">在 Discord 伺服器中創建一個 webhook (伺服器設置 → 整合 → Webhooks)</div>
            </div>
            
            <div class="discord-input-block">
              <label class="discord-input-label">AI 處理服務</label>
              <div class="discord-radio-group">
                <label class="discord-radio-option">
                  <input type="radio" name="api-provider" value="openai" ${
										config.apiProvider === "openai" ? "checked" : ""
									}>
                  <div class="discord-radio-content">
                    <div class="discord-radio-title">OpenAI (GPT-4o)</div>
                    <div class="discord-radio-desc">支援文字和圖片分析</div>
                  </div>
                </label>
                <label class="discord-radio-option">
                  <input type="radio" name="api-provider" value="anthropic" ${
										config.apiProvider === "anthropic" ? "checked" : ""
									}>
                  <div class="discord-radio-content">
                    <div class="discord-radio-title">Anthropic (Claude)</div>
                    <div class="discord-radio-desc">支援文字分析</div>
                  </div>
                </label>
                <label class="discord-radio-option">
                  <input type="radio" name="api-provider" value="none" ${
										config.apiProvider === "none" ? "checked" : ""
									}>
                  <div class="discord-radio-content">
                    <div class="discord-radio-title">不使用 AI</div>
                    <div class="discord-radio-desc">簡單截斷長貼文</div>
                  </div>
                </label>
              </div>
            </div>
            
            <div id="openai-key-field" class="discord-input-block" ${
							config.apiProvider !== "openai" ? 'style="display:none;"' : ""
						}>
              <label class="discord-input-label">OpenAI API Key</label>
              <div class="discord-input-wrapper">
                <input type="password" id="openai-api-key" class="discord-input" value="${
									config.openaiApiKey
								}" placeholder="sk-...">
              </div>
              <div class="discord-input-hint">
                可以從 <a href="https://platform.openai.com/account/api-keys" target="_blank" class="discord-link">OpenAI 網站</a> 獲取 API 密鑰
              </div>
            </div>
            
            <div id="anthropic-key-field" class="discord-input-block" ${
							config.apiProvider !== "anthropic" ? 'style="display:none;"' : ""
						}>
              <label class="discord-input-label">Anthropic API Key</label>
              <div class="discord-input-wrapper">
                <input type="password" id="anthropic-api-key" class="discord-input" value="${
									config.anthropicApiKey
								}" placeholder="sk-ant-...">
              </div>
              <div class="discord-input-hint">
                可以從 <a href="https://console.anthropic.com/keys" target="_blank" class="discord-link">Anthropic 網站</a> 獲取 API 密鑰
              </div>
            </div>
            
            <div class="discord-info-block">
              <div class="discord-info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="discord-info-content">
                <div class="discord-info-title">關於 API 密鑰</div>
                <div class="discord-info-text">您的 API 密鑰僅存儲在您的瀏覽器中，不會發送到任何其他地方。處理請求直接從您的瀏覽器發送到 API 提供商。</div>
              </div>
            </div>
            
            <div class="discord-form-actions">
              <button type="button" class="discord-btn discord-btn-secondary" id="discord-modal-cancel">取消</button>
              <button type="submit" class="discord-btn discord-btn-primary">儲存設定</button>
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

		// Handle API provider change to show/hide relevant fields
		document.querySelectorAll('input[name="api-provider"]').forEach((radio) => {
			radio.addEventListener("change", () => {
				const provider = document.querySelector(
					'input[name="api-provider"]:checked'
				).value;
				document.getElementById("openai-key-field").style.display =
					provider === "openai" ? "block" : "none";
				document.getElementById("anthropic-key-field").style.display =
					provider === "anthropic" ? "block" : "none";
			});
		});

		// Handle form submission
		document
			.getElementById("discord-config-form")
			.addEventListener("submit", (e) => {
				e.preventDefault();

				config.discordWebhookUrl = document.getElementById(
					"discord-webhook-url"
				).value;
				config.apiProvider = document.querySelector(
					'input[name="api-provider"]:checked'
				).value;

				if (config.apiProvider === "openai") {
					config.openaiApiKey = document.getElementById("openai-api-key").value;
				} else if (config.apiProvider === "anthropic") {
					config.anthropicApiKey =
						document.getElementById("anthropic-api-key").value;
				}

				// If any key API is selected but no key is provided, show a warning
				if (
					(config.apiProvider === "openai" && !config.openaiApiKey) ||
					(config.apiProvider === "anthropic" && !config.anthropicApiKey)
				) {
					const warningMsg = document.createElement("div");
					warningMsg.className = "discord-warning-message";
					warningMsg.textContent =
						"Warning: 您選擇了 AI 提供商但未輸入 API 密鑰。沒有密鑰，摘要功能將無法正常工作。";
					document.querySelector(".discord-modal-body").appendChild(warningMsg);

					// Remove warning after 3 seconds but don't close the modal
					setTimeout(() => {
						warningMsg.remove();
					}, 3000);

					return; // Don't save or close the modal
				}

				console.log("[Twitter->Discord] Saving configuration:", {
					provider: config.apiProvider,
					webhookConfigured: !!config.discordWebhookUrl,
					openAIKeyConfigured: !!config.openaiApiKey,
					anthropicKeyConfigured: !!config.anthropicApiKey,
				});

				config.isConfigured = true;
				saveConfig();

				// Show success message
				const successMsg = document.createElement("div");
				successMsg.className = "discord-success-message";
				successMsg.textContent = "設置已成功保存！";
				document.querySelector(".discord-modal-body").appendChild(successMsg);

				// Close modal after delay
				setTimeout(() => {
					modalContainer.remove();
				}, 1500);
			});
	}


	// Debug helper function
	function debugExtensionState() {
		console.log("========== TWITTER TO DISCORD DEBUG INFO ==========");

		// Check if extension is running
		console.log("Extension is loaded and running");

		// Check configuration
		console.log("Configuration status:", {
			isConfigured: config.isConfigured,
			webhookConfigured: !!config.discordWebhookUrl,
			apiProvider: config.apiProvider,
			openAIKeyConfigured: !!config.openaiApiKey,
			anthropicKeyConfigured: !!config.anthropicApiKey,
		});

		// Check for tweets
		const tweets = document.querySelectorAll("article");
		console.log(`Found ${tweets.length} tweet articles on page`);

		// Check for action bars
		const actionBars = document.querySelectorAll('[role="group"]');
		console.log(`Found ${actionBars.length} action bars on page`);

		// Check for our buttons
		const discordButtons = document.querySelectorAll(
			".discord-button-container"
		);
		console.log(
			`Found ${discordButtons.length} Discord buttons already injected`
		);

		// Try to re-inject buttons
		console.log("Attempting to re-inject buttons...");
		injectButtons();

		console.log("========== END DEBUG INFO ==========");
	}

	// Additional debug function to manually inject buttons
	function forceInjectButtons() {
		console.log("[Twitter->Discord] Force injecting buttons on all tweets");

		// Remove existing buttons to avoid duplicates
		document.querySelectorAll(".discord-button-container").forEach((el) => {
			el.remove();
		});

		// Log the DOM structure of tweets for debugging
		const sampleTweet = document.querySelector("article");
		if (sampleTweet) {
			console.log("[Twitter->Discord] Sample tweet structure:");

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

			console.log(structure);

			// Try to find action bar using alternative selectors
			const actionButtons = sampleTweet.querySelectorAll("[data-testid]");
			const actionTestIds = Array.from(actionButtons).map((el) =>
				el.getAttribute("data-testid")
			);
			console.log("Available data-testid values:", actionTestIds);
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
