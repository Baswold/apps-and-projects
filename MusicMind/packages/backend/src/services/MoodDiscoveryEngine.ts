import { Track } from '../models/Track';
import { User } from '../models/User';

/**
 * Feature 1: Mood-Based Music Discovery Engine
 * Users describe their mood (e.g., "feeling nostalgic and energetic") and get music recommendations
 * that match that exact emotional state, not just genre-based discovery
 */
export class MoodDiscoveryEngine {
  private moodToAudioFeatures = {
    happy: { valence: { min: 70, max: 100 }, energy: { min: 50, max: 100 } },
    sad: { valence: { min: 0, max: 30 }, energy: { min: 0, max: 60 } },
    energetic: { energy: { min: 80, max: 100 }, bpm: { min: 120, max: 200 } },
    calm: { energy: { min: 0, max: 40 }, acousticness: { min: 40, max: 100 } },
    melancholic: { valence: { min: 0, max: 40 }, acousticness: { min: 30, max: 100 } },
    uplifting: { valence: { min: 60, max: 100 }, energy: { min: 60, max: 100 } },
    angry: { energy: { min: 80, max: 100 }, valence: { min: 0, max: 30 } },
    romantic: { valence: { min: 50, max: 100 }, acousticness: { min: 30, max: 80 } },
    nostalgic: { energy: { min: 20, max: 70 }, valence: { min: 40, max: 80 } },
    focus: { instrumentalness: { min: 40, max: 100 }, energy: { min: 30, max: 70 } },
  };

  /**
   * Discovers music based on mood description and user's taste profile
   * More advanced than simple tag matching - considers audio features and user history
   */
  async discoverByMood(
    userId: string,
    moodDescription: string,
    count: number = 20
  ): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Parse multiple emotions from description
    const moodTokens = this.extractMoodsFromText(moodDescription);
    const moodWeights = this.calculateMoodWeights(moodTokens);

    // Build audio feature filter based on moods
    const audioFeatureFilter = this.getMoodAudioFeatureFilter(moodWeights);

    // Get user's preferred genres
    const preferredGenres = user.musicTasteDNA.primaryGenres;

    // Query tracks that match mood AND user taste
    const tracks = await Track.find({
      genre: { $in: preferredGenres },
      ...audioFeatureFilter,
    })
      .sort({ averageUserRating: -1, globalPopularity: -1 })
      .limit(count);

    // Also include some discovery tracks from secondary genres
    if (tracks.length < count) {
      const secondaryGenreTracks = await Track.find({
        genre: { $in: user.musicTasteDNA.secondaryGenres },
        ...audioFeatureFilter,
        _id: { $nin: tracks.map((t) => t._id) },
      })
        .limit(count - tracks.length);
      tracks.push(...secondaryGenreTracks);
    }

    // Record this mood for future mood evolution tracking
    await this.recordMoodQuery(userId, moodDescription, moodWeights);

    return tracks;
  }

  private extractMoodsFromText(text: string): string[] {
    const moodKeywords = Object.keys(this.moodToAudioFeatures);
    const lowerText = text.toLowerCase();
    return moodKeywords.filter((mood) => lowerText.includes(mood));
  }

  private calculateMoodWeights(moods: string[]): Record<string, number> {
    const weights: Record<string, number> = {};
    moods.forEach((mood, index) => {
      weights[mood] = 1 / (index + 1); // Earlier mentioned moods weighted higher
    });
    return weights;
  }

  private getMoodAudioFeatureFilter(moodWeights: Record<string, number>): Record<string, any> {
    const filter: Record<string, any> = {};

    for (const [mood, weight] of Object.entries(moodWeights)) {
      const features = this.moodToAudioFeatures[mood as keyof typeof this.moodToAudioFeatures];
      if (!features) continue;

      for (const [feature, range] of Object.entries(features)) {
        if (filter[feature]) {
          // Average with existing filter
          filter[feature].min = (filter[feature].min + (range as any).min) / 2;
          filter[feature].max = (filter[feature].max + (range as any).max) / 2;
        } else {
          filter[feature] = { ...(range as any) };
        }
      }
    }

    // Convert to MongoDB query format
    const mongoFilter: Record<string, any> = {};
    for (const [feature, range] of Object.entries(filter)) {
      mongoFilter[feature] = { $gte: range.min, $lte: range.max };
    }

    return mongoFilter;
  }

  private async recordMoodQuery(
    userId: string,
    moodDescription: string,
    moodWeights: Record<string, number>
  ): Promise<void> {
    // Find primary mood
    const primaryMood = Object.entries(moodWeights).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

    await User.updateOne(
      { _id: userId },
      {
        $push: {
          moodHistory: {
            timestamp: new Date(),
            mood: primaryMood,
            intensity: Object.values(moodWeights).reduce((a, b) => a + b, 0),
          },
        },
      }
    );
  }
}

/**
 * Feature 5: Music Discovery by Emotion Combination
 * Find songs that blend multiple emotions seamlessly (e.g., "happy but thoughtful")
 */
export class EmotionCombinationDiscovery {
  async discoverByEmotionCombination(
    userId: string,
    emotions: string[],
    count: number = 20
  ): Promise<any[]> {
    // Find tracks whose mood profile matches ALL emotions
    const tracks = await Track.find({
      'moods.mood': { $all: emotions },
    })
      .sort({ averageUserRating: -1 })
      .limit(count);

    return tracks;
  }
}
