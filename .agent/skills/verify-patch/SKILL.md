---
name: verify-patch
description: How to run the full M3 verification suite (compile, ASan, no-cheating) on a patch and interpret the result.
when_to_use: Use after generating a patch in M2 to verify it is safe and correct before accepting it.
---

# Skill: verify-patch

## Purpose
Run the three-layer M3 verification on a patch and determine if it should be accepted or if M2 should retry.

## Inputs
- `patched_file`: path — absolute path to the patched `.c` file
- `original_code`: str — the original vulnerable lines (for no-cheating check)
- `patched_code`: str — the replacement lines (for no-cheating check)
- `attempt_number`: int — which attempt this is (1–3)

## Outputs
- `VerificationResult` with fields: `compiles`, `sanitizer_passed`, `no_cheating_passed`, `errors`, `overall_status`
- Decision: ACCEPT (overall_status = "passed") or RETRY (overall_status = "failed", attempt < 3) or GIVE UP (attempt = 3)

## Step-by-Step Instructions

### Step 1 — Compile check

```bash
# Inside the sandbox (run via sandbox/run_in_sandbox.sh):
gcc -fsanitize=address,undefined -g -o /tmp/patched_test <patched_file>
```

- Exit code 0 → `compiles = True`
- Non-zero exit code → `compiles = False`, capture stderr as errors

### Step 2 — AddressSanitizer check

```bash
# Run the compiled binary with a triggering input:
/tmp/patched_test [args if needed]
```

- Check stderr for `ERROR: AddressSanitizer:` or `runtime error:` (UBSan)
- No such string → `sanitizer_passed = True`
- Found → `sanitizer_passed = False`, extract the error line

**Important:** Run with the same triggering arguments used in the demo firmware header comment.

### Step 3 — No-cheating check

Apply these heuristics in order:

| Check | Method | Failure indicator |
|-------|--------|-------------------|
| Not identical | `original_code == patched_code` | True → cheating |
| Not deleted | `len(patched_code.strip()) == 0` | True → cheating |
| Not fewer lines | `patched_lines < original_lines` | True → likely deleted |
| Has real code | `patched_code` contains at least one statement from the safe API list | False → suspect |

If any check fails → `no_cheating_passed = False`

### Step 4 — Derive overall_status

This is automatic via the Pydantic `model_validator` in `VerificationResult`:
- All three True → `"passed"`
- Any False → `"failed"`

### Step 5 — Decide

| overall_status | attempt_number | Decision |
|---------------|----------------|---------|
| passed | any | ✅ ACCEPT — write result, move to M4 |
| failed | 1 or 2 | 🔄 RETRY — call `feedback_loop.extract_feedback()`, send to M2 |
| failed | 3 | ❌ GIVE UP — log failure, include in report as "unpatched" |

### Step 6 — Log result

Use `update-history-log` to record the verification result and any errors in PROJECT_HISTORY.md.

## Reading ASan Output

Key lines to look for:

```
==12345==ERROR: AddressSanitizer: stack-buffer-overflow on address 0x7fff...
READ of size 1 at 0x7fff... thread T0
    #0 0x... in process_device_name stack_overflow.c:28
```

Extract:
- Error type: `stack-buffer-overflow` (after the colon)
- Location: `stack_overflow.c:28`
- Include these in `errors` list for feedback to M2.

## Example

```python
result = VerificationResult(
    patch_id=patch.id,
    compiles=True,
    sanitizer_passed=False,
    no_cheating_passed=True,
    errors=["ASan: stack-buffer-overflow at format_string.c:28"],
)
# overall_status is automatically "failed"
assert result.overall_status == OverallStatus.FAILED
```
