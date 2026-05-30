import { z } from "zod";

export const leadSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  source: z.enum(["manual", "csv_import", "website", "referral", "open_house", "zillow", "other"]).default("manual"),
  pipeline_stage: z.enum(["new_lead", "contacted", "showing", "offer", "closed_won", "closed_lost"]).default("new_lead"),
  notes: z.string().max(1000).optional().nullable(),
  next_action: z.string().max(200).optional().nullable(),
  next_action_date: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const leadUpdateSchema = leadSchema.partial();

export const actionSchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID"),
  action_type: z.enum(["call", "text", "email", "meeting", "showing", "note"]),
  description: z.string().max(500).optional().nullable(),
  due_date: z.string().min(1, "Due date is required"),
  completed: z.boolean().default(false),
});

export const actionUpdateSchema = actionSchema.partial().extend({
  id: z.string().uuid("Invalid action ID"),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
export type ActionUpdateInput = z.infer<typeof actionUpdateSchema>;
