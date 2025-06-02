// =============================================================================
// EPISODIC MEMORY LAYER - Long-term Memory, Personalization, Learning
// =============================================================================

import { globalConfig } from './config';

export interface Episode {
  id: string;
  timestamp: number;
  type: 'conversation' | 'event' | 'learning' | 'relationship' | 'preference';
  content: {
    summary: string;
    details: any;
    participants: string[];
    location?: string;
    context: string;
  };
  emotional: {
    valence: number; // -1 (negative) to 1 (positive)
    arousal: number; // 0 (calm) to 1 (excited)
    dominance: number; // 0 (submissive) to 1 (dominant)
    emotions: string[];
  };
  importance: number; // 0 to 1
  connections: string[]; // IDs of related episodes
  tags: string[];
  lastAccessed: number;
  accessCount: number;
}

export interface PersonalityProfile {
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  preferences: {
    communicationStyle: 'formal' | 'casual' | 'friendly' | 'professional';
    topicInterests: string[];
    responseLength: 'brief' | 'moderate' | 'detailed';
    emotionalSupport: 'low' | 'medium' | 'high';
  };
  learningPatterns: {
    preferredExamples: string[];
    commonMistakes: string[];
    successfulInteractions: string[];
  };
}

export interface MemoryCluster {
  id: string;
  theme: string;
  episodes: string[];
  strength: number;
  lastReinforced: number;
  associatedEmotions: string[];
}

export class EpisodicMemoryLayer {
  private episodes: Map<string, Episode> = new Map();
  private clusters: Map<string, MemoryCluster> = new Map();
  private personalityProfile: PersonalityProfile;
  private memoryIndex: Map<string, Set<string>> = new Map(); // keyword -> episode IDs
  private temporalIndex: Map<string, string[]> = new Map(); // date -> episode IDs
  private emotionalIndex: Map<string, string[]> = new Map(); // emotion -> episode IDs

  constructor() {
    this.personalityProfile = this.initializePersonalityProfile();
    this.startMemoryConsolidation();
  }

  /**
   * Initialize default personality profile
   */
  private initializePersonalityProfile(): PersonalityProfile {
    return {
      traits: {
        openness: 0.7,
        conscientiousness: 0.8,
        extraversion: 0.6,
        agreeableness: 0.8,
        neuroticism: 0.3
      },
      preferences: {
        communicationStyle: 'friendly',
        topicInterests: [],
        responseLength: 'moderate',
        emotionalSupport: 'medium'
      },
      learningPatterns: {
        preferredExamples: [],
        commonMistakes: [],
        successfulInteractions: []
      }
    };
  }

  /**
   * Store a new episodic memory
   */
  storeEpisode(
    type: Episode['type'],
    content: Episode['content'],
    emotional: Episode['emotional'],
    importance: number = 0.5
  ): string {
    const episodeId = this.generateEpisodeId();
    const timestamp = Date.now();

    const episode: Episode = {
      id: episodeId,
      timestamp,
      type,
      content,
      emotional,
      importance,
      connections: [],
      tags: this.generateTags(content, emotional),
      lastAccessed: timestamp,
      accessCount: 1
    };

    // Store episode
    this.episodes.set(episodeId, episode);

    // Update indices
    this.updateIndices(episode);

    // Find and create connections
    this.createConnections(episode);

    // Update personality profile based on episode
    this.updatePersonalityProfile(episode);

    // Trigger memory consolidation if needed
    this.considerConsolidation();

    console.log(`🧠 Stored episodic memory: ${type} - ${content.summary}`);
    return episodeId;
  }

