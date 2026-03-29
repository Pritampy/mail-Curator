import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestone extends Document {
  userId: string;
  milestoneId: 'space_guardian' | 'inbox_zero_streak';
  completed: boolean;
  progress: number;
  target: number;
  lastUpdated: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  userId: { type: String, required: true },
  milestoneId: { type: String, enum: ['space_guardian', 'inbox_zero_streak'], required: true },
  completed: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  target: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

MilestoneSchema.index({ userId: 1, milestoneId: 1 }, { unique: true });

export const Milestone = mongoose.model<IMilestone>('Milestone', MilestoneSchema);
