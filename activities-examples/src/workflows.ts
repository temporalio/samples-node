import { createActivityHandle } from '@temporalio/workflow';
import type * as activities from './activities';

const {
  makeHTTPRequest,
  // fakeProgress, // todo: demo usage
  // cancellableFetch  // todo: demo usage
} = createActivityHandle<typeof activities>({
  retry: {
    initialInterval: '50 milliseconds',
    maximumAttempts: 2,
  },
  scheduleToCloseTimeout: '30 seconds',
});

export async function example(): Promise<string> {
  const answer = await makeHTTPRequest();
  return `The answer is ${answer}`;
}
