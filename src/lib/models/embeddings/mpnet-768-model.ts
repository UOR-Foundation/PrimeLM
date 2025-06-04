// =============================================================================
// MPNET 768-DIMENSIONAL EMBEDDINGS MODEL - As specified in PrimeLM-Task1.md
// =============================================================================

import { pipeline } from '@xenova/transformers';
import { BaseEmbeddingsModel } from '../base/base-model';
import { ModelInitializationError } from '../interfaces';

/**
 * MPNet embeddings model providing 768-dimensional semantic representations
 * Uses the sentence-transformers/all-mpnet-base-v2 model as specified in PrimeLM-Task1.md
 * Provides enhanced semantic understanding for prime factorizations
 */
export class MPNet768EmbeddingsModel extends BaseEmbeddingsModel {
  name = 'sentence-transformers/all-mpnet-base-v2';
  version = '1.0.0';
  dimensions = 768;
  
  private pipeline: any = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log(`🚀 Initializing ${this.name}...`);
      
      this.pipeline = await pipeline('feature-extraction', this.name);
      
      if (!this.pipeline) {
        throw new Error(`Failed to load pipeline for ${this.name}`);
      }

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

  protected async performEncoding(text: string): Promise<number[]> {
    if (!this.pipeline) {
      throw new Error(`Pipeline not available for ${this.name}`);
    }

    try {
      console.log(`🔤 Encoding text with ${this.name}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
      const result = await this.pipeline(text, {
        pooling: 'mean',
        normalize: true
      });
      
      const embeddings = Array.from(result.data) as number[];
      
      console.log(`✅ Generated ${embeddings.length}-dimensional embedding`);
      
      return embeddings;
      
    } catch (error) {
      throw new Error(`Encoding failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get model information for debugging
   */
  getModelInfo(): {
    name: string;
    version: string;
    dimensions: number;
    initialized: boolean;
    description: string;
  } {
    return {
      name: this.name,
      version: this.version,
      dimensions: this.dimensions,
      initialized: this.isInitialized(),
      description: 'Enhanced 768-dimensional sentence transformer for rich semantic representations'
    };
  }

  /**
   * Batch encode multiple texts for efficiency
   */
  async encodeBatch(texts: string[]): Promise<number[][]> {
    this.ensureInitialized();
    
    if (!texts || texts.length === 0) {
      return [];
    }

    // Validate all inputs
    for (let i = 0; i < texts.length; i++) {
      this.validateInput(texts[i], `batch encoding item ${i}`);
    }

    return this.safeModelOperation('batch encode', async () => {
      const results: number[][] = [];
      
      // Process in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(text => this.performEncoding(text))
        );
        results.push(...batchResults);
      }
      
      return results;
    });
  }

  /**
   * Calculate semantic similarity between two texts
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    const [embedding1, embedding2] = await Promise.all([
      this.encode(text1),
      this.encode(text2)
    ]);

    return this.cosineSimilarity(embedding1, embedding2);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Find most similar texts from a collection
   */
  async findMostSimilar(
    queryText: string, 
    candidateTexts: string[], 
    topK: number = 5
  ): Promise<Array<{ text: string; similarity: number; index: number }>> {
    const queryEmbedding = await this.encode(queryText);
    const candidateEmbeddings = await this.encodeBatch(candidateTexts);

    const similarities = candidateEmbeddings.map((embedding, index) => ({
      text: candidateTexts[index],
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
      index
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}
