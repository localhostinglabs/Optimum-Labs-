import { Wallet } from 'xrpl';
import { getClient } from './xrplClient';
import { saveWalletSecurely, getStoredWallet } from '../utils/walletStorage';
import type { WalletInfo } from '../types';

export async function createAndFundWallet(): Promise<{
  wallet: WalletInfo;
  balance: number;
}> {
  const client = await getClient();
  const { wallet, balance } = await client.fundWallet();

  const walletInfo: WalletInfo = {
    address: wallet.classicAddress,
    seed: wallet.seed!,
    publicKey: wallet.publicKey,
  };

  await saveWalletSecurely(wallet.seed!, wallet.classicAddress);

  return { wallet: walletInfo, balance };
}

export function restoreWalletFromSeed(seed: string): WalletInfo {
  const wallet = Wallet.fromSeed(seed);
  return {
    address: wallet.classicAddress,
    seed: wallet.seed!,
    publicKey: wallet.publicKey,
  };
}

export async function loadStoredWallet(): Promise<WalletInfo | null> {
  const stored = await getStoredWallet();
  if (!stored) return null;

  try {
    const wallet = Wallet.fromSeed(stored.seed);
    return {
      address: wallet.classicAddress,
      seed: stored.seed,
      publicKey: wallet.publicKey,
    };
  } catch {
    return null;
  }
}

export function getSigningWallet(seed: string): Wallet {
  return Wallet.fromSeed(seed);
}

export async function getBalance(address: string): Promise<string> {
  const client = await getClient();
  try {
    const balances = await client.getBalances(address);
    const xrp = balances.find(b => b.currency === 'XRP');
    return xrp ? xrp.value : '0';
  } catch (error: any) {
    if (error?.data?.error === 'actNotFound') {
      return '0';
    }
    throw error;
  }
}

export async function getAccountInfo(address: string) {
  const client = await getClient();
  const response = await client.request({
    command: 'account_info',
    account: address,
    ledger_index: 'validated',
  });
  return response.result.account_data;
}

export async function getTransactionHistory(
  address: string,
  limit: number = 20,
) {
  const client = await getClient();
  const response = await client.request({
    command: 'account_tx',
    account: address,
    limit,
    ledger_index_min: -1,
    ledger_index_max: -1,
  });
  return response.result.transactions;
}
