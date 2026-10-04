#!/bin/zsh
set -euo pipefail
TASK_ROOT="${0:A:h:h}"
cd "$TASK_ROOT"
if ! command -v claude >/dev/null 2>&1; then
  print -u2 'Claude Code CLIが見つかりません。利用できるCodexセッションへhandoff/CODEX_HANDOFF.mdを渡してください。'
  exit 1
fi
# Auto mode evaluates tool permissions normally; it does not bypass checks.
# If an action is denied, report it rather than retrying with bypassPermissions.
claude --model opus --effort high --permission-mode auto --print --output-format stream-json --verbose < "$TASK_ROOT/handoff/OPUS_BRIEF.md" | tee "$TASK_ROOT/handoff/opus-events.jsonl"
