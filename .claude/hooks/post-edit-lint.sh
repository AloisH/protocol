#!/bin/bash
# Auto-fix lint/format issues after file edits
# Exit 0 = success, Exit 2 = block with error
# Runs on: Edit/Write for .ts, .vue, .js, .tsx, .jsx files

input=$(cat)
file_path=$(echo "$input" | grep -oP '"file_path"\s*:\s*"\K[^"]+' || echo "")

# Skip if no file path or not a lintable file
if [[ -z "$file_path" || ! "$file_path" =~ \.(ts|vue|js|tsx|jsx)$ ]]; then
  exit 0
fi

# Skip if file doesn't exist
if [[ ! -f "$file_path" ]]; then
  exit 0
fi

# Format with prettier (silent on success)
npx prettier --write "$file_path" >/dev/null 2>&1 || true

# Lint with eslint --fix
output=$(npx eslint --fix "$file_path" 2>&1)
exit_code=$?

if [[ $exit_code -ne 0 ]]; then
  echo "ESLint errors in $file_path:" >&2
  echo "$output" >&2
  exit 2
fi

exit 0
