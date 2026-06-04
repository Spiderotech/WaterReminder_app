import AsyncStorage from '@react-native-async-storage/async-storage';
import { V2_KEYS } from './v2Storage';

export type Wallet = {
  coins: number;
  diamonds: number;
  energyLevel?: number;
};

const defaultWallet: Wallet = {
  coins: 0,
  diamonds: 0,
  energyLevel: 7,
};

export const getWallet = async (): Promise<Wallet> => {
  const stored = await AsyncStorage.getItem(V2_KEYS.wallet);
  return stored ? { ...defaultWallet, ...JSON.parse(stored) } : defaultWallet;
};

export const saveWallet = async (wallet: Wallet) => {
  await AsyncStorage.setItem(V2_KEYS.wallet, JSON.stringify(wallet));
  return wallet;
};

export const addWalletBalance = async ({
  coins = 0,
  diamonds = 0,
}: {
  coins?: number;
  diamonds?: number;
}) => {
  const wallet = await getWallet();
  const nextWallet = {
    ...wallet,
    coins: wallet.coins + coins,
    diamonds: wallet.diamonds + diamonds,
  };

  await saveWallet(nextWallet);
  return nextWallet;
};
