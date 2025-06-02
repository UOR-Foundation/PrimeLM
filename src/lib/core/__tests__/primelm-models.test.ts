// =============================================================================
// PRIMELM MODELS TESTS
// =============================================================================

import { PrimeCore, IdentityModel, UserModel, EmbeddingsModel } from '../primelm-models';

// Mock the transformers pipeline
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue({
    data: new Float32Array(384).fill(0.1), // Mock embedding data
    tokenizer: {
      model: {
        vocab: new Map([['hello', 0], ['world', 1], ['test', 2]])
      }
    }
  })
}));

// Mock the knowledge bootstrap
jest.mock('../../semantic/knowledge-bootstrap', () => ({
  KnowledgeBootstrap: jest.fn().mockImplementation(() => ({
    bootstrapFromTokenizer: jest.fn().mockResolvedValue({
      vocabulary: new Map([
        ['hello', { embedding: new Array(384).fill(0.1), primeFactors: { 2: 10, 3: 5 } }],
        ['world', { embedding: new Array(384).fill(0.2), primeFactors: { 5: 8, 7: 3 } }],
        ['test', { embedding: new Array(384).fill(0.15), primeFactors: { 11: 6, 13: 4 } }]
      ]),
      conceptEmbeddings: new Map([
        ['hello', new Array(384).fill(0.1)],
        ['world', new Array(384).fill(0.2)]
      ]),
      semanticClusters: new Map([
        ['hello', ['greeting', 'welcome']],
        ['world', ['earth', 'planet']]
      ]),
      vocabularyPrimes: new Map([
        ['hello', { 2: 10, 3: 5 }],
        ['world', { 5: 8, 7: 3 }],
        ['test', { 11: 6, 13: 4 }]
      ])
    })
  }))
}));

