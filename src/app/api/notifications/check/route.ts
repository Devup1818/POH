import { NextResponse } from 'next/server';
import { checkOverdueMissingParts, checkSignificantDelays } from '@/lib/actions/notification-triggers';

/**
 * GET /api/notifications/check
 * Periodic check for overdue missing parts and significant delays.
 * Can be called by a cron job or scheduled task.
 */
export async function GET() {
  try {
    const [partsResult, delaysResult] = await Promise.all([
      checkOverdueMissingParts(),
      checkSignificantDelays(),
    ]);

    return NextResponse.json({
      success: true,
      overdueParts: partsResult,
      significantDelays: delaysResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
