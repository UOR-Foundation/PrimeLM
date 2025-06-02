// =============================================================================
// CONVERSATION MANAGEMENT - Barrel Exports
// =============================================================================

// Pragmatic Layer
export { PragmaticLayer } from './pragmatic-layer';
export type { ConversationTurn as PragmaticConversationTurn, ConversationContext, IntentState } from './pragmatic-layer';

// Discourse Layer
export { DiscourseLayer } from './discourse-layer';
export type { TopicState, ConversationFlow, ReferenceResolution } from './discourse-layer';

// Generative Layer
export { GenerativeLayer } from './generative-layer';
export type { GenerationContext, ResponseComponents, GenerationStyle } from './generative-layer';

// Conversation State (primary ConversationTurn export)
export { ConversationStateManager } from './conversation-state';
export type { ConversationTurn, ConversationMetrics, ConversationConfig } from './conversation-state';
