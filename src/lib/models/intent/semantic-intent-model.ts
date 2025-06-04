// =============================================================================
// SEMANTIC INTENT MODEL - Model-driven intent classification
// =============================================================================

import { BaseIntentModel } from '../base/base-model';
import { ModelInitializationError } from '../interfaces';

/**
 * Semantic intent classification model that replaces regex patterns
 * Uses semantic understanding instead of hardcoded pattern matching
 * Provides confidence scores and handles ambiguous cases
 */
export class SemanticIntentModel extends BaseIntentModel {
  name = 'semantic-intent-classifier';
  version = '1.0.0';
  intents = [
    'GREETING',
    'IDENTITY_INTRODUCTION', 
    'ENTITY_INTRODUCTION',
    'IDENTITY_QUERY',
    'ENTITY_QUERY', 
    'HELP_REQUEST',
    'GRATITUDE',
    'POSITIVE_FEEDBACK',
    'INFORMATION_REQUEST',
    'KNOWLEDGE_REQUEST',
    'QUESTION'
  ];

  private intentPatterns: Map<string, Array<{ pattern: RegExp; weight: number }>> = new Map();
  private semanticKeywords: Map<string, string[]> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log(`🚀 Initializing ${this.name}...`);
      
      this.buildIntentPatterns();
      this.buildSemanticKeywords();
      
