import React from 'react';
import { Activity, ShieldCheck, ShieldX, MousePointerClick } from 'lucide-react';
import { LabScenario, TopologyNode, TraceResult } from '../types/acl';

interface TopologyDiagramProps {
  scenario: LabScenario;
  activeTrace: TraceResult | null;
  onSelectNodeIp?: (ip: string, role: 'src' | 'dst') => void;
}

function getPrefix24(ip: string): string {
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}` : ip;
}

function findMatchingNode(nodes: TopologyNode[], targetIp: string): TopologyNode | undefined {
  const exact = nodes.find((n) => n.ip === targetIp);
  if (exact) return exact;
  const prefix = getPrefix24(targetIp);
  return nodes.find((n) => getPrefix24(n.ip) === prefix);
}

export const TopologyDiagram: React.FC<TopologyDiagramProps> = ({
  scenario,
  activeTrace,
  onSelectNodeIp,
}) => {
  const { nodes, links } = scenario.topology;
  const routerNode = nodes.find((n) => n.type === 'router');

  const srcNode = activeTrace ? findMatchingNode(nodes, activeTrace.packet.srcIp) : undefined;
  const dstNode = activeTrace ? findMatchingNode(nodes, activeTrace.packet.dstIp) : undefined;
  const finalAction = activeTrace?.finalAction;

  // Convert percentage (0..100) to SVG canvas coordinates (600 x 260)
  const toSvgX = (pct: number) => Math.round((pct / 100) * 560 + 20);
  const toSvgY = (pct: number) => Math.round((pct / 100) * 220 + 20);

  const isIngressLink = (fromId: string, toId: string): boolean => {
    if (!srcNode || !routerNode) return false;
    return (
      (fromId === srcNode.id && toId === routerNode.id) ||
      (fromId === routerNode.id && toId === srcNode.id)
    );
  };

  const isEgressLink = (fromId: string, toId: string): boolean => {
    if (!dstNode || !routerNode || dstNode.id === routerNode.id) return false;
    return (
      (fromId === routerNode.id && toId === dstNode.id) ||
      (fromId === dstNode.id && toId === routerNode.id)
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Dynamic Network Topology
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <MousePointerClick className="w-3 h-3 text-cyan-400" />
              Click node to set Src IP • Shift+Click for Dst IP
            </p>
          </div>
        </div>

        {activeTrace && (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
              finalAction === 'permit'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {finalAction === 'permit' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldX className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>
              {activeTrace.packet.srcIp} → {activeTrace.packet.dstIp}:{' '}
              {finalAction?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Responsive SVG Canvas */}
      <div className="relative bg-slate-950/90 border border-slate-800/90 rounded-lg overflow-hidden">
        <svg
          viewBox="0 0 600 265"
          className="w-full h-56 select-none"
          role="img"
          aria-label="CCNA Lab Network Topology"
        >
          <defs>
            <pattern
              id="topo-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="rgba(148, 163, 184, 0.06)"
                strokeWidth="1"
              />
            </pattern>
            <style>{`
              @keyframes dashFlow {
                to {
                  stroke-dashoffset: -24;
                }
              }
              .animate-packet-flow {
                animation: dashFlow 0.75s linear infinite;
              }
            `}</style>
          </defs>

          <rect width="600" height="265" fill="url(#topo-grid)" />

          {/* Links */}
          {links.map((link, idx) => {
            const fromNode = nodes.find((n) => n.id === link.from);
            const toNode = nodes.find((n) => n.id === link.to);
            if (!fromNode || !toNode) return null;

            const x1 = toSvgX(fromNode.x);
            const y1 = toSvgY(fromNode.y);
            const x2 = toSvgX(toNode.x);
            const y2 = toSvgY(toNode.y);

            const ingress = isIngressLink(fromNode.id, toNode.id);
            const egress = isEgressLink(fromNode.id, toNode.id);

            let baseStroke = '#334155'; // slate-700
            let glowStroke = '';
            let isAnimated = false;

            if (ingress) {
              baseStroke = '#22d3ee'; // cyan-400 approaching ACL interface
              glowStroke = 'rgba(34, 211, 238, 0.25)';
              isAnimated = true;
            } else if (egress && finalAction === 'permit') {
              baseStroke = '#34d399'; // emerald-400 permitted forward path
              glowStroke = 'rgba(52, 211, 153, 0.25)';
              isAnimated = true;
            } else if (egress && finalAction === 'deny') {
              baseStroke = '#ef4444'; // rose-500 blocked path
              glowStroke = 'rgba(239, 68, 68, 0.15)';
              isAnimated = false;
            }

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={`${link.from}-${link.to}-${idx}`}>
                {glowStroke && (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={glowStroke}
                    strokeWidth={10}
                    strokeLinecap="round"
                  />
                )}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={baseStroke}
                  strokeWidth={ingress || egress ? 3 : 2}
                  strokeDasharray={
                    egress && finalAction === 'deny' ? '4 5' : undefined
                  }
                  opacity={egress && finalAction === 'deny' ? 0.55 : 1}
                />
                {isAnimated && (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#f8fafc"
                    strokeWidth={2.5}
                    strokeDasharray="6 18"
                    strokeLinecap="round"
                    className="animate-packet-flow"
                  />
                )}
                {link.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-34}
                      y={-9}
                      width={68}
                      height={16}
                      rx={4}
                      fill="#0f172a"
                      stroke={ingress || egress ? baseStroke : '#1e293b'}
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={2.5}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {link.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const cx = toSvgX(node.x);
            const cy = toSvgY(node.y);

            const isSrc = srcNode?.id === node.id;
            const isDst = dstNode?.id === node.id;
            const isRouter = node.type === 'router';

            let borderStroke = '#475569';
            let badgeBg = '#0f172a';
            if (isSrc) {
              borderStroke = '#22d3ee'; // cyan-400
              badgeBg = '#083344';
            } else if (isDst) {
              borderStroke =
                finalAction === 'permit' ? '#34d399' : '#f43f5e';
              badgeBg =
                finalAction === 'permit' ? '#064e3b' : '#4c0519';
            } else if (isRouter && activeTrace) {
              borderStroke =
                finalAction === 'permit' ? '#34d399' : '#f43f5e';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${cx}, ${cy})`}
                onClick={(e) => {
                  if (!onSelectNodeIp) return;
                  onSelectNodeIp(node.ip, e.shiftKey ? 'dst' : 'src');
                }}
                className="cursor-pointer group"
              >
                {/* Outer Pulse Ring if active */}
                {(isSrc || isDst || (isRouter && activeTrace)) && (
                  <circle
                    r={isRouter ? 32 : 26}
                    fill="none"
                    stroke={borderStroke}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    opacity={0.75}
                  />
                )}

                {/* Node Shape */}
                {node.type === 'router' ? (
                  <g>
                    <circle
                      r={24}
                      fill="#0f172a"
                      stroke={borderStroke}
                      strokeWidth={2.5}
                    />
                    {/* Router Cross Arrows Icon */}
                    <path
                      d="M-11 0 L11 0 M0 -11 L0 11 M-6 -5 L-11 0 L-6 5 M6 -5 L11 0 L6 5"
                      stroke="#38bdf8"
                      strokeWidth={1.8}
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* ACL Firewall Shield Tag on Router */}
                    <g transform="translate(0, -34)">
                      <rect
                        x={-48}
                        y={-9}
                        width={96}
                        height={17}
                        rx={8}
                        fill={
                          !activeTrace
                            ? '#1e1b4b'
                            : finalAction === 'permit'
                            ? '#064e3b'
                            : '#4c0519'
                        }
                        stroke={
                          !activeTrace
                            ? '#6366f1'
                            : finalAction === 'permit'
                            ? '#10b981'
                            : '#f43f5e'
                        }
                        strokeWidth={1.2}
                      />
                      <text
                        x={0}
                        y={2.5}
                        textAnchor="middle"
                        fill={
                          !activeTrace
                            ? '#c7d2fe'
                            : finalAction === 'permit'
                            ? '#6ee7b7'
                            : '#fda4af'
                        }
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {!activeTrace
                          ? `ACL: ${node.interfaceLabel || scenario.targetInterface}`
                          : `ACL ${finalAction?.toUpperCase()}`}
                      </text>
                    </g>
                  </g>
                ) : node.type === 'server' ? (
                  <g>
                    <rect
                      x={-21}
                      y={-21}
                      width={42}
                      height={42}
                      rx={8}
                      fill={badgeBg}
                      stroke={borderStroke}
                      strokeWidth={2.2}
                    />
                    {/* Server Rack Stacks */}
                    <rect
                      x={-12}
                      y={-11}
                      width={24}
                      height={6}
                      rx={1.5}
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth={1.5}
                    />
                    <rect
                      x={-12}
                      y={-2}
                      width={24}
                      height={6}
                      rx={1.5}
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth={1.5}
                    />
                    <rect
                      x={-12}
                      y={7}
                      width={24}
                      height={6}
                      rx={1.5}
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth={1.5}
                    />
                  </g>
                ) : (
                  <g>
                    <rect
                      x={-21}
                      y={-20}
                      width={42}
                      height={40}
                      rx={8}
                      fill={badgeBg}
                      stroke={borderStroke}
                      strokeWidth={2.2}
                    />
                    {/* Host Monitor Icon */}
                    <rect
                      x={-11}
                      y={-10}
                      width={22}
                      height={14}
                      rx={2}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={1.6}
                    />
                    <path
                      d="M-6 9 L6 9 M0 4 L0 9"
                      stroke="#38bdf8"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Src / Dst Role Pill */}
                {(isSrc || isDst) && (
                  <g transform="translate(0, -31)">
                    <rect
                      x={-20}
                      y={-7}
                      width={40}
                      height={14}
                      rx={4}
                      fill={isSrc ? '#0891b2' : finalAction === 'permit' ? '#059669' : '#e11d48'}
                    />
                    <text
                      x={0}
                      y={2.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {isSrc ? 'SRC' : 'DST'}
                    </text>
                  </g>
                )}

                {/* Node Label & IP */}
                <text
                  x={0}
                  y={35}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10.5"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                <text
                  x={0}
                  y={47}
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {node.ip}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Footer */}
        <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Ingress Flow
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Permitted Egress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-rose-500 inline-block" /> Dropped by ACL
            </span>
          </div>
          <span className="font-mono text-slate-400">
            Placement: {scenario.targetInterface} ({scenario.direction.toUpperCase()})
          </span>
        </div>
      </div>
    </div>
  );
};
