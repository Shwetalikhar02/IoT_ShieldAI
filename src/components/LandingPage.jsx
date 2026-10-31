import React from 'react'
import {
  Shield,
  Lock,
  Cpu,
  Terminal,
  CheckCircle2,
  Wand2,
  Sparkles,
  ArrowRight,
  Code2,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react'

export default function LandingPage({ onOpenAuth }) {
  const features = [
    {
      icon: AlertTriangle,
      title: 'AI-Powered Vulnerability Detection',
      desc: 'Pinpoints memory safety hazards, buffer overflows, format strings, and NULL dereferences in C/C++ firmware before deployment.'
    },
    {
      icon: Lock,
      title: 'CWE-Based Security Analysis',
      desc: 'Classifies findings across canonical embedded taxonomies (CWE-121, CWE-134, CWE-476, CWE-416) with CVSS v3.1 severity metrics.'
    },
    {
      icon: Wand2,
      title: 'Deterministic & AI Code Repair',
      desc: 'Synthesizes bounded, memory-safe code fixes using deterministic templates and contextual LLM refinement designed for microcontrollers.'
    },
    {
      icon: Terminal,
      title: 'Compiler & Sandbox Verification',
      desc: 'Validates every patch candidate against strict GCC -Wall flags, AddressSanitizer (ASan), UBSan, and anti-cheating AST gates.'
    },
    {
      icon: Sparkles,
      title: 'Context-Aware AI Security Assistant',
      desc: 'Interactive senior firmware security co-pilot powered by Gemini 3.8 Flash, grounded in your target architecture and active findings.'
    },
    {
      icon: Cpu,
      title: 'Resource Footprint Monitoring',
      desc: 'Tracks ROM/Flash binary size delta and SRAM stack growth to ensure code remains within strict MCU hardware boundaries.'
    }
  ]

  const supportedArchitectures = [
    'ARM Cortex-M0/M3/M4/M7',
    'Espressif ESP32 (Xtensa)',
    'RISC-V RV32 / RV64',
    'TI MSP430 & Microchip PIC',
    'POSIX / Embedded Linux'
  ]

  return (
    <div className="min-h-screen bg-[#101310] text-[#F3F5EF] flex flex-col font-sans selection:bg-[#B7E36A]/20 selection:text-[#B7E36A]">
      {/* Header Navigation */}
      <header className="h-16 border-b border-[#2B332D] bg-[#101310]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#181D19] border border-[#2B332D] flex items-center justify-center text-[#B7E36A] shadow-sm">
            <Shield className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-[#F3F5EF]">CodeShield AI</span>
            <span className="text-[10px] text-[#9AA39B] font-mono ml-2 px-1.5 py-0.5 rounded bg-[#181D19] border border-[#2B332D]">
              FIRMWARE DEFENSE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('login')}
            className="btn-quiet text-xs font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth('signup')}
            className="btn-lime text-xs font-semibold"
          >
            Create Free Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181D19] border border-[#2B332D] text-xs font-mono text-[#B7E36A]">
          <span className="w-2 h-2 rounded-full bg-[#B7E36A] animate-pulse" />
          <span>Next-Generation Firmware Security Platform</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#F3F5EF] max-w-3xl mx-auto leading-tight">
          Secure Your Firmware. <br />
          <span className="text-[#B7E36A]">Detect Vulnerabilities</span> Before They Become Threats.
        </h1>

        <p className="text-base text-[#9AA39B] max-w-2xl mx-auto leading-relaxed">
          The autonomous security workbench for embedded developers. Detect memory safety flaws,
          synthesize bounded C patches, and formally verify code with GCC, AddressSanitizer, and anti-cheating AST gates.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onOpenAuth('signup')}
            className="btn-lime text-sm font-semibold !py-2.5 !px-6 flex items-center gap-2 shadow-lg shadow-[#B7E36A]/10"
          >
            <span>Get Started with CodeShield</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="btn-quiet text-sm font-medium !py-2.5 !px-5"
          >
            Sign In to Existing Project
          </button>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="pt-2">
          <button
            onClick={() => onOpenAuth('demo')}
            className="text-xs font-mono text-[#9AA39B] hover:text-[#B7E36A] transition-colors underline"
          >
            Instant Demo Access: Explore sample IoT projects without registration →
          </button>
        </div>
      </section>

      {/* Target Architectures Bar */}
      <section className="border-y border-[#2B332D] bg-[#181D19]/50 py-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#9AA39B]">
          <span className="text-[#626D64] uppercase tracking-wider text-[11px] font-sans">Target Architectures:</span>
          {supportedArchitectures.map((arch) => (
            <div key={arch} className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#B7E36A]" />
              <span>{arch}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Key Feature Grid */}
      <section className="px-6 py-20 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-[#F3F5EF]">
            Comprehensive Embedded Security Pipeline
          </h2>
          <p className="text-xs text-[#9AA39B] max-w-lg mx-auto">
            From static AST analysis to runtime AddressSanitizer testing, CodeShield covers every step of the firmware lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#181D19] border border-[#2B332D] hover:border-[#B7E36A]/40 transition-all space-y-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#101310] border border-[#2B332D] flex items-center justify-center text-[#B7E36A] group-hover:bg-[#B7E36A]/10 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-[#F3F5EF]">{feat.title}</h3>
                <p className="text-xs text-[#9AA39B] leading-relaxed">{feat.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Closed-Loop Verification Section */}
      <section className="px-6 py-16 bg-[#181D19]/40 border-t border-[#2B332D]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-mono text-[#B7E36A] uppercase tracking-wider">
              Zero-Bypass Verification Gate
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#F3F5EF] leading-tight">
              Anti-Cheating AST Checks & Sanitizer Validation
            </h2>
            <p className="text-xs text-[#9AA39B] leading-relaxed">
              Unlike generic code models that delete vulnerable calls or insert unconditional returns, CodeShield's verification engine verifies semantic preservation, compiler warnings (-Werror), and AddressSanitizer exploit resistance before approving any fix.
            </p>
            <ul className="space-y-2 text-xs text-[#9AA39B]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#B7E36A]" />
                <span>Rejects early return; or exit(0) bypass heuristics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#B7E36A]" />
                <span>Enforces strict bounds check and null termination bytes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#B7E36A]" />
                <span>Protects hardware registers and bare-metal deterministic execution</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-[#101310] border border-[#2B332D] font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2B332D] text-[11px] text-[#9AA39B]">
              <span>Verification Sandbox Console</span>
              <span className="text-[#B7E36A]">● Active Monitor</span>
            </div>
            <div className="text-[11px] space-y-1.5 text-[#9AA39B]">
              <div className="text-[#B7E36A]">$ gcc -Wall -Wextra -Werror -fsanitize=address firmware.c</div>
              <div>[M3] Compiling patched syntax AST ... OK</div>
              <div>[M3] Running AddressSanitizer exploit test ... 0 memory errors</div>
              <div>[M3] Anti-Cheating check: 100% statements retained</div>
              <div className="text-[#B7E36A] font-semibold">✓ VERIFICATION PASSED — MCU READY</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#2B332D] bg-[#101310] py-8 px-6 text-xs text-[#626D64]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B7E36A]" />
            <span className="text-[#9AA39B] font-semibold">CodeShield AI</span>
            <span>— Embedded Firmware Vulnerability Detection & Repair</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>Problem Statement 15</span>
            <span>·</span>
            <span>Quiet Futurism Design</span>
            <span>·</span>
            <button
              onClick={() => onOpenAuth('login')}
              className="text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
