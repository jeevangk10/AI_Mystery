const scenario = 'A rare astronomical lens disappears from a private observatory during a public night-sky demonstration.';

const suspectIds = ['suspect_1', 'suspect_2', 'suspect_3'];
const evidenceIds = ['evidence_1', 'evidence_2', 'evidence_3', 'evidence_4', 'evidence_5', 'evidence_6'];
const evidenceTypes = ['chat', 'photo', 'cctv', 'witness', 'document', 'physical'];

function generatedCase(overrides = {}) {
  return {
    title: 'The Last Light at Bellweather Observatory',
    summary: 'A demonstration ends with one rare lens missing and three plausible explanations.',
    incident: {
      description: 'The observatory lens was reported missing just after the public demonstration.',
      location: 'Bellweather Observatory',
      occurredAt: '2026-05-12T22:00:00Z',
      timezone: 'UTC',
    },
    victim: { name: 'The Bellweather Observatory', description: 'A fictional public observatory lost a rare demonstration lens.' },
    suspects: suspectIds.map((id, index) => ({
      id,
      name: ['Mira Vale', 'Theo Finch', 'Lena Ward'][index],
      age: [42, 36, 51][index],
      occupation: ['Optics technician', 'Night curator', 'Volunteer astronomer'][index],
      biography: `Distinct fictional biography for suspect ${index + 1}.`,
      motive: `A plausible fictional motive for suspect ${index + 1}.`,
      alibi: `A stated fictional alibi for suspect ${index + 1}.`,
      personality: `A distinct fictional personality for suspect ${index + 1}.`,
    })),
    evidence: evidenceIds.map((id, index) => ({
      id,
      type: evidenceTypes[index],
      title: `Clue ${index + 1}`,
      description: `Fictional clue ${index + 1} contains a disclosed detail relevant to the case.`,
      content: index === 0 ? {
        messages: [{ sender: 'Mira Vale', recipient: 'Theo Finch', text: 'The lens case is still in storage.', timestamp: '2026-05-12T20:12:00Z' }],
      } : { observation: `Fictional evidence detail ${index + 1}.` },
      timestamp: `2026-05-12T${String(16 + index).padStart(2, '0')}:00:00Z`,
      location: 'Bellweather Observatory',
      suspectIds: index < 3 ? ['suspect_1', 'suspect_2'] : ['suspect_3'],
      importance: index < 2 ? 'high' : 'medium',
      imagePrompt: index === 1 ? 'Illustrative fictional observatory storeroom with a locked lens cabinet.' : '',
    })),
    timeline: [
      { id: 'event_1', timestamp: '2026-05-12T19:00:00Z', description: 'The fictional public demonstration begins.', sourceEvidenceIds: ['evidence_4'], confidence: 'confirmed' },
      { id: 'event_2', timestamp: '2026-05-12T20:12:00Z', description: 'A fictional message says the lens case remains in storage.', sourceEvidenceIds: ['evidence_1'], confidence: 'reported' },
      { id: 'event_3', timestamp: '2026-05-12T22:00:00Z', description: 'The missing lens is first reported.', sourceEvidenceIds: ['evidence_2', 'evidence_3'], confidence: 'confirmed' },
    ],
    solution: {
      culpritId: 'suspect_1',
      motive: 'Mira wanted to reclaim credit for the optics design.',
      method: 'She used a service key during the demonstration and concealed the lens in a carrying case.',
      solutionSummary: 'The access record and message timing show Mira could reach the cabinet while her stated alibi placed her elsewhere.',
      solutionSteps: ['The service key was used during the public demonstration.', 'The message timestamp conflicts with the location in Mira’s alibi.'],
      keyEvidenceIds: ['evidence_1', 'evidence_2'],
      evidenceReasoning: [
        { evidenceId: 'evidence_1', suspectId: 'suspect_1', claim: 'Mira said she stayed in the gallery.', explanation: 'The message timestamp places her near the service corridor.', relationship: 'supports' },
        { evidenceId: 'evidence_2', suspectId: 'suspect_1', claim: 'Mira had no access to the cabinet.', explanation: 'The cabinet record shows her service key was used.', relationship: 'supports' },
        { evidenceId: 'evidence_3', suspectId: 'suspect_2', claim: 'Theo remained in the projection room.', explanation: 'The camera log places him there during the relevant interval.', relationship: 'contradicts' },
      ],
    },
    ...overrides,
  };
}

module.exports = { generatedCase, scenario, suspectIds, evidenceIds, evidenceTypes };
