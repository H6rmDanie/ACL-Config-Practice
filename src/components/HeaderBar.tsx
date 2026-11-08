import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Terminal,
  ChevronDown,
  Award,
} from 'lucide-react';
import { LabScenario } from '../types/acl';

interface HeaderBarProps {
  scenarios: LabScenario[];
  activeScenario: LabScenario;
  onSelectScenario: (scenarioId: string) => void;
  onVerifyLab: () => void;
  onResetScenario: () => void;
  passingCount: number;
  totalCount: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario,
  onVerifyLab,
  onResetScenario,
  passingCount,
  totalCount,
}) => {
  const allPassing = totalCount > 0 && passingCount === totalCount;

  const difficultyColor =
    activeScenario.difficulty === 'CCNA Fundamental'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : activeScenario.difficulty === 'CCNA Intermediate'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 flex items-center justify-between gap-4 shrink-0">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wide text-slate-100">
              CCNA 200-301 ACL Lab Simulator
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              IOS 15.x Engine
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Interactive Bitwise Wildcard & Sequential Packet Filter Workbench
          </p>
        </div>
      </div>

      {/* Scenario Selector Dropdown */}
      <div className="flex items-center gap-3 flex-1 max-w-xl justify-center">
        <div className="relative flex-1 max-w-md">
          <select
            aria-label="Select Lab Scenario"
            value={activeScenario.id}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="w-full appearance-none bg-slate-950 border border-slate-700 hover:border-cyan-500/50 text-slate-100 text-xs font-medium rounded-lg pl-3 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition"
          >
            {scenarios.map((s, idx) => (
              <option key={s.id} value={s.id}>
                Lab {idx + 1}: {s.title} ({s.difficulty})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <span
          className={`hidden lg:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${difficultyColor}`}
        >
          <Award className="w-3.5 h-3.5" />
          {activeScenario.difficulty}
        </span>
      </div>

      {/* Right Controls: Score Badge + Reset + Verify Lab */}
      <div className="flex items-center gap-2.5">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            allPassing
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950'
              : passingCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {allPassing ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="font-mono">
            {passingCount} / {totalCount} Test Cases Passing
          </span>
        </div>

        <button
          type="button"
          onClick={onResetScenario}
          title="Reset ACL to scenario initial configuration"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={onVerifyLab}
          className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 transition active:scale-[0.99]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Verify Lab
        </button>
      </div>
    </header>
  );
};
