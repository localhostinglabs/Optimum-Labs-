import { Client } from 'xrpl';

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

let client: Client | null = null;
let connectionPromise: Promise<Client> | null = null;

export async function getClient(): Promise<Client> {
  if (client?.isConnected()) {
    return client;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = connectClient();
  try {
    return await connectionPromise;
  } finally {
    connectionPromise = null;
  }
}

async function connectClient(): Promise<Client> {
  if (client) {
    try {
      await client.disconnect();
    } catch {}
    client = null;
  }

  const newClient = new Client(TESTNET_URL);

  newClient.on('disconnected', () => {
    console.log('[XRPL] Disconnected from testnet');
  });

  newClient.on('connected', () => {
    console.log('[XRPL] Connected to testnet');
  });

  await newClient.connect();
  client = newClient;
  return newClient;
}

export async function disconnect(): Promise<void> {
  if (client?.isConnected()) {
    await client.disconnect();
  }
  client = null;
  connectionPromise = null;
}

export function isConnected(): boolean {
  return client?.isConnected() ?? false;
}
