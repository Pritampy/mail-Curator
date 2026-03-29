import mongoose from 'mongoose';
import { EmailAction, IEmailAction } from '../models/EmailAction';
import { Milestone } from '../models/Milestone';
import { Filter, IFilter } from '../models/Filter';
import { Rule, IRule } from '../models/Rule';
import { Snooze, SnoozeSettings, ISnooze, ISnoozeSettings } from '../models/Snooze';
import { QuickReply, IQuickReply } from '../models/QuickReply';

export interface Stats {
  totalProcessed: number;
  totalDeleted: number;
  totalSkipped: number;
  efficiency: number;
  activity: Array<{ _id: string; count: number }>;
}

export interface EmailActionInput {
  emailId: string;
  sender: string;
  subject: string;
  action: 'delete' | 'skip';
  userId: string;
}

export class DbService {
  private connected: boolean = false;

  async connect(mongoUri: string): Promise<void> {
    if (this.connected) return;

    try {
      await mongoose.connect(mongoUri);
      this.connected = true;
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async saveAction(action: EmailActionInput): Promise<IEmailAction> {
    const newAction = new EmailAction({
      ...action,
      timestamp: new Date()
    });
    return await newAction.save();
  }

  async getActions(userId: string): Promise<IEmailAction[]> {
    return await EmailAction.find({ userId }).sort({ timestamp: -1 }).limit(100);
  }

  async getStats(userId: string): Promise<Stats> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const actions = await EmailAction.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 },
          deleted: {
            $sum: { $cond: [{ $eq: ['$action', 'delete'] }, 1, 0] }
          },
          skipped: {
            $sum: { $cond: [{ $eq: ['$action', 'skip'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totals = await EmailAction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalProcessed: { $sum: 1 },
          totalDeleted: { $sum: { $cond: [{ $eq: ['$action', 'delete'] }, 1, 0] } },
          totalSkipped: { $sum: { $cond: [{ $eq: ['$action', 'skip'] }, 1, 0] } }
        }
      }
    ]);

    const total = totals[0] || { totalProcessed: 0, totalDeleted: 0, totalSkipped: 0 };

    const activityMap: Record<string, { count: number; deleted: number; skipped: number }> = {};
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      activityMap[dateStr] = { count: 0, deleted: 0, skipped: 0 };
    }

    actions.forEach(a => {
      if (activityMap[a._id]) {
        activityMap[a._id] = { count: a.count, deleted: a.deleted, skipped: a.skipped };
      }
    });

    const activity = Object.entries(activityMap)
      .map(([date, data]) => ({
        _id: date,
        count: data.count
      }))
      .sort((a, b) => a._id.localeCompare(b._id));

    return {
      totalProcessed: total.totalProcessed,
      totalDeleted: total.totalDeleted,
      totalSkipped: total.totalSkipped,
      efficiency: total.totalProcessed > 0
        ? parseFloat(((total.totalDeleted / total.totalProcessed) * 100).toFixed(1))
        : 0,
      activity
    };
  }

  async undoAction(emailId: string, userId: string): Promise<void> {
    const action = await EmailAction.findOne({ emailId, userId, action: 'delete' });
    if (action) {
      await EmailAction.deleteOne({ _id: action._id });
    }
  }

  async getMilestones(userId: string): Promise<Array<{ milestoneId: string; completed: boolean; progress: number; target: number }>> {
    const defaultMilestones = [
      { milestoneId: 'space_guardian', target: 10000 },
      { milestoneId: 'inbox_zero_streak', target: 7 }
    ];

    const milestones = await Promise.all(
      defaultMilestones.map(async (def) => {
        let milestone = await Milestone.findOne({ userId, milestoneId: def.milestoneId });
        if (!milestone) {
          milestone = await Milestone.create({
            userId,
            milestoneId: def.milestoneId,
            completed: false,
            progress: 0,
            target: def.target,
            lastUpdated: new Date()
          });
        }
        return {
          milestoneId: milestone.milestoneId,
          completed: milestone.completed,
          progress: milestone.progress,
          target: milestone.target
        };
      })
    );

    return milestones;
  }

  async updateMilestoneProgress(userId: string, milestoneId: string, progress: number): Promise<void> {
    const milestone = await Milestone.findOne({ userId, milestoneId });
    if (!milestone) return;

    milestone.progress = progress;
    milestone.lastUpdated = new Date();

    if (progress >= milestone.target && !milestone.completed) {
      milestone.completed = true;
    }

    await milestone.save();
  }

  async getInboxPrediction(userId: string): Promise<{ predictedGrowth: number; trend: 'up' | 'down' | 'stable' }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyCounts = await EmailAction.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    if (dailyCounts.length === 0) {
      return { predictedGrowth: 0, trend: 'stable' };
    }

    const totalDeleted = dailyCounts.reduce((sum, day) => sum + day.count, 0);
    const avgDeleted = totalDeleted / dailyCounts.length;
    const predictedGrowth = Math.round(avgDeleted);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (dailyCounts.length >= 2) {
      const recentAvg = dailyCounts.slice(-3).reduce((s, d) => s + d.count, 0) / Math.min(3, dailyCounts.length);
      const olderAvg = dailyCounts.slice(0, 3).reduce((s, d) => s + d.count, 0) / Math.min(3, dailyCounts.length);
      if (recentAvg > olderAvg * 1.2) trend = 'up';
      else if (recentAvg < olderAvg * 0.8) trend = 'down';
    }

