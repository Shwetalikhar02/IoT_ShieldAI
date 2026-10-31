---
name: add-fix-template
description: How to add a new rule-based fix template in m2_repair/fix_templates/, with a before/after example and a unit test.
when_to_use: Use whenever you need to register a new deterministic fix for a CWE pattern (e.g., replacing a dangerous API call with a safe equivalent).
---

# Skill: add-fix-template

## Purpose
Add a new fix template to `backend/app/modules/m2_repair/fix_templates/` so that the `template_engine.py` can automatically repair known vulnerability patterns without calling the LLM.

## Inputs
- `CWE_ID`: string — e.g. `"CWE-121"`
- `template_name`: string — e.g. `"strcpy_to_strncpy"`
- `before_code`: str — the vulnerable pattern (may use regex placeholders)
- `after_code`: str — the safe replacement
- `explanation`: str — why this template fixes the vulnerability

## Outputs
- `backend/app/modules/m2_repair/fix_templates/<CWE_ID>_<template_name>.yaml` — the template file
- `backend/app/tests/test_template_<CWE_ID>_<template_name>.py` — unit test
- Updated SKILLS.md if this skill is new

## Step-by-Step Instructions

### Step 1 — Create the YAML template file

Create `backend/app/modules/m2_repair/fix_templates/<CWE_ID>_<template_name>.yaml`:

```yaml
cwe_id: "CWE-121"
name: "strcpy_to_strncpy"
description: |
  Replaces unbounded strcpy() with strncpy() bounded by the destination
  buffer size, followed by explicit NUL termination.
pattern: |
  strcpy\s*\((?P<dst>\w+)\s*,\s*(?P<src>\w+)\s*\)
replacement: |
  strncpy({dst}, {src}, sizeof({dst}) - 1);
  {dst}[sizeof({dst}) - 1] = '\0';
example_before: |
  char buf[32];
  strcpy(buf, user_input);
example_after: |
  char buf[32];
  strncpy(buf, user_input, sizeof(buf) - 1);
  buf[sizeof(buf) - 1] = '\0';
safe_apis:
  - strncpy
  - strlcpy
notes: |
  Only applies when the destination is a stack-allocated array (sizeof known at compile time).
  Does NOT apply to pointer targets (sizeof would return pointer size, not buffer size).
```

### Step 2 — Verify the template matches the demo firmware

Check that the pattern matches the corresponding demo firmware file:

```python
import re, yaml
template = yaml.safe_load(open("backend/app/modules/m2_repair/fix_templates/CWE-121_strcpy_to_strncpy.yaml"))
code = open("datasets/demo_firmware/stack_overflow.c").read()
match = re.search(template["pattern"], code)
assert match, "Pattern did not match demo firmware!"
print("Groups:", match.groupdict())
```

### Step 3 — Write the unit test

Create `backend/app/tests/test_template_CWE121_strcpy.py`:

```python
"""Unit test for CWE-121 strcpy→strncpy fix template."""
import re
import pytest

PATTERN = r"strcpy\s*\((?P<dst>\w+)\s*,\s*(?P<src>\w+)\s*\)"
BEFORE  = "strcpy(buf, user_input);"
AFTER   = "strncpy(buf, user_input, sizeof(buf) - 1);\nbuf[sizeof(buf) - 1] = '\\0';"

def test_pattern_matches_before():
    assert re.search(PATTERN, BEFORE)

def test_pattern_does_not_match_after():
    assert not re.search(PATTERN, AFTER)

def test_replacement_contains_strncpy():
    assert "strncpy" in AFTER
```

Run: `cd backend && python -m pytest app/tests/test_template_CWE121_strcpy.py -v`

### Step 4 — Register in SKILLS.md

Add a row to SKILLS.md under the "Fix Templates" section with:
- CWE ID, template name, pattern description, file path, date created.

### Step 5 — Update PROJECT_HISTORY.md

Use the `update-history-log` skill.

### Step 6 — Commit

```bash
git add backend/app/modules/m2_repair/fix_templates/ \
        backend/app/tests/test_template_*.py \
        PROJECT_HISTORY.md SKILLS.md
git commit -m "feat: add fix template for <CWE_ID> (<template_name>)"
```

## Notes
- Patterns use Python `re` named groups (`?P<name>`) for the replacement substitution.
- Only add templates for patterns where the fix is deterministic and safe (no ambiguity).
- For ambiguous cases, leave it to the LLM (no template needed).
