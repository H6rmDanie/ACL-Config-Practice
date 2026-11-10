import React from 'react';
import {
  Terminal,
  ShieldCheck,
  Activity,
  Binary,
  ListChecks,
  ArrowRight,
  Award,
  Network,
  Play,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { LabScenario } from '../types/acl';

interface LandingPageProps {
  scenarios: LabScenario[];
  onLaunchApp: () => void;
  onStartScenario: (scenarioId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  scenarios,
  onLaunchApp,
  onStartScenario,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-base font-bold tracking-tight text-slate-100">
                Cisco ACL Lab Studio
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                CCNA 200-301 Aligned
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLaunchApp}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 transition active:scale-[0.99]"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-900 py-14 sm:py-20 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero-Setup Client-Side Packet Filter Workbench</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-50 leading-tight">
                Master Cisco IOS{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-400">
                  Access Control Lists
                </span>{' '}
                Through Live Packet Tracing.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                An interactive, zero-setup browser simulator built for CCNA
                200-301 candidates. Practice Standard, Extended, and Named ACL
                syntax, visualize real-time packet traversal across network
                topologies, and verify your rules against automated edge cases.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onLaunchApp}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-md shadow-cyan-500/15 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Launch Simulator
                </button>
                <a
                  href="#scenarios"
                  className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-semibold transition"
                >
                  Browse Lab Scenarios ({scenarios.length})
                </a>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Standard &amp; Extended ACEs
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  32-Bit Wildcard Mask Evaluator
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  First-Match &amp; Implicit Deny Trace
                </span>
              </div>
            </div>

            {/* Right Interactive Terminal Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ml-2 text-[11px] font-mono text-slate-400">
                      R1(config-ext-nacl)#
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    Gi0/0 INBOUND
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 font-mono text-xs space-y-1.5 leading-relaxed">
                  <div>
                    <span className="text-sky-400 font-semibold">
                      ip access-list extended
                    </span>{' '}
                    <span className="text-slate-200">DMZ_ISOLATION</span>
                  </div>
                  <div>
                    <span className="text-orange-300"> 10</span>{' '}
                    <span className="text-emerald-400 font-bold">permit</span>{' '}
                    <span className="text-violet-400 font-semibold">tcp</span>{' '}
                    <span className="text-cyan-200">192.168.1.0 0.0.0.255</span>{' '}
                    <span className="text-amber-300 font-semibold">host</span>{' '}
                    <span className="text-cyan-200">10.0.0.10</span>{' '}
                    <span className="text-amber-300 font-semibold">eq</span>{' '}
                    <span className="text-orange-300">80</span>
                  </div>
                  <div>
                    <span className="text-orange-300"> 20</span>{' '}
                    <span className="text-emerald-400 font-bold">permit</span>{' '}
                    <span className="text-violet-400 font-semibold">tcp</span>{' '}
                    <span className="text-cyan-200">192.168.1.0 0.0.0.255</span>{' '}
                    <span className="text-amber-300 font-semibold">host</span>{' '}
                    <span className="text-cyan-200">10.0.0.10</span>{' '}
                    <span className="text-amber-300 font-semibold">eq</span>{' '}
                    <span className="text-orange-300">443</span>
                  </div>
                  <div>
                    <span className="text-orange-300"> 30</span>{' '}
                    <span className="text-rose-400 font-bold">deny</span>{' '}
                    <span className="text-sky-400 font-semibold">ip</span>{' '}
                    <span className="text-amber-300 font-semibold">any any</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/35 border border-emerald-500/40 font-mono text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span>TRACE: 192.168.1.10:51240 → 10.0.0.10:443 [TCP]</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px]">
                      MATCH SEQ 20
                    </span>
                  </div>
                  <p className="text-slate-300 text-[10px]">
                    Bitwise Mask: (192.168.1.10 &amp; ~0.0.0.255) == 192.168.1.0 →
                    PERMIT
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-12 px-6 border-b border-slate-900 bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Built for Deep CCNA Exam Readiness
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Everything you need to understand packet filtering, wildcard
                masking, and sequential ACE evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  Visual SVG Packet Tracing
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Watch custom or preset packets traverse hosts, routers, and DMZ
                  servers with animated ingress and egress flow paths.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  CLI &amp; Tabular Dual Editor
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Write authentic Cisco IOS ACL syntax with live highlighting or
                  switch to the bidirectionally synced tabular ACE rule editor.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Binary className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  Bitwise Wildcard Math
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  True 32-bit unsigned IPv4 bitwise wildcard evaluation with
                  automatic normalization for <code className="text-amber-300">host</code> and{' '}
                  <code className="text-amber-300">any</code> keywords.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ListChecks className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  Automated Test Suite
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Verify your ACL against realistic CCNA lab requirements,
                  including L4 ports, TCP <code className="text-emerald-300">established</code>, and implicit deny.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Scenario Preview Cards Section */}
        <section id="scenarios" className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                  Interactive CCNA Lab Scenarios
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Select a scenario below to open a clean lab workspace and test
                  your ACL configuration from scratch.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {scenarios.map((scenario, idx) => {
                const badgeStyle =
                  scenario.difficulty === 'CCNA Fundamental'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : scenario.difficulty === 'CCNA Intermediate'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

                return (
                  <div
                    key={scenario.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-5 flex flex-col justify-between transition group shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase text-cyan-400">
                          Lab 0{idx + 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeStyle}`}
                        >
                          <Award className="w-3 h-3" />
                          {scenario.difficulty}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition">
                        {scenario.title}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {scenario.objective}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <Network className="w-3.5 h-3.5 text-cyan-400" />
                          {scenario.targetInterface} ({scenario.direction.toUpperCase()})
                        </span>
                        <span>{scenario.testCases.length} Test Cases</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onStartScenario(scenario.id)}
                        className="w-full py-2 px-3 rounded-lg bg-slate-800 group-hover:bg-cyan-500 text-slate-100 group-hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <span>Start Lab</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-5 px-6 text-center text-xs text-slate-500">
        Cisco ACL Lab Studio • Interactive Client-Side CCNA 200-301 Practice
        Environment
      </footer>
    </div>
  );
};
