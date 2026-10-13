# Alexa Focus MCP

Alexa Focus is a small, privacy-first productivity MCP server for the Amazon Developer Hackathon's Alexa+ simulated-experience path. It provides three local tools: plan a day by priority, capture a note, and list session notes.

## Run

Requires Node.js 20+ and no external packages:

```bash
npm test
npm start
```

The MCP endpoint is `http://localhost:8787/mcp`. It accepts JSON-RPC methods `initialize`, `tools/list`, `tools/call`, and `ping`, using protocol version `2025-11-25`.

## Design

- No API keys, tracking, database, or cloud dependency.
- Notes are held in memory and disappear when the process stops.
- The tools are deterministic and easy to demonstrate through an Alexa+ simulated web experience or any MCP-compatible client.

AI assistance is disclosed; all tests in this repository are executable locally.

