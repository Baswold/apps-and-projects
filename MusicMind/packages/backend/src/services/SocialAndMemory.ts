import { User } from '../models/User';
import { Track } from '../models/Track';
import { Playlist } from '../models/Playlist';

/**
 * Feature 15: Social Taste Comparison
 * Compare music taste with friends - find common ground and differences
 * Shows what genres you agree on, what one friend loves the other hasn't heard yet
 */
export class SocialTasteComparison {
  async compareTasteWithFriend(userId: string, friendId: string): Promise<any> {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) throw new Error('User or friend not found');

    const userGenres = new Set(user.musicTasteDNA.primaryGenres);
    const friendGenres = new Set(friend.musicTasteDNA.primaryGenres);

    // Find overlap and unique tastes
    const commonGenres = [...userGenres].filter((g) => friendGenres.has(g));
    const onlyUserLikes = [...userGenres].filter((g) => !friendGenres.has(g));
    const onlyFriendLikes = [...friendGenres].filter((g) => !userGenres.has(g));

    // Get tracks for recommendations to each other
    const recommendToFriend = await this.getRecommendationsForFriend(user, friend, onlyUserLikes);
    const recommendToUser = await this.getRecommendationsForFriend(friend, user, onlyFriendLikes);

    // Calculate compatibility score
    const compatibilityScore = (commonGenres.length / userGenres.size) * 100;

    return {
      commonGenres,
      onlyUserLikes,
      onlyFriendLikes,
      compatibilityScore,
      recommendToFriend,
      recommendToUser,
    };
  }

  private async getRecommendationsForFriend(
    recommender: any,
    recipient: any,
    genres: string[]
  ): Promise<any[]> {
    const tracks = await Track.find({
      genre: { $in: genres },
      averageUserRating: { $gte: 4 },
    })
      .limit(10);

    return tracks;
  }
}

/**
 * Feature 16: Music Memory Curator
 * Rediscover old favorites - shows music from different periods of your life
 * with context about what was happening when you listened to them
 */
export class MusicMemoryCurator {
  async curateMusicMemories(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const history = user.listeningHistory;

    // Group listening history by month
    const memoryMonths: Record<string, any[]> = {};
    history.forEach((entry) => {
      const monthKey = entry.timestamp.toISOString().substring(0, 7); // YYYY-MM
      if (!memoryMonths[monthKey]) memoryMonths[monthKey] = [];
      memoryMonths[monthKey].push(entry);
    });

    // Build memory timeline
    const memories = Object.entries(memoryMonths)
      .reverse() // Most recent first
      .map(([month, entries]) => ({
        month,
        topGenres: this.getTopGenresFromEntries(entries),
        trackCount: entries.length,
        averageCompletionRate:
          entries.reduce((sum, e) => sum + e.completionRate, 0) / entries.length,
        mood: entries[0]?.mood || 'unknown',
      }));

    return {
      memories,
      selectedMemoryPlaylist: await this.buildMemoryPlaylist(userId, history),
    };
  }

  /**
   * Create a playlist of songs from different life chapters
   */
  async buildTimelinePlaylist(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const history = user.listeningHistory;

    // Get oldest, middle, and recent songs
    const oldest = history.slice(0, Math.min(10, history.length / 3));
    const middle = history.slice(
      Math.floor(history.length / 3),
      Math.floor((history.length * 2) / 3)
    );
    const recent = history.slice(-10);

    const timelineTrackIds = [...oldest, ...middle, ...recent].map((h) => h.trackId);

    const playlist = new Playlist({
      name: 'My Music Timeline',
      description: 'A journey through your listening history',
      creator: userId,
      tracks: timelineTrackIds.map((trackId) => ({ trackId })),
      playlistType: 'memory-curated',
      generationMeta: {
        generatedAt: new Date(),
        algorithm: 'timelineMemory',
      },
    });

    await playlist.save();
    return playlist;
  }

  private async buildMemoryPlaylist(userId: string, history: any[]): Promise<any> {
    // Get most-played track from each quarter of year
    const playlist = [];
    for (let i = 0; i < 4; i++) {
      const start = Math.floor((history.length / 4) * i);
      const end = Math.floor((history.length / 4) * (i + 1));
      const topTrack = history
        .slice(start, end)
        .sort((a, b) => b.completionRate - a.completionRate)[0];

      if (topTrack) playlist.push(topTrack.trackId);
    }

    return playlist;
  }

  private getTopGenresFromEntries(entries: any[]): string[] {
    // This would need to join with tracks to get genres
    return [];
  }
}

/**
 * Feature 17: Smart Radio Stations
 * Dynamic radio stations that blend multiple genres and adapt to mood
 * Generates infinite playlists that morph between genres based on energy level
 */
export class SmartRadioStations {
  async createSmartRadioStation(
    userId: string,
    stationName: string,
    seedGenres: string[],
    baseEnergy: number = 50
  ): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Build a large pool for infinite streaming
    const radioTracks = await Track.find({
      genre: { $in: seedGenres },
      energy: { $gte: baseEnergy - 20, $lte: baseEnergy + 20 },
    })
      .sort({ averageUserRating: -1 })
      .limit(200); // Get 200 tracks for continuous streaming

