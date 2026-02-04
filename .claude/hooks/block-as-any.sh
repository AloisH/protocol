#!/bin/bash
# Block 'as any' type assertions in TypeScript/Vue files
# Exit 2 = block with error message shown to Claude

node -e "
const input = require('fs').readFileSync(0, 'utf8');
const data = JSON.parse(input);
const toolName = data.tool_name;
const filePath = data.tool_input?.file_path || '';

// Only check .ts and .vue files
if (!/\.(ts|vue)$/.test(filePath)) {
  process.exit(0);
}

// Get content to check based on tool
let content = '';
if (toolName === 'Edit') {
  content = data.tool_input?.new_string || '';
} else if (toolName === 'Write') {
  content = data.tool_input?.content || '';
} else {
  process.exit(0);
}

// Check for 'as any' pattern
if (/\bas\s+any\b/.test(content)) {
  console.error(\`BLOCKED: 'as any' detected. This bypasses TypeScript safety.

Fix options:
1. Use proper types: define interface/type for the value
2. Use 'unknown' + type guard: if (isMyType(x)) { ... }
3. Use type narrowing: typeof, instanceof, 'in' checks
4. Fix the source: ensure upstream returns correct type
5. Use generic: as T where T is a proper type parameter

Never use 'as any' - it defeats TypeScript's purpose.\`);
  process.exit(2);
}

process.exit(0);
"
