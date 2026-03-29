import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  sessionToken: string;
  tokens: any;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionToken: { type: String, required: true, unique: true, index: true },
  tokens: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL: 24 hours
});

export const Session = mongoose.model<ISession>('Session', SessionSchema);
