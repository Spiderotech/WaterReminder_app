import { Platform } from 'react-native';
import {
  fetchProducts,
  finishTransaction,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from 'react-native-iap';
import {
  CoinPackId,
  coinPackProductIds,
  verifyIapCoinPurchase,
} from './rewardsService';

const PURCHASE_TIMEOUT_MS = 120000;

const getPurchasePlatform = () => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  throw new Error('Coin purchases are only available on iOS and Android.');
};

const waitForPurchase = async (productId: string, startPurchase: () => Promise<unknown>) => {
  const cleanup: Array<() => void> = [];
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    const purchasePromise = new Promise<Purchase>((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('Purchase timed out. Please try again.'));
      }, PURCHASE_TIMEOUT_MS);

      const updateSubscription = purchaseUpdatedListener(purchase => {
        if (purchase.productId === productId) {
          resolve(purchase);
        }
      });
      cleanup.push(() => updateSubscription.remove());

      const errorSubscription = purchaseErrorListener(error => {
        reject(new Error(error.message || 'Purchase was cancelled or failed.'));
      });
      cleanup.push(() => errorSubscription.remove());
    });

    await startPurchase();
    return await purchasePromise;
  } finally {
    if (timeout) clearTimeout(timeout);
    cleanup.forEach(remove => remove());
  }
};

export const purchaseCoinPackWithStore = async (packId: CoinPackId, backendUserId: string) => {
  const productId = coinPackProductIds[packId];
  const platform = getPurchasePlatform();

  await initConnection();
  const products = await fetchProducts({
    skus: [productId],
    type: 'in-app',
  });

  if (!products?.some(product => product.id === productId)) {
    throw new Error('This coin pack is not available in the store yet.');
  }

  const purchase = await waitForPurchase(productId, () =>
    requestPurchase({
      request: {
        apple: { sku: productId },
        google: { skus: [productId] },
      },
      type: 'in-app',
    }),
  );

  const data = await verifyIapCoinPurchase({
    backendUserId,
    platform,
    productId,
    transactionId: purchase.transactionId || purchase.id,
    purchaseToken: purchase.purchaseToken,
    packageName: 'packageNameAndroid' in purchase ? purchase.packageNameAndroid : undefined,
  });

  await finishTransaction({
    purchase,
    isConsumable: true,
  });

  return data;
};
