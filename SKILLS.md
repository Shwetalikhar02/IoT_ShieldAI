# IoT ShieldAI — Skills Registry

This document is the central registry for all agent skills created and maintained within the **IoT ShieldAI** project.

## Decision Rule for New Skills
For EVERY task, prompt, or refactor:
- **IF** the task is repeatable or requires a specialized multi-step procedure:
  1. Check this file (`SKILLS.md`) to avoid duplicates and reuse existing skills.
  2. Create a dedicated skill folder: `/.agent/skills/<skill-name>/SKILL.md` containing name, description, when to use, step-by-step instructions, inputs/outputs, and an example.
  3. Register the new skill in the table below.
- **IF** no skill is needed:
  - Do NOT create an unnecessary skill.
  - Run parallel error checks (Section D / `scripts/check_all.sh`) and log findings in `PROJECT_HISTORY.md`.

---

## Registered Skills

| Name | Purpose | Trigger | Path | Date Created |
|---|---|---|---|---|
| **add-vulnerability-sample** | Add a new vulnerable C demo firmware file with a CWE header comment and verify compilation and ASan behavior. | When adding benchmark or demo firmware to `datasets/demo_firmware/`. | [SKILL.md](.agent/skills/add-vulnerability-sample/SKILL.md) | 2026-10-31 |
| **add-fix-template** | Add a new rule-based regex/AST fix template in `backend/app/modules/m2_repair/fix_templates/` with before/after examples and unit tests. | When creating or extending deterministic fix patterns for common CWEs. | [SKILL.md](.agent/skills/add-fix-template/SKILL.md) | 2026-10-31 |
| **verify-patch** | Run the complete Module 3 verification pipeline (compilation, AddressSanitizer/UBSan, and no-cheating heuristic). | When evaluating a generated patch or testing M3 runner logic. | [SKILL.md](.agent/skills/verify-patch/SKILL.md) | 2026-10-31 |
| **update-history-log** | Append a compliant, well-formed entry to the Prompt Log table in `PROJECT_HISTORY.md`. | After completing any task, prompt, or modification before ending a turn. | [SKILL.md](.agent/skills/update-history-log/SKILL.md) | 2026-10-31 |
| **review-implementation-plan** | Execute the mandatory Section B2 Plan Review Gate (5 steps, 10-point checklist, 3-round fix loop, verdict logging). | Before writing or changing any code or file for ANY task or prompt. | [SKILL.md](.agent/skills/review-implementation-plan/SKILL.md) | 2026-10-31 |

---

## Skill Authoring Guide
Every skill located in `/.agent/skills/<skill-name>/SKILL.md` must adhere to this standard layout:
1. `# Skill: <skill-name>`
2. `## Description`: Concise statement of what the skill does.
3. `## When to Use`: Precise conditions or triggers.
4. `## Inputs and Outputs`: Data, parameters, and side-effects.
5. `## Step-by-Step Instructions`: Numbered, repeatable actions.
6. `## Example`: Practical code snippet, command, or output.
