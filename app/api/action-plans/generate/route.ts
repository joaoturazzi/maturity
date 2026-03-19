import { NextResponse } from 'next/server';

// TODO: Implement action plan generation from diagnostic gaps
export async function POST(_request: Request) {
  return NextResponse.json(
    { error: 'Not implemented — available in Phase 2' },
    { status: 501 }
  );
}