describe('PrimeCore', () => {
  let primeCore: PrimeCore;

  beforeEach(() => {
    primeCore = new PrimeCore();
  });

  describe('constructor', () => {
    it('should create a new PrimeCore instance', () => {
      expect(primeCore).toBeInstanceOf(PrimeCore);
    });

    it('should initialize human user model', () => {
      expect(primeCore.humanUser).toBeDefined();
      expect(primeCore.humanUser.identity.type).toBe('human');
      expect(primeCore.humanUser.identity.name).toBe('Human');
      expect(primeCore.humanUser.identity.id).toBe('human-001');
    });

    it('should initialize chatbot user model', () => {
      expect(primeCore.chatbotUser).toBeDefined();
      expect(primeCore.chatbotUser.identity.type).toBe('chatbot');
      expect(primeCore.chatbotUser.identity.name).toBe('PrimeBot');
      expect(primeCore.chatbotUser.identity.id).toBe('chatbot-001');
    });

    it('should initialize embeddings model', () => {
      expect(primeCore.embeddingsModel).toBeDefined();
      expect(primeCore.embeddingsModel.vocabulary).toBeInstanceOf(Map);
      expect(primeCore.embeddingsModel.concepts).toBeInstanceOf(Map);
      expect(primeCore.embeddingsModel.relationships).toBeInstanceOf(Map);
    });

    it('should initialize with proper personality traits', () => {
      expect(primeCore.humanUser.identity.personality.traits).toContain('curious');
      expect(primeCore.chatbotUser.identity.personality.traits).toContain('helpful');
      expect(primeCore.chatbotUser.identity.personality.traits).toContain('mathematical');
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(primeCore.initialize()).resolves.not.toThrow();
    });

    it('should set isInitialized flag after successful initialization', async () => {
      await primeCore.initialize();
      // We can't directly access isInitialized, but we can test behavior that depends on it
      await expect(primeCore.processConversation('test')).resolves.toBeDefined();
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock pipeline to throw an error
      const { pipeline } = require('@xenova/transformers');
      pipeline.mockRejectedValueOnce(new Error('Pipeline failed'));

      await expect(primeCore.initialize()).rejects.toThrow('Pipeline failed');
    });
  });

  describe('processConversation', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should process conversation input and return response', async () => {
      const input = 'Hello, how are you?';
      const response = await primeCore.processConversation(input);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should update human user state after processing', async () => {
      const input = 'My name is Alice';
      const initialTurnCount = primeCore.humanUser.conversationState.turnCount;
      
      await primeCore.processConversation(input);

      expect(primeCore.humanUser.conversationState.turnCount).toBe(initialTurnCount + 1);
      expect(primeCore.humanUser.conversationState.context).toContain(input);
      expect(primeCore.humanUser.conversationState.embeddings.length).toBeGreaterThan(0);
    });

    it('should update chatbot user state after processing', async () => {
      const input = 'Hello there!';
      const initialTurnCount = primeCore.chatbotUser.conversationState.turnCount;
      
      await primeCore.processConversation(input);

      expect(primeCore.chatbotUser.conversationState.turnCount).toBe(initialTurnCount + 1);
      expect(primeCore.chatbotUser.conversationState.context.length).toBeGreaterThan(0);
    });

    it('should handle greeting patterns', async () => {
      const input = 'Hello';
      const response = await primeCore.processConversation(input);

      expect(response.toLowerCase()).toMatch(/hello|hi|greet/);
    });

    it('should handle identity introduction patterns', async () => {
      const input = 'My name is John';
      const response = await primeCore.processConversation(input);

      expect(response.toLowerCase()).toMatch(/nice to meet you|john|name/);
    });

    it('should handle help requests', async () => {
      const input = 'Can you help me?';
      const response = await primeCore.processConversation(input);

      expect(response.toLowerCase()).toMatch(/help|assist|here to help/);
    });

    it('should maintain conversation context', async () => {
      await primeCore.processConversation('My name is Alice');
      const response = await primeCore.processConversation('What is my name?');

      expect(response.toLowerCase()).toMatch(/alice|your name is/);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedCore = new PrimeCore();
      
      await expect(uninitializedCore.processConversation('test'))
        .rejects.toThrow('PrimeCore not initialized');
    });

    it('should handle empty input', async () => {
      const response = await primeCore.processConversation('');
      
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle complex input with multiple concepts', async () => {
      const input = 'I am interested in machine learning and artificial intelligence';
      const response = await primeCore.processConversation(input);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('user model management', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should evolve user identity over time', async () => {
      const initialEmbeddings = [...primeCore.humanUser.identity.embeddings];
      
      await primeCore.processConversation('I love mathematics');
      await primeCore.processConversation('Prime numbers are fascinating');
      
      // Identity should evolve (embeddings should change)
      const finalEmbeddings = primeCore.humanUser.identity.embeddings;
      if (initialEmbeddings.length > 0 && finalEmbeddings.length > 0) {
        const hasChanged = initialEmbeddings.some((val, idx) => 
          Math.abs(val - finalEmbeddings[idx]) > 0.001
        );
        expect(hasChanged).toBe(true);
      }
    });

    it('should maintain conversation context within limits', async () => {
      // Add more than 10 messages to test context limiting
      for (let i = 0; i < 15; i++) {
        await primeCore.processConversation(`Message ${i}`);
      }

      expect(primeCore.humanUser.conversationState.context.length).toBeLessThanOrEqual(10);
      expect(primeCore.chatbotUser.conversationState.context.length).toBeLessThanOrEqual(10);
    });

    it('should update embeddings model with conversation data', async () => {
      const initialVocabSize = primeCore.embeddingsModel.vocabulary.size;
      
      await primeCore.processConversation('artificial intelligence machine learning');
      
      expect(primeCore.embeddingsModel.vocabulary.size).toBeGreaterThan(initialVocabSize);
      expect(primeCore.embeddingsModel.vocabulary.has('artificial')).toBe(true);
      expect(primeCore.embeddingsModel.vocabulary.has('intelligence')).toBe(true);
    });

    it('should build semantic relationships between concepts', async () => {
      await primeCore.processConversation('machine learning and artificial intelligence');
      
      const relationships = primeCore.embeddingsModel.relationships;
      expect(relationships.has('machine')).toBe(true);
      expect(relationships.has('learning')).toBe(true);
      
      const machineRelations = relationships.get('machine');
      if (machineRelations) {
        expect(machineRelations).toContain('learning');
      }
    });
  });

  describe('mathematical processing', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should generate prime factors from embeddings', async () => {
      await primeCore.processConversation('Hello world');
      
      const humanPrimes = primeCore.humanUser.conversationState.primeFactors;
      const chatbotPrimes = primeCore.chatbotUser.conversationState.primeFactors;
      
      expect(Object.keys(humanPrimes).length).toBeGreaterThan(0);
      expect(Object.keys(chatbotPrimes).length).toBeGreaterThan(0);
      
      // Verify all keys are numbers (prime factors)
      Object.keys(humanPrimes).forEach(key => {
        expect(typeof parseInt(key)).toBe('number');
        expect(parseInt(key)).toBeGreaterThan(1);
      });
    });

    it('should calculate coherence between user models', async () => {
      await primeCore.processConversation('mathematics and prime numbers');
      
      const debugInfo = primeCore.getDebugInfo();
      
      expect(typeof debugInfo.coherence).toBe('number');
      expect(debugInfo.coherence).toBeGreaterThanOrEqual(0);
      expect(debugInfo.coherence).toBeLessThanOrEqual(1);
    });

    it('should maintain mathematical consistency', async () => {
      await primeCore.processConversation('test input');
      
      const humanMagnitude = Math.sqrt(
        Object.values(primeCore.humanUser.conversationState.primeFactors)
          .reduce((sum, weight) => sum + weight * weight, 0)
      );
      
      expect(humanMagnitude).toBeGreaterThanOrEqual(0);
      expect(typeof humanMagnitude).toBe('number');
      expect(isFinite(humanMagnitude)).toBe(true);
    });
  });

  describe('debug information', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should provide comprehensive debug information', async () => {
      await primeCore.processConversation('Hello, I am testing the system');
      
      const debugInfo = primeCore.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('humanUser');
      expect(debugInfo).toHaveProperty('chatbotUser');
      expect(debugInfo).toHaveProperty('coherence');
      expect(debugInfo).toHaveProperty('episodicMemory');
      
      expect(debugInfo.humanUser).toHaveProperty('identity');
      expect(debugInfo.humanUser).toHaveProperty('conversationState');
      expect(debugInfo.humanUser.conversationState).toHaveProperty('primeCount');
      
      expect(debugInfo.episodicMemory).toHaveProperty('totalEpisodes');
      expect(debugInfo.episodicMemory).toHaveProperty('personalityTraits');
    });

    it('should track conversation statistics', async () => {
      await primeCore.processConversation('First message');
      await primeCore.processConversation('Second message');
      
      const debugInfo = primeCore.getDebugInfo();
      
      expect(debugInfo.humanUser.conversationState.primeCount).toBeGreaterThan(0);
      expect(debugInfo.chatbotUser.conversationState.primeCount).toBeGreaterThan(0);
      expect(debugInfo.episodicMemory.totalEpisodes).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle embedding generation errors', async () => {
      await primeCore.initialize();
      
      // Mock embedding pipeline to throw error
      const originalPipeline = primeCore['embeddingPipeline'];
      primeCore['embeddingPipeline'] = jest.fn().mockRejectedValue(new Error('Embedding failed'));
      
      await expect(primeCore.processConversation('test'))
        .rejects.toThrow();
      
      // Restore original pipeline
      primeCore['embeddingPipeline'] = originalPipeline;
    });

    it('should handle knowledge bootstrap failures gracefully', async () => {
      // Create a new instance to test bootstrap failure
      const failingCore = new PrimeCore();
      
      // Mock pipeline to succeed but bootstrap to fail
      const { pipeline } = require('@xenova/transformers');
      pipeline.mockResolvedValueOnce({
        data: new Float32Array(384).fill(0.1)
      });
      
      // Mock knowledge bootstrap to fail
      jest.doMock('../semantic/knowledge-bootstrap', () => ({
        KnowledgeBootstrap: jest.fn().mockImplementation(() => ({
          bootstrapFromTokenizer: jest.fn().mockRejectedValue(new Error('Bootstrap failed'))
        }))
      }));
      
      await expect(failingCore.initialize()).rejects.toThrow('Knowledge bootstrap failed');
    });
  });

  describe('integration tests', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should handle a complete conversation flow', async () => {
      const responses = [];
      
      responses.push(await primeCore.processConversation('Hello'));
      responses.push(await primeCore.processConversation('My name is Alice'));
      responses.push(await primeCore.processConversation('What is my name?'));
      responses.push(await primeCore.processConversation('Thank you'));
      
      responses.forEach(response => {
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
      });
      
      // Should remember the name
      expect(responses[2].toLowerCase()).toMatch(/alice/);
      
      // Should handle gratitude
      expect(responses[3].toLowerCase()).toMatch(/welcome|glad/);
    });

    it('should maintain mathematical coherence throughout conversation', async () => {
      await primeCore.processConversation('I love mathematics');
      await primeCore.processConversation('Prime numbers are interesting');
      await primeCore.processConversation('Tell me about mathematical patterns');
      
      const debugInfo = primeCore.getDebugInfo();
      
      // Coherence should be meaningful after related conversation
      expect(debugInfo.coherence).toBeGreaterThan(0);
      
      // Both users should have accumulated prime factors
      expect(debugInfo.humanUser.conversationState.primeCount).toBeGreaterThan(0);
      expect(debugInfo.chatbotUser.conversationState.primeCount).toBeGreaterThan(0);
    });

    it('should demonstrate learning and adaptation', async () => {
      const initialVocabSize = primeCore.embeddingsModel.vocabulary.size;
      const initialConceptSize = primeCore.embeddingsModel.concepts.size;
      
      await primeCore.processConversation('quantum computing and machine learning');
      await primeCore.processConversation('artificial intelligence algorithms');
      
      expect(primeCore.embeddingsModel.vocabulary.size).toBeGreaterThan(initialVocabSize);
      expect(primeCore.embeddingsModel.concepts.size).toBeGreaterThan(initialConceptSize);
      
      // Should have learned about technical concepts
      expect(primeCore.embeddingsModel.vocabulary.has('quantum')).toBe(true);
      expect(primeCore.embeddingsModel.vocabulary.has('algorithms')).toBe(true);
    });
  });
});

