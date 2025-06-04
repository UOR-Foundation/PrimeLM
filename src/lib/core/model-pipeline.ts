// =============================================================================
// MODEL-DRIVEN PIPELINE - Orchestrates all models for PrimeLM processing
// =============================================================================

import { ModelRegistry } from '../models/model-registry';
import { ModelFactory, ProductionModelCreators } from '../models/factory/model-factory';
import { MODEL_CONFIG } from '../config/model-config';
import { PrimeMath } from './prime-math';
import type {
  EmbeddingsModel,
  IntentModel,
  EntityModel,
  EmotionModel
} from '../models/interfaces';

/**
 * Result of processing text through the complete model pipeline
 * Contains all semantic analysis and mathematical representations
 */
export interface ProcessingResult {
  // Raw model outputs
  embeddings: number[];
  intent: {
    intent: string;
    confidence: number;
  };
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }>;
  emotion: {
    emotion: string;
    valence: number;
    arousal: number;
    confidence: number;
  };
  
  // Mathematical representations
  primes: Record<number, number>;
  primeCoherence: number;
  
  // Semantic analysis
  semanticContext: {
    intentConfidence: number;
    entityCount: number;
    emotionalValence: number;
    overallConfidence: number;
  };
  
  // Processing metadata
  processingTime: number;
  modelVersions: {
    embeddings: string;
    intent: string;
    entities: string;
    emotion: string;
  };
}

/**
 * Model-driven pipeline that orchestrates all semantic models
 * Replaces hardcoded patterns with ML-driven understanding
 * Integrates with PrimeLM's mathematical consciousness
 */
