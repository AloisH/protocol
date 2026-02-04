---
description: Fetch GitHub issue and create implementation plan
---

Create plan for GitHub issue:

1. Fetch issue: `gh issue view {issue_number} --json title,body,labels,comments --jq '{title,body,labels:[.labels[].name],comments:[.comments[].body]}'`
2. Read relevant codebase files based on issue context
3. Analyze issue + codebase to understand:
   - Root cause
   - Affected files/components
   - Implementation approach options
4. Create concise plan with:
   - Problem summary (1-2 lines)
   - Proposed solution approach
   - Files to change
   - Implementation steps
   - Edge cases/considerations
5. List unresolved questions if any

Usage: `/plan-issue <issue_number>`
