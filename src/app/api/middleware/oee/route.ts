import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { notifyLowOEE } from "@/lib/notifications";

/**
 * POST /api/middleware/oee
 * Update OEE metrics for a production plan
 *
 * Body:
 * {
 *   "workOrderNo": "P000001",
 *   "availability": 85.5,
 *   "performance": 90.2,
 *   "quality": 95.0
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workOrderNo, availability, performance, quality } = body;

    // Validate required fields
    if (
      !workOrderNo ||
      availability === undefined ||
      performance === undefined ||
      quality === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "workOrderNo, availability, performance, and quality are required",
        },
        { status: 400 },
      );
    }

    // Validate ranges (0-100)
    if (
      availability < 0 ||
      availability > 100 ||
      performance < 0 ||
      performance > 100 ||
      quality < 0 ||
      quality > 100
    ) {
      return NextResponse.json(
        { error: "All metrics must be between 0 and 100" },
        { status: 400 },
      );
    }

    // Find production plan
    const plan = await prisma.productionPlan.findFirst({
      where: { workOrderNo },
      include: {
        line: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: `Production plan ${workOrderNo} not found` },
        { status: 404 },
      );
    }

    // Calculate overall OEE
    const oee = (availability * performance * quality) / 10000;

    // Upsert OEE record
    const oeeRecord = await prisma.oEERecord.upsert({
      where: { planId: plan.id },
      update: {
        availability,
        performance,
        quality,
        oee,
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        planId: plan.id,
        availability,
        performance,
        quality,
        oee,
        updatedAt: new Date(),
      },
    });

    // Send notification if OEE is low
    try {
      const OEE_THRESHOLD = 65;
      if (oee < OEE_THRESHOLD) {
        await notifyLowOEE(plan.line.name, oee, OEE_THRESHOLD);
      }
    } catch (notificationError) {
      console.error("Notification error:", notificationError);
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      data: {
        availability: Number(oeeRecord.availability),
        performance: Number(oeeRecord.performance),
        quality: Number(oeeRecord.quality),
        oee: Number(oeeRecord.oee),
      },
    });
  } catch (error) {
    console.error("OEE update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/middleware/oee?workOrderNo=P000001
 * Get current OEE metrics for a production plan
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workOrderNo = searchParams.get("workOrderNo");

    if (!workOrderNo) {
      return NextResponse.json(
        { error: "workOrderNo is required" },
        { status: 400 },
      );
    }

    const plan = await prisma.productionPlan.findFirst({
      where: { workOrderNo },
      include: {
        oeeCurrent: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: `Production plan ${workOrderNo} not found` },
        { status: 404 },
      );
    }

    if (!plan.oeeCurrent) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No OEE data available yet",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        availability: Number(plan.oeeCurrent.availability),
        performance: Number(plan.oeeCurrent.performance),
        quality: Number(plan.oeeCurrent.quality),
        oee: Number(plan.oeeCurrent.oee),
        updatedAt: plan.oeeCurrent.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get OEE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
