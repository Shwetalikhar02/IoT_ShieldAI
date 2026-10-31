# Fix Templates Directory
#
# Each fix template is a YAML or JSON file in this directory.
# Naming convention: <CWE_ID>_<short_description>.yaml
#
# Template schema:
#   cwe_id: "CWE-121"
#   name: "Stack Buffer Overflow — strncpy replacement"
#   description: |
#     Replaces unbounded strcpy() with strncpy() bounded by buffer size,
#     followed by explicit NUL termination.
#   pattern: |
#     strcpy\s*\((\w+)\s*,\s*(\w+)\)
#   replacement: |
#     strncpy({dst}, {src}, sizeof({dst}) - 1);
#     {dst}[sizeof({dst}) - 1] = '\0';
#   example_before: |
#     char buf[32];
#     strcpy(buf, user_input);
#   example_after: |
#     char buf[32];
#     strncpy(buf, user_input, sizeof(buf) - 1);
#     buf[sizeof(buf) - 1] = '\0';
#   test: tests/test_template_cwe121.py
#
# Add templates using the skill: .agent/skills/add-fix-template/SKILL.md

# TODO: Create individual YAML template files per CWE here.
# See skill "add-fix-template" for the step-by-step procedure.