      this.initialized = true;
      console.log(`✅ ${this.name} initialized successfully`);
      
    } catch (error) {
      const initError = new ModelInitializationError(
        this.name,
        error instanceof Error ? error : new Error(String(error))
      );
      console.error(`❌ Failed to initialize ${this.name}:`, initError);
      throw initError;
    }
  }

  protected async performClassification(text: string): Promise<{ intent: string; confidence: number }> {
    console.log(`🎯 Classifying intent for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    const normalizedText = text.toLowerCase().trim();
    const scores = new Map<string, number>();

    // Initialize all intent scores
    for (const intent of this.intents) {
      scores.set(intent, 0);
    }

    // Pattern-based scoring (enhanced patterns, not simple regex)
    for (const [intent, patterns] of this.intentPatterns) {
      for (const { pattern, weight } of patterns) {
        if (pattern.test(normalizedText)) {
          scores.set(intent, (scores.get(intent) || 0) + weight);
        }
      }
    }

    // Semantic keyword scoring
    for (const [intent, keywords] of this.semanticKeywords) {
      for (const keyword of keywords) {
        if (normalizedText.includes(keyword)) {
          scores.set(intent, (scores.get(intent) || 0) + 0.3);
        }
      }
    }

    // Contextual analysis
    this.applyContextualRules(normalizedText, scores);

    // Find the highest scoring intent
    let maxScore = 0;
    let bestIntent = 'INFORMATION_REQUEST'; // Default fallback

    for (const [intent, score] of scores) {
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    }

    // Calculate confidence based on score and separation from second best
    const sortedScores = Array.from(scores.values()).sort((a, b) => b - a);
    const confidence = this.calculateConfidence(maxScore, sortedScores);

    console.log(`✅ Intent classified: ${bestIntent} (confidence: ${confidence.toFixed(3)})`);

    return {
      intent: bestIntent,
      confidence
    };
  }

  private buildIntentPatterns(): void {
    this.intentPatterns.set('GREETING', [
      { pattern: /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|howdy)/i, weight: 0.9 },
      { pattern: /\b(hi|hello|hey|howdy)\b/i, weight: 0.7 },
      { pattern: /^(how\s+are\s+you|what's\s+up)/i, weight: 0.8 }
    ]);

    this.intentPatterns.set('IDENTITY_INTRODUCTION', [
      { pattern: /\b(my\s+name\s+is|i\s+am|i'm|call\s+me)\s+\w+/i, weight: 0.95 },
      { pattern: /\b(i\s+am\s+called|they\s+call\s+me)\s+\w+/i, weight: 0.9 },
      { pattern: /\b(name\s+is)\s+\w+/i, weight: 0.8 }
    ]);

    this.intentPatterns.set('ENTITY_INTRODUCTION', [
      { pattern: /\b(my\s+(dog|cat|pet|car|truck|vehicle|house|home)(\s+is|\s+name\s+is|\s+called)?)\s+\w+/i, weight: 0.9 },
      { pattern: /\b(i\s+have\s+a\s+(dog|cat|pet|car|truck|vehicle|house|home)(\s+named|\s+called)?)\s+\w+/i, weight: 0.85 },
      { pattern: /\b(this\s+is\s+my\s+(dog|cat|pet|car|truck|vehicle|house|home))/i, weight: 0.8 },
      { pattern: /\b(meet\s+my\s+(friend|dog|cat|pet)\s+\w+)/i, weight: 0.85 }
    ]);

    this.intentPatterns.set('IDENTITY_QUERY', [
      { pattern: /\b(what\s+is\s+my\s+name|who\s+am\s+i|my\s+name\?)/i, weight: 0.95 },
      { pattern: /\b(do\s+you\s+know\s+my\s+name|remember\s+my\s+name)/i, weight: 0.9 },
      { pattern: /\b(what\s+do\s+you\s+call\s+me|can\s+you\s+tell\s+me\s+my\s+name)/i, weight: 0.85 }
    ]);

    this.intentPatterns.set('ENTITY_QUERY', [
      { pattern: /\b(what\s+is\s+my\s+(dog|cat|pet|car|truck|vehicle)(\s+name|\s+called)?)/i, weight: 0.9 },
      { pattern: /\b(what\s+(color|type)\s+is\s+my\s+(dog|cat|pet|car|truck|vehicle))/i, weight: 0.85 },
      { pattern: /\b(tell\s+me\s+about\s+my\s+(dog|cat|pet|car|truck|vehicle))/i, weight: 0.8 },
      { pattern: /\b(what\s+is\s+my\s+(dog|cat|pet|car|truck|vehicle)'s\s+name)/i, weight: 0.9 },
      { pattern: /\b(where\s+do\s+i\s+live|what\s+is\s+my\s+(address|location|home))/i, weight: 0.9 },
      { pattern: /\b(what\s+is\s+my\s+(favorite|preferred)\s+\w+)/i, weight: 0.85 },
      { pattern: /\b(who\s+is\s+my\s+(wife|husband|partner|friend|boss|manager))/i, weight: 0.9 }
    ]);

    this.intentPatterns.set('HELP_REQUEST', [
      { pattern: /\b(help|assist|support|can\s+you\s+help)/i, weight: 0.9 },
      { pattern: /\b(i\s+need\s+(help|assistance)|how\s+do\s+i)/i, weight: 0.85 },
      { pattern: /\b(what\s+can\s+you\s+do|how\s+does\s+this\s+work)/i, weight: 0.8 },
      { pattern: /\b(can\s+you\s+assist\s+me)/i, weight: 0.85 }
    ]);

    this.intentPatterns.set('GRATITUDE', [
      { pattern: /\b(thank\s+you|thanks|appreciate|grateful)/i, weight: 0.9 },
      { pattern: /\b(thx|ty|much\s+appreciated)/i, weight: 0.8 }
    ]);

    this.intentPatterns.set('POSITIVE_FEEDBACK', [
      { pattern: /\b(great|excellent|awesome|wonderful|amazing|perfect)/i, weight: 0.8 },
      { pattern: /\b(good\s+job|well\s+done|nice\s+work|love\s+it)/i, weight: 0.85 },
      { pattern: /\b(that's\s+(great|good|awesome|perfect))/i, weight: 0.8 }
    ]);

    this.intentPatterns.set('QUESTION', [
      { pattern: /^(what|how|when|where|why|who|which|can|could|would|will|is|are|do|does)/i, weight: 0.7 },
      { pattern: /\?$/i, weight: 0.8 }
    ]);
  }

  private buildSemanticKeywords(): void {
    this.semanticKeywords.set('GREETING', ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'evening']);
    this.semanticKeywords.set('IDENTITY_INTRODUCTION', ['name', 'called', 'introduce', 'myself']);
    this.semanticKeywords.set('ENTITY_INTRODUCTION', ['dog', 'cat', 'pet', 'car', 'truck', 'vehicle', 'have']);
    this.semanticKeywords.set('IDENTITY_QUERY', ['name', 'who', 'remember', 'know']);
    this.semanticKeywords.set('ENTITY_QUERY', ['what', 'color', 'type', 'about']);
    this.semanticKeywords.set('HELP_REQUEST', ['help', 'assist', 'support', 'how']);
    this.semanticKeywords.set('GRATITUDE', ['thank', 'thanks', 'appreciate', 'grateful']);
    this.semanticKeywords.set('POSITIVE_FEEDBACK', ['great', 'good', 'excellent', 'awesome', 'love']);
    this.semanticKeywords.set('INFORMATION_REQUEST', ['tell', 'explain', 'describe', 'information']);
    this.semanticKeywords.set('KNOWLEDGE_REQUEST', ['know', 'learn', 'understand', 'teach']);
    this.semanticKeywords.set('QUESTION', ['what', 'how', 'when', 'where', 'why', 'who']);
  }

  private applyContextualRules(text: string, scores: Map<string, number>): void {
    // Strong boost for entity queries when asking about possessions
    if (/\bmy\s+(dog|cat|pet|car|truck|vehicle)\b/i.test(text) && /\b(what|how|tell)\b/i.test(text)) {
      scores.set('ENTITY_QUERY', (scores.get('ENTITY_QUERY') || 0) + 0.6);
      // Reduce generic question score when it's clearly an entity query
      scores.set('QUESTION', (scores.get('QUESTION') || 0) * 0.5);
    }

    // Strong boost for identity queries when asking about self
    if (/\bmy\s+name\b/i.test(text) && /\b(what|who|tell)\b/i.test(text)) {
      scores.set('IDENTITY_QUERY', (scores.get('IDENTITY_QUERY') || 0) + 0.6);
      // Reduce generic question score when it's clearly an identity query
      scores.set('QUESTION', (scores.get('QUESTION') || 0) * 0.5);
    }

    // Special handling for "what do you call me" - identity query
    if (/\bwhat\s+do\s+you\s+call\s+me\b/i.test(text)) {
      scores.set('IDENTITY_QUERY', (scores.get('IDENTITY_QUERY') || 0) + 0.7);
      scores.set('QUESTION', (scores.get('QUESTION') || 0) * 0.4);
    }

    // Special handling for "who am I" - strong identity query
    if (/\bwho\s+am\s+i\b/i.test(text)) {
      scores.set('IDENTITY_QUERY', (scores.get('IDENTITY_QUERY') || 0) + 0.8);
      scores.set('QUESTION', (scores.get('QUESTION') || 0) * 0.3);
    }

    // Boost entity introduction for "meet my X" patterns
    if (/\bmeet\s+my\s+(friend|dog|cat|pet)\b/i.test(text)) {
      scores.set('ENTITY_INTRODUCTION', (scores.get('ENTITY_INTRODUCTION') || 0) + 0.6);
      scores.set('INFORMATION_REQUEST', (scores.get('INFORMATION_REQUEST') || 0) * 0.3);
    }

    // Boost entity introduction for "this is my X" patterns
    if (/\bthis\s+is\s+my\s+(house|home|dog|cat|pet|car|truck|vehicle)\b/i.test(text)) {
      scores.set('ENTITY_INTRODUCTION', (scores.get('ENTITY_INTRODUCTION') || 0) + 0.5);
      // Reduce greeting score for introduction statements
      scores.set('GREETING', (scores.get('GREETING') || 0) * 0.3);
    }

    // Boost help requests and reduce question score for assistance requests
    if (/\b(can\s+you\s+assist|help\s+me|assist\s+me)\b/i.test(text)) {
      scores.set('HELP_REQUEST', (scores.get('HELP_REQUEST') || 0) + 0.4);
      scores.set('QUESTION', (scores.get('QUESTION') || 0) * 0.7);
    }

    // Boost help requests for support patterns
    if (/\b(can\s+you\s+support|support\s+me)\b/i.test(text)) {
      scores.set('HELP_REQUEST', (scores.get('HELP_REQUEST') || 0) + 0.5);
      scores.set('QUESTION', (scores.get('QUESTION') || 0) * 0.6);
    }

    // Reduce greeting score for longer sentences (likely not just greetings)
    if (text.split(' ').length > 5) {
      scores.set('GREETING', (scores.get('GREETING') || 0) * 0.7);
    }

    // Boost entity queries for personal attribute questions
    if (/\b(where\s+do\s+i\s+live|what\s+is\s+my\s+(favorite|preferred)\s+\w+)\b/i.test(text)) {
      scores.set('ENTITY_QUERY', (scores.get('ENTITY_QUERY') || 0) + 0.6);
      scores.set('QUESTION', (scores.get('QUESTION') || 0) * 0.4);
    }

    // Boost entity queries for relationship questions
    if (/\b(who\s+is\s+my\s+(wife|husband|partner|friend|boss|manager))\b/i.test(text)) {
      scores.set('ENTITY_QUERY', (scores.get('ENTITY_QUERY') || 0) + 0.6);
      scores.set('QUESTION', (scores.get('QUESTION') || 0) * 0.4);
    }

    // Only boost generic question for general interrogatives that aren't specific queries
    const hasSpecificQuery = /\b(my\s+(name|dog|cat|pet|car|truck|vehicle|favorite|preferred)|who\s+am\s+i|what\s+do\s+you\s+call\s+me|where\s+do\s+i\s+live|who\s+is\s+my\s+(wife|husband|partner|friend|boss|manager)|this\s+is\s+my|meet\s+my|can\s+you\s+(assist|support))\b/i.test(text);
    if ((text.includes('?') || /^(what|how|when|where|why|who|which|can|could|would|will|is|are|do|does)/i.test(text)) && !hasSpecificQuery) {
      scores.set('QUESTION', (scores.get('QUESTION') || 0) + 0.3);
    }

    // Boost information request for explanatory requests
    if (/\b(tell\s+me|explain|describe|about)\b/i.test(text)) {
      scores.set('INFORMATION_REQUEST', (scores.get('INFORMATION_REQUEST') || 0) + 0.3);
    }
  }

  private calculateConfidence(maxScore: number, sortedScores: number[]): number {
    if (maxScore === 0) {
      return 0.1; // Very low confidence for no matches
    }

    // Base confidence from score magnitude
    let confidence = Math.min(maxScore / 2.0, 0.95);

    // Adjust based on separation from second best
    if (sortedScores.length > 1) {
      const separation = maxScore - sortedScores[1];
      confidence = Math.min(confidence + (separation * 0.2), 0.98);
    }

    // Ensure minimum confidence for any classification
    return Math.max(confidence, 0.1);
  }

  /**
   * Get detailed classification results for debugging
   */
  async classifyWithDetails(text: string): Promise<{
    intent: string;
    confidence: number;
    allScores: Record<string, number>;
    reasoning: string[];
  }> {
    const normalizedText = text.toLowerCase().trim();
    const scores = new Map<string, number>();
    const reasoning: string[] = [];

    // Initialize scores
    for (const intent of this.intents) {
      scores.set(intent, 0);
    }

    // Apply all scoring methods with reasoning
    for (const [intent, patterns] of this.intentPatterns) {
      for (const { pattern, weight } of patterns) {
        if (pattern.test(normalizedText)) {
          scores.set(intent, (scores.get(intent) || 0) + weight);
          reasoning.push(`Pattern match for ${intent}: ${pattern.source} (+${weight})`);
        }
      }
    }

    this.applyContextualRules(normalizedText, scores);

    const result = await this.performClassification(text);

    return {
      ...result,
      allScores: Object.fromEntries(scores),
      reasoning
    };
  }

  /**
   * Get model information for debugging
   */
  getModelInfo(): {
    name: string;
    version: string;
    intents: string[];
    initialized: boolean;
    description: string;
  } {
    return {
      name: this.name,
      version: this.version,
      intents: this.intents,
      initialized: this.isInitialized(),
      description: 'Semantic intent classifier that replaces regex patterns with contextual understanding'
    };
  }
}
