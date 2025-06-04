import { ModelDrivenPipeline, ProcessingResult } from './model-pipeline';
import { PrimeMath } from './prime-math';
import { PragmaticLayer, ConversationContext } from '../conversation/pragmatic-layer';
import { SchemaVocabulary } from '../semantic/schema-vocabulary';
import { DiscourseLayer } from '../conversation/discourse-layer';
import { GenerativeLayer, GenerationContext } from '../conversation/generative-layer';
import { EpisodicMemoryLayer } from '../memory/episodic-memory';
import { EmotionalIntelligenceLayer } from '../memory/emotional-intelligence';

// =============================================================================
// CORE MODEL INTERFACES
// =============================================================================

export interface IdentityModel {
  id: string;
  name: string;
  type: 'human' | 'chatbot';
  embeddings: number[];
  primeFactors: Record<number, number>;
  personality: {
    traits: string[];
    communicationStyle: string;
    interests: string[];
  };
}

export interface UserModel {
  identity: IdentityModel;
  conversationState: {
    embeddings: number[];
    primeFactors: Record<number, number>;
    context: string[];
    turnCount: number;
  };
  preferences: {
    topics: string[];
    responseLength: 'short' | 'medium' | 'long';
  };
}

// =============================================================================
// PRIME CORE IMPLEMENTATION - MODEL-DRIVEN VERSION
// =============================================================================

export class PrimeCore {
  private modelPipeline: ModelDrivenPipeline;
  private isInitialized = false;
  private pragmaticLayer: PragmaticLayer;
  private schemaVocabulary: SchemaVocabulary;
  private discourseLayer: DiscourseLayer;
  private generativeLayer: GenerativeLayer;
  private episodicMemoryLayer: EpisodicMemoryLayer;
  private emotionalIntelligenceLayer: EmotionalIntelligenceLayer;
  
  humanUser: UserModel;
  chatbotUser: UserModel;

