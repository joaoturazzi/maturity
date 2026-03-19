import { relations } from 'drizzle-orm'
import {
  users, companies, dimensions, indicators,
  diagnosticCycles, diagnosticResponses, dimensionScores,
  actionPlans, tasks, checkins, alerts,
  aiConversations, aiMessages, accelerationEvents,
} from './schema'

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
}))

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  diagnosticCycles: many(diagnosticCycles),
  actionPlans: many(actionPlans),
  tasks: many(tasks),
  alerts: many(alerts),
}))

export const dimensionsRelations = relations(dimensions, ({ many }) => ({
  indicators: many(indicators),
  dimensionScores: many(dimensionScores),
}))

export const indicatorsRelations = relations(indicators, ({ one }) => ({
  dimension: one(dimensions, { fields: [indicators.dimensionId], references: [dimensions.id] }),
}))

export const diagnosticCyclesRelations = relations(diagnosticCycles, ({ one, many }) => ({
  company: one(companies, { fields: [diagnosticCycles.companyId], references: [companies.id] }),
  createdByUser: one(users, { fields: [diagnosticCycles.createdBy], references: [users.id] }),
  responses: many(diagnosticResponses),
  dimensionScores: many(dimensionScores),
}))

export const diagnosticResponsesRelations = relations(diagnosticResponses, ({ one }) => ({
  cycle: one(diagnosticCycles, { fields: [diagnosticResponses.cycleId], references: [diagnosticCycles.id] }),
  indicator: one(indicators, { fields: [diagnosticResponses.indicatorId], references: [indicators.id] }),
  dimension: one(dimensions, { fields: [diagnosticResponses.dimensionId], references: [dimensions.id] }),
  company: one(companies, { fields: [diagnosticResponses.companyId], references: [companies.id] }),
  answeredByUser: one(users, { fields: [diagnosticResponses.answeredBy], references: [users.id] }),
}))

export const dimensionScoresRelations = relations(dimensionScores, ({ one }) => ({
  cycle: one(diagnosticCycles, { fields: [dimensionScores.cycleId], references: [diagnosticCycles.id] }),
  dimension: one(dimensions, { fields: [dimensionScores.dimensionId], references: [dimensions.id] }),
  company: one(companies, { fields: [dimensionScores.companyId], references: [companies.id] }),
}))

export const actionPlansRelations = relations(actionPlans, ({ one, many }) => ({
  dimension: one(dimensions, { fields: [actionPlans.dimensionId], references: [dimensions.id] }),
  company: one(companies, { fields: [actionPlans.companyId], references: [companies.id] }),
  createdByUser: one(users, { fields: [actionPlans.createdBy], references: [users.id] }),
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  actionPlan: one(actionPlans, { fields: [tasks.actionPlanId], references: [actionPlans.id] }),
  dimension: one(dimensions, { fields: [tasks.dimensionId], references: [dimensions.id] }),
  company: one(companies, { fields: [tasks.companyId], references: [companies.id] }),
  assignedUser: one(users, { fields: [tasks.assignedTo], references: [users.id] }),
  checkins: many(checkins),
}))

export const checkinsRelations = relations(checkins, ({ one }) => ({
  task: one(tasks, { fields: [checkins.taskId], references: [tasks.id] }),
  actionPlan: one(actionPlans, { fields: [checkins.actionPlanId], references: [actionPlans.id] }),
  company: one(companies, { fields: [checkins.companyId], references: [companies.id] }),
  submittedByUser: one(users, { fields: [checkins.submittedBy], references: [users.id] }),
}))

export const alertsRelations = relations(alerts, ({ one }) => ({
  company: one(companies, { fields: [alerts.companyId], references: [companies.id] }),
  user: one(users, { fields: [alerts.userId], references: [users.id] }),
  relatedTask: one(tasks, { fields: [alerts.relatedTaskId], references: [tasks.id] }),
  relatedDimension: one(dimensions, { fields: [alerts.relatedDimensionId], references: [dimensions.id] }),
}))

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  company: one(companies, { fields: [aiConversations.companyId], references: [companies.id] }),
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
  messages: many(aiMessages),
}))

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, { fields: [aiMessages.conversationId], references: [aiConversations.id] }),
}))

export const accelerationEventsRelations = relations(accelerationEvents, ({ one }) => ({
  company: one(companies, { fields: [accelerationEvents.companyId], references: [companies.id] }),
  createdByUser: one(users, { fields: [accelerationEvents.createdBy], references: [users.id] }),
}))
