// =============================================================================
// HUGGINGFACE NER MODEL - Real transformer-based named entity recognition
// =============================================================================

import { pipeline } from '@xenova/transformers';
import { BaseEntityModel } from '../base/base-model';
import { ModelInitializationError } from '../interfaces';

/**
 * HuggingFace transformer-based named entity recognition model
 * Uses actual neural networks instead of pattern matching
 * Provides true semantic understanding through pre-trained models
 */
export class HuggingFaceNERModel extends BaseEntityModel {
  name: string;
  version = '1.0.0';
  entityTypes = ['PERSON', 'ANIMAL', 'VEHICLE', 'PLACE', 'ORGANIZATION', 'PRODUCT'];
  
  private pipeline: any = null;
  private schemaMapping: Map<string, string> = new Map();

  constructor(modelName: string = 'Xenova/bert-base-NER') {
    super();
    this.name = modelName;
    this.initializeSchemaMapping();
  }

  private initializeSchemaMapping(): void {
    // Map NER labels to Schema.org types
    this.schemaMapping.set('PER', 'Person');
    this.schemaMapping.set('PERSON', 'Person');
    this.schemaMapping.set('ORG', 'Organization');
    this.schemaMapping.set('LOC', 'Place');
    this.schemaMapping.set('MISC', 'Thing');
    this.schemaMapping.set('B-PER', 'Person');
    this.schemaMapping.set('I-PER', 'Person');
    this.schemaMapping.set('B-ORG', 'Organization');
    this.schemaMapping.set('I-ORG', 'Organization');
    this.schemaMapping.set('B-LOC', 'Place');
    this.schemaMapping.set('I-LOC', 'Place');
    this.schemaMapping.set('B-MISC', 'Thing');
    this.schemaMapping.set('I-MISC', 'Thing');
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log(`🚀 Initializing HuggingFace NER model ${this.name}...`);
      this.pipeline = await pipeline('ner', this.name);
      
      if (!this.pipeline) {
        throw new Error(`Failed to initialize NER model: ${this.name}`);
      }
      
      this.initialized = true;
      console.log(`✅ HuggingFace NER model ${this.name} initialized successfully`);
      
    } catch (error) {
      const initError = new ModelInitializationError(
        this.name,
        error instanceof Error ? error : new Error(String(error))
      );
      console.error(`❌ Failed to initialize ${this.name}:`, initError);
      throw initError;
    }
  }

  protected async performExtraction(text: string): Promise<{
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
  }> {
    console.log(`🏷️ Extracting entities with HuggingFace model: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    if (!text || text.trim().length === 0) {
      return { entities: [] };
    }

    try {
      const result = await this.pipeline(text);
      
      const entities = result.map((entity: any) => ({
        text: entity.word || entity.entity_group || 'unknown',
        type: this.schemaMapping.get(entity.entity || entity.entity_group) || 'Thing',
        confidence: entity.score || 0.5,
        startIndex: entity.start || 0,
        endIndex: entity.end || 0
      }));

      // Filter out low-confidence entities
      const filteredEntities = entities.filter((entity: any) => entity.confidence > 0.3);

      console.log(`✅ Extracted ${filteredEntities.length} entities`);

      return { entities: filteredEntities };
    } catch (error) {
      console.error(`❌ Entity extraction failed:`, error);
      throw new Error(`Entity extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get detailed extraction results for debugging
   */
  async extractWithDetails(text: string): Promise<{
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
    modelOutput: any;
    reasoning: string[];
  }> {
    const modelResult = await this.pipeline(text);
    const extractionResult = await this.performExtraction(text);
    
    return {
      entities: extractionResult.entities,
      modelOutput: modelResult,
      reasoning: [`HuggingFace NER model extracted ${extractionResult.entities.length} entities`]
    };
  }

  /**
   * Get model information for debugging
   */
  getModelInfo(): {
    name: string;
    version: string;
    entityTypes: string[];
    initialized: boolean;
    description: string;
  } {
    return {
      name: this.name,
      version: this.version,
      entityTypes: this.entityTypes,
      initialized: this.isInitialized(),
      description: 'HuggingFace transformer-based NER model using real neural networks'
    };
  }
}
