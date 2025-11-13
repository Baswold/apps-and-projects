import express, { Express } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import services
import { MoodDiscoveryEngine } from './services/MoodDiscoveryEngine';
import { IntelligentPlaylistGenerator } from './services/PlaylistGenerator';
import { ListeningHabitsAnalyzer } from './services/AnalyticsEngine';
import { WorkoutMusicMatcher } from './services/AdvancedRecommendations';
import { HiddenGemRecommender } from './services/AdvancedRecommendations';
import { MusicEraExplorer } from './services/AdvancedRecommendations';
import { SmartRadioStations } from './services/SocialAndMemory';
import { LifeEventMusicMatcher } from './services/SocialAndMemory';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicmind';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize services
const moodDiscovery = new MoodDiscoveryEngine();
const playlistGenerator = new IntelligentPlaylistGenerator();
const habitsAnalyzer = new ListeningHabitsAnalyzer();
const workoutMatcher = new WorkoutMusicMatcher();
const hiddenGemFinder = new HiddenGemRecommender();
const eraExplorer = new MusicEraExplorer();
const radioStations = new SmartRadioStations();
const lifeEventMatcher = new LifeEventMusicMatcher();

// ============================================================================
// FEATURE 1: Mood-Based Music Discovery
// ============================================================================
app.post('/api/discover/mood', async (req, res) => {
  try {
    const { userId, moodDescription, count } = req.body;
    const tracks = await moodDiscovery.discoverByMood(userId, moodDescription, count);
    res.json({ success: true, tracks });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 2: AI-Powered Playlist Auto-Generation
// ============================================================================
app.post('/api/playlists/generate', async (req, res) => {
  try {
    const { userId, playlistName, length, moodTheme } = req.body;
    const playlist = await playlistGenerator.generateSmartPlaylist(
      userId,
      playlistName,
      length,
      moodTheme
    );
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 3: Temporal Music Recommendations (Time-of-Day Aware)
// ============================================================================
app.post('/api/playlists/temporal', async (req, res) => {
  try {
    const { userId, playlistName } = req.body;
    const playlist = await playlistGenerator.generateTemporalPlaylist(userId, playlistName);
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 4: Music Discovery by Emotion Combination
// ============================================================================
app.post('/api/discover/emotion-combination', async (req, res) => {
  try {
    const { userId, emotions, count } = req.body;
    const { EmotionCombinationDiscovery } = await import('./services/MoodDiscoveryEngine');
    const discovery = new EmotionCombinationDiscovery();
    const tracks = await discovery.discoverByEmotionCombination(userId, emotions, count);
    res.json({ success: true, tracks });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 6: Listening Habits Analyzer
// ============================================================================
app.get('/api/analytics/listening-habits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const analysis = await habitsAnalyzer.analyzeListeningPatterns(userId);
    res.json({ success: true, analysis });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 9: Music Taste DNA
// ============================================================================
app.get('/api/user/:userId/taste-dna', async (req, res) => {
  try {
    const { userId } = req.params;
    const tasteDNA = await habitsAnalyzer.generateMusicTasteDNA(userId);
    res.json({ success: true, tasteDNA });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 11: Music-to-Workout Matcher
// ============================================================================
app.post('/api/playlists/workout', async (req, res) => {
  try {
    const { userId, workoutType, durationMinutes } = req.body;
    const playlist = await workoutMatcher.generateWorkoutPlaylist(
      userId,
      workoutType,
      durationMinutes
    );
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 13: Music Era Explorer
// ============================================================================
app.get('/api/eras/:era/:userId', async (req, res) => {
  try {
    const { era, userId } = req.params;
    const eraInfo = await eraExplorer.exploreEra(era, userId);
    res.json({ success: true, eraInfo });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 14: Hidden Gem Recommender
// ============================================================================
app.get('/api/discover/hidden-gems/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { count } = req.query;
    const gems = await hiddenGemFinder.findHiddenGems(userId, parseInt(count as string) || 20);
    res.json({ success: true, gems });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 17: Smart Radio Stations
// ============================================================================
app.post('/api/radio/create', async (req, res) => {
  try {
    const { userId, stationName, seedGenres, baseEnergy } = req.body;
    const station = await radioStations.createSmartRadioStation(
      userId,
      stationName,
      seedGenres,
      baseEnergy
    );
    res.json({ success: true, station });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 18: Mood Evolution Tracking
// ============================================================================
app.get('/api/analytics/mood-evolution/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const evolution = await habitsAnalyzer.analyzeMoodEvolution(userId);
    res.json({ success: true, evolution });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FEATURE 20: Music-to-Life-Event Matcher
// ============================================================================
app.post('/api/playlists/life-event', async (req, res) => {
  try {
    const { userId, lifeEvent, playlistName } = req.body;
    const playlist = await lifeEventMatcher.createLifeEventPlaylist(
      userId,
      lifeEvent,
      playlistName
    );
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'MusicMind Backend is running!' });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`MusicMind Backend running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
