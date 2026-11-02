const Mystery = require('../../models/Mystery');
const env = require('../../config/env');
const { createGeminiCaseProvider } = require('./geminiClient');
const { CaseValidationError, validateGeneratedCase, mapValidatedCase } = require('./caseValidator');

class MysteryGenerationError extends Error {
  constructor(code, diagnosticCode = 'GENERATION_FAILED') {
    super('The case could not be generated and validated.');
    this.name = 'MysteryGenerationError';
    this.code = code;
    this.diagnosticCode = diagnosticCode;
  }
}

function clearGeneratedFields(mystery, input) {
  mystery.set({
    title: input.title || '',
    summary: '',
    incident: { description: '', location: '', timezone: 'UTC' },
    victim: { name: '', description: '' },
    suspects: [],
    evidence: [],
    timeline: [],
    solution: undefined,
  });
}

function createMysteryGenerationService({
  MysteryModel = Mystery,
  provider,
  maxAttempts = env.GEMINI_MAX_ATTEMPTS,
} = {}) {
  if (!provider || typeof provider.generateCase !== 'function') {
    throw new Error('Mystery generation requires a case generation provider.');
  }

  return async function generateMystery({ input, ownerSessionId }) {
    const mystery = new MysteryModel({
      ...input,
      status: 'generating',
      ownerSessionId,
    });
    await mystery.save();

    let finalError;
    let feedback = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      mystery.status = 'validating';
      mystery.generationErrorCode = undefined;
      await mystery.save();

      try {
        const generated = await provider.generateCase({ ...input, feedback });
        const validated = validateGeneratedCase(generated, input);
        mystery.set(mapValidatedCase(validated, input));
        mystery.status = 'ready';
        mystery.generationErrorCode = undefined;
        await mystery.validate();
      } catch (error) {
        finalError = error;
        const canRetry = error.retryable !== false && attempt < maxAttempts;
        const diagnostic = error.diagnosticCode || (error instanceof CaseValidationError ? 'CASE_VALIDATION' : 'VALIDATION_FAILURE');
        console.warn(`[${error.code || 'CASE_VALIDATION_FAILED'}:${diagnostic}] mystery generation attempt ${attempt}/${maxAttempts} failed.`);
        if (!canRetry) break;

        feedback = error instanceof CaseValidationError
          ? error.issues.slice(0, 8)
          : ['The provider request failed temporarily. Return a complete valid case object.'];
        clearGeneratedFields(mystery, input);
        mystery.status = 'generating';
        await mystery.save();
        continue;
      }

      await mystery.save();
      return mystery;
    }

    const generationErrorCode = finalError?.code === 'CASE_VALIDATION_FAILED'
      ? 'CASE_VALIDATION_FAILED'
      : 'AI_PROVIDER_ERROR';
    clearGeneratedFields(mystery, input);
    mystery.status = 'failed';
    mystery.generationErrorCode = generationErrorCode;
    await mystery.save();
    throw new MysteryGenerationError(generationErrorCode, finalError?.diagnosticCode);
  };
}

const defaultProvider = createGeminiCaseProvider({
  apiKey: env.GEMINI_API_KEY,
  model: env.GEMINI_TEXT_MODEL,
  timeoutMs: env.GENERATION_TIMEOUT_MS,
});

const generateMystery = createMysteryGenerationService({ provider: defaultProvider });

module.exports = {
  createMysteryGenerationService,
  generateMystery,
  MysteryGenerationError,
};