export class ModelDrivenPipeline {
  private registry: ModelRegistry;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.registry = new ModelRegistry();
  }

  /**
   * Initialize the complete model pipeline
   * Registers and initializes all production models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 Initializing model-driven pipeline...');
      
      // Register production models
      ProductionModelCreators.registerProductionModels();
      
      // Validate configuration before creating models
      ModelFactory.validateConfig(MODEL_CONFIG);
      
      // Create models from configuration
      const models = ModelFactory.createAllModels(MODEL_CONFIG);
      
      // Register models with registry
      this.registry.register('embeddings', models.embeddings);
      this.registry.register('intent', models.intent);
      this.registry.register('entities', models.entities);
      this.registry.register('emotion', models.emotion);
      
      // Initialize all models
      await this.registry.initializeAll();
      
      this.isInitialized = true;
      console.log('✅ Model-driven pipeline initialized successfully');
      console.log('📋 Model info:', this.getModelInfo());
      
    } catch (error) {
      console.error('❌ Failed to initialize model-driven pipeline:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error; // Fail-fast design
    }
  }

  /**
   * Process text through the complete model pipeline
   * Returns comprehensive semantic analysis and mathematical representations
   */
  async processText(text: string): Promise<ProcessingResult> {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized - call initialize() first');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Cannot process empty text');
    }

    const startTime = Date.now();
    console.log(`🔬 Processing text through model pipeline: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    try {
      // Get models from registry
      const embeddingsModel = this.registry.get<EmbeddingsModel>('embeddings');
      const intentModel = this.registry.get<IntentModel>('intent');
      const entityModel = this.registry.get<EntityModel>('entities');
      const emotionModel = this.registry.get<EmotionModel>('emotion');

      // Process through all models in parallel - fail fast if any model fails
      const [embeddings, intentResult, entityResult, emotionResult] = await Promise.all([
        embeddingsModel.encode(text),
        intentModel.classify(text),
        entityModel.extract(text),
        emotionModel.analyze(text)
      ]);

      // Convert embeddings to prime factorization
      const primes = PrimeMath.embeddingsToPrimes(embeddings);
      
      // Calculate prime coherence for mathematical consciousness
      const primeCoherence = this.calculatePrimeCoherence(primes);
      
      // Build semantic context
      const semanticContext = this.buildSemanticContext(
        intentResult,
        entityResult.entities,
        emotionResult
      );

      const processingTime = Date.now() - startTime;

      const result: ProcessingResult = {
        // Raw model outputs
        embeddings,
        intent: intentResult,
        entities: entityResult.entities,
        emotion: emotionResult,
        
        // Mathematical representations
        primes,
        primeCoherence,
        
        // Semantic analysis
        semanticContext,
        
        // Processing metadata
        processingTime,
        modelVersions: {
          embeddings: embeddingsModel.name,
          intent: intentModel.name,
          entities: entityModel.name,
          emotion: emotionModel.name
        }
      };

      console.log(`✅ Text processing completed in ${processingTime}ms`);
      console.log(`📊 Results: Intent=${result.intent.intent} (${result.intent.confidence.toFixed(3)}), Entities=${result.entities.length}, Emotion=${result.emotion.emotion} (${result.emotion.confidence.toFixed(3)})`);
      console.log(`🔢 Prime coherence: ${result.primeCoherence.toFixed(3)}, Overall confidence: ${result.semanticContext.overallConfidence.toFixed(3)}`);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Text processing failed after ${processingTime}ms:`, error);
      throw new Error(`Text processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate prime coherence for mathematical consciousness
   * Measures how well the prime factorization represents semantic meaning
   */
  private calculatePrimeCoherence(primes: Record<number, number>): number {
    const primeValues = Object.values(primes);
    
    if (primeValues.length === 0) {
      return 0;
    }

    // Calculate variance in prime weights (lower variance = higher coherence)
    const mean = primeValues.reduce((sum, val) => sum + val, 0) / primeValues.length;
    const variance = primeValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / primeValues.length;
    
    // Convert variance to coherence score (0-1, higher is better)
    const coherence = 1 / (1 + variance);
    
    return Math.min(Math.max(coherence, 0), 1);
  }

  /**
   * Build semantic context from model outputs
   * Provides unified confidence and semantic understanding
   */
  private buildSemanticContext(
    intentResult: { intent: string; confidence: number },
    entities: Array<{ confidence: number }>,
    emotionResult: { valence: number; confidence: number }
  ): {
    intentConfidence: number;
    entityCount: number;
    emotionalValence: number;
    overallConfidence: number;
  } {
    const entityCount = entities.length;
    const avgEntityConfidence = entityCount > 0 
      ? entities.reduce((sum, entity) => sum + entity.confidence, 0) / entityCount
      : 0;

    // Calculate overall confidence as weighted average
    const weights = {
      intent: 0.4,
      entities: 0.3,
      emotion: 0.3
    };

    const overallConfidence = 
      (intentResult.confidence * weights.intent) +
      (avgEntityConfidence * weights.entities) +
      (emotionResult.confidence * weights.emotion);

    return {
      intentConfidence: intentResult.confidence,
      entityCount,
      emotionalValence: emotionResult.valence,
      overallConfidence: Math.min(Math.max(overallConfidence, 0), 1)
    };
  }

  /**
   * Process multiple texts in batch for efficiency
   */
  async processBatch(texts: string[]): Promise<ProcessingResult[]> {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized - call initialize() first');
    }

    if (!texts || texts.length === 0) {
      return [];
    }

    console.log(`🔬 Processing batch of ${texts.length} texts...`);
    
    const startTime = Date.now();
    
    try {
      // Process all texts in parallel
      const results = await Promise.all(
        texts.map(text => this.processText(text))
      );
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Batch processing completed in ${processingTime}ms (avg: ${(processingTime / texts.length).toFixed(1)}ms per text)`);
      
      return results;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Batch processing failed after ${processingTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Get information about all registered models
   */
  getModelInfo(): {
    embeddings: string;
    intent: string;
    entities: string;
    emotion: string;
    initialized: boolean;
    registeredTypes: string[];
  } {
    if (!this.isInitialized) {
      return {
        embeddings: 'not initialized',
        intent: 'not initialized',
        entities: 'not initialized',
        emotion: 'not initialized',
        initialized: false,
        registeredTypes: []
      };
    }

    return {
      embeddings: this.registry.get('embeddings').name,
      intent: this.registry.get('intent').name,
      entities: this.registry.get('entities').name,
      emotion: this.registry.get('emotion').name,
      initialized: this.isInitialized,
      registeredTypes: this.registry.getRegisteredTypes()
    };
  }

  /**
   * Get detailed model information for debugging
   */
  getDetailedModelInfo(): any {
    if (!this.isInitialized) {
      return { error: 'Pipeline not initialized' };
    }

    try {
      const embeddingsModel = this.registry.get<EmbeddingsModel>('embeddings');
      const intentModel = this.registry.get<IntentModel>('intent');
      const entityModel = this.registry.get<EntityModel>('entities');
      const emotionModel = this.registry.get<EmotionModel>('emotion');

      return {
        embeddings: {
          name: embeddingsModel.name,
          dimensions: embeddingsModel.dimensions,
          info: (embeddingsModel as any).getModelInfo?.()
        },
        intent: {
          name: intentModel.name,
          intents: intentModel.intents,
          info: (intentModel as any).getModelInfo?.()
        },
        entities: {
          name: entityModel.name,
          entityTypes: entityModel.entityTypes,
          info: (entityModel as any).getModelInfo?.()
        },
        emotion: {
          name: emotionModel.name,
          emotions: emotionModel.emotions,
          info: (emotionModel as any).getModelInfo?.()
        }
      };
    } catch (error) {
      return { error: `Failed to get model info: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Check if pipeline is ready for processing
   */
  isReady(): boolean {
    return this.isInitialized && this.registry.areAllModelsInitialized();
  }

  /**
   * Get pipeline status for monitoring
   */
  getStatus(): {
    initialized: boolean;
    ready: boolean;
    modelCount: number;
    registeredTypes: string[];
  } {
    return {
      initialized: this.isInitialized,
      ready: this.isReady(),
      modelCount: this.registry.getRegisteredTypes().length,
      registeredTypes: this.registry.getRegisteredTypes()
    };
  }
}
