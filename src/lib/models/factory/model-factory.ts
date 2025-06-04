// =============================================================================
// MODEL FACTORY - Factory for creating models from configuration
// =============================================================================

import { 
  PrimeLMModel, 
  EmbeddingsModel, 
  IntentModel, 
  EntityModel, 
  EmotionModel,
  ModelInitializationError
} from '../interfaces';
import { ModelConfig } from '../../config/model-config';

/**
 * Factory for creating models based on configuration
 * Enables model-agnostic architecture where models can be swapped via config
 */
export class ModelFactory {
  private static embeddingsModelCreators = new Map<string, () => EmbeddingsModel>();
  private static intentModelCreators = new Map<string, () => IntentModel>();
  private static entityModelCreators = new Map<string, () => EntityModel>();
  private static emotionModelCreators = new Map<string, () => EmotionModel>();

  /**
   * Register an embeddings model creator
   */
  static registerEmbeddingsModel(modelName: string, creator: () => EmbeddingsModel): void {
    this.embeddingsModelCreators.set(modelName, creator);
  }

  /**
   * Register an intent model creator
   */
  static registerIntentModel(modelName: string, creator: () => IntentModel): void {
    this.intentModelCreators.set(modelName, creator);
  }

  /**
   * Register an entity model creator
   */
  static registerEntityModel(modelName: string, creator: () => EntityModel): void {
    this.entityModelCreators.set(modelName, creator);
  }

  /**
   * Register an emotion model creator
   */
  static registerEmotionModel(modelName: string, creator: () => EmotionModel): void {
    this.emotionModelCreators.set(modelName, creator);
  }

  /**
   * Create an embeddings model from configuration
   */
  static createEmbeddingsModel(config: ModelConfig): EmbeddingsModel {
    const creator = this.embeddingsModelCreators.get(config.embeddings.model);
    if (!creator) {
      throw new ModelInitializationError(
        config.embeddings.model,
        new Error(`No creator registered for embeddings model: ${config.embeddings.model}`)
      );
    }
    return creator();
  }

  /**
   * Create an intent model from configuration
   */
  static createIntentModel(config: ModelConfig): IntentModel {
    const creator = this.intentModelCreators.get(config.intent.model);
    if (!creator) {
      throw new ModelInitializationError(
        config.intent.model,
        new Error(`No creator registered for intent model: ${config.intent.model}`)
      );
    }
    return creator();
  }

  /**
   * Create an entity model from configuration
   */
  static createEntityModel(config: ModelConfig): EntityModel {
    const creator = this.entityModelCreators.get(config.entities.model);
    if (!creator) {
      throw new ModelInitializationError(
        config.entities.model,
        new Error(`No creator registered for entity model: ${config.entities.model}`)
      );
    }
    return creator();
  }

  /**
   * Create an emotion model from configuration
   */
  static createEmotionModel(config: ModelConfig): EmotionModel {
    const creator = this.emotionModelCreators.get(config.emotion.model);
    if (!creator) {
      throw new ModelInitializationError(
        config.emotion.model,
        new Error(`No creator registered for emotion model: ${config.emotion.model}`)
      );
    }
    return creator();
  }

  /**
   * Create all models from configuration
   */
  static createAllModels(config: ModelConfig): {
    embeddings: EmbeddingsModel;
    intent: IntentModel;
    entities: EntityModel;
    emotion: EmotionModel;
  } {
    return {
      embeddings: this.createEmbeddingsModel(config),
      intent: this.createIntentModel(config),
      entities: this.createEntityModel(config),
      emotion: this.createEmotionModel(config)
    };
  }

  /**
   * Get all registered model names
   */
  static getRegisteredModels(): {
    embeddings: string[];
    intent: string[];
    entities: string[];
    emotion: string[];
  } {
    return {
      embeddings: Array.from(this.embeddingsModelCreators.keys()),
      intent: Array.from(this.intentModelCreators.keys()),
      entities: Array.from(this.entityModelCreators.keys()),
      emotion: Array.from(this.emotionModelCreators.keys())
    };
  }

  /**
   * Check if a model is registered
   */
  static isModelRegistered(type: 'embeddings' | 'intent' | 'entities' | 'emotion', modelName: string): boolean {
    switch (type) {
      case 'embeddings':
        return this.embeddingsModelCreators.has(modelName);
      case 'intent':
        return this.intentModelCreators.has(modelName);
      case 'entities':
        return this.entityModelCreators.has(modelName);
      case 'emotion':
        return this.emotionModelCreators.has(modelName);
      default:
        return false;
    }
  }

