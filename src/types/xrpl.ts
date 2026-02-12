export interface WalletInfo {
  address: string;
  seed: string;
  publicKey: string;
}

export interface NFTInfo {
  NFTokenID: string;
  Issuer: string;
  URI?: string;
  Flags: number;
  TransferFee: number;
  NFTokenTaxon: number;
  nft_serial: number;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  meta?: any;
}

export interface MintNFTParams {
  uri: string;
  transferFee?: number;
  flags?: number;
  taxon?: number;
}

export interface SendXRPParams {
  destination: string;
  amountXRP: string;
  destinationTag?: number;
}

export interface CreateOfferParams {
  nfTokenID: string;
  amountXRP: string;
  destination?: string;
}
