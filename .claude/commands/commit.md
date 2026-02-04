---
description: Stage changes and create git commit with conventional message
---

Create a git commit following these steps:

1. Run `git status` and `git diff` to see changes
2. Analyze all changes and draft a concise conventional commit message:
   - Format: `type(scope): brief description`
   - Types: feat, fix, docs, style, refactor, test, chore
   - Keep description under 72 chars
   - Focus on "why" not "what"
3. Stage relevant files with `git add`
4. Create commit with message
5. Run `git status` to verify

Follow conventional commits spec. Be extremely concise.
