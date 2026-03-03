import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const count = await db.listing.count({
      where: {
        isVisible: true,
        isEjected: false
      }
    });

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      total_skills: count,
      version: "1.0.0"
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connection failed"
      },
      { status: 503 }
    );
  }
}