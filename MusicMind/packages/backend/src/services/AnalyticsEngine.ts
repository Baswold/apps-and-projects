import { User } from '../models/User';
import { Track } from '../models/Track';

/**
 * Feature 6: Listening Habits Analyzer with Insights
 * Provides detailed breakdown of listening patterns, peak hours, genre distribution,
 * and generates actionable insights about music taste evolution
 */
export class ListeningHabitsAnalyzer {
  async analyzeListeningPatterns(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const history = user.listeningHistory;
    const profile = user.listeningHabitsProfile;

    // Analyze by hour
    const hourlyDistribution = this.analyzeByHour(history);

    // Analyze by day of week
    const weeklyDistribution = this.analyzeByDayOfWeek(history);

    // Calculate session duration insights
    const sessionInsights = this.analyzeSessionDurations(history);

    // Genre preferences over time (recent vs all-time)
    const genreTrends = this.analyzeGenreTrends(history);

    // Skip rate analysis - what songs don't resonate
    const skipAnalysis = this.analyzeSkipPatterns(history);

    // Mood patterns from listening history
    const moodPatterns = this.analyzeMoodPatterns(user.moodHistory);

    return {
      hourlyDistribution,
      weeklyDistribution,
      sessionInsights,
      genreTrends,
      skipAnalysis,
      moodPatterns,
      totalTracksHeard: profile.totalTracksHeard,
      averageSkipRate: profile.averageSkipRate,
      insights: this.generateInsights(hourlyDistribution, genreTrends, skipAnalysis),
    };
  }

