import React from 'react';
import {
  ListChecks,
  FileSearch,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Crosshair,
} from 'lucide-react';
import { ACLRule, TestCase, TraceResult } from '../types/acl';
import { formatRuleAddress } from '../utils/ipEngine';

export interface EvaluatedTestCase {
  testCase: TestCase;
  trace: TraceResult;
  passed: boolean;
}

interface EvaluationPanelProps {
  activeTab: 'trace' | 'suite';
  onChangeTab: (tab: 'trace' | 'suite') => void;
  activeTrace: TraceResult | null;
  testResults: EvaluatedTestCase[];
  onInspectTestCase: (evaluated: EvaluatedTestCase) => void;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  activeTab,
  onChangeTab,
  activeTrace,
  testResults,
  onInspectTestCase,
}) => {
  const passCount = testResults.filter((r) => r.passed).length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
      {/* Tab Header */}
      <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg p-0.5 bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => onChangeTab('trace')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'trace'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            Manual Trace Log
            {activeTrace && (
              <span
                className={`text-[10px] font-mono px-1.5 rounded uppercase ${
                  activeTab === 'trace'
                    ? 'bg-slate-950/20 text-slate-950'
                    : activeTrace.finalAction === 'permit'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {activeTrace.finalAction}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('suite')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'suite'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            Automated Test Suite Results
            <span
              className={`text-[10px] font-mono px-1.5 rounded-full ${
                activeTab === 'suite'
                  ? 'bg-slate-950/25 text-slate-950'
                  : passCount === testResults.length
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {passCount}/{testResults.length}
            </span>
          </button>
        </div>

        {/* Summary Pill */}
        {activeTab === 'trace' && activeTrace && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">
              Packet:{' '}
              <strong className="text-cyan-300">{activeTrace.packet.srcIp}</strong>
              {activeTrace.packet.srcPort ? `:${activeTrace.packet.srcPort}` : ''} →{' '}
              <strong className="text-cyan-300">{activeTrace.packet.dstIp}</strong>
              {activeTrace.packet.dstPort ? `:${activeTrace.packet.dstPort}` : ''} [
              <span className="uppercase text-violet-300">
                {activeTrace.packet.protocol}
              </span>
              ]
            </span>
          </div>
        )}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-auto p-3 bg-slate-950/80">
        {activeTab === 'trace' ? (
          !activeTrace ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-6">
              <FileSearch className="w-7 h-7 mb-2 text-slate-600" />
              <p>
                Click <strong>Inject & Trace Packet</strong> or select a preset to
                inspect sequential ACE bitwise matching.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Final Verdict Banner */}
              <div
                className={`p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 ${
                  activeTrace.finalAction === 'permit'
                    ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/35 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTrace.finalAction === 'permit' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-xs font-semibold">
                    Final Forwarding Verdict:{' '}
                    <span className="uppercase font-mono font-bold underline">
                      {activeTrace.finalAction}
                    </span>
                  </span>
                </div>
                <span className="text-[11px] font-mono">
                  {activeTrace.matchedRuleIndex !== null
                    ? `Halted at ACE #${activeTrace.matchedRuleIndex + 1} (First-Match Rule)`
                    : 'Halted at End-of-ACL Implicit Deny'}
                </span>
              </div>

              {/* Step-by-Step Sequential Evaluation List */}
              <div className="space-y-1.5">
                {activeTrace.steps.map((step, idx) => {
                  const ruleObj: ACLRule | null =
                    step.rule === 'implicit-deny' ? null : step.rule;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border font-mono text-xs transition ${
                        step.matched
                          ? step.action === 'permit'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100'
                            : 'bg-rose-500/10 border-rose-500/50 text-rose-100'
                          : 'bg-slate-900/70 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              step.matched
                                ? step.action === 'permit'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-rose-500 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {step.matched ? `MATCH → ${step.action}` : 'NO MATCH'}
                          </span>
                          <span className="text-slate-200 font-semibold">
                            {!ruleObj
                              ? '[Implicit] deny ip any any'
                              : `[Seq ${ruleObj.sequenceNumber}] ${ruleObj.action} ${
                                  ruleObj.protocol
                                } ${formatRuleAddress(
                                  ruleObj.srcIp,
                                  ruleObj.srcWildcard
                                )} ${
                                  ruleObj.isStandard
                                    ? ''
                                    : formatRuleAddress(
                                        ruleObj.dstIp,
                                        ruleObj.dstWildcard
                                      )
                                }${
                                  ruleObj.dstPort !== undefined
                                    ? ` eq ${ruleObj.dstPort}`
                                    : ''
                                }${ruleObj.established ? ' established' : ''}${
                                  ruleObj.icmpType ? ` ${ruleObj.icmpType}` : ''
                                }`}
                          </span>
                        </div>

                        {/* Granular Bitwise & Header Check Badges */}
                        {step.details && ruleObj && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                step.details.protocolMatch
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                              }`}
                            >
                              Proto {step.details.protocolMatch ? '✓' : '✗'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                step.details.srcMatch
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                              }`}
                            >
                              SrcMask {step.details.srcMatch ? '✓' : '✗'}
                            </span>
                            {!ruleObj.isStandard && (
                              <span
                                className={`px-1.5 py-0.5 rounded border ${
                                  step.details.dstMatch
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                }`}
                              >
                                DstMask {step.details.dstMatch ? '✓' : '✗'}
                              </span>
                            )}
                            {(ruleObj.dstPort !== undefined ||
                              ruleObj.established ||
                              ruleObj.icmpType) && (
                              <span
                                className={`px-1.5 py-0.5 rounded border ${
                                  step.details.portMatch && step.details.flagsMatch
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                }`}
                              >
                                L4/Flags{' '}
                                {step.details.portMatch && step.details.flagsMatch
                                  ? '✓'
                                  : '✗'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 leading-snug">
                        {step.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* Automated Test Suite Results View */
          <div className="space-y-2">
            {testResults.map((item) => {
              const { testCase, trace, passed } = item;
              const matchedStep = trace.steps[trace.steps.length - 1];
              const lastRule = matchedStep.rule;
              const matchedRuleLabel =
                lastRule === 'implicit-deny'
                  ? 'Implicit Deny'
                  : `Seq ${lastRule.sequenceNumber}`;

              return (
                <div
                  key={testCase.id}
                  className={`p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 transition ${
                    passed
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-rose-950/25 border-rose-500/40 hover:border-rose-500/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-100">
                          {testCase.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span>{testCase.packet.srcIp}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span>
                          {testCase.packet.dstIp}
                          {testCase.packet.dstPort ? `:${testCase.packet.dstPort}` : ''}
                        </span>
                        <span className="uppercase text-violet-300">
                          [{testCase.packet.protocol}
                          {testCase.packet.established ? ' ACK' : ''}]
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>
                          Expected:{' '}
                          <strong
                            className={
                              testCase.expectedAction === 'permit'
                                ? 'text-emerald-400 uppercase'
                                : 'text-rose-400 uppercase'
                            }
                          >
                            {testCase.expectedAction}
                          </strong>
                        </span>
                        <span>
                          Actual:{' '}
                          <strong
                            className={
                              trace.finalAction === 'permit'
                                ? 'text-emerald-400 uppercase'
                                : 'text-rose-400 uppercase'
                            }
                          >
                            {trace.finalAction}
                          </strong>{' '}
                          ({matchedRuleLabel})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInspectTestCase(item)}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 shrink-0 transition"
                  >
                    <Crosshair className="w-3 h-3" />
                    Inspect Trace
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
