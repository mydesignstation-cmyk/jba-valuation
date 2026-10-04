# Dangerous Operations — BACKUP & VERIFY PROTOCOL

**AGENTS: Read this before ANY delete, remove, truncate, drop, or destructive operation.**

This project has experienced data loss and near-loss incidents. Backup-first and double-verification are now mandatory.

---

## The Rule: Never Delete Without Backup

**MANDATORY BEFORE ANY DESTRUCTIVE OPERATION:**

1. **Create a backup** of the file/data being deleted
2. **Confirm the backup exists** and is readable
3. **Then proceed** with the deletion
4. **Keep backups in git** (never in `.gitignore`)

---

## File Deletion Protocol

### ❌ NEVER DO THIS

```powershell
# Direct deletion with no backup
Remove-Item file.ts
Remove-Item -Recurse -Force folder

# Using git rm without backup
git rm file.ts
```

### ✅ DO THIS INSTEAD

**Step 1: Backup the file**
```powershell
# Copy to backups/ folder (mirroring the original path structure)
Copy-Item src/routes/file.ts backups/2026-10-04_1530_remove-file/src/routes/file.ts
```

**Step 2: Create MANIFEST.txt in the backup folder**
```
backups/2026-10-04_1530_remove-file/MANIFEST.txt
---
What: Backed up src/routes/file.ts before deletion
Why: File was orphaned and no longer needed
Date: 2026-10-04 15:30
Reason: Removing unused route component

To restore:
  Copy file from backups/2026-10-04_1530_remove-file/src/routes/file.ts back to src/routes/file.ts
```

**Step 3: Commit the backup to git**
```powershell
git add backups/2026-10-04_1530_remove-file/
git commit -m "backup: before deleting src/routes/file.ts (orphaned component)"
```

**Step 4: Delete the original file**
```powershell
Remove-Item src/routes/file.ts
git add src/routes/file.ts  # Stage the deletion
git commit -m "remove: delete orphaned src/routes/file.ts (backed up in backups/)"
```

---

## Backup Folder Structure

**Location:** `backups/` at project root (committed to git, never gitignored)

**Format:** `backups/<YYYY-MM-DD_HHmm>_<short-description>/`

**Example:**
```
backups/
├── 2026-09-26_1831_recovered-stash-52ce3c0/
│   ├── MANIFEST.txt
│   ├── src/
│   │   └── components/
│   │       └── MyComponent.tsx
│   └── src/
│       └── types/
│           └── index.ts
├── 2026-10-04_1530_remove-file/
│   ├── MANIFEST.txt
│   └── src/
│       └── routes/
│           └── old-route.tsx
```

**MANIFEST.txt template:**
```
What: [Describe what's being backed up and why]
Date: [YYYY-MM-DD HH:mm]
Files: [List the files/folders backed up]
Reason: [Why this backup was created]

To restore:
  [Step-by-step instructions to restore from this backup]

Commit: [The commit hash that removed the original]
```

---

## Database Dangerous Operations

### Operations Requiring Double Verification

**CRITICAL:** Any of these operations requires TWO confirmations from the user:

1. ❌ `DELETE` table rows
2. ❌ `DROP` table (entire table deletion)
3. ❌ `TRUNCATE` table (all rows deletion)
4. ❌ `ALTER TABLE` DROP COLUMN (schema change)
5. ❌ `UPDATE` without WHERE clause (all rows update)
6. ❌ Migration that deletes or alters production data

### Protocol for Dangerous DB Operations

**Rule:** ALWAYS ask the user TWICE before executing.

**First confirmation:**
```
⚠️ DANGEROUS DATABASE OPERATION

Operation: DROP TABLE field_visits
Impact: This will DELETE the entire field_visits table and all 500+ rows permanently.

This CANNOT be undone except by restoring from a database backup.

Type "YES, delete field_visits" to confirm.
```

**If user confirms:**

**Second confirmation:**
```
⚠️ FINAL CONFIRMATION REQUIRED

You are about to execute:
  DROP TABLE field_visits;

This is your LAST chance to stop.

Type "YES, I understand this is irreversible" to proceed.
```

**Only then:** Execute the operation.

---

## Examples: Safe vs. Dangerous

### ✅ SAFE: Update with WHERE clause

```sql
UPDATE field_visits 
SET status = 'ARCHIVED' 
WHERE created_at < '2020-01-01';
```
**Why:** WHERE clause limits scope. Won't affect new data.

---

### ❌ DANGEROUS: Update without WHERE clause

```sql
UPDATE field_visits SET status = 'ARCHIVED';
-- ALL rows updated! Requires double verification.
```

---

### ✅ SAFE: Delete with narrow WHERE

```sql
DELETE FROM field_visits 
WHERE id = 'abc-123-def' AND status = 'DRAFT';
```
**Why:** Targets specific row. Won't cascade to other tables (FK constraints).

