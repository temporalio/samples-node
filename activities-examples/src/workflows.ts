import { createActivityHandle } from '@temporalio/workflow';
import type * as activities from './activities';

const {
  makeHTTPRequest,
  // cancellableFetch  // todo: demo usage
} = createActivityHandle<typeof activities>({
  retry: {
    initialInterval: '50 milliseconds',
    maximumAttempts: 2,
  },
  scheduleToCloseTimeout: '30 seconds',
});

export async function httpWorkflow(): Promise<string> {
  const answer = await makeHTTPRequest();
  return `The answer is ${answer}`;
}