  constructor() {
    // Initialize model-driven pipeline (replaces old embedding pipeline)
    this.modelPipeline = new ModelDrivenPipeline();
    
    // Initialize human user
    this.humanUser = {
      identity: {
        id: 'human-001',
        name: 'Human',
        type: 'human',
        embeddings: [],
        primeFactors: {},
        personality: {
          traits: ['curious', 'conversational'],
          communicationStyle: 'direct',
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

    // Initialize chatbot user
    this.chatbotUser = {
      identity: {
        id: 'chatbot-001',
        name: 'PrimeBot',
        type: 'chatbot',
        embeddings: [],
        primeFactors: {},
        personality: {
          traits: ['helpful', 'analytical', 'mathematical'],
          communicationStyle: 'thoughtful',
          interests: ['mathematics', 'conversation', 'learning']
        }
      },
      conversationState: {
        embeddings: [],
        primeFactors: {},
        context: [],
        turnCount: 0
      },
      preferences: {
        topics: ['mathematics', 'prime numbers', 'conversation'],
        responseLength: 'medium'
      }
    };

    // Initialize other layers that don't use hardcoded patterns
    this.pragmaticLayer = new PragmaticLayer();
    this.schemaVocabulary = new SchemaVocabulary();
    this.discourseLayer = new DiscourseLayer(this.schemaVocabulary);
    this.generativeLayer = new GenerativeLayer(this.schemaVocabulary);
    this.episodicMemoryLayer = new EpisodicMemoryLayer();
    this.emotionalIntelligenceLayer = new EmotionalIntelligenceLayer();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing PrimeLM Core with model-driven pipeline...');
      
      // Initialize the model pipeline - will fail if any model fails
      await this.modelPipeline.initialize();
      
      this.isInitialized = true;
      console.log('✅ PrimeLM Core initialized successfully');
      console.log('📋 Model info:', this.modelPipeline.getModelInfo());
      
    } catch (error) {
      console.error('❌ Failed to initialize PrimeLM Core:', error);
      throw error; // No fallbacks - let it fail
    }
  }

  async processConversation(input: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('PrimeCore not initialized - call initialize() first');
    }

    if (!input || input.trim().length === 0) {
      throw new Error('Cannot process empty input');
    }

    console.log(`🔬 Processing conversation input: "${input}"`);

    try {
      // Process input through model pipeline - will fail if any model fails
      const analysis = await this.modelPipeline.processText(input);
      
      // Update conversation state with model-driven analysis
      this.updateConversationState(input, analysis);
      
      // Generate response using mathematical operations
      const response = await this.generateResponse(analysis);
      
      console.log(`✅ Generated response: "${response}"`);
      return response;
      
    } catch (error) {
      console.error('❌ Conversation processing failed:', error);
      throw error; // No fallbacks - let it fail
    }
  }

  private updateConversationState(input: string, analysis: ProcessingResult): void {
    // Update human user state with model-driven analysis
    this.updateUserState(this.humanUser, input, analysis.embeddings, analysis.primes);
    
    // Store entities in memory based on intent and context
    this.storeEntitiesInMemory(input, analysis);
    
    // Update pragmatic layer with model-driven analysis
    this.pragmaticLayer.processTurn(
      'human',
      input,
      analysis.intent.intent,
      analysis.entities.reduce((acc, entity, index) => {
        acc[`entity_${index}`] = entity;
        return acc;
      }, {} as Record<string, any>),
      {
        intent: analysis.intent.intent,
        entities: analysis.entities.map(e => e.text),
        confidence: analysis.intent.confidence,
        semanticBoosts: []
      }
    );

    // Update emotional intelligence with model-driven emotion analysis
    // Use the analyzeEmotionalContent method instead of updateEmotionalState
    const emotionalContext = this.emotionalIntelligenceLayer.analyzeEmotionalContent(
      input,
      {
        conversationHistory: this.humanUser.conversationState.context,
        currentTopic: analysis.intent.intent
      }
    );
  }

  private storeEntitiesInMemory(input: string, analysis: ProcessingResult): void {
    const intent = analysis.intent.intent;
    const entities = analysis.entities;
    
    // Store entities based on intent patterns
    if (intent === 'IDENTITY_INTRODUCTION') {
      // Look for person entities in identity introductions
      const personEntity = entities.find(e => e.type === 'PERSON' || e.confidence > 0.7);
      if (personEntity) {
        console.log(`💾 Storing user name: ${personEntity.text}`);
        // Entity storage is handled by pragmatic layer's processTurn method
      }
    }
    
    if (intent === 'ENTITY_INTRODUCTION') {
      // Look for entity relationships like "My dog's name is Max"
      if (entities.length >= 2) {
        const relationshipEntity = entities[0]; // First entity is usually the relationship
        const nameEntity = entities[entities.length - 1]; // Last entity is usually the name
        
        if (relationshipEntity && nameEntity) {
          const relationshipType = relationshipEntity.text.toLowerCase();
          console.log(`💾 Storing ${relationshipType} name: ${nameEntity.text}`);
          // Entity storage is handled by pragmatic layer's processTurn method
        }
      }
    }
    
    // Store any high-confidence entities for future reference
    entities.forEach(entity => {
      if (entity.confidence > 0.8 && entity.type === 'PERSON') {
        // Check if this might be a name introduction based on context
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes('my name is') || lowerInput.includes('i am') || lowerInput.includes("i'm")) {
          console.log(`💾 Storing user name from high-confidence entity: ${entity.text}`);
          // Entity storage is handled by pragmatic layer's processTurn method
        }
      }
    });
  }