  /**
   * Retrieve episodes based on query
   */
  retrieveEpisodes(query: {
    keywords?: string[];
    type?: Episode['type'];
    timeRange?: { start: number; end: number };
    emotions?: string[];
    participants?: string[];
    minImportance?: number;
    limit?: number;
  }): Episode[] {
    let candidateIds = new Set<string>();

    // Keyword search
    if (query.keywords) {
      for (const keyword of query.keywords) {
        const keywordIds = this.memoryIndex.get(keyword.toLowerCase()) || new Set();
        if (candidateIds.size === 0) {
          candidateIds = new Set(keywordIds);
        } else {
          candidateIds = new Set([...candidateIds].filter(id => keywordIds.has(id)));
        }
      }
    } else {
      candidateIds = new Set(this.episodes.keys());
    }

    // Filter episodes
    let episodes = Array.from(candidateIds)
      .map(id => this.episodes.get(id)!)
      .filter(episode => {
        if (query.type && episode.type !== query.type) return false;
        if (query.timeRange && (episode.timestamp < query.timeRange.start || episode.timestamp > query.timeRange.end)) return false;
        if (query.emotions && !query.emotions.some(emotion => episode.emotional.emotions.includes(emotion))) return false;
        if (query.participants && !query.participants.some(participant => episode.content.participants.includes(participant))) return false;
        if (query.minImportance && episode.importance < query.minImportance) return false;
        return true;
      });

    // Sort by relevance (importance + recency + access frequency)
    episodes.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });

    // Update access information
    episodes.forEach(episode => {
      episode.lastAccessed = Date.now();
      episode.accessCount++;
    });

    // Apply limit
    if (query.limit) {
      episodes = episodes.slice(0, query.limit);
    }

    console.log(`🔍 Retrieved ${episodes.length} episodic memories`);
    return episodes;
  }

  /**
   * Get personality insights for response adaptation
   */
  getPersonalityInsights(): PersonalityProfile {
    return JSON.parse(JSON.stringify(this.personalityProfile));
  }

  /**
   * Update personality profile based on interaction patterns
   */
  updatePersonalityFromInteraction(
    interactionType: string,
    success: boolean,
    emotionalResponse: string[],
    context: any
  ): void {
    // Update learning patterns
    if (success) {
      this.personalityProfile.learningPatterns.successfulInteractions.push(interactionType);
      
      // Limit array size
      if (this.personalityProfile.learningPatterns.successfulInteractions.length > 50) {
        this.personalityProfile.learningPatterns.successfulInteractions.shift();
      }
    } else {
      this.personalityProfile.learningPatterns.commonMistakes.push(interactionType);
      
      if (this.personalityProfile.learningPatterns.commonMistakes.length > 30) {
        this.personalityProfile.learningPatterns.commonMistakes.shift();
      }
    }

    // Update preferences based on emotional response
    if (emotionalResponse.includes('happy') || emotionalResponse.includes('satisfied')) {
      // Reinforce current communication style
      // No change needed
    } else if (emotionalResponse.includes('confused') || emotionalResponse.includes('frustrated')) {
      // Adjust communication style
      if (this.personalityProfile.preferences.responseLength === 'brief') {
        this.personalityProfile.preferences.responseLength = 'moderate';
      } else if (this.personalityProfile.preferences.responseLength === 'detailed') {
        this.personalityProfile.preferences.responseLength = 'moderate';
      }
    }

    // Update topic interests
    if (context.topic && success) {
      if (!this.personalityProfile.preferences.topicInterests.includes(context.topic)) {
        this.personalityProfile.preferences.topicInterests.push(context.topic);
        
        // Limit interests
        if (this.personalityProfile.preferences.topicInterests.length > 20) {
          this.personalityProfile.preferences.topicInterests.shift();
        }
      }
    }

    console.log('🧠 Updated personality profile from interaction');
  }

  /**
   * Get memory clusters for thematic understanding
   */
  getMemoryClusters(): MemoryCluster[] {
    return Array.from(this.clusters.values())
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    totalEpisodes: number;
    episodesByType: Record<string, number>;
    averageImportance: number;
    memorySpan: { oldest: number; newest: number };
    emotionalDistribution: Record<string, number>;
    personalityTraits: PersonalityProfile['traits'];
  } {
    const episodes = Array.from(this.episodes.values());
    
    const episodesByType: Record<string, number> = {};
    const emotionalDistribution: Record<string, number> = {};
    let totalImportance = 0;
    let oldest = Date.now();
    let newest = 0;

    episodes.forEach(episode => {
      episodesByType[episode.type] = (episodesByType[episode.type] || 0) + 1;
      totalImportance += episode.importance;
      oldest = Math.min(oldest, episode.timestamp);
      newest = Math.max(newest, episode.timestamp);
      
      if (episode.emotional.emotions && Array.isArray(episode.emotional.emotions)) {
        episode.emotional.emotions.forEach(emotion => {
          emotionalDistribution[emotion] = (emotionalDistribution[emotion] || 0) + 1;
        });
      }
    });

    return {
      totalEpisodes: episodes.length,
      episodesByType,
      averageImportance: episodes.length > 0 ? totalImportance / episodes.length : 0,
      memorySpan: { oldest, newest },
      emotionalDistribution,
      personalityTraits: this.personalityProfile.traits
    };
  }

  /**
   * Generate episode ID
   */
  private generateEpisodeId(): string {
    return `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate tags for episode
   */
  private generateTags(content: Episode['content'], emotional: Episode['emotional']): string[] {
    const tags: string[] = [];
    
    // Content-based tags
    if (content.summary) {
      const words = content.summary.toLowerCase().split(/\W+/).filter(word => word.length > 2);
      tags.push(...words.slice(0, 5)); // Top 5 words
    }
    
    // Participant tags
    if (content.participants && Array.isArray(content.participants)) {
      tags.push(...content.participants.map(p => `participant:${p}`));
    }
    
    // Emotional tags
    if (emotional.emotions && Array.isArray(emotional.emotions)) {
      tags.push(...emotional.emotions.map(e => `emotion:${e}`));
    }
    
    // Context tags
    if (content.context) {
      tags.push(`context:${content.context}`);
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Update memory indices
   */
  private updateIndices(episode: Episode): void {
    // Keyword index
    if (episode.tags && Array.isArray(episode.tags)) {
      episode.tags.forEach(tag => {
        if (!this.memoryIndex.has(tag)) {
          this.memoryIndex.set(tag, new Set());
        }
        this.memoryIndex.get(tag)!.add(episode.id);
      });
    }

    // Temporal index
    const dateKey = new Date(episode.timestamp).toISOString().split('T')[0];
    if (!this.temporalIndex.has(dateKey)) {
      this.temporalIndex.set(dateKey, []);
    }
    this.temporalIndex.get(dateKey)!.push(episode.id);

    // Emotional index
    if (episode.emotional.emotions && Array.isArray(episode.emotional.emotions)) {
      episode.emotional.emotions.forEach(emotion => {
        if (!this.emotionalIndex.has(emotion)) {
          this.emotionalIndex.set(emotion, []);
        }
        this.emotionalIndex.get(emotion)!.push(episode.id);
      });
    }
  }

  /**
   * Create connections between related episodes
   */
  private createConnections(newEpisode: Episode): void {
    const config = globalConfig.getSection('episodicMemory');
    const maxConnections = 5;
    const connectionThreshold = 0.3;

    // Find similar episodes
    const candidates = this.retrieveEpisodes({
      keywords: newEpisode.tags.slice(0, 3),
      limit: 20
    });

    const connections: Array<{ id: string; similarity: number }> = [];

    candidates.forEach(candidate => {
      if (candidate.id === newEpisode.id) return;

      const similarity = this.calculateEpisodeSimilarity(newEpisode, candidate);
      if (similarity > connectionThreshold) {
        connections.push({ id: candidate.id, similarity });
      }
    });

    // Sort by similarity and take top connections
    connections.sort((a, b) => b.similarity - a.similarity);
    const topConnections = connections.slice(0, maxConnections);

    // Create bidirectional connections
    topConnections.forEach(({ id }) => {
      newEpisode.connections.push(id);
      const connectedEpisode = this.episodes.get(id);
      if (connectedEpisode && !connectedEpisode.connections.includes(newEpisode.id)) {
        connectedEpisode.connections.push(newEpisode.id);
      }
    });

    console.log(`🔗 Created ${topConnections.length} connections for episode ${newEpisode.id}`);
  }

  /**
   * Calculate similarity between episodes
   */
  private calculateEpisodeSimilarity(episode1: Episode, episode2: Episode): number {
    let similarity = 0;
    let factors = 0;

    // Tag similarity
    if (episode1.tags && episode2.tags && Array.isArray(episode1.tags) && Array.isArray(episode2.tags)) {
      const commonTags = episode1.tags.filter(tag => episode2.tags.includes(tag));
      const tagSimilarity = commonTags.length / Math.max(episode1.tags.length, episode2.tags.length);
      similarity += tagSimilarity * 0.4;
      factors += 0.4;
    }

    // Participant similarity
    if (episode1.content.participants && episode2.content.participants && 
        Array.isArray(episode1.content.participants) && Array.isArray(episode2.content.participants)) {
      const commonParticipants = episode1.content.participants.filter(p => episode2.content.participants.includes(p));
      const participantSimilarity = commonParticipants.length / Math.max(episode1.content.participants.length, episode2.content.participants.length);
      similarity += participantSimilarity * 0.3;
      factors += 0.3;
    }

    // Emotional similarity
    if (episode1.emotional.emotions && episode2.emotional.emotions && 
        Array.isArray(episode1.emotional.emotions) && Array.isArray(episode2.emotional.emotions)) {
      const commonEmotions = episode1.emotional.emotions.filter(e => episode2.emotional.emotions.includes(e));
      const emotionalSimilarity = commonEmotions.length / Math.max(episode1.emotional.emotions.length, episode2.emotional.emotions.length);
      similarity += emotionalSimilarity * 0.2;
      factors += 0.2;
    }

    // Temporal proximity (episodes closer in time are more similar)
    const timeDiff = Math.abs(episode1.timestamp - episode2.timestamp);
    const maxTimeDiff = 7 * 24 * 60 * 60 * 1000; // 7 days
    const temporalSimilarity = Math.max(0, 1 - (timeDiff / maxTimeDiff));
    similarity += temporalSimilarity * 0.1;
    factors += 0.1;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate relevance score for episode retrieval
   */
  private calculateRelevanceScore(episode: Episode, query: any): number {
    let score = 0;

    // Base importance
    score += episode.importance * 0.4;

    // Recency (more recent = higher score)
    const ageInDays = (Date.now() - episode.timestamp) / (24 * 60 * 60 * 1000);
    const recencyScore = Math.max(0, 1 - (ageInDays / 30)); // Decay over 30 days
    score += recencyScore * 0.3;

    // Access frequency
    const accessScore = Math.min(1, episode.accessCount / 10); // Cap at 10 accesses
    score += accessScore * 0.2;

    // Query relevance
    if (query.keywords) {
      const matchingTags = episode.tags.filter(tag => 
        query.keywords.some((keyword: string) => tag.includes(keyword.toLowerCase()))
      );
      const queryRelevance = matchingTags.length / Math.max(query.keywords.length, episode.tags.length);
      score += queryRelevance * 0.1;
    }

    return score;
  }

  /**
   * Update personality profile based on episode
   */
  private updatePersonalityProfile(episode: Episode): void {
    // Update traits based on emotional patterns
    const emotions = episode.emotional.emotions;
    
    // Check if emotions array exists and is valid
    if (!emotions || !Array.isArray(emotions)) {
      return;
    }
    
    if (emotions.includes('curious') || emotions.includes('interested')) {
      this.personalityProfile.traits.openness = Math.min(1, this.personalityProfile.traits.openness + 0.01);
    }
    
    if (emotions.includes('organized') || emotions.includes('systematic')) {
      this.personalityProfile.traits.conscientiousness = Math.min(1, this.personalityProfile.traits.conscientiousness + 0.01);
    }
    
    if (emotions.includes('social') || emotions.includes('outgoing')) {
      this.personalityProfile.traits.extraversion = Math.min(1, this.personalityProfile.traits.extraversion + 0.01);
    }
    
    if (emotions.includes('helpful') || emotions.includes('cooperative')) {
      this.personalityProfile.traits.agreeableness = Math.min(1, this.personalityProfile.traits.agreeableness + 0.01);
    }
    
    if (emotions.includes('anxious') || emotions.includes('stressed')) {
      this.personalityProfile.traits.neuroticism = Math.min(1, this.personalityProfile.traits.neuroticism + 0.01);
    } else if (emotions.includes('calm') || emotions.includes('relaxed')) {
      this.personalityProfile.traits.neuroticism = Math.max(0, this.personalityProfile.traits.neuroticism - 0.01);
    }
  }

  /**
   * Consider memory consolidation
   */
  private considerConsolidation(): void {
    const config = globalConfig.getSection('episodicMemory');
    const maxEpisodes = config?.maxEpisodes || 1000;
    
    if (this.episodes.size > maxEpisodes) {
      this.consolidateMemories();
    }
  }

  /**
   * Consolidate memories by clustering and removing low-importance episodes
   */
  private consolidateMemories(): void {
    console.log('🧠 Starting memory consolidation...');
    
    const episodes = Array.from(this.episodes.values());
    const config = globalConfig.getSection('episodicMemory');
    const targetSize = Math.floor((config?.maxEpisodes || 1000) * 0.8);
    
    // Sort by importance and recency
    episodes.sort((a, b) => {
      const scoreA = a.importance * 0.7 + (a.accessCount / 10) * 0.3;
      const scoreB = b.importance * 0.7 + (b.accessCount / 10) * 0.3;
      return scoreB - scoreA;
    });
    
    // Keep top episodes
    const episodesToKeep = episodes.slice(0, targetSize);
    const episodesToRemove = episodes.slice(targetSize);
    
    // Remove low-importance episodes
    episodesToRemove.forEach(episode => {
      this.removeEpisode(episode.id);
    });
    
    // Update clusters
    this.updateClusters();
    
    console.log(`🧠 Memory consolidation complete: ${episodesToRemove.length} episodes removed`);
  }

  /**
   * Remove episode and clean up indices
   */
  private removeEpisode(episodeId: string): void {
    const episode = this.episodes.get(episodeId);
    if (!episode) return;
    
    // Remove from main storage
    this.episodes.delete(episodeId);
    
    // Clean up indices
    episode.tags.forEach(tag => {
      const tagSet = this.memoryIndex.get(tag);
      if (tagSet) {
        tagSet.delete(episodeId);
        if (tagSet.size === 0) {
          this.memoryIndex.delete(tag);
        }
      }
    });
    
    // Remove connections
    episode.connections.forEach(connectedId => {
      const connectedEpisode = this.episodes.get(connectedId);
      if (connectedEpisode) {
        connectedEpisode.connections = connectedEpisode.connections.filter(id => id !== episodeId);
      }
    });
  }

  /**
   * Update memory clusters
   */
  private updateClusters(): void {
    // Clear existing clusters
    this.clusters.clear();
    
    const episodes = Array.from(this.episodes.values());
    const clusterThreshold = 0.4;
    
    // Group episodes by similarity
    const processed = new Set<string>();
    
    episodes.forEach(episode => {
      if (processed.has(episode.id)) return;
      
      const cluster: MemoryCluster = {
        id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        theme: this.generateClusterTheme(episode),
        episodes: [episode.id],
        strength: episode.importance,
        lastReinforced: episode.timestamp,
        associatedEmotions: [...episode.emotional.emotions]
      };
      
      // Find similar episodes
      episodes.forEach(otherEpisode => {
        if (processed.has(otherEpisode.id) || otherEpisode.id === episode.id) return;
        
        const similarity = this.calculateEpisodeSimilarity(episode, otherEpisode);
        if (similarity > clusterThreshold) {
          cluster.episodes.push(otherEpisode.id);
          cluster.strength += otherEpisode.importance;
          cluster.lastReinforced = Math.max(cluster.lastReinforced, otherEpisode.timestamp);
          
          // Merge emotions
          otherEpisode.emotional.emotions.forEach(emotion => {
            if (!cluster.associatedEmotions.includes(emotion)) {
              cluster.associatedEmotions.push(emotion);
            }
          });
          
          processed.add(otherEpisode.id);
        }
      });
      
      processed.add(episode.id);
      this.clusters.set(cluster.id, cluster);
    });
    
    console.log(`🧠 Updated memory clusters: ${this.clusters.size} clusters created`);
  }

  /**
   * Generate theme for memory cluster
   */
  private generateClusterTheme(episode: Episode): string {
    // Use most common tags and content summary
    const commonWords = episode.tags
      .filter(tag => !tag.includes(':'))
      .slice(0, 3)
      .join(' ');
    
    return commonWords || episode.content.summary.split(' ').slice(0, 3).join(' ');
  }

  /**
   * Start memory consolidation timer
   */
  private startMemoryConsolidation(): void {
    const config = globalConfig.getSection('conversation');
    const consolidationInterval = config?.cleanupInterval || 30 * 60 * 1000; // 30 minutes
    
    setInterval(() => {
      this.considerConsolidation();
    }, consolidationInterval);
  }
}
