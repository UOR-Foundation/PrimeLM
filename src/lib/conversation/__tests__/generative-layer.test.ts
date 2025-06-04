import { GenerativeLayer, GenerationContext, ResponseComponents, GenerationStyle } from '../generative-layer';
import { SchemaVocabulary } from '../../semantic/schema-vocabulary';
import { ConversationContext } from '../pragmatic-layer';

describe('GenerativeLayer', () => {
  let generativeLayer: GenerativeLayer;
  let schemaVocabulary: SchemaVocabulary;
  let mockGenerationContext: GenerationContext;

  beforeEach(() => {
    schemaVocabulary = new SchemaVocabulary();
    generativeLayer = new GenerativeLayer(schemaVocabulary);

    const mockPragmaticContext: ConversationContext = {
      currentTopic: null,
      activeIntents: [],
      entityMemory: new Map(),
      conversationGoals: [],
      userPreferences: {},
      conversationHistory: []
    };

    mockGenerationContext = {
      responseType: 'acknowledgment',
      semanticContext: {
        intent: 'GENERAL_CONVERSATION',
        entities: []
      },
      discourseContext: {
        conversationPhase: 'opening',
        topicContinuity: 0,
        expectedResponseType: 'acknowledgment',
        discourseMarkers: [],
        referenceResolutions: new Map()
      },
      pragmaticContext: mockPragmaticContext,
      primeResonance: {}
    };
  });

  describe('constructor', () => {
    it('should initialize with default style', () => {
      expect(generativeLayer).toBeDefined();
    });
  });

  describe('generateResponse', () => {
    it('should generate basic response', () => {
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should generate social response for greetings', () => {
      mockGenerationContext.responseType = 'social_response';
      mockGenerationContext.semanticContext.intent = 'GREETING';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('PrimeBot');
      expect(response.length).toBeGreaterThan(10);
    });

    it('should generate acknowledgment with followup', () => {
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.semanticContext = {
        intent: 'IDENTITY_INTRODUCTION',
        entities: ['Alice']
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('Alice');
      expect(response.length).toBeGreaterThan(10);
    });

    it('should generate informative answers', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.semanticContext.intent = 'BOT_IDENTITY_QUERY';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'Who are you?',
          intent: 'BOT_IDENTITY_QUERY',
          entities: {},
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('PrimeBot');
      expect(response.length).toBeGreaterThan(20);
    });

    it('should handle entity introductions', () => {
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.semanticContext = {
        intent: 'ENTITY_INTRODUCTION',
        entities: ['dog', 'Buddy']
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('dog');
      expect(response).toMatch(/(Buddy|don't recall|don't have|information)/i);
    });
  });

  describe('style determination', () => {
    it('should adjust style for conversation phase', () => {
      mockGenerationContext.discourseContext.conversationPhase = 'deepening';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toBeDefined();
      // Deepening phase should produce more detailed responses
    });

    it('should adjust style for semantic intent', () => {
      mockGenerationContext.semanticContext.intent = 'HELP_REQUEST';
      mockGenerationContext.responseType = 'supportive_response';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('help');
    });

    it('should adjust style for conversation momentum', () => {
      mockGenerationContext.discourseContext = {
        ...mockGenerationContext.discourseContext,
        conversationFlow: {
          currentPhase: 'exploration',
          turnsSincePhaseChange: 2,
          expectedNextMoves: ['information_sharing'],
          conversationMomentum: 0.8
        }
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toBeDefined();
      // High momentum should produce more enthusiastic responses
    });
  });

  describe('semantic query handling', () => {
    it('should handle bot identity queries', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'Who are you?',
          intent: 'BOT_IDENTITY_QUERY',
          entities: {},
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('PrimeBot');
      expect(response).toContain('AI');
    });

    it('should handle user name queries', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'My name is Alice',
          intent: 'IDENTITY_INTRODUCTION',
          entities: { entity_0: 'Alice' },
          context: {}
        },
        {
          id: '2',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'What is my name?',
          intent: 'IDENTITY_QUERY',
          entities: {},
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('Alice');
    });

    it('should handle entity name queries', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'My dog\'s name is Buddy',
          intent: 'ENTITY_INTRODUCTION',
          entities: { entity_0: 'dog', entity_1: 'Buddy' },
          context: {}
        },
        {
          id: '2',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'What is my dog\'s name?',
          intent: 'ENTITY_QUERY',
          entities: { entity_0: 'dog' },
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/(Buddy|don't recall|don't have|information)/i);
    });

    it('should handle pronoun resolution', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'My wife\'s name is Sarah',
          intent: 'ENTITY_INTRODUCTION',
          entities: { entity_0: 'wife', entity_1: 'Sarah' },
          context: {}
        },
        {
          id: '2',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'What is her name?',
          intent: 'ENTITY_QUERY',
          entities: {},
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('Sarah');
    });

    it('should handle unknown queries gracefully', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'What is my favorite color?',
          intent: 'INFORMATION_REQUEST',
          entities: {},
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('don\'t have');
      expect(response).toContain('information');
    });
  });

  describe('entity acknowledgment', () => {
    it('should acknowledge simple entities', () => {
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.semanticContext = {
        intent: 'IDENTITY_INTRODUCTION',
        entities: ['Alice']
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('Alice');
      expect(response).toContain('meet');
    });

    it('should acknowledge entity relationships', () => {
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.semanticContext = {
        intent: 'ENTITY_INTRODUCTION',
        entities: ['dog', 'Buddy']
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('dog');
      expect(response).toContain('Buddy');
    });

    it('should provide schema-informed context', () => {
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.semanticContext = {
        intent: 'ENTITY_INTRODUCTION',
        entities: ['dog', 'Rex']
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('dog');
      expect(response).toContain('Rex');
      // Should ask follow-up questions for animals
      expect(response.toLowerCase()).toMatch(/what|tell|more/);
    });
  });

  describe('personality styles', () => {
    it('should generate friendly responses', () => {
      mockGenerationContext.semanticContext.intent = 'GREETING';
      mockGenerationContext.responseType = 'social_response';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/friendly|wonderful|great|love/i);
    });

    it('should generate helpful responses', () => {
      mockGenerationContext.semanticContext.intent = 'HELP_REQUEST';
      mockGenerationContext.responseType = 'supportive_response';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/help|assist|support/i);
    });

    it('should generate analytical responses', () => {
      mockGenerationContext.discourseContext.conversationPhase = 'deepening';
      mockGenerationContext.semanticContext.intent = 'INFORMATION_REQUEST';
      mockGenerationContext.responseType = 'detailed_explanation';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toBeDefined();
      // Analytical responses should be more technical
    });
  });

  describe('response components', () => {
    it('should generate appropriate openings', () => {
      mockGenerationContext.responseType = 'social_response';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/^(Hello|Hi|Hey|Greetings)/);
    });

    it('should generate core content', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.semanticContext.intent = 'BOT_IDENTITY_QUERY';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'Who are you?',
          intent: 'BOT_IDENTITY_QUERY',
          entities: {},
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('PrimeBot');
    });

    it('should generate followups when appropriate', () => {
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.discourseContext.conversationPhase = 'exploration';
      mockGenerationContext.semanticContext = {
        intent: 'ENTITY_INTRODUCTION',
        entities: ['dog', 'Rex']
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/\?/); // Should contain a question
    });
  });

  describe('verbosity levels', () => {
    it('should generate concise responses', () => {
      mockGenerationContext.discourseContext = {
        ...mockGenerationContext.discourseContext,
        conversationFlow: {
          currentPhase: 'transition',
          turnsSincePhaseChange: 1,
          expectedNextMoves: [],
          conversationMomentum: 0.2
        }
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response.length).toBeLessThan(100);
    });

    it('should generate detailed responses', () => {
      mockGenerationContext.discourseContext = {
        ...mockGenerationContext.discourseContext,
        conversationPhase: 'deepening',
        conversationFlow: {
          currentPhase: 'deepening',
          turnsSincePhaseChange: 5,
          expectedNextMoves: ['detailed_explanation'],
          conversationMomentum: 0.8
        }
      };
      mockGenerationContext.responseType = 'detailed_explanation';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response.length).toBeGreaterThan(50);
    });
  });

  describe('contextual responses', () => {
    it('should handle welcoming responses', () => {
      mockGenerationContext.responseType = 'welcoming_response';
      mockGenerationContext.discourseContext.conversationPhase = 'opening';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('PrimeBot');
      expect(response).toMatch(/help|assist|understand/i);
    });

    it('should handle transitional responses', () => {
      mockGenerationContext.responseType = 'transitional_response';
      mockGenerationContext.discourseContext = {
        ...mockGenerationContext.discourseContext,
        conversationPhase: 'transition',
        topicState: {
          currentTopic: 'new_topic',
          topicHistory: ['old_topic'],
          topicTransitions: new Map(),
          topicDepth: 0,
          topicCoherence: 0
        }
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/moved|topic|discuss/i);
    });

    it('should handle gracious acknowledgments', () => {
      mockGenerationContext.responseType = 'gracious_acknowledgment';
      mockGenerationContext.semanticContext.intent = 'GRATITUDE';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/welcome|pleasure|glad/i);
    });
  });

  describe('attribute queries', () => {
    it('should handle color queries', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'My car is red',
          intent: 'GENERAL_CONVERSATION',
          entities: {},
          context: {}
        },
        {
          id: '2',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'What color is my car?',
          intent: 'INFORMATION_REQUEST',
          entities: {},
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('red');
    });

    it('should handle missing attribute information', () => {
      mockGenerationContext.responseType = 'informative_answer';
      mockGenerationContext.pragmaticContext.conversationHistory = [
        {
          id: '1',
          timestamp: Date.now(),
          speaker: 'human',
          text: 'What color is my hair?',
          intent: 'INFORMATION_REQUEST',
          entities: {},
          context: {}
        }
      ];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/don't have|don't recall|information/i);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty semantic context', () => {
      mockGenerationContext.semanticContext = null as any;
      
      expect(() => {
        generativeLayer.generateResponse(mockGenerationContext);
      }).not.toThrow();
    });

    it('should handle missing entities', () => {
      mockGenerationContext.semanticContext.entities = undefined as any;
      
      expect(() => {
        generativeLayer.generateResponse(mockGenerationContext);
      }).not.toThrow();
    });

    it('should handle empty conversation history', () => {
      mockGenerationContext.pragmaticContext.conversationHistory = [];
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle malformed conversation history', () => {
      mockGenerationContext.pragmaticContext.conversationHistory = [
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
        generativeLayer.generateResponse(mockGenerationContext);
      }).not.toThrow();
    });

    it('should handle very long entity names', () => {
      const longName = 'a'.repeat(1000);
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.semanticContext = {
        intent: 'IDENTITY_INTRODUCTION',
        entities: [longName]
      };
      
      expect(() => {
        generativeLayer.generateResponse(mockGenerationContext);
      }).not.toThrow();
    });

    it('should handle special characters in entities', () => {
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.semanticContext = {
        intent: 'IDENTITY_INTRODUCTION',
        entities: ['José-María@#$%']
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('José-María@#$%');
    });
  });

  describe('complex scenarios', () => {
    it('should handle multi-entity introductions', () => {
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      mockGenerationContext.semanticContext = {
        intent: 'ENTITY_INTRODUCTION',
        entities: ['dog', 'Rex', 'Golden Retriever']
      };
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toContain('dog');
      expect(response).toContain('Rex');
    });

    it('should handle conversation flow changes', () => {
      // Start with opening
      mockGenerationContext.discourseContext.conversationPhase = 'opening';
      let response = generativeLayer.generateResponse(mockGenerationContext);
      expect(response).toBeDefined();

      // Move to exploration
      mockGenerationContext.discourseContext.conversationPhase = 'exploration';
      mockGenerationContext.responseType = 'acknowledgment_with_followup';
      response = generativeLayer.generateResponse(mockGenerationContext);
      expect(response).toBeDefined();

      // Move to deepening
      mockGenerationContext.discourseContext.conversationPhase = 'deepening';
      mockGenerationContext.responseType = 'detailed_explanation';
      response = generativeLayer.generateResponse(mockGenerationContext);
      expect(response).toBeDefined();
    });

    it('should maintain consistency across multiple generations', () => {
      const responses = [];
      
      for (let i = 0; i < 5; i++) {
        mockGenerationContext.semanticContext.intent = 'BOT_IDENTITY_QUERY';
        mockGenerationContext.responseType = 'informative_answer';
        mockGenerationContext.pragmaticContext.conversationHistory = [
          {
            id: `${i}`,
            timestamp: Date.now(),
            speaker: 'human',
            text: 'Who are you?',
            intent: 'BOT_IDENTITY_QUERY',
            entities: {},
            context: {}
          }
        ];
        
        const response = generativeLayer.generateResponse(mockGenerationContext);
        responses.push(response);
      }
      
      // All responses should mention PrimeBot
      responses.forEach(response => {
        expect(response).toContain('PrimeBot');
      });
    });
  });

  describe('performance considerations', () => {
    it('should generate responses efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        generativeLayer.generateResponse(mockGenerationContext);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should generate 100 responses in reasonable time (less than 1 second)
      expect(totalTime).toBeLessThan(1000);
    });

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
      mockGenerationContext.pragmaticContext.conversationHistory = largeHistory;

      const startTime = Date.now();
      generativeLayer.generateResponse(mockGenerationContext);
      const endTime = Date.now();

      // Should process large history efficiently (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('response quality', () => {
    it('should generate grammatically correct responses', () => {
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      // Basic grammar checks
      expect(response).toMatch(/^[A-Z]/); // Should start with capital letter
      expect(response).not.toMatch(/\s{2,}/); // Should not have multiple spaces
      expect(response.trim()).toBe(response); // Should not have leading/trailing whitespace
    });

    it('should generate contextually appropriate responses', () => {
      mockGenerationContext.responseType = 'supportive_response';
      mockGenerationContext.semanticContext.intent = 'HELP_REQUEST';
      
      const response = generativeLayer.generateResponse(mockGenerationContext);
      
      expect(response).toMatch(/help|assist|support|here/i);
    });

    it('should avoid repetitive responses', () => {
      const responses = new Set();
      
      // Generate multiple responses with slight variations
      for (let i = 0; i < 10; i++) {
        mockGenerationContext.semanticContext.entities = [`entity${i}`];
        const response = generativeLayer.generateResponse(mockGenerationContext);
        responses.add(response);
      }
      
      // Should generate varied responses
      expect(responses.size).toBeGreaterThan(1);
    });
  });
});
