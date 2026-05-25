import { v } from "convex/values";

export const pointValidator = v.object({
  x: v.number(),
  y: v.number(),
});

export const strokeValidator = v.object({
  id: v.string(),
  color: v.string(),
  size: v.number(),
  points: v.array(pointValidator),
});
