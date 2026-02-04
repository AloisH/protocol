---
description: Create GitHub issue for Bistro project
---

Create a new GitHub issue for the Bistro project with proper labels and formatting.

**Instructions:**

1. Ask user for issue details if not provided:
   - Title (required)
   - Description/body (required)
   - Category (optional - determines labels)
   - Phase (optional - phase-0 through phase-4)

2. Available categories and their labels:
   - setup → setup
   - web-app → web-app
   - auth → auth, feature
   - database → database
   - ai → ai, feature
   - landing → landing
   - docs → docs
   - cli → cli
   - payments → payments, feature
   - email → email, feature
   - ui → ui, feature
   - testing → testing
   - ci-cd → ci-cd
   - docker → docker
   - deployment → deployment
   - polish → polish
   - seo → seo
   - monitoring → monitoring
   - middleware → middleware
   - storage → storage, feature
   - dev-setup → dev-setup
   - feature → feature (generic)

3. Available phases:
   - phase-0: Setup
   - phase-1: Web App
   - phase-2: Landing/Docs
   - phase-3: CLI
   - phase-4: Production

4. Create the issue using `gh issue create`:

   ```bash
   gh issue create --title "TITLE" --body "BODY" --label "label1,label2"
   ```

5. Format the body with:
   - Clear task list with `- [ ]` checkboxes
   - Sections: Tasks, Verification, etc.
   - Code blocks for technical details
   - Keep concise per user's CLAUDE.md instructions

6. Return the issue URL

**Example:**

```
Title: "Feature: Add dark mode toggle"
Category: ui
Phase: phase-1
Body:
## Dark Mode Toggle

**Tasks:**
- [ ] Add toggle component
- [ ] Save preference to localStorage
- [ ] Apply theme on load

**Verification:**
- Toggle switches themes
- Preference persists
```

**Remember:** Be extremely concise, sacrifice grammar for brevity per user preferences.
