// =============================================================================
// EMOTIONAL INTELLIGENCE LAYER - Emotion Detection, Empathy, Social Awareness
// =============================================================================

import { globalConfig } from '../system/config';

export interface EmotionalState {
  primary: string;
  secondary: string[];
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
  dominance: number; // 0 (submissive) to 1 (dominant)
  intensity: number; // 0 to 1
  confidence: number; // 0 to 1
}

export interface EmotionalContext {
  userEmotion: EmotionalState;
  conversationMood: string;
  emotionalHistory: EmotionalState[];
  socialCues: string[];
  empathyLevel: number;
  supportNeeded: 'low' | 'medium' | 'high';
}

export interface EmotionalResponse {
  responseEmotion: EmotionalState;
  empathyStrategy: string;
  supportLevel: 'validation' | 'encouragement' | 'problem_solving' | 'distraction';
  tonalAdjustments: {
    warmth: number;
    formality: number;
    enthusiasm: number;
    patience: number;
  };
  suggestedPhrases: string[];
}

export interface SocialAwarenessInsights {
  relationshipDynamics: string;
  communicationStyle: string;
  culturalConsiderations: string[];
  appropriateResponses: string[];
  boundaryRespect: string[];
}

export class EmotionalIntelligenceLayer {
  private emotionLexicon: Map<string, EmotionalState> = new Map();
  private emotionalPatterns: Map<string, number> = new Map();
  private empathyStrategies: Map<string, string[]> = new Map();
  private socialCues: Map<string, string[]> = new Map();
  private conversationMoodHistory: string[] = [];

  constructor() {
    this.initializeEmotionLexicon();
    this.initializeEmpathyStrategies();
    this.initializeSocialCues();
  }

  /**
   * Analyze emotional content of text input
   */
  analyzeEmotionalContent(text: string, context?: any): EmotionalContext {
    console.log('❤️ Analyzing emotional content:', text);

    const userEmotion = this.detectEmotion(text);
    const socialCues = this.detectSocialCues(text);
    const conversationMood = this.assessConversationMood(text, context);
    const empathyLevel = this.calculateEmpathyLevel(userEmotion, context);
    const supportNeeded = this.assessSupportNeeded(userEmotion, socialCues);

    // Update emotional history
    this.updateEmotionalHistory(userEmotion);
    this.updateConversationMood(conversationMood);

    const emotionalContext: EmotionalContext = {
      userEmotion,
      conversationMood,
      emotionalHistory: this.getRecentEmotionalHistory(),
      socialCues,
      empathyLevel,
      supportNeeded
    };

    console.log('❤️ Emotional analysis complete:', {
      emotion: userEmotion.primary,
      mood: conversationMood,
      empathy: empathyLevel,
      support: supportNeeded
    });

    return emotionalContext;
  }

  /**
   * Generate emotionally intelligent response
   */
  generateEmotionalResponse(emotionalContext: EmotionalContext, responseContent: string): EmotionalResponse {
    console.log('💝 Generating emotional response...');

    const responseEmotion = this.determineResponseEmotion(emotionalContext);
    const empathyStrategy = this.selectEmpathyStrategy(emotionalContext);
    const supportLevel = this.determineSupportLevel(emotionalContext);
    const tonalAdjustments = this.calculateTonalAdjustments(emotionalContext);
    const suggestedPhrases = this.generateSuggestedPhrases(emotionalContext, empathyStrategy);

    const emotionalResponse: EmotionalResponse = {
      responseEmotion,
      empathyStrategy,
      supportLevel,
      tonalAdjustments,
      suggestedPhrases
    };

    console.log('💝 Emotional response generated:', {
      strategy: empathyStrategy,
      support: supportLevel,
      warmth: tonalAdjustments.warmth
    });

    return emotionalResponse;
  }

