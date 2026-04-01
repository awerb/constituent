import { startWorkers } from "@/server/jobs";

/**
 * Worker process entry point
 * Starts all background job workers
 *
 * This should be run as a separate process from the main API server.
 * Example in package.json:
 *   "worker": "tsx src/worker.ts"
 */
async function main(): Promise<void> {
  try {
    console.log("[WORKER PROCESS] Starting constituent response worker process");

    // Start all background job workers
    await startWorkers();

    console.log("[WORKER PROCESS] Worker process is running and ready to process jobs");

    // Keep the process running
    // Graceful shutdown is handled by signal handlers in startWorkers()
  } catch (error) {
    console.error("[WORKER PROCESS] Fatal error starting worker process:", error);
    process.exit(1);
  }
}

// Start the worker process
main().catch((error) => {
  console.error("[WORKER PROCESS] Uncaught error:", error);
  process.exit(1);
});
