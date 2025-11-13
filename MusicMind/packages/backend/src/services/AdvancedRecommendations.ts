import { Track } from '../models/Track';
import { User } from '../models/User';
import { Playlist } from '../models/Playlist';

/**
 * Feature 7: Crossover Artist Discovery
 * Finds artists that blend multiple genres together, expanding taste
 * Example: Artist that blends jazz + electronic = opening new worlds
 */
export class CrossoverArtistDiscovery {
  async discoverCrossoverArtists(userId: string): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const favoriteGenres = user.musicTasteDNA.primaryGenres;

    // Find artists that have tracks in multiple genres
    const crossoverArtists = await Track.aggregate([
      { $match: { genre: { $in: favoriteGenres } } },
      { $group: { _id: '$artist', genres: { $addToSet: '$genre' }, trackCount: { $sum: 1 } } },
      { $match: { 'genres.1': { $exists: true } } }, // Must have 2+ genres
      { $sort: { trackCount: -1 } },
      { $limit: 20 },
    ]);

    return crossoverArtists.map((ca) => ({
      artist: ca._id,
      blendedGenres: ca.genres,
      trackCount: ca.trackCount,
      description: this.describeBlend(ca.genres),
    }));
  }

  private describeBlend(genres: string[]): string {
    return `Blends ${genres.slice(0, 3).join(', ')}`;
  }
}

/**
 * Feature 11: Music-to-Workout Matcher
 * Syncs songs with exercise types based on BPM, energy, and beat patterns
 * Different workouts need different music: running needs consistent high BPM,
 * strength training needs heavy beats, cycling needs progressive builds
 */
export class WorkoutMusicMatcher {
  private workoutBPMRanges = {
    running: { min: 140, max: 160 },
    cycling: { min: 120, max: 140 },
    strength: { min: 100, max: 130 },
    hiit: { min: 150, max: 180 },
    yoga: { min: 60, max: 90 },
    cardio: { min: 120, max: 150 },
  };

  /**
   * Create a playlist specifically optimized for a workout type
   * Songs progress from warm-up to peak to cool-down with matching BPM
   */
  async generateWorkoutPlaylist(
    userId: string,
    workoutType: string,
    durationMinutes: number = 30
  ): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const bpmRange = this.workoutBPMRanges[workoutType as keyof typeof this.workoutBPMRanges];
    if (!bpmRange) throw new Error('Unknown workout type');

    // Estimate track count needed
    const avgTrackLength = 3.5; // minutes
    const estimatedTracksNeeded = Math.ceil(durationMinutes / avgTrackLength);

    // Get user's preferred genres
    const genres = user.musicTasteDNA.primaryGenres;

    // Get energetic, upbeat tracks for workout
    const tracks = await Track.find({
      genre: { $in: genres },
      bpm: { $gte: bpmRange.min, $lte: bpmRange.max },
      energy: { $gte: 70 },
      valence: { $gte: 60 }, // Happy/positive music for motivation
    })
      .sort({ averageUserRating: -1 })
      .limit(estimatedTracksNeeded);

    // Build workout arc: warm-up (lower BPM), peak (higher BPM), cool-down
    const workoutPlaylist = this.buildWorkoutArc(tracks, workoutType);