  /**
   * Provide social awareness insights
   */
  provideSocialAwarenessInsights(emotionalContext: EmotionalContext, conversationHistory: any[]): SocialAwarenessInsights {
    const relationshipDynamics = this.analyzeRelationshipDynamics(conversationHistory);
    const communicationStyle = this.identifyCommunicationStyle(emotionalContext, conversationHistory);
    const culturalConsiderations = this.assessCulturalConsiderations(emotionalContext);
    const appropriateResponses = this.suggestAppropriateResponses(emotionalContext);
    const boundaryRespect = this.assessBoundaryRespect(emotionalContext, conversationHistory);

    return {
      relationshipDynamics,
      communicationStyle,
      culturalConsiderations,
      appropriateResponses,
      boundaryRespect
    };
  }

  /**
   * Detect emotion from text
   */
  private detectEmotion(text: string): EmotionalState {
    const lowerText = text.toLowerCase();
    let detectedEmotions: Array<{ emotion: string; confidence: number }> = [];

    // Check emotion lexicon
    for (const [emotionWord, emotionState] of this.emotionLexicon) {
      if (lowerText.includes(emotionWord)) {
        detectedEmotions.push({
          emotion: emotionState.primary,
          confidence: 0.8
        });
      }
    }

    // Pattern-based emotion detection
    const emotionPatterns = [
      { pattern: /(!+|excited|amazing|wonderful|fantastic)/i, emotion: 'joy', confidence: 0.7 },
      { pattern: /(sad|depressed|down|upset|disappointed)/i, emotion: 'sadness', confidence: 0.8 },
      { pattern: /(angry|mad|furious|annoyed|frustrated)/i, emotion: 'anger', confidence: 0.8 },
      { pattern: /(scared|afraid|worried|anxious|nervous)/i, emotion: 'fear', confidence: 0.7 },
      { pattern: /(surprised|shocked|amazed|wow)/i, emotion: 'surprise', confidence: 0.6 },
      { pattern: /(disgusted|gross|yuck|eww)/i, emotion: 'disgust', confidence: 0.7 },
      { pattern: /(love|adore|cherish|treasure)/i, emotion: 'love', confidence: 0.8 },
      { pattern: /(hate|despise|loathe|detest)/i, emotion: 'hate', confidence: 0.8 },
      { pattern: /(curious|interested|intrigued|wondering)/i, emotion: 'curiosity', confidence: 0.6 },
      { pattern: /(confused|puzzled|bewildered|lost)/i, emotion: 'confusion', confidence: 0.7 },
      { pattern: /(grateful|thankful|appreciative)/i, emotion: 'gratitude', confidence: 0.8 },
      { pattern: /(proud|accomplished|achieved)/i, emotion: 'pride', confidence: 0.7 },
      { pattern: /(embarrassed|ashamed|humiliated)/i, emotion: 'shame', confidence: 0.7 },
      { pattern: /(lonely|isolated|alone)/i, emotion: 'loneliness', confidence: 0.8 },
      { pattern: /(hopeful|optimistic|positive)/i, emotion: 'hope', confidence: 0.7 },
      { pattern: /(hopeless|pessimistic|despair)/i, emotion: 'despair', confidence: 0.8 },
      { pattern: /(devastated|destroyed|crushed)/i, emotion: 'devastated', confidence: 0.9 }
    ];

    emotionPatterns.forEach(({ pattern, emotion, confidence }) => {
      if (pattern.test(text)) {
        detectedEmotions.push({ emotion, confidence });
      }
    });

    // Contextual emotion detection
    const contextualEmotions = this.detectContextualEmotions(text);
    detectedEmotions.push(...contextualEmotions);

    // Default to neutral if no emotions detected
    if (detectedEmotions.length === 0) {
      return this.createEmotionalState('neutral', 0.0, 0.3, 0.5, 0.3, 0.5);
    }

    // Find strongest emotion
    const strongestEmotion = detectedEmotions.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );

    // Get base emotional state or create one with appropriate valence
    let baseState = this.emotionLexicon.get(strongestEmotion.emotion);
    
