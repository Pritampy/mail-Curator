import mongoose, { Schema, Document } from 'mongoose';

export interface IQuickReply extends Document {
  userId: string;
  name: string;
  template: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuickReplySchema = new Schema<IQuickReply>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  template: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

QuickReplySchema.index({ userId: 1 });

export const QuickReply = mongoose.model<IQuickReply>('QuickReply', QuickReplySchema);
