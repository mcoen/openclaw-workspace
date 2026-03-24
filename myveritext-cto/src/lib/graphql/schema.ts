import { createSchema } from "graphql-yoga";
import { getPrisma } from "@/lib/prisma";
import { canAccessMatter } from "@/lib/auth/rbac";

async function resolveActor(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;

  return {
    userId: user.id,
    organizationId: user.organizationId,
  };
}

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    scalar DateTime

    type Matter {
      id: ID!
      organizationId: String!
      referenceNumber: String!
      title: String!
      venue: String
      caseType: String
      openedAt: DateTime!
      createdAt: DateTime!
      updatedAt: DateTime!
      jobs: [Job!]!
      records: [Record!]!
    }

    type Job {
      id: ID!
      matterId: String!
      scheduledStart: DateTime!
      scheduledEnd: DateTime
      location: String
      remoteUrl: String
      status: String!
      notes: String
      createdAt: DateTime!
      updatedAt: DateTime!
    }

    type Record {
      id: ID!
      matterId: String!
      type: String!
      title: String!
      storagePath: String!
      originalFileName: String!
      mimeType: String
      status: String!
      version: Int!
      uploadedById: String!
      uploadedAt: DateTime!
    }

    type Citation {
      sourceType: String!
      sourceId: String!
      label: String!
      excerpt: String!
    }

    type SummaryResult {
      matterId: String!
      summary: String!
      confidence: String!
      citations: [Citation!]!
      generatedAt: DateTime!
      mode: String!
    }

    input CreateMatterInput {
      organizationId: String!
      referenceNumber: String!
      title: String!
      venue: String
      caseType: String
    }

    input CreateJobInput {
      matterId: String!
      scheduledStart: DateTime!
      scheduledEnd: DateTime
      location: String
      remoteUrl: String
      notes: String
    }

    type Query {
      matters: [Matter!]!
      jobs: [Job!]!
      records(matterId: String): [Record!]!
    }

    type Mutation {
      createMatter(input: CreateMatterInput!): Matter!
      createJob(input: CreateJobInput!): Job!
      summarizeMatter(matterId: String!, prompt: String): SummaryResult!
    }
  `,
  resolvers: {
    Query: {
      matters: async (_parent, _args, ctx) => {
        const actor = await resolveActor(ctx.request);
        if (!actor) throw new Error("Unauthorized");
        const prisma = getPrisma();
        return prisma.matter.findMany({
          where: { organizationId: actor.organizationId },
          orderBy: { createdAt: "desc" },
        });
      },
      jobs: async (_parent, _args, ctx) => {
        const actor = await resolveActor(ctx.request);
        if (!actor) throw new Error("Unauthorized");
        const prisma = getPrisma();
        return prisma.job.findMany({
          where: { matter: { organizationId: actor.organizationId } },
          orderBy: { scheduledStart: "asc" },
        });
      },
      records: async (_parent, args: { matterId?: string }, ctx) => {
        const actor = await resolveActor(ctx.request);
        if (!actor) throw new Error("Unauthorized");
        const prisma = getPrisma();

        return prisma.record.findMany({
          where: {
            matter: { organizationId: actor.organizationId },
            ...(args.matterId ? { matterId: args.matterId } : {}),
          },
          orderBy: { uploadedAt: "desc" },
        });
      },
    },
    Mutation: {
      createMatter: async (_parent, args: { input: { organizationId: string; referenceNumber: string; title: string; venue?: string; caseType?: string } }, ctx) => {
        const actor = await resolveActor(ctx.request);
        if (!actor) throw new Error("Unauthorized");
        if (actor.organizationId !== args.input.organizationId) throw new Error("Forbidden");
        const prisma = getPrisma();
        return prisma.matter.create({ data: args.input });
      },
      createJob: async (_parent, args: { input: { matterId: string; scheduledStart: string; scheduledEnd?: string; location?: string; remoteUrl?: string; notes?: string } }, ctx) => {
        const actor = await resolveActor(ctx.request);
        if (!actor) throw new Error("Unauthorized");
        const hasAccess = await canAccessMatter(actor.userId, args.input.matterId);
        if (!hasAccess) throw new Error("Forbidden");

        const prisma = getPrisma();
        return prisma.job.create({
          data: {
            matterId: args.input.matterId,
            scheduledStart: new Date(args.input.scheduledStart),
            scheduledEnd: args.input.scheduledEnd ? new Date(args.input.scheduledEnd) : undefined,
            location: args.input.location,
            remoteUrl: args.input.remoteUrl,
            notes: args.input.notes,
            status: "SCHEDULED",
          },
        });
      },
      summarizeMatter: async (_parent, args: { matterId: string; prompt?: string }, ctx) => {
        const actor = await resolveActor(ctx.request);
        if (!actor) throw new Error("Unauthorized");
        const hasAccess = await canAccessMatter(actor.userId, args.matterId);
        if (!hasAccess) throw new Error("Forbidden");

        const prisma = getPrisma();
        const matter = await prisma.matter.findUnique({
          where: { id: args.matterId },
          include: {
            jobs: { orderBy: { scheduledStart: "desc" }, take: 3 },
            records: { where: { type: "TRANSCRIPT" }, orderBy: { uploadedAt: "desc" }, take: 3 },
          },
        });

        if (!matter) throw new Error("Matter not found");

        return {
          matterId: matter.id,
          summary: `Matter ${matter.referenceNumber} has ${matter.jobs.length} recent proceedings and ${matter.records.length} transcript artifacts.`,
          confidence: "medium",
          citations: matter.records.map((r, idx) => ({
            sourceType: "record",
            sourceId: r.id,
            label: r.title,
            excerpt: `Transcript evidence snippet ${idx + 1}`,
          })),
          generatedAt: new Date(),
          mode: "graphql-demo-scaffold",
        };
      },
    },
    Matter: {
      jobs: async (parent: { id: string }) => {
        const prisma = getPrisma();
        return prisma.job.findMany({ where: { matterId: parent.id }, orderBy: { scheduledStart: "asc" } });
      },
      records: async (parent: { id: string }) => {
        const prisma = getPrisma();
        return prisma.record.findMany({ where: { matterId: parent.id }, orderBy: { uploadedAt: "desc" } });
      },
    },
  },
});
