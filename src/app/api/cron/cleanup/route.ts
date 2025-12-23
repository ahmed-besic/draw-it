import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Verify authorization (Vercel sends this header for cron jobs)
    const authHeader = request.headers.get("authorization");

    // In production, verify the cron secret
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Convex deployment URL (use .site for HTTP actions)
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        return NextResponse.json({ error: "CONVEX_URL not configured" }, { status: 500 });
    }

    // Convert cloud URL to site URL for HTTP actions
    const siteUrl = convexUrl.replace(".cloud", ".site");

    try {
        const response = await fetch(`${siteUrl}/cleanup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(process.env.CRON_SECRET && { "Authorization": `Bearer ${process.env.CRON_SECRET}` }),
            },
        });

        const result = await response.json();

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
