import mongoose, { Schema, Document } from 'mongoose';

export type ScheduleType = 'daily' | 'weekly' | 'monthly';

export interface IRule extends Document {
  userId: string;
  name: string;
  conditions: {
    field: 'sender' | 'subject' | 'label';
    operator: 'contains' | 'equals' | 'startsWith' | 'regex';
    value: string;
  }[];
  action: 'delete' | 'archive' | 'skip' | 'label';
  label?: string;
  schedule: {
    type: ScheduleType;
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  executionHistory: Array<{
    date: Date;
    emailsProcessed: number;
    success: boolean;
    error?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const RuleConditionSchema = new Schema({
  field: { type: String, enum: ['sender', 'subject', 'label'], required: true },
  operator: { type: String, enum: ['contains', 'equals', 'startsWith', 'regex'], required: true },
  value: { type: String, required: true }
}, { _id: false });

const ExecutionHistorySchema = new Schema({
  date: { type: Date, required: true },
  emailsProcessed: { type: Number, required: true },
  success: { type: Boolean, required: true },
  error: { type: String }
}, { _id: false });

const RuleSchema = new Schema<IRule>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  conditions: { type: [RuleConditionSchema], required: true },
  action: { type: String, enum: ['delete', 'archive', 'skip', 'label'], required: true },
  label: { type: String },
  schedule: {
    type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    time: { type: String, required: true },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    dayOfMonth: { type: Number, min: 1, max: 31 }
  },
  enabled: { type: Boolean, default: true },
  lastRun: { type: Date },
  nextRun: { type: Date },
  executionHistory: { type: [ExecutionHistorySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

RuleSchema.index({ userId: 1, enabled: 1, nextRun: 1 });

export const Rule = mongoose.model<IRule>('Rule', RuleSchema);
