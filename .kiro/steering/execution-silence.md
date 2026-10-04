# Execution Silence — STRICTLY ENFORCED

**AGENTS: ZERO narration. ZERO explanation. ZERO intermediate steps shown. Only final output.**

---

## The Rule: Absolute Silence

**During execution:** NOTHING. No brackets. No steps. No "I'm reading" or "now I'm editing". Nothing.

**After execution:** ONLY commit hash + push confirmation. That's all. One line.

---

## ❌ WRONG (Narration Waste)

```
I'll start by checking if this is a first iteration or a review iteration, then 
implement the sticky footer accordingly.

Let me read the plan first to understand the requirements:

[reads file]

Now I need to check the current field-visit.tsx to understand the existing structure:

[reads file]

OK, I see the pattern. Now I'll modify the component to add the sticky footer. 
Let me update the render logic...

[makes edits]

Good! The changes look correct. Now let me compile to verify...

[runs tsc]

Perfect! No errors. Now I'll commit these changes...
```

**Token cost:** ~200 extra tokens of narration

---

## ✅ CORRECT (Silent Execution)

```
Committed: abc123def456
Pushed: abc123def456 → origin/main
```

**Token cost:** ~2 tokens (zero narration)

**CRITICAL:** Even `[reads plan]` or `Compiled: no errors` is narration. DELETE IT. Only output the commit and push lines.

---

## What NOT to Output

**ABSOLUTE ZERO of these during work:**

- ❌ `[reads plan]` — narration
- ❌ `[edits component]` — narration
- ❌ `Compiled: no errors` — narration
- ❌ `[run tsc --noEmit]` — narration
- ❌ Any brackets `[]` — narration
- ❌ "I'll start by..." — narration
- ❌ "Let me check if..." — narration
- ❌ "Now I need to..." — narration
- ❌ "Good, that compiled..." — narration

**ANY intermediate output = violation.**

---

## What TO Output

**ONLY EVER output these two lines:**

```
Committed: <commit-hash>
Pushed: <commit-hash> → origin/main
```

**That's it. Full stop. Nothing else. Ever.**

If there's an error:
```
Error: <error message only>
```

If user asks for details:
```
<answer to the specific question only>
```

Otherwise: Silent.

---

## Execution Pattern (Silent)

### ZERO intermediate output. Ever.

Work happens invisibly:
- Read files (silent)
- Make edits (silent)
- Run verification (silent)
- Stage changes (silent)
- Commit (silent)
- Push (silent)

**Output ONLY:**
```
Committed: <hash>
Pushed: <hash> → origin/main
```

Done.

---

## Examples (Updated)

### ❌ WRONG: "Sticky Footer Implementation"

```
[read plan]
[read field-visit.tsx]
[edit component]
[run tsc --noEmit]
Compiled: no errors.
Committed: 7f2a8c1b
Pushed: 7f2a8c1b → origin/main
```

**All of that is wrong.** Even the brackets. Even "Compiled: no errors."

### ✅ CORRECT: "Sticky Footer Implementation"

```
Committed: 7f2a8c1b
Pushed: 7f2a8c1b → origin/main
```

---

### ❌ WRONG: Multiple File Edits

```
[read schema]
[read form component]
[read API handler]
[edit schema]
[edit form]
[edit API handler]
[run tsc --noEmit]
Compiled: no errors.
Modified: 3 files
Committed: 5d9e2c3f
Pushed: 5d9e2c3f → origin/main
```

### ✅ CORRECT: Multiple File Edits

```
Committed: 5d9e2c3f
Pushed: 5d9e2c3f → origin/main
```

---

## Exceptions (When Output is OK)

**Output more than just results ONLY if:**

1. **User asks a question** (needs explanation)
   - "Why did the build fail?" → Explain the error
   - "What changes did you make?" → List the changes

2. **Something is ambiguous** (needs clarification)
   - "Should I add this field to Step 2 or Step 3?" → Ask the user

3. **Critical blocker** (cannot proceed)
   - "Database migration failed" → Explain why

**Otherwise:** Silent execution + concise results only.

---

## Token Savings

**Narration during execution:** ~150–300 tokens per task

**Silent execution:** ~5–20 tokens per task

**For 5 tasks/day:** ~600 tokens saved/day = **18,000 tokens/month**

**Combined with concise git:** ~60,000 tokens saved per month.

This matters. Stay silent during work.

---

## Summary

**Work happens. User sees one line:**

```
Committed: <hash>
Pushed: <hash> → origin/main
```

**Nothing else. Ever.**

This is not a suggestion. This is the rule.

