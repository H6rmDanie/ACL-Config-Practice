import React, { useState } from 'react';
import {
  Target,
  Network,
  ArrowRightLeft,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LabScenario } from '../types/acl';

interface ObjectivesCardProps {
  scenario: LabScenario;
}

export const ObjectivesCard: React.FC<ObjectivesCardProps> = ({ scenario }) => {
  const [showTasks, setShowTasks] = useState(true);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Lab Objectives & Interface Placement
            </h2>
            <p className="text-[11px] text-slate-400">{scenario.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300">
            <Network className="w-3 h-3 text-cyan-400" />
            {scenario.targetInterface}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-700/50 text-indigo-300">
            <ArrowRightLeft className="w-3 h-3" />
            {scenario.direction}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 mb-2">
        {scenario.objective}
      </p>

      {scenario.tasks && scenario.tasks.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowTasks((prev) => !prev)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-200 py-1 transition"
          >
            <span className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              CCNA Verification Requirements ({scenario.tasks.length} Tasks)
            </span>
            {showTasks ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTasks && (
            <ul className="mt-1 space-y-1 text-[11px] text-slate-300 pl-1">
              {scenario.tasks.map((task, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-snug">
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 rounded px-1 mt-0.5 shrink-0">
                    {idx + 1}
                  </span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
