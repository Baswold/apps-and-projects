import { Track } from '../models/Track';
import { User } from '../models/User';
import { Playlist } from '../models/Playlist';

/**
 * Feature 2: AI-Powered Playlist Auto-Generation
 * System learns from user's taste profile and generates cohesive playlists
 * that flow naturally from one song to the next with thematic consistency
 */
export class IntelligentPlaylistGenerator {
  /**
   * Generates a playlist by analyzing user taste DNA and creating a narrative arc
   * Songs transition smoothly in energy, mood, and theme
   */
  async generateSmartPlaylist(
    userId: string,
    playlistName: string,
    length: number = 30,
    moodTheme?: string
  ): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const primaryGenres = user.musicTasteDNA.primaryGenres;
    const energyPref = user.musicTasteDNA.energyLevelPreferences;

    let trackPool = await Track.find({
      genre: { $in: primaryGenres },
      energy: { $gte: energyPref - 15, $lte: energyPref + 15 },
    });

    // Build playlist with narrative arc
    const playlist = this.buildPlaylistArc(trackPool, length, energyPref, moodTheme);

    // Save playlist
    const newPlaylist = new Playlist({
      name: playlistName,
      creator: userId,
      tracks: playlist.map((track) => ({ trackId: track._id })),
      playlistType: 'auto-generated',
      generationMeta: {
        basedOnGenres: primaryGenres,
        generatedAt: new Date(),
        algorithm: 'intelligentArcGeneration',
      },
    });

