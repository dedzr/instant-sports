import { Router } from "express";
import { createMatchSchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { getMatchStatus } from "../utils/match-status.js";
import { matches } from "../db/schema.js";
import { listMatchesQuerySchema } from "../validation/matches.js";
import { desc } from "drizzle-orm";

export const matchesRouter = Router();

const MAX_LIMIT = 20;

matchesRouter.get("/", async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "invalid query",
            errors: parsed.error.flatten(),
        });
    }

    const limit = Math.min(parsed.data.limit ?? MAX_LIMIT, MAX_LIMIT);

    try {
        const data = await db
            .select()
            .from(matches)
            .orderBy(desc(matches.createdAt))
            .limit(limit);
        res.status(200).json({ data });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "internal server error" });
    }
});

matchesRouter.post("/", async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "invalid data",
            errors: parsed.error.flatten(),
        });
    }

    const { startTime, endTime, homeScore, awayScore } = parsed.data;

    const start = new Date(startTime);
    const end = new Date(endTime);

    try {
        const [event] = await db
            .insert(matches)
            .values({
                ...parsed.data,
                startTime: start,
                endTime: end,
                homeScore: homeScore ?? 0,
                awayScore: awayScore ?? 0,
                status: getMatchStatus(start, end),
            })
            .returning();

        res.status(201).json({
            message: "match created",
            match: event,
        });
    } catch (e) {
        res.status(500).json({ message: "internal server error" });
    }
});
