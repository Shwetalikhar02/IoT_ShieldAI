# .agent/rules/tracker-rules.md — Project Tracker Rules
# =======================================================
# These rules govern the maintenance and synchronization of docs/PROJECT_TRACKER.md.

## Principles

1. **Single Source of Truth**:
   - `docs/PROJECT_TRACKER.md` tracks all Features (`F-xxx`) and Tasks (`T-xxx`).
   - Every task must map to a parent Feature and be updated with its status, assignee, and git commit hash.

2. **Sequential Identification**:
   - Task IDs follow `T-001`, `T-002`, `T-003`, etc. Never re-use or skip numbers.
   - Feature IDs follow `F-A`, `F-B`, etc., or `F-001`, `F-002`.

3. **Status Progression**:
   - `Planned` -> `In Progress` -> `Done` (or `Blocked` / `Dropped`).
   - A task is marked `Done` ONLY when the implementation passes all error checks (`check_all`) and is committed to git.

4. **Security & Secrets**:
   - NEVER write secret keys, tokens, or credentials into the tracker.

5. **Synchronization**:
   - Update `PROJECT_TRACKER.md` before starting a task (`In Progress`) and after committing (`Done` with commit hash).
