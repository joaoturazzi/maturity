// Types matching Supabase database schema
// Will be auto-generated via `supabase gen types` in production

export type CompanySize = 'Small' | 'Medium' | 'Large';
export type UserRole = 'User' | 'SuperUser' | 'Admin';
export type DiagnosticStatus = 'Draft' | 'Submitted';
export type MaturityLevel = 'Initial' | 'Developing' | 'Defined' | 'Managed' | 'Optimized';
export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';
export type ActionPlanStatus = 'Active' | 'Completed' | 'Archived';
export type AlertType = 'Overdue Task' | 'Missing Check-in' | 'Stalled Dimension' | 'Diagnostic Due';
export type AgentType = 'Estratégia' | 'Produto' | 'Mercado' | 'Finanças' | 'Branding' | 'Orquestrador';
export type DeficiencyType = 'Comportamental' | 'Ferramental' | 'Técnica';
export type AccelerationEventType = 'Building Day' | 'Expert Session' | 'Board Meeting';
export type AccelerationEventStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Company {
  id: string;
  name: string;
  industry: string | null;
  size: CompanySize | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  company_id: string | null;
  created_at: string;
}

export interface Dimension {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  order_index: number | null;
  is_active: boolean;
  target_score: number;
  company_id: string | null;
  created_at: string;
}

export interface ResponseOption {
  level: number;
  text: string;
}

export interface FeedbackPerLevel {
  level: number;
  feedback: string;
}

export interface Indicator {
  id: string;
  dimension_id: string | null;
  title: string;
  description: string | null;
  weight: number;
  order_index: number | null;
  response_options: ResponseOption[];
  feedback_per_level: FeedbackPerLevel[];
  created_at: string;
}

export interface DiagnosticCycle {
  id: string;
  company_id: string | null;
  created_by: string | null;
  status: DiagnosticStatus;
  overall_ime_score: number | null;
  maturity_level: MaturityLevel | null;
  submitted_at: string | null;
  created_at: string;
}

export interface DiagnosticResponse {
  id: string;
  cycle_id: string | null;
  indicator_id: string | null;
  dimension_id: string | null;
  company_id: string | null;
  answered_by: string | null;
  score: number | null;
  desired_score: number | null;
  deficiency_type: string | null;
  feedback_shown: string | null;
  answered_at: string;
}

export interface DimensionScore {
  id: string;
  cycle_id: string | null;
  dimension_id: string | null;
  company_id: string | null;
  weighted_score: number | null;
  desired_score: number | null;
  maturity_gap: number | null;
  recommended_min_score: number | null;
  priority_level: PriorityLevel | null;
  pct_comportamental: number | null;
  pct_ferramental: number | null;
  pct_tecnica: number | null;
  report_period: string | null;
  created_at: string;
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string | null;
  dimension_id: string | null;
  company_id: string | null;
  created_by: string | null;
  priority: PriorityLevel | null;
  status: ActionPlanStatus;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  action_plan_id: string | null;
  dimension_id: string | null;
  company_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: TaskStatus;
  requires_weekly_checkin: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Checkin {
  id: string;
  task_id: string | null;
  action_plan_id: string | null;
  company_id: string | null;
  submitted_by: string | null;
  week_start_date: string | null;
  progress_notes: string | null;
  blocker_notes: string | null;
  confidence_rating: number | null;
  new_status: string | null;
  submitted_at: string;
}

export interface Alert {
  id: string;
  company_id: string | null;
  user_id: string | null;
  alert_type: AlertType | null;
  severity: PriorityLevel | null;
  message: string | null;
  is_read: boolean;
  related_task_id: string | null;
  related_dimension_id: string | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  company_id: string | null;
  user_id: string | null;
  agent_type: AgentType | null;
  last_message_at: string | null;
  created_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string | null;
  role: 'user' | 'assistant';
  content: string | null;
  created_at: string;
}

export interface AccelerationEvent {
  id: string;
  company_id: string | null;
  event_type: AccelerationEventType | null;
  title: string | null;
  scheduled_for: string | null;
  status: AccelerationEventStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
