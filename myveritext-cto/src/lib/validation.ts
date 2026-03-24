import { z } from "zod";

export const createMatterSchema = z.object({
  organizationId: z.string().min(1),
  referenceNumber: z.string().min(1),
  title: z.string().min(2),
  venue: z.string().optional(),
  caseType: z.string().optional(),
});

export const createJobSchema = z.object({
  matterId: z.string().min(1),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional(),
  location: z.string().optional(),
  remoteUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELED"]),
});
