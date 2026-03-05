import { z } from "zod";

export const MATCH_STATUS = z.enum(["scheduled", "live", "finished"]);

export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});
const isDateString = z.iso.datetime();

export const createMatchSchema = z
    .object({
        sport: z.string().min(1),
        homeTeam: z.string().min(1),
        awayTeam: z.string().min(1),
        startTime: isDateString,
        endTime: isDateString,
        homeScore: z.coerce.number().int().nonnegative().optional(),
        awayScore: z.coerce.number().int().nonnegative().optional(),
    })
    .superRefine((data, ctx) => {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);

        if (start >= end) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "start time must be before end time",
                path: ["startTime"],
            });
        }
    });

export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().nonnegative(),
    awayScore: z.coerce.number().int().nonnegative(),
});