  /**
   * Validate that all models in config are registered
   */
  static validateConfig(config: ModelConfig): void {
    const errors: string[] = [];

    if (!this.isModelRegistered('embeddings', config.embeddings.model)) {
      errors.push(`Embeddings model '${config.embeddings.model}' is not registered`);
    }

    if (!this.isModelRegistered('intent', config.intent.model)) {
      errors.push(`Intent model '${config.intent.model}' is not registered`);
    }

    if (!this.isModelRegistered('entities', config.entities.model)) {
      errors.push(`Entity model '${config.entities.model}' is not registered`);
    }

    if (!this.isModelRegistered('emotion', config.emotion.model)) {
      errors.push(`Emotion model '${config.emotion.model}' is not registered`);
    }

    if (errors.length > 0) {
      throw new Error(`Model factory validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Clear all registered models (for testing)
   */
  static clear(): void {
    this.embeddingsModelCreators.clear();
    this.intentModelCreators.clear();
    this.entityModelCreators.clear();
    this.emotionModelCreators.clear();
  }
}

/**
 * Register production models
 */
export class ProductionModelCreators {
  /**
   * Register all production models
   */
  static registerProductionModels(): void {
    // Import models dynamically to avoid circular dependencies
    const { MPNetEmbeddingsModel } = require('../embeddings/mpnet-model');
    const { MPNet768EmbeddingsModel } = require('../embeddings/mpnet-768-model');
    const { SemanticIntentModel } = require('../intent/semantic-intent-model');
    const { SemanticNERModel } = require('../entities/semantic-ner-model');
    const { SemanticEmotionModel } = require('../emotion/semantic-emotion-model');
    const { HuggingFaceIntentModel } = require('../intent/huggingface-intent-model');
    const { HuggingFaceNERModel } = require('../entities/huggingface-ner-model');
    const { HuggingFaceEmotionModel } = require('../emotion/huggingface-emotion-model');

    // Register embeddings models
    ModelFactory.registerEmbeddingsModel('Xenova/all-MiniLM-L6-v2', () => new MPNetEmbeddingsModel());
    ModelFactory.registerEmbeddingsModel('sentence-transformers/all-mpnet-base-v2', () => new MPNet768EmbeddingsModel());

    // Register intent models
    ModelFactory.registerIntentModel('semantic-intent-model', () => new SemanticIntentModel());
    ModelFactory.registerIntentModel('semantic-intent-classifier', () => new SemanticIntentModel());
    ModelFactory.registerIntentModel('microsoft/DialoGPT-medium', () => new HuggingFaceIntentModel('microsoft/DialoGPT-medium'));

    // Register entity models
    ModelFactory.registerEntityModel('semantic-ner-model', () => new SemanticNERModel());
    ModelFactory.registerEntityModel('semantic-ner-classifier', () => new SemanticNERModel());
    ModelFactory.registerEntityModel('Xenova/bert-base-NER', () => new HuggingFaceNERModel('Xenova/bert-base-NER'));

    // Register emotion models
    ModelFactory.registerEmotionModel('semantic-emotion-model', () => new SemanticEmotionModel());
    ModelFactory.registerEmotionModel('semantic-emotion-classifier', () => new SemanticEmotionModel());
    ModelFactory.registerEmotionModel('j-hartmann/emotion-english-distilroberta-base', () => new HuggingFaceEmotionModel('j-hartmann/emotion-english-distilroberta-base'));
  }
}

/**
 * Mock model creators for testing
 */
export class MockModelCreators {
  /**
   * Register mock models for testing
   */
  static registerMockModels(): void {
    // Mock embeddings model
    ModelFactory.registerEmbeddingsModel('mock-embeddings-model', () => ({
      name: 'mock-embeddings-model',
      version: '1.0.0',
      dimensions: 384,
      async initialize() { /* mock */ },
      isInitialized: () => true,
      async encode(text: string) { 
        return new Array(384).fill(0.1); 
      }
    }));

    // Mock intent model
    ModelFactory.registerIntentModel('mock-intent-model', () => ({
      name: 'mock-intent-model',
      version: '1.0.0',
      intents: ['GREETING', 'QUESTION', 'HELP_REQUEST'],
      async initialize() { /* mock */ },
      isInitialized: () => true,
      async classify(text: string) {
        return { intent: 'GREETING', confidence: 0.9 };
      }
    }));

    // Mock entity model
    ModelFactory.registerEntityModel('mock-ner-model', () => ({
      name: 'mock-ner-model',
      version: '1.0.0',
      entityTypes: ['PERSON', 'PLACE', 'THING'],
      async initialize() { /* mock */ },
      isInitialized: () => true,
      async extract(text: string) {
        return { entities: [] };
      }
    }));

    // Mock emotion model
    ModelFactory.registerEmotionModel('mock-emotion-model', () => ({
      name: 'mock-emotion-model',
      version: '1.0.0',
      emotions: ['joy', 'sadness', 'anger'],
      async initialize() { /* mock */ },
      isInitialized: () => true,
      async analyze(text: string) {
        return { emotion: 'joy', valence: 0.5, arousal: 0.5, confidence: 0.8 };
      }
    }));
  }
}
