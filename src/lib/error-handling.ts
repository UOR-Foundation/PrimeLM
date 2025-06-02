// =============================================================================
// GRACEFUL ERROR HANDLING SYSTEM
// =============================================================================

export interface ErrorContext {
  component: string;
  operation: string;
  input?: any;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  metadata?: Record<string, any>;
}

export interface FallbackStrategy {
  name: string;
  condition: (error: Error, context: ErrorContext) => boolean;
  execute: (error: Error, context: ErrorContext) => any;
  priority: number;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByComponent: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recoverySuccessRate: number;
  lastError?: ErrorContext;
}

export class GracefulErrorHandler {
  private fallbackStrategies: FallbackStrategy[] = [];
  private errorHistory: ErrorContext[] = [];
  private maxErrorHistory: number = 100;
  private stats: ErrorStats;

  constructor() {
    this.stats = {
      totalErrors: 0,
      errorsByComponent: {},
      errorsBySeverity: {},
      recoverySuccessRate: 0
    };

    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default fallback strategies
   */
  private initializeDefaultStrategies(): void {
    // Knowledge base fallback
    this.addFallbackStrategy({
      name: 'knowledge_base_fallback',
      condition: (error, context) => 
        context.component === 'knowledge-bootstrap' || 
        error.message.includes('knowledge base'),
      execute: (error, context) => {
        console.warn('🔄 Knowledge base unavailable, using minimal vocabulary');
        return {
          vocabulary: new Map([
            ['hello', { embedding: new Array(384).fill(0.1), primeFactors: { 2: 5, 3: 3 } }],
            ['help', { embedding: new Array(384).fill(0.2), primeFactors: { 5: 4, 7: 2 } }],
            ['name', { embedding: new Array(384).fill(0.3), primeFactors: { 11: 3, 13: 2 } }]
          ]),
          vocabularyPrimes: new Map([
            ['hello', { 2: 5, 3: 3 }],
            ['help', { 5: 4, 7: 2 }],
            ['name', { 11: 3, 13: 2 }]
          ]),
          conceptEmbeddings: new Map(),
          semanticClusters: new Map()
        };
      },
      priority: 1
    });

    // Embedding generation fallback
    this.addFallbackStrategy({
      name: 'embedding_generation_fallback',
      condition: (error, context) => 
        context.component === 'embedding-generation' ||
        error.message.includes('embedding') ||
        error.message.includes('pipeline'),
      execute: (error, context) => {
        console.warn('🔄 Embedding generation failed, using text-based fallback');
        const text = context.input || '';
        return this.generateFallbackEmbedding(text);
      },
      priority: 2
    });

    // Entity memory fallback
    this.addFallbackStrategy({
      name: 'entity_memory_fallback',
      condition: (error, context) => 
        context.component === 'entity-memory' ||
        error.message.includes('entity'),
      execute: (error, context) => {
        console.warn('🔄 Entity memory error, using simple storage');
        return this.createSimpleEntityResponse(context);
      },
      priority: 3
    });

    // Semantic query fallback
    this.addFallbackStrategy({
      name: 'semantic_query_fallback',
      condition: (error, context) => 
        error.message.includes('No semantic query handler') ||
        context.component === 'semantic-query',
      execute: (error, context) => {
        console.warn('🔄 Semantic query failed, using pattern matching');
        return this.generatePatternBasedResponse(context);
      },
      priority: 4
    });

    // Prime resonance fallback
    this.addFallbackStrategy({
      name: 'prime_resonance_fallback',
      condition: (error, context) => 
        context.component === 'prime-resonance' ||
        error.message.includes('prime'),
      execute: (error, context) => {
        console.warn('🔄 Prime resonance failed, using basic math');
        return this.generateBasicPrimeResponse(context);
      },
      priority: 5
    });

    // Generic conversation fallback
    this.addFallbackStrategy({
      name: 'conversation_fallback',
      condition: (error, context) => true, // Catch-all
      execute: (error, context) => {
        console.warn('🔄 Using generic conversation fallback');
        return this.generateGenericResponse(context);
      },
      priority: 10
    });
  }

  /**
   * Add a custom fallback strategy
   */
  addFallbackStrategy(strategy: FallbackStrategy): void {
    this.fallbackStrategies.push(strategy);
    this.fallbackStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Handle error with graceful fallback
   */
  async handleError<T>(
    error: Error,
    context: ErrorContext,
    defaultValue?: T
  ): Promise<T> {
    // Record error
    this.recordError(error, context);

    // Find applicable fallback strategy
    const strategy = this.findFallbackStrategy(error, context);

    if (strategy) {
      try {
        console.log(`🛡️ Applying fallback strategy: ${strategy.name}`);
        const result = await strategy.execute(error, context);
        this.recordRecovery(context, true);
        return result;
      } catch (fallbackError) {
        console.error(`❌ Fallback strategy failed: ${strategy.name}`, fallbackError);
        this.recordRecovery(context, false);
      }
    }

    // If all fallbacks fail, return default value or throw
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // Last resort: throw a user-friendly error
    throw new Error(this.createUserFriendlyError(error, context));
  }

  /**
   * Record error in history and stats
   */
  private recordError(error: Error, context: ErrorContext): void {
    this.errorHistory.push(context);
    this.stats.totalErrors++;
    this.stats.errorsByComponent[context.component] = 
      (this.stats.errorsByComponent[context.component] || 0) + 1;
    this.stats.errorsBySeverity[context.severity] = 
      (this.stats.errorsBySeverity[context.severity] || 0) + 1;
    this.stats.lastError = context;

    // Maintain history size
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }

    // Log based on severity
    switch (context.severity) {
      case 'critical':
        console.error(`🚨 CRITICAL ERROR in ${context.component}.${context.operation}:`, error);
        break;
      case 'high':
        console.error(`❌ HIGH ERROR in ${context.component}.${context.operation}:`, error);
        break;
      case 'medium':
        console.warn(`⚠️ MEDIUM ERROR in ${context.component}.${context.operation}:`, error);
        break;
      case 'low':
        console.log(`ℹ️ LOW ERROR in ${context.component}.${context.operation}:`, error);
        break;
    }
  }

  /**
   * Record recovery attempt
   */
  private recordRecovery(context: ErrorContext, success: boolean): void {
    const totalRecoverable = this.errorHistory.filter(e => e.recoverable).length;
    const successfulRecoveries = success ? 1 : 0;
    
    if (totalRecoverable > 0) {
      this.stats.recoverySuccessRate = 
        (this.stats.recoverySuccessRate * (totalRecoverable - 1) + successfulRecoveries) / totalRecoverable;
    }
  }

  /**
   * Find applicable fallback strategy
   */
  private findFallbackStrategy(error: Error, context: ErrorContext): FallbackStrategy | null {
    return this.fallbackStrategies.find(strategy => 
      strategy.condition(error, context)
    ) || null;
  }

  /**
   * Generate fallback embedding using text analysis
   */
  private generateFallbackEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    
    words.forEach((word, wordIndex) => {
      const hash = this.hashString(word);
      for (let i = 0; i < word.length; i++) {
        const dim = (hash + i * 37 + wordIndex * 23) % 384;
        embedding[dim] += Math.sin((hash + i) / 1000) / words.length;
      }
    });
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }

