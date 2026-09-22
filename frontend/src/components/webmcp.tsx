"use client";
import { useEffect } from "react";
import { useDemoStore } from "@/hooks/use-demo-store";
import { getEffectiveJobs, jobHref } from "@/lib/services/demo-jobs";
import { searchJobs } from "@/lib/services/jobs";
import { z } from "zod";
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type ModelContext = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function WebMCP() {
  const { state } = useDemoStore();
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const schema = z
      .object({
        location: z.string().max(100).optional(),
        category: z
          .enum([
            "delivery",
            "food",
            "commerce",
            "warehouse",
            "logistics",
            "ev",
            "field",
            "other",
          ])
          .optional(),
        radius: z.enum(["0", "5", "10", "25"]).optional(),
      })
      .strict();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "search_gigkaro_demo_jobs",
            title: "Search local demo jobs",
            description:
              "Read fictional GigKaro listings using the same pincode, category and distance filters as the visible search page. Does not apply or change saved jobs.",
            inputSchema: {
              type: "object",
              properties: {
                location: { type: "string" },
                category: {
                  type: "string",
                  enum: [
                    "delivery",
                    "food",
                    "commerce",
                    "warehouse",
                    "logistics",
                    "ev",
                    "field",
                    "other",
                  ],
                },
                radius: { type: "string", enum: ["0", "5", "10", "25"] },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute(input) {
              const filters = schema.parse(input);
              const results = searchJobs(filters, getEffectiveJobs(state));
              return {
                demo: true,
                count: results.length,
                jobs: results.slice(0, 20).map((j) => ({
                  id: j.id,
                  title: j.title,
                  company: j.company,
                  pincode: j.pincode,
                  earnings: [j.salaryMin, j.salaryMax],
                  url: jobHref(j),
                })),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [state.postedJobs, state.statuses]);
  return null;
}
