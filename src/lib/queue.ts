import { Queue, Worker, type WorkerOptions } from "bullmq";
import { redis } from "@/lib/redis";

const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
};

// Queue instances
export const emailQueue = new Queue("email", { connection });
export const signalQueue = new Queue("signal", { connection });
export const slaCheckQueue = new Queue("sla-check", { connection });
export const webhookQueue = new Queue("webhook", { connection });
export const privacyQueue = new Queue("privacy", { connection });
export const reportQueue = new Queue("report", { connection });

// Export all queues for registration
export const queues = [
  emailQueue,
  signalQueue,
  slaCheckQueue,
  webhookQueue,
  privacyQueue,
  reportQueue,
];

// Queue event handlers
queues.forEach((queue) => {
  queue.on("error", (error) => {
    console.error(`Queue ${queue.name} error:`, error);
  });

  queue.on("failed", (job, error) => {
    console.error(
      `Job ${job.id} in queue ${queue.name} failed:`,
      error.message
    );
  });

  queue.on("stalled", (jobId) => {
    console.warn(`Job ${jobId} in queue ${queue.name} stalled`);
  });

  queue.on("completed", (job) => {
    console.log(`Job ${job.id} in queue ${queue.name} completed`);
  });
});

export interface WorkerHandler<T, R> {
  (job: { data: T; id: string; attemptsMade: number }): Promise<R>;
}

export function createWorker<T = unknown, R = unknown>(
  queueName: string,
  handler: WorkerHandler<T, R>,
  options?: Partial<WorkerOptions>
): Worker<T, R> {
  const worker = new Worker(queueName, handler as any, {
    connection: redis,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5"),
    settings: {
      lockDuration: 30000,
      lockRenewTime: 15000,
      maxStalledCount: 3,
      ...options?.settings,
    },
    ...options,
  });

  worker.on("error", (error) => {
    console.error(`Worker for queue ${queueName} error:`, error);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `Worker job ${job?.id} in queue ${queueName} failed:`,
      error.message
    );
  });

  worker.on("completed", (job) => {
    console.log(`Worker job ${job.id} in queue ${queueName} completed`);
  });

  return worker;
}

// Helper to close all queues and workers
export async function closeAllQueues(): Promise<void> {
  await Promise.all(queues.map((queue) => queue.close()));
}

// Health check
export async function checkQueueHealth(): Promise<{
  status: "healthy" | "unhealthy";
  queues: { name: string; status: "connected" | "disconnected" }[];
}> {
  const queueStatuses = await Promise.all(
    queues.map(async (queue) => {
      try {
        const client = queue.client;
        await client.ping();
        return { name: queue.name, status: "connected" as const };
      } catch (error) {
        return { name: queue.name, status: "disconnected" as const };
      }
    })
  );

  const allConnected = queueStatuses.every((q) => q.status === "connected");

  return {
    status: allConnected ? "healthy" : "unhealthy",
    queues: queueStatuses,
  };
}
