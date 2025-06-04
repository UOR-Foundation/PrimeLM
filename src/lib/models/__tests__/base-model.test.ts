// =============================================================================
// BASE MODEL TESTS - Tests for base model classes and interfaces
// =============================================================================

import {
  BasePrimeLMModel,
  BaseEmbeddingsModel,
  BaseIntentModel,
  BaseEntityModel,
  BaseEmotionModel
} from '../base/base-model';

// Mock implementations for testing
class MockEmbeddingsModel extends BaseEmbeddingsModel {
  name = 'mock-embeddings';
  version = '1.0.0';
  dimensions = 384;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  protected async performEncoding(text: string): Promise<number[]> {
    return new Array(this.dimensions).fill(0).map(() => Math.random());
  }
}

class MockIntentModel extends BaseIntentModel {
  name = 'mock-intent';
  version = '1.0.0';
  intents = ['GREETING', 'QUESTION', 'STATEMENT'];

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  protected async performClassification(text: string): Promise<{ intent: string; confidence: number }> {
    return {
      intent: this.intents[0],
      confidence: 0.9
    };
  }
}

class MockEntityModel extends BaseEntityModel {
  name = 'mock-entity';
  version = '1.0.0';
  entityTypes = ['PERSON', 'PLACE', 'THING'];

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  protected async performExtraction(text: string): Promise<{
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
  }> {
    return { entities: [] };
  }
}

class MockEmotionModel extends BaseEmotionModel {
  name = 'mock-emotion';
  version = '1.0.0';
  emotions = ['joy', 'sadness', 'anger'];

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  protected async performAnalysis(text: string): Promise<{
    emotion: string;
    valence: number;
    arousal: number;
    confidence: number;
  }> {
    return {
      emotion: 'joy',
      valence: 0.5,
      arousal: 0.5,
      confidence: 0.8
    };
  }
}

class FailingModel extends BasePrimeLMModel {
  name = 'failing-model';
  version = '1.0.0';

  async initialize(): Promise<void> {
    throw new Error('Initialization failed');
  }
}

describe('BasePrimeLMModel', () => {
  let model: MockEmbeddingsModel;

  beforeEach(() => {
    model = new MockEmbeddingsModel();
  });

  describe('initialization', () => {
    it('should start uninitialized', () => {
      expect(model.isInitialized()).toBe(false);
    });

    it('should initialize successfully', async () => {
      await model.initialize();
      expect(model.isInitialized()).toBe(true);
    });

    it('should not initialize twice', async () => {
      await model.initialize();
      expect(model.isInitialized()).toBe(true);
      
      // Second initialization should be ignored
      await model.initialize();
      expect(model.isInitialized()).toBe(true);
    });

    it('should handle initialization failure', async () => {
      const failingModel = new FailingModel();
      
      await expect(failingModel.initialize()).rejects.toThrow('Initialization failed');
      expect(failingModel.isInitialized()).toBe(false);
    });
  });

  describe('validation', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should validate text input', async () => {
      await expect(model.encode('')).rejects.toThrow('Invalid input');
      await expect(model.encode('   ')).rejects.toThrow('Empty input');
    });

    it('should require initialization before processing', async () => {
      const uninitializedModel = new MockEmbeddingsModel();
      await expect(uninitializedModel.encode('test')).rejects.toThrow('not initialized');
    });
  });
});

describe('BaseEmbeddingsModel', () => {
  let model: MockEmbeddingsModel;

  beforeEach(async () => {
    model = new MockEmbeddingsModel();
    await model.initialize();
  });

  it('should have correct dimensions', () => {
    expect(model.dimensions).toBe(384);
  });

  it('should encode text to embeddings', async () => {
    const embeddings = await model.encode('test text');
    expect(embeddings).toHaveLength(384);
    expect(embeddings.every(val => typeof val === 'number')).toBe(true);
  });

  it('should validate text before encoding', async () => {
    await expect(model.encode('')).rejects.toThrow('Invalid input');
  });
});

describe('BaseIntentModel', () => {
  let model: MockIntentModel;

  beforeEach(async () => {
    model = new MockIntentModel();
    await model.initialize();
  });

  it('should have defined intents', () => {
    expect(model.intents).toEqual(['GREETING', 'QUESTION', 'STATEMENT']);
  });

  it('should classify text intent', async () => {
    const result = await model.classify('hello there');
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.intent).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should validate text before classification', async () => {
    await expect(model.classify('')).rejects.toThrow('Invalid input');
  });
});

describe('BaseEntityModel', () => {
  let model: MockEntityModel;

  beforeEach(async () => {
    model = new MockEntityModel();
    await model.initialize();
  });

  it('should have defined entity types', () => {
    expect(model.entityTypes).toEqual(['PERSON', 'PLACE', 'THING']);
  });

  it('should extract entities from text', async () => {
    const result = await model.extract('John went to Paris');
    expect(result).toHaveProperty('entities');
    expect(Array.isArray(result.entities)).toBe(true);
  });

  it('should handle empty text gracefully', async () => {
    await expect(model.extract('')).rejects.toThrow('Invalid input');
  });
});

describe('BaseEmotionModel', () => {
  let model: MockEmotionModel;

  beforeEach(async () => {
    model = new MockEmotionModel();
    await model.initialize();
  });

  it('should have defined emotions', () => {
    expect(model.emotions).toEqual(['joy', 'sadness', 'anger']);
  });

  it('should analyze emotion in text', async () => {
    const result = await model.analyze('I am happy today');
    expect(result).toHaveProperty('emotion');
    expect(result).toHaveProperty('valence');
    expect(result).toHaveProperty('arousal');
    expect(result).toHaveProperty('confidence');
    
    expect(typeof result.emotion).toBe('string');
    expect(typeof result.valence).toBe('number');
    expect(typeof result.arousal).toBe('number');
    expect(typeof result.confidence).toBe('number');
    
    expect(result.valence).toBeGreaterThanOrEqual(-1);
    expect(result.valence).toBeLessThanOrEqual(1);
    expect(result.arousal).toBeGreaterThanOrEqual(0);
    expect(result.arousal).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should handle empty text gracefully', async () => {
    await expect(model.analyze('')).rejects.toThrow('Invalid input');
  });
});

describe('Error handling', () => {
  it('should handle model initialization errors gracefully', async () => {
    const failingModel = new FailingModel();
    
    await expect(failingModel.initialize()).rejects.toThrow('Initialization failed');
    expect(failingModel.isInitialized()).toBe(false);
  });

  it('should prevent operations on uninitialized models', async () => {
    const model = new MockEmbeddingsModel();
    
    await expect(model.encode('test')).rejects.toThrow('not initialized');
  });
});
