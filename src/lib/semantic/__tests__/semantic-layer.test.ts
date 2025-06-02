// =============================================================================
// SEMANTIC LAYER TESTS
// =============================================================================

import { SemanticLayer } from '../semantic-layer';

describe('SemanticLayer', () => {
  let semanticLayer: SemanticLayer;

  beforeEach(() => {
    semanticLayer = new SemanticLayer();
  });

  describe('constructor', () => {
    it('should create a new instance', () => {
      expect(semanticLayer).toBeInstanceOf(SemanticLayer);
    });
  });

  describe('analyzeSemanticContext', () => {
    it('should analyze semantic context and return intent', () => {
      const text = 'Hello world, this is a test message.';
      const result = semanticLayer.analyzeSemanticContext(text);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('semanticBoosts');
      expect(result).toHaveProperty('confidence');
    });

    it('should handle empty text', () => {
      const text = '';
      const result = semanticLayer.analyzeSemanticContext(text);

      expect(result).toBeDefined();
      expect(result.intent).toBe('GENERAL_CONVERSATION');
    });

    it('should detect greetings', () => {
      const text = 'Hello there!';
      const result = semanticLayer.analyzeSemanticContext(text);

      expect(result.intent).toBe('GREETING');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('extractEntitiesFromContext', () => {
    it('should extract entities from conversation history', () => {
      const history = ['Hello', 'My name is John Smith', 'I work at Microsoft'];
      const entities = semanticLayer.extractEntitiesFromContext(history);

      expect(entities).toBeInstanceOf(Map);
      expect(entities.has('user_name')).toBe(true);
      expect(entities.get('user_name')).toBe('John');
    });

    it('should handle empty history', () => {
      const history: string[] = [];
      const entities = semanticLayer.extractEntitiesFromContext(history);

      expect(entities).toBeInstanceOf(Map);
      expect(entities.size).toBe(0);
    });

    it('should handle history with no entities', () => {
      const history = ['This is just a simple conversation', 'Nothing special here'];
      const entities = semanticLayer.extractEntitiesFromContext(history);

      expect(entities).toBeInstanceOf(Map);
    });
  });

  describe('generateContextualResponse', () => {
    it('should generate contextual responses', () => {
      const semanticContext = {
        intent: 'GREETING',
        entities: [],
        semanticBoosts: ['hello', 'greeting'],
        confidence: 0.8
      };
      const history = ['Hello there!'];
      const resonantWords = ['hello', 'greeting'];
      
      const response = semanticLayer.generateContextualResponse(semanticContext, history, resonantWords);

      expect(typeof response).toBe('string');
      expect(response).toContain('Hello');
    });

    it('should handle help requests', () => {
      const semanticContext = {
        intent: 'HELP_REQUEST',
        entities: [],
        semanticBoosts: ['help', 'assist'],
        confidence: 0.8
      };
      const history = ['Can you help me?'];
      const resonantWords = ['help'];
      
      const response = semanticLayer.generateContextualResponse(semanticContext, history, resonantWords);

      expect(typeof response).toBe('string');
      expect(response).toContain('help');
    });

    it('should return null for unhandled intents', () => {
      const semanticContext = {
        intent: 'UNKNOWN_INTENT',
        entities: [],
        semanticBoosts: [],
        confidence: 0.3
      };
      const history = ['Some random text'];
      const resonantWords: string[] = [];
      
      const response = semanticLayer.generateContextualResponse(semanticContext, history, resonantWords);

      expect(response).toBeNull();
    });
  });

  describe('enhanceResonanceWithSemantics', () => {
    it('should enhance resonance with semantic boosts', () => {
      const resonantWords = [
        { word: 'hello', resonance: 10 },
        { word: 'world', resonance: 5 }
      ];
      const semanticContext = {
        intent: 'GREETING',
        entities: [],
        semanticBoosts: ['hello', 'greeting'],
        confidence: 0.8
      };

      const enhanced = semanticLayer.enhanceResonanceWithSemantics(resonantWords, semanticContext);

      expect(Array.isArray(enhanced)).toBe(true);
      expect(enhanced.length).toBe(2);
      expect(enhanced[0].word).toBe('hello');
      expect(enhanced[0].resonance).toBeGreaterThan(10); // Should be boosted
      expect(enhanced[1].word).toBe('world');
    });

    it('should handle empty resonant words', () => {
      const resonantWords: Array<{word: string, resonance: number}> = [];
      const semanticContext = {
        intent: 'GENERAL_CONVERSATION',
        entities: [],
        semanticBoosts: [],
        confidence: 0.5
      };

      const enhanced = semanticLayer.enhanceResonanceWithSemantics(resonantWords, semanticContext);

      expect(Array.isArray(enhanced)).toBe(true);
      expect(enhanced.length).toBe(0);
    });
  });

  describe('pattern matching', () => {
    it('should detect identity introduction patterns', () => {
      const text = 'My name is Alice';
      const result = semanticLayer.analyzeSemanticContext(text);

      expect(result.intent).toBe('IDENTITY_INTRODUCTION');
      expect(result.entities).toContain('Alice');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect question patterns', () => {
      const text = 'What is my name?';
      const result = semanticLayer.analyzeSemanticContext(text);

      expect(result.intent).toBe('IDENTITY_QUERY');
      expect(result.semanticBoosts).toContain('name');
    });

    it('should detect bot identity queries', () => {
      const text = 'Who are you?';
      const result = semanticLayer.analyzeSemanticContext(text);

      expect(result.intent).toBe('BOT_IDENTITY_QUERY');
      expect(result.semanticBoosts).toContain('identity');
    });

    it('should handle general conversation', () => {
      const text = 'This is just some random text without patterns';
      const result = semanticLayer.analyzeSemanticContext(text);

      expect(result.intent).toBe('GENERAL_CONVERSATION');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('integration tests', () => {
    it('should work with realistic conversation flow', () => {
      const greeting = 'Hello there!';
      const introduction = 'My name is John';
      const question = 'What is my name?';
      
      const greetingResult = semanticLayer.analyzeSemanticContext(greeting);
      const introResult = semanticLayer.analyzeSemanticContext(introduction);
      const questionResult = semanticLayer.analyzeSemanticContext(question);

      expect(greetingResult.intent).toBe('GREETING');
      expect(introResult.intent).toBe('IDENTITY_INTRODUCTION');
      expect(introResult.entities).toContain('John');
      expect(questionResult.intent).toBe('IDENTITY_QUERY');
    });

    it('should maintain consistency across multiple calls', () => {
      const text = 'Hello, how are you today?';
      
      const result1 = semanticLayer.analyzeSemanticContext(text);
      const result2 = semanticLayer.analyzeSemanticContext(text);

      // Results should be consistent for the same input
      expect(result1).toEqual(result2);
    });

    it('should handle complex entity relationships', () => {
      const history = [
        'Hello',
        'My name is Alice',
        'My dog\'s name is Buddy',
        'What is my dog\'s name?'
      ];
      
      const entities = semanticLayer.extractEntitiesFromContext(history);
      const lastContext = semanticLayer.analyzeSemanticContext(history[3]);
      
      expect(entities.has('user_name')).toBe(true);
      expect(entities.get('user_name')).toBe('Alice');
      expect(lastContext.intent).toBe('ENTITY_QUERY');
    });
  });
});
