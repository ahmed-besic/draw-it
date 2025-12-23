import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Cleanup endpoint for Vercel Cron
http.route({
    path: "/cleanup",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        // Optional: Verify cron secret for security
        const authHeader = request.headers.get("Authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Run the cleanup mutation
        const result = await ctx.runMutation(api.cleanup.deleteOldGames, {});

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }),
});

// Health check endpoint
http.route({
    path: "/health",
    method: "GET",
    handler: httpAction(async () => {
        return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }),
});

export default http;
