import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads/lib/commonjs/MobileAds';
import { AdEventType } from 'react-native-google-mobile-ads/lib/commonjs/AdEventType';
import { RewardedAdEventType } from 'react-native-google-mobile-ads/lib/commonjs/RewardedAdEventType';
import { TestIds } from 'react-native-google-mobile-ads/lib/commonjs/TestIds';
import { RewardedAd } from 'react-native-google-mobile-ads/lib/commonjs/ads/RewardedAd';

const productionRewardedAdUnitIds = {
  android: 'ca-app-pub-9770614367990455/8661887986',
  ios: 'ca-app-pub-0000000000000000/0000000000',
};

const productionBannerAdUnitIds = {
  android: 'ca-app-pub-9770614367990455/5255480076',
  ios: 'ca-app-pub-0000000000000000/0000000000',
};

let initializePromise: Promise<void> | null = null;

const isConfiguredAdUnitId = (adUnitId?: string) =>
  !!adUnitId && !adUnitId.includes('0000000000000000') && !adUnitId.endsWith('/0000000000');

export const getRewardedAdUnitId = () => {
  if (__DEV__) return TestIds.REWARDED;

  const adUnitId = Platform.select(productionRewardedAdUnitIds);
  return isConfiguredAdUnitId(adUnitId) ? adUnitId : TestIds.REWARDED;
};

export const getBannerAdUnitId = () => {
  if (__DEV__) return TestIds.BANNER;

  const adUnitId = Platform.select(productionBannerAdUnitIds);
  return isConfiguredAdUnitId(adUnitId) ? adUnitId : TestIds.BANNER;
};

export const initializeAdMob = () => {
  if (!initializePromise) {
    initializePromise = mobileAds()
      .initialize()
      .then(() => undefined);
  }

  return initializePromise;
};

export const showRewardedAd = async () => {
  await initializeAdMob();

  return new Promise<void>((resolve, reject) => {
    const rewardedAd = RewardedAd.createForAdRequest(getRewardedAdUnitId(), {
      requestNonPersonalizedAdsOnly: true,
    });
    const unsubscribers: Array<() => void> = [];
    let settled = false;
    let rewardEarned = false;

    const cleanup = () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      clearTimeout(loadTimeout);
    };

    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const loadTimeout = setTimeout(() => {
      settle(() => reject(new Error('Ad is taking too long to load. Please try again.')));
    }, 15000);

    unsubscribers.push(
      rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewardedAd.show();
      }),
      rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewardEarned = true;
        settle(resolve);
      }),
      rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        if (!rewardEarned) {
          settle(() => reject(new Error('Watch the full ad to unlock the reward.')));
        }
      }),
      rewardedAd.addAdEventListener(AdEventType.ERROR, error => {
        settle(() => reject(error));
      }),
    );

    rewardedAd.load();
  });
};
