# Explicit client adapters

Codex reads AGENTS.md and `.agents/skills`. Claude Code loads CLAUDE.md imports and `.claude/skills`. Gemini CLI loads GEMINI.md imports and `.gemini/skills`. OpenCode reads AGENTS.md, opencode.json instructions and `.opencode/skills`; choose your provider/model (including GLM) in your own OpenCode configuration. Generic MCP clients receive a stdio server declaration in `.mcp.json` and must also load AGENTS.md and the canonical rules as context.

`check-harness --setup --client NAME` writes missing stubs and managed copies. Existing unrelated client files/settings are never overwritten or implicitly adopted. Existing identical generated files can be adopted by their content hash. Client binary detection is intentionally absent.

## Existing project skills

Both standard `skills/<name>/SKILL.md` bundles and legacy `skills/<name>.md` procedures are supported. Legacy procedures can have an adjacent `skills/<name>/` directory containing evaluations or other supporting files. Setup copies the procedure to the client's `<name>/SKILL.md` and copies those supporting files; the original paths used by SkillOpt remain unchanged. Missing legacy `name` or `description` frontmatter is filled in the generated copy only. Having both a flat procedure and a standard SKILL.md for the same name is reported as a conflict.

## Manual MCP configuration examples

`mcp.json` is the canonical generic/Claude-style declaration and matches the shipped `.mcp.json`, including both `kb-local` and `skillopt-local`. Setup can adopt the identical shipped declaration. A modified declaration is preserved as a conflict.

Other clients use their own configuration format. The examples below follow the linked official configuration documentation; they have not been tested in live client sessions and setup does not write them. Replace `/absolute/project` with your project's actual absolute path, install the project's dependencies first, and merge the entries into your existing client configuration without replacing unrelated settings. These local server processes do not require a model API key just to configure them.

### Codex

Manually add these tables to the Codex configuration selected for this project. See the [official MCP configuration guide](https://developers.openai.com/codex/mcp/).

```toml
[mcp_servers.kb-local]
command = "node"
args = ["/absolute/project/scripts/semantic/mcp-server.mjs"]

[mcp_servers.skillopt-local]
command = "node"
args = ["/absolute/project/scripts/skillopt/mcp-server.mjs"]
```

### Gemini CLI

Merge into the project's `.gemini/settings.json`. See the [official Gemini MCP settings](https://geminicli.com/docs/tools/mcp-server/).

```json
{
  "mcpServers": {
    "kb-local": {
      "command": "node",
      "args": ["/absolute/project/scripts/semantic/mcp-server.mjs"],
      "cwd": "/absolute/project"
    },
    "skillopt-local": {
      "command": "node",
      "args": ["/absolute/project/scripts/skillopt/mcp-server.mjs"],
      "cwd": "/absolute/project"
    }
  }
}
```

### OpenCode

Merge this `mcp` section into `opencode.json`, retaining the generated `instructions` and your provider settings. See the [official local MCP configuration](https://opencode.ai/docs/mcp-servers/).

```json
{
  "mcp": {
    "kb-local": {
      "type": "local",
      "command": ["node", "/absolute/project/scripts/semantic/mcp-server.mjs"],
      "enabled": true
    },
    "skillopt-local": {
      "type": "local",
      "command": ["node", "/absolute/project/scripts/skillopt/mcp-server.mjs"],
      "enabled": true
    }
  }
}
```

After adding configuration, inspect the client's connected tools and verify that both servers are listed. A configuration example alone does not establish runtime discovery or model behavior.
