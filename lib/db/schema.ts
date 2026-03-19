import {
  pgTable, uuid, text, numeric, integer,
  boolean, timestamp, date, jsonb,
} from 'drizzle-orm/pg-core'

// ─── AUTH (NextAuth adapter tables) ───────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  password: text('password'),
  role: text('role').default('User'),
  companyId: uuid('company_id').references(() => companies.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
})

// ─── CORE PLATFORM ────────────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  industry: text('industry'),
  size: text('size'),
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
  dimensionId: uuid('dimension_id').notNull().references(() => dimensions.id),
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
  companyId: uuid('company_id').notNull().references(() => companies.id),
  createdBy: uuid('created_by').references(() => users.id),
  status: text('status').default('Draft'),
  overallImeScore: numeric('overall_ime_score'),
  maturityLevel: text('maturity_level'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const diagnosticResponses = pgTable('diagnostic_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id').notNull().references(() => diagnosticCycles.id),
  indicatorId: uuid('indicator_id').notNull().references(() => indicators.id),
  dimensionId: uuid('dimension_id').notNull().references(() => dimensions.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  answeredBy: uuid('answered_by').references(() => users.id),
  score: integer('score'),
  desiredScore: integer('desired_score'),
  deficiencyType: text('deficiency_type'),
  feedbackShown: text('feedback_shown'),
  answeredAt: timestamp('answered_at').defaultNow(),
})

export const dimensionScores = pgTable('dimension_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id').notNull().references(() => diagnosticCycles.id),
  dimensionId: uuid('dimension_id').notNull().references(() => dimensions.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  weightedScore: numeric('weighted_score'),
  desiredScore: numeric('desired_score'),
  maturityGap: numeric('maturity_gap'),
  recommendedMinScore: numeric('recommended_min_score'),
  priorityLevel: text('priority_level'),
  pctComportamental: numeric('pct_comportamental'),
  pctFerramental: numeric('pct_ferramental'),
  pctTecnica: numeric('pct_tecnica'),
  reportPeriod: text('report_period'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const actionPlans = pgTable('action_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  dimensionId: uuid('dimension_id').references(() => dimensions.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  createdBy: uuid('created_by').references(() => users.id),
  priority: text('priority'),
  status: text('status').default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  actionPlanId: uuid('action_plan_id').references(() => actionPlans.id),
  dimensionId: uuid('dimension_id').references(() => dimensions.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  assignedTo: uuid('assigned_to').references(() => users.id),
  dueDate: date('due_date'),
  status: text('status').default('To Do'),
  requiresWeeklyCheckin: boolean('requires_weekly_checkin').default(true),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const checkins = pgTable('checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  actionPlanId: uuid('action_plan_id').references(() => actionPlans.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  submittedBy: uuid('submitted_by').references(() => users.id),
  weekStartDate: date('week_start_date'),
  progressNotes: text('progress_notes'),
  blockerNotes: text('blocker_notes'),
  confidenceRating: integer('confidence_rating'),
  newStatus: text('new_status'),
  submittedAt: timestamp('submitted_at').defaultNow(),
})

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  userId: uuid('user_id').references(() => users.id),
  alertType: text('alert_type'),
  severity: text('severity'),
  message: text('message'),
  isRead: boolean('is_read').default(false),
  relatedTaskId: uuid('related_task_id').references(() => tasks.id),
  relatedDimensionId: uuid('related_dimension_id').references(() => dimensions.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  userId: uuid('user_id').references(() => users.id),
  agentType: text('agent_type'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => aiConversations.id),
  role: text('role'),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const accelerationEvents = pgTable('acceleration_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  eventType: text('event_type'),
  title: text('title'),
  scheduledFor: timestamp('scheduled_for'),
  status: text('status').default('Scheduled'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})
