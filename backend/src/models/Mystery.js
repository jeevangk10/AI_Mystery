const mongoose = require('mongoose');

const { Schema } = mongoose;

const suspectSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  age: { type: Number, min: 1, max: 130 },
  occupation: { type: String, trim: true, maxlength: 160, default: '' },
  biography: { type: String, required: true, trim: true, maxlength: 3000 },
  motive: { type: String, required: true, trim: true, maxlength: 2000 },
  alibi: { type: String, required: true, trim: true, maxlength: 2000 },
  avatarUrl: { type: String, trim: true, maxlength: 2048, default: '' },
}, { id: false });

const evidenceSchema = new Schema({
  type: {
    type: String,
    enum: ['chat', 'photo', 'cctv', 'witness', 'document', 'physical'],
    required: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  content: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, required: true },
  location: { type: String, trim: true, maxlength: 240, default: '' },
  suspectIds: [{ type: Schema.Types.ObjectId }],
  assetUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  assetStatus: { type: String, enum: ['not-requested', 'pending', 'ready', 'fallback', 'failed'], default: 'not-requested' },
  importance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { id: false });

const timelineEventSchema = new Schema({
  timestamp: { type: Date, required: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  sourceEvidenceIds: [{ type: Schema.Types.ObjectId }],
  confidence: { type: String, enum: ['confirmed', 'reported', 'uncertain'], required: true },
}, { id: false });

const reasoningSchema = new Schema({
  evidenceId: { type: Schema.Types.ObjectId, required: true },
  suspectId: { type: Schema.Types.ObjectId },
  claim: { type: String, trim: true, maxlength: 1000, default: '' },
  explanation: { type: String, required: true, trim: true, maxlength: 2000 },
  relationship: { type: String, enum: ['supports', 'contradicts', 'contextualizes'], required: true },
}, { _id: false });

const solutionSchema = new Schema({
  culpritId: { type: Schema.Types.ObjectId, required: true },
  motive: { type: String, required: true, trim: true, maxlength: 2000 },
  method: { type: String, required: true, trim: true, maxlength: 2000 },
  solutionSummary: { type: String, required: true, trim: true, maxlength: 4000 },
  solutionSteps: [{ type: String, trim: true, maxlength: 2000 }],
  keyEvidenceIds: [{ type: Schema.Types.ObjectId }],
  evidenceReasoning: [reasoningSchema],
}, { _id: false });

const mysterySchema = new Schema({
  title: { type: String, trim: true, maxlength: 160, default: '' },
  scenario: { type: String, required: true, trim: true, minlength: 50, maxlength: 3000 },
  caseType: { type: String, enum: ['any', 'theft', 'disappearance', 'murder', 'fraud', 'custom'], default: 'any' },
  tone: { type: String, enum: ['classic-detective', 'psychological', 'noir', 'lighthearted'], default: 'classic-detective' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  status: { type: String, enum: ['generating', 'validating', 'ready', 'failed', 'archived'], default: 'generating', index: true },
  generationErrorCode: { type: String, enum: ['AI_PROVIDER_ERROR', 'CASE_VALIDATION_FAILED', 'GENERATION_FAILED'], select: false },
  ownerSessionId: { type: String, required: true, index: true },
  summary: { type: String, trim: true, maxlength: 5000, default: '' },
  incident: {
    description: { type: String, trim: true, maxlength: 4000, default: '' },
    location: { type: String, trim: true, maxlength: 240, default: '' },
    occurredAt: { type: Date },
    timezone: { type: String, trim: true, maxlength: 100, default: 'UTC' },
  },
  victim: {
    name: { type: String, trim: true, maxlength: 160, default: '' },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  suspects: { type: [suspectSchema], default: [] },
  evidence: { type: [evidenceSchema], default: [] },
  timeline: { type: [timelineEventSchema], default: [] },
  solution: { type: solutionSchema, select: false },
}, {
  timestamps: true,
  minimize: false,
  strict: 'throw',
  toJSON: {
    transform(_doc, value) {
      delete value.solution;
      delete value.ownerSessionId;
      delete value.__v;
      return value;
    },
  },
  toObject: { minimize: false },
});

mysterySchema.index({ ownerSessionId: 1, createdAt: -1 });
mysterySchema.index({ status: 1, createdAt: -1 });

mysterySchema.pre('validate', function validateReadyCase() {
  if (this.status !== 'ready') return;

  const targets = { easy: [3, 6], medium: [4, 8], hard: [5, 10] };
  const [expectedSuspects, expectedEvidence] = targets[this.difficulty] || [];
  if (this.suspects.length !== expectedSuspects) {
    this.invalidate('suspects', `A ready ${this.difficulty} mystery must contain ${expectedSuspects} suspects.`);
  }

  if (this.evidence.length !== expectedEvidence) {
    this.invalidate('evidence', `A ready ${this.difficulty} mystery must contain ${expectedEvidence} evidence items.`);
  }

  if (!this.incident?.occurredAt || !this.incident?.location || !this.summary) {
    this.invalidate('incident', 'A ready mystery requires an incident time, location, and case summary.');
  }

  const suspectIds = new Set(this.suspects.map((suspect) => suspect._id.toString()));
  const evidenceIds = new Set(this.evidence.map((item) => item._id.toString()));
  const names = this.suspects.map((suspect) => suspect.name.trim().toLocaleLowerCase());

  if (new Set(names).size !== names.length) {
    this.invalidate('suspects', 'Suspect names must be unique within a case.');
  }

  if (!this.solution || !suspectIds.has(this.solution.culpritId?.toString())) {
    this.invalidate('solution.culpritId', 'A ready mystery must have one culprit that references an existing suspect.');
  }

  if (this.solution && this.solution.keyEvidenceIds.length < 2) {
    this.invalidate('solution.keyEvidenceIds', 'A ready mystery must have at least two key evidence items.');
  }

  for (const item of this.evidence) {
    for (const suspectId of item.suspectIds) {
      if (!suspectIds.has(suspectId.toString())) {
        this.invalidate('evidence', 'Every evidence suspect reference must point to a suspect in this case.');
      }
    }
  }

  for (const event of this.timeline) {
    for (const evidenceId of event.sourceEvidenceIds) {
      if (!evidenceIds.has(evidenceId.toString())) {
        this.invalidate('timeline', 'Every timeline evidence reference must point to evidence in this case.');
      }
    }
  }

  if (this.solution) {
    for (const evidenceId of this.solution.keyEvidenceIds) {
      if (!evidenceIds.has(evidenceId.toString())) {
        this.invalidate('solution.keyEvidenceIds', 'Every key evidence reference must point to evidence in this case.');
      }
    }
    for (const reasoning of this.solution.evidenceReasoning) {
      if (!evidenceIds.has(reasoning.evidenceId.toString())) {
        this.invalidate('solution.evidenceReasoning', 'Every reasoning reference must point to evidence in this case.');
      }
      if (reasoning.suspectId && !suspectIds.has(reasoning.suspectId.toString())) {
        this.invalidate('solution.evidenceReasoning', 'Every reasoning suspect reference must point to a suspect in this case.');
      }
    }
  }
});

module.exports = mongoose.models.Mystery || mongoose.model('Mystery', mysterySchema);
