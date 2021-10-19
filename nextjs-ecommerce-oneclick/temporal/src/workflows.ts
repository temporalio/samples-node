/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as wf from '@temporalio/workflow';
// // Only import the activity types
import type * as activities from './activities';

const { checkoutItem, canceledPurchase } = wf.createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

type PurchaseState = 'PURCHASE_PENDING' | 'PURCHASE_CONFIRMED' | 'PURCHASE_CANCELED';

export const cancelPurchase = wf.defineSignal('cancelPurchase');
export const purchaseStateQuery = wf.defineQuery<PurchaseState>('purchaseState');

export async function OneClickBuy(itemId: string) {
  const itemToBuy = itemId;
  let purchaseState: PurchaseState = 'PURCHASE_PENDING';
  wf.setListener(cancelPurchase, () => void (purchaseState = 'PURCHASE_CANCELED'));
  wf.setListener(purchaseStateQuery, () => purchaseState);
  if (await wf.condition('5s', () => purchaseState === 'PURCHASE_CANCELED')) {
    return await canceledPurchase(itemToBuy);
  } else {
    purchaseState = 'PURCHASE_CONFIRMED';
    return await checkoutItem(itemToBuy);
  }
}
