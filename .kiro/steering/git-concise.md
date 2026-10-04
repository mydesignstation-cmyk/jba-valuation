# Git Operations — Concise Output Only

**AGENTS: Minimize token use for git operations. No explanations, no status reports, no verbose output.**

---

## Rule: Concise Git Output

**For commits and pushes:** Output ONLY the commit hash and status. Nothing else.

---

## Commit Format

### ❌ VERBOSE (too many tokens)

```
I've staged all the modified files in the src/ directory. Now I'll create a commit 
with a descriptive message explaining the changes made to the field visit form...

[creates commit]

Excellent! The commit was created successfully with hash abc123def456. This commit
includes all the necessary changes...
```

### ✅ CONCISE (zero extra tokens)

```
Committed: abc123def456
```

**That's it.** No explanation. No narrative. Just the hash.

---

## Push Format

### ❌ VERBOSE (too many tokens)

```
Now I'll push these changes to the origin/main branch. The remote is configured 
to sync with Lovable, so keeping the branch in working state is important...

[pushes to remote]

Push successful! Your changes are now on the remote branch and will sync back 
to Lovable. The commit hash is...
```

### ✅ CONCISE (zero extra tokens)

```
Pushed: abc123def456 → origin/main
```

**That's it.** No context. No elaboration. Just the result.

---

## Status Check Format

### ❌ VERBOSE

```
Let me check the current status of your repository to see what files are staged 
and what changes are uncommitted...

[runs git status]

Here's what I found:
- Files staged for commit: 3
- Files modified but not staged: 2
- Untracked files: 1
```

### ✅ CONCISE

```
On branch main | 3 staged | 2 modified | 1 untracked
```

**Single line.** No explanation.

---

## When to Output

**Only output git results when:**
- User explicitly asks for status
- A command fails (show error only)
- The result is a hash or reference needed for later use

**Never output:**
- Progress messages ("Now I'm pushing...")
- Explanations of what you did
- Context about Lovable sync or git workflow
- Verbose git output

---

## Command Template

**Pattern:**
```powershell
# Stage
git add [files]

# Commit (single line output)
git commit -m "message" ; if ($?) { Write-Host "Committed: $(git rev-parse --short HEAD)" }

# Push (single line output)
git push origin main ; if ($?) { Write-Host "Pushed: $(git rev-parse --short HEAD) → origin/main" }
```

---

## Examples

### Adding Fields to Field Visit Form

**Input:** "Add rent amount and year of living fields to step 3"

**Output:**
```
Staged: 7 files
Committed: f3a9c2b1
Pushed: f3a9c2b1 → origin/main
```

**NOT:**
```
I've identified the 7 files that need to be modified for adding the rent amount and year of 
living fields to step 3 of the field visit form. These files are: schema.ts, types.ts, 
fieldVisit.schema.ts, the form component, api.server.ts, fieldVisitPdf.server.ts, and 
SubmittedFieldVisit.tsx.

Now I'll stage these files...
[output of git add]

Great! I've staged 7 files. Now creating a commit...
[full commit output]

Perfect! The commit was created with hash f3a9c2b1. Now pushing to the remote...
[full push output]

Excellent! Your changes have been pushed to origin/main and will sync back to Lovable.
```

---

### Bug Fix

**Input:** "Fix the dropdown in the boundaries step"

**Output:**
```
Modified: src/routes/_app/cases.$caseId.field-visit.tsx
Committed: 2e8d1f9a
Pushed: 2e8d1f9a → origin/main
```

---

### Multiple Operations

**Input:** "Update the PDF generation and re-export the form"

**Output:**
```
Staged: 2 files
Committed: 7c3b4e2f
Pushed: 7c3b4e2f → origin/main
```

---

## Exceptions (When More Detail is OK)

**Output more detail ONLY if:**

1. **User asks for it explicitly**
   - "Show me what's changed"
   - "What files are modified?"
   → Then provide the details

2. **A command fails**
   - Show the error message
   - Nothing else

3. **Disambiguation needed**
   - "Which files should I stage?" → Ask, don't assume

**Otherwise:** Concise output only.

---

## Token Savings

**Before (verbose):** ~150 tokens per push

**After (concise):** ~10 tokens per push

**For 10 commits/day:** ~1,400 tokens saved per day = **42,000 tokens/month**

This matters. Be concise.