  /**
   * Hash string for consistent fallback generation
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Create simple entity response
   */
  private createSimpleEntityResponse(context: ErrorContext): string {
    const input = context.input || '';
    
    // Simple pattern matching for common queries
    if (input.toLowerCase().includes('what is my name')) {
      return "I don't have your name stored. What is your name?";
    }
    
    if (input.toLowerCase().includes('name is')) {
      const nameMatch = input.match(/name is (\w+)/i);
      if (nameMatch) {
        return `Nice to meet you, ${nameMatch[1]}!`;
      }
    }
    
    return "I understand. Could you tell me more?";
  }

  /**
   * Generate pattern-based response
   */
  private generatePatternBasedResponse(context: ErrorContext): string {
    const input = context.input || '';
    const lowerInput = input.toLowerCase();
    
    // Greeting patterns
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm PrimeBot. How can I help you today?";
    }
    
    // Question patterns
    if (lowerInput.includes('what') || lowerInput.includes('how') || lowerInput.includes('why')) {
      return "That's a great question! I'm processing the information to provide you with an answer.";
    }
    
    // Help patterns
    if (lowerInput.includes('help') || lowerInput.includes('assist')) {
      return "I'm here to help! What would you like to know or discuss?";
    }
    
    // Name patterns
    if (lowerInput.includes('name')) {
      if (lowerInput.includes('my name is')) {
        const nameMatch = input.match(/my name is (\w+)/i);
        if (nameMatch) {
          return `Nice to meet you, ${nameMatch[1]}! I'm PrimeBot.`;
        }
      }
      if (lowerInput.includes('what is my name')) {
        return "I don't recall you mentioning your name. What is your name?";
      }
    }
    
