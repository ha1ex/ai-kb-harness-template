# Project skills (Claude Code auto-triggers)

Copies of high-value SKILL.md files from upstream sources, placed here so Claude Code in this workspace
auto-loads them when triggers match.

| Skill | Source | License |
|---|---|---|
| `mcp-builder/` | [anthropics/skills/mcp-builder](https://github.com/anthropics/skills/tree/main/skills/mcp-builder) | Apache-2.0 |
| `skill-creator/` | [anthropics/skills/skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) | Apache-2.0 |
| `claude-api/` | [anthropics/skills/claude-api](https://github.com/anthropics/skills/tree/main/skills/claude-api) | Apache-2.0 |

Полные тела + вспомогательные файлы оригинальных скилов — в `06_outputs/anthropics-skills/01-engineering-productivity/` (только SKILL.md) и в `.context/anthropics-skills-src/skills/<name>/` (полная upstream-структура с references/, scripts/ — gitignored).

Чтобы обновить копию из upstream:
```bash
cd .context/anthropics-skills-src && git pull --depth=1 origin main && cd ../..
cp .context/anthropics-skills-src/skills/<name>/SKILL.md .claude/skills/<name>/
```