describe('IdentityModel', () => {
  it('should have required properties', () => {
    const identity: IdentityModel = {
      id: 'test-001',
      name: 'Test User',
      type: 'human',
      embeddings: [0.1, 0.2, 0.3],
      primeFactors: { 2: 5, 3: 3 },
      personality: {
        traits: ['curious'],
        communicationStyle: 'direct',
        interests: ['math']
      }
    };

    expect(identity.id).toBe('test-001');
    expect(identity.type).toBe('human');
    expect(identity.embeddings).toHaveLength(3);
    expect(identity.primeFactors[2]).toBe(5);
    expect(identity.personality.traits).toContain('curious');
  });
});

describe('UserModel', () => {
  it('should have required properties', () => {
    const user: UserModel = {
      identity: {
        id: 'user-001',
        name: 'Test User',
        type: 'human',
        embeddings: [],
        primeFactors: {},
        personality: {
          traits: [],
          communicationStyle: 'casual',
          interests: []
        }
      },
      conversationState: {
        embeddings: [],
        primeFactors: {},
        context: [],
        turnCount: 0
      },
      preferences: {
        topics: [],
        responseLength: 'medium'
      }
    };

    expect(user.identity.type).toBe('human');
    expect(user.conversationState.turnCount).toBe(0);
    expect(user.preferences.responseLength).toBe('medium');
  });
});

describe('EmbeddingsModel', () => {
  it('should initialize with empty maps', () => {
    const model: EmbeddingsModel = {
      vocabulary: new Map(),
      concepts: new Map(),
      relationships: new Map()
    };

    expect(model.vocabulary).toBeInstanceOf(Map);
    expect(model.concepts).toBeInstanceOf(Map);
    expect(model.relationships).toBeInstanceOf(Map);
    expect(model.vocabulary.size).toBe(0);
  });

  it('should store and retrieve embeddings', () => {
    const model: EmbeddingsModel = {
      vocabulary: new Map(),
      concepts: new Map(),
      relationships: new Map()
    };

    const testEmbedding = [0.1, 0.2, 0.3];
    model.vocabulary.set('test', testEmbedding);

    expect(model.vocabulary.has('test')).toBe(true);
    expect(model.vocabulary.get('test')).toEqual(testEmbedding);
  });
});
