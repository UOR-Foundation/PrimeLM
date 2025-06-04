// =============================================================================
// SEMANTIC EMOTION MODEL - Model-driven emotion detection
// =============================================================================

import { BaseEmotionModel } from '../base/base-model';
import { ModelInitializationError } from '../interfaces';

/**
 * Semantic emotion detection model that replaces keyword-based analysis
 * Uses contextual understanding and linguistic patterns for emotion classification
 * Provides valence, arousal, and confidence scores
 */
export class SemanticEmotionModel extends BaseEmotionModel {
  name = 'semantic-emotion-classifier';
  version = '1.0.0';
  emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];

  private emotionPatterns: Map<string, Array<{ pattern: RegExp; weight: number }>> = new Map();
  private emotionKeywords: Map<string, Array<{ word: string; weight: number }>> = new Map();
  private contextualModifiers: Map<string, number> = new Map();
  private valenceMap: Map<string, number> = new Map();
  private arousalMap: Map<string, number> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log(`🚀 Initializing ${this.name}...`);
      
      this.buildEmotionPatterns();
      this.buildEmotionKeywords();
      this.buildContextualModifiers();
      this.buildValenceArousalMaps();
      
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

  protected async performAnalysis(text: string): Promise<{
    emotion: string;
    valence: number;
    arousal: number;
    confidence: number;
  }> {
    console.log(`😊 Analyzing emotion for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    const normalizedText = text.toLowerCase().trim();
    const scores = new Map<string, number>();

    // Initialize emotion scores
    for (const emotion of this.emotions) {
      scores.set(emotion, 0);
    }

    // Pattern-based scoring
    this.scoreByPatterns(normalizedText, scores);
    
    // Keyword-based scoring
    this.scoreByKeywords(normalizedText, scores);
    
    // Apply contextual modifiers
    this.applyContextualModifiers(normalizedText, scores);
    
    // Apply linguistic analysis
    this.applyLinguisticAnalysis(normalizedText, scores);

    // Find the highest scoring emotion
    let maxScore = 0;
    let bestEmotion = 'neutral';

    for (const [emotion, score] of scores) {
      if (score > maxScore) {
        maxScore = score;
        bestEmotion = emotion;
      }
    }

    // Calculate confidence
    const sortedScores = Array.from(scores.values()).sort((a, b) => b - a);
    const confidence = this.calculateConfidence(maxScore, sortedScores);

    // Get valence and arousal
    const valence = this.valenceMap.get(bestEmotion) || 0;
    const arousal = this.arousalMap.get(bestEmotion) || 0.5;

    console.log(`✅ Emotion detected: ${bestEmotion} (valence: ${valence}, arousal: ${arousal}, confidence: ${confidence.toFixed(3)})`);

    return {
      emotion: bestEmotion,
      valence,
      arousal,
      confidence
    };
  }

  private buildEmotionPatterns(): void {
    // Joy patterns
    this.emotionPatterns.set('joy', [
      { pattern: /\b(i\s+am\s+happy|feeling\s+great|so\s+excited|love\s+it|amazing|wonderful)/i, weight: 0.9 },
      { pattern: /\b(yay|woohoo|awesome|fantastic|brilliant|excellent)/i, weight: 0.8 },
      { pattern: /\b(smile|laugh|cheerful|delighted|thrilled)/i, weight: 0.7 },
      { pattern: /[!]{2,}/, weight: 0.3 }, // Multiple exclamation marks
      { pattern: /😊|😄|😃|🎉|❤️/, weight: 0.8 } // Positive emojis
    ]);

    // Sadness patterns
    this.emotionPatterns.set('sadness', [
      { pattern: /\b(i\s+am\s+sad|feeling\s+down|so\s+depressed|heartbroken|devastated)/i, weight: 0.9 },
      { pattern: /\b(cry|tears|weep|mourn|grief|sorrow)/i, weight: 0.8 },
      { pattern: /\b(lonely|empty|hopeless|miserable|gloomy)/i, weight: 0.7 },
      { pattern: /😢|😭|💔|😞|☹️/, weight: 0.8 } // Sad emojis
    ]);

    // Anger patterns
    this.emotionPatterns.set('anger', [
      { pattern: /\b(i\s+am\s+angry|so\s+mad|furious|outraged|livid)/i, weight: 0.9 },
      { pattern: /\b(hate|stupid|idiot|damn|hell|pissed)/i, weight: 0.8 },
      { pattern: /\b(annoyed|frustrated|irritated|fed\s+up)/i, weight: 0.7 },
      { pattern: /😠|😡|🤬|💢/, weight: 0.8 } // Angry emojis
    ]);

    // Fear patterns
    this.emotionPatterns.set('fear', [
      { pattern: /\b(i\s+am\s+scared|so\s+afraid|terrified|frightened|worried)/i, weight: 0.9 },
      { pattern: /\b(panic|anxiety|nervous|concerned|apprehensive)/i, weight: 0.8 },
      { pattern: /\b(what\s+if|scared\s+that|worried\s+about)/i, weight: 0.7 },
      { pattern: /😨|😰|😱|😟|😧/, weight: 0.8 } // Fear emojis
    ]);

    // Surprise patterns
    this.emotionPatterns.set('surprise', [
      { pattern: /\b(wow|omg|oh\s+my|can't\s+believe|unexpected|shocking)/i, weight: 0.8 },
      { pattern: /\b(surprised|amazed|astonished|stunned)/i, weight: 0.7 },
      { pattern: /\b(what\?!|really\?!|no\s+way)/i, weight: 0.6 },
      { pattern: /😲|😮|🤯|😯/, weight: 0.8 } // Surprise emojis
    ]);

    // Disgust patterns
    this.emotionPatterns.set('disgust', [
      { pattern: /\b(disgusting|gross|yuck|eww|revolting|repulsive)/i, weight: 0.9 },
      { pattern: /\b(sick|nauseous|vomit|awful|terrible)/i, weight: 0.7 },
      { pattern: /\b(can't\s+stand|makes\s+me\s+sick)/i, weight: 0.8 },
      { pattern: /🤢|🤮|😷|🤧/, weight: 0.8 } // Disgust emojis
    ]);
  }

  private buildEmotionKeywords(): void {
    this.emotionKeywords.set('joy', [
      { word: 'happy', weight: 0.8 },
      { word: 'joy', weight: 0.9 },
      { word: 'excited', weight: 0.7 },
      { word: 'love', weight: 0.6 },
      { word: 'great', weight: 0.5 },
      { word: 'good', weight: 0.4 },
      { word: 'awesome', weight: 0.7 },
      { word: 'wonderful', weight: 0.7 },
      { word: 'amazing', weight: 0.7 },
      { word: 'fantastic', weight: 0.7 }
    ]);

    this.emotionKeywords.set('sadness', [
      { word: 'sad', weight: 0.8 },
      { word: 'depressed', weight: 0.9 },
      { word: 'down', weight: 0.6 },
      { word: 'blue', weight: 0.5 },
      { word: 'unhappy', weight: 0.7 },
      { word: 'miserable', weight: 0.8 },
      { word: 'gloomy', weight: 0.6 },
      { word: 'heartbroken', weight: 0.9 }
    ]);

    this.emotionKeywords.set('anger', [
      { word: 'angry', weight: 0.8 },
      { word: 'mad', weight: 0.7 },
      { word: 'furious', weight: 0.9 },
      { word: 'annoyed', weight: 0.6 },
      { word: 'frustrated', weight: 0.7 },
      { word: 'irritated', weight: 0.6 },
      { word: 'hate', weight: 0.8 },
      { word: 'rage', weight: 0.9 }
    ]);

    this.emotionKeywords.set('fear', [
      { word: 'scared', weight: 0.8 },
      { word: 'afraid', weight: 0.8 },
      { word: 'terrified', weight: 0.9 },
      { word: 'worried', weight: 0.7 },
      { word: 'anxious', weight: 0.7 },
      { word: 'nervous', weight: 0.6 },
      { word: 'panic', weight: 0.8 },
      { word: 'frightened', weight: 0.8 }
    ]);

    this.emotionKeywords.set('surprise', [
      { word: 'surprised', weight: 0.8 },
      { word: 'shocked', weight: 0.8 },
      { word: 'amazed', weight: 0.7 },
      { word: 'astonished', weight: 0.8 },
      { word: 'unexpected', weight: 0.6 },
      { word: 'wow', weight: 0.6 }
    ]);

    this.emotionKeywords.set('disgust', [
      { word: 'disgusting', weight: 0.9 },
      { word: 'gross', weight: 0.8 },
      { word: 'revolting', weight: 0.9 },
      { word: 'awful', weight: 0.6 },
      { word: 'terrible', weight: 0.6 },
      { word: 'sick', weight: 0.7 }
    ]);

    this.emotionKeywords.set('neutral', [
      { word: 'okay', weight: 0.5 },
      { word: 'fine', weight: 0.5 },
      { word: 'normal', weight: 0.6 },
      { word: 'regular', weight: 0.5 }
    ]);
  }

  private buildContextualModifiers(): void {
    // Intensifiers
    this.contextualModifiers.set('very', 1.3);
    this.contextualModifiers.set('extremely', 1.5);
    this.contextualModifiers.set('really', 1.2);
    this.contextualModifiers.set('so', 1.2);
    this.contextualModifiers.set('incredibly', 1.4);
    this.contextualModifiers.set('absolutely', 1.3);

    // Diminishers
    this.contextualModifiers.set('slightly', 0.7);
    this.contextualModifiers.set('somewhat', 0.8);
    this.contextualModifiers.set('a bit', 0.7);
    this.contextualModifiers.set('kind of', 0.8);
    this.contextualModifiers.set('sort of', 0.8);

    // Negations
    this.contextualModifiers.set('not', -1);
    this.contextualModifiers.set('never', -1);
    this.contextualModifiers.set('no', -0.8);
    this.contextualModifiers.set("don't", -1);
    this.contextualModifiers.set("can't", -1);
    this.contextualModifiers.set("won't", -1);
  }

  private buildValenceArousalMaps(): void {
    // Valence: -1 (negative) to 1 (positive)
    this.valenceMap.set('joy', 0.8);
    this.valenceMap.set('sadness', -0.7);
    this.valenceMap.set('anger', -0.8);
    this.valenceMap.set('fear', -0.6);
    this.valenceMap.set('surprise', 0.3);
    this.valenceMap.set('disgust', -0.5);
    this.valenceMap.set('neutral', 0);

    // Arousal: 0 (calm) to 1 (excited)
    this.arousalMap.set('joy', 0.8);
    this.arousalMap.set('sadness', 0.3);
    this.arousalMap.set('anger', 0.9);
    this.arousalMap.set('fear', 0.8);
    this.arousalMap.set('surprise', 0.9);
    this.arousalMap.set('disgust', 0.5);
    this.arousalMap.set('neutral', 0.5);
  }

  private scoreByPatterns(text: string, scores: Map<string, number>): void {
    for (const [emotion, patterns] of this.emotionPatterns) {
      for (const { pattern, weight } of patterns) {
        if (pattern.test(text)) {
          scores.set(emotion, (scores.get(emotion) || 0) + weight);
        }
      }
    }
  }

  private scoreByKeywords(text: string, scores: Map<string, number>): void {
    const words = text.split(/\s+/);
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      
      for (const [emotion, keywords] of this.emotionKeywords) {
        for (const { word: keyword, weight } of keywords) {
          if (cleanWord === keyword) {
            scores.set(emotion, (scores.get(emotion) || 0) + weight);
          }
        }
      }
    }
  }

  private applyContextualModifiers(text: string, scores: Map<string, number>): void {
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      const modifier = this.contextualModifiers.get(word);
      
      if (modifier !== undefined) {
        // Apply modifier to nearby emotion words
        const contextWindow = 3;
        for (let j = Math.max(0, i - contextWindow); j < Math.min(words.length, i + contextWindow + 1); j++) {
          if (j === i) continue;
          
          const contextWord = words[j].replace(/[^\w]/g, '').toLowerCase();
          
          // Check if this word is an emotion keyword
          for (const [emotion, keywords] of this.emotionKeywords) {
            for (const { word: keyword } of keywords) {
              if (contextWord === keyword) {
                const currentScore = scores.get(emotion) || 0;
                if (modifier < 0) {
                  // Negation - reduce score significantly
                  scores.set(emotion, currentScore * 0.2);
                } else {
                  // Intensifier/diminisher
                  scores.set(emotion, currentScore * modifier);
                }
              }
            }
          }
        }
      }
    }
  }

  private applyLinguisticAnalysis(text: string, scores: Map<string, number>): void {
    // Question marks might indicate uncertainty or concern
    if (text.includes('?')) {
      scores.set('fear', (scores.get('fear') || 0) + 0.2);
      scores.set('surprise', (scores.get('surprise') || 0) + 0.1);
    }

    // Multiple exclamation marks indicate high arousal
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 1) {
      // Boost high-arousal emotions
      scores.set('joy', (scores.get('joy') || 0) + 0.3);
      scores.set('anger', (scores.get('anger') || 0) + 0.3);
      scores.set('surprise', (scores.get('surprise') || 0) + 0.3);
    }

    // ALL CAPS might indicate strong emotion
    const capsWords = text.match(/\b[A-Z]{2,}\b/g);
    if (capsWords && capsWords.length > 0) {
      scores.set('anger', (scores.get('anger') || 0) + 0.4);
      scores.set('surprise', (scores.get('surprise') || 0) + 0.2);
    }

    // Repetitive letters (e.g., "sooooo") indicate emphasis
    if (/(.)\1{2,}/.test(text)) {
      // Boost the current highest emotion
      let maxEmotion = 'neutral';
      let maxScore = 0;
      for (const [emotion, score] of scores) {
        if (score > maxScore) {
          maxScore = score;
          maxEmotion = emotion;
        }
      }
      scores.set(maxEmotion, maxScore + 0.3);
    }
  }

  private calculateConfidence(maxScore: number, sortedScores: number[]): number {
    if (maxScore === 0) {
      return 0.1; // Very low confidence for no emotional indicators
    }

    // Base confidence from score magnitude
    let confidence = Math.min(maxScore / 2.0, 0.95);

    // Adjust based on separation from second best
    if (sortedScores.length > 1) {
      const separation = maxScore - sortedScores[1];
      confidence = Math.min(confidence + (separation * 0.15), 0.98);
    }

    // Ensure minimum confidence
    return Math.max(confidence, 0.1);
  }

  /**
   * Analyze emotion with detailed breakdown for debugging
   */
  async analyzeWithDetails(text: string): Promise<{
    emotion: string;
    valence: number;
    arousal: number;
    confidence: number;
    allScores: Record<string, number>;
    reasoning: string[];
  }> {
    const normalizedText = text.toLowerCase().trim();
    const scores = new Map<string, number>();
    const reasoning: string[] = [];

    // Initialize scores
    for (const emotion of this.emotions) {
      scores.set(emotion, 0);
    }

    // Apply all scoring methods with reasoning
    this.scoreByPatterns(normalizedText, scores);
    this.scoreByKeywords(normalizedText, scores);
    this.applyContextualModifiers(normalizedText, scores);
    this.applyLinguisticAnalysis(normalizedText, scores);

    // Add reasoning for significant scores
    for (const [emotion, score] of scores) {
      if (score > 0.3) {
        reasoning.push(`${emotion}: ${score.toFixed(2)} (significant indicators found)`);
      }
    }

    const result = await this.performAnalysis(text);

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
    emotions: string[];
    initialized: boolean;
    description: string;
  } {
    return {
      name: this.name,
      version: this.version,
      emotions: this.emotions,
      initialized: this.isInitialized(),
      description: 'Semantic emotion classifier that replaces keyword-based analysis with contextual understanding'
    };
  }
}
