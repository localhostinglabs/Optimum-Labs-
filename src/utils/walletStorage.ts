import EncryptedStorage from 'react-native-encrypted-storage';

const WALLET_KEY = 'xrpl_wallet_data';

export async function saveWalletSecurely(
  seed: string,
  address: string,
): Promise<void> {
  await EncryptedStorage.setItem(
    WALLET_KEY,
    JSON.stringify({ seed, address }),
  );
}

export async function getStoredWallet(): Promise<{
  seed: string;
  address: string;
} | null> {
  try {
    const raw = await EncryptedStorage.getItem(WALLET_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function deleteStoredWallet(): Promise<void> {
  try {
    await EncryptedStorage.removeItem(WALLET_KEY);
  } catch {
    // Already deleted or not found
  }
}

export async function hasStoredWallet(): Promise<boolean> {
  const wallet = await getStoredWallet();
  return wallet !== null;
}
