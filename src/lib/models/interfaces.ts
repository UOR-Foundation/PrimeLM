// =============================================================================
// MODEL INTERFACES - Core interfaces for PrimeLM model-driven architecture
// =============================================================================

/**
 * Base interface for all PrimeLM models
 * Ensures consistent initialization and state management
 */
export interface PrimeLMModel {
  name: string;
  version: string;
  initialize(): Promise<void>;
  isInitialized(): boolean;
}

/**
 * Interface for embeddings models that convert text to numerical vectors
 * These vectors are then converted to prime factorizations for mathematical operations
 */
export interface EmbeddingsModel extends PrimeLMModel {
  dimensions: number;
  encode(text: string): Promise<number[]>;
}

/**
 * Interface for intent classification models
 * Replaces hardcoded regex patterns for intent recognition
 */
export interface IntentModel extends PrimeLMModel {
  intents: string[];
  classify(text: string): Promise<{
    intent: string;
    confidence: number;
  }>;
}

/**
 * Interface for named entity recognition models
 * Replaces pattern-based entity extraction with ML-driven approach
 */
export interface EntityModel extends PrimeLMModel {
  entityTypes: string[];
  extract(text: string): Promise<{
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
  }>;
}

/**
 * Interface for emotion detection models
 * Replaces keyword-based emotion analysis with sophisticated ML models
 */
export interface EmotionModel extends PrimeLMModel {
  emotions: string[];
  analyze(text: string): Promise<{
    emotion: string;
    valence: number;    // -1 to 1 (negative to positive)
    arousal: number;    // 0 to 1 (calm to excited)
    confidence: number;
  }>;
}

/**
 * Interface for topic modeling
 * Replaces simple keyword extraction with semantic topic analysis
 */
export interface TopicModel extends PrimeLMModel {
  topics: string[];
  analyze(text: string): Promise<{
    topics: Array<{
      topic: string;
      confidence: number;
    }>;
  }>;
}

/**
 * Error types for model operations
 * Implements fail-fast design with explicit error handling
 */
export class ModelInitializationError extends Error {
  constructor(modelName: string, originalError: Error) {
    super(`Failed to initialize model ${modelName}: ${originalError.message}`);
    this.name = 'ModelInitializationError';
  }
}

export class ModelProcessingError extends Error {
  constructor(modelType: string, operation: string, originalError: Error) {
    super(`${modelType} model failed during ${operation}: ${originalError.message}`);
    this.name = 'ModelProcessingError';
  }
}

export class InvalidInputError extends Error {
  constructor(input: string, reason: string) {
    super(`Invalid input "${input}": ${reason}`);
    this.name = 'InvalidInputError';
  }
}

export class ModelNotFoundError extends Error {
  constructor(modelType: string) {
    super(`Model type '${modelType}' not registered`);
    this.name = 'ModelNotFoundError';
  }
}
