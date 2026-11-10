import { ACLRule, Action, Protocol } from '../types/acl';
import { formatRuleAddress, isValidIpv4, WELL_KNOWN_PORTS } from './ipEngine';

export interface ParseError {
  lineNumber: number;
  lineText: string;
  message: string;
}

export interface ParseOutput {
  rules: ACLRule[];
  errors: ParseError[];
  aclHeader?: string;
  isStandardAcl: boolean;
}

function parsePortToken(token: string): number | undefined {
  const lower = token.toLowerCase();
  if (WELL_KNOWN_PORTS[lower] !== undefined) {
    return WELL_KNOWN_PORTS[lower];
  }
  if (/^\d+$/.test(lower)) {
    const port = parseInt(lower, 10);
    if (port >= 0 && port <= 65535) return port;
  }
  return undefined;
}

function consumeAddressSpec(
  tokens: string[],
  startIndex: number,
  allowBareIpDefaultHost: boolean
): { ip: string; wildcard: string; nextIndex: number } | { error: string } {
  if (startIndex >= tokens.length) {
    return { error: 'Expected address specification (any, host <ip>, or <ip> <wildcard>)' };
  }

  const first = tokens[startIndex].toLowerCase();
  if (first === 'any') {
    return {
      ip: '0.0.0.0',
      wildcard: '255.255.255.255',
      nextIndex: startIndex + 1,
    };
  }

  if (first === 'host') {
    const hostIp = tokens[startIndex + 1];
    if (!hostIp || !isValidIpv4(hostIp)) {
      return { error: `Invalid IPv4 address after 'host': "${hostIp ?? ''}"` };
    }
    return {
      ip: hostIp,
      wildcard: '0.0.0.0',
      nextIndex: startIndex + 2,
    };
  }

  if (!isValidIpv4(tokens[startIndex])) {
    return { error: `Invalid IPv4 address or keyword "${tokens[startIndex]}"` };
  }

  const ip = tokens[startIndex];
  const nextTok = tokens[startIndex + 1];

  if (nextTok && isValidIpv4(nextTok)) {
    return {
      ip,
      wildcard: nextTok,
      nextIndex: startIndex + 2,
    };
  }

  if (allowBareIpDefaultHost) {
    return {
      ip,
      wildcard: '0.0.0.0',
      nextIndex: startIndex + 1,
    };
  }

  return {
    error: `Missing wildcard mask after IPv4 address "${ip}" (use "host ${ip}" or "${ip} 0.0.0.0")`,
  };
}