---

### ❌ DANGEROUS: Delete without WHERE

```sql
DELETE FROM field_visits;
-- ALL rows deleted! Requires backup + double verification.
```

---

### ❌ DANGEROUS: Drop table

```sql
DROP TABLE field_visits;
-- Schema deleted! Requires backup + double verification.
```

---

### ❌ DANGEROUS: Truncate table

```sql
TRUNCATE TABLE field_visits;
-- All rows + identity reset! Requires backup + double verification.
```

---

### ❌ DANGEROUS: Drop column from production

```sql
ALTER TABLE field_visits DROP COLUMN full_address;
-- Column data lost! Cannot be easily recovered. Requires backup + double verification.
```

---

## Workflow: Safe Deletion Steps

### For File Deletions:

1. **Confirm file is unused**
   - Search codebase for imports/references
   - Check git history for last edit date
   - Ask user: "This file hasn't been edited since [date]. OK to delete?"

2. **Create backup**
   ```powershell
   New-Item -ItemType Directory -Path "backups/2026-10-04_1530_remove-file"
   Copy-Item src/routes/old-file.tsx backups/2026-10-04_1530_remove-file/src/routes/old-file.tsx
   ```

3. **Write MANIFEST.txt**
   - What, why, when, how to restore

4. **Commit backup to git**
   ```powershell
   git add backups/2026-10-04_1530_remove-file/
   git commit -m "backup: src/routes/old-file.tsx before deletion"
   ```

5. **Delete the file**
   ```powershell
   Remove-Item src/routes/old-file.tsx
   git add src/routes/old-file.tsx
   git commit -m "remove: delete src/routes/old-file.tsx (backed up)"
   ```

---

### For Database Deletions:

1. **First confirmation from user**
   - Explain what will be deleted and why
   - Show the exact SQL or operation
   - Ask: "Type 'YES' to confirm"

2. **Second confirmation from user**
   - Show final warning
   - Ask: "Type 'YES, irreversible' to proceed"

3. **Only after BOTH confirmations: Execute**

4. **Log the operation**
   - Record in git: `git log --grep="DELETE\|DROP\|TRUNCATE"`
   - Keep backups accessible for recovery

---

## What Gets Backed Up (MANDATORY)

**Always backup before:**
- ❌ Deleting files (any file type)
- ❌ Renaming/moving files that could break imports
- ❌ Deleting directories
- ❌ Running destructive git operations (reset, rebase, cherry-pick on shared branches)
- ❌ Database migrations that DROP columns or tables
- ❌ Modifying .gitignore (could lose tracked files)

**Do NOT backup (safe operations):**
- ✅ Adding new files
- ✅ Editing existing files
- ✅ Adding columns to tables (backward compatible)
- ✅ Creating new branches
- ✅ Normal git commits

---

## Recovery Instructions

### If a file was deleted and needs recovery:

1. **Search backups folder**
   ```powershell
   Get-ChildItem -Recurse backups/ -Filter "filename.ts"
   ```

2. **Check the MANIFEST.txt**
   ```powershell
   Get-Content backups/2026-10-04_1530_remove-file/MANIFEST.txt
   ```

3. **Restore from backup**
   ```powershell
   Copy-Item backups/2026-10-04_1530_remove-file/src/routes/file.ts src/routes/file.ts
   git add src/routes/file.ts
   git commit -m "restore: recovered src/routes/file.ts from backups/2026-10-04_1530_remove-file"
   ```

### If database data was accidentally deleted:

1. **STOP immediately** (don't commit, don't run migrations)

2. **Contact Neon support** or use a database backup
   - Neon endpoint: `ep-muddy-math-b3on57py`
   - Database: `neondb`

3. **Restore from backup point-in-time recovery (PITR)**

4. **Never try to `DELETE` or `UPDATE` your way back** — use backups.

---

## Checklist Before Any Delete

- [ ] File/data is truly no longer needed
- [ ] No other code imports or references it
- [ ] Git history shows it's been abandoned (old commits only)
- [ ] Backup has been created and committed to git
- [ ] MANIFEST.txt explains why and how to restore
- [ ] User has approved the deletion (if dangerous operation)
- [ ] Second confirmation obtained (if database operation)
- [ ] Original is deleted only AFTER backup is committed

---

## The Golden Rule

> If you can delete it, you can lose it. Always backup first. Always verify twice for dangerous ops.

---

## Session Retrospective: Why This Rule Exists

**2026-09-26 incident:** Field visit data appeared to be saved, then vanished on refresh because writes landed in a different database. The lesson: **backups are your only safety net when things go wrong.**

**Recovery-first policy:** Before assuming data is lost:
1. Check git status, branch -a, log --all
2. Check git stash list
3. Check git reflog
4. Check backups/ folder
5. Only then escalate to database recovery

