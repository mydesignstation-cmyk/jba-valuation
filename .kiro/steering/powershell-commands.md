# PowerShell Command Syntax — MANDATORY

**This system uses Windows PowerShell. Learn the syntax or fail silently.**

---

## ❌ WRONG (Bash/Linux syntax)

```bash
# These will FAIL in PowerShell:
cd dir && npm run build     # && doesn't chain; use ; or | instead
cat file.txt | head -20     # head doesn't exist
grep "text" *.ts            # grep doesn't exist
rm -rf folder               # rm doesn't exist
find . -name "*.ts"         # find doesn't exist
export VAR=value            # export doesn't work
$HOME                        # Use $env:USERPROFILE or $env:HOME from KAS context
```

---

## ✅ CORRECT (PowerShell syntax)

### File & Directory Operations

```powershell
# List files
Get-ChildItem
Get-ChildItem -Recurse

# View file content
Get-Content file.txt
Get-Content file.txt -Head 20              # Show first 20 lines
Get-Content file.txt -Tail 10              # Show last 10 lines

# Copy file
Copy-Item source.txt destination.txt

# Copy directory (recursive)
Copy-Item -Recurse source destination

# Delete file
Remove-Item file.txt

# Delete directory (recursive, careful!)
Remove-Item -Recurse -Force directory

# Create directory
New-Item -ItemType Directory -Path mydir

# Check if file/directory exists
Test-Path path/to/file
```

---

### Command Chaining

```powershell
# Sequential (like &&): use semicolon
npm run build ; npm run test

# Pipe output to next command (like |)
Get-Content file.txt | Select-String "error"

# Conditional on success: use &&-equivalent
if ($?) { npm run deploy }

# Run multiple independent commands
# (just separate with semicolons or call them separately)
npm run build ; npm run test ; npm run deploy
```

---

### Search & Filter

```powershell
# Search for text in files (like grep)
Select-String -Path "*.ts" -Pattern "error"

# OR use ripgrep if available:
rg "pattern" --include "*.ts"

# Find files by name
Get-ChildItem -Recurse -Filter "*.ts"

# OR use ripgrep file search:
rg -l "pattern" --type ts
```

---

### Environment Variables

```powershell
# Read environment variable
$env:DATABASE_URL
$env:NODE_ENV
$env:USERPROFILE          # User home directory

# Set environment variable (session-only)
$env:NODE_ENV = "development"

# Check if set
if ($env:DATABASE_URL) { Write-Host "Set" }
```

---

### Git Commands

```powershell
# These work the same in PowerShell:
git status
git add file.ts
git commit -m "message"
git push origin main

# But be careful with paths that have dots or special chars:
git add 'src/routes/_app/cases.$caseId.field-visit.tsx'   # Quote the path
git add "src/routes/_app/cases.$caseId.field-visit.tsx"   # Or use double quotes
```

---

### Running npm/npx Commands

```powershell
# These work fine:
npm install
npm run build
npm run dev
npx tsc --noEmit

## Drizzle Migration Gotchas

**Problem:** `npx drizzle-kit generate` can get stuck asking about rename detection.

**Solution:** If migration generation hangs or asks for input:

```powershell
# Option 1: Skip rename detection
npx drizzle-kit generate --no-interactive --strict

# Option 2: If that fails, write the migration SQL manually
# Don't rely on Drizzle for complex migrations
```

**Better approach for simple field adds:**
- Just add the column to `src/db/schema.ts`
- Let Drizzle generate the migration
- If it prompts: manually create the `.sql` file in `src/db/migrations/`
- Don't try to auto-fix rename detection; just add the column as new

**Never loop trying the same drizzle command** — if it hangs once, it will hang again. Create the migration manually instead.

---

### CRITICAL: Never Use These in PowerShell

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| `&&` | Doesn't exist in PowerShell | `;` (semicolon) or `if ($?)` |
| `\|\|` | Not the OR operator | `if (...) { } else { }` or `;` |
| `head -20` | Command doesn't exist | `Get-Content file.txt -Head 20` |
| `tail -10` | Command doesn't exist | `Get-Content file.txt -Tail 10` |
| `cat file` | cat doesn't exist | `Get-Content file` |
| `grep text` | grep doesn't exist | `Select-String -Pattern "text"` |
| `find . -name` | find doesn't exist | `Get-ChildItem -Recurse -Filter` |
| `rm -rf` | rm doesn't exist | `Remove-Item -Recurse -Force` |
| `export VAR=x` | export doesn't work | `$env:VAR = "x"` |
| `~/path` | ~ as literal home may not work | `$env:USERPROFILE/path` or use full path |

---

## How to Execute Commands Safely

### Pattern 1: Simple Command
```powershell
cd e:\codefiles\va2 ; npx tsc --noEmit
```

### Pattern 2: Command with Output Redirection
```powershell
npx tsc --noEmit 2>&1  # Capture both stdout and stderr
Get-Content file.txt | Select-String "error"  # Pipe to search
```

### Pattern 3: Multiple Commands in Sequence
```powershell
cd e:\codefiles\va2 ; git status ; npm run build
```

### Pattern 4: Conditional Execution
```powershell
if (Test-Path "src/file.ts") { Write-Host "File exists" }
```

---

## Before Running Any Command

**CHECKLIST:**
- [ ] Is this a PowerShell command or a bash command?
- [ ] If bash: convert it to PowerShell syntax
- [ ] Are there special characters in file paths? → Quote them
- [ ] Am I using `&&` or `head` or `grep`? → STOP, use PowerShell equivalent
- [ ] Does the command exist on this system? → Check with `Get-Command <command>`

---

## Common Mistakes I Make (and must stop)

1. **Using `&&` for command chaining**
   - Wrong: `cd dir && npm run build`
   - Right: `cd dir ; npm run build`

2. **Using `head` to limit lines**
   - Wrong: `npx tsc --noEmit 2>&1 | head -50`
   - Right: `npx tsc --noEmit | Select-Object -First 50`
   - Better: Just run it without head; PowerShell will show output

3. **Quoting file paths with special chars**
   - Wrong: `git add src/routes/_app/cases.$caseId.field-visit.tsx`
   - Right: `git add "src/routes/_app/cases.$caseId.field-visit.tsx"`

4. **Using `find` to search files**
   - Wrong: `find . -name "*.ts" -type f`
   - Right: `Get-ChildItem -Recurse -Filter "*.ts"`

5. **Not quoting environment variables**
   - Wrong: `echo $DATABASE_URL`
   - Right: `Write-Host $env:DATABASE_URL`

---

## When in Doubt

**Ask yourself:** "Is this a bash command?" If yes, look it up in this document first before executing it.

**Better:** Test the command syntax locally before using it in a tool call.

**Best:** Use dedicated tools (grep_search, file_search, read_file) instead of shell commands when available.

