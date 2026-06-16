# Claude-AI CLI

A lightweight CLI tool that serves as a wrapper for the Claude language model. It provides an intuitive TUI interface and useful utilities such as prompt‑completion, auto‑completions and a quick chat mode.

## Installation

```bash
# Via npm (recommended)
npm i -g @k-clause/claude-ai-cli

# Or use the bundled binary
curl -LO https://github.com/k-claus/cli/releases/latest/download/claude_ai_cli.exe && chmod +x claude_ai_cli.exe
``` 

## Usage

```bash
# Start the interactive shell
claude_ai_cli

# Quick one‑shot prompt
claude_ai_cli --prompt "Explain quantum entanglement in 3 sentences."
```

The tool will stream the response to the terminal, re‑enable ANSI colors, and keep the prompt alive for subsequent interactions. Refer to the source for advanced features.

---

*For developers: the core logic lives in `src/cli.ts`. All output is collected via a custom `Spinner` that masks TTY renders until the response is complete.*
