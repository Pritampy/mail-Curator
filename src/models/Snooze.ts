import mongoose, { Schema, Document } from 'mongoose';

export type SnoozeDuration = 'later_today' | 'tomorrow' | 'next_week' | 'custom';

export interface ISnooze extends Document {
  userId: string;
  emailId: string;
  sender: string;
  subject: string;
  snoozedUntil: Date;
  originalAction?: 'delete' | 'skip';
  createdAt: Date;
}

export interface ISnoozeSettings extends Document {
  userId: string;
  defaultDuration: SnoozeDuration;
  customDuration?: number;
  notifyOnReturn: boolean;
}

const SnoozeSchema = new Schema<ISnooze>({
  userId: { type: String, required: true },
  emailId: { type: String, required: true },
  sender: { type: String, default: '' },
  subject: { type: String, default: '' },
  snoozedUntil: { type: Date, required: true },
  originalAction: { type: String, enum: ['delete', 'skip'] },
  createdAt: { type: Date, default: Date.now }
});

SnoozeSchema.index({ userId: 1, snoozedUntil: 1 });

const SnoozeSettingsSchema = new Schema<ISnoozeSettings>({
  userId: { type: String, required: true },
  defaultDuration: { type: String, enum: ['later_today', 'tomorrow', 'next_week', 'custom'], default: 'tomorrow' },
  customDuration: { type: Number },
  notifyOnReturn: { type: Boolean, default: true }
});

SnoozeSettingsSchema.index({ userId: 1 }, { unique: true });

export const Snooze = mongoose.model<ISnooze>('Snooze', SnoozeSchema);
export const SnoozeSettings = mongoose.model<ISnoozeSettings>('SnoozeSettings', SnoozeSettingsSchema);
