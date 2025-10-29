
# Share to Discord

A browser extension that allows you to send custom-processed social media posts directly to Discord with a single click. The extension supports both Twitter and Threads, uses AI to process posts according to your custom instructions, including content from both text and images, and posts them to your Discord server via webhooks.

## Features

- 🎯 **Custom AI Processing**: Process posts with your own custom instructions using OpenAI or Anthropic APIs
- 🖼️ **Image Analysis**: Analyzes images in posts to include their content in processing (with OpenAI)
- 🌐 **Multilingual Support**: Works with any language, including Chinese, Japanese, Korean, and more
- 🔄 **Simple Interface**: Adds a Discord button next to each post's action bar
- 📱 **Multi-Platform Support**: Works with both Twitter and Threads
- ⚙️ **Flexible Configuration**: Choose between OpenAI or Anthropic for processing, or use simple truncation
- 🔐 **Privacy-Focused**: Your API keys are stored only in your browser's local storage

## Installation

### Manual Installation

1. Download or clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the folder containing this repository
5. The extension is now installed and ready to use

## Configuration

Before using the extension, you need to set up a Discord webhook and (optionally) configure an AI provider:

1. Click on the "Discord Settings" button in the Twitter navigation menu, or use the keyboard shortcut `Alt+Shift+C`
2. Enter your Discord webhook URL (create one in your Discord server via Server Settings → Integrations → Webhooks)
3. Choose a summarization method:
   - **OpenAI**: Uses GPT-4o for both text and image analysis (requires API key)
   - **Anthropic**: Uses Claude 3.7 Sonnet for text analysis (requires API key)
   - **No API**: Simple truncation for long tweets (no API key needed)
4. If using an AI provider, enter your API key
5. Click "Save Configuration"

## Usage

After configuration:

1. Browse Twitter or Threads as normal
2. For any post you want to share, click the Discord logo button in the post's action bar
3. Enter your custom processing instructions in the dialog that appears
4. The extension will process the post according to your instructions (and analyze any images if using OpenAI)
5. The processed content will be posted to your configured Discord channel with a link to the original post

## Keyboard Shortcuts

- `Alt+Shift+C`: Open the configuration modal
- `Alt+Shift+D`: Show extension debug information in console (for troubleshooting)
- `Alt+Shift+F`: Force re-inject buttons (if buttons aren't showing)

## Technical Details

The extension is built using:
- Vanilla JavaScript (no frameworks)
- Chrome Extensions API
- OpenAI API (GPT-4o model)
- Anthropic API (Claude 3.7 Sonnet model)
- Discord Webhooks

## API Pricing Considerations

Both AI providers charge based on usage:

### OpenAI (GPT-4o)
- $2.50 per 1M input tokens
- $10.00 per 1M output tokens

### Anthropic (Claude 3.7 Sonnet)
- $3.00 per 1M input tokens
- $15.00 per 1M output tokens

For typical tweet summarization, costs will be minimal. For example, summarizing 1000 tweets might cost less than $1 depending on their length and complexity.

## Development

To modify the extension:

1. Edit the files as needed:
   - `manifest.json`: Extension configuration
   - `content.js`: Main functionality
   - `styles.css`: Visual styling

2. To test changes, go to `chrome://extensions/`, click the refresh button on the extension, and then refresh Twitter

## Credits

Created by [Neobase1412](https://github.com/Neobase1412)

## License

MIT License