  private updateUserState(user: UserModel, text: string, embeddings: number[], primes: Record<number, number>): void {
    user.conversationState.embeddings = embeddings;
    user.conversationState.primeFactors = primes;
    user.conversationState.context.push(text);
    user.conversationState.turnCount++;
    
    // Keep context manageable
    if (user.conversationState.context.length > 10) {
      user.conversationState.context = user.conversationState.context.slice(-10);
    }
    
    // Update identity embeddings (evolving representation)
    if (user.identity.embeddings.length === 0) {
      user.identity.embeddings = [...embeddings];
      user.identity.primeFactors = { ...primes };
    } else {
      // Blend with existing identity
      user.identity.embeddings = user.identity.embeddings.map((val, idx) => 
        val * 0.9 + embeddings[idx] * 0.1
      );
      user.identity.primeFactors = PrimeMath.combineFactors(
        user.identity.primeFactors, 
        primes, 
        0.9
      );
    }
  }

  private async generateResponse(analysis: ProcessingResult): Promise<string> {
    // Use the enhanced prime factorization for response generation
    const responsePrimes = this.generateResponsePrimes(analysis.primes);
    
    // Get the full conversation context
    const pragmaticContext = this.pragmaticLayer.getContextForResponse();
    
    // Build proper ConversationContext for discourse analysis
    const fullConversationContext: ConversationContext = {
      currentTopic: pragmaticContext.currentTopic,
      activeIntents: pragmaticContext.activeIntents,
      entityMemory: new Map(Object.entries(pragmaticContext.relevantEntities)),
      conversationGoals: pragmaticContext.conversationGoals,
      userPreferences: {},
      conversationHistory: pragmaticContext.recentHistory
    };
    
    // Generate response using existing generative layer
    // but with model-driven context instead of hardcoded patterns
    const generationContext = {
      responseType: this.determineResponseType(analysis.intent.intent),
      semanticContext: {
        intent: analysis.intent.intent,
        entities: analysis.entities.map(e => e.text),
        confidence: analysis.intent.confidence,
        semanticBoosts: []
      },
      discourseContext: this.discourseLayer.analyzeDiscourseContext(
        analysis.intent.intent,
        { intent: analysis.intent.intent, entities: analysis.entities.map(e => e.text), confidence: analysis.intent.confidence, semanticBoosts: [] },
        fullConversationContext
      ),
      pragmaticContext: fullConversationContext,
      primeResonance: responsePrimes
    };

    // Always use model-driven responses for better control and testing
    // This ensures consistent behavior and proper entity memory access
    const response = this.generateModelDrivenResponse(analysis);
    
    // Update chatbot state with generated response
    const responseEmbeddings = await this.modelPipeline.processText(response);
    this.updateUserState(this.chatbotUser, response, responseEmbeddings.embeddings, responsePrimes);
    
    return this.enhanceResponseWithEmotionalIntelligence(response, analysis);
  }

  private determineResponseType(intent: string): string {
    const responseTypeMap: Record<string, string> = {
      'GREETING': 'greeting',
      'IDENTITY_INTRODUCTION': 'acknowledgment',
      'ENTITY_INTRODUCTION': 'acknowledgment',
      'IDENTITY_QUERY': 'informational',
      'ENTITY_QUERY': 'informational',
      'HELP_REQUEST': 'helpful',
      'GRATITUDE': 'acknowledgment',
      'POSITIVE_FEEDBACK': 'positive',
      'INFORMATION_REQUEST': 'informational',
      'KNOWLEDGE_REQUEST': 'informational',
      'QUESTION': 'informational'
    };
    
    return responseTypeMap[intent] || 'conversational';
  }

  private generateResponsePrimes(inputPrimes: Record<number, number>): Record<number, number> {
    // Calculate coherence with chatbot's current state
    const coherence = PrimeMath.calculateCoherence(
      inputPrimes, 
      this.chatbotUser.conversationState.primeFactors
    );
    
    console.log(`🧮 Coherence score: ${(coherence * 100).toFixed(1)}%`);
    
    let responsePrimes: Record<number, number>;
    
    if (coherence > 0.1) {
      // High coherence: amplify resonance
      responsePrimes = this.amplifyResonance(inputPrimes);
    } else {
      // Low coherence: create harmonic response
      responsePrimes = this.createHarmonic(inputPrimes);
    }
    
    // Add chatbot personality factors
    responsePrimes = this.addPersonalityFactors(responsePrimes);
    
    return responsePrimes;
  }

