// =============================================================================
// PRIMELM CONFIGURATION SYSTEM
// =============================================================================

export interface PrimeLMConfig {
  // Core System Configuration
  core: {
    embeddingModel: string;
    embeddingDimension: number;
    maxPrimes: number;
    primeThreshold: number;
  };

  // Conversation Configuration
  conversation: {
    maxHistoryLength: number;
    maxContextWindow: number;
    coherenceThreshold: number;
    similarityThreshold: number;
    cleanupInterval: number;
    memoryRetentionHours: number;
  };

  // Entity Memory Configuration
  entityMemory: {
    maxEntities: number;
    cleanupThreshold: number;
    confidenceDecay: number;
    mentionBoost: number;
  };

  // Episodic Memory Configuration
  episodicMemory: {
    maxEpisodes: number;
    consolidationThreshold: number;
    connectionThreshold: number;
    importanceDecay: number;
    clusterThreshold: number;
  };

  // Response Generation Configuration
  generation: {
    resonanceThreshold: number;
    harmonicWeight: number;
    personalityWeight: number;
    semanticBoostMultiplier: number;
    maxResonantWords: number;
  };

  // Error Handling Configuration
  errorHandling: {
    maxErrorHistory: number;
    criticalErrorThreshold: number;
    recoveryTimeoutMs: number;
    fallbackEnabled: boolean;
  };

  // Performance Configuration
  performance: {
    batchSize: number;
    processingTimeout: number;
    cacheSize: number;
    indexingEnabled: boolean;
  };

  // Debug Configuration
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    showPrimeFactors: boolean;
    showResonance: boolean;
    showTiming: boolean;
  };
}

export class ConfigManager {
  private config: PrimeLMConfig;
  private listeners: Map<string, ((config: PrimeLMConfig) => void)[]> = new Map();