    const playlist = new Playlist({
      name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Power Play`,
      creator: userId,
      tracks: workoutPlaylist.map((t) => ({ trackId: t._id })),
      playlistType: 'workout',
      generationMeta: {
        basedOnWorkoutType: workoutType,
        generatedAt: new Date(),
        algorithm: 'workoutOptimized',
      },
    });

    await playlist.save();
    return playlist;
  }

  private buildWorkoutArc(tracks: any[], workoutType: string): any[] {
    // Sort by BPM for progression
    const sorted = tracks.sort((a, b) => a.bpm - b.bpm);

    // For running/cycling: progressive BPM increase then decrease
    const thirdLength = Math.floor(sorted.length / 3);

    if (workoutType === 'running' || workoutType === 'cycling') {
      const warmup = sorted.slice(0, thirdLength);
      const peak = sorted.slice(thirdLength, thirdLength * 2).reverse(); // High BPM
      const cooldown = sorted.slice(thirdLength * 2);
      return [...warmup, ...peak, ...cooldown];
    }

    // For strength: consistent heavy beats
    return sorted.reverse(); // Start high, end medium
  }
}

/**
 * Feature 12: Predictive Listening Queue
 * Machine learning-based next song predictions
 * Learns from user's patterns to predict what they want to hear next
 */
export class PredictiveQueue {
  async generateNextSongPredictions(userId: string, currentTrackId: string): Promise<any[]> {
    const user = await User.findById(userId);
    const currentTrack = await Track.findOne({ spotifyId: currentTrackId });

    if (!user || !currentTrack) throw new Error('User or track not found');

    // Find songs that are often played after current track
    const followUpSongs = await this.findFrequentlyPlayedAfter(userId, currentTrackId);

    if (followUpSongs.length > 0) {
      return followUpSongs.slice(0, 5);
    }

    // Fallback: find songs with similar audio features
    const similarTracks = await Track.find({
      _id: { $ne: currentTrack._id },
      genre: { $in: currentTrack.genre },
      energy: { $gte: currentTrack.energy - 10, $lte: currentTrack.energy + 10 },
      valence: { $gte: currentTrack.valence - 10, $lte: currentTrack.valence + 10 },
    })
      .sort({ averageUserRating: -1 })
      .limit(5);

    return similarTracks;
  }

  private async findFrequentlyPlayedAfter(userId: string, trackId: string): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) return [];

    const trackIndices = user.listeningHistory
      .map((h, i) => (h.trackId === trackId ? i : -1))
      .filter((i) => i !== -1 && i < user.listeningHistory.length - 1);

    const followUpTracks: Record<string, number> = {};
    trackIndices.forEach((idx) => {
      const followUp = user.listeningHistory[idx + 1]?.trackId;
      if (followUp) {
        followUpTracks[followUp] = (followUpTracks[followUp] || 0) + 1;
      }
    });

    const sorted = Object.entries(followUpTracks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([trackId]) => trackId);

    return Track.find({ spotifyId: { $in: sorted } });
  }
}

/**
 * Feature 13: Music Era Explorer
 * Navigate through decades and eras, discover music history
 */
export class MusicEraExplorer {
  async exploreEra(era: string, userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Get top tracks from the era that match user's taste
    const tracks = await Track.find({
      era: era,
      genre: { $in: user.musicTasteDNA.primaryGenres },
    })
      .sort({ globalPopularity: -1, averageUserRating: -1 })
      .limit(30);

    // Get era summary
    const eraInfo = this.getEraSummary(era);

    return {
      era,
      eraInfo,
      topTracks: tracks,
      genrePopularityInEra: await this.analyzeGenrePopularityInEra(era),
    };
  }

  private getEraSummary(era: string): any {
    const summaries: Record<string, any> = {
      '1960s': { name: 'The Roaring Sixties', description: 'Rock revolution and psychedelia' },
      '1970s': { name: 'The Groovy Seventies', description: 'Disco, funk, and progressive rock' },
      '1980s': { name: 'The Electric Eighties', description: 'Synth-pop and the MTV revolution' },
      '1990s': { name: 'The Alternative Nineties', description: 'Grunge, britpop, and hip-hop boom' },
      '2000s': { name: 'The Digital 2000s', description: 'Indie, nu-metal, and the rise of digital music' },
      '2010s': { name: 'The Streaming Twenteens', description: 'Diverse genres, streaming dominance' },
      '2020s': { name: 'The Modern Era', description: 'Genre-blending and algorithmic discovery' },
    };

    return summaries[era] || { name: era, description: 'Music from this era' };
  }

  private async analyzeGenrePopularityInEra(era: string): Promise<any> {
    const result = await Track.aggregate([
      { $match: { era } },
      { $unwind: '$genre' },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return result;
  }
}

/**
 * Feature 14: Hidden Gem Recommender
 * Discover underrated, less-known songs that match your taste
 * Opposite of mainstream recommendations
 */
export class HiddenGemRecommender {
  async findHiddenGems(userId: string, count: number = 20): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const gems = await Track.find({
      genre: { $in: user.musicTasteDNA.primaryGenres },
      globalPopularity: { $lt: 40 }, // Not too popular
      hiddenGemScore: { $gte: 60 }, // But still well-rated by those who know
      averageUserRating: { $gte: 4 }, // Quality tracks
    })
      .sort({ hiddenGemScore: -1, averageUserRating: -1 })
      .limit(count);

    return gems.map((gem) => ({
      ...gem.toObject(),
      whyHidden: `This track has ${gem.globalPopularity}% mainstream popularity but ${gem.averageUserRating}/5 from dedicated listeners`,
    }));
  }
}