    const playlist = new Playlist({
      name: stationName,
      creator: userId,
      tracks: radioTracks.map((t) => ({ trackId: t._id })),
      playlistType: 'smart-radio',
      isPublic: true,
      radioSettings: {
        seedGenres,
        seedArtists: user.musicTasteDNA.favoriteArtists,
        energyProgression: baseEnergy,
        moodShift: true,
        bpmRange: { min: baseEnergy * 2 - 20, max: baseEnergy * 2 + 20 },
      },
      generationMeta: {
        basedOnGenres: seedGenres,
        generatedAt: new Date(),
        algorithm: 'smartRadio',
      },
    });

    await playlist.save();
    return playlist;
  }

  async generateNextRadioSegment(playlistId: string): Promise<any[]> {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist?.radioSettings) throw new Error('Not a radio playlist');

    const { seedGenres, energyProgression } = playlist.radioSettings;

    // Generate next segment with slight energy shift
    const newEnergy = energyProgression + (Math.random() - 0.5) * 20;

    const nextSegment = await Track.find({
      genre: { $in: seedGenres },
      energy: { $gte: newEnergy - 15, $lte: newEnergy + 15 },
      _id: { $nin: playlist.tracks.map((t) => t.trackId) },
    })
      .sort({ averageUserRating: -1 })
      .limit(30);

    return nextSegment;
  }
}

/**
 * Feature 19: AI Song Annotation System
 * Provides meaning behind lyrics, cultural references, and themes
 * Enriches listening experience with context and understanding
 */
export class SongAnnotationEngine {
  async generateSongAnnotations(trackId: string): Promise<any> {
    const track = await Track.findOne({ spotifyId: trackId });
    if (!track) throw new Error('Track not found');

    return {
      title: track.title,
      artist: track.artist,
      lyrics: track.lyrics || 'Lyrics not available',
      keyThemes: track.keyThemes,
      emotionalResonance: track.emotionalResonance,
      annotations: this.generateAnnotations(track),
      listeningContext: {
        bestFor: track.lifeEventsTags,
        moodMatch: track.moods.map((m) => ({ mood: m.mood, confidence: m.confidence })),
      },
    };
  }

  private generateAnnotations(track: any): any[] {
    // These would be AI-generated in real system
    return [
      {
        theme: 'Main Theme',
        explanation: `This song explores ${track.keyThemes[0] || 'universal emotions'}`,
      },
      {
        theme: 'Emotional Arc',
        explanation: `Starts with ${track.moods[0]?.mood} and evolves throughout`,
      },
      {
        theme: 'Production Notes',
        explanation: `High ${track.energy}% energy with ${track.danceability}% danceability`,
      },
    ];
  }
}

/**
 * Feature 20: Music-to-Life-Event Matcher
 * Suggest music for specific life moments - breakups, celebrations, workouts, meetings
 * Creates contextual playlists that make sense for what you're going through
 */
export class LifeEventMusicMatcher {
  private lifeEventMusicProfiles: Record<string, any> = {
    heartbreak: {
      moods: ['sad', 'melancholic', 'emotional'],
      energy: { min: 20, max: 60 },
      valence: { min: 0, max: 40 },
      themes: ['love', 'loss', 'reflection'],
    },
    celebration: {
      moods: ['happy', 'uplifting', 'energetic'],
      energy: { min: 70, max: 100 },
      valence: { min: 60, max: 100 },
      themes: ['joy', 'success', 'party'],
    },
    focus_work: {
      moods: ['focused', 'calm', 'determined'],
      energy: { min: 40, max: 70 },
      valence: { min: 40, max: 80 },
      instrumentalness: { min: 40, max: 100 },
      themes: ['productivity', 'concentration'],
    },
    motivation: {
      moods: ['energetic', 'confident', 'powerful'],
      energy: { min: 75, max: 100 },
      valence: { min: 50, max: 100 },
      themes: ['strength', 'achievement', 'power'],
    },
    introspection: {
      moods: ['thoughtful', 'nostalgic', 'melancholic'],
      energy: { min: 30, max: 60 },
      acousticness: { min: 40, max: 100 },
      themes: ['reflection', 'growth', 'change'],
    },
  };

  async createLifeEventPlaylist(
    userId: string,
    lifeEvent: string,
    playlistName?: string
  ): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const profile = this.lifeEventMusicProfiles[lifeEvent];
    if (!profile) throw new Error('Unknown life event');

    // Build query based on event profile
    const query: any = {
      genre: { $in: user.musicTasteDNA.primaryGenres },
      energy: { $gte: profile.energy.min, $lte: profile.energy.max },
      valence: { $gte: profile.valence.min, $lte: profile.valence.max },
    };

    if (profile.instrumentalness) {
      query.instrumentalness = {
        $gte: profile.instrumentalness.min,
        $lte: profile.instrumentalness.max,
      };
    }

    if (profile.acousticness) {
      query.acousticness = {
        $gte: profile.acousticness.min,
        $lte: profile.acousticness.max,
      };
    }

    const tracks = await Track.find(query)
      .sort({ averageUserRating: -1 })
      .limit(30);

    const playlist = new Playlist({
      name: playlistName || `For ${lifeEvent.replace(/_/g, ' ')}`,
      description: `Music curated for when you're ${lifeEvent.replace(/_/g, ' ')}`,
      creator: userId,
      tracks: tracks.map((t) => ({ trackId: t._id })),
      playlistType: 'life-event',
      generationMeta: {
        basedOnLifeEvent: lifeEvent,
        generatedAt: new Date(),
        algorithm: 'lifeEventMatching',
      },
    });

    await playlist.save();
    return playlist;
  }
}
