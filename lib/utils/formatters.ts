/**
 * Format a score to one decimal place
 */
export function formatScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Format a percentage (0-1) to display string
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Format a date string to locale format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

/**
 * Format a date string to relative time (e.g., "há 2 dias")
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
  return `Há ${Math.floor(diffDays / 30)} meses`;
}

/**
 * Get the Monday of the current week (ISO week start)
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
