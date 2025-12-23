import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
    // Verify authorization (Vercel sends this header for cron jobs)
    const authHeader = request.headers.get("authorization");

    // In production, verify the cron secret
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await convex.mutation(api.cleanup.deleteOldGames, {});

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Cleanup error:", error);
        return NextResponse.json(
            { error: "Cleanup failed", details: String(error) },
            { status: 500 }
        );
    }
}
