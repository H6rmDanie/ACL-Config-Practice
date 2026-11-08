import React, { useMemo, useState } from 'react';
import { scenarios } from './data/scenarios';
import { LabScenario, Packet } from './types/acl';
import { parseAclText } from './utils/aclParser';
import { evaluatePacket } from './utils/ipEngine';
import { HeaderBar } from './components/HeaderBar';
import { ObjectivesCard } from './components/ObjectivesCard';
import { TopologyDiagram } from './components/TopologyDiagram';
import { PacketCrafter } from './components/PacketCrafter';
import { AclEditorPanel } from './components/AclEditorPanel';
import {
  EvaluatedTestCase,
  EvaluationPanel,
} from './components/EvaluationPanel';

export function App() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    scenarios[0].id
  );

  const activeScenario: LabScenario = useMemo(
    () =>
      scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0],
    [activeScenarioId]
  );

  // Per-scenario CLI text buffer state
  const [cliByScenario, setCliByScenario] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(scenarios.map((s) => [s.id, s.initialAclText]))
  );

  const currentCliText =
    cliByScenario[activeScenario.id] ?? activeScenario.initialAclText;

  const setCurrentCliText = (nextText: string) => {
    setCliByScenario((prev) => ({
      ...prev,
      [activeScenario.id]: nextText,
    }));
  };

  // Parse CLI text into structured ACLRule[]
  const parsedAcl = useMemo(
    () => parseAclText(currentCliText),
    [currentCliText]
  );

  // Manual Packet Crafter state
  const [craftedPacket, setCraftedPacket] = useState<Packet>(
    () => ({ ...activeScenario.testCases[0].packet })
  );

  // Currently traced packet for SVG highlight & Manual Trace Log
  const [tracedPacket, setTracedPacket] = useState<Packet>(
    () => ({ ...activeScenario.testCases[0].packet })
  );

  // Bottom Evaluation Panel tab state
  const [bottomTab, setBottomTab] = useState<'trace' | 'suite'>('trace');

  // Re-evaluate active trace whenever rules or tracedPacket change
  const activeTrace = useMemo(
    () => evaluatePacket(tracedPacket, parsedAcl.rules),
    [tracedPacket, parsedAcl.rules]
  );

  // Evaluate all scenario test cases against current ACL rules
  const testResults: EvaluatedTestCase[] = useMemo(() => {
    return activeScenario.testCases.map((tc) => {
      const trace = evaluatePacket(tc.packet, parsedAcl.rules);
      const passed = trace.finalAction === tc.expectedAction;
      return {
        testCase: tc,
        trace,
        passed,
      };
    });
  }, [activeScenario, parsedAcl.rules]);

  const passingCount = useMemo(
    () => testResults.filter((r) => r.passed).length,
    [testResults]
  );

  const handleSelectScenario = (scenarioId: string) => {
    const nextScenario =
      scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];
    setActiveScenarioId(nextScenario.id);
    const defaultPkt = { ...nextScenario.testCases[0].packet };
    setCraftedPacket(defaultPkt);
    setTracedPacket(defaultPkt);
  };

  const handleVerifyLab = () => {
    setBottomTab('suite');
    // Highlight the first failing test case on the topology if any fail, otherwise first test case
    const firstFailed = testResults.find((r) => !r.passed);
    if (firstFailed) {
      setTracedPacket({ ...firstFailed.testCase.packet });
      setCraftedPacket({ ...firstFailed.testCase.packet });
    } else if (testResults.length > 0) {
      setTracedPacket({ ...testResults[0].testCase.packet });
    }
  };

  const handleResetScenario = () => {
    setCurrentCliText(activeScenario.initialAclText);
    const defaultPkt = { ...activeScenario.testCases[0].packet };
    setCraftedPacket(defaultPkt);
    setTracedPacket(defaultPkt);
  };

  const handleTracePacket = (pkt?: Packet) => {
    const target = pkt ?? craftedPacket;
    setTracedPacket({ ...target });
    setBottomTab('trace');
  };

  const handleSelectNodeIp = (ip: string, role: 'src' | 'dst') => {
    const nextPkt: Packet = {
      ...craftedPacket,
      srcIp: role === 'src' ? ip : craftedPacket.srcIp,
      dstIp: role === 'dst' ? ip : craftedPacket.dstIp,
    };
    setCraftedPacket(nextPkt);
    setTracedPacket(nextPkt);
  };

  const handleInspectTestCase = (evaluated: EvaluatedTestCase) => {
    const pkt = { ...evaluated.testCase.packet };
    setCraftedPacket(pkt);
    setTracedPacket(pkt);
    setBottomTab('trace');
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden lg:overflow-hidden">
      {/* 1. Header Bar */}
      <HeaderBar
        scenarios={scenarios}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        onVerifyLab={handleVerifyLab}
        onResetScenario={handleResetScenario}
        passingCount={passingCount}
        totalCount={testResults.length}
      />

      {/* Main 3-Pane Split Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row gap-3 p-3 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* 2. Left Panel (40% width on desktop) */}
        <section className="w-full lg:w-[40%] flex flex-col gap-3 min-h-0 lg:overflow-y-auto pr-0.5">
          <ObjectivesCard scenario={activeScenario} />
          <TopologyDiagram
            scenario={activeScenario}
            activeTrace={activeTrace}
            onSelectNodeIp={handleSelectNodeIp}
          />
          <PacketCrafter
            scenario={activeScenario}
            packet={craftedPacket}
            onChangePacket={setCraftedPacket}
            onTracePacket={handleTracePacket}
          />
        </section>

        {/* 3 & 4. Right Panel (60% width on desktop, split top 60% / bottom 40%) */}
        <section className="w-full lg:w-[60%] flex flex-col gap-3 min-h-0 h-full">
          {/* Top Half: Dual-Mode CLI Terminal & Tabular Rule Editor */}
          <div className="flex-1 min-h-[300px] lg:h-[58%]">
            <AclEditorPanel
              cliText={currentCliText}
              onChangeCliText={setCurrentCliText}
              rules={parsedAcl.rules}
              parseErrors={parsedAcl.errors}
              aclHeader={parsedAcl.aclHeader}
              isStandardAcl={parsedAcl.isStandardAcl}
              scenario={activeScenario}
              matchedRuleIndex={activeTrace?.matchedRuleIndex ?? null}
            />
          </div>

          {/* Bottom Half (40% height): Manual Trace Log & Automated Test Suite */}
          <div className="h-[340px] lg:h-[42%] shrink-0">
            <EvaluationPanel
              activeTab={bottomTab}
              onChangeTab={setBottomTab}
              activeTrace={activeTrace}
              testResults={testResults}
              onInspectTestCase={handleInspectTestCase}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
