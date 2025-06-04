// =============================================================================
// BASE MODEL CLASSES - Abstract base classes for PrimeLM models
// =============================================================================

import { 
  PrimeLMModel, 
  EmbeddingsModel, 
  IntentModel, 
  EntityModel, 
  EmotionModel,
  ModelInitializationError,
  ModelProcessingError,
  InvalidInputError
} from '../interfaces';

/**
 * Abstract base class for all PrimeLM models
 * Provides common functionality and error handling
 */
export abstract class BasePrimeLMModel implements PrimeLMModel {
  abstract name: string;
  abstract version: string;
  
  protected initialized = false;
  protected initializationPromise: Promise<void> | null = null;

  abstract initialize(): Promise<void>;

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure model is initialized before processing
   */
  protected ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new ModelProcessingError(
        this.constructor.name,
        'processing',
        new Error(`Model ${this.name} not initialized`)
      );
    }
  }

  /**
   * Validate input text
   */
  protected validateInput(text: string, operation: string): void {
    if (!text || typeof text !== 'string') {
      throw new InvalidInputError(String(text), `Invalid input for ${operation}: must be a non-empty string`);
    }
    
    if (text.trim().length === 0) {
      throw new InvalidInputError(text, `Empty input for ${operation}`);
    }
  }

  /**
   * Wrap model operations with error handling
   */
  protected async safeModelOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw new ModelProcessingError(
        this.constructor.name,
        operation,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

/**
 * Abstract base class for embeddings models
 */
export abstract class BaseEmbeddingsModel extends BasePrimeLMModel implements EmbeddingsModel {
  abstract dimensions: number;

  async encode(text: string): Promise<number[]> {
    this.ensureInitialized();
    this.validateInput(text, 'encoding');
    
    return this.safeModelOperation('encode', async () => {
      const result = await this.performEncoding(text);
      
      // Validate output dimensions
      if (result.length !== this.dimensions) {
        throw new Error(`Expected ${this.dimensions} dimensions, got ${result.length}`);
      }
      
      return result;
    });
  }

  protected abstract performEncoding(text: string): Promise<number[]>;
}

/**
 * Abstract base class for intent classification models
 */
export abstract class BaseIntentModel extends BasePrimeLMModel implements IntentModel {
  abstract intents: string[];

  async classify(text: string): Promise<{ intent: string; confidence: number }> {
    this.ensureInitialized();
    this.validateInput(text, 'intent classification');
    
    return this.safeModelOperation('classify', async () => {
      const result = await this.performClassification(text);
      
      // Validate result
      if (!this.intents.includes(result.intent)) {
        throw new Error(`Invalid intent '${result.intent}'. Must be one of: ${this.intents.join(', ')}`);
      }
      
      if (result.confidence < 0 || result.confidence > 1) {
        throw new Error(`Invalid confidence ${result.confidence}. Must be between 0 and 1`);
      }
      
      return result;
    });
  }

  protected abstract performClassification(text: string): Promise<{ intent: string; confidence: number }>;
}

/**
 * Abstract base class for entity recognition models
 */
export abstract class BaseEntityModel extends BasePrimeLMModel implements EntityModel {
  abstract entityTypes: string[];

  async extract(text: string): Promise<{
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
  }> {
    this.ensureInitialized();
    this.validateInput(text, 'entity extraction');
    
    return this.safeModelOperation('extract', async () => {
      const result = await this.performExtraction(text);
      
      // Validate entities
      for (const entity of result.entities) {
        if (entity.confidence < 0 || entity.confidence > 1) {
          throw new Error(`Invalid confidence ${entity.confidence} for entity '${entity.text}'`);
        }
        
        if (entity.startIndex < 0 || entity.endIndex < entity.startIndex) {
          throw new Error(`Invalid indices for entity '${entity.text}': start=${entity.startIndex}, end=${entity.endIndex}`);
        }
      }
      
      return result;
    });
  }

  protected abstract performExtraction(text: string): Promise<{
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
 * Abstract base class for emotion detection models
 */
export abstract class BaseEmotionModel extends BasePrimeLMModel implements EmotionModel {
  abstract emotions: string[];

  async analyze(text: string): Promise<{
    emotion: string;
    valence: number;
    arousal: number;
    confidence: number;
  }> {
    this.ensureInitialized();
    this.validateInput(text, 'emotion analysis');
    
    return this.safeModelOperation('analyze', async () => {
      const result = await this.performAnalysis(text);
      
      // Validate result
      if (!this.emotions.includes(result.emotion)) {
        throw new Error(`Invalid emotion '${result.emotion}'. Must be one of: ${this.emotions.join(', ')}`);
      }
      
      if (result.valence < -1 || result.valence > 1) {
        throw new Error(`Invalid valence ${result.valence}. Must be between -1 and 1`);
      }
      
      if (result.arousal < 0 || result.arousal > 1) {
        throw new Error(`Invalid arousal ${result.arousal}. Must be between 0 and 1`);
      }
      
      if (result.confidence < 0 || result.confidence > 1) {
        throw new Error(`Invalid confidence ${result.confidence}. Must be between 0 and 1`);
      }
      
      return result;
    });
  }

  protected abstract performAnalysis(text: string): Promise<{
    emotion: string;
    valence: number;
    arousal: number;
    confidence: number;
  }>;
}
