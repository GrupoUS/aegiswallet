# Aegis Wallet - TaskMaster Initial Setup

## Project Name: Aegis Wallet
## Version: 0.1.0
## Task ID Format: AEGIS-XXX (to be confirmed if auto-generated)

## TaskMaster Configuration:
- Main Model: claude-3-7-sonnet-20250219 (anthropic)
- Research Model: sonar-pro (perplexity)
- Fallback Model: google/gemini-2.5-flash-preview-05-20 (openrouter)

## API Keys (configured in root .env and .cursor/mcp.json):
- Anthropic
- Perplexity
- OpenRouter

## Next Steps:
- Create PRD for Aegis Wallet project.
- Parse PRD using `task-master parse-prd [path-to-prd]`.
- Analyze complexity: `task-master analyze-complexity`.
- Expand tasks: `task-master expand --all`.