    await newPlaylist.save();
    return newPlaylist;
  }

  /**
   * Feature 3: Temporal Music Recommendations (Time-of-Day Aware)
   * Returns different playlists depending on time of day
   * Morning = energetic & uplifting, Afternoon = focused & productive, Evening = relaxing
   */
  async generateTemporalPlaylist(userId: string, playlistName: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const currentHour = new Date().getHours();
    const timeOfDay = this.categorizeTimeOfDay(currentHour);
    const audioFeatureRequirements = this.getAudioFeaturesForTimeOfDay(timeOfDay);

    const primaryGenres = user.musicTasteDNA.primaryGenres;
    const tracks = await Track.find({
      genre: { $in: primaryGenres },
      energy: { $gte: audioFeatureRequirements.energy.min, $lte: audioFeatureRequirements.energy.max },
      valence: { $gte: audioFeatureRequirements.valence.min, $lte: audioFeatureRequirements.valence.max },
    })
      .sort({ averageUserRating: -1 })
      .limit(25);

    const newPlaylist = new Playlist({
      name: `${playlistName} - ${timeOfDay}`,
      creator: userId,
      tracks: tracks.map((track) => ({ trackId: track._id })),
      playlistType: 'temporal',
      generationMeta: {
        basedOnTimeOfDay: timeOfDay,
        generatedAt: new Date(),
        algorithm: 'temporalAwareness',
      },
    });

    await newPlaylist.save();
    return newPlaylist;
  }

  /**
   * Feature 8: Voice-to-Playlist Converter
   * User describes mood, activity, or vibe verbally -> System generates playlist
   */
  async generatePlaylistFromVoiceDescription(userId: string, description: string): Promise<any> {
    // Extract intents from natural language
    const intents = this.parseVoiceDescription(description);
    const genres = this.inferGenres(intents);
    const audioFeatures = this.inferAudioFeatures(intents);

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Find tracks matching both inferred characteristics and user taste
    const tracks = await Track.find({
      $or: [{ genre: { $in: genres } }, { genre: { $in: user.musicTasteDNA.primaryGenres } }],
      energy: { $gte: audioFeatures.energy.min, $lte: audioFeatures.energy.max },
      valence: { $gte: audioFeatures.valence.min, $lte: audioFeatures.valence.max },
    })
      .sort({ averageUserRating: -1 })
      .limit(25);

    const playlistName = this.generatePlaylistNameFromDescription(description);
    const newPlaylist = new Playlist({
      name: playlistName,
      description: description,
      creator: userId,
      tracks: tracks.map((track) => ({ trackId: track._id })),
      playlistType: 'voice-generated',
      generationMeta: {
        basedOnGenres: genres,
        generatedAt: new Date(),
        algorithm: 'voiceToPlaylist',
      },
    });

    await newPlaylist.save();
    return newPlaylist;
  }

  /**
   * Feature 10: Collaborative Smart Playlists with Friend Insights
   * Create playlists that blend user's taste with friends' tastes intelligently
   */
  async generateCollaborativePlaylist(
    userId: string,
    friendIds: string[],
    playlistName: string,
    blendMode: 'merge' | 'alternate' | 'average' = 'merge'
  ): Promise<any> {
    const user = await User.findById(userId);
    const friends = await User.find({ _id: { $in: friendIds } });

    if (!user) throw new Error('User not found');

    // Collect all genre preferences
    const allGenres = new Set([...user.musicTasteDNA.primaryGenres]);
    friends.forEach((friend) => {
      friend.musicTasteDNA.primaryGenres.forEach((genre) => allGenres.add(genre));
    });

    // Get tracks that appeal to the group
    const trackPool = await Track.find({
      genre: { $in: Array.from(allGenres) },
    });

    const selectedTracks = this.selectTracksBasedOnBlendMode(trackPool, user, friends, blendMode);

    const newPlaylist = new Playlist({
      name: playlistName,
      creator: userId,
      collaborators: friendIds.map((id) => id as any),
      tracks: selectedTracks.map((track) => ({ trackId: track._id })),
      playlistType: 'collaborative',
      isPublic: true,
      collaborativeMeta: {
        friendInsightsIncluded: true,
        combineMode: blendMode,
        friendContributions: friendIds.map((friendId) => ({
          friendId: friendId as any,
          tracksAdded: Math.floor(selectedTracks.length / (friendIds.length + 1)),
          lastContributedAt: new Date(),
        })),
      },
      generationMeta: {
        basedOnArtists: [...user.musicTasteDNA.favoriteArtists],
        generatedAt: new Date(),
        algorithm: 'collaborativeBlend',
      },
    });

    await newPlaylist.save();
    return newPlaylist;
  }

  private buildPlaylistArc(
    trackPool: any[],
    length: number,
    targetEnergy: number,
    moodTheme?: string
  ): any[] {
    // Create a narrative arc with 3 phases: build-up, peak, cool-down
    const buildUpLength = Math.floor(length * 0.3);
    const peakLength = Math.floor(length * 0.4);
    const coolDownLength = length - buildUpLength - peakLength;

    const buildUpTracks = trackPool
      .filter((t) => t.energy < targetEnergy * 0.7)
      .sort(() => Math.random())
      .slice(0, buildUpLength);

    const peakTracks = trackPool
      .filter((t) => t.energy >= targetEnergy * 0.7 && t.energy <= targetEnergy * 1.3)
      .sort(() => Math.random())
      .slice(0, peakLength);

    const coolDownTracks = trackPool
      .filter((t) => t.energy < targetEnergy * 0.6)
      .sort(() => Math.random())
      .slice(0, coolDownLength);

    return [...buildUpTracks, ...peakTracks, ...coolDownTracks];
  }

  private categorizeTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getAudioFeaturesForTimeOfDay(
    timeOfDay: string
  ): { energy: { min: number; max: number }; valence: { min: number; max: number } } {
    const features = {
      morning: { energy: { min: 60, max: 100 }, valence: { min: 50, max: 100 } },
      afternoon: { energy: { min: 40, max: 80 }, valence: { min: 40, max: 90 } },
      evening: { energy: { min: 30, max: 70 }, valence: { min: 30, max: 80 } },
      night: { energy: { min: 20, max: 50 }, valence: { min: 20, max: 70 } },
    };
    return features[timeOfDay as keyof typeof features] || features.afternoon;
  }

  private parseVoiceDescription(description: string): string[] {
    // Extract key intents/activities from description
    const intents: string[] = [];
    const keywords = {
      workout: ['workout', 'exercise', 'run', 'gym', 'training'],
      focus: ['focus', 'concentrate', 'work', 'study', 'productive'],
      party: ['party', 'dance', 'celebrate', 'club', 'friends'],
      relax: ['relax', 'chill', 'calm', 'unwind', 'mellow'],
      emotional: ['cry', 'emotional', 'heartbreak', 'sad', 'lonely'],
    };

    const lowerDesc = description.toLowerCase();
    for (const [intent, words] of Object.entries(keywords)) {
      if (words.some((word) => lowerDesc.includes(word))) {
        intents.push(intent);
      }
    }

    return intents;
  }

  private inferGenres(intents: string[]): string[] {
    const genreMap: Record<string, string[]> = {
      workout: ['electronic', 'hip-hop', 'pop', 'dance'],
      focus: ['ambient', 'lo-fi', 'electronic', 'classical'],
      party: ['electronic', 'dance', 'hip-hop', 'pop'],
      relax: ['ambient', 'acoustic', 'indie', 'folk'],
      emotional: ['indie', 'acoustic', 'folk', 'soul'],
    };

    const genres = new Set<string>();
    intents.forEach((intent) => {
      genreMap[intent]?.forEach((genre) => genres.add(genre));
    });

    return Array.from(genres);
  }

  private inferAudioFeatures(
    intents: string[]
  ): { energy: { min: number; max: number }; valence: { min: number; max: number } } {
    let energy = { min: 40, max: 80 };
    let valence = { min: 40, max: 80 };

    if (intents.includes('workout')) {
      energy = { min: 75, max: 100 };
      valence = { min: 50, max: 100 };
    }
    if (intents.includes('focus')) {
      energy = { min: 30, max: 60 };
      valence = { min: 40, max: 70 };
    }
    if (intents.includes('relax')) {
      energy = { min: 20, max: 50 };
      valence = { min: 40, max: 80 };
    }
    if (intents.includes('emotional')) {
      energy = { min: 20, max: 60 };
      valence = { min: 0, max: 40 };
    }

    return { energy, valence };
  }

  private generatePlaylistNameFromDescription(description: string): string {
    const words = description.split(' ').slice(0, 3).join(' ');
    return `${words} Playlist`;
  }

  private selectTracksBasedOnBlendMode(
    trackPool: any[],
    user: any,
    friends: any[],
    blendMode: string
  ): any[] {
    if (blendMode === 'alternate') {
      // Alternate between user and friend preferences
      const userTracks = trackPool.filter((t) =>
        user.musicTasteDNA.primaryGenres.some((g) => t.genre.includes(g))
      );
      const friendTracks = trackPool.filter((t) =>
        friends.some((f) => f.musicTasteDNA.primaryGenres.some((g) => t.genre.includes(g)))
      );

      const result = [];
      for (let i = 0; i < Math.max(userTracks.length, friendTracks.length); i++) {
        if (i < userTracks.length) result.push(userTracks[i]);
        if (i < friendTracks.length) result.push(friendTracks[i]);
      }
      return result;
    }

    // Default merge mode: get best tracks from the pool
    return trackPool.sort((a, b) => b.averageUserRating - a.averageUserRating).slice(0, 25);
  }
}
