// =============================================================================
// MODELS INDEX - Central exports for PrimeLM model infrastructure
// =============================================================================

// Core interfaces
export type {
  PrimeLMModel,
  EmbeddingsModel,
  IntentModel,
  EntityModel,
  EmotionModel,
  TopicModel
} from './interfaces';

// Error types
export {
  ModelInitializationError,
  ModelProcessingError,
  InvalidInputError,
  ModelNotFoundError
} from './interfaces';

// Model registry
export {
  ModelRegistry,
  modelRegistry
} from './model-registry';

// Base model classes
export {
  BasePrimeLMModel,
  BaseEmbeddingsModel,
  BaseIntentModel,
  BaseEntityModel,
  BaseEmotionModel
} from './base/base-model';

// Model factory
export {
  ModelFactory,
  ProductionModelCreators,
  MockModelCreators
} from './factory/model-factory';

// Specific model implementations
export { MPNetEmbeddingsModel } from './embeddings/mpnet-model';
export { MPNet768EmbeddingsModel } from './embeddings/mpnet-768-model';
export { SemanticIntentModel } from './intent/semantic-intent-model';
export { SemanticNERModel } from './entities/semantic-ner-model';
export { SemanticEmotionModel } from './emotion/semantic-emotion-model';
export { HuggingFaceIntentModel } from './intent/huggingface-intent-model';
export { HuggingFaceNERModel } from './entities/huggingface-ner-model';
export { HuggingFaceEmotionModel } from './emotion/huggingface-emotion-model';
