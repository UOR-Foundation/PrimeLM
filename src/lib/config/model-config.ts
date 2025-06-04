// =============================================================================
// MODEL CONFIGURATION - Configuration for PrimeLM model-driven architecture
// =============================================================================

/**
 * Configuration for embeddings models
 */
export interface EmbeddingsConfig {
  model: string;
  dimensions: number;
  required: boolean;
}

/**
 * Configuration for intent classification models
 */
export interface IntentConfig {
  model: string;
  intents: string[];
  required: boolean;
}

/**
 * Configuration for entity recognition models
 */
export interface EntityConfig {
  model: string;
  types: string[];
  required: boolean;
}

/**
 * Configuration for emotion detection models
 */
export interface EmotionConfig {
  model: string;
  emotions: string[];
  required: boolean;
}

/**
 * Configuration for topic modeling
 */
export interface TopicConfig {
  model: string;
  topics: string[];
  required: boolean;
}

/**
 * Complete model configuration for PrimeLM
 * Defines which models to use for each type of analysis
 */
export interface ModelConfig {
  embeddings: EmbeddingsConfig;
  intent: IntentConfig;
  entities: EntityConfig;
  emotion: EmotionConfig;
  topic?: TopicConfig; // Optional for now
}

/**
 * Default model configuration for PrimeLM
 * Uses enhanced embeddings pipeline with 768-dimensional MPNet model
 * As specified in PrimeLM-Task1.md implementation plan
 */
export const MODEL_CONFIG: ModelConfig = {
  embeddings: {
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
    required: true
  },
  intent: {
    model: 'semantic-intent-classifier',
    intents: [
      'GREETING',
      'IDENTITY_INTRODUCTION', 
      'ENTITY_INTRODUCTION',
      'IDENTITY_QUERY',
      'ENTITY_QUERY', 
      'HELP_REQUEST',
      'GRATITUDE',
      'POSITIVE_FEEDBACK',
      'INFORMATION_REQUEST',
      'KNOWLEDGE_REQUEST',
      'QUESTION'
    ],
    required: true
  },
  entities: {
    model: 'semantic-ner-classifier',
    types: ['PERSON', 'ANIMAL', 'VEHICLE', 'PLACE', 'ORGANIZATION', 'PRODUCT'],
    required: true
  },
  emotion: {
    model: 'semantic-emotion-classifier',
    emotions: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'],
    required: true
  }
};

/**
 * Validate model configuration
 * Ensures all required models are specified and valid
 */
export function validateModelConfig(config: ModelConfig): void {
  const errors: string[] = [];

  // Validate embeddings config
  if (!config.embeddings) {
    errors.push('Embeddings configuration is required');
  } else {
    if (!config.embeddings.model) {
      errors.push('Embeddings model name is required');
    }
    if (!config.embeddings.dimensions || config.embeddings.dimensions <= 0) {
      errors.push('Embeddings dimensions must be a positive number');
    }
  }

  // Validate intent config
  if (!config.intent) {
    errors.push('Intent configuration is required');
  } else {
    if (!config.intent.model) {
      errors.push('Intent model name is required');
    }
    if (!config.intent.intents || config.intent.intents.length === 0) {
      errors.push('Intent types must be specified');
    }
  }

  // Validate entities config
  if (!config.entities) {
    errors.push('Entities configuration is required');
  } else {
    if (!config.entities.model) {
      errors.push('Entities model name is required');
    }
    if (!config.entities.types || config.entities.types.length === 0) {
      errors.push('Entity types must be specified');
    }
  }

  // Validate emotion config
  if (!config.emotion) {
    errors.push('Emotion configuration is required');
  } else {
    if (!config.emotion.model) {
      errors.push('Emotion model name is required');
    }
    if (!config.emotion.emotions || config.emotion.emotions.length === 0) {
      errors.push('Emotion types must be specified');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Model configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get model configuration with validation
 * Returns the default configuration after validation
 */
export function getValidatedModelConfig(): ModelConfig {
  validateModelConfig(MODEL_CONFIG);
  return MODEL_CONFIG;
}

/**
 * Create a custom model configuration
 * Allows overriding specific model settings while keeping defaults for others
 */
export function createModelConfig(overrides: Partial<ModelConfig>): ModelConfig {
  const config: ModelConfig = {
    ...MODEL_CONFIG,
    ...overrides
  };

  validateModelConfig(config);
  return config;
}

/**
 * Model configuration for testing
 * Uses mock models that don't require actual ML model loading
 */
export const TEST_MODEL_CONFIG: ModelConfig = {
  embeddings: {
    model: 'mock-embeddings-model',
    dimensions: 384,
    required: true
  },
  intent: {
    model: 'mock-intent-model',
    intents: ['GREETING', 'QUESTION', 'HELP_REQUEST'],
    required: true
  },
  entities: {
    model: 'mock-ner-model',
    types: ['PERSON', 'PLACE', 'THING'],
    required: true
  },
  emotion: {
    model: 'mock-emotion-model',
    emotions: ['joy', 'sadness', 'anger'],
    required: true
  }
};
