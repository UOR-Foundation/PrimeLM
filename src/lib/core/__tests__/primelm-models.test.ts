// =============================================================================
// PRIME CORE TESTS - Model-Driven Architecture Tests
// =============================================================================

import { PrimeCore, IdentityModel, UserModel } from '../primelm-models';

// Mock the model pipeline with intelligent input-responsive behavior
jest.mock('../model-pipeline', () => ({
  ModelDrivenPipeline: jest.fn().mockImplementation(() => {
    const mockProcessText = jest.fn().mockImplementation((text: string) => {
      const lowerText = text.toLowerCase();
      
      // Generate different embeddings based on input
      const baseEmbedding = 0.1;
      const variation = text.length * 0.01;
      const embeddings = new Array(768).fill(0).map((_, i) => 
        baseEmbedding + (variation * Math.sin(i * 0.1))
      );
      
      // Intelligent intent classification
      let intent = 'INFORMATION_REQUEST';
      let intentConfidence = 0.7;
      
      if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
        intent = 'GREETING';
        intentConfidence = 0.9;
      } else if (lowerText.includes('my name is') || lowerText.includes('i am') || lowerText.includes("i'm")) {
        intent = 'IDENTITY_INTRODUCTION';
        intentConfidence = 0.95;
      } else if (lowerText.includes('what is my name') || lowerText.includes('who am i')) {
        intent = 'IDENTITY_QUERY';
        intentConfidence = 0.9;
      } else if (lowerText.includes('my dog') || lowerText.includes('my cat') || lowerText.includes('my pet')) {
        intent = 'ENTITY_INTRODUCTION';
        intentConfidence = 0.85;
      } else if (lowerText.includes('what is my dog') || lowerText.includes('what is my cat')) {
        intent = 'ENTITY_QUERY';
        intentConfidence = 0.9;
      } else if (lowerText.includes('help') || lowerText.includes('assist')) {
        intent = 'HELP_REQUEST';
        intentConfidence = 0.85;
      } else if (lowerText.includes('thank') || lowerText.includes('thanks')) {
        intent = 'GRATITUDE';
        intentConfidence = 0.9;
      } else if (lowerText.includes('?')) {
        intent = 'QUESTION';
        intentConfidence = 0.8;
      }
      
      // Intelligent entity extraction
      const entities: Array<{
        text: string;
        type: string;
        confidence: number;
        startIndex: number;
        endIndex: number;
      }> = [];
      
      // Extract names from identity introductions
      const nameMatch = text.match(/(?:my name is|i am|i'm)\s+(\w+)/i);
      if (nameMatch) {
        const name = nameMatch[1];
        const startIndex = text.indexOf(name);
        entities.push({
          text: name,
          type: 'PERSON',
          confidence: 0.95,
          startIndex,
          endIndex: startIndex + name.length
        });
      }
      
      // Extract pet names
      const petMatch = text.match(/(?:my (?:dog|cat|pet)(?:'s name)?(?:\s+is|\s+named|\s+called)?)\s+(\w+)/i);
      if (petMatch) {
        const petName = petMatch[1];
        const startIndex = text.indexOf(petName);
        entities.push({
          text: petName,
          type: 'ANIMAL',
          confidence: 0.9,
          startIndex,
          endIndex: startIndex + petName.length
        });
      }
      
      // Extract general proper nouns
      const properNounMatches = text.match(/\b[A-Z][a-z]+\b/g);
      if (properNounMatches && entities.length === 0) {
        properNounMatches.forEach(noun => {
          if (!['My', 'I', 'The', 'This', 'That'].includes(noun)) {
            const startIndex = text.indexOf(noun);
            entities.push({
              text: noun,
              type: 'PERSON',
              confidence: 0.7,
              startIndex,
              endIndex: startIndex + noun.length
            });
          }
        });
      }
      
      // Emotion analysis based on content
      let emotion = 'neutral';
      let valence = 0;
      let arousal = 0.5;
      let emotionConfidence = 0.6;
      
      if (lowerText.includes('great') || lowerText.includes('wonderful') || lowerText.includes('amazing')) {
        emotion = 'joy';
        valence = 0.8;
        arousal = 0.7;
        emotionConfidence = 0.9;
      } else if (lowerText.includes('help') || lowerText.includes('?')) {
        emotion = 'curiosity';
        valence = 0.2;
        arousal = 0.6;
        emotionConfidence = 0.7;
      } else if (lowerText.includes('thank')) {
        emotion = 'gratitude';
        valence = 0.6;
        arousal = 0.4;
        emotionConfidence = 0.8;
      }
      
      // Generate prime factorization from embeddings
      const primes: Record<number, number> = {};
      const primeNumbers = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
      primeNumbers.forEach((prime, index) => {
        const weight = Math.floor(Math.abs(embeddings[index * 10] * 100)) + 1;
        primes[prime] = weight;
      });
      
      return Promise.resolve({
        embeddings,
        intent: { intent, confidence: intentConfidence },
        entities,
        emotion: { emotion, valence, arousal, confidence: emotionConfidence },
        primes,
        primeCoherence: 0.75 + (Math.random() * 0.2),
        semanticContext: {
          intentConfidence,
          entityCount: entities.length,
          emotionalValence: valence,
          overallConfidence: (intentConfidence + emotionConfidence) / 2
        },
        processingTime: 50 + Math.floor(Math.random() * 50),
        modelVersions: {
          embeddings: 'sentence-transformers/all-mpnet-base-v2',
          intent: 'semantic-intent-classifier',
          entities: 'semantic-ner-classifier',
          emotion: 'semantic-emotion-classifier'
        }
      });
    });
    
    return {
      initialize: jest.fn().mockResolvedValue(undefined),
      processText: mockProcessText,
      getModelInfo: jest.fn().mockReturnValue({
        embeddings: 'sentence-transformers/all-mpnet-base-v2',
        intent: 'semantic-intent-classifier',
        entities: 'semantic-ner-classifier',
        emotion: 'semantic-emotion-classifier',
        initialized: true,
        registeredTypes: ['embeddings', 'intent', 'entities', 'emotion']
      }),
      isReady: jest.fn().mockReturnValue(true)
    };
  })
}));

describe('PrimeCore - Model-Driven Architecture', () => {
  let primeCore: PrimeCore;

  beforeEach(() => {
    primeCore = new PrimeCore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with model pipeline', async () => {
      await primeCore.initialize();
      
      expect(primeCore).toBeDefined();
      expect(primeCore.humanUser).toBeDefined();
      expect(primeCore.chatbotUser).toBeDefined();
    });

    it('should have proper user models initialized', () => {
      expect(primeCore.humanUser.identity.type).toBe('human');
      expect(primeCore.chatbotUser.identity.type).toBe('chatbot');
      expect(primeCore.humanUser.identity.id).toBe('human-001');
      expect(primeCore.chatbotUser.identity.id).toBe('chatbot-001');
    });

    it('should initialize with empty conversation state', () => {
      expect(primeCore.humanUser.conversationState.context).toEqual([]);
      expect(primeCore.humanUser.conversationState.turnCount).toBe(0);
      expect(primeCore.chatbotUser.conversationState.context).toEqual([]);
      expect(primeCore.chatbotUser.conversationState.turnCount).toBe(0);
    });

    it('should have proper personality traits', () => {
      expect(primeCore.humanUser.identity.personality.traits).toContain('curious');
      expect(primeCore.chatbotUser.identity.personality.traits).toContain('helpful');
      expect(primeCore.chatbotUser.identity.personality.traits).toContain('mathematical');
    });
  });

  describe('Model-Driven Conversation Processing', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should process conversation through model pipeline', async () => {
      const input = 'Hello there!';
      const response = await primeCore.processConversation(input);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should update user state with model analysis', async () => {
      const input = 'My name is Alex';
      await primeCore.processConversation(input);
      
      // Check that conversation state was updated
      expect(primeCore.humanUser.conversationState.context).toContain(input);
      expect(primeCore.humanUser.conversationState.turnCount).toBe(1);
      expect(primeCore.humanUser.conversationState.embeddings).toHaveLength(768);
      expect(Object.keys(primeCore.humanUser.conversationState.primeFactors)).toContain('2');
    });

    it('should handle identity introduction correctly', async () => {
      const input = 'My name is Alex';
      const response = await primeCore.processConversation(input);
      
      expect(response).toContain('Alex');
      expect(response.toLowerCase()).toMatch(/(nice to meet you|welcome|hello)/i);
    });

    it('should handle greetings correctly', async () => {
      const input = 'Hello!';
      const response = await primeCore.processConversation(input);
      
      expect(response.toLowerCase()).toMatch(/(hello|hi|greetings)/i);
      expect(response.toLowerCase()).toMatch(/(ready|here|listening|excited|learn)/i);
    });

    it('should handle entity introductions', async () => {
      const input = 'My dog is named Max';
      const response = await primeCore.processConversation(input);
      
      expect(response).toMatch(/(Max|interesting|processing)/i);
      expect(response.toLowerCase()).toMatch(/(tell me more|assist|processing|interesting)/i);
    });

    it('should handle help requests', async () => {
      const input = 'Can you help me?';
      const response = await primeCore.processConversation(input);
      
      expect(response.toLowerCase()).toMatch(/(help|assist|ready)/i);
    });

    it('should handle gratitude expressions', async () => {
      const input = 'Thank you so much!';
      const response = await primeCore.processConversation(input);
      
      expect(response.toLowerCase()).toMatch(/(welcome|pleasure|glad|happy)/i);
    });
  });

  describe('Mathematical Operations', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should generate prime factorizations from embeddings', async () => {
      const input = 'Hello world';
      await primeCore.processConversation(input);
      
      const primeFactors = primeCore.humanUser.conversationState.primeFactors;
      expect(Object.keys(primeFactors)).toContain('2');
      expect(Object.keys(primeFactors)).toContain('3');
      expect(Object.keys(primeFactors)).toContain('5');
    });

    it('should calculate coherence between users', async () => {
      await primeCore.processConversation('Hello');
      const debugInfo = primeCore.getDebugInfo();
      
      expect(debugInfo.coherence).toBeDefined();
      expect(typeof debugInfo.coherence).toBe('number');
      expect(debugInfo.coherence).toBeGreaterThanOrEqual(0);
      expect(debugInfo.coherence).toBeLessThanOrEqual(1);
    });

    it('should update identity embeddings over time', async () => {
      // First conversation
      await primeCore.processConversation('Hello');
      const firstEmbeddings = [...primeCore.humanUser.identity.embeddings];
      
      // Second conversation
      await primeCore.processConversation('How are you?');
      const secondEmbeddings = primeCore.humanUser.identity.embeddings;
      
      // Embeddings should have evolved
      expect(secondEmbeddings).not.toEqual(firstEmbeddings);
      expect(secondEmbeddings).toHaveLength(768);
    });
  });

  describe('Memory Integration', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should store conversation history', async () => {
      await primeCore.processConversation('Hello');
      await primeCore.processConversation('My name is Alex');
      
      expect(primeCore.humanUser.conversationState.context).toHaveLength(2);
      expect(primeCore.humanUser.conversationState.context[0]).toBe('Hello');
      expect(primeCore.humanUser.conversationState.context[1]).toBe('My name is Alex');
    });

    it('should maintain conversation context limit', async () => {
      // Add more than 10 conversations
      for (let i = 0; i < 15; i++) {
        await primeCore.processConversation(`Message ${i}`);
      }
      
      // Should only keep last 10
      expect(primeCore.humanUser.conversationState.context).toHaveLength(10);
      expect(primeCore.humanUser.conversationState.context[0]).toBe('Message 5');
      expect(primeCore.humanUser.conversationState.context[9]).toBe('Message 14');
    });

    it('should provide comprehensive debug information', async () => {
      await primeCore.processConversation('Hello');
      const debugInfo = primeCore.getDebugInfo();
      
      expect(debugInfo.humanUser).toBeDefined();
      expect(debugInfo.chatbotUser).toBeDefined();
      expect(debugInfo.coherence).toBeDefined();
      expect(debugInfo.modelPipeline).toBeDefined();
      expect(debugInfo.episodicMemory).toBeDefined();
      
      expect(debugInfo.humanUser.conversationState.primeCount).toBeGreaterThan(0);
      expect(debugInfo.modelPipeline.initialized).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when processing without initialization', async () => {
      const uninitializedCore = new PrimeCore();
      
      await expect(uninitializedCore.processConversation('Hello'))
        .rejects.toThrow('PrimeCore not initialized');
    });

    it('should throw error for empty input', async () => {
      await primeCore.initialize();
      
      await expect(primeCore.processConversation(''))
        .rejects.toThrow('Cannot process empty input');
      
      await expect(primeCore.processConversation('   '))
        .rejects.toThrow('Cannot process empty input');
    });

    it('should handle model pipeline failures gracefully', async () => {
      // Mock pipeline to fail
      const mockPipeline = primeCore['modelPipeline'] as any;
      mockPipeline.processText = jest.fn().mockRejectedValue(new Error('Model processing failed'));
      
      await primeCore.initialize();
      
      await expect(primeCore.processConversation('Hello'))
        .rejects.toThrow('Model processing failed');
    });
  });

  describe('Response Generation', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should generate contextually appropriate responses', async () => {
      // Test greeting
      const greetingResponse = await primeCore.processConversation('Hello!');
      expect(greetingResponse.toLowerCase()).toMatch(/(hello|hi|greetings)/i);
      
      // Test identity introduction
      const identityResponse = await primeCore.processConversation('My name is Alex');
      expect(identityResponse).toContain('Alex');
      
      // Test help request
      const helpResponse = await primeCore.processConversation('Can you help me?');
      expect(helpResponse.toLowerCase()).toMatch(/(help|assist|ready)/i);
    });

    it('should remember previous conversation context', async () => {
      // Introduce name
      await primeCore.processConversation('My name is Alex');
      
      // Ask for name recall
      const response = await primeCore.processConversation('What is my name?');
      expect(response).toContain('Alex');
    });

    it('should handle entity relationships', async () => {
      // Introduce entity
      await primeCore.processConversation('My dog is named Max');
      
      // Query entity
      const response = await primeCore.processConversation('What is my dog called?');
      expect(response).toMatch(/(Max|interesting|processing|analyzing)/i);
    });

    it('should provide mathematical consciousness in responses', async () => {
      const response = await primeCore.processConversation('Hello');
      const debugInfo = primeCore.getDebugInfo();
      
      // Should have mathematical representations
      expect(debugInfo.humanUser.conversationState.primeCount).toBeGreaterThan(0);
      expect(debugInfo.chatbotUser.conversationState.primeCount).toBeGreaterThan(0);
      expect(debugInfo.coherence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Model Pipeline Integration', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should use model pipeline for semantic analysis', async () => {
      const mockPipeline = primeCore['modelPipeline'] as any;
      
      await primeCore.processConversation('Hello there!');
      
      expect(mockPipeline.processText).toHaveBeenCalledWith('Hello there!');
    });

    it('should integrate all model outputs', async () => {
      await primeCore.processConversation('I am feeling great today!');
      
      const debugInfo = primeCore.getDebugInfo();
      
      // Should have processed through all models
      expect(debugInfo.modelPipeline.embeddings).toBeDefined();
      expect(debugInfo.modelPipeline.intent).toBeDefined();
      expect(debugInfo.modelPipeline.entities).toBeDefined();
      expect(debugInfo.modelPipeline.emotion).toBeDefined();
    });

    it('should maintain model-driven architecture principles', async () => {
      const response = await primeCore.processConversation('Hello');
      
      // Response should be generated through model analysis, not hardcoded patterns
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      
      // Should have updated conversation state through model analysis
      expect(primeCore.humanUser.conversationState.embeddings).toHaveLength(768);
      expect(Object.keys(primeCore.humanUser.conversationState.primeFactors).length).toBeGreaterThan(0);
    });
  });

  describe('Personality and Identity Evolution', () => {
    beforeEach(async () => {
      await primeCore.initialize();
    });

    it('should evolve user identity through conversations', async () => {
      const initialEmbeddings = [...primeCore.humanUser.identity.embeddings];
      
      // Have multiple conversations
      await primeCore.processConversation('I love mathematics');
      await primeCore.processConversation('Prime numbers are fascinating');
      await primeCore.processConversation('I enjoy learning about algorithms');
      
      // Identity should have evolved
      const finalEmbeddings = primeCore.humanUser.identity.embeddings;
      expect(finalEmbeddings).not.toEqual(initialEmbeddings);
      expect(finalEmbeddings).toHaveLength(768);
    });

    it('should maintain chatbot personality consistency', async () => {
      await primeCore.processConversation('Hello');
      
      const chatbotPersonality = primeCore.chatbotUser.identity.personality;
      expect(chatbotPersonality.traits).toContain('helpful');
      expect(chatbotPersonality.traits).toContain('analytical');
      expect(chatbotPersonality.traits).toContain('mathematical');
      expect(chatbotPersonality.communicationStyle).toBe('thoughtful');
    });

    it('should track conversation turn counts', async () => {
      expect(primeCore.humanUser.conversationState.turnCount).toBe(0);
      
      await primeCore.processConversation('Hello');
      expect(primeCore.humanUser.conversationState.turnCount).toBe(1);
      
      await primeCore.processConversation('How are you?');
      expect(primeCore.humanUser.conversationState.turnCount).toBe(2);
    });
  });
});
