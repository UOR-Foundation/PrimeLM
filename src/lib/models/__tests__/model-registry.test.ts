// =============================================================================
// MODEL REGISTRY TESTS - Unit tests for model registry functionality
// =============================================================================

import { ModelRegistry } from '../model-registry';
import { PrimeLMModel, ModelInitializationError, ModelNotFoundError } from '../interfaces';

// Mock model for testing
class MockModel implements PrimeLMModel {
  name = 'mock-model';
  version = '1.0.0';
  private initialized = false;
  private shouldFailInit = false;

  constructor(name?: string, shouldFailInit = false) {
    if (name) this.name = name;
    this.shouldFailInit = shouldFailInit;
  }

  async initialize(): Promise<void> {
    if (this.shouldFailInit) {
      throw new Error('Mock initialization failure');
    }
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

describe('ModelRegistry', () => {
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new ModelRegistry();
  });

  describe('Model Registration', () => {
    it('should register a model successfully', () => {
      const model = new MockModel('test-model');
      
      expect(() => {
        registry.register('test', model);
      }).not.toThrow();
      
      expect(registry.has('test')).toBe(true);
      expect(registry.size()).toBe(1);
    });

    it('should throw error when registering duplicate model type', () => {
      const model1 = new MockModel('model-1');
      const model2 = new MockModel('model-2');
      
      registry.register('test', model1);
      
      expect(() => {
        registry.register('test', model2);
      }).toThrow("Model type 'test' is already registered");
    });

    it('should prevent registration after initialization starts', async () => {
      const model1 = new MockModel('model-1');
      const model2 = new MockModel('model-2');
      
      registry.register('test1', model1);
      
      // Start initialization
      const initPromise = registry.initializeAll();
      
      // Try to register during initialization
      expect(() => {
        registry.register('test2', model2);
      }).toThrow("Cannot register model 'test2' after initialization has started");
      
      await initPromise;
    });
  });

  describe('Model Access', () => {
    it('should retrieve registered model', () => {
      const model = new MockModel('test-model');
      registry.register('test', model);
      
      const retrieved = registry.get('test');
      expect(retrieved).toBe(model);
    });

    it('should throw ModelNotFoundError for unregistered model', () => {
      expect(() => {
        registry.get('nonexistent');
      }).toThrow(ModelNotFoundError);
    });

    it('should return correct registered types', () => {
      registry.register('model1', new MockModel('model-1'));
      registry.register('model2', new MockModel('model-2'));
      
      const types = registry.getRegisteredTypes();
      expect(types).toEqual(['model1', 'model2']);
    });
  });

  describe('Model Initialization', () => {
    it('should initialize all models successfully', async () => {
      const model1 = new MockModel('model-1');
      const model2 = new MockModel('model-2');
      
      registry.register('test1', model1);
      registry.register('test2', model2);
      
      await registry.initializeAll();
      
      expect(model1.isInitialized()).toBe(true);
      expect(model2.isInitialized()).toBe(true);
      expect(registry.areAllModelsInitialized()).toBe(true);
    });

    it('should fail fast when any model initialization fails', async () => {
      const model1 = new MockModel('model-1');
      const model2 = new MockModel('model-2', true); // This will fail
      
      registry.register('test1', model1);
      registry.register('test2', model2);
      
      await expect(registry.initializeAll()).rejects.toThrow(ModelInitializationError);
    });

    it('should handle empty registry initialization', async () => {
      await expect(registry.initializeAll()).rejects.toThrow('No models registered for initialization');
    });

    it('should prevent multiple initialization attempts', async () => {
      const model = new MockModel('test-model');
      registry.register('test', model);
      
      // First initialization
      await registry.initializeAll();
      
      // Second initialization should not throw
      await expect(registry.initializeAll()).resolves.not.toThrow();
    });
  });

  describe('Status and Information', () => {
    it('should provide correct model information', () => {
      const model = new MockModel('test-model');
      registry.register('test', model);
      
      const info = registry.getModelInfo();
      expect(info).toEqual({
        test: {
          name: 'test-model',
          version: '1.0.0',
          initialized: false
        }
      });
    });

    it('should provide correct initialization status', async () => {
      const model1 = new MockModel('model-1');
      const model2 = new MockModel('model-2');
      
      registry.register('test1', model1);
      registry.register('test2', model2);
      
      // Before initialization
      let status = registry.getInitializationStatus();
      expect(status).toEqual({
        isInitialized: false,
        isInitializing: false,
        totalModels: 2,
        initializedModels: 0
      });
      
      // After initialization
      await registry.initializeAll();
      
      status = registry.getInitializationStatus();
      expect(status).toEqual({
        isInitialized: true,
        isInitializing: false,
        totalModels: 2,
        initializedModels: 2
      });
    });
  });

  describe('Registry Management', () => {
    it('should clear registry successfully', () => {
      const model = new MockModel('test-model');
      registry.register('test', model);
      
      expect(registry.size()).toBe(1);
      
      registry.clear();
      
      expect(registry.size()).toBe(0);
      expect(registry.has('test')).toBe(false);
    });

    it('should prevent clearing during initialization', async () => {
      const model = new MockModel('test-model');
      registry.register('test', model);
      
      // Start initialization
      const initPromise = registry.initializeAll();
      
      // Try to clear during initialization
      expect(() => {
        registry.clear();
      }).toThrow('Cannot clear registry while initialization is in progress');
      
      await initPromise;
    });
  });
});
