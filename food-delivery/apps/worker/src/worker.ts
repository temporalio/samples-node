import { NativeConnection, Worker } from '@temporalio/worker'
import * as activities from 'activities'
import { taskQueue } from 'common'
import { namespace, getConnectionOptions } from 'common/lib/temporal-connection'

async function run() {
  const connection = await NativeConnection.connect(getConnectionOptions())
  const worker = await Worker.create({
    workflowsPath: require.resolve('../../../packages/workflows/'),
    activities,
    connection,
    namespace,
    taskQueue,
  })

  await worker.run()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