export function parseAclText(cliText: string): ParseOutput {
  const lines = cliText.split(/\r?\n/);
  const rules: ACLRule[] = [];
  const errors: ParseError[] = [];

  let isStandardAcl = false;
  let aclHeader: string | undefined;
  let nextAutoSeq = 10;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const lineNumber = idx + 1;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('#')) {
      if (!aclHeader && trimmed.toLowerCase().includes('standard acl')) {
        isStandardAcl = true;
        aclHeader = 'access-list 10';
      }
      continue;
    }

    const tokens = trimmed.split(/\s+/);
    const firstLower = tokens[0].toLowerCase();

    // Ignore remark lines
    if (firstLower === 'remark') {
      continue;
    }

    // Check Named ACL header: ip access-list <standard|extended> <NAME>
    if (
      firstLower === 'ip' &&
      tokens[1]?.toLowerCase() === 'access-list'
    ) {
      const typeTok = tokens[2]?.toLowerCase();
      const nameTok = tokens[3];
      if ((typeTok === 'standard' || typeTok === 'extended') && nameTok) {
        isStandardAcl = typeTok === 'standard';
        aclHeader = `ip access-list ${typeTok} ${nameTok}`;
        continue;
      } else {
        errors.push({
          lineNumber,
          lineText: rawLine,
          message: 'Syntax: ip access-list <standard|extended> <NAME>',
        });
        continue;
      }
    }

    let cursor = 0;
    let explicitSeq: number | undefined;
    let lineIsStandard = isStandardAcl;
    let lineAclHeader = aclHeader;

    // Optional leading sequence number (e.g., "10 permit tcp ...")
    if (/^\d+$/.test(tokens[cursor])) {
      explicitSeq = parseInt(tokens[cursor], 10);
      cursor++;
    }

    // Check numbered ACL prefix: access-list <num> ...
    if (tokens[cursor]?.toLowerCase() === 'access-list') {
      const aclNumStr = tokens[cursor + 1];
      if (!aclNumStr || !/^\d+$/.test(aclNumStr)) {
        errors.push({
          lineNumber,
          lineText: rawLine,
          message: 'Expected numeric ACL ID (1-99 or 100-199) after "access-list"',
        });
        continue;
      }
      const aclNum = parseInt(aclNumStr, 10);
      if (tokens[cursor + 2]?.toLowerCase() === 'remark') {
        continue;
      }
      if ((aclNum >= 1 && aclNum <= 99) || (aclNum >= 1300 && aclNum <= 1999)) {
        lineIsStandard = true;
        isStandardAcl = true;
      } else if ((aclNum >= 100 && aclNum <= 199) || (aclNum >= 2000 && aclNum <= 2699)) {
        lineIsStandard = false;
        isStandardAcl = false;
      } else {
        errors.push({
          lineNumber,
          lineText: rawLine,
          message: `ACL number ${aclNum} out of standard (1-99) or extended (100-199) range`,
        });
        continue;
      }
      lineAclHeader = `access-list ${aclNum}`;
      if (!aclHeader) {
        aclHeader = lineAclHeader;
      }
      cursor += 2;
    }

    // Action: permit | deny
    const actionTok = tokens[cursor]?.toLowerCase();
    if (actionTok !== 'permit' && actionTok !== 'deny') {
      errors.push({
        lineNumber,
        lineText: rawLine,
        message: `Expected "permit" or "deny", found "${tokens[cursor] ?? ''}"`,
      });
      continue;
    }
    const action: Action = actionTok;
    cursor++;

    // Determine whether this ACE is Standard or Extended
    const maybeProto = tokens[cursor]?.toLowerCase();
    const isProtocolToken =
      maybeProto === 'tcp' ||
      maybeProto === 'udp' ||
      maybeProto === 'icmp' ||
      maybeProto === 'ip';

    const seqNum = explicitSeq ?? nextAutoSeq;
    nextAutoSeq = Math.max(nextAutoSeq, seqNum) + 10;

    if (lineIsStandard && !isProtocolToken) {
      // Standard ACL: access-list <1-99> <permit|deny> <src-ip> [wildcard] | host <ip> | any
      const srcParsed = consumeAddressSpec(tokens, cursor, true);
      if ('error' in srcParsed) {
        errors.push({
          lineNumber,
          lineText: rawLine,
          message: srcParsed.error,
        });
        continue;
      }

      if (srcParsed.nextIndex < tokens.length) {
        errors.push({
          lineNumber,
          lineText: rawLine,
          message: `Unexpected trailing token(s) in Standard ACL: "${tokens.slice(srcParsed.nextIndex).join(' ')}"`,
        });
        continue;
      }

      rules.push({
        id: `rule-${seqNum}-${lineNumber}`,
        sequenceNumber: seqNum,
        rawText: trimmed,
        action,
        protocol: 'ip',
        srcIp: srcParsed.ip,
        srcWildcard: srcParsed.wildcard,
        dstIp: '0.0.0.0',
        dstWildcard: '255.255.255.255',
        aclHeader: lineAclHeader,
        isStandard: true,
      });
      continue;
    }

    // Extended ACL: <permit|deny> <protocol> <src> <dst> [eq <port>] [established] [echo|echo-reply]
    if (!isProtocolToken) {
      errors.push({
        lineNumber,
        lineText: rawLine,
        message: `Expected protocol (tcp, udp, icmp, ip), found "${tokens[cursor] ?? ''}"`,
      });
      continue;
    }

    const protocol = maybeProto as Protocol;
    cursor++;

    // Source address spec
    const srcParsed = consumeAddressSpec(tokens, cursor, false);
    if ('error' in srcParsed) {
      errors.push({
        lineNumber,
        lineText: rawLine,
        message: `Source address error: ${srcParsed.error}`,
      });
      continue;
    }
    cursor = srcParsed.nextIndex;

    // Destination address spec
    const dstParsed = consumeAddressSpec(tokens, cursor, false);
    if ('error' in dstParsed) {
      errors.push({
        lineNumber,
        lineText: rawLine,
        message: `Destination address error: ${dstParsed.error}`,
      });
      continue;
    }
    cursor = dstParsed.nextIndex;

    let dstPort: number | undefined;
    let established: boolean | undefined;
    let icmpType: 'echo' | 'echo-reply' | undefined;

    // Parse optional trailing modifiers: [eq <port>], [established], [echo | echo-reply]
    let modifierError = false;
    while (cursor < tokens.length) {
      const mod = tokens[cursor].toLowerCase();
      if (mod === 'eq') {
        const portTok = tokens[cursor + 1];
        if (!portTok) {
          errors.push({
            lineNumber,
            lineText: rawLine,
            message: 'Expected port number or service name after "eq"',
          });
          modifierError = true;
          break;
        }
        const parsedPort = parsePortToken(portTok);
        if (parsedPort === undefined) {
          errors.push({
            lineNumber,
            lineText: rawLine,
            message: `Unknown or invalid TCP/UDP port "${portTok}"`,
          });
          modifierError = true;
          break;
        }
        dstPort = parsedPort;
        cursor += 2;
      } else if (mod === 'established') {
        if (protocol !== 'tcp') {
          errors.push({
            lineNumber,
            lineText: rawLine,
            message: '"established" keyword is only valid for TCP rules',
          });
          modifierError = true;
          break;
        }
        established = true;
        cursor += 1;
      } else if (mod === 'echo' || mod === 'echo-reply') {
        if (protocol !== 'icmp') {
          errors.push({
            lineNumber,
            lineText: rawLine,
            message: `"${mod}" keyword is only valid for ICMP rules`,
          });
          modifierError = true;
          break;
        }
        icmpType = mod;
        cursor += 1;
      } else {
        errors.push({
          lineNumber,
          lineText: rawLine,
          message: `Unrecognized trailing option "${tokens[cursor]}"`,
        });
        modifierError = true;
        break;
      }
    }

    if (modifierError) {
      continue;
    }

    rules.push({
      id: `rule-${seqNum}-${lineNumber}`,
      sequenceNumber: seqNum,
      rawText: trimmed,
      action,
      protocol,
      srcIp: srcParsed.ip,
      srcWildcard: srcParsed.wildcard,
      dstIp: dstParsed.ip,
      dstWildcard: dstParsed.wildcard,
      dstPort,
      established,
      icmpType,
      aclHeader: lineAclHeader,
      isStandard: false,
    });
  }

  return {
    rules,
    errors,
    aclHeader,
    isStandardAcl,
  };
}

