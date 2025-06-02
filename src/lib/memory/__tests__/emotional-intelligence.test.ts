// =============================================================================
// EMOTIONAL INTELLIGENCE LAYER TESTS
// =============================================================================

import { 
  EmotionalIntelligenceLayer,
  EmotionalState,
  EmotionalContext,
  EmotionalResponse,
  SocialAwarenessInsights
} from '../emotional-intelligence';

describe('EmotionalIntelligenceLayer', () => {
  let emotionalIntelligence: EmotionalIntelligenceLayer;

  beforeEach(() => {
    emotionalIntelligence = new EmotionalIntelligenceLayer();
  });

  describe('constructor', () => {
    it('should create a new EmotionalIntelligenceLayer instance', () => {
      expect(emotionalIntelligence).toBeInstanceOf(EmotionalIntelligenceLayer);
    });

    it('should initialize with emotion lexicon', () => {
      // Test that emotion detection works (indicates lexicon is initialized)
      const context = emotionalIntelligence.analyzeEmotionalContent('I am happy');
      expect(context.userEmotion.primary).toBe('joy');
    });
  });

  describe('analyzeEmotionalContent', () => {
    it('should detect positive emotions', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('I am so excited and happy!');
      
      expect(context.userEmotion.primary).toMatch(/joy|excitement/);
      expect(context.userEmotion.valence).toBeGreaterThan(0);
      expect(context.conversationMood).toMatch(/positive/);
    });

    it('should detect negative emotions', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('I am very sad and disappointed');
      
      expect(context.userEmotion.primary).toBe('sadness');
      expect(context.userEmotion.valence).toBeLessThan(0);
      expect(context.supportNeeded).toMatch(/medium|high/);
    });

    it('should detect neutral emotions', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('The weather is okay today');
      
      expect(context.userEmotion.primary).toBe('neutral');
      expect(context.userEmotion.valence).toBeCloseTo(0, 1);
      expect(context.conversationMood).toBe('neutral');
    });

    it('should detect social cues', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('Please help me, I need urgent assistance');
      
      expect(context.socialCues).toContain('polite');
      expect(context.socialCues).toContain('urgent');
      expect(context.socialCues).toContain('support_seeking');
    });

    it('should calculate appropriate empathy level', () => {
      const sadContext = emotionalIntelligence.analyzeEmotionalContent('I feel so lonely and lost');
      const happyContext = emotionalIntelligence.analyzeEmotionalContent('I am thrilled about this news!');
      
      expect(sadContext.empathyLevel).toBeGreaterThan(happyContext.empathyLevel);
      expect(sadContext.empathyLevel).toBeGreaterThan(0.5);
    });

    it('should assess support needed correctly', () => {
      const highSupportText = 'I am devastated and need help urgently';
      const lowSupportText = 'I am doing great today';
      
      const highContext = emotionalIntelligence.analyzeEmotionalContent(highSupportText);
      const lowContext = emotionalIntelligence.analyzeEmotionalContent(lowSupportText);
      
      expect(highContext.supportNeeded).toBe('high');
      expect(lowContext.supportNeeded).toBe('low');
    });

    it('should handle empty input gracefully', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('');
      
      expect(context.userEmotion.primary).toBe('neutral');
      expect(context.socialCues).toEqual([]);
      expect(context.conversationMood).toBe('neutral');
    });

    it('should detect contextual emotions from punctuation', () => {
      const excitedContext = emotionalIntelligence.analyzeEmotionalContent('This is amazing!!!');
      const questionContext = emotionalIntelligence.analyzeEmotionalContent('How does this work?');
      
      expect(excitedContext.userEmotion.intensity).toBeGreaterThan(0.5);
      expect(questionContext.userEmotion.primary).toMatch(/curiosity|confusion/);
    });
  });

  describe('generateEmotionalResponse', () => {
    it('should generate appropriate response for sad emotions', () => {
      const sadContext: EmotionalContext = {
        userEmotion: {
          primary: 'sadness',
          secondary: [],
          valence: -0.7,
          arousal: 0.4,
          dominance: 0.3,
          intensity: 0.6,
          confidence: 0.8
        },
        conversationMood: 'negative',
        emotionalHistory: [],
        socialCues: ['support_seeking'],
        empathyLevel: 0.8,
        supportNeeded: 'high'
      };

      const response = emotionalIntelligence.generateEmotionalResponse(sadContext, '');
      
      expect(response.empathyStrategy).toMatch(/validation|reassurance|listening/);
      expect(response.supportLevel).toMatch(/validation|encouragement/);
      expect(response.tonalAdjustments.warmth).toBeGreaterThan(0.5);
      expect(response.tonalAdjustments.patience).toBeGreaterThan(0.5);
    });

    it('should generate appropriate response for happy emotions', () => {
      const happyContext: EmotionalContext = {
        userEmotion: {
          primary: 'joy',
          secondary: [],
          valence: 0.8,
          arousal: 0.6,
          dominance: 0.6,
          intensity: 0.7,
          confidence: 0.8
        },
        conversationMood: 'positive',
        emotionalHistory: [],
        socialCues: ['sharing'],
        empathyLevel: 0.4,
        supportNeeded: 'low'
      };

      const response = emotionalIntelligence.generateEmotionalResponse(happyContext, '');
      
      expect(response.empathyStrategy).toMatch(/positive_reinforcement|interested_listening/);
      expect(response.tonalAdjustments.enthusiasm).toBeGreaterThan(0.5);
      expect(response.responseEmotion.valence).toBeGreaterThan(0);
    });

    it('should adjust tonal qualities based on emotional context', () => {
      const distressedContext: EmotionalContext = {
        userEmotion: {
          primary: 'fear',
          secondary: [],
          valence: -0.6,
          arousal: 0.8,
          dominance: 0.2,
          intensity: 0.8,
          confidence: 0.7
        },
        conversationMood: 'distressed',
        emotionalHistory: [],
        socialCues: ['urgent'],
        empathyLevel: 0.9,
        supportNeeded: 'high'
      };

      const response = emotionalIntelligence.generateEmotionalResponse(distressedContext, '');
      
      expect(response.tonalAdjustments.warmth).toBeGreaterThan(0.7);
      expect(response.tonalAdjustments.patience).toBeGreaterThan(0.8);
      expect(response.tonalAdjustments.formality).toBeLessThan(0.5);
    });

    it('should provide relevant suggested phrases', () => {
      const context: EmotionalContext = {
        userEmotion: {
          primary: 'confusion',
          secondary: [],
          valence: -0.2,
          arousal: 0.5,
          dominance: 0.3,
          intensity: 0.5,
          confidence: 0.7
        },
        conversationMood: 'exploratory',
        emotionalHistory: [],
        socialCues: ['uncertain'],
        empathyLevel: 0.6,
        supportNeeded: 'medium'
      };

      const response = emotionalIntelligence.generateEmotionalResponse(context, '');
      
      expect(response.suggestedPhrases).toHaveLength(5);
      expect(response.suggestedPhrases.some(phrase => 
        phrase.toLowerCase().includes('understand') || 
        phrase.toLowerCase().includes('help') ||
        phrase.toLowerCase().includes('clarify')
      )).toBe(true);
    });
  });

  describe('provideSocialAwarenessInsights', () => {
    it('should analyze relationship dynamics', () => {
      const context: EmotionalContext = {
        userEmotion: {
          primary: 'neutral',
          secondary: [],
          valence: 0,
          arousal: 0.5,
          dominance: 0.5,
          intensity: 0.5,
          confidence: 0.7
        },
        conversationMood: 'neutral',
        emotionalHistory: [],
        socialCues: ['polite'],
        empathyLevel: 0.5,
        supportNeeded: 'low'
      };

      const conversationHistory = [
        { speaker: 'human', content: 'Hello' },
        { speaker: 'bot', content: 'Hi there!' },
        { speaker: 'human', content: 'How are you?' }
      ];

      const insights = emotionalIntelligence.provideSocialAwarenessInsights(context, conversationHistory);
      
      expect(insights.relationshipDynamics).toMatch(/early_interaction|user_driven|collaborative/);
      expect(insights.communicationStyle).toMatch(/formal_polite|casual_friendly/);
      expect(insights.culturalConsiderations).toContain('inclusive_language');
      expect(insights.appropriateResponses).toHaveLength(3);
      expect(insights.boundaryRespect).toContain('maintain_professional_distance');
    });

    it('should identify communication styles', () => {
      const formalContext: EmotionalContext = {
        userEmotion: {
          primary: 'neutral',
          secondary: [],
          valence: 0,
          arousal: 0.3,
          dominance: 0.7,
          intensity: 0.4,
          confidence: 0.8
        },
        conversationMood: 'formal',
        emotionalHistory: [],
        socialCues: ['polite', 'formal'],
        empathyLevel: 0.4,
        supportNeeded: 'low'
      };

      const insights = emotionalIntelligence.provideSocialAwarenessInsights(formalContext, []);
      
      expect(insights.communicationStyle).toBe('formal_polite');
      expect(insights.culturalConsiderations).toContain('formal_courtesy');
    });

    it('should respect boundaries', () => {
      const boundaryContext: EmotionalContext = {
        userEmotion: {
          primary: 'neutral',
          secondary: [],
          valence: 0,
          arousal: 0.4,
          dominance: 0.3,
          intensity: 0.5,
          confidence: 0.7
        },
        conversationMood: 'neutral',
        emotionalHistory: [],
        socialCues: ['boundary_setting', 'private'],
        empathyLevel: 0.6,
        supportNeeded: 'medium'
      };

      const insights = emotionalIntelligence.provideSocialAwarenessInsights(boundaryContext, []);
      
      expect(insights.boundaryRespect).toContain('respect_stated_boundaries');
      expect(insights.boundaryRespect).toContain('avoid_personal_probing');
      expect(insights.culturalConsiderations).toContain('privacy_respect');
    });
  });

  describe('emotion detection patterns', () => {
    it('should detect anger patterns', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('I am so angry and frustrated with this situation!');
      
      expect(context.userEmotion.primary).toBe('anger');
      expect(context.userEmotion.valence).toBeLessThan(0);
      expect(context.userEmotion.arousal).toBeGreaterThan(0.5);
    });

    it('should detect fear patterns', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('I am scared and worried about what might happen');
      
      expect(context.userEmotion.primary).toBe('fear');
      expect(context.userEmotion.dominance).toBeLessThan(0.5);
      expect(context.supportNeeded).toMatch(/medium|high/);
    });

    it('should detect gratitude patterns', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('I am so grateful and thankful for your help');
      
      expect(context.userEmotion.primary).toBe('gratitude');
      expect(context.userEmotion.valence).toBeGreaterThan(0);
      expect(context.conversationMood).toMatch(/positive/);
    });

    it('should detect curiosity patterns', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('I am curious about how this works and why it happens');
      
      expect(context.userEmotion.primary).toBe('curiosity');
      expect(context.conversationMood).toMatch(/exploratory/);
    });

    it('should handle mixed emotions', () => {
      const context = emotionalIntelligence.analyzeEmotionalContent('I am excited but also nervous about this opportunity');
      
      expect(context.userEmotion.confidence).toBeGreaterThan(0.5);
      expect(context.userEmotion.intensity).toBeGreaterThan(0.4);
    });
  });

  describe('intensity calculation', () => {
    it('should increase intensity with intensifiers', () => {
      const normalContext = emotionalIntelligence.analyzeEmotionalContent('I am happy');
      const intensifiedContext = emotionalIntelligence.analyzeEmotionalContent('I am extremely happy');
      
      expect(intensifiedContext.userEmotion.intensity).toBeGreaterThan(normalContext.userEmotion.intensity);
    });

    it('should decrease intensity with diminishers', () => {
      const normalContext = emotionalIntelligence.analyzeEmotionalContent('I am sad');
      const diminishedContext = emotionalIntelligence.analyzeEmotionalContent('I am slightly sad');
      
      expect(diminishedContext.userEmotion.intensity).toBeLessThan(normalContext.userEmotion.intensity);
    });

    it('should increase intensity with exclamation marks', () => {
      const normalContext = emotionalIntelligence.analyzeEmotionalContent('I am happy');
      const excitedContext = emotionalIntelligence.analyzeEmotionalContent('I am happy!!!');
      
      expect(excitedContext.userEmotion.intensity).toBeGreaterThan(normalContext.userEmotion.intensity);
    });

    it('should increase intensity with capital letters', () => {
      const normalContext = emotionalIntelligence.analyzeEmotionalContent('I am happy');
      const capsContext = emotionalIntelligence.analyzeEmotionalContent('I AM HAPPY');
      
      expect(capsContext.userEmotion.intensity).toBeGreaterThan(normalContext.userEmotion.intensity);
    });
  });

  describe('empathy strategies', () => {
    it('should select emotional validation for vulnerable emotions', () => {
      const vulnerableContext: EmotionalContext = {
        userEmotion: {
          primary: 'sadness',
          secondary: [],
          valence: -0.8,
          arousal: 0.3,
          dominance: 0.2,
          intensity: 0.7,
          confidence: 0.9
        },
        conversationMood: 'seeking_support',
        emotionalHistory: [],
        socialCues: ['support_seeking'],
        empathyLevel: 0.9,
        supportNeeded: 'high'
      };

      const response = emotionalIntelligence.generateEmotionalResponse(vulnerableContext, '');
      
      expect(response.empathyStrategy).toBe('emotional_validation');
    });

    it('should select reassurance for fear-based emotions', () => {
      const fearContext: EmotionalContext = {
        userEmotion: {
          primary: 'fear',
          secondary: [],
          valence: -0.6,
          arousal: 0.7,
          dominance: 0.2,
          intensity: 0.8,
          confidence: 0.8
        },
        conversationMood: 'distressed',
        emotionalHistory: [],
        socialCues: ['urgent'],
        empathyLevel: 0.8,
        supportNeeded: 'high'
      };

      const response = emotionalIntelligence.generateEmotionalResponse(fearContext, '');
      
      expect(response.empathyStrategy).toBe('reassurance_and_safety');
    });

    it('should select positive reinforcement for positive emotions', () => {
      const positiveContext: EmotionalContext = {
        userEmotion: {
          primary: 'joy',
          secondary: [],
          valence: 0.8,
          arousal: 0.6,
          dominance: 0.7,
          intensity: 0.7,
          confidence: 0.8
        },
        conversationMood: 'positive',
        emotionalHistory: [],
        socialCues: ['sharing'],
        empathyLevel: 0.3,
        supportNeeded: 'low'
      };

      const response = emotionalIntelligence.generateEmotionalResponse(positiveContext, '');
      
      expect(response.empathyStrategy).toBe('positive_reinforcement');
    });
  });

  describe('edge cases', () => {
    it('should handle very long text input', () => {
      const longText = 'I am happy '.repeat(100);
      const context = emotionalIntelligence.analyzeEmotionalContent(longText);
      
      expect(context.userEmotion.primary).toBe('joy');
      expect(context.userEmotion.confidence).toBeGreaterThan(0.5);
    });

    it('should handle text with special characters', () => {
      const specialText = 'I am happy! @#$%^&*()_+ 😊';
      const context = emotionalIntelligence.analyzeEmotionalContent(specialText);
      
      expect(context.userEmotion.primary).toBe('joy');
    });

    it('should handle mixed language patterns', () => {
      const mixedText = 'I am very happy but also kind of worried';
      const context = emotionalIntelligence.analyzeEmotionalContent(mixedText);
      
      expect(context.userEmotion.confidence).toBeGreaterThan(0.5);
      expect(context.userEmotion.intensity).toBeGreaterThan(0.3);
    });

    it('should handle repetitive patterns', () => {
      const repetitiveText = 'no no no I do not want this';
      const context = emotionalIntelligence.analyzeEmotionalContent(repetitiveText);
      
      expect(context.userEmotion.intensity).toBeGreaterThan(0.4);
    });
  });
});
