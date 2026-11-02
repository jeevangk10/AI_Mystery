const mongoose = require('mongoose');

const { Schema } = mongoose;

const noteSchema = new Schema({
  evidenceId: { type: Schema.Types.ObjectId, required: true },
  text: { type: String, trim: true, maxlength: 2000, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const accusationSchema = new Schema({
  suspectId: { type: Schema.Types.ObjectId, required: true },
  isCorrect: { type: Boolean, required: true },
  submittedAt: { type: Date, required: true },
}, { _id: false });

const investigationSchema = new Schema({
  mysteryId: { type: Schema.Types.ObjectId, ref: 'Mystery', required: true, index: true },
  ownerSessionId: { type: String, required: true, index: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
  examinedEvidenceIds: [{ type: Schema.Types.ObjectId }],
  notes: { type: [noteSchema], default: [] },
  accusation: { type: accusationSchema, default: undefined },
  score: { type: Number, min: 0, max: 100, default: undefined },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: undefined },
}, {
  timestamps: true,
  optimisticConcurrency: true,
  strict: 'throw',
  toJSON: {
    transform(_doc, value) {
      delete value.ownerSessionId;
      delete value.__v;
      return value;
    },
  },
});

investigationSchema.index({ ownerSessionId: 1, updatedAt: -1 });
investigationSchema.index({ ownerSessionId: 1, status: 1, updatedAt: -1 });
investigationSchema.index(
  { ownerSessionId: 1, mysteryId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } },
);

investigationSchema.pre('validate', function validateState() {
  if (this.status === 'completed' && (!this.accusation || !this.completedAt)) {
    this.invalidate('status', 'A completed investigation requires a validated accusation and completion time.');
  }
  if (this.status === 'active' && this.completedAt) {
    this.invalidate('completedAt', 'An active investigation cannot have a completion time.');
  }
});

module.exports = mongoose.models.Investigation || mongoose.model('Investigation', investigationSchema);