export function formatSingleRuleCli(rule: ACLRule, defaultHeader?: string): string {
  const header = rule.aclHeader ?? defaultHeader;
  const srcPart = formatRuleAddress(rule.srcIp, rule.srcWildcard);

  if (rule.isStandard) {
    if (header && header.startsWith('access-list ')) {
      return `${header} ${rule.action} ${srcPart}`;
    }
    return ` ${rule.sequenceNumber} ${rule.action} ${srcPart}`;
  }

  const dstPart = formatRuleAddress(rule.dstIp, rule.dstWildcard);
  const portPart = rule.dstPort !== undefined ? ` eq ${rule.dstPort}` : '';
  const estPart = rule.established ? ' established' : '';
  const icmpPart = rule.icmpType ? ` ${rule.icmpType}` : '';

  if (header && header.startsWith('access-list ')) {
    return `${header} ${rule.action} ${rule.protocol} ${srcPart} ${dstPart}${portPart}${estPart}${icmpPart}`;
  }

  if (header && header.startsWith('ip access-list ')) {
    return ` ${rule.sequenceNumber} ${rule.action} ${rule.protocol} ${srcPart} ${dstPart}${portPart}${estPart}${icmpPart}`;
  }

  return `access-list 100 ${rule.action} ${rule.protocol} ${srcPart} ${dstPart}${portPart}${estPart}${icmpPart}`;
}

export function rulesToCliText(rules: ACLRule[], aclHeader?: string): string {
  const sorted = [...rules].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const effectiveHeader = aclHeader || sorted[0]?.aclHeader || 'ip access-list extended LAB_ACL';

  const lines: string[] = [];
  if (effectiveHeader.startsWith('ip access-list ')) {
    lines.push(effectiveHeader);
  }

  for (const rule of sorted) {
    lines.push(formatSingleRuleCli(rule, effectiveHeader));
  }

  return lines.join('\n');
}
