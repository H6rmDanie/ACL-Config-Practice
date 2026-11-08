export type Protocol = 'tcp' | 'udp' | 'icmp' | 'ip';
export type Action = 'permit' | 'deny';

export interface Packet {
  id?: string;
  description?: string;
  srcIp: string;
  dstIp: string;
  protocol: Protocol;
  srcPort?: number;
  dstPort?: number;
  established?: boolean;
  icmpType?: 'echo' | 'echo-reply';
}

export interface ACLRule {
  id: string;
  sequenceNumber: number;
  rawText: string;
  action: Action;
  protocol: Protocol;
  srcIp: string;
  srcWildcard: string;
  dstIp: string;
  dstWildcard: string;
  dstPort?: number;
  established?: boolean;
  icmpType?: 'echo' | 'echo-reply';
  aclHeader?: string;
  isStandard?: boolean;
}

export interface StepEvaluation {
  rule: ACLRule | 'implicit-deny';
  matched: boolean;
  reason: string;
  action: Action;
  details?: {
    protocolMatch: boolean;
    srcMatch: boolean;
    dstMatch: boolean;
    portMatch: boolean;
    flagsMatch: boolean;
  };
}

export interface TraceResult {
  packet: Packet;
  steps: StepEvaluation[];
  finalAction: Action;
  matchedRuleIndex: number | null;
}

export interface TestCase {
  id: string;
  name: string;
  packet: Packet;
  expectedAction: Action;
}

export interface TopologyNode {
  id: string;
  label: string;
  ip: string;
  type: 'host' | 'router' | 'server';
  x: number; // Percentage or SVG coordinate (0-100)
  y: number; // Percentage or SVG coordinate (0-100)
  subnet?: string;
  interfaceLabel?: string;
}

export interface LabScenario {
  id: string;
  title: string;
  difficulty: 'CCNA Fundamental' | 'CCNA Intermediate' | 'CCNA Advanced';
  objective: string;
  targetInterface: string;
  direction: 'inbound' | 'outbound';
  initialAclText: string;
  solutionAclText?: string;
  tasks?: string[];
  topology: {
    nodes: TopologyNode[];
    links: { from: string; to: string; label?: string }[];
  };
  testCases: TestCase[];
}
