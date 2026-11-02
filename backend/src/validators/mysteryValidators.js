const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid identifier.');

const createInvestigationSchema = z.object({
  mysteryId: objectId,
}).strict();

const listInvestigationsSchema = z.object({
  status: z.enum(['active', 'completed']).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();

const listEvidenceSchema = z.object({
  type: z.enum(['chat', 'photo', 'cctv', 'witness', 'document', 'physical']).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();

const examineEvidenceSchema = z.object({ examined: z.boolean() }).strict();
const submitAccusationSchema = z.object({ suspectId: objectId }).strict();

module.exports = {
  objectId,
  createInvestigationSchema,
  listInvestigationsSchema,
  listEvidenceSchema,
  examineEvidenceSchema,
  submitAccusationSchema,
};
