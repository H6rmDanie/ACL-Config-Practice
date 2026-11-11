import { LabScenario } from '../types/acl';

export const scenarios: LabScenario[] = [
  // ============================================================================
  // LAB 1: Fundamental — Standard ACL - Management VTY Access
  // ============================================================================
  {
    id: 'lab-1-vty-std',
    title: 'Standard ACL - Management VTY Access',
    difficulty: 'CCNA Fundamental',
    objective:
      'Applied on R1 VTY 0 4 Inbound. Filter management Telnet/SSH traffic to Router R1 so only administrator host 192.168.10.5 is permitted; deny all other hosts and subnets.',
    targetInterface: 'R1 VTY 0 4',
    direction: 'inbound',
    tasks: [
      'Create Standard ACL 10 permitting only administrator workstation 192.168.10.5 (using host 192.168.10.5 or wildcard 0.0.0.0).',
      'Ensure other hosts on the same 192.168.10.0/24 subnet (e.g., 192.168.10.50) are denied.',
      'Ensure remote subnets such as Engineering (192.168.20.0/24) and Server VLAN (10.10.10.0/24) are denied.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `access-list 10 permit host 192.168.10.5
access-list 10 deny any`,
    topology: {
      nodes: [
        {
          id: 'admin-pc',
          label: 'Admin Console',
          ip: '192.168.10.5',
          type: 'host',
          x: 16,
          y: 22,
          subnet: '192.168.10.0/24',
        },
        {
          id: 'peer-pc',
          label: 'Helpdesk PC',
          ip: '192.168.10.50',
          type: 'host',
          x: 16,
          y: 52,
          subnet: '192.168.10.0/24',
        },
        {
          id: 'eng-pc',
          label: 'Eng Workstation',
          ip: '192.168.20.15',
          type: 'host',
          x: 16,
          y: 82,
          subnet: '192.168.20.0/24',
        },
        {
          id: 'router-r1',
          label: 'R1 (Core VTY)',
          ip: '192.168.10.1',
          type: 'router',
          x: 54,
          y: 50,
          interfaceLabel: 'VTY 0 4 IN',
        },
        {
          id: 'srv-syslog',
          label: 'Syslog / AAA',
          ip: '10.10.10.5',
          type: 'server',
          x: 85,
          y: 50,
          subnet: '10.10.10.0/24',
        },
      ],
      links: [
        { from: 'admin-pc', to: 'router-r1', label: 'Mgmt VLAN 10' },
        { from: 'peer-pc', to: 'router-r1', label: 'Mgmt VLAN 10' },
        { from: 'eng-pc', to: 'router-r1', label: 'Eng VLAN 20' },
        { from: 'router-r1', to: 'srv-syslog', label: 'Gi0/1' },
      ],
    },
    testCases: [
      {
        id: 'tc-1-admin-ssh',
        name: 'Admin Host (192.168.10.5) SSH to R1 VTY: Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-1-1',
          description: 'Authorized Admin Console SSH session to R1',
          srcIp: '192.168.10.5',
          dstIp: '192.168.10.1',
          protocol: 'tcp',
          srcPort: 55100,
          dstPort: 22,
        },
      },
      {
        id: 'tc-1-peer-ssh',
        name: 'Same-Subnet Helpdesk PC (192.168.10.50) to R1: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-1-2',
          description: 'Non-admin host on 192.168.10.0/24 attempting VTY login',
          srcIp: '192.168.10.50',
          dstIp: '192.168.10.1',
          protocol: 'tcp',
          srcPort: 55200,
          dstPort: 22,
        },
      },
      {
        id: 'tc-1-eng-telnet',
        name: 'Engineering Subnet (192.168.20.15) to R1: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-1-3',
          description: 'Engineering workstation attempting VTY access',
          srcIp: '192.168.20.15',
          dstIp: '192.168.10.1',
          protocol: 'tcp',
          srcPort: 50300,
          dstPort: 23,
        },
      },
      {
        id: 'tc-1-external',
        name: 'Syslog Server (10.10.10.5) to R1 VTY: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-1-4',
          description: 'Server subnet attempting reverse VTY session',
          srcIp: '10.10.10.5',
          dstIp: '192.168.10.1',
          protocol: 'tcp',
          srcPort: 41200,
          dstPort: 22,
        },
      },
    ],
  },

  // ============================================================================
  // LAB 2: Intermediate — Extended ACL - Web Server DMZ Isolation
  // ============================================================================
  {
    id: 'lab-2-dmz-web',
    title: 'Extended ACL - Web Server DMZ Isolation',
    difficulty: 'CCNA Intermediate',
    objective:
      'Applied on R1 G0/0 Inbound. Permit internal subnet 192.168.1.0/24 to access Web Server 10.0.0.10 on ports 80/443, allow ICMP to gateway 192.168.1.1, and deny all other inter-VLAN and DMZ traffic.',
    targetInterface: 'R1 G0/0',
    direction: 'inbound',
    tasks: [
      'Permit TCP traffic from internal subnet 192.168.1.0/24 (wildcard 0.0.0.255) to DMZ Web Server host 10.0.0.10 on HTTP (port 80).',
      'Permit TCP traffic from internal subnet 192.168.1.0/24 to DMZ Web Server host 10.0.0.10 on HTTPS (port 443).',
      'Permit ICMP traffic from 192.168.1.0/24 to gateway interface host 192.168.1.1.',
      'Deny all other traffic to the DMZ Database (10.0.0.20) or from untrusted VLANs.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended DMZ_ISOLATION
 10 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.10 eq 80
 20 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.10 eq 443
 30 permit icmp 192.168.1.0 0.0.0.255 host 192.168.1.1
 40 deny ip any any`,
    topology: {
      nodes: [
        {
          id: 'host-lan1',
          label: 'Staff PC-1',
          ip: '192.168.1.10',
          type: 'host',
          x: 16,
          y: 24,
          subnet: '192.168.1.0/24',
        },
        {
          id: 'host-lan2',
          label: 'Guest PC-2',
          ip: '192.168.2.25',
          type: 'host',
          x: 16,
          y: 76,
          subnet: '192.168.2.0/24',
        },
        {
          id: 'router-r1',
          label: 'R1 (Gateway)',
          ip: '192.168.1.1',
          type: 'router',
          x: 50,
          y: 50,
          interfaceLabel: 'G0/0 IN',
        },
        {
          id: 'srv-web',
          label: 'DMZ Web Svr',
          ip: '10.0.0.10',
          type: 'server',
          x: 84,
          y: 24,
          subnet: '10.0.0.0/24',
        },
        {
          id: 'srv-db',
          label: 'DMZ DB Svr',
          ip: '10.0.0.20',
          type: 'server',
          x: 84,
          y: 76,
          subnet: '10.0.0.0/24',
        },
      ],
      links: [
        { from: 'host-lan1', to: 'router-r1', label: 'G0/0' },
        { from: 'host-lan2', to: 'router-r1', label: 'G0/1' },
        { from: 'router-r1', to: 'srv-web', label: 'G0/2 (DMZ)' },
        { from: 'router-r1', to: 'srv-db', label: 'G0/2 (DMZ)' },
      ],
    },
    testCases: [
      {
        id: 'tc-2-http',
        name: 'LAN (192.168.1.10) to Web Server HTTP (80): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-2-1',
          description: 'Staff PC-1 browsing HTTP on DMZ Web Server',
          srcIp: '192.168.1.10',
          dstIp: '10.0.0.10',
          protocol: 'tcp',
          srcPort: 51240,
          dstPort: 80,
        },
      },
      {
        id: 'tc-2-https',
        name: 'LAN (192.168.1.10) to Web Server HTTPS (443): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-2-2',
          description: 'Staff PC-1 browsing HTTPS on DMZ Web Server',
          srcIp: '192.168.1.10',
          dstIp: '10.0.0.10',
          protocol: 'tcp',
          srcPort: 51241,
          dstPort: 443,
        },
      },
      {
        id: 'tc-2-icmp-gw',
        name: 'LAN (192.168.1.10) Ping Gateway (192.168.1.1): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-2-3',
          description: 'ICMP Echo Request to Default Gateway R1',
          srcIp: '192.168.1.10',
          dstIp: '192.168.1.1',
          protocol: 'icmp',
          icmpType: 'echo',
        },
      },
      {
        id: 'tc-2-ssh-web',
        name: 'LAN (192.168.1.10) SSH (22) to Web Server: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-2-4',
          description: 'Unauthorized SSH management attempt to DMZ Web Server',
          srcIp: '192.168.1.10',
          dstIp: '10.0.0.10',
          protocol: 'tcp',
          srcPort: 54012,
          dstPort: 22,
        },
      },
      {
        id: 'tc-2-db-access',
        name: 'LAN (192.168.1.10) to DMZ DB Server (10.0.0.20): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-2-5',
          description: 'Direct connection attempt to isolated DMZ Database Server',
          srcIp: '192.168.1.10',
          dstIp: '10.0.0.20',
          protocol: 'tcp',
          srcPort: 54099,
          dstPort: 80,
        },
      },
    ],
  },

  // ============================================================================
  // LAB 3: Intermediate — Security Hardening - Block Specific Attack Vectors
  // ============================================================================
  {
    id: 'lab-3-hardening',
    title: 'Security Hardening - Block Specific Attack Vectors',
    difficulty: 'CCNA Intermediate',
    objective:
      'Applied on R1 G0/1 Inbound. Block Telnet (port 23) and inbound Echo Requests (ICMP) from external subnet 203.0.113.0/24 while allowing established TCP traffic and DNS.',
    targetInterface: 'R1 G0/1',
    direction: 'inbound',
    tasks: [
      'Deny TCP Telnet (eq 23) originating from external network 203.0.113.0 0.0.0.255 to any destination.',
      'Deny inbound ICMP Echo Requests from external network 203.0.113.0 0.0.0.255 to any destination.',
      'Permit TCP established return traffic (permit tcp any any established).',
      'Permit UDP DNS traffic (eq 53) and drop unsolicited inbound SYN connections.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended WAN_HARDENING
 10 deny tcp 203.0.113.0 0.0.0.255 any eq 23
 20 deny icmp 203.0.113.0 0.0.0.255 any echo
 30 permit tcp any any established
 40 permit udp any any eq 53
 50 deny ip any any`,
    topology: {
      nodes: [
        {
          id: 'ext-attacker',
          label: 'Ext Net Host',
          ip: '203.0.113.45',
          type: 'host',
          x: 16,
          y: 26,
          subnet: '203.0.113.0/24',
        },
        {
          id: 'ext-dns',
          label: 'Public DNS/Web',
          ip: '198.51.100.53',
          type: 'server',
          x: 16,
          y: 74,
          subnet: '198.51.100.0/24',
        },
        {
          id: 'router-edge',
          label: 'R1 (WAN Edge)',
          ip: '203.0.113.1',
          type: 'router',
          x: 50,
          y: 50,
          interfaceLabel: 'G0/1 IN',
        },
        {
          id: 'int-admin',
          label: 'Corp Client',
          ip: '10.1.1.10',
          type: 'host',
          x: 84,
          y: 26,
          subnet: '10.1.1.0/24',
        },
        {
          id: 'int-srv',
          label: 'Internal Svr',
          ip: '10.1.1.50',
          type: 'server',
          x: 84,
          y: 74,
          subnet: '10.1.1.0/24',
        },
      ],
      links: [
        { from: 'ext-attacker', to: 'router-edge', label: 'WAN G0/1' },
        { from: 'ext-dns', to: 'router-edge', label: 'WAN G0/1' },
        { from: 'router-edge', to: 'int-admin', label: 'LAN G0/0' },
        { from: 'router-edge', to: 'int-srv', label: 'LAN G0/0' },
      ],
    },
    testCases: [
      {
        id: 'tc-3-telnet',
        name: 'External (203.0.113.45) Telnet (23) to Internal Svr: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-3-1',
          description: 'External attacker attempting Telnet login on port 23',
          srcIp: '203.0.113.45',
          dstIp: '10.1.1.50',
          protocol: 'tcp',
          srcPort: 48120,
          dstPort: 23,
          established: false,
        },
      },
      {
        id: 'tc-3-icmp-echo',
        name: 'External (203.0.113.45) ICMP Echo Ping Sweep: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-3-2',
          description: 'Inbound ICMP Echo Request probe from 203.0.113.0/24',
          srcIp: '203.0.113.45',
          dstIp: '10.1.1.10',
          protocol: 'icmp',
          icmpType: 'echo',
        },
      },
      {
        id: 'tc-3-estab',
        name: 'Established TCP Return Traffic (443 -> Corp Client): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-3-3',
          description: 'ACK/Established HTTPS response returning to Corp Client',
          srcIp: '198.51.100.53',
          dstIp: '10.1.1.10',
          protocol: 'tcp',
          srcPort: 443,
          dstPort: 52400,
          established: true,
        },
      },
      {
        id: 'tc-3-dns',
        name: 'Inbound UDP DNS (Port 53) Packet: Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-3-4',
          description: 'DNS UDP port 53 resolution traffic',
          srcIp: '198.51.100.53',
          dstIp: '10.1.1.50',
          protocol: 'udp',
          srcPort: 51053,
          dstPort: 53,
        },
      },
      {
        id: 'tc-3-unestab-syn',
        name: 'Unsolicited External SYN (Non-Established TCP 80): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-3-5',
          description: 'Unsolicited inbound TCP SYN connection attempt without ACK flag',
          srcIp: '203.0.113.45',
          dstIp: '10.1.1.50',
          protocol: 'tcp',
          srcPort: 60111,
          dstPort: 80,
          established: false,
        },
      },
    ],
  },

  // ============================================================================
  // LAB 4: Intermediate — Inter-VLAN Segregation (Sales vs Engineering)
  // ============================================================================
  {
    id: 'lab-4-intervlan-sales-eng',
    title: 'Inter-VLAN Segregation (Sales vs Engineering)',
    difficulty: 'CCNA Intermediate',
    objective:
      'Applied on R1 G0/1 Inbound. Prevent the Sales VLAN (192.168.20.0/24) from accessing the Engineering subnet (192.168.30.0/24) on any protocol, while allowing Sales to access Core Server (10.1.1.5) HTTP (port 80) and DNS (UDP port 53).',
    targetInterface: 'R1 G0/1',
    direction: 'inbound',
    tasks: [
      'Deny all IP traffic from Sales VLAN 192.168.20.0 0.0.0.255 to Engineering subnet 192.168.30.0 0.0.0.255.',
      'Permit TCP traffic from Sales VLAN 192.168.20.0 0.0.0.255 to Core Server host 10.1.1.5 on HTTP (eq 80).',
      'Permit UDP traffic from Sales VLAN 192.168.20.0 0.0.0.255 to Core Server host 10.1.1.5 on DNS (eq 53).',
      'Ensure any other unauthorized ports to Core Server (such as SSH port 22) are denied.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended SALES_SEGREGATION
 10 deny ip 192.168.20.0 0.0.0.255 192.168.30.0 0.0.0.255
 20 permit tcp 192.168.20.0 0.0.0.255 host 10.1.1.5 eq 80
 30 permit udp 192.168.20.0 0.0.0.255 host 10.1.1.5 eq 53
 40 deny ip any any`,
    topology: {
      nodes: [
        {
          id: 'sales-pc',
          label: 'Sales PC',
          ip: '192.168.20.10',
          type: 'host',
          x: 16,
          y: 35,
          subnet: '192.168.20.0/24',
        },
        {
          id: 'router-r1',
          label: 'R1 (Inter-VLAN)',
          ip: '192.168.20.1',
          type: 'router',
          x: 50,
          y: 50,
          interfaceLabel: 'G0/1 IN',
        },
        {
          id: 'eng-pc',
          label: 'Eng PC',
          ip: '192.168.30.10',
          type: 'host',
          x: 84,
          y: 24,
          subnet: '192.168.30.0/24',
        },
        {
          id: 'core-srv',
          label: 'Core Server',
          ip: '10.1.1.5',
          type: 'server',
          x: 84,
          y: 76,
          subnet: '10.1.1.0/24',
        },
      ],
      links: [
        { from: 'sales-pc', to: 'router-r1', label: 'G0/1 (VLAN 20)' },
        { from: 'router-r1', to: 'eng-pc', label: 'G0/2 (VLAN 30)' },
        { from: 'router-r1', to: 'core-srv', label: 'G0/0 (Core)' },
      ],
    },
    testCases: [
      {
        id: 'tc-4-sales-eng-tcp',
        name: 'Sales PC (192.168.20.10) TCP to Eng PC (192.168.30.10): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-4-1',
          description: 'Sales attempting lateral SMB/HTTP connection to Engineering',
          srcIp: '192.168.20.10',
          dstIp: '192.168.30.10',
          protocol: 'tcp',
          srcPort: 50112,
          dstPort: 80,
        },
      },
      {
        id: 'tc-4-sales-eng-icmp',
        name: 'Sales PC (192.168.20.10) ICMP Ping to Eng PC (192.168.30.10): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-4-2',
          description: 'Sales attempting ICMP ping to Engineering subnet',
          srcIp: '192.168.20.10',
          dstIp: '192.168.30.10',
          protocol: 'icmp',
          icmpType: 'echo',
        },
      },
      {
        id: 'tc-4-sales-core-http',
        name: 'Sales PC (192.168.20.10) to Core Server HTTP (80): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-4-3',
          description: 'Sales accessing internal Core Web Portal',
          srcIp: '192.168.20.10',
          dstIp: '10.1.1.5',
          protocol: 'tcp',
          srcPort: 52300,
          dstPort: 80,
        },
      },
      {
        id: 'tc-4-sales-core-dns',
        name: 'Sales PC (192.168.20.10) to Core Server DNS (UDP 53): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-4-4',
          description: 'Sales resolving hostname against Core Server DNS',
          srcIp: '192.168.20.10',
          dstIp: '10.1.1.5',
          protocol: 'udp',
          srcPort: 54911,
          dstPort: 53,
        },
      },
      {
        id: 'tc-4-sales-core-ssh',
        name: 'Sales PC (192.168.20.10) SSH (22) to Core Server: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-4-5',
          description: 'Unauthorized SSH login attempt from Sales to Core Server',
          srcIp: '192.168.20.10',
          dstIp: '10.1.1.5',
          protocol: 'tcp',
          srcPort: 52399,
          dstPort: 22,
        },
      },
    ],
  },

  // ============================================================================
  // LAB 5: Intermediate — Stateful Return Traffic Emulation using `established`
  // ============================================================================
  {
    id: 'lab-5-stateful-established',
    title: 'Stateful Return Traffic Emulation using established',
    difficulty: 'CCNA Intermediate',
    objective:
      'Applied on R1 External Interface G0/0 Inbound. Allow incoming TCP traffic from External Web Server (198.51.100.25) to LAN subnet 172.16.1.0/24 only if it is an established return session (ACK/RST set), while blocking unrequested inbound connections.',
    targetInterface: 'R1 G0/0',
    direction: 'inbound',
    tasks: [
      'Permit inbound TCP traffic from External Web Server (198.51.100.25 or any) to LAN 172.16.1.0 0.0.0.255 with the established keyword.',
      'Block unsolicited inbound TCP SYN attempts (where established is false) from the external network.',
      'Block unsolicited inbound ICMP and UDP probes from reaching internal LAN clients.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended STATEFUL_RETURN
 10 permit tcp any 172.16.1.0 0.0.0.255 established
 20 deny ip any any`,
    topology: {
      nodes: [
        {
          id: 'ext-web-srv',
          label: 'External Web Svr',
          ip: '198.51.100.25',
          type: 'server',
          x: 16,
          y: 50,
          subnet: '198.51.100.0/24',
        },
        {
          id: 'router-r1',
          label: 'Edge Router R1',
          ip: '198.51.100.1',
          type: 'router',
          x: 50,
          y: 50,
          interfaceLabel: 'G0/0 IN',
        },
        {
          id: 'lan-client',
          label: 'LAN Client',
          ip: '172.16.1.50',
          type: 'host',
          x: 84,
          y: 50,
          subnet: '172.16.1.0/24',
        },
      ],
      links: [
        { from: 'ext-web-srv', to: 'router-r1', label: 'WAN G0/0' },
        { from: 'router-r1', to: 'lan-client', label: 'LAN G0/1' },
      ],
    },
    testCases: [
      {
        id: 'tc-5-http-estab',
        name: 'External Web Server (198.51.100.25) Established HTTP Reply: Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-5-1',
          description: 'Returning TCP ACK payload from port 80 to LAN Client',
          srcIp: '198.51.100.25',
          dstIp: '172.16.1.50',
          protocol: 'tcp',
          srcPort: 80,
          dstPort: 51400,
          established: true,
        },
      },
      {
        id: 'tc-5-https-estab',
        name: 'External Web Server (198.51.100.25) Established HTTPS Reply: Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-5-2',
          description: 'Returning TCP ACK payload from port 443 to LAN Client',
          srcIp: '198.51.100.25',
          dstIp: '172.16.1.50',
          protocol: 'tcp',
          srcPort: 443,
          dstPort: 51405,
          established: true,
        },
      },
      {
        id: 'tc-5-inbound-syn',
        name: 'Unrequested Inbound TCP SYN to LAN Client (Port 445): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-5-3',
          description: 'External host initiating new unestablished TCP SYN to LAN Client',
          srcIp: '198.51.100.25',
          dstIp: '172.16.1.50',
          protocol: 'tcp',
          srcPort: 49200,
          dstPort: 445,
          established: false,
        },
      },
      {
        id: 'tc-5-inbound-ssh-syn',
        name: 'Unrequested Inbound SSH (22) SYN to LAN Client: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-5-4',
          description: 'External SSH brute-force attempt without established flag',
          srcIp: '198.51.100.25',
          dstIp: '172.16.1.50',
          protocol: 'tcp',
          srcPort: 60122,
          dstPort: 22,
          established: false,
        },
      },
      {
        id: 'tc-5-inbound-icmp',
        name: 'Unrequested External ICMP Ping to LAN Client: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-5-5',
          description: 'External ICMP echo probe targeting internal LAN host',
          srcIp: '198.51.100.25',
          dstIp: '172.16.1.50',
          protocol: 'icmp',
          icmpType: 'echo',
        },
      },
    ],
  },

  // ============================================================================
  // LAB 6: Intermediate — Core Infrastructure Services Protection (DNS & NTP)
  // ============================================================================
  {
    id: 'lab-6-core-dns-ntp',
    title: 'Core Infrastructure Services Protection (DNS & NTP)',
    difficulty: 'CCNA Intermediate',
    objective:
      'Applied on Central Router G0/2 Inbound. Allow Branch Host (10.2.2.15) to reach Central Server (10.50.0.53) for UDP port 53 (DNS) and UDP port 123 (NTP). Deny all access from the Guest Subnet (172.20.0.0/16) to Central Server while permitting general internet-bound UDP traffic.',
    targetInterface: 'Central G0/2',
    direction: 'inbound',
    tasks: [
      'Permit UDP traffic from Branch Host 10.2.2.15 to Central Server 10.50.0.53 on DNS (eq 53).',
      'Permit UDP traffic from Branch Host 10.2.2.15 to Central Server 10.50.0.53 on NTP (eq 123).',
      'Deny all IP traffic from Guest Subnet 172.20.0.0 0.0.255.255 to Central Server host 10.50.0.53.',
      'Permit general outbound/internet UDP traffic (permit udp any any) after blocking Guest access to Central Server.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended CORE_INFRA_GUARD
 10 permit udp host 10.2.2.15 host 10.50.0.53 eq 53
 20 permit udp host 10.2.2.15 host 10.50.0.53 eq 123
 30 deny ip 172.20.0.0 0.0.255.255 host 10.50.0.53
 40 permit udp any any`,
    topology: {
      nodes: [
        {
          id: 'branch-host',
          label: 'Branch Host',
          ip: '10.2.2.15',
          type: 'host',
          x: 16,
          y: 24,
          subnet: '10.2.2.0/24',
        },
        {
          id: 'guest-host',
          label: 'Guest Subnet PC',
          ip: '172.20.5.40',
          type: 'host',
          x: 16,
          y: 76,
          subnet: '172.20.0.0/16',
        },
        {
          id: 'central-rtr',
          label: 'Central Router',
          ip: '10.50.0.1',
          type: 'router',
          x: 50,
          y: 50,
          interfaceLabel: 'G0/2 IN',
        },
        {
          id: 'central-srv',
          label: 'Central DNS/NTP',
          ip: '10.50.0.53',
          type: 'server',
          x: 84,
          y: 26,
          subnet: '10.50.0.0/24',
        },
        {
          id: 'ext-udp',
          label: 'Internet DNS',
          ip: '8.8.8.8',
          type: 'server',
          x: 84,
          y: 76,
          subnet: '8.8.8.0/24',
        },
      ],
      links: [
        { from: 'branch-host', to: 'central-rtr', label: 'G0/2' },
        { from: 'guest-host', to: 'central-rtr', label: 'G0/2' },
        { from: 'central-rtr', to: 'central-srv', label: 'G0/0 (Core)' },
        { from: 'central-rtr', to: 'ext-udp', label: 'G0/1 (WAN)' },
      ],
    },
    testCases: [
      {
        id: 'tc-6-branch-dns',
        name: 'Branch Host (10.2.2.15) to Central Server DNS (UDP 53): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-6-1',
          description: 'Branch Host querying Central DNS Server on UDP 53',
          srcIp: '10.2.2.15',
          dstIp: '10.50.0.53',
          protocol: 'udp',
          srcPort: 53110,
          dstPort: 53,
        },
      },
      {
        id: 'tc-6-branch-ntp',
        name: 'Branch Host (10.2.2.15) to Central Server NTP (UDP 123): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-6-2',
          description: 'Branch Host synchronizing clock via NTP UDP 123',
          srcIp: '10.2.2.15',
          dstIp: '10.50.0.53',
          protocol: 'udp',
          srcPort: 53115,
          dstPort: 123,
        },
      },
      {
        id: 'tc-6-guest-central-dns',
        name: 'Guest Subnet (172.20.5.40) to Central Server (10.50.0.53): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-6-3',
          description: 'Guest host attempting to query internal Central DNS Server',
          srcIp: '172.20.5.40',
          dstIp: '10.50.0.53',
          protocol: 'udp',
          srcPort: 50053,
          dstPort: 53,
        },
      },
      {
        id: 'tc-6-guest-internet-udp',
        name: 'Guest Subnet (172.20.5.40) to Public Internet UDP (8.8.8.8:53): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-6-4',
          description: 'Guest host resolving external DNS via public internet',
          srcIp: '172.20.5.40',
          dstIp: '8.8.8.8',
          protocol: 'udp',
          srcPort: 51900,
          dstPort: 53,
        },
      },
      {
        id: 'tc-6-branch-tcp-ssh',
        name: 'Branch Host (10.2.2.15) TCP SSH (22) to Central Server: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-6-5',
          description: 'Unauthorized TCP SSH connection attempt to Central Server',
          srcIp: '10.2.2.15',
          dstIp: '10.50.0.53',
          protocol: 'tcp',
          srcPort: 59001,
          dstPort: 22,
        },
      },
    ],
  },

  // ============================================================================
  // LAB 7: Advanced — Variable Subnetting with Non-Contiguous Wildcard Masks (/28)
  // ============================================================================
  {
    id: 'lab-7-vlsm-subnet-28',
    title: 'Variable Subnetting with Non-Contiguous Wildcard Masks (/28 Subnet)',
    difficulty: 'CCNA Advanced',
    objective:
      'Applied on R1 G0/0 Inbound. Protect Database Server (192.168.5.100). Allow only hosts in the specific /28 subnet range (172.16.10.16 through 172.16.10.31, wildcard mask 0.0.0.15) to connect to MySQL (TCP port 3306). Host B (172.16.10.35) falls in the next /28 block and must be denied.',
    targetInterface: 'R1 G0/0',
    direction: 'inbound',
    tasks: [
      'Calculate the /28 wildcard mask (255.255.255.240 inverted -> 0.0.0.15) for network 172.16.10.16/28.',
      'Permit TCP traffic from 172.16.10.16 0.0.0.15 to Database Server host 192.168.5.100 on port 3306.',
      'Verify that Host A (172.16.10.18) and upper boundary host (172.16.10.30) match the /28 block and are permitted.',
      'Verify that Host B (172.16.10.35, in 172.16.10.32/28) and non-MySQL ports are denied.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended VLSM_DB_GUARD
 10 permit tcp 172.16.10.16 0.0.0.15 host 192.168.5.100 eq 3306
 20 deny ip any any`,
    topology: {
      nodes: [
        {
          id: 'host-a',
          label: 'Host A (/28 Valid)',
          ip: '172.16.10.18',
          type: 'host',
          x: 16,
          y: 25,
          subnet: '172.16.10.16/28',
        },
        {
          id: 'host-b',
          label: 'Host B (Next /28)',
          ip: '172.16.10.35',
          type: 'host',
          x: 16,
          y: 75,
          subnet: '172.16.10.32/28',
        },
        {
          id: 'router-r1',
          label: 'R1 (DB Gateway)',
          ip: '172.16.10.17',
          type: 'router',
          x: 52,
          y: 50,
          interfaceLabel: 'G0/0 IN',
        },
        {
          id: 'db-srv',
          label: 'Database Server',
          ip: '192.168.5.100',
          type: 'server',
          x: 85,
          y: 50,
          subnet: '192.168.5.0/24',
        },
      ],
      links: [
        { from: 'host-a', to: 'router-r1', label: 'G0/0 (.16/28)' },
        { from: 'host-b', to: 'router-r1', label: 'G0/0 (.32/28)' },
        { from: 'router-r1', to: 'db-srv', label: 'G0/1 (DB LAN)' },
      ],
    },
    testCases: [
      {
        id: 'tc-7-host-a-mysql',
        name: 'Host A (172.16.10.18) to Database Server MySQL (3306): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-7-1',
          description: 'Authorized /28 host 172.16.10.18 connecting to MySQL 3306',
          srcIp: '172.16.10.18',
          dstIp: '192.168.5.100',
          protocol: 'tcp',
          srcPort: 54300,
          dstPort: 3306,
        },
      },
      {
        id: 'tc-7-upper-host-mysql',
        name: 'Upper /28 Host (172.16.10.30) to Database Server MySQL (3306): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-7-2',
          description: 'Last usable host in 172.16.10.16/28 connecting to MySQL 3306',
          srcIp: '172.16.10.30',
          dstIp: '192.168.5.100',
          protocol: 'tcp',
          srcPort: 54301,
          dstPort: 3306,
        },
      },
      {
        id: 'tc-7-host-b-mysql',
        name: 'Host B (172.16.10.35 in .32/28) to Database Server (3306): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-7-3',
          description: 'Host B outside 172.16.10.16/28 attempting MySQL connection',
          srcIp: '172.16.10.35',
          dstIp: '192.168.5.100',
          protocol: 'tcp',
          srcPort: 54302,
          dstPort: 3306,
        },
      },
      {
        id: 'tc-7-lower-subnet-mysql',
        name: 'Lower Subnet Host (172.16.10.5 in .0/28) to Database Server: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-7-4',
          description: 'Host in 172.16.10.0/28 attempting MySQL connection',
          srcIp: '172.16.10.5',
          dstIp: '192.168.5.100',
          protocol: 'tcp',
          srcPort: 54303,
          dstPort: 3306,
        },
      },
      {
        id: 'tc-7-host-a-ssh',
        name: 'Host A (172.16.10.18) SSH (Port 22) to Database Server: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-7-5',
          description: 'Host A attempting SSH instead of permitted port 3306',
          srcIp: '172.16.10.18',
          dstIp: '192.168.5.100',
          protocol: 'tcp',
          srcPort: 54304,
          dstPort: 22,
        },
      },
    ],
  },

  // ============================================================================
  // LAB 8: Advanced — Shadowed Rules & Sequence Number Remediation
  // ============================================================================
  {
    id: 'lab-8-shadowed-remediation',
    title: 'Shadowed Rules & Sequence Number Remediation',
    difficulty: 'CCNA Advanced',
    objective:
      'Applied on R1 G0/1 Inbound. Configure rules with strict top-down sequence discipline: Admin PC (10.0.1.50) must be permitted SSH (port 22) to Financial DB (10.0.99.10), all other staff on 10.0.1.0/24 must be blocked from Financial DB, and general traffic from 10.0.1.0/24 to other destinations is permitted.',
    targetInterface: 'R1 G0/1',
    direction: 'inbound',
    tasks: [
      'Place the specific host rule first (e.g., Seq 10): permit TCP from host 10.0.1.50 to Financial DB host 10.0.99.10 eq 22 so it is not shadowed.',
      'Place the subnet block second (e.g., Seq 20): deny all IP traffic from Staff Subnet 10.0.1.0 0.0.0.255 to Financial DB host 10.0.99.10.',
      'Place the general permit third (e.g., Seq 30): permit IP from 10.0.1.0 0.0.0.255 to any other destination.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended SEQ_DISCIPLINE
 10 permit tcp host 10.0.1.50 host 10.0.99.10 eq 22
 20 deny ip 10.0.1.0 0.0.0.255 host 10.0.99.10
 30 permit ip 10.0.1.0 0.0.0.255 any`,
    topology: {
      nodes: [
        {
          id: 'admin-pc',
          label: 'Admin PC',
          ip: '10.0.1.50',
          type: 'host',
          x: 16,
          y: 25,
          subnet: '10.0.1.0/24',
        },
        {
          id: 'staff-pc',
          label: 'Staff Workstation',
          ip: '10.0.1.25',
          type: 'host',
          x: 16,
          y: 75,
          subnet: '10.0.1.0/24',
        },
        {
          id: 'router-r1',
          label: 'R1 (Core Router)',
          ip: '10.0.1.1',
          type: 'router',
          x: 50,
          y: 50,
          interfaceLabel: 'G0/1 IN',
        },
        {
          id: 'fin-db',
          label: 'Financial DB',
          ip: '10.0.99.10',
          type: 'server',
          x: 84,
          y: 25,
          subnet: '10.0.99.0/24',
        },
        {
          id: 'intranet-srv',
          label: 'Intranet App Svr',
          ip: '10.0.50.10',
          type: 'server',
          x: 84,
          y: 75,
          subnet: '10.0.50.0/24',
        },
      ],
      links: [
        { from: 'admin-pc', to: 'router-r1', label: 'G0/1 (10.0.1.0/24)' },
        { from: 'staff-pc', to: 'router-r1', label: 'G0/1 (10.0.1.0/24)' },
        { from: 'router-r1', to: 'fin-db', label: 'G0/2 (Finance)' },
        { from: 'router-r1', to: 'intranet-srv', label: 'G0/3 (App)' },
      ],
    },
    testCases: [
      {
        id: 'tc-8-admin-ssh-fin',
        name: 'Admin PC (10.0.1.50) SSH (22) to Financial DB (10.0.99.10): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-8-1',
          description: 'Admin PC connecting via SSH to Financial DB (must match before subnet deny)',
          srcIp: '10.0.1.50',
          dstIp: '10.0.99.10',
          protocol: 'tcp',
          srcPort: 58022,
          dstPort: 22,
        },
      },
      {
        id: 'tc-8-staff-ssh-fin',
        name: 'Staff PC (10.0.1.25) SSH (22) to Financial DB (10.0.99.10): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-8-2',
          description: 'Regular staff host attempting SSH to Financial DB',
          srcIp: '10.0.1.25',
          dstIp: '10.0.99.10',
          protocol: 'tcp',
          srcPort: 58099,
          dstPort: 22,
        },
      },
      {
        id: 'tc-8-admin-http-fin',
        name: 'Admin PC (10.0.1.50) HTTP (80) to Financial DB (10.0.99.10): Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-8-3',
          description: 'Admin PC attempting non-SSH port 80 to Financial DB',
          srcIp: '10.0.1.50',
          dstIp: '10.0.99.10',
          protocol: 'tcp',
          srcPort: 58100,
          dstPort: 80,
        },
      },
      {
        id: 'tc-8-staff-intranet',
        name: 'Staff PC (10.0.1.25) HTTP (80) to Intranet App Svr (10.0.50.10): Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-8-4',
          description: 'Staff PC accessing general Intranet Application Server',
          srcIp: '10.0.1.25',
          dstIp: '10.0.50.10',
          protocol: 'tcp',
          srcPort: 58200,
          dstPort: 80,
        },
      },
    ],
  },

  // ============================================================================
  // LAB 9: Advanced — Bitwise Parity Filtering (Odd vs Even Host Logic)
  // ============================================================================
  {
    id: 'lab-9-bitwise-parity',
    title: 'Bitwise Parity Filtering (Odd vs Even Host Logic)',
    difficulty: 'CCNA Advanced',
    objective:
      'Applied on R1 G0/0 Inbound. CCNA bitwise puzzle: Use a custom wildcard mask 0.0.0.254 on 192.168.100.0/24 to match and permit only even-numbered IP host addresses for HTTP (port 80) traffic to App Gateway (10.200.1.1), denying odd-numbered IPs.',
    targetInterface: 'R1 G0/0',
    direction: 'inbound',
    tasks: [
      'Understand wildcard 0.0.0.254 (binary 11111110 in the fourth octet): the 0 in the least-significant bit forces the last bit to match 0 (even).',
      'Permit TCP HTTP (eq 80) from source 192.168.100.0 with wildcard 0.0.0.254 to App Gateway host 10.200.1.1.',
      'Ensure odd-numbered hosts (such as 192.168.100.3 and 192.168.100.77) and non-HTTP ports are denied.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended EVEN_PARITY_HTTP
 10 permit tcp 192.168.100.0 0.0.0.254 host 10.200.1.1 eq 80
 20 deny ip any any`,
    topology: {
      nodes: [
        {
          id: 'lb-even',
          label: 'LB Node 1 (Even)',
          ip: '192.168.100.2',
          type: 'host',
          x: 16,
          y: 25,
          subnet: '192.168.100.0/24',
        },
        {
          id: 'lb-odd',
          label: 'LB Node 2 (Odd)',
          ip: '192.168.100.3',
          type: 'host',
          x: 16,
          y: 75,
          subnet: '192.168.100.0/24',
        },
        {
          id: 'router-r1',
          label: 'R1 (Parity Filter)',
          ip: '192.168.100.1',
          type: 'router',
          x: 52,
          y: 50,
          interfaceLabel: 'G0/0 IN',
        },
        {
          id: 'app-gw',
          label: 'App Gateway',
          ip: '10.200.1.1',
          type: 'server',
          x: 85,
          y: 50,
          subnet: '10.200.1.0/24',
        },
      ],
      links: [
        { from: 'lb-even', to: 'router-r1', label: 'G0/0 (.2 Even)' },
        { from: 'lb-odd', to: 'router-r1', label: 'G0/0 (.3 Odd)' },
        { from: 'router-r1', to: 'app-gw', label: 'G0/1 (App GW)' },
      ],
    },
    testCases: [
      {
        id: 'tc-9-even-2',
        name: 'LB Node 1 Even IP (192.168.100.2) HTTP (80) to App Gateway: Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-9-1',
          description: 'Even host 192.168.100.2 (LSB = 0) sending HTTP to App Gateway',
          srcIp: '192.168.100.2',
          dstIp: '10.200.1.1',
          protocol: 'tcp',
          srcPort: 50200,
          dstPort: 80,
        },
      },
      {
        id: 'tc-9-even-44',
        name: 'Even Host (192.168.100.44) HTTP (80) to App Gateway: Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-9-2',
          description: 'Even host 192.168.100.44 (LSB = 0) sending HTTP to App Gateway',
          srcIp: '192.168.100.44',
          dstIp: '10.200.1.1',
          protocol: 'tcp',
          srcPort: 50244,
          dstPort: 80,
        },
      },
      {
        id: 'tc-9-odd-3',
        name: 'LB Node 2 Odd IP (192.168.100.3) HTTP (80) to App Gateway: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-9-3',
          description: 'Odd host 192.168.100.3 (LSB = 1) blocked by 0.0.0.254 mask',
          srcIp: '192.168.100.3',
          dstIp: '10.200.1.1',
          protocol: 'tcp',
          srcPort: 50203,
          dstPort: 80,
        },
      },
      {
        id: 'tc-9-odd-77',
        name: 'Odd Host (192.168.100.77) HTTP (80) to App Gateway: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-9-4',
          description: 'Odd host 192.168.100.77 (LSB = 1) blocked by 0.0.0.254 mask',
          srcIp: '192.168.100.77',
          dstIp: '10.200.1.1',
          protocol: 'tcp',
          srcPort: 50277,
          dstPort: 80,
        },
      },
      {
        id: 'tc-9-even-ssh',
        name: 'LB Node 1 Even IP (192.168.100.2) SSH (22) to App Gateway: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-9-5',
          description: 'Even host attempting unauthorized port 22 instead of HTTP 80',
          srcIp: '192.168.100.2',
          dstIp: '10.200.1.1',
          protocol: 'tcp',
          srcPort: 50222,
          dstPort: 22,
        },
      },
    ],
  },

  // ============================================================================
  // LAB 10: Advanced — Router Control Plane Hardening (SNMP & Syslog)
  // ============================================================================
  {
    id: 'lab-10-copp-snmp-syslog',
    title: 'Router Control Plane Hardening (SNMP & Syslog)',
    difficulty: 'CCNA Advanced',
    objective:
      'Applied Inbound to Router Control Plane (G0/0). Only permit Management Station (10.10.10.5) to reach Router Loopback0 (10.255.255.1) for SNMP (UDP 161) and Syslog (UDP 514). Deny all ICMP and Telnet (TCP 23) traffic directed at the router from any host.',
    targetInterface: 'R1 Control Plane (G0/0)',
    direction: 'inbound',
    tasks: [
      'Permit UDP traffic from Management Station host 10.10.10.5 to Router Loopback0 host 10.255.255.1 on SNMP (eq 161).',
      'Permit UDP traffic from Management Station host 10.10.10.5 to Router Loopback0 host 10.255.255.1 on Syslog (eq 514).',
      'Deny all Telnet (TCP eq 23) and ICMP traffic from any source to Router Loopback0 (10.255.255.1) as well as any rogue SNMP polling.',
    ],
    initialAclText: '! Enter your configuration below\n',
    solutionAclText: `ip access-list extended CONTROL_PLANE_PROTECT
 10 permit udp host 10.10.10.5 host 10.255.255.1 eq 161
 20 permit udp host 10.10.10.5 host 10.255.255.1 eq 514
 30 deny tcp any host 10.255.255.1 eq 23
 40 deny icmp any host 10.255.255.1
 50 deny ip any any`,
    topology: {
      nodes: [
        {
          id: 'mgmt-station',
          label: 'Mgmt Station',
          ip: '10.10.10.5',
          type: 'host',
          x: 16,
          y: 25,
          subnet: '10.10.10.0/24',
        },
        {
          id: 'rogue-host',
          label: 'Rogue Host',
          ip: '10.10.10.99',
          type: 'host',
          x: 16,
          y: 75,
          subnet: '10.10.10.0/24',
        },
        {
          id: 'router-lo0',
          label: 'R1 Loopback0',
          ip: '10.255.255.1',
          type: 'router',
          x: 68,
          y: 50,
          interfaceLabel: 'CoPP G0/0 IN',
        },
      ],
      links: [
        { from: 'mgmt-station', to: 'router-lo0', label: 'G0/0 (Mgmt LAN)' },
        { from: 'rogue-host', to: 'router-lo0', label: 'G0/0 (Mgmt LAN)' },
      ],
    },
    testCases: [
      {
        id: 'tc-10-mgmt-snmp',
        name: 'Mgmt Station (10.10.10.5) SNMP (UDP 161) to Loopback0: Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-10-1',
          description: 'Authorized NMS polling Router Loopback0 via SNMP UDP 161',
          srcIp: '10.10.10.5',
          dstIp: '10.255.255.1',
          protocol: 'udp',
          srcPort: 56161,
          dstPort: 161,
        },
      },
      {
        id: 'tc-10-mgmt-syslog',
        name: 'Mgmt Station (10.10.10.5) Syslog (UDP 514) to Loopback0: Permit',
        expectedAction: 'permit',
        packet: {
          id: 'pkt-10-2',
          description: 'Authorized Syslog service traffic to Router Loopback0 UDP 514',
          srcIp: '10.10.10.5',
          dstIp: '10.255.255.1',
          protocol: 'udp',
          srcPort: 56514,
          dstPort: 514,
        },
      },
      {
        id: 'tc-10-rogue-snmp',
        name: 'Rogue Host (10.10.10.99) SNMP (UDP 161) to Loopback0: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-10-3',
          description: 'Unauthorized host attempting SNMP community walk on Loopback0',
          srcIp: '10.10.10.99',
          dstIp: '10.255.255.1',
          protocol: 'udp',
          srcPort: 59161,
          dstPort: 161,
        },
      },
      {
        id: 'tc-10-rogue-telnet',
        name: 'Rogue Host (10.10.10.99) Telnet (TCP 23) to Loopback0: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-10-4',
          description: 'Telnet management attack against Router Loopback0',
          srcIp: '10.10.10.99',
          dstIp: '10.255.255.1',
          protocol: 'tcp',
          srcPort: 59023,
          dstPort: 23,
        },
      },
      {
        id: 'tc-10-mgmt-icmp',
        name: 'Mgmt Station (10.10.10.5) ICMP Ping to Loopback0: Deny',
        expectedAction: 'deny',
        packet: {
          id: 'pkt-10-5',
          description: 'Inbound ICMP echo request blocked by Control Plane policy',
          srcIp: '10.10.10.5',
          dstIp: '10.255.255.1',
          protocol: 'icmp',
          icmpType: 'echo',
        },
      },
    ],
  },
];
