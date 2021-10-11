// @@@SNIPSTART nodejs-hello-workflow
import { createActivityHandle } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

const { greet } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that simply calls an activity */
export async function example(name: string): Promise<string> {
  return await greet(name);
}
// @@@SNIPEND
