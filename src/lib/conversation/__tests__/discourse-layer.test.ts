import { DiscourseLayer, TopicState, ConversationFlow, ReferenceResolution } from '../discourse-layer';
import { SchemaVocabulary } from '../../semantic/schema-vocabulary';
import { ConversationContext } from '../pragmatic-layer';

describe('DiscourseLayer', () => {
  let discourseLayer: DiscourseLayer;
  let schemaVocabulary: SchemaVocabulary;
  let mockPragmaticContext: ConversationContext;

  beforeEach(() => {
    schemaVocabulary = new SchemaVocabulary();
    discourseLayer = new DiscourseLayer(schemaVocabulary);
    
    mockPragmaticContext = {
      currentTopic: null,
      activeIntents: [],
      entityMemory: new Map(),
      conversationGoals: [],
      userPreferences: {},
      conversationHistory: []
    };
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      const state = discourseLayer.getDiscourseState();
      
      expect(state.topicState.currentTopic).toBe('');
      expect(state.topicState.topicHistory).toEqual([]);
      expect(state.topicState.topicDepth).toBe(0);
      expect(state.conversationFlow.currentPhase).toBe('opening');
      expect(state.conversationFlow.turnsSincePhaseChange).toBe(0);
      expect(state.conversationFlow.expectedNextMoves).toContain('greeting');
    });
  });

  describe('analyzeDiscourseContext', () => {
    it('should analyze basic discourse context', () => {
      const semanticContext = {
        intent: 'GREETING',
        entities: ['Hello']
      };

      const result = discourseLayer.analyzeDiscourseContext(
        'Hello there!',
        semanticContext,
        mockPragmaticContext
      );

      expect(result.conversationPhase).toBe('opening');
      expect(result.expectedResponseType).toBe('social_response');
      expect(result.discourseMarkers).toBeDefined();
      expect(result.referenceResolutions).toBeDefined();
    });

    it('should detect topic continuity', () => {
      // First establish a topic
      const semanticContext1 = {
        intent: 'ENTITY_INTRODUCTION',
        entities: ['dog']
      };

      discourseLayer.analyzeDiscourseContext(
        'My dog is named Rex',
        semanticContext1,
        mockPragmaticContext
      );

      // Continue with same topic
      const semanticContext2 = {
        intent: 'ENTITY_QUERY',
        entities: ['dog']
      };

      const result = discourseLayer.analyzeDiscourseContext(
        'Tell me about my dog',
        semanticContext2,
        mockPragmaticContext
      );

      expect(result.topicContinuity).toBeGreaterThan(0);
    });

    it('should track conversation phase transitions', () => {
      // Start in opening phase
      let result = discourseLayer.analyzeDiscourseContext(
        'Hello',
        { intent: 'GREETING', entities: [] },
        mockPragmaticContext
      );
      expect(result.conversationPhase).toBe('opening');

      // Move to exploration with identity introduction
      result = discourseLayer.analyzeDiscourseContext(
        'My name is Alice',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Alice'] },
        mockPragmaticContext
      );
      expect(result.conversationPhase).toBe('exploration');
    });

    it('should detect discourse markers', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'By the way, I also have a cat',
        { intent: 'ENTITY_INTRODUCTION', entities: ['cat'] },
        mockPragmaticContext
      );

      expect(result.discourseMarkers).toContain('topic_shift');
    });
  });

  describe('topic state management', () => {
    it('should extract topics from entity introductions', () => {
      const semanticContext = {
        intent: 'ENTITY_INTRODUCTION',
        entities: ['dog']
      };

      discourseLayer.analyzeDiscourseContext(
        'My dog is named Rex',
        semanticContext,
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.topicState.currentTopic).toBe('animal_discussion');
    });

    it('should track topic transitions', () => {
      // First topic
      discourseLayer.analyzeDiscourseContext(
        'My dog is Rex',
        { intent: 'ENTITY_INTRODUCTION', entities: ['dog'] },
        mockPragmaticContext
      );

      // Second topic
      discourseLayer.analyzeDiscourseContext(
        'My car is blue',
        { intent: 'ENTITY_INTRODUCTION', entities: ['car'] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.topicState.topicHistory).toContain('animal_discussion');
      expect(state.topicState.currentTopic).toBe('vehicle_discussion');
    });

    it('should increase topic depth for continued discussion', () => {
      const semanticContext = {
        intent: 'ENTITY_INTRODUCTION',
        entities: ['dog']
      };

      // First mention
      discourseLayer.analyzeDiscourseContext(
        'My dog is Rex',
        semanticContext,
        mockPragmaticContext
      );

      // Continue same topic
      discourseLayer.analyzeDiscourseContext(
        'Rex is a good dog',
        semanticContext,
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.topicState.topicDepth).toBeGreaterThan(0);
    });

    it('should handle identity discussions', () => {
      discourseLayer.analyzeDiscourseContext(
        'My name is Alice',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Alice'] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.topicState.currentTopic).toBe('identity_discussion');
    });

    it('should handle help requests', () => {
      discourseLayer.analyzeDiscourseContext(
        'Can you help me?',
        { intent: 'HELP_REQUEST', entities: [] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.topicState.currentTopic).toBe('assistance_request');
    });
  });

  describe('conversation flow management', () => {
    it('should transition from opening to exploration', () => {
      // Start in opening
      discourseLayer.analyzeDiscourseContext(
        'Hello',
        { intent: 'GREETING', entities: [] },
        mockPragmaticContext
      );

      // Move to exploration with identity
      discourseLayer.analyzeDiscourseContext(
        'My name is Bob',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Bob'] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.conversationFlow.currentPhase).toBe('exploration');
    });

    it('should transition to deepening phase', () => {
      // Establish topic
      discourseLayer.analyzeDiscourseContext(
        'My dog is Rex',
        { intent: 'ENTITY_INTRODUCTION', entities: ['dog'] },
        mockPragmaticContext
      );

      // Continue topic to increase depth
      for (let i = 0; i < 3; i++) {
        discourseLayer.analyzeDiscourseContext(
          'Tell me more about Rex',
          { intent: 'ENTITY_QUERY', entities: ['dog'] },
          mockPragmaticContext
        );
      }

      const state = discourseLayer.getDiscourseState();
      expect(state.conversationFlow.currentPhase).toBe('deepening');
    });

    it('should update expected next moves', () => {
      discourseLayer.analyzeDiscourseContext(
        'My name is Alice',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Alice'] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.conversationFlow.expectedNextMoves).toContain('information_sharing');
    });

    it('should track conversation momentum', () => {
      // Add engaging content
      discourseLayer.analyzeDiscourseContext(
        'What is machine learning?',
        { intent: 'INFORMATION_REQUEST', entities: [] },
        mockPragmaticContext
      );

      discourseLayer.analyzeDiscourseContext(
        'My name is Alice',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Alice'] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.conversationFlow.conversationMomentum).toBeGreaterThan(0);
    });

    it('should decay momentum over time', () => {
      // Start with high momentum
      discourseLayer.analyzeDiscourseContext(
        'What is AI?',
        { intent: 'INFORMATION_REQUEST', entities: [] },
        mockPragmaticContext
      );

      // Add generic responses to decay momentum
      for (let i = 0; i < 5; i++) {
        discourseLayer.analyzeDiscourseContext(
          'okay',
          { intent: 'GENERAL_CONVERSATION', entities: [] },
          mockPragmaticContext
        );
      }

      const state = discourseLayer.getDiscourseState();
      expect(state.conversationFlow.conversationMomentum).toBeLessThan(0.5);
    });
  });

  describe('reference resolution', () => {
    it('should resolve pronoun references', () => {
      // Set up context with entity
      mockPragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'My dog is Rex',
          intent: 'ENTITY_INTRODUCTION',
          entities: { entity_0: 'dog', entity_1: 'Rex' },
          context: {}
        }
      ];

      discourseLayer.analyzeDiscourseContext(
        'He is a good dog',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.referenceResolution.pronouns.has('he')).toBe(true);
    });

    it('should track entity references', () => {
      mockPragmaticContext.entityMemory.set('dog_name', {
        value: 'Rex',
        entityType: 'dog',
        lastMentioned: Date.now()
      });

      discourseLayer.analyzeDiscourseContext(
        'Rex is playing outside',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.referenceResolution.entityReferences.has('Rex')).toBe(true);
    });

    it('should handle contextual references', () => {
      // First establish a topic
      discourseLayer.analyzeDiscourseContext(
        'My dog is Rex',
        { intent: 'ENTITY_INTRODUCTION', entities: ['dog'] },
        mockPragmaticContext
      );

      // Reference back to the topic
      discourseLayer.analyzeDiscourseContext(
        'Going back to the animal discussion',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.referenceResolution.contextualReferences.size).toBeGreaterThan(0);
    });
  });

  describe('discourse marker detection', () => {
    it('should detect topic shift markers', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'Anyway, let\'s talk about something else',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.discourseMarkers).toContain('topic_shift');
    });

    it('should detect elaboration markers', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'Furthermore, I think this is important',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.discourseMarkers).toContain('elaboration');
    });

    it('should detect contrast markers', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'However, I disagree with that',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.discourseMarkers).toContain('contrast');
    });

    it('should detect conclusion markers', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'Therefore, we can conclude that',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.discourseMarkers).toContain('conclusion');
    });

    it('should detect clarification markers', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'I mean, what I\'m trying to say is',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.discourseMarkers).toContain('clarification');
    });

    it('should detect sequence markers', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'First, we need to understand the basics',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.discourseMarkers).toContain('sequence');
    });
  });

  describe('expected response type determination', () => {
    it('should determine informative answer for questions', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'What is your name?',
        { intent: 'BOT_IDENTITY_QUERY', entities: [] },
        mockPragmaticContext
      );

      expect(result.expectedResponseType).toBe('informative_answer');
    });

    it('should determine social response for greetings', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'Hello there!',
        { intent: 'GREETING', entities: [] },
        mockPragmaticContext
      );

      expect(result.expectedResponseType).toBe('social_response');
    });

    it('should determine acknowledgment with followup for introductions', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'My name is Alice',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Alice'] },
        mockPragmaticContext
      );

      expect(result.expectedResponseType).toBe('acknowledgment_with_followup');
    });

    it('should determine supportive response for help requests', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'Can you help me?',
        { intent: 'HELP_REQUEST', entities: [] },
        mockPragmaticContext
      );

      expect(result.expectedResponseType).toBe('supportive_response');
    });

    it('should modify response type based on conversation phase', () => {
      // Set up deepening phase
      for (let i = 0; i < 5; i++) {
        discourseLayer.analyzeDiscourseContext(
          'Tell me more about dogs',
          { intent: 'ENTITY_QUERY', entities: ['dog'] },
          mockPragmaticContext
        );
      }

      const result = discourseLayer.analyzeDiscourseContext(
        'What about dog breeds?',
        { intent: 'INFORMATION_REQUEST', entities: [] },
        mockPragmaticContext
      );

      expect(result.expectedResponseType).toBe('detailed_explanation');
    });

    it('should handle transitional responses', () => {
      // Establish topic then transition
      discourseLayer.analyzeDiscourseContext(
        'My dog is Rex',
        { intent: 'ENTITY_INTRODUCTION', entities: ['dog'] },
        mockPragmaticContext
      );

      discourseLayer.analyzeDiscourseContext(
        'My car is blue',
        { intent: 'ENTITY_INTRODUCTION', entities: ['car'] },
        mockPragmaticContext
      );

      // Should be in transition phase
      const result = discourseLayer.analyzeDiscourseContext(
        'Tell me something',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      // In transition phase, but query should still get informative response
      expect(result.conversationPhase).toBe('transition');
    });
  });

  describe('topic coherence calculation', () => {
    it('should calculate coherence for consistent topics', () => {
      mockPragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'My dog is Rex',
          intent: 'ENTITY_INTRODUCTION',
          entities: { entity_0: 'dog', entity_1: 'Rex' },
          context: {}
        },
        {
          id: '2',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'Rex is a good dog',
          intent: 'GENERAL_CONVERSATION',
          entities: { entity_0: 'Rex' },
          context: {}
        }
      ];

      discourseLayer.analyzeDiscourseContext(
        'Tell me about Rex',
        { intent: 'ENTITY_QUERY', entities: ['Rex'] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.topicState.topicCoherence).toBeGreaterThan(0);
    });

    it('should handle empty conversation history', () => {
      const result = discourseLayer.analyzeDiscourseContext(
        'Hello',
        { intent: 'GREETING', entities: [] },
        mockPragmaticContext
      );

      expect(result.topicContinuity).toBe(0);
    });
  });

  describe('topic keyword mapping', () => {
    it('should map identity discussion keywords', () => {
      discourseLayer.analyzeDiscourseContext(
        'My name is Alice',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Alice'] },
        mockPragmaticContext
      );

      const result = discourseLayer.analyzeDiscourseContext(
        'Tell me about my identity',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.topicContinuity).toBeGreaterThan(0);
    });

    it('should map animal discussion keywords', () => {
      discourseLayer.analyzeDiscourseContext(
        'My dog is Rex',
        { intent: 'ENTITY_INTRODUCTION', entities: ['dog'] },
        mockPragmaticContext
      );

      const result = discourseLayer.analyzeDiscourseContext(
        'Tell me about animals',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.topicContinuity).toBeGreaterThan(0);
    });

    it('should handle unknown topics gracefully', () => {
      discourseLayer.analyzeDiscourseContext(
        'Random topic',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      const result = discourseLayer.analyzeDiscourseContext(
        'More random stuff',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );

      expect(result.topicContinuity).toBe(0);
    });
  });

  describe('reset functionality', () => {
    it('should reset discourse state', () => {
      // Add some state
      discourseLayer.analyzeDiscourseContext(
        'My dog is Rex',
        { intent: 'ENTITY_INTRODUCTION', entities: ['dog'] },
        mockPragmaticContext
      );

      // Reset
      discourseLayer.resetDiscourseState();

      // Check state is reset
      const state = discourseLayer.getDiscourseState();
      expect(state.topicState.currentTopic).toBe('');
      expect(state.topicState.topicHistory).toEqual([]);
      expect(state.topicState.topicDepth).toBe(0);
      expect(state.conversationFlow.currentPhase).toBe('opening');
      expect(state.referenceResolution.pronouns.size).toBe(0);
      expect(state.referenceResolution.entityReferences.size).toBe(0);
      expect(state.referenceResolution.contextualReferences.size).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty input', () => {
      expect(() => {
        discourseLayer.analyzeDiscourseContext(
          '',
          { intent: 'GENERAL_CONVERSATION', entities: [] },
          mockPragmaticContext
        );
      }).not.toThrow();
    });

    it('should handle null semantic context', () => {
      expect(() => {
        discourseLayer.analyzeDiscourseContext(
          'Hello',
          null as any,
          mockPragmaticContext
        );
      }).not.toThrow();
    });

    it('should handle missing entities', () => {
      expect(() => {
        discourseLayer.analyzeDiscourseContext(
          'Hello',
          { intent: 'GREETING' } as any,
          mockPragmaticContext
        );
      }).not.toThrow();
    });

    it('should handle very long input', () => {
      const longInput = 'a'.repeat(10000);
      expect(() => {
        discourseLayer.analyzeDiscourseContext(
          longInput,
          { intent: 'GENERAL_CONVERSATION', entities: [] },
          mockPragmaticContext
        );
      }).not.toThrow();
    });

    it('should handle special characters', () => {
      expect(() => {
        discourseLayer.analyzeDiscourseContext(
          'Hello @#$%^&*()_+',
          { intent: 'GREETING', entities: [] },
          mockPragmaticContext
        );
      }).not.toThrow();
    });

    it('should handle malformed conversation history', () => {
      mockPragmaticContext.conversationHistory = [
        null as any,
        undefined as any,
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'Valid message',
          intent: 'GREETING',
          entities: {},
          context: {}
        }
      ];

      expect(() => {
        discourseLayer.analyzeDiscourseContext(
          'Hello',
          { intent: 'GREETING', entities: [] },
          mockPragmaticContext
        );
      }).not.toThrow();
    });
  });

  describe('complex conversation flows', () => {
    it('should handle multi-topic conversations', () => {
      // Topic 1: Identity
      discourseLayer.analyzeDiscourseContext(
        'My name is Alice',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Alice'] },
        mockPragmaticContext
      );

      // Topic 2: Pet
      discourseLayer.analyzeDiscourseContext(
        'My dog is Rex',
        { intent: 'ENTITY_INTRODUCTION', entities: ['dog'] },
        mockPragmaticContext
      );

      // Topic 3: Help
      discourseLayer.analyzeDiscourseContext(
        'Can you help me?',
        { intent: 'HELP_REQUEST', entities: [] },
        mockPragmaticContext
      );

      const state = discourseLayer.getDiscourseState();
      expect(state.topicState.topicHistory.length).toBeGreaterThan(0);
      expect(state.topicState.currentTopic).toBe('assistance_request');
    });

    it('should track conversation progression', () => {
      // Opening
      let result = discourseLayer.analyzeDiscourseContext(
        'Hello',
        { intent: 'GREETING', entities: [] },
        mockPragmaticContext
      );
      expect(result.conversationPhase).toBe('opening');

      // Exploration
      result = discourseLayer.analyzeDiscourseContext(
        'My name is Bob',
        { intent: 'IDENTITY_INTRODUCTION', entities: ['Bob'] },
        mockPragmaticContext
      );
      expect(result.conversationPhase).toBe('exploration');

      // Continue exploration
      result = discourseLayer.analyzeDiscourseContext(
        'I have a dog',
        { intent: 'ENTITY_INTRODUCTION', entities: ['dog'] },
        mockPragmaticContext
      );
      expect(result.conversationPhase).toBe('exploration');
    });

    it('should handle rapid topic changes', () => {
      const topics = ['dog', 'car', 'house', 'job', 'weather'];
      
      topics.forEach(topic => {
        discourseLayer.analyzeDiscourseContext(
          `Tell me about ${topic}`,
          { intent: 'INFORMATION_REQUEST', entities: [topic] },
          mockPragmaticContext
        );
      });

      const state = discourseLayer.getDiscourseState();
      expect(state.conversationFlow.currentPhase).toBe('transition');
    });
  });

  describe('performance considerations', () => {
    it('should handle large conversation histories efficiently', () => {
      // Create large conversation history
      const largeHistory = [];
      for (let i = 0; i < 1000; i++) {
        largeHistory.push({
          id: `${i}`,
          timestamp: Date.now() - i * 1000,
          speaker: 'human' as const,
          text: `Message ${i}`,
          intent: 'GENERAL_CONVERSATION',
          entities: {},
          context: {}
        });
      }
      mockPragmaticContext.conversationHistory = largeHistory;

      const startTime = Date.now();
      discourseLayer.analyzeDiscourseContext(
        'Current message',
        { intent: 'GENERAL_CONVERSATION', entities: [] },
        mockPragmaticContext
      );
      const endTime = Date.now();

      // Should process efficiently (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle many entity references efficiently', () => {
      // Create many entity references
      for (let i = 0; i < 100; i++) {
        mockPragmaticContext.entityMemory.set(`entity_${i}`, {
          value: `Entity${i}`,
          lastMentioned: Date.now()
        });
      }

      const startTime = Date.now();
      discourseLayer.analyzeDiscourseContext(
        'Tell me about Entity50',
        { intent: 'ENTITY_QUERY', entities: ['Entity50'] },
        mockPragmaticContext
      );
      const endTime = Date.now();

      // Should process efficiently
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
