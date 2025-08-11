# MCP Servers Configuration Guide

## Overview
This guide will help you configure Model Context Protocol (MCP) servers to extend your AI assistant's capabilities.

## Quick Setup Steps

### 1. Copy Configuration to Trae Settings
Copy the contents of `mcp_servers_config.json` to your Trae MCP settings file:
```
C:\Users\aiech\AppData\Roaming\Trae\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

### 2. Install Node.js (if not already installed)
Download and install Node.js from: https://nodejs.org/

### 3. Configure API Keys and Environment Variables

#### Essential Servers (No API Keys Required)
- **filesystem**: File system access - Ready to use
- **sqlite**: SQLite database access - Ready to use
- **fetch**: HTTP requests - Ready to use
- **memory**: Persistent memory - Ready to use
- **sequential-thinking**: Step-by-step reasoning - Ready to use
- **puppeteer**: Web automation - Ready to use
- **youtube-transcript**: YouTube transcripts - Ready to use

#### Servers Requiring API Keys

##### Brave Search (Web Search)
1. Get API key from: https://api.search.brave.com/
2. Replace `your_brave_api_key_here` with your actual key

##### GitHub Integration
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Create a new token with repo permissions
3. Replace `your_github_token_here` with your token

##### PostgreSQL Database
1. Install PostgreSQL if needed
2. Update connection string with your database details:
   ```
   postgresql://username:password@localhost:5432/database
   ```

##### Google Drive
1. Go to Google Cloud Console
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Replace client ID and secret

##### Slack Integration
1. Create a Slack app at: https://api.slack.com/apps
2. Get Bot User OAuth Token
3. Replace `your_slack_bot_token`

##### EverArt (AI Image Generation)
1. Sign up at EverArt
2. Get API key from dashboard
3. Replace `your_everart_api_key_here`

##### Notion Integration
1. Go to Notion Developers
2. Create new integration
3. Get integration token
4. Replace `your_notion_integration_token`

##### Obsidian Vault
1. Update the vault path to your actual Obsidian vault location
2. Default path: `C:\Users\aiech\Documents\ObsidianVault`

## Server Descriptions

### Core Functionality
- **filesystem**: Access and manage files on your system
- **memory**: Persistent memory and knowledge graphs
- **fetch**: Make HTTP requests and fetch web content
- **sequential-thinking**: Advanced reasoning capabilities

### Development Tools
- **github**: Repository management and code analysis
- **sqlite/postgres**: Database operations
- **puppeteer**: Web automation and testing

### Productivity
- **obsidian**: Note-taking and knowledge management
- **notion**: Workspace and project management
- **gdrive**: Cloud file storage and collaboration
- **slack**: Team communication

### Research & Content
- **brave-search**: Web search capabilities
- **youtube-transcript**: Video content analysis
- **everart**: AI image generation

## Testing Your Setup

After configuration, restart Trae and test with these commands:
- "Search the web for latest AI news" (brave-search)
- "List files in my documents folder" (filesystem)
- "Remember that I prefer TypeScript for new projects" (memory)
- "Get the transcript from this YouTube video: [URL]" (youtube-transcript)

## Troubleshooting

### Common Issues
1. **Server not starting**: Check Node.js installation and API keys
2. **Permission errors**: Ensure file paths are accessible
3. **API errors**: Verify API keys are correct and have proper permissions

### Logs
Check Trae's developer console for detailed error messages.

## Security Notes
- Never commit API keys to version control
- Use environment variables for sensitive data
- Regularly rotate API keys
- Review server permissions carefully

## Advanced Configuration

### Custom Servers
You can add custom MCP servers by following the same pattern:
```json
"custom-server": {
  "command": "node",
  "args": ["path/to/your/server.js"],
  "env": {
    "CUSTOM_ENV_VAR": "value"
  },
  "description": "Your custom server description"
}
```

### Server-Specific Settings
Some servers support additional configuration options. Check their documentation for advanced features.