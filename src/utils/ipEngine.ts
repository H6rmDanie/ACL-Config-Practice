import { ACLRule, Packet, StepEvaluation, TraceResult } from '../types/acl';

export function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

export function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const n = parseInt(part, 10);
    return n >= 0 && n <= 255 && String(n) === part;
  });
}

export function matchWildcard(packetIpStr: string, ruleIpStr: string, wildcardStr: string): boolean {
  if (!isValidIpv4(packetIpStr) || !isValidIpv4(ruleIpStr) || !isValidIpv4(wildcardStr)) {
    return false;
  }
  const packetIp = ipToNumber(packetIpStr);
  const ruleIp = ipToNumber(ruleIpStr);
  const wildcard = ipToNumber(wildcardStr);
  const mask = ~wildcard >>> 0;
  return (packetIp & mask) === (ruleIp & mask);
}

export function normalizeAddressPair(ipInput: string, wildcardInput?: string): { ip: string; wildcard: string } {
  const trimmedIp = ipInput.trim().toLowerCase();
  if (trimmedIp === 'any') {
    return { ip: '0.0.0.0', wildcard: '255.255.255.255' };
  }
  if (trimmedIp.startsWith('host ')) {
    const hostIp = trimmedIp.replace(/^host\s+/, '').trim();
    return { ip: hostIp, wildcard: '0.0.0.0' };
  }
  const wc = wildcardInput ? wildcardInput.trim().toLowerCase() : '0.0.0.0';
  if (wc === 'any') {
    return { ip: '0.0.0.0', wildcard: '255.255.255.255' };
  }
  return {
    ip: trimmedIp,
    wildcard: wc || '0.0.0.0',
  };
}

export function formatRuleAddress(ip: string, wildcard: string): string {
  if (wildcard === '255.255.255.255') {
    return 'any';
  }
  if (wildcard === '0.0.0.0') {
    return `host ${ip}`;
  }
  return `${ip} ${wildcard}`;
}

export const WELL_KNOWN_PORTS: Record<string, number> = {
  ftp: 21,
  'ftp-data': 20,
  ssh: 22,
  telnet: 23,
  smtp: 25,
  domain: 53,
  dns: 53,
  tftp: 69,
  www: 80,
  http: 80,
  pop3: 110,
  ntp: 123,
  imap: 143,
  snmp: 161,
  bgp: 179,
  https: 443,
  syslog: 514,
  rdp: 3389,
};

export function formatPortName(port?: number): string {
  if (port === undefined) return 'any';
  const names: Record<number, string> = {
    20: '20 (FTP-Data)',
    21: '21 (FTP)',
    22: '22 (SSH)',
    23: '23 (Telnet)',
    25: '25 (SMTP)',
    53: '53 (DNS)',
    69: '69 (TFTP)',
    80: '80 (HTTP)',
    123: '123 (NTP)',
    161: '161 (SNMP)',
    443: '443 (HTTPS)',
    3389: '3389 (RDP)',
  };
  return names[port] || String(port);
}

/**
 * Sequential Rule Walker:
 * - Walks rules sequentially ordered by sequenceNumber
 * - Checks protocol -> source IP wildcard -> destination IP wildcard -> destination port & TCP/ICMP options
 * - Halts on first match; appends and evaluates 'implicit-deny' if end of ACL is reached.
 */
