declare module 'react-native-google-mobile-ads/lib/commonjs/MobileAds' {
  export default function mobileAds(): {
    initialize(): Promise<unknown>;
  };
}

declare module 'react-native-google-mobile-ads/lib/commonjs/AdEventType' {
  export enum AdEventType {
    CLOSED = 'closed',
    ERROR = 'error',
  }
}

declare module 'react-native-google-mobile-ads/lib/commonjs/RewardedAdEventType' {
  export enum RewardedAdEventType {
    LOADED = 'rewarded_loaded',
    EARNED_REWARD = 'rewarded_earned_reward',
  }
}

declare module 'react-native-google-mobile-ads/lib/commonjs/TestIds' {
  export const TestIds: {
    BANNER: string;
    REWARDED: string;
  };
}

declare module 'react-native-google-mobile-ads/lib/commonjs/BannerAdSize' {
  export enum BannerAdSize {
    BANNER = 'BANNER',
    LARGE_ANCHORED_ADAPTIVE_BANNER = 'LARGE_ANCHORED_ADAPTIVE_BANNER',
  }
}

declare module 'react-native-google-mobile-ads/lib/commonjs/ads/BannerAd' {
  import React from 'react';

  export type BannerAdProps = {
    unitId: string;
    size: string;
    requestOptions?: Record<string, unknown>;
  };

  export class BannerAd extends React.Component<BannerAdProps> {
    load(): void;
  }
}

declare module 'react-native-google-mobile-ads/lib/commonjs/ads/RewardedAd' {
  import { AdEventType } from 'react-native-google-mobile-ads/lib/commonjs/AdEventType';
  import { RewardedAdEventType } from 'react-native-google-mobile-ads/lib/commonjs/RewardedAdEventType';

  type AdEventListener = (error?: Error) => void;

  export class RewardedAd {
    static createForAdRequest(adUnitId: string, requestOptions?: Record<string, unknown>): RewardedAd;
    addAdEventListener(eventType: AdEventType | RewardedAdEventType, listener: AdEventListener): () => void;
    load(): void;
    show(): Promise<void>;
  }
}
