// TODO: Implement immediate feedback panel shown after answering
'use client';

export function FeedbackPanel({ feedback }: { feedback: string | null }) {
  if (!feedback) return null;
  return <div>{/* TODO: Show feedback text with appropriate styling */}</div>;
}