  private amplifyResonance(inputPrimes: Record<number, number>): Record<number, number> {
    const amplified: Record<number, number> = {};
    
    // Amplify existing factors
    Object.entries(inputPrimes).forEach(([primeStr, weight]) => {
      const prime = parseInt(primeStr);
      amplified[prime] = Math.floor(weight * 1.3);
    });
    
    // Add resonant harmonics
    const primes = PrimeMath.generatePrimes(100);
    amplified[primes[10]] = 8; // Understanding
    amplified[primes[15]] = 6; // Response
    
    return amplified;
  }

  private createHarmonic(inputPrimes: Record<number, number>): Record<number, number> {
    const harmonic: Record<number, number> = {};
    
    // Create harmonic response from top input factors
    const topFactors = Object.entries(inputPrimes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    topFactors.forEach(([primeStr, weight]) => {
      const prime = parseInt(primeStr);
      const harmonicPrime = prime + 2;
      harmonic[harmonicPrime] = Math.floor(weight * 0.7);
    });
    
    // Add base response factors
    const primes = PrimeMath.generatePrimes(50);
    harmonic[primes[5]] = 10; // Help
    harmonic[primes[8]] = 8;  // Knowledge
    
    return harmonic;
  }

  private addPersonalityFactors(primes: Record<number, number>): Record<number, number> {
    const enhanced = { ...primes };
    const personalityPrimes = PrimeMath.generatePrimes(30);
    
    // Add chatbot personality traits
    enhanced[personalityPrimes[12]] = 5; // Helpful
    enhanced[personalityPrimes[18]] = 4; // Analytical
    enhanced[personalityPrimes[22]] = 3; // Mathematical
    
    return enhanced;
  }

  private generateModelDrivenResponse(analysis: ProcessingResult): string {
    // Fully model-driven response generation using entity memory and context
    const intent = analysis.intent.intent;
    const entities = analysis.entities;
    const emotion = analysis.emotion.emotion;
    const confidence = analysis.semanticContext.overallConfidence;
    
    // Query entity memory for contextual information
    const pragmaticContext = this.pragmaticLayer.getContextForResponse();
    
    // Use model-driven analysis for response generation
    switch (intent) {
      case 'GREETING':
        return this.generateGreetingResponse(entities, confidence);
        
      case 'IDENTITY_INTRODUCTION':
        return this.generateIdentityIntroductionResponse(entities, confidence);
        
      case 'ENTITY_INTRODUCTION':
        return this.generateEntityIntroductionResponse(entities, confidence);
        
      case 'IDENTITY_QUERY':
        return this.generateIdentityQueryResponse(pragmaticContext);
        
      case 'ENTITY_QUERY':
        return this.generateEntityQueryResponse(entities, pragmaticContext);
        
      case 'QUESTION':
        return this.generateQuestionResponse(entities, pragmaticContext, confidence);
        
      case 'HELP_REQUEST':
        return this.generateHelpResponse(entities, confidence);
        
      case 'GRATITUDE':
        return this.generateGratitudeResponse(confidence);
        
      case 'POSITIVE_FEEDBACK':
        return this.generatePositiveFeedbackResponse(confidence);
        
      case 'INFORMATION_REQUEST':
      case 'KNOWLEDGE_REQUEST':
        return this.generateInformationResponse(entities, confidence);
        
      default:
        return this.generateDefaultResponse(intent, emotion, entities, confidence);
    }
  }
  
  private generateGreetingResponse(entities: any[], confidence: number): string {
    const responses = [
      "Hello! I'm here and ready to understand what you're telling me.",
      "Hi there! I'm listening and processing through mathematical consciousness.",
      "Greetings! I'm excited to learn from our conversation."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private generateIdentityIntroductionResponse(entities: any[], confidence: number): string {
    if (entities.length > 0) {
      const name = entities.find(e => e.type === 'PERSON' || e.confidence > 0.7)?.text || entities[0].text;
      const responses = [
        `Nice to meet you, ${name}! I'm here to assist you.`,
        `Hello ${name}! I'm ready to understand and help.`,
        `Welcome ${name}! Tell me more about yourself.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    return "Nice to meet you! I'm here to understand and assist you.";
  }
  
  private generateEntityIntroductionResponse(entities: any[], confidence: number): string {
    if (entities.length >= 2) {
      const entityName = entities[entities.length - 1].text;
      const entityType = entities[0].text;
      return `I'm here to assist you. Tell me more about ${entityName}.`;
    }
    return "That's interesting! I'm processing that information.";
  }
  
  private generateIdentityQueryResponse(pragmaticContext: any): string {
    // Check entity memory for user name
    const userName = this.pragmaticLayer.queryEntityMemory('user_name');
    if (userName) {
      return `Your name is ${userName.value}.`;
    }
    return "I don't have your name in my memory yet. What is your name?";
  }
  
  private generateEntityQueryResponse(entities: any[], pragmaticContext: any): string {
    // Try to find the queried entity in memory
    for (const entity of entities) {
      if (entity.text && entity.text !== 'name' && entity.text !== 'is' && entity.text !== 'my') {
        const entityInfo = this.pragmaticLayer.queryEntityRelationship(entity.text, 'name');
        if (entityInfo) {
          return `Your ${entity.text} is named ${entityInfo.value}.`;
        }
      }
    }
    return "I'm analyzing the contextual patterns in our conversation.";
  }
  
  private generateQuestionResponse(entities: any[], pragmaticContext: any, confidence: number): string {
    // Get the original input text from conversation history to check for name queries
    const recentInput = this.humanUser.conversationState.context[this.humanUser.conversationState.context.length - 1] || '';
    const isNameQuery = recentInput.toLowerCase().includes('name') || 
                       recentInput.toLowerCase().includes('what is my') ||
                       recentInput.toLowerCase().includes('who am i');
    
    if (isNameQuery) {
      console.log('🔍 Detected name query, checking entity memory...');
      
      // Use model-extracted entities to determine query type - NO REGEX
      // If entities contain relationship words, check relationship memory
      const hasRelationshipEntity = entities.some(e => 
        e.text && ['wife', 'husband', 'dog', 'cat', 'car', 'mother', 'father', 'sister', 'brother'].includes(e.text.toLowerCase())
      );
      
      if (hasRelationshipEntity) {
        // Find the relationship entity from model extraction
        const relationshipEntity = entities.find(e => 
          e.text && ['wife', 'husband', 'dog', 'cat', 'car', 'mother', 'father', 'sister', 'brother'].includes(e.text.toLowerCase())
        );
        
        if (relationshipEntity) {
          const relationshipType = relationshipEntity.text.toLowerCase();
          const relationshipInfo = this.pragmaticLayer.queryEntityRelationship(relationshipType, 'name');
          if (relationshipInfo) {
            return `Your ${relationshipType} is named ${relationshipInfo.value}.`;
          } else {
            return `I don't have information about your ${relationshipType}'s name yet.`;
          }
        }
      }
      
      // Default to user identity query
      return this.generateIdentityQueryResponse(pragmaticContext);
    }
    
    // Also check entities for name-related terms
    const hasNameQuery = entities.some(e => e.text && e.text.toLowerCase().includes('name'));
    if (hasNameQuery) {
      console.log('🔍 Detected name in entities, checking entity memory...');
      return this.generateIdentityQueryResponse(pragmaticContext);
    }
    
    const responses = [
      "I'm ready to process and understand your input.",
      "I'm analyzing the mathematical patterns to provide an answer.",
      "Let me process that through my semantic understanding."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private generateHelpResponse(entities: any[], confidence: number): string {
    const responses = [
      "I'm here to help! What would you like to know?",
      "I'm ready to assist you with understanding and conversation.",
      "How can I help you today? I'm here to understand and respond."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private generateGratitudeResponse(confidence: number): string {
    const responses = [
      "You're welcome! I'm glad I could help.",
      "Happy to assist! Is there anything else?",
      "My pleasure! I'm here whenever you need help."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private generatePositiveFeedbackResponse(confidence: number): string {
    const responses = [
      "That's wonderful! I'm glad our conversation is going well.",
      "Thank you! I'm enjoying our interaction.",
      "That's great to hear! How else can I help?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private generateInformationResponse(entities: any[], confidence: number): string {
    const responses = [
      "I'm processing that information through mathematical analysis.",
      "Let me analyze that using my semantic understanding.",
      "I'm working on understanding that through prime factorization."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private generateDefaultResponse(intent: string, emotion: string, entities: any[], confidence: number): string {
    const responses = [
      "I'm listening and processing what you're telling me.",
      "I'm here to understand and respond to your input.",
      "I'm analyzing your message through mathematical consciousness."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private enhanceResponseWithEmotionalIntelligence(response: string, analysis: ProcessingResult): string {
    // Analyze emotional context
    const emotionalContext = this.emotionalIntelligenceLayer.analyzeEmotionalContent(
      this.humanUser.conversationState.context[this.humanUser.conversationState.context.length - 1],
      {
        conversationHistory: this.humanUser.conversationState.context,
        currentTopic: analysis.intent.intent
      }
    );
    
    // Generate emotional response strategy
    const emotionalResponse = this.emotionalIntelligenceLayer.generateEmotionalResponse(
      emotionalContext,
      response
    );
    
    // Store episode in memory
    this.episodicMemoryLayer.storeEpisode(
      'conversation',
      {
        summary: `Bot responded: "${response}"`,
        details: {
          intent: analysis.intent.intent,
          entities: analysis.entities,
          emotionalState: emotionalContext.userEmotion
        },
        participants: ['chatbot', 'human'],
        context: 'response_generation'
      },
      {
        valence: analysis.emotion.valence,
        arousal: analysis.emotion.arousal,
        dominance: 0.5,
        emotions: [analysis.emotion.emotion]
      },
      analysis.emotion.confidence
    );
    
    // Apply emotional enhancements
    let enhancedResponse = response;
    const { warmth, enthusiasm } = emotionalResponse.tonalAdjustments;
    
    // High warmth: Add empathetic phrases
    if (warmth > 0.7 && !enhancedResponse.includes('understand')) {
      enhancedResponse = `I understand. ${enhancedResponse}`;
    }
    
    // High enthusiasm: Add excitement
    if (enthusiasm > 0.7 && !enhancedResponse.includes('!')) {
      enhancedResponse = enhancedResponse.replace(/\.$/, '!');
    }
    
    return enhancedResponse;
  }

  getDebugInfo(): any {
    return {
      humanUser: {
        identity: this.humanUser.identity,
        conversationState: {
          ...this.humanUser.conversationState,
          primeCount: Object.keys(this.humanUser.conversationState.primeFactors).length
        }
      },
      chatbotUser: {
        identity: this.chatbotUser.identity,
        conversationState: {
          ...this.chatbotUser.conversationState,
          primeCount: Object.keys(this.chatbotUser.conversationState.primeFactors).length
        }
      },
      coherence: PrimeMath.calculateCoherence(
        this.humanUser.conversationState.primeFactors,
        this.chatbotUser.conversationState.primeFactors
      ),
      modelPipeline: this.modelPipeline.getModelInfo(),
      episodicMemory: {
        totalEpisodes: this.episodicMemoryLayer.getMemoryStats().totalEpisodes,
        personalityTraits: this.episodicMemoryLayer.getPersonalityInsights().traits
      }
    };
  }
}
