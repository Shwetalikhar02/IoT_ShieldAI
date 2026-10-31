---
name: update-history-log
description: How to append a correct, well-formed row to the Prompt Log table in PROJECT_HISTORY.md after any task.
when_to_use: Use after EVERY task (mandatory per Section B). Never skip even for small changes.
---

# Skill: update-history-log

## Purpose
Append a new row to the "Prompt Log" table in `PROJECT_HISTORY.md` after completing any task, so the project history remains accurate and auditable.

## Inputs
- `entry_number`: int — next sequential number (check the last row in the table)
- `date_time`: str — current UTC datetime in format `YYYY-MM-DD HH:MM UTC`
- `prompt_summary`: str — 1–2 sentence summary of what was asked
- `plan_review`: str — `"Approved"` or `"Fixed then Approved"` (with round count)
- `what_it_did`: str — brief description of what was implemented/changed
- `files_created_changed`: str — pipe-separated list or short summary
- `status`: str — `"Done"` | `"In Progress"` | `"Blocked"`
- `errors_found_and_fixed`: str — description of any errors caught by check_all and how they were fixed, or `"None"`

## Outputs
- A new row appended to the Prompt Log table in `PROJECT_HISTORY.md`

## Step-by-Step Instructions

### Step 1 — Open PROJECT_HISTORY.md

Read the current contents of `PROJECT_HISTORY.md` to find the last row number.

### Step 2 — Determine the next entry number

Count the existing data rows in the Prompt Log table (rows after the header and separator).
The next entry number = last entry number + 1.

### Step 3 — Format the new row

Use this exact Markdown table row format:
```
| N | YYYY-MM-DD HH:MM UTC | Short prompt summary | Approved / Fixed then Approved | What was done | file1.py, file2.jsx | Done | None |
```

Rules:
- Keep each cell concise (< 80 characters per cell ideally)
- For `files_created_changed`, list up to 5 files; for more, write "N files (see commit)"
- Never wrap a row across multiple lines (Markdown tables are single-line)
- Never delete or edit existing rows

### Step 4 — Append the row

Using the file edit tool, append the new row **inside** the Prompt Log table, after the last existing data row.

### Step 5 — Verify the table is valid

Quick sanity check: count the `|` characters in the new row. A valid row has exactly 9 `|` characters (8 columns + leading/trailing).

### Step 6 — Update Module Status if applicable

If the task changed a module's implementation status, update the "Module Status" table too.

## Example Row

```
| 2 | 2026-10-31 17:30 UTC | Implement M1 static_analyzer using cppcheck | Approved | Wired cppcheck subprocess in static_analyzer.py | static_analyzer.py, test_health.py | Done | ruff: unused import — removed |
```

## Notes
- If PROJECT_HISTORY.md is accidentally overwritten, restore from the last git commit: `git checkout HEAD -- PROJECT_HISTORY.md`
- The "Plan Review" column is for the CURRENT task's plan review status, not a historical one
- Always run `check_all` BEFORE writing "Done" in the status column
