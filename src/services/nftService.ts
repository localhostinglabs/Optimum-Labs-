import { convertStringToHex, xrpToDrops } from 'xrpl';
import { getClient } from './xrplClient';
import { getSigningWallet } from './walletService';
import type {
  TransactionResult,
  NFTInfo,
  MintNFTParams,
  CreateOfferParams,
} from '../types';

export async function mintNFT(
  ownerSeed: string,
  params: MintNFTParams,
): Promise<TransactionResult & { nfTokenID?: string }> {
  const client = await getClient();
  const wallet = getSigningWallet(ownerSeed);

  try {
    const tx = {
      TransactionType: 'NFTokenMint' as const,
      Account: wallet.classicAddress,
      URI: convertStringToHex(params.uri),
      Flags: params.flags ?? 8,
      TransferFee: params.transferFee ?? 0,
      NFTokenTaxon: params.taxon ?? 0,
    };

    const autofilledTx = await client.autofill(tx);
    const result = await client.submitAndWait(autofilledTx, { wallet });

    const meta = result.result.meta as any;
    const success = meta?.TransactionResult === 'tesSUCCESS';

    let nfTokenID: string | undefined;
    if (success && meta?.AffectedNodes) {
      for (const node of meta.AffectedNodes) {
        const modified = node.ModifiedNode || node.CreatedNode;
        if (modified?.LedgerEntryType === 'NFTokenPage') {
          const fields = modified.FinalFields || modified.NewFields;
          if (fields?.NFTokens?.length) {
            nfTokenID =
              fields.NFTokens[fields.NFTokens.length - 1].NFToken.NFTokenID;
          }
        }
      }
    }

    return {
      success,
      hash: result.result.hash,
      nfTokenID,
      meta,
      error: success ? undefined : meta?.TransactionResult,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Mint failed' };
  }
}

export async function getAccountNFTs(address: string): Promise<NFTInfo[]> {
  const client = await getClient();
  try {
    const response = await client.request({
      command: 'account_nfts',
      account: address,
    });
    return response.result.account_nfts as NFTInfo[];
  } catch (error: any) {
    if (error?.data?.error === 'actNotFound') return [];
    throw error;
  }
}

export async function createSellOffer(
  ownerSeed: string,
  params: CreateOfferParams,
): Promise<TransactionResult & { offerID?: string }> {
  const client = await getClient();
  const wallet = getSigningWallet(ownerSeed);

  try {
    const tx: any = {
      TransactionType: 'NFTokenCreateOffer',
      Account: wallet.classicAddress,
      NFTokenID: params.nfTokenID,
      Amount: xrpToDrops(params.amountXRP),
      Flags: 1,
    };
    if (params.destination) tx.Destination = params.destination;

    const autofilledTx = await client.autofill(tx);
    const result = await client.submitAndWait(autofilledTx, { wallet });

    const meta = result.result.meta as any;
    const success = meta?.TransactionResult === 'tesSUCCESS';

    let offerID: string | undefined;
    if (success && meta?.AffectedNodes) {
      for (const node of meta.AffectedNodes) {
        if (node.CreatedNode?.LedgerEntryType === 'NFTokenOffer') {
          offerID = node.CreatedNode.LedgerIndex;
          break;
        }
      }
    }

    return {
      success,
      hash: result.result.hash,
      offerID,
      meta,
      error: success ? undefined : meta?.TransactionResult,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Create offer failed' };
  }
}

export async function acceptNFTOffer(
  acceptorSeed: string,
  offerID: string,
  isSellOffer: boolean,
): Promise<TransactionResult> {
  const client = await getClient();
  const wallet = getSigningWallet(acceptorSeed);

  try {
    const tx: any = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: wallet.classicAddress,
    };
    if (isSellOffer) {
      tx.NFTokenSellOffer = offerID;
    } else {
      tx.NFTokenBuyOffer = offerID;
    }

    const autofilledTx = await client.autofill(tx);
    const result = await client.submitAndWait(autofilledTx, { wallet });

    const meta = result.result.meta as any;
    const success = meta?.TransactionResult === 'tesSUCCESS';

    return {
      success,
      hash: result.result.hash,
      meta,
      error: success ? undefined : meta?.TransactionResult,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Accept offer failed' };
  }
}

export async function burnNFT(
  ownerSeed: string,
  nfTokenID: string,
): Promise<TransactionResult> {
  const client = await getClient();
  const wallet = getSigningWallet(ownerSeed);

  try {
    const tx = {
      TransactionType: 'NFTokenBurn' as const,
      Account: wallet.classicAddress,
      NFTokenID: nfTokenID,
    };

    const autofilledTx = await client.autofill(tx);
    const result = await client.submitAndWait(autofilledTx, { wallet });

    const meta = result.result.meta as any;
    const success = meta?.TransactionResult === 'tesSUCCESS';

    return {
      success,
      hash: result.result.hash,
      meta,
      error: success ? undefined : meta?.TransactionResult,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Burn failed' };
  }
}

export function decodeNFTUri(hexUri: string): string {
  try {
    const hex = hexUri.startsWith('0x') ? hexUri.slice(2) : hexUri;
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  } catch {
    return hexUri;
  }
}
