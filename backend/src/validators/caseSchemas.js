const { z } = require('zod');

const scenarioSchema = z.string().trim().min(50).max(3000);

const createMysterySchema = z.object({
  scenario: scenarioSchema,
  title: z.string().trim().max(160).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  caseType: z.enum(['any', 'theft', 'disappearance', 'murder', 'fraud', 'custom']).default('any'),
  tone: z.enum(['classic-detective', 'psychological', 'noir', 'lighthearted']).default('classic-detective'),
}).strict();

const isoTimestamp = z.string().refine((value) => (
  !Number.isNaN(Date.parse(value)) && /(?:Z|[+-]\d\d:\d\d)$/.test(value)
), 'Timestamp must be ISO-8601 and include a timezone.');

const suspectSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(120),
  age: z.number().int().min(1).max(130),
  occupation: z.string().trim().min(1).max(160),
  biography: z.string().trim().min(1).max(3000),
  motive: z.string().trim().min(1).max(2000),
  alibi: z.string().trim().min(1).max(2000),
  personality: z.string().trim().min(1).max(1000),
}).strict();

const evidenceSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(['chat', 'photo', 'cctv', 'witness', 'document', 'physical']),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(4000),
  content: z.record(z.string(), z.unknown()),
  timestamp: isoTimestamp,
  location: z.string().trim().min(1).max(240),
  suspectIds: z.array(z.string().min(1).max(40)),
  importance: z.enum(['low', 'medium', 'high']),
  imagePrompt: z.string().max(1000),
}).strict();

const timelineEventSchema = z.object({
  id: z.string().min(1).max(40),
  timestamp: isoTimestamp,
  description: z.string().trim().min(1).max(2000),
  sourceEvidenceIds: z.array(z.string().min(1).max(40)),
  confidence: z.enum(['confirmed', 'reported', 'uncertain']),
}).strict();

const reasoningSchema = z.object({
  evidenceId: z.string().min(1).max(40),
  suspectId: z.string().min(1).max(40),
  claim: z.string().trim().min(1).max(1000),
  explanation: z.string().trim().min(1).max(2000),
  relationship: z.enum(['supports', 'contradicts', 'contextualizes']),
}).strict();

const generatedCaseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(5000),
  incident: z.object({
    description: z.string().trim().min(1).max(4000),
    location: z.string().trim().min(1).max(240),
    occurredAt: isoTimestamp,
    timezone: z.literal('UTC'),
  }).strict(),
  victim: z.object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(2000),
  }).strict(),
  suspects: z.array(suspectSchema),
  evidence: z.array(evidenceSchema),
  timeline: z.array(timelineEventSchema).min(3),
  solution: z.object({
    culpritId: z.string().min(1).max(40),
    motive: z.string().trim().min(1).max(2000),
    method: z.string().trim().min(1).max(2000),
    solutionSummary: z.string().trim().min(1).max(4000),
    solutionSteps: z.array(z.string().trim().min(1).max(2000)).min(2),
    keyEvidenceIds: z.array(z.string().min(1).max(40)).min(2),
    evidenceReasoning: z.array(reasoningSchema).min(3),
  }).strict(),
}).strict();

module.exports = { createMysterySchema, generatedCaseSchema };
