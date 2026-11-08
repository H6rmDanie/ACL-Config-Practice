import React from 'react';
import { Send, Sparkles, ArrowRight, Layers } from 'lucide-react';
import { LabScenario, Packet, Protocol } from '../types/acl';
import { isValidIpv4 } from '../utils/ipEngine';

interface PacketCrafterProps {
  scenario: LabScenario;
  packet: Packet;
  onChangePacket: (packet: Packet) => void;
  onTracePacket: (packetToTrace?: Packet) => void;
}

const QUICK_PORTS = [
  { label: 'HTTP (80)', port: 80, proto: 'tcp' as Protocol },
  { label: 'HTTPS (443)', port: 443, proto: 'tcp' as Protocol },
  { label: 'SSH (22)', port: 22, proto: 'tcp' as Protocol },
  { label: 'Telnet (23)', port: 23, proto: 'tcp' as Protocol },
  { label: 'DNS (53)', port: 53, proto: 'udp' as Protocol },
];

export const PacketCrafter: React.FC<PacketCrafterProps> = ({
  scenario,
  packet,
  onChangePacket,
  onTracePacket,
}) => {
  const srcValid = isValidIpv4(packet.srcIp);
  const dstValid = isValidIpv4(packet.dstIp);
  const canSend = srcValid && dstValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) {
      onTracePacket(packet);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Packet Crafting Console
            </h2>
            <p className="text-[11px] text-slate-400">
              Inject custom IPv4 / L4 headers to test sequential ACE matching
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Quick-Fill Presets */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Scenario Traffic Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {scenario.testCases.map((tc, i) => (
            <button
              key={tc.id}
              type="button"
              onClick={() => {
                const nextPkt: Packet = { ...tc.packet };
                onChangePacket(nextPkt);
                onTracePacket(nextPkt);
              }}
              className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/40 transition flex items-center gap-1"
              title={tc.name}
            >
              <span className="text-cyan-400">P{i + 1}:</span>
              <span>{tc.packet.srcIp}</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
              <span>
                {tc.packet.dstIp}
                {tc.packet.dstPort ? `:${tc.packet.dstPort}` : ''}
              </span>
              <span className="uppercase text-[9px] px-1 rounded bg-slate-800 text-slate-300">
                {tc.packet.protocol}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Source IP */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Source IPv4
            </label>
            <input
              type="text"
              value={packet.srcIp}
              onChange={(e) =>
                onChangePacket({ ...packet, srcIp: e.target.value.trim() })
              }
              placeholder="e.g. 192.168.1.10"
              className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none ${
                srcValid
                  ? 'border-slate-700 focus:border-cyan-500'
                  : 'border-rose-500/70 text-rose-300'
              }`}
            />
          </div>

          {/* Destination IP */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Destination IPv4
            </label>
            <input
              type="text"
              value={packet.dstIp}
              onChange={(e) =>
                onChangePacket({ ...packet, dstIp: e.target.value.trim() })
              }
              placeholder="e.g. 10.0.0.10"
              className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none ${
                dstValid
                  ? 'border-slate-700 focus:border-cyan-500'
                  : 'border-rose-500/70 text-rose-300'
              }`}
            />
          </div>
        </div>

        {/* Protocol + Ports Row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Protocol
            </label>
            <select
              value={packet.protocol}
              onChange={(e) => {
                const proto = e.target.value as Protocol;
                onChangePacket({
                  ...packet,
                  protocol: proto,
                  dstPort:
                    proto === 'icmp' || proto === 'ip'
                      ? undefined
                      : packet.dstPort ?? 80,
                  srcPort:
                    proto === 'icmp' || proto === 'ip'
                      ? undefined
                      : packet.srcPort ?? 51200,
                });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono uppercase text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
              <option value="icmp">ICMP</option>
              <option value="ip">IP (Raw)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Src Port
            </label>
            <input
              type="number"
              min={1}
              max={65535}
              disabled={packet.protocol === 'icmp' || packet.protocol === 'ip'}
              value={packet.srcPort ?? ''}
              onChange={(e) =>
                onChangePacket({
                  ...packet,
                  srcPort: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              placeholder="Ephemeral"
              className="w-full bg-slate-950 border border-slate-700 disabled:opacity-40 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
              Dst Port
            </label>
            <input
              type="number"
              min={1}
              max={65535}
              disabled={packet.protocol === 'icmp' || packet.protocol === 'ip'}
              value={packet.dstPort ?? ''}
              onChange={(e) =>
                onChangePacket({
                  ...packet,
                  dstPort: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              placeholder="e.g. 80"
              className="w-full bg-slate-950 border border-slate-700 disabled:opacity-40 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Quick Port Selector & Flags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-1">
            {QUICK_PORTS.map((qp) => (
              <button
                key={qp.label}
                type="button"
                onClick={() =>
                  onChangePacket({
                    ...packet,
                    protocol: qp.proto,
                    dstPort: qp.port,
                    srcPort: packet.srcPort ?? 52100,
                  })
                }
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition ${
                  packet.protocol === qp.proto && packet.dstPort === qp.port
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {packet.protocol === 'tcp' && (
            <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(packet.established)}
                onChange={(e) =>
                  onChangePacket({ ...packet, established: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
              />
              <span>ACK / Established</span>
            </label>
          )}

          {packet.protocol === 'icmp' && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-slate-400">Type:</span>
              <select
                value={packet.icmpType ?? 'echo'}
                onChange={(e) =>
                  onChangePacket({
                    ...packet,
                    icmpType: e.target.value as 'echo' | 'echo-reply',
                  })
                }
                className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200"
              >
                <option value="echo">echo (Request)</option>
                <option value="echo-reply">echo-reply</option>
              </select>
            </div>
          )}
        </div>

        {/* Submit / Trace Action */}
        <button
          type="submit"
          disabled={!canSend}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
        >
          <Send className="w-3.5 h-3.5" />
          Inject & Trace Packet Through ACL
        </button>
      </form>
    </div>
  );
};
