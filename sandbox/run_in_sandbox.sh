#!/usr/bin/env bash
# sandbox/run_in_sandbox.sh — Execute a Command in the IoT ShieldAI Sandbox
# ==========================================================================
# Responsibility:
#   Run a shell command inside the iot-shieldai-sandbox Docker container,
#   mounting the project workspace at /workspace, with a configurable timeout.
#
# Usage:
#   ./sandbox/run_in_sandbox.sh "<command>"
#
# Examples:
#   ./sandbox/run_in_sandbox.sh "gcc -fsanitize=address,undefined -g -o /tmp/out /workspace/datasets/demo_firmware/stack_overflow.c && /tmp/out AAAA..."
#   ./sandbox/run_in_sandbox.sh "cppcheck --enable=all --xml /workspace/datasets/demo_firmware/stack_overflow.c"
#
# Environment variables:
#   SANDBOX_IMAGE   — Docker image to use (default: iot-shieldai-sandbox:latest)
#   SANDBOX_TIMEOUT — Timeout in seconds (default: 30)
#
# TODO (M3 team):
#   - Add --network none flag once internet access is confirmed unnecessary.
#   - Add --memory and --cpus limits for resource-constrained simulation.
#   - Mount a tmpfs for /tmp so the sandbox has fast scratch space.
#   - Return exit code from the inner command to the caller.

set -euo pipefail

SANDBOX_IMAGE="${SANDBOX_IMAGE:-iot-shieldai-sandbox:latest}"
SANDBOX_TIMEOUT="${SANDBOX_TIMEOUT:-30}"
WORKSPACE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <command>" >&2
    exit 1
fi

COMMAND="$1"

echo "[sandbox] Running in ${SANDBOX_IMAGE} (timeout=${SANDBOX_TIMEOUT}s)"
echo "[sandbox] Command: ${COMMAND}"

docker run \
    --rm \
    --name "shieldai-sandbox-$$" \
    --volume "${WORKSPACE_DIR}:/workspace:ro" \
    --tmpfs /tmp:size=256m \
    --ulimit nofile=1024:1024 \
    --stop-timeout "${SANDBOX_TIMEOUT}" \
    "${SANDBOX_IMAGE}" \
    bash -c "${COMMAND}"
