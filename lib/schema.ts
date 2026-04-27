import { z } from "zod";

export const SongFrontmatterSchema = z.object({
  title: z.string(),
  artist: z.string().optional(),
  bpm: z.number().int().positive().optional(),
  timeSig: z.string().default("4/4"),
  capo: z.number().int().min(0).max(12).default(0),
  status: z
    .enum(["lernen-aktuell", "kann-ich", "archiv"])
    .default("lernen-aktuell"),
  stars: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).default([]),
  key: z.string().optional(),
});

export type SongFrontmatter = z.infer<typeof SongFrontmatterSchema>;

export type Song = SongFrontmatter & {
  slug: string;
  content: string;
};
