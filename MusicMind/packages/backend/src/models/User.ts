import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  musicTasteDNA: {
    primaryGenres: string[];
    secondaryGenres: string[];
    favoriteArtists: string[];
    moodPreferences: Record<string, number>;
    energyLevelPreferences: number; // 0-100
    danceabilityScore: number;
    acousticnessScore: number;
    emotionalDepthScore: number;
  };
  listeningHabitsProfile: {
    averageSessionDuration: number;
    peakListeningHours: number[];
    genreDistribution: Record<string, number>;
    totalTracksHeard: number;
    averageSkipRate: number;
  };
  moodHistory: Array<{
    timestamp: Date;
    mood: string;
    intensity: number; // 0-10
    musicListenedTo: string[]; // track IDs
  }>;
  friends: mongoose.Types.ObjectId[];
  savedPlaylists: mongoose.Types.ObjectId[];
  createdPlaylists: mongoose.Types.ObjectId[];
  listeningHistory: Array<{
    trackId: string;
    artistId: string;
    timestamp: Date;
    completionRate: number; // percentage
    mood?: string;
  }>;
  workoutProfiles: Array<{
    type: string; // running, cycling, strength, etc.
    preferredBPMRange: { min: number; max: number };
    favoriteGenres: string[];
  }>;
  theme: 'light' | 'dark';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    musicTasteDNA: {
      primaryGenres: [String],
      secondaryGenres: [String],
      favoriteArtists: [String],
      moodPreferences: Schema.Types.Mixed,
      energyLevelPreferences: Number,
      danceabilityScore: Number,
      acousticnessScore: Number,
      emotionalDepthScore: Number,
    },
    listeningHabitsProfile: {
      averageSessionDuration: Number,
      peakListeningHours: [Number],
      genreDistribution: Schema.Types.Mixed,
      totalTracksHeard: Number,
      averageSkipRate: Number,
    },
    moodHistory: [
      {
        timestamp: Date,
        mood: String,
        intensity: Number,
        musicListenedTo: [String],
      },
    ],
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    savedPlaylists: [{ type: Schema.Types.ObjectId, ref: 'Playlist' }],
    createdPlaylists: [{ type: Schema.Types.ObjectId, ref: 'Playlist' }],
    listeningHistory: [
      {
        trackId: String,
        artistId: String,
        timestamp: Date,
        completionRate: Number,
        mood: String,
      },
    ],
    workoutProfiles: [
      {
        type: String,
        preferredBPMRange: { min: Number, max: Number },
        favoriteGenres: [String],
      },
    ],
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
