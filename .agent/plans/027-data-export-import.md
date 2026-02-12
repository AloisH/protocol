# Plan: Data Export/Import (#27)

## Overview
Backup/restore local data via JSON export/import.

## Changes

### 1. Add export schema (`shared/schemas/export.ts`)
- `ExportDataSchema` - validates full export structure
- Version field for future migrations
- All table schemas combined

### 2. Update `useIndexedDB.ts`
- Add `activities` + `dailyCompletions` to export/import
- Validate import data with Zod
- Add `importMode: 'merge' | 'replace'` param
- Return validation errors

### 3. Create settings page (`app/pages/settings.vue`)
- Export button → downloads `protocol-backup-{date}.json`
- Import: file picker + merge/replace toggle
- Show validation errors in UAlert
- Confirm dialog before replace (destructive)

### 4. Create components
- `settings/ExportSection.vue` - export UI
- `settings/ImportSection.vue` - import UI with mode toggle

## Implementation Order
1. Export schema
2. Update useIndexedDB
3. Settings page + components

## Files
```
shared/schemas/export.ts (new)
app/composables/useIndexedDB.ts (edit)
app/pages/settings.vue (new)
app/components/settings/ExportSection.vue (new)
app/components/settings/ImportSection.vue (new)
```

## Questions
- Include deprecated tables (routines/exercises) in export for backward compat?
- Max file size limit for import?
