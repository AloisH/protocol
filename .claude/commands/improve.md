---
description: Analyze code folder for improvement opportunities
---

Analyze folder for refactoring opportunities (no auto-apply).

**Usage:** `/improve [folder_path]`

If no path provided, ask: "Folder to analyze?" (relative to repo root)

## Workflow

1. **Validate path** - Check exists, has code files
2. **Scan files** - Find TS/Vue/JS (exclude .nuxt/, node_modules/, dist/, prisma/generated/, coverage/) - max 50 files
3. **Analyze categories:**

   **Quality:**
   - Missing type annotations, return types
   - Type assertions (`as`), non-null (`!`) → use guards
   - Missing async error handling
   - Unused imports/vars
   - Complex functions (20+ lines)

   **Performance:**
   - Missing pagination/limits
   - Redundant renders
   - Expensive computations without memoization
   - Wrong reactivity (ref vs computed vs reactive)
   - Unnecessary watchers

   **DRY:**
   - Duplicate auth (should use `defineApiHandler`)
   - Repeated validation
   - Copy-paste patterns (3+ similar)

   **Conventions:**
   - Not using db singleton/useAuth
   - Wrong file naming
   - Missing JSDoc for public APIs

4. **Present:**

```
## Code Analysis: [folder]

### Quality Issues (X)
- **[file]:[line]** - [issue]
  Current: [snippet]
  Fix: [suggestion]

### Performance Issues (X)
[same format]

### DRY Violations (X)
[same format]

### Convention Violations (X)
[same format]

## Summary
- Files scanned: X
- Priority: Y critical, Z moderate, W minor
- Top improvement: [one sentence]
```

## Notes

- Max 50 files (mention if exceeded)
- Reference CLAUDE.md patterns
- Link to server/CLAUDE.md for banned patterns
- No auto-fixes, analyze only
