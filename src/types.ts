export interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

export interface Stats {
  totalProcessed: number;
  totalDeleted: number;
  totalSkipped: number;
  efficiency: number;
  activity: { _id: string; count: number }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface FilterCondition {
  field: 'sender' | 'subject' | 'label';
  operator: 'contains' | 'equals' | 'startsWith' | 'regex';
  value: string;
}

export type FilterAction = 'auto-delete' | 'auto-archive' | 'auto-skip' | 'categorize';

export interface Filter {
  _id: string;
  userId: string;
  name: string;
  conditions: FilterCondition[];
  action: FilterAction;
  category?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleType = 'daily' | 'weekly' | 'monthly';

export interface RuleSchedule {
  type: ScheduleType;
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface RuleExecution {
  date: string;
  emailsProcessed: number;
  success: boolean;
  error?: string;
}

export interface Rule {
  _id: string;
  userId: string;
  name: string;
  conditions: FilterCondition[];
  action: 'delete' | 'archive' | 'skip' | 'label';
  label?: string;
  schedule: RuleSchedule;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  executionHistory: RuleExecution[];
  createdAt: string;
  updatedAt: string;
}

export type SnoozeDuration = 'later_today' | 'tomorrow' | 'next_week' | 'custom';

export interface SnoozedEmail {
  _id: string;
  userId: string;
  emailId: string;
  sender: string;
  subject: string;
  snoozedUntil: string;
  originalAction?: 'delete' | 'skip';
  createdAt: string;
}

export interface SnoozeSettings {
  defaultDuration: SnoozeDuration;
  customDuration?: number;
  notifyOnReturn: boolean;
}

export interface QuickReply {
  _id: string;
  userId: string;
  name: string;
  template: string;
  createdAt: string;
  updatedAt: string;
}
