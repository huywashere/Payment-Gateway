import { NextResponse } from 'next/server';
import { portalAuthMode } from '@/lib/portal-auth';

export async function GET() {
  return NextResponse.json({ mode: portalAuthMode() }, {
    headers: { 'cache-control': 'no-store' },
  });
}