    if (!baseState) {
      // Create emotional state with appropriate valence based on emotion type
      const valence = this.getEmotionValence(strongestEmotion.emotion);
      const arousal = this.getEmotionArousal(strongestEmotion.emotion);
      const dominance = this.getEmotionDominance(strongestEmotion.emotion);
      
      baseState = this.createEmotionalState(
        strongestEmotion.emotion, 
        valence, 
        arousal, 
        dominance, 
        0.5, 
        strongestEmotion.confidence
      );
    }

    // Adjust intensity based on text features
    const intensity = this.calculateEmotionalIntensity(text, baseState);

    return {
      ...baseState,
      intensity,
      confidence: strongestEmotion.confidence
    };
  }

  /**
   * Detect contextual emotions based on sentence structure and context
   */
  private detectContextualEmotions(text: string): Array<{ emotion: string; confidence: number }> {
    const contextualEmotions: Array<{ emotion: string; confidence: number }> = [];

    // Question patterns often indicate curiosity or confusion
    if (text.includes('?')) {
      if (text.toLowerCase().includes('how') || text.toLowerCase().includes('why')) {
        contextualEmotions.push({ emotion: 'curiosity', confidence: 0.6 });
      } else if (text.toLowerCase().includes('what') && text.toLowerCase().includes('wrong')) {
        contextualEmotions.push({ emotion: 'concern', confidence: 0.7 });
      }
    }

    // Exclamation patterns often indicate excitement or strong emotion
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 0) {
      contextualEmotions.push({ emotion: 'excitement', confidence: Math.min(0.8, 0.3 + exclamationCount * 0.2) });
    }

    // Capitalization patterns
    const capsWords = text.match(/[A-Z]{2,}/g);
    if (capsWords && capsWords.length > 0) {
      contextualEmotions.push({ emotion: 'emphasis', confidence: 0.6 });
    }

    // Repetition patterns (e.g., "no no no", "yes yes yes")
    const repetitionPattern = /\b(\w+)\s+\1\b/gi;
    if (repetitionPattern.test(text)) {
      contextualEmotions.push({ emotion: 'emphasis', confidence: 0.5 });
    }

    return contextualEmotions;
  }

  /**
   * Calculate emotional intensity based on text features
   */
  private calculateEmotionalIntensity(text: string, baseState: EmotionalState): number {
    let intensity = baseState.intensity;

    // Intensifiers
    const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely', 'utterly'];
    const intensifierCount = intensifiers.filter(word => text.toLowerCase().includes(word)).length;
    intensity += intensifierCount * 0.2;

    // Diminishers
    const diminishers = ['slightly', 'somewhat', 'a bit', 'kind of', 'sort of', 'maybe', 'perhaps'];
    const diminisherCount = diminishers.filter(word => text.toLowerCase().includes(word)).length;
    intensity -= diminisherCount * 0.15;

    // Punctuation intensity
    const exclamationCount = (text.match(/!/g) || []).length;
    intensity += exclamationCount * 0.1;

    // Caps intensity
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.3) {
      intensity += 0.2;
    }

    return Math.max(0, Math.min(1, intensity));
  }

  /**
   * Detect social cues in text
   */
  private detectSocialCues(text: string): string[] {
    const detectedCues: string[] = [];
    const lowerText = text.toLowerCase();

    // Politeness cues
    if (lowerText.includes('please') || lowerText.includes('thank you') || lowerText.includes('thanks')) {
      detectedCues.push('polite');
    }

    // Urgency cues
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('quickly')) {
      detectedCues.push('urgent');
    }

    // Uncertainty cues
    if (lowerText.includes('maybe') || lowerText.includes('perhaps') || lowerText.includes('not sure')) {
      detectedCues.push('uncertain');
    }

    // Confidence cues
    if (lowerText.includes('definitely') || lowerText.includes('absolutely') || lowerText.includes('certain')) {
      detectedCues.push('confident');
    }

    // Support-seeking cues
    if (lowerText.includes('help') || lowerText.includes('advice') || lowerText.includes('support')) {
      detectedCues.push('support_seeking');
    }

    // Sharing cues
    if (lowerText.includes('tell you') || lowerText.includes('share') || lowerText.includes('story')) {
      detectedCues.push('sharing');
    }

    // Boundary cues
    if (lowerText.includes('private') || lowerText.includes('personal') || lowerText.includes('don\'t want to')) {
      detectedCues.push('boundary_setting');
    }

    return detectedCues;
  }

  /**
   * Assess conversation mood
   */
  private assessConversationMood(text: string, context?: any): string {
    const emotionalState = this.detectEmotion(text);
    const socialCues = this.detectSocialCues(text);

    // Determine mood based on emotion and social cues
    if (emotionalState.valence > 0.3) {
      if (socialCues.includes('sharing')) return 'open_sharing';
      if (socialCues.includes('confident')) return 'positive_confident';
      return 'positive';
    } else if (emotionalState.valence < -0.3) {
      if (socialCues.includes('support_seeking')) return 'seeking_support';
      if (socialCues.includes('urgent')) return 'distressed';
      return 'negative';
    } else {
      if (emotionalState.primary === 'curiosity') return 'exploratory';
      if (socialCues.includes('uncertain')) return 'exploratory';
      if (socialCues.includes('polite')) return 'formal';
      return 'neutral';
    }
  }

  /**
   * Calculate empathy level needed
   */
  private calculateEmpathyLevel(userEmotion: EmotionalState, context?: any): number {
    let empathyLevel = 0.5; // Base empathy level

    // Increase empathy for negative emotions
    if (userEmotion.valence < 0) {
      empathyLevel += Math.abs(userEmotion.valence) * 0.4;
    }

    // Increase empathy for high arousal emotions
    if (userEmotion.arousal > 0.7) {
      empathyLevel += 0.2;
    }

    // Increase empathy for vulnerable emotions
    const vulnerableEmotions = ['sadness', 'fear', 'shame', 'loneliness', 'despair'];
    if (vulnerableEmotions.includes(userEmotion.primary)) {
      empathyLevel += 0.3;
    }

    // Adjust based on conversation history
    if (context?.emotionalHistory) {
      const recentNegativeEmotions = context.emotionalHistory
        .slice(-3)
        .filter((emotion: EmotionalState) => emotion.valence < 0);
      
      if (recentNegativeEmotions.length >= 2) {
        empathyLevel += 0.2; // Sustained negative emotions need more empathy
      }
    }

    return Math.max(0, Math.min(1, empathyLevel));
  }

  /**
   * Assess support needed
   */
  private assessSupportNeeded(userEmotion: EmotionalState, socialCues: string[]): 'low' | 'medium' | 'high' {
    let supportScore = 0;

    // Emotional factors
    if (userEmotion.valence < -0.6) supportScore += 3;
    else if (userEmotion.valence < -0.3) supportScore += 2;
    else if (userEmotion.valence < 0) supportScore += 1;

    if (userEmotion.intensity > 0.7) supportScore += 1;

    // Social cue factors
    if (socialCues.includes('support_seeking')) supportScore += 2;
    if (socialCues.includes('urgent')) supportScore += 2;
    if (socialCues.includes('uncertain')) supportScore += 1;

    // Vulnerable emotion factors
    const vulnerableEmotions = ['sadness', 'fear', 'shame', 'loneliness', 'despair'];
    if (vulnerableEmotions.includes(userEmotion.primary)) supportScore += 2;

    // Specific high-intensity negative emotions
    const devastatingEmotions = ['devastated', 'despair', 'hopeless'];
    if (devastatingEmotions.some(emotion => userEmotion.primary.includes(emotion))) {
      supportScore += 3;
    }

    if (supportScore >= 5) return 'high';
    if (supportScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Determine appropriate response emotion
   */
  private determineResponseEmotion(emotionalContext: EmotionalContext): EmotionalState {
    const userEmotion = emotionalContext.userEmotion;
    
    // Mirror positive emotions with slightly lower intensity
    if (userEmotion.valence > 0.3) {
      return this.createEmotionalState(
        'warmth',
        userEmotion.valence * 0.8,
        userEmotion.arousal * 0.7,
        0.6, // Moderate dominance
        userEmotion.intensity * 0.8,
        0.8
      );
    }

    // Respond to negative emotions with supportive emotions
    if (userEmotion.valence < -0.3) {
      const supportiveEmotions = {
        'sadness': 'compassion',
        'fear': 'reassurance',
        'anger': 'understanding',
        'shame': 'acceptance',
        'loneliness': 'connection',
        'despair': 'hope'
      };

      const responseEmotion = supportiveEmotions[userEmotion.primary as keyof typeof supportiveEmotions] || 'empathy';
      
      return this.createEmotionalState(
        responseEmotion,
        0.3, // Slightly positive
        0.4, // Calm
        0.5, // Balanced dominance
        0.6, // Moderate intensity
        0.8
      );
    }

    // Neutral response for neutral emotions
    return this.createEmotionalState('calm', 0.1, 0.3, 0.5, 0.4, 0.7);
  }

  /**
   * Select empathy strategy
   */
  private selectEmpathyStrategy(emotionalContext: EmotionalContext): string {
    const userEmotion = emotionalContext.userEmotion;
    const supportNeeded = emotionalContext.supportNeeded;

    // High support situations
    if (supportNeeded === 'high') {
      if (userEmotion.primary === 'sadness') return 'emotional_validation';
      if (userEmotion.primary === 'fear') return 'reassurance_and_safety';
      if (userEmotion.primary === 'anger') return 'acknowledgment_and_understanding';
      return 'active_listening';
    }

    // Medium support situations
    if (supportNeeded === 'medium') {
      if (userEmotion.valence < 0) return 'gentle_encouragement';
      if (emotionalContext.socialCues.includes('uncertain')) return 'clarification_and_guidance';
      return 'supportive_engagement';
    }

    // Low support situations
    if (userEmotion.valence > 0.5) return 'positive_reinforcement';
    if (emotionalContext.socialCues.includes('sharing')) return 'interested_listening';
    return 'neutral_engagement';
  }

  /**
   * Determine support level
   */
  private determineSupportLevel(emotionalContext: EmotionalContext): 'validation' | 'encouragement' | 'problem_solving' | 'distraction' {
    const userEmotion = emotionalContext.userEmotion;
    const socialCues = emotionalContext.socialCues;

    // Validation for vulnerable emotions
    if (['sadness', 'fear', 'shame', 'loneliness'].includes(userEmotion.primary)) {
      return 'validation';
    }

    // Problem solving for frustration or confusion
    if (['anger', 'frustration', 'confusion'].includes(userEmotion.primary) && socialCues.includes('support_seeking')) {
      return 'problem_solving';
    }

    // Encouragement for low confidence or uncertainty
    if (socialCues.includes('uncertain') || userEmotion.dominance < 0.3) {
      return 'encouragement';
    }

    // Distraction for overwhelming emotions
    if (userEmotion.intensity > 0.8 && userEmotion.arousal > 0.8) {
      return 'distraction';
    }

    return 'validation'; // Default to validation
  }

  /**
   * Calculate tonal adjustments
   */
  private calculateTonalAdjustments(emotionalContext: EmotionalContext): {
    warmth: number;
    formality: number;
    enthusiasm: number;
    patience: number;
  } {
    const userEmotion = emotionalContext.userEmotion;
    const empathyLevel = emotionalContext.empathyLevel;

    return {
      warmth: Math.max(0.3, empathyLevel), // Higher empathy = more warmth
      formality: userEmotion.valence < -0.5 ? 0.3 : 0.5, // Less formal for distressed users
      enthusiasm: Math.max(0.2, userEmotion.valence * 0.8), // Match user's positivity
      patience: userEmotion.arousal > 0.7 ? 0.9 : 0.6 // More patience for high arousal
    };
  }

  /**
   * Generate suggested phrases for emotional response
   */
  private generateSuggestedPhrases(emotionalContext: EmotionalContext, empathyStrategy: string): string[] {
    const phrases: string[] = [];
    const userEmotion = emotionalContext.userEmotion;

    // Get strategy-specific phrases
    const strategyPhrases = this.empathyStrategies.get(empathyStrategy) || [];
    phrases.push(...strategyPhrases);

    // Add emotion-specific phrases
    const emotionPhrases = this.getEmotionSpecificPhrases(userEmotion.primary);
    phrases.push(...emotionPhrases);

    // Add general supportive phrases if needed
    if (phrases.length < 3) {
      phrases.push(
        "I understand how you're feeling.",
        "Thank you for sharing that with me.",
        "I'm here to help."
      );
    }

    return phrases.slice(0, 5); // Return top 5 phrases
  }

  /**
   * Get emotion-specific phrases
   */
  private getEmotionSpecificPhrases(emotion: string): string[] {
    const emotionPhrases: Record<string, string[]> = {
      'sadness': [
        "I can hear that you're going through a difficult time.",
        "It's completely understandable to feel this way.",
        "Your feelings are valid."
      ],
      'fear': [
        "It's natural to feel worried about this.",
        "You're not alone in feeling this way.",
        "Let's work through this together."
      ],
      'anger': [
        "I can understand why that would be frustrating.",
        "Your feelings about this are completely valid.",
        "It sounds like this situation is really challenging."
      ],
      'joy': [
        "That's wonderful to hear!",
        "I'm so happy for you!",
        "What an exciting development!"
      ],
      'confusion': [
        "That does sound confusing.",
        "Let me help clarify that for you.",
        "It's okay to feel uncertain about this."
      ]
    };

    return emotionPhrases[emotion] || [];
  }

  /**
   * Analyze relationship dynamics
   */
  private analyzeRelationshipDynamics(conversationHistory: any[]): string {
    if (conversationHistory.length < 3) {
      return 'early_interaction';
    }

    // Analyze patterns in conversation
    const userInitiatedCount = conversationHistory.filter(turn => turn.speaker === 'human').length;
    const totalTurns = conversationHistory.length;
    const userInitiationRatio = userInitiatedCount / totalTurns;

    if (userInitiationRatio > 0.7) {
      return 'user_driven';
    } else if (userInitiationRatio < 0.3) {
      return 'assistant_guided';
    } else {
      return 'collaborative';
    }
  }

  /**
   * Identify communication style
   */
  private identifyCommunicationStyle(emotionalContext: EmotionalContext, conversationHistory: any[]): string {
    const socialCues = emotionalContext.socialCues;
    
    if (socialCues.includes('polite') && socialCues.includes('formal')) {
      return 'formal_polite';
    } else if (socialCues.includes('sharing') && socialCues.includes('open')) {
      return 'open_expressive';
    } else if (socialCues.includes('uncertain') && socialCues.includes('support_seeking')) {
      return 'hesitant_seeking';
    } else if (socialCues.includes('confident') && socialCues.includes('direct')) {
      return 'direct_confident';
    } else {
      return 'casual_friendly';
    }
  }

  /**
   * Assess cultural considerations
   */
  private assessCulturalConsiderations(emotionalContext: EmotionalContext): string[] {
    const considerations: string[] = [];

    // Based on communication patterns and emotional expression
    if (emotionalContext.userEmotion.dominance < 0.3) {
      considerations.push('respect_for_hierarchy');
    }

    if (emotionalContext.socialCues.includes('polite')) {
      considerations.push('formal_courtesy');
    }

    if (emotionalContext.socialCues.includes('boundary_setting')) {
      considerations.push('privacy_respect');
    }

    // Default considerations
    considerations.push('inclusive_language', 'respectful_tone');

    return considerations;
  }

  /**
   * Suggest appropriate responses
   */
  private suggestAppropriateResponses(emotionalContext: EmotionalContext): string[] {
    const responses: string[] = [];
    const userEmotion = emotionalContext.userEmotion;

    if (userEmotion.valence < -0.5) {
      responses.push('offer_emotional_support', 'validate_feelings', 'provide_resources');
    } else if (userEmotion.valence > 0.5) {
      responses.push('share_enthusiasm', 'encourage_continuation', 'ask_follow_up');
    } else {
      responses.push('maintain_engagement', 'provide_information', 'ask_clarifying_questions');
    }

    return responses;
  }

  /**
   * Assess boundary respect
   */
  private assessBoundaryRespect(emotionalContext: EmotionalContext, conversationHistory: any[]): string[] {
    const boundaries: string[] = [];

    if (emotionalContext.socialCues.includes('boundary_setting')) {
      boundaries.push('respect_stated_boundaries');
    }

    if (emotionalContext.socialCues.includes('private')) {
      boundaries.push('avoid_personal_probing');
    }

    // Always include basic boundaries
    boundaries.push('maintain_professional_distance', 'respect_user_autonomy');

    return boundaries;
  }

  /**
   * Initialize emotion lexicon
   */
  private initializeEmotionLexicon(): void {
    const emotions = [
      { word: 'happy', state: this.createEmotionalState('joy', 0.8, 0.6, 0.6, 0.7, 0.8) },
      { word: 'sad', state: this.createEmotionalState('sadness', -0.7, 0.4, 0.3, 0.6, 0.8) },
      { word: 'angry', state: this.createEmotionalState('anger', -0.6, 0.8, 0.8, 0.8, 0.8) },
      { word: 'scared', state: this.createEmotionalState('fear', -0.5, 0.7, 0.2, 0.7, 0.7) },
      { word: 'excited', state: this.createEmotionalState('excitement', 0.9, 0.9, 0.7, 0.8, 0.8) },
      { word: 'calm', state: this.createEmotionalState('calm', 0.3, 0.2, 0.5, 0.4, 0.8) },
      { word: 'confused', state: this.createEmotionalState('confusion', -0.2, 0.5, 0.3, 0.5, 0.7) },
      { word: 'grateful', state: this.createEmotionalState('gratitude', 0.7, 0.4, 0.4, 0.6, 0.8) },
      { word: 'proud', state: this.createEmotionalState('pride', 0.8, 0.6, 0.7, 0.7, 0.8) },
      { word: 'lonely', state: this.createEmotionalState('loneliness', -0.6, 0.3, 0.2, 0.6, 0.8) },
      { word: 'hopeful', state: this.createEmotionalState('hope', 0.6, 0.5, 0.5, 0.6, 0.7) },
      { word: 'worried', state: this.createEmotionalState('worry', -0.4, 0.6, 0.3, 0.6, 0.7) }
    ];

    emotions.forEach(({ word, state }) => {
      this.emotionLexicon.set(word, state);
    });
  }

  /**
   * Initialize empathy strategies
   */
  private initializeEmpathyStrategies(): void {
    const strategies = [
      {
        strategy: 'emotional_validation',
        phrases: [
          "Your feelings are completely valid.",
          "It makes perfect sense that you'd feel this way.",
          "Anyone would feel upset in this situation."
        ]
      },
      {
        strategy: 'reassurance_and_safety',
        phrases: [
          "You're safe here to share whatever you're feeling.",
          "It's okay to feel uncertain about this.",
          "We can work through this step by step."
        ]
      },
      {
        strategy: 'acknowledgment_and_understanding',
        phrases: [
          "I can understand why that would be frustrating.",
          "Your feelings about this are completely valid.",
          "It sounds like this situation is really challenging."
        ]
      },
      {
        strategy: 'active_listening',
        phrases: [
          "I'm here to listen.",
          "Tell me more about how you're feeling.",
          "I want to understand what you're going through."
        ]
      },
      {
        strategy: 'gentle_encouragement',
        phrases: [
          "You're doing great by talking about this.",
          "It takes courage to share these feelings.",
          "You're not alone in this."
        ]
      },
      {
        strategy: 'positive_reinforcement',
        phrases: [
          "That's wonderful to hear!",
          "I'm so happy for you!",
          "What an exciting development!"
        ]
      }
    ];

    strategies.forEach(({ strategy, phrases }) => {
      this.empathyStrategies.set(strategy, phrases);
    });
  }

  /**
   * Initialize social cues
   */
  private initializeSocialCues(): void {
    const cues = [
      { cue: 'polite', indicators: ['please', 'thank you', 'thanks', 'excuse me'] },
      { cue: 'urgent', indicators: ['urgent', 'asap', 'quickly', 'immediately'] },
      { cue: 'uncertain', indicators: ['maybe', 'perhaps', 'not sure', 'think'] },
      { cue: 'confident', indicators: ['definitely', 'absolutely', 'certain', 'sure'] },
      { cue: 'support_seeking', indicators: ['help', 'advice', 'support', 'guidance'] },
      { cue: 'sharing', indicators: ['tell you', 'share', 'story', 'experience'] }
    ];

    cues.forEach(({ cue, indicators }) => {
      this.socialCues.set(cue, indicators);
    });
  }

  /**
   * Create emotional state
   */
  private createEmotionalState(
    primary: string,
    valence: number,
    arousal: number,
    dominance: number,
    intensity: number,
    confidence: number
  ): EmotionalState {
    return {
      primary,
      secondary: [],
      valence,
      arousal,
      dominance,
      intensity,
      confidence
    };
  }

  /**
   * Update emotional history
   */
  private updateEmotionalHistory(emotion: EmotionalState): void {
    // Keep last 10 emotions
    if (this.conversationMoodHistory.length >= 10) {
      this.conversationMoodHistory.shift();
    }
    this.conversationMoodHistory.push(emotion.primary);
  }

  /**
   * Update conversation mood
   */
  private updateConversationMood(mood: string): void {
    // Store mood for trend analysis
    this.conversationMoodHistory.push(mood);
    if (this.conversationMoodHistory.length > 20) {
      this.conversationMoodHistory.shift();
    }
  }

  /**
   * Get recent emotional history
   */
  private getRecentEmotionalHistory(): EmotionalState[] {
    // Return recent emotions (simplified for now)
    return this.conversationMoodHistory.slice(-5).map(emotion => 
      this.createEmotionalState(emotion, 0, 0.5, 0.5, 0.5, 0.7)
    );
  }

  /**
   * Get valence for emotion type
   */
  private getEmotionValence(emotion: string): number {
    const positiveEmotions = ['joy', 'happiness', 'excitement', 'gratitude', 'love', 'pride', 'hope'];
    const negativeEmotions = ['sadness', 'anger', 'fear', 'shame', 'loneliness', 'despair', 'devastated', 'hate'];
    
    if (positiveEmotions.includes(emotion)) return 0.7;
    if (negativeEmotions.includes(emotion)) return -0.6;
    return 0.0; // neutral
  }

  /**
   * Get arousal for emotion type
   */
  private getEmotionArousal(emotion: string): number {
    const highArousalEmotions = ['excitement', 'anger', 'fear', 'surprise'];
    const lowArousalEmotions = ['sadness', 'calm', 'loneliness'];
    
    if (highArousalEmotions.includes(emotion)) return 0.8;
    if (lowArousalEmotions.includes(emotion)) return 0.3;
    return 0.5; // moderate
  }

  /**
   * Get dominance for emotion type
   */
  private getEmotionDominance(emotion: string): number {
    const highDominanceEmotions = ['anger', 'pride', 'excitement'];
    const lowDominanceEmotions = ['fear', 'shame', 'sadness', 'loneliness'];
    
    if (highDominanceEmotions.includes(emotion)) return 0.7;
    if (lowDominanceEmotions.includes(emotion)) return 0.3;
    return 0.5; // moderate
  }
}
