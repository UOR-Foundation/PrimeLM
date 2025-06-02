import { pipeline, Pipeline } from '@xenova/transformers';
import { KnowledgeBootstrap, KnowledgeBase } from './knowledge-bootstrap';
import { PrimeResonanceEngine, PrimeResonanceResult } from './prime-resonance';
import { PrimeMath } from './prime-math';
import { SemanticLayer, SemanticContext } from './semantic-layer';
import { PragmaticLayer, ConversationContext } from './pragmatic-layer';
import { SchemaVocabulary } from './schema-vocabulary';
import { DiscourseLayer } from './discourse-layer';
import { GenerativeLayer, GenerationContext } from './generative-layer';
import { ConversationStateManager, ConversationTurn } from './conversation-state';
import { GracefulErrorHandler, createErrorContext, safeAsync } from './error-handling';
import { EpisodicMemoryLayer } from './episodic-memory';
import { EmotionalIntelligenceLayer } from './emotional-intelligence';

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

export interface EmbeddingsModel {
  vocabulary: Map<string, number[]>;
  concepts: Map<string, number[]>;
  relationships: Map<string, string[]>;
}



// =============================================================================
// PRIME CORE IMPLEMENTATION
// =============================================================================

export class PrimeCore {
  private embeddingPipeline: any | null = null;
  private isInitialized = false;
  private knowledgeBase: KnowledgeBase | null = null;
  private semanticLayer: SemanticLayer;
  private pragmaticLayer: PragmaticLayer;
  private schemaVocabulary: SchemaVocabulary;
  private discourseLayer: DiscourseLayer;
  private generativeLayer: GenerativeLayer;
  private episodicMemoryLayer: EpisodicMemoryLayer;
  private emotionalIntelligenceLayer: EmotionalIntelligenceLayer;
  
  humanUser: UserModel;
  chatbotUser: UserModel;
  embeddingsModel: EmbeddingsModel;