  constructor(initialConfig?: Partial<PrimeLMConfig>) {
    this.config = this.createDefaultConfig();
    
    if (initialConfig) {
      this.updateConfig(initialConfig);
    }
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): PrimeLMConfig {
    return {
      core: {
        embeddingModel: 'Xenova/all-MiniLM-L6-v2',
        embeddingDimension: 384,
        maxPrimes: 1000,
        primeThreshold: 0.02
      },

      conversation: {
        maxHistoryLength: 50,
        maxContextWindow: 10,
        coherenceThreshold: 0.1,
        similarityThreshold: 0.3,
        cleanupInterval: 30 * 60 * 1000, // 30 minutes
        memoryRetentionHours: 24
      },

      entityMemory: {
        maxEntities: 1000,
        cleanupThreshold: 0.1,
        confidenceDecay: 0.05,
        mentionBoost: 0.1
      },

      episodicMemory: {
        maxEpisodes: 1000,
        consolidationThreshold: 0.8,
        connectionThreshold: 0.3,
        importanceDecay: 0.01,
        clusterThreshold: 0.4
      },

      generation: {
        resonanceThreshold: 100,
        harmonicWeight: 0.7,
        personalityWeight: 0.3,
        semanticBoostMultiplier: 2.0,
        maxResonantWords: 5
      },

      errorHandling: {
        maxErrorHistory: 100,
        criticalErrorThreshold: 5,
        recoveryTimeoutMs: 5000,
        fallbackEnabled: true
      },

      performance: {
        batchSize: 10,
        processingTimeout: 30000,
        cacheSize: 500,
        indexingEnabled: true
      },

      debug: {
        enabled: true,
        logLevel: 'info',
        showPrimeFactors: true,
        showResonance: true,
        showTiming: true
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): PrimeLMConfig {
    return JSON.parse(JSON.stringify(this.config)); // Deep copy
  }

  /**
   * Get specific configuration section
   */
  getSection<K extends keyof PrimeLMConfig>(section: K): PrimeLMConfig[K] {
    return JSON.parse(JSON.stringify(this.config[section])); // Deep copy
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<PrimeLMConfig>): void {
    this.config = this.deepMerge(this.config, updates);
    this.notifyListeners('config-updated');
    console.log('⚙️ Configuration updated');
  }

  /**
   * Update specific configuration section
   */
  updateSection<K extends keyof PrimeLMConfig>(
    section: K, 
    updates: Partial<PrimeLMConfig[K]>
  ): void {
    this.config[section] = this.deepMerge(this.config[section], updates);
    this.notifyListeners(`${section}-updated`);
    console.log(`⚙️ Configuration section '${section}' updated`);
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = this.createDefaultConfig();
    this.notifyListeners('config-reset');
    console.log('🔄 Configuration reset to defaults');
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment(): void {
    const envConfig: Partial<PrimeLMConfig> = {};

    // Core configuration
    if (process.env.PRIMELM_EMBEDDING_MODEL) {
      envConfig.core = {
        ...this.config.core,
        embeddingModel: process.env.PRIMELM_EMBEDDING_MODEL
      };
    }

    if (process.env.PRIMELM_COHERENCE_THRESHOLD) {
      envConfig.conversation = {
        ...this.config.conversation,
        coherenceThreshold: parseFloat(process.env.PRIMELM_COHERENCE_THRESHOLD)
      };
    }

    if (process.env.PRIMELM_MAX_ENTITIES) {
      envConfig.entityMemory = {
        ...this.config.entityMemory,
        maxEntities: parseInt(process.env.PRIMELM_MAX_ENTITIES)
      };
    }

    if (process.env.PRIMELM_DEBUG_ENABLED) {
      envConfig.debug = {
        ...this.config.debug,
        enabled: process.env.PRIMELM_DEBUG_ENABLED === 'true'
      };
    }

    if (process.env.PRIMELM_LOG_LEVEL) {
      envConfig.debug = {
        ...this.config.debug,
        logLevel: process.env.PRIMELM_LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug'
      };
    }

    if (Object.keys(envConfig).length > 0) {
      this.updateConfig(envConfig);
      console.log('🌍 Configuration loaded from environment variables');
    }
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate core configuration
    if (this.config.core.embeddingDimension <= 0) {
      errors.push('Core embedding dimension must be positive');
    }

    if (this.config.core.primeThreshold < 0 || this.config.core.primeThreshold > 1) {
      errors.push('Core prime threshold must be between 0 and 1');
    }

    // Validate conversation configuration
    if (this.config.conversation.maxHistoryLength <= 0) {
      errors.push('Conversation max history length must be positive');
    }

    if (this.config.conversation.coherenceThreshold < 0 || this.config.conversation.coherenceThreshold > 1) {
      errors.push('Conversation coherence threshold must be between 0 and 1');
    }

    // Validate entity memory configuration
    if (this.config.entityMemory.maxEntities <= 0) {
      errors.push('Entity memory max entities must be positive');
    }

    if (this.config.entityMemory.cleanupThreshold < 0 || this.config.entityMemory.cleanupThreshold > 1) {
      errors.push('Entity memory cleanup threshold must be between 0 and 1');
    }

    // Validate generation configuration
    if (this.config.generation.resonanceThreshold < 0) {
      errors.push('Generation resonance threshold must be non-negative');
    }

    if (this.config.generation.semanticBoostMultiplier <= 0) {
      errors.push('Generation semantic boost multiplier must be positive');
    }

    // Validate performance configuration
    if (this.config.performance.batchSize <= 0) {
      errors.push('Performance batch size must be positive');
    }

    if (this.config.performance.processingTimeout <= 0) {
      errors.push('Performance processing timeout must be positive');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get adaptive thresholds based on system performance
   */
  getAdaptiveThresholds(metrics: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    coherenceScore: number;
  }): Partial<PrimeLMConfig> {
    const adaptiveConfig: Partial<PrimeLMConfig> = {};

    // Adjust coherence threshold based on performance
    if (metrics.errorRate > 0.1) {
      // High error rate: lower thresholds for more lenient matching
      adaptiveConfig.conversation = {
        ...this.config.conversation,
        coherenceThreshold: Math.max(this.config.conversation.coherenceThreshold * 0.8, 0.05),
        similarityThreshold: Math.max(this.config.conversation.similarityThreshold * 0.8, 0.1)
      };
    } else if (metrics.errorRate < 0.01) {
      // Low error rate: raise thresholds for better quality
      adaptiveConfig.conversation = {
        ...this.config.conversation,
        coherenceThreshold: Math.min(this.config.conversation.coherenceThreshold * 1.1, 0.5),
        similarityThreshold: Math.min(this.config.conversation.similarityThreshold * 1.1, 0.8)
      };
    }

    // Adjust memory settings based on usage
    if (metrics.memoryUsage > 0.8) {
      // High memory usage: more aggressive cleanup
      adaptiveConfig.entityMemory = {
        ...this.config.entityMemory,
        cleanupThreshold: Math.min(this.config.entityMemory.cleanupThreshold * 1.5, 0.5),
        maxEntities: Math.max(Math.floor(this.config.entityMemory.maxEntities * 0.8), 100)
      };
    }

    // Adjust processing based on response time
    if (metrics.responseTime > 2000) {
      // Slow responses: reduce processing complexity
      adaptiveConfig.generation = {
        ...this.config.generation,
        maxResonantWords: Math.max(this.config.generation.maxResonantWords - 1, 2)
      };
      
      adaptiveConfig.performance = {
        ...this.config.performance,
        batchSize: Math.max(Math.floor(this.config.performance.batchSize * 0.8), 1),
        cacheSize: Math.min(this.config.performance.cacheSize * 2, 2000)
      };
    }

    return adaptiveConfig;
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(event: string, callback: (config: PrimeLMConfig) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from configuration changes
   */
  unsubscribe(event: string, callback: (config: PrimeLMConfig) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners of configuration changes
   */
  private notifyListeners(event: string): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(this.config);
        } catch (error) {
          console.error(`Error in config listener for event '${event}':`, error);
        }
      });
    }
  }

  /**
   * Deep merge objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key], source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }
    
    return result;
  }

  /**
   * Export configuration to JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      const validation = this.validateImportedConfig(importedConfig);
      
      if (validation.valid) {
        this.updateConfig(importedConfig);
        console.log('📥 Configuration imported successfully');
      } else {
        console.error('❌ Invalid configuration:', validation.errors);
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Failed to import configuration:', error);
      throw error;
    }
  }

  /**
   * Validate imported configuration
   */
  private validateImportedConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof config !== 'object' || config === null) {
      errors.push('Configuration must be an object');
      return { valid: false, errors };
    }

    // Basic structure validation
    const requiredSections = ['core', 'conversation', 'entityMemory', 'generation', 'errorHandling', 'performance', 'debug'];
    for (const section of requiredSections) {
      if (config[section] && typeof config[section] !== 'object') {
        errors.push(`Section '${section}' must be an object`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get configuration summary
   */
  getSummary(): {
    sections: string[];
    totalSettings: number;
    lastUpdated: string;
    validation: { valid: boolean; errors: string[] };
  } {
    const sections = Object.keys(this.config);
    let totalSettings = 0;
    
    for (const section of sections) {
      totalSettings += Object.keys(this.config[section as keyof PrimeLMConfig]).length;
    }

    return {
      sections,
      totalSettings,
      lastUpdated: new Date().toISOString(),
      validation: this.validateConfig()
    };
  }
}

// Global configuration instance
export const globalConfig = new ConfigManager();

// Load environment variables on startup
if (typeof process !== 'undefined' && process.env) {
  globalConfig.loadFromEnvironment();
}
