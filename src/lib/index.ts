// =============================================================================
// PRIMELM LIBRARY - Main Exports
// =============================================================================

// Core Mathematical Foundation (Layers 1-2)
export * from './core';

// Semantic Understanding (Layer 3)
export * from './semantic';

// Conversation Management (Layers 4-6)
export * from './conversation';

// Memory and Intelligence (Layers 7-8)
export * from './memory';

// System Infrastructure
export * from './system';

// Model Infrastructure (explicit exports to avoid naming conflicts)
export {
  // Interfaces
  type PrimeLMModel,
  type EmbeddingsModel as ModelEmbeddingsInterface,
  type IntentModel,
  type EntityModel,
  type EmotionModel,
  type TopicModel,
  // Error types
  ModelInitializationError,
  ModelProcessingError,
  InvalidInputError,
  ModelNotFoundError,
  // Registry
  ModelRegistry,
  modelRegistry,
  // Base classes
  BasePrimeLMModel,
  BaseEmbeddingsModel,
  BaseIntentModel,
  BaseEntityModel,
  BaseEmotionModel,
  // Factory
  ModelFactory,
  MockModelCreators
} from './models';

// Configuration
export * from './config/model-config';