  constructor() {
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

    // Initialize embeddings model
    this.embeddingsModel = {
      vocabulary: new Map(),
      concepts: new Map(),
      relationships: new Map()
    };

    // Initialize semantic layer
    this.semanticLayer = new SemanticLayer();
    
    // Initialize pragmatic layer
    this.pragmaticLayer = new PragmaticLayer();
    
    // Initialize schema vocabulary
    this.schemaVocabulary = new SchemaVocabulary();
    
    // Initialize discourse layer
    this.discourseLayer = new DiscourseLayer(this.schemaVocabulary);
    
    // Initialize generative layer
    this.generativeLayer = new GenerativeLayer(this.schemaVocabulary);
    
    // Initialize Phase 3 layers
    this.episodicMemoryLayer = new EpisodicMemoryLayer();
    this.emotionalIntelligenceLayer = new EmotionalIntelligenceLayer();

    // Embeddings model starts empty - no hardcoded data
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing PrimeLM Core...');
      
      // Load embedding pipeline
      this.embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      
      // Bootstrap chatbot knowledge
      await this.bootstrapChatbotKnowledge();
      
      this.isInitialized = true;
      console.log('✅ PrimeLM Core initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize PrimeLM Core:', error);
      throw error;
    }
  }

  private async bootstrapChatbotKnowledge(): Promise<void> {
    if (!this.embeddingPipeline) {
      throw new Error('Embedding pipeline not initialized');
    }

    try {
      const knowledgeBootstrap = new KnowledgeBootstrap(this.embeddingPipeline);
      this.knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();
      
      // Populate embeddings model with bootstrapped knowledge
      this.embeddingsModel.vocabulary = this.knowledgeBase.conceptEmbeddings;
      this.embeddingsModel.concepts = this.knowledgeBase.conceptEmbeddings;
      this.embeddingsModel.relationships = this.knowledgeBase.semanticClusters;
      
      // Update chatbot identity with accumulated knowledge
      this.populateChatbotIdentity();
      
    } catch (error) {
      console.error('❌ Knowledge bootstrap failed:', error);
      throw new Error(`Knowledge bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private populateChatbotIdentity(): void {
    if (!this.knowledgeBase) return;
    
    // Accumulate prime factors from all vocabulary
    const identityPrimes: Record<number, number> = {};
    const allEmbeddings: number[][] = [];
    
    for (const vocabularyEntry of this.knowledgeBase.vocabulary.values()) {
      // Add prime factors to chatbot identity
      Object.entries(vocabularyEntry.primeFactors).forEach(([prime, weight]) => {
        const primeNum = parseInt(prime);
        identityPrimes[primeNum] = (identityPrimes[primeNum] || 0) + weight;
      });
      
      allEmbeddings.push(vocabularyEntry.embedding);
    }
    
    // Calculate centroid embedding for chatbot identity
    if (allEmbeddings.length > 0) {
      const centroidEmbedding = this.calculateCentroidEmbedding(allEmbeddings);
      this.chatbotUser.identity.embeddings = centroidEmbedding;
      this.chatbotUser.identity.primeFactors = identityPrimes;
    }
  }

  private calculateCentroidEmbedding(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return new Array(384).fill(0);
    
    const centroid = new Array(embeddings[0].length).fill(0);
    
    embeddings.forEach(embedding => {
      embedding.forEach((value, index) => {
        centroid[index] += value;
      });
    });
    
    return centroid.map(value => value / embeddings.length);
  }

  async processConversation(input: string): Promise<string> {
    if (!this.isInitialized || !this.embeddingPipeline) {
      throw new Error('PrimeCore not initialized');
    }

    console.log(`🔬 Processing input: "${input}"`);

    // 1. Generate embeddings for input
    const inputEmbeddings = await this.generateEmbeddings(input);
    
    // 2. Convert to primes through human user model
    const inputPrimes = PrimeMath.embeddingsToPrimes(inputEmbeddings);
    
    // 3. Update human user state
    this.updateUserState(this.humanUser, input, inputEmbeddings, inputPrimes);
    
    // 4. Generate response through mathematical translation
    const responsePrimes = this.generateResponsePrimes(inputPrimes);
    
    // 5. Convert response primes to text through chatbot user model
    const responseText = await this.generateResponseText(responsePrimes);
    
    // 6. Update chatbot user state
    const responseEmbeddings = await this.generateEmbeddings(responseText);
    this.updateUserState(this.chatbotUser, responseText, responseEmbeddings, responsePrimes);
    
    console.log(`✅ Generated response: "${responseText}"`);
    
    return responseText;
  }

  private async generateEmbeddings(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      throw new Error('Embedding pipeline not initialized');
    }
    
    const result = await this.embeddingPipeline(text);
    return Array.from(result.data);
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
    
    // Update embeddings model with real concepts from conversation
    this.updateEmbeddingsModel(text, embeddings);
  }

  private updateEmbeddingsModel(text: string, embeddings: number[]): void {
    // Extract key words/concepts from text
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    
    words.forEach(word => {
      // Add to vocabulary with real embeddings
      this.embeddingsModel.vocabulary.set(word, [...embeddings]);
      
      // Add as concept if it's significant
      if (word.length > 4) {
        this.embeddingsModel.concepts.set(word, [...embeddings]);
      }
    });
    
    // Build relationships between concepts
    if (words.length > 1) {
      words.forEach((word, index) => {
        const relatedWords = words.filter((_, i) => i !== index);
        this.embeddingsModel.relationships.set(word, relatedWords);
      });
    }
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

  private async generateResponseText(primes: Record<number, number>): Promise<string> {
    console.log('🔍 Generating response text using Phase 3: Full 8-Layer Architecture...');
    console.log('Knowledge base available:', !!this.knowledgeBase);
    
    if (!this.knowledgeBase) {
      console.log('⚠️ No knowledge base available');
      throw new Error('No knowledge base available - bootstrap failed');
    }

    // Get the most recent user input for analysis
    const lastUserInput = this.humanUser.conversationState.context[this.humanUser.conversationState.context.length - 1];
    
    // 1. Analyze semantic context
    const semanticContext = this.semanticLayer.analyzeSemanticContext(lastUserInput);
    
    // 2. Get pragmatic context
    const pragmaticResponseContext = this.pragmaticLayer.getContextForResponse();
    
    // Convert to ConversationContext format for compatibility
    const pragmaticContext: ConversationContext = {
      currentTopic: pragmaticResponseContext.currentTopic,
      activeIntents: pragmaticResponseContext.activeIntents,
      entityMemory: new Map(Object.entries(pragmaticResponseContext.relevantEntities)),
      conversationGoals: pragmaticResponseContext.conversationGoals,
      userPreferences: {},
      conversationHistory: pragmaticResponseContext.recentHistory
    };
    
    // 3. Update pragmatic layer with current input
    this.pragmaticLayer.processTurn(
      'human',
      lastUserInput,
      semanticContext.intent,
      semanticContext.entities.reduce((acc, entity, index) => {
        acc[`entity_${index}`] = entity;
        return acc;
      }, {} as Record<string, any>),
      semanticContext
    );
    
    // 4. Get updated pragmatic context after processing
    const updatedPragmaticContext = this.pragmaticLayer.getContextForResponse();
    
    // Convert to ConversationContext format for compatibility
    const pragmaticContextForGeneration: ConversationContext = {
      currentTopic: updatedPragmaticContext.currentTopic,
      activeIntents: updatedPragmaticContext.activeIntents,
      entityMemory: new Map(Object.entries(updatedPragmaticContext.relevantEntities)),
      conversationGoals: updatedPragmaticContext.conversationGoals,
      userPreferences: {},
      conversationHistory: updatedPragmaticContext.recentHistory
    };
    
    // 5. Analyze discourse context
    const discourseContext = this.discourseLayer.analyzeDiscourseContext(
      lastUserInput,
      semanticContext,
      pragmaticContextForGeneration
    );
    
    // 6. PHASE 3: Analyze emotional context
    const emotionalContext = this.emotionalIntelligenceLayer.analyzeEmotionalContent(
      lastUserInput,
      {
        conversationHistory: pragmaticContextForGeneration.conversationHistory,
        currentTopic: pragmaticContextForGeneration.currentTopic
      }
    );
    
    // 7. PHASE 3: Store episodic memory
    const episodeId = this.episodicMemoryLayer.storeEpisode(
      'conversation',
      {
        summary: `User said: "${lastUserInput}"`,
        details: {
          intent: semanticContext.intent,
          entities: semanticContext.entities,
          emotionalState: emotionalContext.userEmotion
        },
        participants: ['human', 'chatbot'],
        context: discourseContext.conversationPhase || 'general'
      },
      {
        valence: emotionalContext.userEmotion.valence,
        arousal: emotionalContext.userEmotion.arousal,
        dominance: emotionalContext.userEmotion.dominance,
        emotions: [emotionalContext.userEmotion.primary, ...emotionalContext.userEmotion.secondary]
      },
      emotionalContext.empathyLevel
    );
    
    // 8. PHASE 3: Generate emotional response strategy
    const emotionalResponse = this.emotionalIntelligenceLayer.generateEmotionalResponse(
      emotionalContext,
      '' // Will be filled after generation
    );
    
    // 9. Generate response using Generative Layer with Phase 3 enhancements
    const generationContext: GenerationContext = {
      responseType: discourseContext.expectedResponseType,
      semanticContext: semanticContext,
      discourseContext: discourseContext,
      pragmaticContext: pragmaticContextForGeneration,
      primeResonance: primes
    };
    
    let generatedResponse = this.generativeLayer.generateResponse(generationContext);
    
    // 10. PHASE 3: Enhance response with emotional intelligence
    if (generatedResponse) {
      generatedResponse = this.enhanceResponseWithEmotionalIntelligence(
        generatedResponse,
        emotionalResponse,
        emotionalContext
      );
    }
    
    if (generatedResponse) {
      console.log('🎨 Generated dynamic response:', generatedResponse);
      return generatedResponse;
    }

    console.log('Vocabulary size:', this.knowledgeBase.vocabulary.size);
    console.log('Vocabulary primes available:', this.knowledgeBase.vocabularyPrimes.size);

    // Use prime resonance engine for direct prime-to-prime comparison
    const resonanceEngine = new PrimeResonanceEngine();
    
    // Find words with highest mathematical resonance to response primes
    const resonantWords = resonanceEngine.findMostResonantWords(
      primes,
      this.knowledgeBase.vocabularyPrimes,
      5 // Get more candidates for semantic enhancement
    );
    
    // Apply contextual weighting based on conversation history
    const contextualWords = resonanceEngine.applyContextualWeighting(
      resonantWords,
      this.humanUser.conversationState.context,
      1.5
    );
    
    // Enhance resonance with semantic awareness
    const semanticWords = this.semanticLayer.enhanceResonanceWithSemantics(
      contextualWords.map(w => ({ word: w.word, resonance: w.resonance })),
      semanticContext
    );
    
    console.log('Resonant words found:', semanticWords.map(w => 
      `${w.word}: ${w.resonance.toFixed(1)}`
    ));
    
    if (semanticWords.length > 0) {
      // Convert back to PrimeResonanceResult format for compatibility
      const enhancedResonantWords = contextualWords.map(original => {
        const enhanced = semanticWords.find(s => s.word === original.word);
        return {
          ...original,
          resonance: enhanced ? enhanced.resonance : original.resonance
        };
      }).sort((a, b) => b.resonance - a.resonance);
      
      const response = this.generateSemanticResonanceResponse(
        enhancedResonantWords,
        semanticContext,
        primes
      );
      console.log('Generated semantic-resonance response:', response);
      return response;
    }
    
    // Fallback to basic conversational response
    console.log('No resonant words found, using basic response');
    return this.generateBasicResponse(primes);
  }

  private primesToEmbeddings(primes: Record<number, number>): number[] {
    // Convert prime factorization back to embedding space
    const embeddings = new Array(384).fill(0);
    const primeList = PrimeMath.generatePrimes(384);
    
    Object.entries(primes).forEach(([prime, weight]) => {
      const primeNum = parseInt(prime);
      const index = primeList.indexOf(primeNum);
      if (index !== -1) {
        embeddings[index] = weight / 1000; // Reverse the scaling
      }
    });
    
    return embeddings;
  }

  private findClosestConcept(embeddings: number[]): string | null {
    let closestConcept: string | null = null;
    let highestSimilarity = -1;
    
    for (const [concept, conceptEmbeddings] of this.embeddingsModel.concepts) {
      const similarity = this.calculateCosineSimilarity(embeddings, conceptEmbeddings);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        closestConcept = concept;
      }
    }
    
    return highestSimilarity > 0.3 ? closestConcept : null;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }

  private async generateTextFromConcept(concept: string, primes: Record<number, number>): Promise<string> {
    // Use the concept to generate contextual response
    const magnitude = PrimeMath.calculateMagnitude(primes);
    const conceptVariations = this.getConceptVariations(concept);
    
    // Select variation based on magnitude
    const variationIndex = Math.floor(magnitude / 10) % conceptVariations.length;
    return conceptVariations[variationIndex];
  }

  private getConceptVariations(concept: string): string[] {
    // Generate variations based on learned concepts
    const variations: Record<string, string[]> = {};
    
    // Build variations from existing vocabulary
    for (const [vocab] of this.embeddingsModel.vocabulary) {
      if (!variations[concept]) variations[concept] = [];
      variations[concept].push(`I understand you're interested in ${vocab}. Let me help with that.`);
    }
    
    return variations[concept] || [`I'm processing information related to ${concept}.`];
  }

  private findMostSimilarConcepts(embeddings: number[], count: number): string[] {
    const similarities: Array<{concept: string, similarity: number}> = [];
    
    for (const [concept, conceptEmbeddings] of this.embeddingsModel.concepts) {
      const similarity = this.calculateCosineSimilarity(embeddings, conceptEmbeddings);
      similarities.push({concept, similarity});
    }
    
    const sorted = similarities.sort((a, b) => b.similarity - a.similarity);
    console.log('Top similarities:', sorted.slice(0, 5).map(s => `${s.concept}: ${s.similarity.toFixed(3)}`));
    
    // Lower threshold to 0.01 to find more matches
    const filtered = sorted
      .slice(0, count)
      .filter(item => item.similarity > 0.01);
    
    console.log('Filtered similar concepts:', filtered.map(s => `${s.concept}: ${s.similarity.toFixed(3)}`));
    
    return filtered.map(item => item.concept);
  }

  private generateSemanticResonanceResponse(
    resonantWords: PrimeResonanceResult[],
    semanticContext: SemanticContext,
    primes: Record<number, number>
  ): string {
    console.log('🎭 Generating semantic-enhanced resonance response...');
    console.log('Intent:', semanticContext.intent);
    console.log('Semantic boosts:', semanticContext.semanticBoosts);
    
    const primaryWord = resonantWords[0];
    
    // Use semantic context to enhance response generation
    switch (semanticContext.intent) {
      case 'GREETING':
        if (primaryWord.word === 'hello' || semanticContext.semanticBoosts.includes('hello')) {
          return "Hello! I'm PrimeBot. How can I help you today?";
        }
        return "Hello! Nice to meet you. I'm PrimeBot, powered by mathematical prime factorization.";
        
      case 'IDENTITY_INTRODUCTION':
        if (semanticContext.entities.length > 0) {
          const name = semanticContext.entities[0];
          return `Nice to meet you, ${name}! I'm PrimeBot. How can I assist you today?`;
        }
        return "Nice to meet you! I'm PrimeBot. What's your name?";
        
      case 'ENTITY_INTRODUCTION':
        if (semanticContext.entities.length >= 2) {
          const entityType = semanticContext.entities[0];
          const entityName = semanticContext.entities[1];
          return `Nice to know that your ${entityType} is named ${entityName}! Tell me more about ${entityName}.`;
        }
        return "That's interesting! Tell me more about that.";
        
      case 'IDENTITY_QUERY':
        const context = this.humanUser.conversationState.context.join(' ').toLowerCase();
        const nameMatch = context.match(/my name is (\w+)/i);
        if (nameMatch) {
          return `Based on our conversation, your name is ${nameMatch[1]}. Is that correct?`;
        }
        return "I don't recall you mentioning your name. What is your name?";
        
      case 'HELP_REQUEST':
        return "I'm here to help! What would you like to know or discuss?";
        
      case 'GRATITUDE':
        return "You're welcome! I'm glad I could help.";
        
      case 'POSITIVE_FEEDBACK':
        return "That's wonderful! Is there anything else I can help you with?";
        
      case 'INFORMATION_REQUEST':
      case 'QUESTION':
        if (primaryWord && primaryWord.resonance > 1000) {
          return `I'm analyzing the concept of "${primaryWord.word}" to answer your question. What specifically would you like to know?`;
        }
        return "That's a great question! I'm processing the mathematical patterns to provide you with an answer.";
        
      case 'KNOWLEDGE_REQUEST':
        return "I process information through mathematical analysis. What would you like me to understand?";
        
      default:
        // Fall back to resonance-based response with semantic enhancement
        if (primaryWord) {
          // Check if the primary word is semantically boosted
          if (semanticContext.semanticBoosts.includes(primaryWord.word)) {
            return `I notice you're particularly interested in "${primaryWord.word}". The mathematical resonance is strong here. Tell me more about what you'd like to explore!`;
          }
          
          // Use high resonance for confident responses
          if (primaryWord.resonance > 2000) {
            return `The concept of "${primaryWord.word}" resonates powerfully with my understanding. How can I help you explore this further?`;
          }
          
          return `I'm processing the mathematical patterns related to "${primaryWord.word}". What would you like to know about this?`;
        }
        
        return "I'm analyzing the semantic and mathematical patterns in your message. Could you tell me more?";
    }
  }

  private generateResonanceBasedResponse(resonantWords: PrimeResonanceResult[], primes: Record<number, number>): string {
    const primaryWord = resonantWords[0];
    const magnitude = PrimeMath.calculateMagnitude(primes);
    
    console.log('🎯 Generating response for primary resonant word:', primaryWord.word);
    console.log('🔢 Resonance score:', primaryWord.resonance.toFixed(1));
    console.log('🔗 Shared primes:', primaryWord.sharedPrimes);
    console.log('🎵 Harmonic matches:', primaryWord.harmonicMatches);
    
    // Check for greeting patterns
    if (primaryWord.word === 'hello' || primaryWord.word === 'hi') {
      return "Hello! I'm PrimeBot. How can I help you today?";
    }
    
    // Check for help/assistance patterns
    if (primaryWord.word === 'help' || primaryWord.word === 'assist') {
      return "I'm here to help! What would you like to know or discuss?";
    }
    
    // Check for gratitude patterns
    if (primaryWord.word === 'thanks' || primaryWord.word === 'thank') {
      return "You're welcome! I'm glad I could help.";
    }
    
    // Check for positive feedback
    if (primaryWord.word === 'good' || primaryWord.word === 'great') {
      return "That's wonderful! Is there anything else I can help you with?";
    }
    
    // Check for name/identity questions
    if (primaryWord.word === 'name' || resonantWords.some(w => w.word === 'name')) {
      // Check if user mentioned their name in context
      const context = this.humanUser.conversationState.context.join(' ').toLowerCase();
      if (context.includes('alex') || context.includes('my name is')) {
        return "Nice to meet you, Alex! I'm PrimeBot. How can I assist you today?";
      }
      return "I'm PrimeBot, an AI assistant powered by mathematical prime factorization. What's your name?";
    }
    
    // Check for understanding/knowledge requests
    if (primaryWord.word === 'understand' || primaryWord.word === 'know') {
      return "I process information through mathematical analysis. What would you like me to understand?";
    }
    
    // Check for question patterns
    if (primaryWord.word === 'what' || resonantWords.some(w => w.word === 'what')) {
      const context = this.humanUser.conversationState.context.join(' ').toLowerCase();
      if (context.includes('what is my name') || context.includes('my name')) {
        return "Based on our conversation, your name is Alex. Is that correct?";
      }
      return "That's a great question! I'm processing the mathematical patterns to provide you with an answer.";
    }
    
    // Use mathematical resonance for contextual responses
    if (primaryWord.sharedPrimes.length > 0) {
      const sharedPrimeCount = primaryWord.sharedPrimes.length;
      const harmonicCount = primaryWord.harmonicMatches.length;
      
      if (sharedPrimeCount >= 3) {
        return `I sense strong mathematical resonance with "${primaryWord.word}". Our prime factors align beautifully. What would you like to explore about this?`;
      } else if (harmonicCount > 0) {
        return `I detect harmonic relationships with "${primaryWord.word}". There's an interesting mathematical connection here. Tell me more!`;
      }
    }
    
    // High resonance response
    if (primaryWord.resonance > 100) {
      return `The concept of "${primaryWord.word}" resonates strongly with my mathematical understanding. How can I help you with this?`;
    }
    
    // Multiple resonant words response
    if (resonantWords.length > 1) {
      const secondWord = resonantWords[1];
      return `I'm processing the mathematical relationship between "${primaryWord.word}" and "${secondWord.word}". What specifically interests you about these concepts?`;
    }
    
    // Default resonance-based response
    return `I'm analyzing the prime factorization patterns related to "${primaryWord.word}". Could you tell me more about what you'd like to know?`;
  }

  private generateConceptBasedResponse(concepts: string[], primes: Record<number, number>): string {
    const magnitude = PrimeMath.calculateMagnitude(primes);
    const primaryConcept = concepts[0];
    const relatedConcepts = this.embeddingsModel.relationships.get(primaryConcept) || [];
    
    console.log('🎯 Generating response for primary concept:', primaryConcept);
    console.log('🔗 Related concepts:', relatedConcepts);
    
    // Check for greeting patterns
    if (primaryConcept === 'hello' || primaryConcept === 'hi') {
      return "Hello! I'm PrimeBot. How can I help you today?";
    }
    
    // Check for help/assistance patterns
    if (primaryConcept === 'help' || primaryConcept === 'assist') {
      return "I'm here to help! What would you like to know or discuss?";
    }
    
    // Check for gratitude patterns
    if (primaryConcept === 'thanks' || primaryConcept === 'thank') {
      return "You're welcome! I'm glad I could help.";
    }
    
    // Check for positive feedback
    if (primaryConcept === 'good' || primaryConcept === 'great') {
      return "That's wonderful! Is there anything else I can help you with?";
    }
    
    // Check for name/identity questions
    if (primaryConcept === 'name' || concepts.includes('name')) {
      // Check if user mentioned their name in context
      const context = this.humanUser.conversationState.context.join(' ').toLowerCase();
      if (context.includes('alex') || context.includes('my name is')) {
        return "Nice to meet you, Alex! I'm PrimeBot. How can I assist you today?";
      }
      return "I'm PrimeBot, an AI assistant powered by mathematical prime factorization. What's your name?";
    }
    
    // Check for understanding/knowledge requests
    if (primaryConcept === 'understand' || primaryConcept === 'know') {
      return "I process information through mathematical analysis. What would you like me to understand?";
    }
    
    // Check for question patterns
    if (primaryConcept === 'what' || concepts.includes('what')) {
      const context = this.humanUser.conversationState.context.join(' ').toLowerCase();
      if (context.includes('what is my name') || context.includes('my name')) {
        return "Based on our conversation, your name is Alex. Is that correct?";
      }
      return "That's a great question! I'm processing the mathematical patterns to provide you with an answer.";
    }
    
    // Use semantic relationships for contextual responses
    if (relatedConcepts.length > 0) {
      const relatedConcept = relatedConcepts[Math.floor(magnitude) % relatedConcepts.length];
      
      // Create more natural relationship responses
      if (primaryConcept === 'count' && relatedConcepts.includes('number')) {
        return "I see you're working with numbers and counting. How can I help you with mathematical calculations?";
      }
      
      if (primaryConcept === 'play' && relatedConcepts.includes('work')) {
        return "I understand the balance between work and play. What would you like to explore or discuss?";
      }
      
      return `I notice you're interested in ${primaryConcept}. In my understanding, this connects to ${relatedConcept}. What specifically would you like to know?`;
    }
    
    // Enhanced default response with concept awareness
    return `I'm processing the concept of "${primaryConcept}" through my mathematical framework. Could you tell me more about what you'd like to explore?`;
  }

  private generateBasicResponse(primes: Record<number, number>): string {
    const magnitude = PrimeMath.calculateMagnitude(primes);
    const primeCount = Object.keys(primes).length;
    const dominantPrime = Object.entries(primes).sort(([,a], [,b]) => b - a)[0];
    
    // Mathematical analysis-based responses
    if (magnitude > 1000) {
      return "I detect strong mathematical patterns in your message. The prime factorization suggests complex semantic content. How can I help you explore this further?";
    } else if (magnitude > 500) {
      return "I'm analyzing the mathematical structure of your input. The prime resonance indicates meaningful content. What would you like to discuss?";
    } else if (primeCount > 5) {
      return "I notice rich mathematical diversity in the prime factors. This suggests multifaceted meaning. Tell me more about what interests you.";
    } else if (dominantPrime && parseInt(dominantPrime[0]) > 100) {
      return `The dominant prime factor ${dominantPrime[0]} suggests sophisticated semantic content. I'm ready to engage with your ideas.`;
    }
    
    // Contextual responses based on conversation state
    const conversationLength = this.humanUser.conversationState.turnCount;
    if (conversationLength === 1) {
      return "Welcome! I'm PrimeLM, processing your input through mathematical prime factorization. What would you like to explore together?";
    } else if (conversationLength < 5) {
      return "I'm building our conversational context through mathematical analysis. What aspects would you like to delve deeper into?";
    }
    
    // Adaptive responses based on mathematical properties
    const responses = [
      "I'm processing the mathematical relationships in your message. Could you elaborate on what interests you most?",
      "The prime factorization reveals interesting patterns. What specific aspects would you like to explore?",
      "I'm analyzing the semantic-mathematical bridge in your input. How can I assist you further?",
      "The mathematical coherence suggests meaningful content. What would you like to focus on?",
      "I'm translating your input through prime mathematics. What direction shall we take our conversation?"
    ];
    
    return responses[Math.floor(magnitude) % responses.length];
  }

  /**
   * PHASE 3: Enhance response with emotional intelligence
   */
  private enhanceResponseWithEmotionalIntelligence(
    response: string,
    emotionalResponse: any,
    emotionalContext: any
  ): string {
    console.log('❤️ Enhancing response with emotional intelligence...');
    console.log('Emotional strategy:', emotionalResponse.empathyStrategy);
    console.log('Support level:', emotionalResponse.supportLevel);
    console.log('Tonal adjustments:', emotionalResponse.tonalAdjustments);
    
    let enhancedResponse = response;
    
    // Apply tonal adjustments based on emotional context
    const { warmth, formality, enthusiasm, patience } = emotionalResponse.tonalAdjustments;
    
    // High warmth: Add empathetic phrases
    if (warmth > 0.7) {
      if (!enhancedResponse.includes('understand') && !enhancedResponse.includes('feel')) {
        enhancedResponse = `I understand how you feel. ${enhancedResponse}`;
      }
    }
    
    // Low formality: Make more casual
    if (formality < 0.4) {
      enhancedResponse = enhancedResponse.replace(/\. /g, '! ');
    }
    
    // High enthusiasm: Add excitement
    if (enthusiasm > 0.7) {
      if (!enhancedResponse.includes('!')) {
        enhancedResponse = enhancedResponse.replace(/\.$/, '!');
      }
    }
    
    // High patience: Add reassuring language
    if (patience > 0.8) {
      if (emotionalContext.supportNeeded === 'high') {
        enhancedResponse += ' Take your time, and let me know if you need anything else.';
      }
    }
    
    // Apply empathy strategy enhancements
    switch (emotionalResponse.empathyStrategy) {
      case 'emotional_validation':
        if (!enhancedResponse.includes('valid') && !enhancedResponse.includes('understand')) {
          enhancedResponse = `Your feelings are completely valid. ${enhancedResponse}`;
        }
        break;
        
      case 'reassurance_and_safety':
        if (emotionalContext.userEmotion.primary === 'fear' || emotionalContext.userEmotion.primary === 'anxiety') {
          enhancedResponse += ' You\'re safe here to share whatever you\'re feeling.';
        }
        break;
        
      case 'gentle_encouragement':
        if (!enhancedResponse.includes('great') && !enhancedResponse.includes('wonderful')) {
          enhancedResponse = `You\'re doing great by sharing this. ${enhancedResponse}`;
        }
        break;
    }
    
    // Store enhanced response in episodic memory
    this.episodicMemoryLayer.storeEpisode(
      'conversation',
      {
        summary: `Bot responded: "${enhancedResponse}"`,
        details: {
          originalResponse: response,
          emotionalEnhancements: {
            strategy: emotionalResponse.empathyStrategy,
            tonalAdjustments: emotionalResponse.tonalAdjustments
          }
        },
        participants: ['chatbot', 'human'],
        context: 'response_generation'
      },
      emotionalResponse.responseEmotion,
      0.6 // Moderate importance for bot responses
    );
    
    console.log('❤️ Enhanced response:', enhancedResponse);
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
      episodicMemory: {
        totalEpisodes: this.episodicMemoryLayer.getMemoryStats().totalEpisodes,
        personalityTraits: this.episodicMemoryLayer.getPersonalityInsights().traits
      }
    };
  }
}