    return { predictedGrowth, trend };
  }

  async createFilter(filter: Partial<IFilter>): Promise<IFilter> {
    const newFilter = new Filter({
      ...filter,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await newFilter.save();
  }

  async getFilters(userId: string): Promise<IFilter[]> {
    return await Filter.find({ userId }).sort({ createdAt: -1 });
  }

  async updateFilter(filterId: string, userId: string, updates: Partial<IFilter>): Promise<IFilter | null> {
    return await Filter.findOneAndUpdate(
      { _id: filterId, userId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
  }

  async deleteFilter(filterId: string, userId: string): Promise<void> {
    await Filter.deleteOne({ _id: filterId, userId });
  }

  async toggleFilter(filterId: string, userId: string, enabled: boolean): Promise<IFilter | null> {
    return await Filter.findOneAndUpdate(
      { _id: filterId, userId },
      { enabled, updatedAt: new Date() },
      { new: true }
    );
  }

  async createRule(rule: Partial<IRule>): Promise<IRule> {
    const nextRun = this.calculateNextRun(rule.schedule);
    const newRule = new Rule({
      ...rule,
      nextRun,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await newRule.save();
  }

  async getRules(userId: string): Promise<IRule[]> {
    return await Rule.find({ userId }).sort({ createdAt: -1 });
  }

  async updateRule(ruleId: string, userId: string, updates: Partial<IRule>): Promise<IRule | null> {
    const updateData: Partial<IRule> = { ...updates, updatedAt: new Date() };
    if (updates.schedule) {
      updateData.nextRun = this.calculateNextRun(updates.schedule);
    }
    return await Rule.findOneAndUpdate(
      { _id: ruleId, userId },
      updateData,
      { new: true }
    );
  }

  async deleteRule(ruleId: string, userId: string): Promise<void> {
    await Rule.deleteOne({ _id: ruleId, userId });
  }

  async toggleRule(ruleId: string, userId: string, enabled: boolean): Promise<IRule | null> {
    return await Rule.findOneAndUpdate(
      { _id: ruleId, userId },
      { enabled, updatedAt: new Date() },
      { new: true }
    );
  }

  async getRulesDueForExecution(): Promise<IRule[]> {
    const now = new Date();
    return await Rule.find({ enabled: true, nextRun: { $lte: now } });
  }

  async recordRuleExecution(ruleId: string, emailsProcessed: number, success: boolean, error?: string): Promise<void> {
    const rule = await Rule.findById(ruleId);
    if (!rule) return;

    rule.executionHistory.push({
      date: new Date(),
      emailsProcessed,
      success,
      error
    });
    if (rule.executionHistory.length > 50) {
      rule.executionHistory = rule.executionHistory.slice(-50);
    }
    rule.lastRun = new Date();
    rule.nextRun = this.calculateNextRun(rule.schedule);
    await rule.save();
  }

  private calculateNextRun(schedule: IRule['schedule']): Date {
    const now = new Date();
    const [hours, minutes] = (schedule.time || '09:00').split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    switch (schedule.type) {
      case 'daily':
        if (next <= now) next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        const dayOfWeek = schedule.dayOfWeek ?? 1;
        while (next.getDay() !== dayOfWeek || next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;
      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth ?? 1;
        next.setDate(dayOfMonth);
        if (next <= now) next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }

  async snoozeEmail(emailId: string, sender: string, subject: string, snoozedUntil: Date, userId: string, originalAction?: 'delete' | 'skip'): Promise<ISnooze> {
    const snooze = new Snooze({
      userId,
      emailId,
      sender,
      subject,
      snoozedUntil,
      originalAction,
      createdAt: new Date()
    });
    return await snooze.save();
  }

  async getSnoozedEmails(userId: string): Promise<ISnooze[]> {
    return await Snooze.find({ userId }).sort({ snoozedUntil: 1 });
  }

  async unsnoozeEmail(snoozeId: string, userId: string): Promise<void> {
    await Snooze.deleteOne({ _id: snoozeId, userId });
  }

  async getEmailsDueForReturn(userId: string): Promise<ISnooze[]> {
    const now = new Date();
    return await Snooze.find({ userId, snoozedUntil: { $lte: now } });
  }

  async extendSnooze(snoozeId: string, userId: string, newSnoozedUntil: Date): Promise<ISnooze | null> {
    return await Snooze.findOneAndUpdate(
      { _id: snoozeId, userId },
      { snoozedUntil: newSnoozedUntil },
      { new: true }
    );
  }

  async getSnoozeSettings(userId: string): Promise<ISnoozeSettings | null> {
    return await SnoozeSettings.findOne({ userId });
  }

  async updateSnoozeSettings(userId: string, settings: Partial<ISnoozeSettings>): Promise<ISnoozeSettings> {
    return await SnoozeSettings.findOneAndUpdate(
      { userId },
      settings,
      { new: true, upsert: true }
    );
  }

  async createQuickReply(userId: string, name: string, template: string): Promise<IQuickReply> {
    const reply = new QuickReply({
      userId,
      name,
      template,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await reply.save();
  }

  async getQuickReplies(userId: string): Promise<IQuickReply[]> {
    return await QuickReply.find({ userId }).sort({ createdAt: -1 });
  }

  async updateQuickReply(id: string, userId: string, updates: Partial<IQuickReply>): Promise<IQuickReply | null> {
    return await QuickReply.findOneAndUpdate(
      { _id: id, userId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
  }

  async deleteQuickReply(id: string, userId: string): Promise<void> {
    await QuickReply.deleteOne({ _id: id, userId });
  }
}
