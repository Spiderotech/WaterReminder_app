import { Platform } from 'react-native';
import {
  fetchProducts,
  finishTransaction,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Product,
  type Purchase,
} from 'react-native-iap';
import {
  CoinPackId,
  coinPackProductIds,
  verifyIapCoinPurchase,
} from './rewardsService';

export type CoinPackStoreProduct = {
  id: string;
  price: string;
};

const PURCHASE_TIMEOUT_MS = 120000;

const getPurchasePlatform = () => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  throw new Error('Coin purchases are only available on iOS and Android.');
};

const getProductDisplayPrice = (product: Product) => {
  if (product.displayPrice) return product.displayPrice;
  if (product.platform === 'android') {
    return product.oneTimePurchaseOfferDetailsAndroid?.[0]?.formattedPrice || '';
  }
  return '';
};

const isCoinProduct = (product: unknown): product is Product =>
  Boolean(product && typeof product === 'object' && 'type' in product && product.type === 'in-app');

export const fetchCoinPackStoreProducts = async (): Promise<Record<string, CoinPackStoreProduct>> => {
  await initConnection();
  const products = await fetchProducts({
    skus: Object.values(coinPackProductIds),
    type: 'in-app',
  });

  console.log('[IAP] Store products requested:', Object.values(coinPackProductIds));
  console.log('[IAP] Store products returned:', products?.map(product => product.id) || []);

  return (products || []).filter(isCoinProduct).reduce((acc, product) => {
    const price = getProductDisplayPrice(product);
    if (price) {
      acc[product.id] = {
        id: product.id,
        price,
      };
    }
    return acc;
  }, {} as Record<string, CoinPackStoreProduct>);
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

  const returnedProductIds = products?.map(product => product.id) || [];
  console.log('[IAP] Purchase product requested:', productId);
  console.log('[IAP] Purchase products returned:', returnedProductIds);

  if (!products?.some(product => product.id === productId)) {
    const returnedProductsText = returnedProductIds.length ? returnedProductIds.join(', ') : 'none';
    throw new Error(
      `Google Play did not return product ${productId}. Returned products: ${returnedProductsText}. ` +
      'Install the app from the internal testing Play Store link with a license tester account, then try again.',
    );
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
