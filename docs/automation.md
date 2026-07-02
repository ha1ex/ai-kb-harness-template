# Автономный контур: ночной аудит + утренний дайджест

> Ночью — механика (индекс, health-check, LLM-аудит), утром — один экран
> «что изменилось и что ждёт человека». Все артефакты падают в gitignored `.context/`.

## Цепочка

```bash
pnpm kb:index                 # подхватить дневные правки и kb_retain-заметки
pnpm kb:doctor                # health-check (EXIT 0 contract)
pnpm kb:dream --execute       # LLM-аудит (git-окно + журнал + open-questions); без claude CLI — сохранит промпт
node scripts/kb-metrics.mjs --snapshot   # тренды качества за недели (+ история)
pnpm kb:digest                # утренний дайджест → .context/digest-YYYY-MM-DD.md
```

Доставка дайджеста наружу: `KB_DIGEST_WEBHOOK=https://…` — POST `{"text": …}`
(вебхук Slack / Telegram-мост / ntfy).

## macOS — launchd

`~/Library/LaunchAgents/kb.nightly.plist` (замените `/path/to/kb`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>kb.nightly</string>
  <key>ProgramArguments</key><array>
    <string>/bin/zsh</string><string>-lc</string>
    <string>cd /path/to/kb && pnpm kb:index && pnpm kb:doctor && pnpm kb:dream --execute; node scripts/kb-metrics.mjs --snapshot; pnpm kb:digest</string>
  </array>
  <key>StartCalendarInterval</key><dict>
    <key>Hour</key><integer>5</integer><key>Minute</key><integer>30</integer>
  </dict>
  <key>StandardOutPath</key><string>/tmp/kb-nightly.log</string>
  <key>StandardErrorPath</key><string>/tmp/kb-nightly.log</string>
</dict></plist>
```

```bash
launchctl load ~/Library/LaunchAgents/kb.nightly.plist
launchctl start kb.nightly        # проверить вручную
```

## Linux — cron

```cron
30 5 * * * cd /path/to/kb && pnpm kb:index && pnpm kb:doctor && pnpm kb:dream --execute; node scripts/kb-metrics.mjs --snapshot; pnpm kb:digest >> /tmp/kb-nightly.log 2>&1
```

## Несколько KB

Одна оснастка обслуживает несколько баз через `KB_ROOT` (см. README § Несколько KB):

```cron
30 5 * * * cd /path/to/harness && for r in ~/kb/research ~/kb/personal; do KB_ROOT=$r pnpm kb:index && KB_ROOT=$r pnpm kb:digest; done
```

## Что где оседает

| Артефакт | Путь | Кто читает |
|---|---|---|
| Дайджест | `.context/digest-YYYY-MM-DD.md` | человек утром |
| Dream-report (аудит/промпт) | `.context/dream-report-YYYY-MM-DD.md` | человек / LLM |
| Тренды качества | `pnpm kb:metrics` (+ `.context/kb-metrics-history.jsonl`) | человек еженедельно |
| Журнал операций | `.context/kb-journal.jsonl` (ротация 5 MB) | metrics / dream / digest |
| Семантический аудит FACT | GitHub Actions `kb-advisory` (артефакт, non-blocking) | человек / kb-critic |
