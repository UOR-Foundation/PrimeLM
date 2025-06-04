// =============================================================================
// HUGGINGFACE EMOTION MODEL - Real transformer-based emotion detection
// =============================================================================

import { pipeline } from '@xenova/transformers';
import { BaseEmotionModel } from '../base/base-model';
import { ModelInitializationError } from '../interfaces';

/**
 * HuggingFace transformer-based emotion detection model
 * Uses actual neural networks instead of keyword matching
 * Provides true semantic understanding through pre-trained models
 */
export class HuggingFaceEmotionModel extends BaseEmotionModel {
  name: string;
  version = '1.0.0';
  emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'];
  
  private pipeline: any = null;

  constructor(modelName: string = 'j-hartmann/emotion-english-distilroberta-base') {
    super();
    this.name = modelName;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log(`🚀 Initializing HuggingFace emotion model ${this.name}...`);
      this.pipeline = await pipeline('text-classification', this.name);
      
      if (!this.pipeline) {
        throw new Error(`Failed to initialize emotion model: ${this.name}`);
      }
      
      this.initialized = true;
      console.log(`✅ HuggingFace emotion model ${this.name} initialized successfully`);
      
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
    console.log(`😊 Analyzing emotion with HuggingFace model: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    if (!text || text.trim().length === 0) {
      return {
        emotion: 'neutral',
        valence: 0,
        arousal: 0,
        confidence: 0
      };
    }

    try {
      const result = await this.pipeline(text);
      const topEmotion = result[0];
      
      const emotion = topEmotion.label.toLowerCase();
      const confidence = topEmotion.score;
      const valence = this.calculateValence(emotion);
      const arousal = this.calculateArousal(emotion);

      console.log(`✅ Emotion analyzed: ${emotion} (confidence: ${confidence.toFixed(3)}, valence: ${valence.toFixed(2)}, arousal: ${arousal.toFixed(2)})`);
      
      return {
        emotion,
        valence,
        arousal,
        confidence
      };
    } catch (error) {
      console.error(`❌ Emotion analysis failed:`, error);
      throw new Error(`Emotion analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private calculateValence(emotion: string): number {
    const valenceMap: Record<string, number> = {
      'joy': 0.8,
      'surprise': 0.3,
      'sadness': -0.7,
      'anger': -0.8,
      'fear': -0.6,
      'disgust': -0.5,
      'neutral': 0.0
    };
    return valenceMap[emotion.toLowerCase()] || 0;
  }

  private calculateArousal(emotion: string): number {
    const arousalMap: Record<string, number> = {
      'joy': 0.8,
      'surprise': 0.9,
      'anger': 0.9,
      'fear': 0.8,
      'sadness': 0.3,
      'disgust': 0.5,
      'neutral': 0.5
    };
    return arousalMap[emotion.toLowerCase()] || 0.5;
  }

  /**
   * Get detailed analysis results for debugging
   */
  async analyzeWithDetails(text: string): Promise<{
    emotion: string;
    valence: number;
    arousal: number;
    confidence: number;
    modelOutput: any;
    reasoning: string[];
  }> {
    const modelResult = await this.pipeline(text);
    const analysisResult = await this.performAnalysis(text);
    
    return {
      emotion: analysisResult.emotion,
      valence: analysisResult.valence,
      arousal: analysisResult.arousal,
      confidence: analysisResult.confidence,
      modelOutput: modelResult,
      reasoning: [`HuggingFace emotion model detected ${analysisResult.emotion} with ${analysisResult.confidence.toFixed(3)} confidence`]
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
      description: 'HuggingFace transformer-based emotion classifier using real neural networks'
    };
  }
}
