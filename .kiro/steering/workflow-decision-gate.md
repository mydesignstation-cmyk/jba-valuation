# Workflow Decision Gate

**READ THIS BEFORE LAUNCHING ANY WORKFLOW.**

This document establishes when to use orchestrated workflows vs. direct execution. Violating this gate wastes tokens, slows delivery, and frustrates the user.

---

## Quick Decision Tree

### ✅ USE DIRECT EXECUTION (Read → Edit → Verify → Commit)

**When ANY of these are true:**
- Change touches **fewer than 5 files** (or same file multiple times, which is 1)
- Change is **single-module** (one feature, one layer, no cross-cutting concerns)
- Change is **well-scoped** and requirements are crystal clear
- Change **low-risk**: no database migrations, no auth changes, no breaking API changes
- User is **present and iterating** (real-time feedback loop expected)
- Estimated effort: **< 30 minutes of actual coding**
- Pattern **already exists in codebase** (copy-paste, fill-in-the-blanks style)

**Examples:**
- Add 7 form fields following existing TextField/DropdownField pattern → **direct execution** ✓
- Rename a variable across 2–3 files → **direct execution** ✓
- Fix a bug in a single component → **direct execution** ✓
- Add a new page route with existing page structure → **direct execution** ✓
- Update styling in a single file → **direct execution** ✓

### ⚙️ USE WORKFLOW (Plan → Code → Review)

**When ANY of these are true:**
- Change touches **5+ files across multiple modules** (routing, data layer, types, services, components)
- Change is **architectural** (restructures schema, routing, auth, data flow, build config)
- Change involves **database migrations** with data transformation logic
- Change is **risky** (auth, permissions, payment, infrastructure)
- Change **requires design exploration** first (ambiguous requirements, multiple subsystems)
- Requirements are **ambiguous or exploratory** (questions need answering before implementation)
- Estimated effort: **> 1 hour of actual coding**, or **highly complex**
- User **not present** for real-time iteration

**Examples:**
- Refactor state management across 10 components → **workflow** ✓
- Implement new authentication layer → **workflow** ✓
- Add new database table with foreign keys and data migrations → **workflow** ✓
- Redesign API endpoints (breaking changes) → **workflow** ✓
- Multi-feature epic spanning routing, data layer, UI, and PDF → **workflow** ✓

---

## The Ponytail Principle (Non-Negotiable)

> For small, clearly scoped requests, prefer the smallest safe change that directly satisfies the user's requirement. Do not create a full design or planning workflow for a one-file or narrowly scoped fix unless the user asks for one or the change carries meaningful architectural or safety risk.

**Translation:** If you can execute it faster than you can explain the plan, execute it.

---

## Common Mistakes to Avoid

| Mistake | Prevention |
|---------|-----------|
| **Workflow for 7-field form addition** | This is pattern-matching. Use direct execution. |
| **Planning document for bug fix** | Bug fixes are direct execution unless refactoring is needed first. |
| **Semantic review for copy-paste edit** | Review only for risky/architectural changes. |
| **Workflow when user is present for iteration** | Direct execution allows real-time feedback and pivots. |
| **Generating 50+ pages of documentation for trivial change** | No. Direct execution generates only diffs and commit messages. |
| **Running workflow, waiting for completion, then user asks for pivot** | Inflexible. Direct execution allows instant pivots. |

---

## Token Waste Indicators

If you observe ANY of these during execution, you have over-engineered:

- Multiple agents running in sequence for a single change
- More than 2 artifacts generated (plan, review, code)
- More than 10 minutes elapsed for a 5-minute change
- Workflow re-iteration due to minor issues (syntax, PowerShell quoting)
- Semantic review document longer than the actual code change
- Planning document that exceeds the complexity of the task
- User immediately asks for a change after workflow completes (pivot = wrong abstraction level)

---

## When in Doubt

**Ask the user:** "This looks like a 20-minute direct edit. Want me to just do it, or would you prefer a workflow?"

**Default:** Always default to direct execution unless you have explicit evidence it's risky or complex.

---

## Session Retrospective Reference

**The field-visit-new-fields incident (Session Oct 4, 2026):**
- ❌ Launched full 3-agent workflow for adding 7 simple form fields
- ❌ Generated planning documents, semantic reviews, and artifacts
- ❌ Workflow iterated due to PowerShell syntax issues (should have tested first)
- ❌ User requested layout pivot immediately after → inflexible, required full cycle
- ✅ Should have: read schema/types/form → 5 targeted edits → `tsc --noEmit` → commit → done (10 minutes)
- **Token waste:** ~40,000 tokens for a 5-minute task
- **Lesson:** Ponytail > workflow. Always.

