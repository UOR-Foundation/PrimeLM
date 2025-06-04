// =============================================================================
// MODEL REGISTRY - Centralized model management for PrimeLM
// =============================================================================

import { 
  PrimeLMModel, 
  ModelInitializationError, 
  ModelNotFoundError 
} from './interfaces';

/**
 * Central registry for managing all PrimeLM models
 * Implements fail-fast design with explicit error handling
 * Provides type-safe model access and initialization
 */
export class ModelRegistry {
  private models: Map<string, PrimeLMModel> = new Map();
  private initializationPromise: Promise<void> | null = null;
  private isInitializing = false;
  private isInitialized = false;

  /**
   * Register a model with the registry
   * Models must implement the PrimeLMModel interface
   */
  register<T extends PrimeLMModel>(type: string, model: T): void {
    if (this.isInitialized || this.isInitializing) {
      throw new Error(`Cannot register model '${type}' after initialization has started`);
    }

    if (this.models.has(type)) {
      throw new Error(`Model type '${type}' is already registered`);
    }

    console.log(`📝 Registering model: ${type} (${model.name})`);
    this.models.set(type, model);
  }

  /**
   * Get a model by type with type safety
   * Throws ModelNotFoundError if model is not registered
   */
  get<T extends PrimeLMModel>(type: string): T {
    const model = this.models.get(type);
    if (!model) {
      throw new ModelNotFoundError(type);
    }
    return model as T;
  }

  /**
   * Check if a model type is registered
   */
  has(type: string): boolean {
    return this.models.has(type);
  }

  /**
   * Get all registered model types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.models.keys());
  }

  /**
   * Get model information for debugging
   */
  getModelInfo(): Record<string, { name: string; version: string; initialized: boolean }> {
    const info: Record<string, { name: string; version: string; initialized: boolean }> = {};
    
    for (const [type, model] of this.models) {
      info[type] = {
        name: model.name,
        version: model.version,
        initialized: model.isInitialized()
      };
    }
    
    return info;
  }

  /**
   * Initialize all registered models
   * Implements fail-fast behavior - if any model fails, all fail
   * Returns a promise that resolves when all models are initialized
   */
  async initializeAll(): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.isInitialized) {
      console.log('✅ Models already initialized');
      return;
    }

    if (this.isInitializing) {
      console.log('⏳ Models already initializing, waiting...');
      return this.initializationPromise!;
    }

    this.isInitializing = true;
    
    this.initializationPromise = this.performInitialization();
    
    try {
      await this.initializationPromise;
      this.isInitialized = true;
      console.log('✅ All models initialized successfully');
    } catch (error) {
      this.isInitializing = false;
      this.initializationPromise = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Internal method to perform the actual initialization
   */
  private async performInitialization(): Promise<void> {
    if (this.models.size === 0) {
      throw new Error('No models registered for initialization');
    }

    console.log(`🚀 Initializing ${this.models.size} models...`);
    
    const initPromises: Promise<void>[] = [];
    const modelTypes: string[] = [];

    // Create initialization promises for all models
    for (const [type, model] of this.models) {
      modelTypes.push(type);
      
      const initPromise = model.initialize().catch((error) => {
        throw new ModelInitializationError(model.name, error);
      });
      
      initPromises.push(initPromise);
    }

    try {
      // Wait for all models to initialize - fail fast if any fail
      await Promise.all(initPromises);
      
      // Verify all models are actually initialized
      for (const [type, model] of this.models) {
        if (!model.isInitialized()) {
          throw new Error(`Model ${model.name} reports as not initialized after initialization completed`);
        }
      }

      console.log(`✅ Successfully initialized models: ${modelTypes.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Model initialization failed:', error);
      
      // Log which models failed to initialize
      const failedModels: string[] = [];
      const successfulModels: string[] = [];
      
      for (const [type, model] of this.models) {
        if (model.isInitialized()) {
          successfulModels.push(type);
        } else {
          failedModels.push(type);
        }
      }
      
      if (successfulModels.length > 0) {
        console.log(`✅ Successfully initialized: ${successfulModels.join(', ')}`);
      }
      
      if (failedModels.length > 0) {
        console.error(`❌ Failed to initialize: ${failedModels.join(', ')}`);
      }
      
      throw error;
    }
  }

  /**
   * Check if all models are initialized
   */
  areAllModelsInitialized(): boolean {
    if (this.models.size === 0) {
      return false;
    }

    for (const model of this.models.values()) {
      if (!model.isInitialized()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): {
    isInitialized: boolean;
    isInitializing: boolean;
    totalModels: number;
    initializedModels: number;
  } {
    let initializedCount = 0;
    for (const model of this.models.values()) {
      if (model.isInitialized()) {
        initializedCount++;
      }
    }

    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      totalModels: this.models.size,
      initializedModels: initializedCount
    };
  }

  /**
   * Clear all models (for testing purposes)
   */
  clear(): void {
    if (this.isInitializing) {
      throw new Error('Cannot clear registry while initialization is in progress');
    }
    
    this.models.clear();
    this.isInitialized = false;
    this.initializationPromise = null;
    console.log('🧹 Model registry cleared');
  }

  /**
   * Get the number of registered models
   */
  size(): number {
    return this.models.size;
  }
}

/**
 * Singleton instance of the model registry
 * Provides global access to the model registry
 */
export const modelRegistry = new ModelRegistry();
