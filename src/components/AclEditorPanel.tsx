import React, { useRef, useState } from 'react';
import {
  Terminal,
  Table2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  Code2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';
import { ACLRule, Action, LabScenario, Protocol } from '../types/acl';
import {
  formatSingleRuleCli,
  ParseError,
  rulesToCliText,
} from '../utils/aclParser';
import { isValidIpv4 } from '../utils/ipEngine';

interface AclEditorPanelProps {
  cliText: string;
  onChangeCliText: (text: string) => void;
  rules: ACLRule[];
  parseErrors: ParseError[];
  aclHeader?: string;
  isStandardAcl: boolean;
  scenario: LabScenario;
  matchedRuleIndex: number | null;
  showSolution: boolean;
  onToggleSolution: () => void;
  onLoadSolution: () => void;
}

function highlightIosLine(line: string): React.ReactNode {
  const trimmed = line.trim();
  if (!trimmed) return <span>&nbsp;</span>;
  if (
    trimmed.startsWith('!') ||
    trimmed.startsWith('#') ||
    trimmed.toLowerCase().startsWith('remark')
  ) {
    return <span className="text-slate-500 italic">{line}</span>;
  }

  // Split preserving whitespace tokens
  const parts = line.split(/(\s+)/);

  return parts.map((part, idx) => {
    if (/^\s+$/.test(part)) {
      return <span key={idx}>{part}</span>;
    }
    const lower = part.toLowerCase();

    if (lower === 'permit') {
      return (
        <span key={idx} className="text-emerald-400 font-bold">
          {part}
        </span>
      );
    }
    if (lower === 'deny') {
      return (
        <span key={idx} className="text-rose-400 font-bold">
          {part}
        </span>
      );
    }
    if (
      lower === 'ip' ||
      lower === 'access-list' ||
      lower === 'extended' ||
      lower === 'standard'
    ) {
      return (
        <span key={idx} className="text-sky-400 font-semibold">
          {part}
        </span>
      );
    }
    if (lower === 'tcp' || lower === 'udp' || lower === 'icmp') {
      return (
        <span key={idx} className="text-violet-400 font-semibold">
          {part}
        </span>
      );
    }
    if (
      lower === 'host' ||
      lower === 'any' ||
      lower === 'eq' ||
      lower === 'established' ||
      lower === 'echo' ||
      lower === 'echo-reply'
    ) {
      return (
        <span key={idx} className="text-amber-300 font-semibold">
          {part}
        </span>
      );
    }
    if (isValidIpv4(part)) {
      return (
        <span key={idx} className="text-cyan-200">
          {part}
        </span>
      );
    }
    if (/^\d+$/.test(part)) {
      return (
        <span key={idx} className="text-orange-300">
          {part}
        </span>
      );
    }
    return (
      <span key={idx} className="text-slate-200">
        {part}
      </span>
    );
  });
}

export const AclEditorPanel: React.FC<AclEditorPanelProps> = ({
  cliText,
  onChangeCliText,
  rules,
  parseErrors,
  aclHeader,
  isStandardAcl,
  scenario,
  matchedRuleIndex,
  showSolution,
  onToggleSolution,
  onLoadSolution,
}) => {
  const [editorMode, setEditorMode] = useState<'cli' | 'table'>('cli');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  const handleScrollSync = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const syncRulesToCli = (updatedRules: ACLRule[]) => {
    const newText = rulesToCliText(updatedRules, aclHeader);
    onChangeCliText(newText);
  };

  const handleUpdateRule = (index: number, patch: Partial<ACLRule>) => {
    const sorted = [...rules].sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );
    const target = { ...sorted[index], ...patch };
    target.rawText = formatSingleRuleCli(target, aclHeader).trim();
    sorted[index] = target;
    syncRulesToCli(sorted);
  };

  const handleDeleteRule = (index: number) => {
    const sorted = [...rules].sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );
    sorted.splice(index, 1);
    syncRulesToCli(sorted);
  };

  const handleMoveRule = (index: number, direction: -1 | 1) => {
    const sorted = [...rules].sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const seqA = sorted[index].sequenceNumber;
    const seqB = sorted[swapIdx].sequenceNumber;
    sorted[index] = { ...sorted[index], sequenceNumber: seqB };
    sorted[swapIdx] = { ...sorted[swapIdx], sequenceNumber: seqA };
    syncRulesToCli(sorted);
  };

  const handleAddRule = () => {
    const sorted = [...rules].sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );
    const maxSeq = sorted.reduce((max, r) => Math.max(max, r.sequenceNumber), 0);
    const nextSeq = Math.floor((maxSeq + 10) / 10) * 10;

    const newRule: ACLRule = {
      id: `rule-${nextSeq}-${Date.now()}`,
      sequenceNumber: nextSeq,
      rawText: '',
      action: 'permit',
      protocol: isStandardAcl ? 'ip' : 'tcp',
      srcIp: '192.168.1.0',
      srcWildcard: '0.0.0.255',
      dstIp: '0.0.0.0',
      dstWildcard: '255.255.255.255',
      dstPort: isStandardAcl ? undefined : 80,
      aclHeader:
        aclHeader ||
        (isStandardAcl
          ? 'access-list 10'
          : 'ip access-list extended LAB_ACL'),
      isStandard: isStandardAcl,
    };
    newRule.rawText = formatSingleRuleCli(newRule, aclHeader).trim();
    syncRulesToCli([...sorted, newRule]);
  };

  const appendSnippet = (snippet: string) => {
    const base = cliText.trimEnd();
    onChangeCliText(base ? `${base}\n${snippet}` : snippet);
  };

  const cliLines = cliText.split(/\r?\n/);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
      {/* Top Toolbar: Dual-Mode Toggle & Quick Actions */}
      <div className="px-3.5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg p-0.5 bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setEditorMode('cli')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                editorMode === 'cli'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              CLI Terminal
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('table')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                editorMode === 'table'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Tabular Rule Editor
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  editorMode === 'table'
                    ? 'bg-slate-950/25 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {rules.length}
              </span>
            </button>
          </div>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-1 rounded">
            <Code2 className="w-3 h-3 text-cyan-400" />
            {aclHeader || 'Extended / Standard IOS ACL'}
          </span>
        </div>

        {/* Right Controls: Optional Solution Viewer Toggle + Add ACE */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSolution}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              showSolution
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Reveal or hide the reference CCNA solution for this scenario"
          >
            {showSolution ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Hide Solution</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Show Solution</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleAddRule}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add ACE
          </button>
        </div>
      </div>

      {/* Optional Collapsible Reference Solution Viewer */}
      {showSolution && (
        <div className="px-3.5 py-2.5 bg-amber-950/25 border-b border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 mb-1">
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <span>Reference IOS Solution (Unlocked)</span>
            </div>
            <pre className="text-[11px] font-mono bg-slate-950/90 border border-amber-500/20 rounded-lg p-2 overflow-x-auto leading-5">
              {scenario.solutionAclText.split(/\r?\n/).map((line, i) => (
                <div key={i}>{highlightIosLine(line)}</div>
              ))}
            </pre>
          </div>
          <div className="shrink-0 flex sm:flex-col gap-1.5">
            <button
              type="button"
              onClick={onLoadSolution}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Unlock className="w-3.5 h-3.5" />
              Load Answer into Editor
            </button>
          </div>
        </div>
      )}

      {/* Main Editor Content */}
      {editorMode === 'cli' ? (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          {/* IOS Prompt Header */}
          <div className="px-3.5 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              R1(config)# <span className="text-cyan-400">show access-lists</span> — Bidirectional IOS Buffer
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Quick Insert:</span>
              <button
                type="button"
                onClick={() =>
                  appendSnippet(
                    isStandardAcl
                      ? 'access-list 10 permit host 192.168.10.5'
                      : ' permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.10 eq 80'
                  )
                }
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300"
              >
                + permit
              </button>
              <button
                type="button"
                onClick={() =>
                  appendSnippet(
                    isStandardAcl ? 'access-list 10 deny any' : ' deny ip any any'
                  )
                }
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300"
              >
                + deny any
              </button>
            </div>
          </div>

          {/* Layered Syntax Highlighting Terminal Editor */}
          <div className="relative flex-1 min-h-[190px] font-mono text-xs overflow-hidden flex">
            {/* Line Numbers Gutter */}
            <div className="w-10 py-3 bg-slate-900/50 border-r border-slate-800/80 text-right pr-2 select-none text-slate-500 text-xs leading-6 shrink-0">
              {cliLines.map((_, idx) => {
                const hasError = parseErrors.some(
                  (e) => e.lineNumber === idx + 1
                );
                return (
                  <div
                    key={idx}
                    className={hasError ? 'text-rose-400 font-bold' : ''}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            {/* Highlighted Backdrop + Editable Textarea */}
            <div className="relative flex-1 overflow-hidden">
              <pre
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 m-0 py-3 px-3.5 font-mono text-xs leading-6 whitespace-pre overflow-auto pointer-events-none select-none"
              >
                {cliLines.map((line, idx) => {
                  const hasError = parseErrors.some(
                    (e) => e.lineNumber === idx + 1
                  );
                  return (
                    <div
                      key={idx}
                      className={`min-h-[24px] ${
                        hasError ? 'bg-rose-500/15 -mx-3.5 px-3.5' : ''
                      }`}
                    >
                      {highlightIosLine(line)}
                    </div>
                  );
                })}
              </pre>

              <textarea
                ref={textareaRef}
                value={cliText}
                onChange={(e) => onChangeCliText(e.target.value)}
                onScroll={handleScrollSync}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                aria-label="Cisco IOS ACL CLI Editor"
                placeholder="! Enter your Cisco IOS ACL configuration here..."
                className="absolute inset-0 w-full h-full m-0 py-3 px-3.5 font-mono text-xs leading-6 whitespace-pre bg-transparent text-transparent caret-cyan-400 resize-none focus:outline-none overflow-auto selection:bg-cyan-500/25"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Tabular Rule Editor Mode (Bidirectionally Synced) */
        <div className="flex-1 overflow-auto bg-slate-950 p-2.5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-2 px-2 w-16">Seq #</th>
                <th className="py-2 px-2 w-24">Action</th>
                <th className="py-2 px-2 w-20">Proto</th>
                <th className="py-2 px-2">Source IP / Wildcard</th>
                <th className="py-2 px-2">Destination IP / Wildcard</th>
                <th className="py-2 px-2 w-24">Dst Port</th>
                <th className="py-2 px-2 w-24">Options</th>
                <th className="py-2 px-2 text-right w-20">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs font-mono">
              {rules.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 px-4 text-center text-slate-400 font-sans text-xs"
                  >
                    No explicit ACE rules configured yet. Click{' '}
                    <strong className="text-emerald-300">+ Add ACE</strong> or type
                    commands in the{' '}
                    <strong className="text-cyan-300">CLI Terminal</strong> to
                    build your ACL.
                  </td>
                </tr>
              ) : (
                rules.map((rule, idx) => {
                  const isMatchedRow = matchedRuleIndex === idx;
                  return (
                    <tr
                      key={rule.id}
                      className={`transition ${
                        isMatchedRow
                          ? 'bg-cyan-500/10'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Sequence Number */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min={1}
                          step={10}
                          value={rule.sequenceNumber}
                          onChange={(e) =>
                            handleUpdateRule(idx, {
                              sequenceNumber: Math.max(
                                1,
                                parseInt(e.target.value || '10', 10)
                              ),
                            })
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-orange-300 focus:outline-none focus:border-cyan-500"
                        />
                      </td>

                      {/* Action */}
                      <td className="py-2 px-2">
                        <select
                          value={rule.action}
                          onChange={(e) =>
                            handleUpdateRule(idx, {
                              action: e.target.value as Action,
                            })
                          }
                          className={`bg-slate-900 border rounded px-2 py-1 text-xs font-bold uppercase focus:outline-none ${
                            rule.action === 'permit'
                              ? 'border-emerald-500/40 text-emerald-400'
                              : 'border-rose-500/40 text-rose-400'
                          }`}
                        >
                          <option value="permit">PERMIT</option>
                          <option value="deny">DENY</option>
                        </select>
                      </td>

                      {/* Protocol */}
                      <td className="py-2 px-2">
                        <select
                          value={rule.protocol}
                          disabled={Boolean(rule.isStandard)}
                          onChange={(e) => {
                            const proto = e.target.value as Protocol;
                            handleUpdateRule(idx, {
                              protocol: proto,
                              dstPort:
                                proto === 'tcp' || proto === 'udp'
                                  ? rule.dstPort
                                  : undefined,
                              established:
                                proto === 'tcp' ? rule.established : undefined,
                              icmpType:
                                proto === 'icmp' ? rule.icmpType : undefined,
                            });
                          }}
                          className="bg-slate-900 border border-slate-700 disabled:opacity-40 rounded px-2 py-1 text-xs uppercase text-violet-300 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="tcp">TCP</option>
                          <option value="udp">UDP</option>
                          <option value="icmp">ICMP</option>
                          <option value="ip">IP</option>
                        </select>
                      </td>

                      {/* Source IP & Wildcard */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={rule.srcIp}
                            onChange={(e) =>
                              handleUpdateRule(idx, {
                                srcIp: e.target.value.trim(),
                              })
                            }
                            placeholder="Src IP"
                            className="w-28 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-cyan-200 focus:outline-none focus:border-cyan-500"
                          />
                          <input
                            type="text"
                            value={rule.srcWildcard}
                            onChange={(e) =>
                              handleUpdateRule(idx, {
                                srcWildcard: e.target.value.trim(),
                              })
                            }
                            placeholder="Wildcard"
                            className="w-28 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="button"
                            title="Set Source to host (0.0.0.0)"
                            onClick={() =>
                              handleUpdateRule(idx, { srcWildcard: '0.0.0.0' })
                            }
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                          >
                            host
                          </button>
                          <button
                            type="button"
                            title="Set Source to any (0.0.0.0 255.255.255.255)"
                            onClick={() =>
                              handleUpdateRule(idx, {
                                srcIp: '0.0.0.0',
                                srcWildcard: '255.255.255.255',
                              })
                            }
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                          >
                            any
                          </button>
                        </div>
                      </td>

                      {/* Destination IP & Wildcard */}
                      <td className="py-2 px-2">
                        {rule.isStandard ? (
                          <span className="text-[11px] text-slate-500 italic">
                            any (Standard ACL)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={rule.dstIp}
                              onChange={(e) =>
                                handleUpdateRule(idx, {
                                  dstIp: e.target.value.trim(),
                                })
                              }
                              placeholder="Dst IP"
                              className="w-28 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-cyan-200 focus:outline-none focus:border-cyan-500"
                            />
                            <input
                              type="text"
                              value={rule.dstWildcard}
                              onChange={(e) =>
                                handleUpdateRule(idx, {
                                  dstWildcard: e.target.value.trim(),
                                })
                              }
                              placeholder="Wildcard"
                              className="w-28 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                            />
                            <button
                              type="button"
                              title="Set Destination to host (0.0.0.0)"
                              onClick={() =>
                                handleUpdateRule(idx, {
                                  dstWildcard: '0.0.0.0',
                                })
                              }
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                            >
                              host
                            </button>
                            <button
                              type="button"
                              title="Set Destination to any (0.0.0.0 255.255.255.255)"
                              onClick={() =>
                                handleUpdateRule(idx, {
                                  dstIp: '0.0.0.0',
                                  dstWildcard: '255.255.255.255',
                                })
                              }
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                            >
                              any
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Destination Port */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min={1}
                          max={65535}
                          disabled={
                            Boolean(rule.isStandard) ||
                            (rule.protocol !== 'tcp' && rule.protocol !== 'udp')
                          }
                          value={rule.dstPort ?? ''}
                          onChange={(e) =>
                            handleUpdateRule(idx, {
                              dstPort: e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            })
                          }
                          placeholder="any"
                          className="w-20 bg-slate-900 border border-slate-700 disabled:opacity-40 rounded px-1.5 py-1 text-xs text-orange-300 focus:outline-none focus:border-cyan-500"
                        />
                      </td>

                      {/* Options (established / icmpType) */}
                      <td className="py-2 px-2">
                        {rule.protocol === 'tcp' && !rule.isStandard ? (
                          <label className="inline-flex items-center gap-1 text-[10px] text-amber-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(rule.established)}
                              onChange={(e) =>
                                handleUpdateRule(idx, {
                                  established: e.target.checked || undefined,
                                })
                              }
                              className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                            />
                            estab
                          </label>
                        ) : rule.protocol === 'icmp' && !rule.isStandard ? (
                          <select
                            value={rule.icmpType ?? ''}
                            onChange={(e) =>
                              handleUpdateRule(idx, {
                                icmpType: (e.target.value || undefined) as
                                  | 'echo'
                                  | 'echo-reply'
                                  | undefined,
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-amber-300"
                          >
                            <option value="">any</option>
                            <option value="echo">echo</option>
                            <option value="echo-reply">echo-reply</option>
                          </select>
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </td>

                      {/* Move Up / Down / Delete */}
                      <td className="py-2 px-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveRule(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                            title="Move rule up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRule(idx, 1)}
                            disabled={idx === rules.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                            title="Move rule down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(idx)}
                            className="p-1 rounded hover:bg-rose-950/60 text-rose-400"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Implicit Deny Footer Row */}
              <tr className="bg-slate-900/40 text-slate-500 italic">
                <td className="py-2 px-2">∞</td>
                <td className="py-2 px-2 text-rose-400/80 font-bold not-italic">
                  DENY
                </td>
                <td className="py-2 px-2">IP</td>
                <td className="py-2 px-2">0.0.0.0 / 255.255.255.255 (any)</td>
                <td className="py-2 px-2">0.0.0.0 / 255.255.255.255 (any)</td>
                <td className="py-2 px-2">any</td>
                <td className="py-2 px-2" colSpan={2}>
                  Implicit Deny (Cisco IOS Default)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Syntax Status / Error Bar */}
      <div className="px-3.5 py-2 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2 text-xs">
        {parseErrors.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              IOS Syntax Valid — <strong>{rules.length}</strong> active ACE rule
              {rules.length === 1 ? '' : 's'} + Implicit Deny active
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-rose-400 overflow-hidden">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate font-mono text-[11px]">
              Line {parseErrors[0].lineNumber}: {parseErrors[0].message}
            </span>
          </div>
        )}

        <span className="text-[11px] font-mono text-slate-400 shrink-0">
          Mode: {isStandardAcl ? 'Standard ACL (Src Only)' : 'Extended ACL (L3/L4)'}
        </span>
      </div>
    </div>
  );
};
