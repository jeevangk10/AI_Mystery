const string = { type: 'string' };
const stringArray = { type: 'array', items: string };
const object = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

const GENERATION_RESPONSE_SCHEMA = object({
  title: string,
  summary: string,
  incident: object({ description: string, location: string, occurredAt: string, timezone: { type: 'string', enum: ['UTC'] } }),
  victim: object({ name: string, description: string }),
  suspects: {
    type: 'array',
    items: object({
      id: string,
      name: string,
      age: { type: 'integer' },
      occupation: string,
      biography: string,
      motive: string,
      alibi: string,
      personality: string,
    }),
  },
  evidence: {
    type: 'array',
    items: object({
      id: string,
      type: { type: 'string', enum: ['chat', 'photo', 'cctv', 'witness', 'document', 'physical'] },
      title: string,
      description: string,
      content: { type: 'object', additionalProperties: true },
      timestamp: string,
      location: string,
      suspectIds: stringArray,
      importance: { type: 'string', enum: ['low', 'medium', 'high'] },
      imagePrompt: string,
    }),
  },
  timeline: {
    type: 'array',
    items: object({
      id: string,
      timestamp: string,
      description: string,
      sourceEvidenceIds: stringArray,
      confidence: { type: 'string', enum: ['confirmed', 'reported', 'uncertain'] },
    }),
  },
  solution: object({
    culpritId: string,
    motive: string,
    method: string,
    solutionSummary: string,
    solutionSteps: stringArray,
    keyEvidenceIds: stringArray,
    evidenceReasoning: {
      type: 'array',
      items: object({
        evidenceId: string,
        suspectId: string,
        claim: string,
        explanation: string,
        relationship: { type: 'string', enum: ['supports', 'contradicts', 'contextualizes'] },
      }),
    },
  }),
});

module.exports = GENERATION_RESPONSE_SCHEMA;
