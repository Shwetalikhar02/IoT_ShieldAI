# IoT ShieldAI — Sandbox Docker Image
# =====================================
# Provides a reproducible Linux environment with all static analysis tools,
# compilers, and sanitizer-enabled builds.
#
# Tools included:
#   - gcc 12 + clang 15 (with ASan/UBSan support)
#   - cppcheck 2.x (static analysis)
#   - semgrep latest (pattern-based static analysis)
#   - valgrind (optional memory checking)
#
# Build:
#   docker build -t iot-shieldai-sandbox:latest ./sandbox/
#
# Run interactively:
#   docker run --rm -it -v $(pwd):/workspace iot-shieldai-sandbox:latest bash

FROM ubuntu:22.04

LABEL maintainer="IoT ShieldAI Team"
LABEL description="Sandbox for C/C++ firmware static analysis, compilation, and ASan/UBSan"

# Avoid interactive prompts during package install
ENV DEBIAN_FRONTEND=noninteractive

# ── System packages ──────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    clang \
    clang-tools \
    cppcheck \
    valgrind \
    python3 \
    python3-pip \
    curl \
    git \
    make \
    && rm -rf /var/lib/apt/lists/*

# ── Semgrep ──────────────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir semgrep

# ── Working directory ────────────────────────────────────────────────────────
WORKDIR /workspace

# ── Default ASan options ──────────────────────────────────────────────────────
ENV ASAN_OPTIONS="halt_on_error=0:detect_leaks=1"
ENV UBSAN_OPTIONS="print_stacktrace=1:halt_on_error=0"

# ── Entry point ──────────────────────────────────────────────────────────────
# The default entrypoint is bash; the backend invokes specific commands via
# docker exec or subprocess.  Do NOT hardcode a compile command here.
CMD ["/bin/bash"]
