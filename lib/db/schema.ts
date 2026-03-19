import {
  pgTable, uuid, text, numeric, integer,
  boolean, timestamp, date, jsonb, index,
} from 'drizzle-orm/pg-core'

// ─── USERS (Clerk-managed auth, ID = Clerk userId) ─────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  role: text('role').default('User'),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── CORE PLATFORM ────────────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  industry: text('industry'),
  size: text('size'),
  websiteUrl: text('website_url'),
  websiteSummary: jsonb('website_summary'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const dimensions = pgTable('dimensions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  colorBg: text('color_bg'),
  orderIndex: integer('order_index'),
  isActive: boolean('is_active').default(true),
  targetScore: numeric('target_score').default('5'),
  companyId: uuid('company_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const indicators = pgTable('indicators', {
  id: uuid('id').primaryKey().defaultRandom(),
  dimensionId: uuid('dimension_id').notNull().references(() => dimensions.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  weight: numeric('weight').default('0.0333'),
  orderIndex: integer('order_index'),
  responseOptions: jsonb('response_options').notNull(),
  feedbackPerLevel: jsonb('feedback_per_level').notNull(),
  hasNaOption: boolean('has_na_option').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const diagnosticCycles = pgTable('diagnostic_cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').default('Draft'),
  overallImeScore: numeric('overall_ime_score'),
  maturityLevel: text('maturity_level'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  companyIdIdx: index('dc_company_id_idx').on(table.companyId),
  statusIdx: index('dc_status_idx').on(table.status),
  companyStatusIdx: index('dc_company_status_idx').on(table.companyId, table.status),
}))

export const diagnosticResponses = pgTable('diagnostic_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id').notNull().references(() => diagnosticCycles.id, { onDelete: 'cascade' }),
  indicatorId: uuid('indicator_id').notNull().references(() => indicators.id, { onDelete: 'cascade' }),
  dimensionId: uuid('dimension_id').notNull().references(() => dimensions.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  answeredBy: text('answered_by').references(() => users.id, { onDelete: 'set null' }),
  score: integer('score'),
  desiredScore: integer('desired_score'),
  deficiencyType: text('deficiency_type'),
  feedbackShown: text('feedback_shown'),
  answeredAt: timestamp('answered_at').defaultNow(),
}, (table) => ({
  cycleIdIdx: index('dr_cycle_id_idx').on(table.cycleId),
  cycleDimIdx: index('dr_cycle_dim_idx').on(table.cycleId, table.dimensionId),
}))

export const dimensionScores = pgTable('dimension_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id').notNull().references(() => diagnosticCycles.id, { onDelete: 'cascade' }),
  dimensionId: uuid('dimension_id').notNull().references(() => dimensions.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  weightedScore: numeric('weighted_score'),
  desiredScore: numeric('desired_score'),
  maturityGap: numeric('maturity_gap'),
  recommendedMinScore: numeric('recommended_min_score'),
  priorityLevel: text('priority_level'),
  pctComportamental: numeric('pct_comportamental'),
  pctFerramental: numeric('pct_ferramental'),
  pctTecnica: numeric('pct_tecnica'),
  reportPeriod: text('report_period'),
  narrative: text('narrative'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  cycleIdIdx: index('ds_cycle_id_idx').on(table.cycleId),
  cycleDimIdx: index('ds_cycle_dim_idx').on(table.cycleId, table.dimensionId),
}))

export const actionPlans = pgTable('action_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  dimensionId: uuid('dimension_id').references(() => dimensions.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  cycleId: uuid('cycle_id').references(() => diagnosticCycles.id, { onDelete: 'set null' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  priority: text('priority'),
  status: text('status').default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  companyIdIdx: index('ap_company_id_idx').on(table.companyId),
  companyStatusIdx: index('ap_company_status_idx').on(table.companyId, table.status),
  cycleIdIdx: index('ap_cycle_id_idx').on(table.cycleId),
}))

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  actionPlanId: uuid('action_plan_id').references(() => actionPlans.id, { onDelete: 'cascade' }),
  dimensionId: uuid('dimension_id').references(() => dimensions.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  dueDate: date('due_date'),
  status: text('status').default('To Do'),
  requiresWeeklyCheckin: boolean('requires_weekly_checkin').default(true),
  dependsOnId: uuid('depends_on_id').references((): any => tasks.id, { onDelete: 'set null' }),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  actionPlanIdIdx: index('t_action_plan_id_idx').on(table.actionPlanId),
  companyIdIdx: index('t_company_id_idx').on(table.companyId),
  statusIdx: index('t_status_idx').on(table.status),
}))

export const checkins = pgTable('checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  actionPlanId: uuid('action_plan_id').references(() => actionPlans.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  submittedBy: text('submitted_by').references(() => users.id, { onDelete: 'set null' }),
  weekStartDate: date('week_start_date'),
  progressNotes: text('progress_notes'),
  blockerNotes: text('blocker_notes'),
  confidenceRating: integer('confidence_rating'),
  newStatus: text('new_status'),
  evidenceUrl: text('evidence_url'),
  evidenceNote: text('evidence_note'),
  submittedAt: timestamp('submitted_at').defaultNow(),
}, (table) => ({
  taskIdIdx: index('ch_task_id_idx').on(table.taskId),
  taskWeekIdx: index('ch_task_week_idx').on(table.taskId, table.weekStartDate),
}))

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  alertType: text('alert_type'),
  severity: text('severity'),
  message: text('message'),
  isRead: boolean('is_read').default(false),
  relatedTaskId: uuid('related_task_id').references(() => tasks.id, { onDelete: 'set null' }),
  relatedDimensionId: uuid('related_dimension_id').references(() => dimensions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  companyReadIdx: index('al_company_read_idx').on(table.companyId, table.isRead),
}))

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  agentType: text('agent_type'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  companyAgentIdx: index('ac_company_agent_idx').on(table.companyId, table.agentType),
}))

export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => aiConversations.id, { onDelete: 'cascade' }),
  role: text('role'),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  conversationIdIdx: index('am_conversation_id_idx').on(table.conversationId),
}))

export const accelerationEvents = pgTable('acceleration_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  eventType: text('event_type'),
  title: text('title'),
  scheduledFor: timestamp('scheduled_for'),
  status: text('status').default('Scheduled'),
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
})
