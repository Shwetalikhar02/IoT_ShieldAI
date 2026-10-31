# Skill: review-implementation-plan

## Description
Execute the mandatory Section B2 Plan Review Gate before writing or modifying any code or files. This gate enforces structured planning, rigorous self-review against project constraints, iterative correction, and immutable logging in `PROJECT_HISTORY.md`.

## When to Use
- **Mandatory** before ANY task, prompt, feature addition, refactoring, or bug fix in IoT ShieldAI.
- When an ongoing implementation hits an unexpected obstacle or divergence from the plan.

## Inputs and Outputs
- **Inputs**: User prompt / task description, current codebase state, constraints from `PROJECT_HISTORY.md` and `.agent/rules/plan-review.md`.
- **Outputs**:
  - Documented implementation plan.
  - Completed 10-point checklist with ✅ / ❌ marks.
  - Corrections if any issues were detected.
  - Approval verdict recorded in `PROJECT_HISTORY.md` under "Plan Review Log" and "Prompt Log".

---

## Step-by-Step Instructions

### Step 1: Write the Plan
Formulate a concise implementation plan with the following mandatory sections:
1. **Goal**: One-sentence summary of the task objective.
2. **Files to Create / Change**: Explicit file list categorized by `[NEW]`, `[MODIFY]`, or `[DELETE]`.
3. **Order of Steps**: Numbered sequential action steps showing dependencies.
4. **Dependencies**: Prerequisites needed for each step (packages, files, endpoints).
5. **Commands to Run**: Exact terminal commands to execute with OS-specific considerations.
6. **Expected Result**: Measurable definition of done.

### Step 2: Review the Plan Against the Checklist
Critically review the plan against all 10 checklist criteria:

| # | Checklist Item | Evaluation Criteria |
|---|----------------|---------------------|
| 1 | **Scope & Requirements** | Does it satisfy all explicit and implicit requirements? No missing items, no unrequested features. |
| 2 | **Folder & File Structure** | Does it align strictly with the repository layout defined in Section F? |
| 3 | **Step Ordering** | Are dependencies created and verified before files consuming them? |
| 4 | **Tech Stack Compatibility** | Are Python 3.11, Pydantic v2, FastAPI, React/Vite versions and conventions respected? |
| 5 | **Schema & API Parity** | Do schemas, route parameters, response models, and pipeline interfaces match exactly? |
| 6 | **Stub Integrity** | Are business logic boundaries respected (stubs only with docstrings and TODOs where specified)? |
| 7 | **Platform & OS Validity** | Are commands executable on the active OS (Windows/PowerShell) with sandboxing rules in mind? |
| 8 | **Security & Secrets** | Are API keys, tokens, or hardcoded secrets avoided? Are environment variables used via `.env`? |
| 9 | **Meta & Tracking** | Does the plan include updating `PROJECT_HISTORY.md` and `SKILLS.md`? |
| 10 | **Hackathon Feasibility** | Can this task be completed within the 24-hour hackathon scope? |

### Step 3: Fix Errors (Iterative Loop)
- If ANY item is marked ❌:
  1. Revise the plan to address the failure.
  2. Re-run the full 10-point checklist.
  3. Repeat up to a maximum of 3 rounds.
  4. If unresolved after 3 rounds, record the conflict in `PROJECT_HISTORY.md` under "Known Issues" and adopt the safest minimal solution.

### Step 4: Approve and Log
- Once all 10 items pass (✅):
  - Mark verdict as: `APPROVED` (or `APPROVED (after N revision rounds)`).
  - Add entry into `PROJECT_HISTORY.md` under `## Plan Review Log`:
    ```markdown
    ### Plan Review: <Task Title>
    - **Date**: YYYY-MM-DD HH:MM UTC
    - **Issues Found**: None (or list of issues caught during review)
    - **Fixes Applied**: None (or remedies applied)
    - **Verdict**: APPROVED
    ```

### Step 5: Proceed & Verify
- Implement the approved plan strictly.
- Run parallel error checks (`check_all.ps1` or `check_all.sh`).
- Append a row to the `Prompt Log` table in `PROJECT_HISTORY.md`.

---

## Example Usage

### Example Plan Review Entry
```markdown
### Plan Review: Scaffolding Foundation & Documentation
- **Date**: 2026-10-31 17:25 UTC
- **Issues Found**:
  - Missing starter skill `review-implementation-plan` in `.agent/skills/`.
  - Missing registry file `SKILLS.md` and history tracking `PROJECT_HISTORY.md`.
  - Missing docs directory (`architecture.md`, `problem_mapping.md`, `api_contract.md`).
  - Git repository not yet initialized.
- **Fixes Applied**:
  - Added step to create `.agent/skills/review-implementation-plan/SKILL.md`.
  - Added steps to scaffold `SKILLS.md`, `PROJECT_HISTORY.md`, `README.md`, and `docs/`.
  - Added step to initialize git and commit initial scaffold.
- **Verdict**: APPROVED
```
