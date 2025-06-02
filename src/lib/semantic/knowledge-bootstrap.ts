// =============================================================================
// KNOWLEDGE BOOTSTRAP MODULE
// =============================================================================

export interface VocabularyEntry {
  word: string;
  embedding: number[];
  primeFactors: Record<number, number>;
  similarWords: string[];
}

export interface KnowledgeBase {
  vocabulary: Map<string, VocabularyEntry>;
  semanticClusters: Map<string, string[]>;
  conceptEmbeddings: Map<string, number[]>;
  vocabularyPrimes: Map<string, Record<number, number>>;
}

export class KnowledgeBootstrap {
  private embeddingPipeline: any;

  constructor(embeddingPipeline: any) {
    this.embeddingPipeline = embeddingPipeline;
  }

  async bootstrapFromTokenizer(): Promise<KnowledgeBase> {
    console.log('🔧 Bootstrapping chatbot knowledge from tokenizer...');
    
    try {
      // Step 1: Extract vocabulary from tokenizer
      const vocabulary = await this.extractTokenizerVocabulary();
      console.log(`📚 Extracted ${vocabulary.length} vocabulary words`);
      
      // Step 2: Generate embeddings for vocabulary
      const vocabularyEmbeddings = await this.generateVocabularyEmbeddings(vocabulary);
      console.log(`🧠 Generated embeddings for ${vocabularyEmbeddings.size} words`);
      
      // Step 3: Build semantic clusters
      const semanticClusters = this.buildSemanticClusters(vocabularyEmbeddings);
      console.log(`🔗 Built semantic clusters for ${semanticClusters.size} concepts`);
      
      // Step 4: Create knowledge base
      const knowledgeBase = this.createKnowledgeBase(vocabularyEmbeddings, semanticClusters);
      console.log('✅ Knowledge base bootstrap complete');
      
      return knowledgeBase;
      
    } catch (error) {
      console.error('❌ Knowledge bootstrap failed:', error);
      throw new Error(`Knowledge bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async extractTokenizerVocabulary(): Promise<string[]> {
    console.log('🔍 Attempting to extract tokenizer vocabulary...');
    
    // Try multiple ways to access tokenizer vocabulary
    const tokenizer = this.embeddingPipeline.tokenizer;
    console.log('Tokenizer available:', !!tokenizer);
    
    if (!tokenizer) {
      throw new Error('Tokenizer not available in embedding pipeline');
    }
    
    console.log('Tokenizer properties:', Object.keys(tokenizer));
    
    // For BERT-style tokenizers, we need to access the vocabulary differently
    let vocab: string[] | null = null;
    
    // Try accessing the actual vocabulary words (not token IDs)
    if (tokenizer.model && tokenizer.model.vocab) {
      const vocabObj = tokenizer.model.vocab;
      console.log('Vocab object type:', typeof vocabObj);
      console.log('Vocab object keys sample:', Object.keys(vocabObj).slice(0, 20));
      
      // Check if this is a token ID -> word mapping or word -> token ID mapping
      const firstKey = Object.keys(vocabObj)[0];
      const firstValue = vocabObj[firstKey];
      console.log('First vocab entry:', firstKey, '->', firstValue);
      
      if (typeof firstValue === 'number') {
        // This is word -> token ID mapping, use the keys (words)
        vocab = Object.keys(vocabObj);
        console.log('Found word->ID mapping, using keys as vocabulary');
      } else if (typeof firstKey === 'string' && /^\d+$/.test(firstKey)) {
        // This is a numeric tokenizer (token ID -> word mapping)
        // Extract the values (actual words) instead of keys (token IDs)
        vocab = Object.values(vocabObj) as string[];
        console.log('Found ID->word mapping, using values as vocabulary');
      } else {
        vocab = Object.keys(vocabObj);
        console.log('Using keys as vocabulary (default)');
      }
      
      console.log('Extracted vocab length:', vocab.length);
      console.log('Sample vocab words:', vocab.slice(0, 20));
    } else if (tokenizer.vocab) {
      const vocabObj = tokenizer.vocab;
      const firstKey = Object.keys(vocabObj)[0];
      
      if (typeof firstKey === 'string' && /^\d+$/.test(firstKey)) {
        // Numeric keys, use values
        vocab = Object.values(vocabObj) as string[];
        console.log('Found vocab via tokenizer.vocab (ID->word):', vocab.length);
      } else {
        // String keys, use keys
        vocab = Object.keys(vocabObj);
        console.log('Found vocab via tokenizer.vocab (word->ID):', vocab.length);
      }
    } else if (tokenizer.getVocab) {
      const vocabObj = tokenizer.getVocab();
      const firstKey = Object.keys(vocabObj)[0];
      
      if (typeof firstKey === 'string' && /^\d+$/.test(firstKey)) {
        // Numeric keys, use values
        vocab = Object.values(vocabObj) as string[];
        console.log('Found vocab via tokenizer.getVocab() (ID->word):', vocab.length);
      } else {
        // String keys, use keys
        vocab = Object.keys(vocabObj);
        console.log('Found vocab via tokenizer.getVocab() (word->ID):', vocab.length);
      }
    } else {
      throw new Error('Unable to access tokenizer vocabulary - no known vocabulary access method found');
    }
    
    if (!vocab || vocab.length === 0) {
      throw new Error('Tokenizer vocabulary is empty or null');
    }
    
    const filtered = this.filterMeaningfulWords(vocab);
    console.log('Filtered vocabulary:', filtered.length);
    
    if (filtered.length === 0) {
      throw new Error('No meaningful words found in tokenizer vocabulary after filtering');
    }
    
    return filtered;
  }

  private filterMeaningfulWords(vocab: string[]): string[] {
    console.log('🔍 Filtering vocabulary from', vocab.length, 'words');
    console.log('Sample vocab words:', vocab.slice(0, 20));
    
    const filtered = vocab
      .filter(word => {
        // Filter out special tokens, fragments, and non-words
        if (word.startsWith('[') || word.startsWith('<') || word.startsWith('##')) return false;
        if (word.length < 2 || word.length > 15) return false;
        if (/^\d+$/.test(word)) return false; // Pure numbers
        if (!/^[a-zA-Z]+$/.test(word)) return false; // Only letters
        return true;
      })
      .slice(0, 800); // Limit to manageable size
    
    // If filtering results in too few words, be more lenient
    if (filtered.length < 10 && vocab.length > 0) {
      console.log('⚠️ Strict filtering yielded too few words, using lenient filtering');
      return vocab
        .filter(word => {
          // More lenient filtering - allow some punctuation and longer words
          if (word.startsWith('[') || word.startsWith('<') || word.startsWith('##')) return false;
          if (word.length < 2 || word.length > 20) return false;
          if (/^\d+$/.test(word)) return false; // Still filter pure numbers
          // Allow words with some punctuation/symbols
          return true;
        })
        .slice(0, 800);
    }
    
    console.log('Filtered to', filtered.length, 'meaningful words');
    console.log('Sample filtered words:', filtered.slice(0, 20));
    
    return filtered;
  }



  private async generateVocabularyEmbeddings(vocabulary: string[]): Promise<Map<string, number[]>> {
    const vocabularyEmbeddings = new Map<string, number[]>();
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 50;
    for (let i = 0; i < vocabulary.length; i += batchSize) {
      const batch = vocabulary.slice(i, i + batchSize);
      
      for (const word of batch) {
        try {
          const result = await this.embeddingPipeline(word);
          const embedding = Array.from(result.data) as number[];
          vocabularyEmbeddings.set(word, embedding);
        } catch (error) {
          console.warn(`⚠️ Failed to generate embedding for word: ${word}`);
        }
      }
      
      // Small delay between batches
      if (i + batchSize < vocabulary.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return vocabularyEmbeddings;
  }

  private buildSemanticClusters(vocabularyEmbeddings: Map<string, number[]>): Map<string, string[]> {
    const semanticClusters = new Map<string, string[]>();
    
    for (const [word, embedding] of vocabularyEmbeddings) {
      const similarWords = this.findSimilarWords(word, embedding, vocabularyEmbeddings);
      semanticClusters.set(word, similarWords);
    }
    
    return semanticClusters;
  }

  private findSimilarWords(
    targetWord: string, 
    targetEmbedding: number[], 
    allEmbeddings: Map<string, number[]>
  ): string[] {
    const similarities: Array<{word: string, similarity: number}> = [];
    
    for (const [word, embedding] of allEmbeddings) {
      if (word !== targetWord) {
        const similarity = this.calculateCosineSimilarity(targetEmbedding, embedding);
        similarities.push({word, similarity});
      }
    }
    
    // Return top 5 most similar words
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => item.word);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }

  private createKnowledgeBase(
    vocabularyEmbeddings: Map<string, number[]>, 
    semanticClusters: Map<string, string[]>
  ): KnowledgeBase {
    const vocabulary = new Map<string, VocabularyEntry>();
    const vocabularyPrimes = new Map<string, Record<number, number>>();
    
    for (const [word, embedding] of vocabularyEmbeddings) {
      const primeFactors = this.embeddingsToPrimes(embedding);
      const similarWords = semanticClusters.get(word) || [];
      
      vocabulary.set(word, {
        word,
        embedding,
        primeFactors,
        similarWords
      });
      
      // Store prime factorizations for resonance engine
      vocabularyPrimes.set(word, primeFactors);
    }
    
    return {
      vocabulary,
      semanticClusters,
      conceptEmbeddings: vocabularyEmbeddings,
      vocabularyPrimes
    };
  }



  private embeddingsToPrimes(embeddings: number[], threshold: number = 0.02): Record<number, number> {
    // Simple prime factorization (reusing logic from PrimeMath)
    const primes = this.generatePrimes(embeddings.length);
    const primeFactors: Record<number, number> = {};
    
    embeddings.forEach((value, index) => {
      if (Math.abs(value) > threshold) {
        const prime = primes[index % primes.length];
        const weight = Math.floor(Math.abs(value) * 1000) + 1;
        primeFactors[prime] = (primeFactors[prime] || 0) + weight;
      }
    });
    
    return primeFactors;
  }

  private generatePrimes(n: number): number[] {
    const primes = [2];
    let num = 3;
    while (primes.length < n) {
      let isPrime = true;
      for (let i = 0; i < primes.length && primes[i] * primes[i] <= num; i++) {
        if (num % primes[i] === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primes.push(num);
      num += 2;
    }
    return primes;
  }
}
