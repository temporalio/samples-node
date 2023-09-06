import { proxyActivities, uuid4, log } from '@temporalio/workflow';
import type { createActivitiesForSameWorker, createNormalActivities } from './activities';

// @@@SNIPSTART typescript-sticky-queues-workflow
const { getUniqueTaskQueue } = proxyActivities<ReturnType<typeof createNormalActivities>>({
  startToCloseTimeout: '1 minute',
});

export async function fileProcessingWorkflow(maxAttempts = 5): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; ++attempt) {
    try {
      const uniqueWorkerTaskQueue = await getUniqueTaskQueue();
      const activities = proxyActivities<ReturnType<typeof createActivitiesForSameWorker>>({
        taskQueue: uniqueWorkerTaskQueue,
        // Note the use of scheduleToCloseTimeout.
        // The reason this timeout type is used is because this task queue is unique
        // to a single worker. When that worker goes away, there won't be a way for these
        // activities to progress.
        scheduleToCloseTimeout: '1 minute',
      });

      const downloadPath = `/tmp/${uuid4()}`;
      await activities.downloadFileToWorkerFileSystem('https://temporal.io', downloadPath);
      try {
        await activities.workOnFileInWorkerFileSystem(downloadPath);
      } finally {
        await activities.cleanupFileFromWorkerFileSystem(downloadPath);
      }
      return;
    } catch (err) {
      if (attempt === maxAttempts) {
        log.warn('Final attempt failed, giving up', { attempt });
        throw err;
      }

      log.error('Attempt failed, retrying on a new Worker', { attempt });
    }
  }
}
// @@@SNIPEND