    // Gratitude patterns
    if (lowerInput.includes('thank') || lowerInput.includes('thanks')) {
      return "You're welcome! I'm glad I could help.";
    }
    
    return "I understand. Could you tell me more about what you'd like to discuss?";
  }

  /**
   * Generate basic prime response
   */
  private generateBasicPrimeResponse(context: ErrorContext): Record<number, number> {
    const input = context.input || '';
    const hash = this.hashString(input);
    
    // Generate simple prime factors based on input
    return {
      2: (hash % 10) + 1,
      3: (hash % 8) + 1,
      5: (hash % 6) + 1,
      7: (hash % 4) + 1
    };
  }

  /**
   * Generate generic response
   */
  private generateGenericResponse(context: ErrorContext): string {
    const responses = [
      "I'm processing that information. Could you tell me more?",
      "That's interesting. What else would you like to discuss?",
      "I understand. How can I help you with that?",
      "I see. What would you like to know?",
      "I'm here to help. What can I assist you with?"
    ];
    
    const hash = this.hashString(context.input || context.operation);
    return responses[hash % responses.length];
  }

  /**
   * Create user-friendly error message
   */
  private createUserFriendlyError(error: Error, context: ErrorContext): string {
    switch (context.severity) {
      case 'critical':
        return "I'm experiencing technical difficulties. Please try restarting the conversation.";
      case 'high':
        return "I'm having trouble processing that request. Could you try rephrasing it?";
      case 'medium':
        return "I encountered an issue but I'm still here to help. What would you like to discuss?";
      case 'low':
        return "I had a minor hiccup but I'm ready to continue. How can I assist you?";
      default:
        return "Something unexpected happened, but I'm still here to help you.";
    }
  }

  /**
   * Check system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    errorRate: number;
    recoveryRate: number;
    recentErrors: number;
    recommendations: string[];
  } {
    const recentErrors = this.errorHistory.filter(
      e => Date.now() - e.timestamp < 5 * 60 * 1000 // Last 5 minutes
    ).length;
    
    const errorRate = this.stats.totalErrors / Math.max(Date.now() / 60000, 1); // Errors per minute
    const recoveryRate = this.stats.recoverySuccessRate;
    
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const recommendations: string[] = [];
    
    if (errorRate > 5 || recoveryRate < 0.5) {
      status = 'critical';
      recommendations.push('System requires immediate attention');
      recommendations.push('Consider restarting core components');
    } else if (errorRate > 2 || recoveryRate < 0.8 || recentErrors > 3) {
      status = 'degraded';
      recommendations.push('Monitor system closely');
      recommendations.push('Check component health');
    }
    
    if (recentErrors > 0) {
      recommendations.push(`${recentErrors} recent errors detected`);
    }
    
    return {
      status,
      errorRate,
      recoveryRate,
      recentErrors,
      recommendations
    };
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    return { ...this.stats };
  }

  /**
   * Get recent error history
   */
  getRecentErrors(count: number = 10): ErrorContext[] {
    return this.errorHistory.slice(-count);
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.stats = {
      totalErrors: 0,
      errorsByComponent: {},
      errorsBySeverity: {},
      recoverySuccessRate: 0
    };
    console.log('🧹 Error history cleared');
  }
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Wrapper for safe async operations
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext>,
  errorHandler: GracefulErrorHandler,
  defaultValue?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const fullContext: ErrorContext = {
      component: 'unknown',
      operation: 'async-operation',
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true,
      ...context
    };
    
    return errorHandler.handleError(error as Error, fullContext, defaultValue);
  }
}

/**
 * Wrapper for safe sync operations
 */
export function safeSync<T>(
  operation: () => T,
  context: Partial<ErrorContext>,
  errorHandler: GracefulErrorHandler,
  defaultValue?: T
): T {
  try {
    return operation();
  } catch (error) {
    const fullContext: ErrorContext = {
      component: 'unknown',
      operation: 'sync-operation',
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true,
      ...context
    };
    
    // For sync operations, we need to handle the promise
    const result = errorHandler.handleError(error as Error, fullContext, defaultValue);
    if (result instanceof Promise) {
      throw new Error('Async fallback not supported in sync context');
    }
    return result;
  }
}

/**
 * Create error context helper
 */
export function createErrorContext(
  component: string,
  operation: string,
  options: Partial<ErrorContext> = {}
): ErrorContext {
  return {
    component,
    operation,
    timestamp: Date.now(),
    severity: 'medium',
    recoverable: true,
    ...options
  };
}
