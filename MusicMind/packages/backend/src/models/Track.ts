import mongoose, { Schema, Document } from 'mongoose';

export interface ITrack extends Document {
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  releaseYear: number;
  duration: number; // in seconds
  genre: string[];
  subgenres: string[];
  // Audio features
  bpm: number;
  danceability: number; // 0-100
  energy: number; // 0-100
  acousticness: number; // 0-100
  instrumentalness: number; // 0-100
  valence: number; // 0-100 (happiness/positivity)
  speechiness: number; // 0-100
  // Mood tags
  moods: Array<{
    mood: string;
    confidence: number; // 0-1
  }>;
  // Era/decade
  era: string; // "2020s", "2010s", "2000s", etc.
  // Hidden gem score (how underrated is this)
  hiddenGemScore: number; // 0-100
  // Popularity metrics
  globalPopularity: number; // 0-100
  userRatings: number[]; // Array of user ratings 1-5
  averageUserRating: number;
  // Lyrics and annotations
  lyrics?: string;
  keyThemes: string[];
  emotionalResonance: number; // 0-100
  // Social data
  timesAdded: number;
  timesSkipped: number;
  avgSkipRate: number;
  // Life events this works with
  lifeEventsTags: string[]; // "heartbreak", "celebration", "workout", etc.
  workoutSuitability: Record<string, number>; // { running: 0.8, strength: 0.6 }
  createdAt: Date;
  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    spotifyId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: { type: String, required: true },
    releaseYear: Number,
    duration: Number,
    genre: [String],
    subgenres: [String],
    bpm: Number,
    danceability: Number,
    energy: Number,
    acousticness: Number,
    instrumentalness: Number,
    valence: Number,
    speechiness: Number,
    moods: [
      {
        mood: String,
        confidence: Number,
      },
    ],
    era: String,
    hiddenGemScore: Number,
    globalPopularity: Number,
    userRatings: [Number],
    averageUserRating: Number,
    lyrics: String,
    keyThemes: [String],
    emotionalResonance: Number,
    timesAdded: { type: Number, default: 0 },
    timesSkipped: { type: Number, default: 0 },
    avgSkipRate: Number,
    lifeEventsTags: [String],
    workoutSuitability: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Track = mongoose.model<ITrack>('Track', trackSchema);
