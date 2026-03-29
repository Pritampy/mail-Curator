import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailAction extends Document {
  emailId: string;
  sender: string;
  subject: string;
  action: 'delete' | 'skip';
  timestamp: Date;
  userId: string;
}

const EmailActionSchema = new Schema<IEmailAction>({
  emailId: { type: String, required: true },
  sender: { type: String, default: '' },
  subject: { type: String, default: '' },
  action: { type: String, enum: ['delete', 'skip'], required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, default: '' }
});

EmailActionSchema.index({ timestamp: 1 });
EmailActionSchema.index({ userId: 1, timestamp: -1 });

export const EmailAction = mongoose.model<IEmailAction>('EmailAction', EmailActionSchema);
