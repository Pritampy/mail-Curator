import mongoose, { Schema, Document } from 'mongoose';

export interface IFilterCondition {
  field: 'sender' | 'subject' | 'label';
  operator: 'contains' | 'equals' | 'startsWith' | 'regex';
  value: string;
}

export type FilterAction = 'auto-delete' | 'auto-archive' | 'auto-skip' | 'categorize';

export interface IFilter extends Document {
  userId: string;
  name: string;
  conditions: IFilterCondition[];
  action: FilterAction;
  category?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FilterConditionSchema = new Schema<IFilterCondition>({
  field: { type: String, enum: ['sender', 'subject', 'label'], required: true },
  operator: { type: String, enum: ['contains', 'equals', 'startsWith', 'regex'], required: true },
  value: { type: String, required: true }
}, { _id: false });

const FilterSchema = new Schema<IFilter>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  conditions: { type: [FilterConditionSchema], required: true },
  action: { type: String, enum: ['auto-delete', 'auto-archive', 'auto-skip', 'categorize'], required: true },
  category: { type: String },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

FilterSchema.index({ userId: 1, enabled: 1 });

export const Filter = mongoose.model<IFilter>('Filter', FilterSchema);