  /**
   * Feature 9: Music Taste DNA - Comprehensive taste profile analysis
   * Generates a detailed, visual representation of someone's music taste
   * Including: energy preferences, danceability, instrumentalness, emotional depth
   */
  async generateMusicTasteDNA(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const history = user.listeningHistory;
    const tracks = await Track.find({ spotifyId: { $in: history.map((h) => h.trackId) } });

    // Calculate audio feature averages
    const avgEnergy = tracks.reduce((sum, t) => sum + t.energy, 0) / tracks.length;
    const avgDanceability = tracks.reduce((sum, t) => sum + t.danceability, 0) / tracks.length;
    const avgAcousticness = tracks.reduce((sum, t) => sum + t.acousticness, 0) / tracks.length;
    const avgInstrumentalness = tracks.reduce((sum, t) => sum + t.instrumentalness, 0) / tracks.length;
    const avgValence = tracks.reduce((sum, t) => sum + t.valence, 0) / tracks.length;

    // Update user's taste DNA
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        'musicTasteDNA.energyLevelPreferences': avgEnergy,
        'musicTasteDNA.danceabilityScore': avgDanceability,
        'musicTasteDNA.acousticnessScore': avgAcousticness,
        'musicTasteDNA.emotionalDepthScore': 100 - avgInstrumentalness, // Higher emotion = less instrumental
      },
      { new: true }
    );

    return {
      primaryGenres: updatedUser?.musicTasteDNA.primaryGenres,
      secondaryGenres: updatedUser?.musicTasteDNA.secondaryGenres,
      energyLevel: avgEnergy,
      danceability: avgDanceability,
      acousticness: avgAcousticness,
      instrumentalness: avgInstrumentalness,
      valence: avgValence,
      favoriteArtists: updatedUser?.musicTasteDNA.favoriteArtists,
      profile: this.describeTasteDNA(avgEnergy, avgDanceability, avgAcousticness),
    };
  }

  /**
   * Feature 18: Mood Evolution Tracking Over Time
   * Visualize how moods and listening patterns change over days, weeks, months
   */
  async analyzeMoodEvolution(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const moodHistory = user.moodHistory;

    // Group by date
    const byDate: Record<string, any[]> = {};
    moodHistory.forEach((entry) => {
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(entry);
    });

    // Calculate daily mood averages
    const evolution = Object.entries(byDate).map(([date, moods]) => ({
      date,
      dominantMood: this.findDominantMood(moods),
      averageIntensity: moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length,
      moodVariety: new Set(moods.map((m) => m.mood)).size,
      trackCount: moods.reduce((sum, m) => sum + m.musicListenedTo.length, 0),
    }));

    // Detect mood trends (improving, declining, stable)
    const trend = this.calculateMoodTrend(evolution);

    return {
      evolution,
      trend,
      insights: this.generateMoodEvolutionInsights(evolution, trend),
    };
  }

  private analyzeByHour(history: any[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      distribution[i] = 0;
    }

    history.forEach((entry) => {
      const hour = new Date(entry.timestamp).getHours();
      distribution[hour]++;
    });

    return distribution;
  }

  private analyzeByDayOfWeek(history: any[]): Record<string, number> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distribution: Record<string, number> = {};
    days.forEach((day) => {
      distribution[day] = 0;
    });

    history.forEach((entry) => {
      const dayName = days[new Date(entry.timestamp).getDay()];
      distribution[dayName]++;
    });

    return distribution;
  }

  private analyzeSessionDurations(history: any[]): any {
    // A session is a continuous listening period (within 30 min of last track)
    const sessions = this.groupIntoSessions(history);
    const durations = sessions.map((s) => s.duration);

    return {
      averageSessionDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      longestSession: Math.max(...durations),
      sessionCount: sessions.length,
      averageTracksPerSession: Math.round(history.length / sessions.length),
    };
  }

  private analyzeGenreTrends(history: any[]): any {
    const recentHistory = history.slice(-50); // Last 50 tracks
    const allTimeGenres: Record<string, number> = {};
    const recentGenres: Record<string, number> = {};

    history.forEach((entry) => {
      // This would need track lookup in real implementation
      allTimeGenres[entry.genre] = (allTimeGenres[entry.genre] || 0) + 1;
    });

    recentHistory.forEach((entry) => {
      recentGenres[entry.genre] = (recentGenres[entry.genre] || 0) + 1;
    });

    return { allTime: allTimeGenres, recent: recentGenres };
  }

  private analyzeSkipPatterns(history: any[]): any {
    const skipRate = (history.filter((h) => h.completionRate < 0.25).length / history.length) * 100;

    return {
      skipRate,
      totalSkips: history.filter((h) => h.completionRate < 0.25).length,
      insight: skipRate > 30 ? 'You skip more than average' : 'You complete most songs',
    };
  }

  private analyzeMoodPatterns(moodHistory: any[]): any {
    const moodCounts: Record<string, number> = {};
    moodHistory.forEach((entry) => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    const mostFrequentMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0];

    return {
      mostFrequentMood: mostFrequentMood?.[0],
      moodDistribution: moodCounts,
    };
  }

  private generateInsights(hourly: any, trends: any, skips: any): string[] {
    const insights = [];

    const peakHour = Object.entries(hourly).sort(([, a]: any, [, b]: any) => b - a)[0];
    insights.push(`Your peak listening time is around ${peakHour[0]}:00`);

    if (skips.skipRate > 30) {
      insights.push('Consider creating more curated playlists - your skip rate is higher than average');
    }

    return insights;
  }

  private groupIntoSessions(history: any[]): any[] {
    const sessions = [];
    let currentSession = [history[0]];

    for (let i = 1; i < history.length; i++) {
      const timeDiff =
        (new Date(history[i].timestamp).getTime() - new Date(history[i - 1].timestamp).getTime()) /
        (1000 * 60);

      if (timeDiff > 30) {
        // New session
        sessions.push({
          duration: timeDiff,
          tracks: currentSession.length,
        });
        currentSession = [history[i]];
      } else {
        currentSession.push(history[i]);
      }
    }

    return sessions;
  }

  private describeTasteDNA(energy: number, dance: number, acoustic: number): string {
    if (energy > 70 && dance > 70) return 'High-Energy Dance Lover';
    if (energy < 40 && acoustic > 60) return 'Acoustic & Mellow';
    if (energy > 60 && acoustic > 50) return 'Energetic Organic Sound';
    return 'Balanced Eclectic Taste';
  }

  private findDominantMood(moods: any[]): string {
    const moodCounts: Record<string, number> = {};
    moods.forEach((m) => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });
    return Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
  }

  private calculateMoodTrend(evolution: any[]): string {
    const last7Days = evolution.slice(-7);
    const recent = last7Days.reduce((sum, e) => sum + e.averageIntensity, 0) / last7Days.length;
    const previous = evolution.slice(-14, -7).reduce((sum, e) => sum + e.averageIntensity, 0) / 7;

    if (recent > previous) return 'improving';
    if (recent < previous) return 'declining';
    return 'stable';
  }

  private generateMoodEvolutionInsights(evolution: any[], trend: string): string[] {
    const insights = [];
    insights.push(`Your mood trend is ${trend}`);

    const moodVariety = evolution.map((e) => e.moodVariety).reduce((a, b) => a + b, 0) / evolution.length;
    if (moodVariety > 3) {
      insights.push('You experience a good variety of moods - emotional range is healthy');
    }

    return insights;
  }
}
