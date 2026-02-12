import { xrpToDrops, dropsToXrp } from 'xrpl';
import { getClient } from './xrplClient';
import { getSigningWallet } from './walletService';
import type { TransactionResult, SendXRPParams } from '../types';

export async function sendXRP(
  senderSeed: string,
  params: SendXRPParams,
): Promise<TransactionResult> {
  const client = await getClient();
  const wallet = getSigningWallet(senderSeed);

  try {
    const tx: any = {
      TransactionType: 'Payment',
      Account: wallet.classicAddress,
      Destination: params.destination,
      Amount: xrpToDrops(params.amountXRP),
    };

    if (params.destinationTag !== undefined) {
      tx.DestinationTag = params.destinationTag;
    }

    const autofilledTx = await client.autofill(tx);
    const submitResponse = await client.submitAndWait(autofilledTx, {
      wallet,
    });

    const meta = submitResponse.result.meta as any;
    const success = meta?.TransactionResult === 'tesSUCCESS';

    return {
      success,
      hash: submitResponse.result.hash,
      meta,
      error: success ? undefined : meta?.TransactionResult,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Transaction failed',
    };
  }
}

export function isValidXRPAddress(address: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
}

export function formatDropsToXRP(drops: string): string {
  return dropsToXrp(drops);
}

export async function estimateFee(): Promise<string> {
  const client = await getClient();
  const response = await client.request({ command: 'fee' });
  return response.result.drops.open_ledger_fee;
}
