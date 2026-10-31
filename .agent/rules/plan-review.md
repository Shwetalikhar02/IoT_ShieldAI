# .agent/rules/plan-review.md — Mandatory Plan Review Gate (Section B2)
# =======================================================================
# This document defines the 5-step gate that MUST be followed before
# implementing any task in IoT ShieldAI.  It applies to every prompt,
# every task, and every sub-task.

## The Gate (5 Steps)

### STEP 1 — WRITE THE PLAN

Produce an implementation plan containing:
- **Goal**: one-sentence description of what the task achieves
- **Files to create / change**: list with type (new / modify / delete)
- **Order of steps**: numbered, showing dependencies
- **Dependencies**: what must exist before each step
- **Commands to run**: exact commands with flags
- **Expected result**: what "done" looks like

### STEP 2 — REVIEW THE PLAN (Checklist)

Check every item in this list. Mark ✅ or ❌ for each:

| # | Checklist Item |
|---|---------------|
| 1 | Does it fully satisfy the prompt, with nothing missing and nothing extra? |
| 2 | Is the folder/file structure consistent with Section F? |
| 3 | Are the steps in the correct order (dependencies created before they are used)? |
| 4 | Are the tech stack choices and versions compatible with each other? |
| 5 | Do the schemas, API routes and module interfaces match each other? |
| 6 | Does it avoid implementing business logic where only stubs are allowed? |
| 7 | Are the commands valid for the current OS and tools installed? |
| 8 | Are there security or secret-handling problems (e.g., API keys hard-coded)? |
| 9 | Does it include updating PROJECT_HISTORY.md and SKILLS.md? |
| 10 | Does it fit within the 24-hour hackathon scope? |

### STEP 3 — FIX ERRORS

If ANY item in Step 2 is ❌:
1. Correct the plan.
2. Re-run the full checklist from the top.
3. Repeat until all items are ✅.
4. Maximum 3 revision rounds. If still failing after 3, record under "Known Issues" and choose the simplest safe option.

### STEP 4 — APPROVE AND LOG

- Mark the plan **APPROVED** with a short verdict sentence.
- Append to the "Plan Review Log" in PROJECT_HISTORY.md:
  - Task description
  - Issues found in the plan
  - Fixes applied
  - Final verdict (APPROVED / APPROVED after N revisions)

### STEP 5 — PROCEED

- Implement exactly the approved plan.
- If implementation reveals the plan was wrong, **STOP**, update the plan, re-run the review gate, then continue.
- After implementation, run check_all (Section D rules).

## Quick Reference Card

```
BEFORE TOUCHING ANY FILE:
  1. Write Plan
  2. Review (all 10 checks)
  3. Fix any ❌ (max 3 rounds)
  4. Log to PROJECT_HISTORY.md Plan Review Log → APPROVED
  5. Implement
  6. Run check_all
  7. Update PROJECT_HISTORY.md Prompt Log row
```
