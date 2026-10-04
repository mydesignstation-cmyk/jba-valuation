# Steering Enforcement — Why Agents Ignore Rules

**CRITICAL: Steering files are being created but NOT enforced. Agents read them and still violate them.**

---

## The Problem

Agents have been given 6 steering files:
- ✅ workflow-decision-gate.md
- ✅ field-visit-form-template.md
- ✅ powershell-commands.md
- ✅ dangerous-operations.md
- ✅ git-concise.md
- ✅ execution-silence.md

**But they still:**
- Launch workflows for simple 15-minute tasks
- Narrate and explain during execution
- Use verbose output
- Make unnecessary tool calls

---

## Root Cause Analysis

**Steering files are read but not enforced because:**

1. **No enforcement mechanism** — Steering files are informational only. Agents can read them and ignore them.

2. **No pre-execution gate** — There's no checkpoint that blocks violating decisions.

3. **No feedback loop** — When an agent violates a rule, there's no correction or learning signal.

4. **Habit override** — Agents default to their training (be thorough, explain yourself) over steering instructions.

5. **No explicit instruction to check steering first** — The steering files exist but aren't part of the agent's decision-making prompt.

---

## Why the Agent Launched a Workflow for a 15-Minute Task

**Session behavior:**
- User asked: "Add relationship remarks field"
- Agent read the request
- Agent thought: "This touches 7 files, I should use workflow to be safe"
- Agent ignored: `workflow-decision-gate.md` says "< 5 files AND pattern exists = direct execution"
- Agent launched workflow instead

**Why it ignored the steering:**
- Steering files exist in `.kiro/steering/`
- Agent reads them as context
- But nothing **forces** the agent to follow them
- Agent defaulted to "thorough planning is safer" (training bias)

---

## Solution: Explicit Pre-Execution Checkpoint

### Required Changes:

**Before ANY task execution, agent MUST:**

1. **Read steering files** (already happening)
2. **Check decision gate** (NEW)
   ```
   Is this task < 30 min AND < 5 files AND pattern exists?
   → YES: Direct execution (no workflow)
   → NO: Consider workflow
   ```
3. **Block violations** (NEW)
   ```
   If violation detected:
   Stop → Ask user: "This looks like direct execution. Proceed directly?"
   ```

4. **Execute silently** (partially happening)
   ```
   No narration. No explanation. Just do it.
   ```

5. **Report concisely** (partially happening)
   ```
   Commit hash + push confirmation only.
   ```

---

## What Should Have Happened

**User:** "Add relationship remarks field to field visit form"

**Agent decision flow:**
1. ✅ Read steering files
2. ✅ Check workflow-decision-gate.md
   - Single field addition
   - 7 files (schema, types, schema, form, API, PDF, display)
   - Pattern exists (copy-paste from field-visit-form-template.md)
   - Effort: ~15 minutes
3. ✅ Decision: **DIRECT EXECUTION** (not workflow)
4. ❌ Reality: **Launched workflow** (violation)

**What went wrong:** Agent read the steering but didn't apply the decision gate.

---

## How to Fix This

### Option A: Explicit Pre-Execution Prompt (Recommended)

Add this to the agent's system prompt before every task:

```
MANDATORY DECISION GATE (read first):

1. Check .kiro/steering/workflow-decision-gate.md
   - If: < 30 min AND < 5 files AND pattern exists → DIRECT EXECUTION
   - If: > 1 hour OR complex OR ambiguous → WORKFLOW

2. If violating the gate, ask user:
   "This looks like [direct/workflow]. Proceed with [choice]?"

3. Execute silently per execution-silence.md

4. Report concisely per git-concise.md

Do not proceed until gate is applied.
```

### Option B: Automated Pre-Check Hook

Create a hook that validates decisions against steering:

```json
{
  "version": "v1",
  "hooks": [{
    "name": "Steering Decision Gate",
    "trigger": "PreToolUse",
    "matcher": "run_workflow",
    "action": {
      "type": "command",
      "command": "check_steering_violation.sh"
    }
  }]
}
```

### Option C: Make Steering Required Input

Require agent to cite the steering rule BEFORE acting:

**Violation:** Agent just launches workflow
**Correct:** Agent says "Applying workflow-decision-gate.md: This is complex > 1 hour → using workflow"

---

## Enforcement Checklist

**Every agent execution MUST pass:**

- [ ] Checked workflow-decision-gate.md (cite the rule or decision)
- [ ] Decision is correct (direct vs. workflow)
- [ ] No pre-execution narration (execution-silence.md)
- [ ] No verbose output (git-concise.md)
- [ ] If file delete: backup created + committed (dangerous-operations.md)
- [ ] If DB delete: double verification obtained (dangerous-operations.md)
- [ ] PowerShell commands use correct syntax (powershell-commands.md)
- [ ] If field-visit edit: used template (field-visit-form-template.md)

**If ANY fail:** Agent stops and asks for clarification.

---

## Why This Matters

**Current state:**
- Steering files exist but are treated as "nice to read"
- Agents ignore them when convenient
- Result: Same mistakes (workflows for small tasks, verbose output, token waste)

**Fixed state:**
- Steering files are **enforced checkpoints**
- Agents must cite them or ask for exception
- Result: Consistent, fast execution

---

## The Real Issue

**Steering files don't work because:**
- They're informational (passive)
- They require agent discipline (weak)
- They conflict with agent training (thorough > concise)

**They only work if:**
- They're active gates (block wrong decisions)
- They're required inputs (agent must cite them)
- They're validated before execution (enforced)

---

## Implementation (What to Do Now)

**For this session and all future sessions:**

1. **Agent must cite steering** before any major decision
   - Wrong: "I'll launch a workflow"
   - Right: "workflow-decision-gate.md: This is > 5 files AND complex → workflow"

2. **User must validate** if agent cites steering incorrectly
   - User: "No, workflow-decision-gate.md says < 5 files = direct execution. Do it directly."
   - Agent: "Understood. Executing directly per gate."

3. **Build feedback loop** so agents learn which decisions violated steering
   - Each violation → user points to the rule → agent acknowledges
   - After 3–5 violations → agent learns to check gate first

---

## Summary

| What | Status | Issue |
|------|--------|-------|
| Steering files exist | ✅ | Just sitting there |
| Agents read them | ✅ | But don't apply them |
| Agents follow them | ❌ | **ROOT CAUSE** |
| Enforcement mechanism | ❌ | Doesn't exist |
| Feedback when violated | ❌ | Doesn't exist |

**Fix:** Make steering **active** (enforce decisions), not passive (read and forget).