export function evaluatePacket(packet: Packet, rules: ACLRule[]): TraceResult {
  const sortedRules = [...rules].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const steps: StepEvaluation[] = [];

  for (let i = 0; i < sortedRules.length; i++) {
    const rule = sortedRules[i];

    // 1. Protocol evaluation ('ip' matches all IPv4 protocols: tcp, udp, icmp, ip)
    const protocolMatch = rule.protocol === 'ip' || rule.protocol === packet.protocol;

    // 2. Source IP bitwise wildcard evaluation
    const srcMatch = matchWildcard(packet.srcIp, rule.srcIp, rule.srcWildcard);

    // 3. Destination IP bitwise wildcard evaluation
    const dstMatch = matchWildcard(packet.dstIp, rule.dstIp, rule.dstWildcard);

    // 4. Destination Port evaluation
    let portMatch = true;
    if (rule.dstPort !== undefined) {
      portMatch = packet.dstPort === rule.dstPort;
    }

    // 5. TCP Established / ICMP Type evaluation
    let flagsMatch = true;
    let flagFailureReason = '';

    if (rule.established) {
      const isTcp = packet.protocol === 'tcp';
      const isEstablishedPacket =
        packet.established === true ||
        (packet.established === undefined &&
          isTcp &&
          packet.srcPort !== undefined &&
          [22, 53, 80, 443].includes(packet.srcPort) &&
          (packet.dstPort ?? 0) >= 1024);

      if (!isTcp || !isEstablishedPacket) {
        flagsMatch = false;
        flagFailureReason = 'TCP ACK/RST (established) flag not set on packet';
      }
    }

    if (rule.icmpType && packet.protocol === 'icmp') {
      const pktIcmpType = packet.icmpType ?? 'echo';
      if (rule.icmpType !== pktIcmpType) {
        flagsMatch = false;
        flagFailureReason = `ICMP type mismatch (packet is ${pktIcmpType}, rule requires ${rule.icmpType})`;
      }
    }

    const matched = protocolMatch && srcMatch && dstMatch && portMatch && flagsMatch;

    let reason = '';
    if (matched) {
      const protoDesc =
        rule.protocol === 'ip'
          ? `Protocol IP (matches ${packet.protocol.toUpperCase()})`
          : `Protocol ${rule.protocol.toUpperCase()}`;
      const srcDesc = `Src ${packet.srcIp} matches ${formatRuleAddress(rule.srcIp, rule.srcWildcard)}`;
      const dstDesc = `Dst ${packet.dstIp} matches ${formatRuleAddress(rule.dstIp, rule.dstWildcard)}`;
      const portDesc =
        rule.dstPort !== undefined
          ? `, DstPort eq ${formatPortName(rule.dstPort)}`
          : rule.established
          ? ', TCP established (ACK/RST)'
          : rule.icmpType
          ? `, ICMP ${rule.icmpType}`
          : '';

      reason = `MATCH [Seq ${rule.sequenceNumber}]: ${protoDesc}, ${srcDesc}, ${dstDesc}${portDesc} → ${rule.action.toUpperCase()}`;
    } else {
      const mismatches: string[] = [];
      if (!protocolMatch) {
        mismatches.push(
          `Protocol mismatch (packet ${packet.protocol.toUpperCase()} ≠ rule ${rule.protocol.toUpperCase()})`
        );
      }
      if (!srcMatch) {
        mismatches.push(
          `Src IP ${packet.srcIp} does not match ${formatRuleAddress(rule.srcIp, rule.srcWildcard)}`
        );
      }
      if (!dstMatch) {
        mismatches.push(
          `Dst IP ${packet.dstIp} does not match ${formatRuleAddress(rule.dstIp, rule.dstWildcard)}`
        );
      }
      if (protocolMatch && !portMatch) {
        mismatches.push(
          `Dst Port mismatch (packet port ${packet.dstPort ?? 'none'} ≠ rule eq ${rule.dstPort})`
        );
      }
      if (protocolMatch && !flagsMatch && flagFailureReason) {
        mismatches.push(flagFailureReason);
      }
      reason = `NO MATCH [Seq ${rule.sequenceNumber}]: ${mismatches.join(' | ')}`;
    }

    steps.push({
      rule,
      matched,
      reason,
      action: rule.action,
      details: {
        protocolMatch,
        srcMatch,
        dstMatch,
        portMatch,
        flagsMatch,
      },
    });

    if (matched) {
      return {
        packet,
        steps,
        finalAction: rule.action,
        matchedRuleIndex: i,
      };
    }
  }

  // End of list reached: append and evaluate implicit-deny
  steps.push({
    rule: 'implicit-deny',
    matched: true,
    reason:
      'IMPLICIT DENY: End of ACL reached without matching any explicit ACE (Cisco IOS implicit "deny ip any any") → DENY',
    action: 'deny',
    details: {
      protocolMatch: true,
      srcMatch: true,
      dstMatch: true,
      portMatch: true,
      flagsMatch: true,
    },
  });

  return {
    packet,
    steps,
    finalAction: 'deny',
    matchedRuleIndex: null,
  };
}
