import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  description: string;
  creator: mongoose.Types.ObjectId; // User ID
  tracks: Array<{
    trackId: string;
    addedAt: Date;
    addedByUser?: mongoose.Types.ObjectId;
  }>;
  collaborators: mongoose.Types.ObjectId[];
  isPublic: boolean;
  playlistType: string; // "auto-generated", "mood-based", "workout", "era", "collaborative", "smart-radio", etc.
  // For AI-generated playlists
  generationMeta: {
    basedOnMood?: string;
    basedOnGenres?: string[];
    basedOnArtists?: string[];
    basedOnEmotionCombination?: string[];
    basedOnTimeOfDay?: string;
    basedOnWorkoutType?: string;
    basedOnLifeEvent?: string;
    generatedAt: Date;
    algorithm: string; // name of the algorithm used
  };
  // For smart radio
  radioSettings?: {
    seedGenres: string[];
    seedArtists: string[];
    energyProgression: number; // 0 to 100 progression
    moodShift: boolean;
    bpmRange: { min: number; max: number };
  };
  // Collaborative features
  collaborativeMeta?: {
    friendInsightsIncluded: boolean;
    combineMode: string; // "merge", "alternate", "average"
    friendContributions: Array<{
      friendId: mongoose.Types.ObjectId;
      tracksAdded: number;
      lastContributedAt: Date;
    }>;
  };
  // Usage stats
  timesPlayed: number;
  totalDuration: number; // in seconds
  averagePlaythrough: number; // percentage completed
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    name: { type: String, required: true },
    description: String,
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tracks: [
      {
        trackId: String,
        addedAt: { type: Date, default: Date.now },
        addedByUser: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: false },
    playlistType: String,
    generationMeta: {
      basedOnMood: String,
      basedOnGenres: [String],
      basedOnArtists: [String],
      basedOnEmotionCombination: [String],
      basedOnTimeOfDay: String,
      basedOnWorkoutType: String,
      basedOnLifeEvent: String,
      generatedAt: Date,
      algorithm: String,
    },
    radioSettings: {
      seedGenres: [String],
      seedArtists: [String],
      energyProgression: Number,
      moodShift: Boolean,
      bpmRange: { min: Number, max: Number },
    },
    collaborativeMeta: {
      friendInsightsIncluded: Boolean,
      combineMode: String,
      friendContributions: [
        {
          friendId: { type: Schema.Types.ObjectId, ref: 'User' },
          tracksAdded: Number,
          lastContributedAt: Date,
        },
      ],
    },
    timesPlayed: { type: Number, default: 0 },
    totalDuration: Number,
    averagePlaythrough: Number,
  },
  { timestamps: true }
);

export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);
