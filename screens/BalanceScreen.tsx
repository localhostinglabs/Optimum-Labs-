import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { dropsToXrp } from 'xrpl';
import { theme } from '../../styles/theme';
import { BalanceChart } from '../../components/BalanceChart';
import { styles } from './BalanceScreen.styles';
import {
  createAndFundWallet,
  loadStoredWallet,
  getBalance,
  getTransactionHistory,
} from '../../services/walletService';
import { deleteStoredWallet } from '../../utils/walletStorage';
import type { WalletInfo } from '../../types/xrpl';

interface TxEntry {
  tx: any;
  meta: any;
}

const BalanceScreen: React.FC = () => {
  const navigation = useNavigation();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [transactions, setTransactions] = useState<TxEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      const stored = await loadStoredWallet();
      if (stored) {
        setWallet(stored);
        const bal = await getBalance(stored.address);
        setBalance(bal);
        try {
          const txs = await getTransactionHistory(stored.address, 5);
          setTransactions(txs as TxEntry[]);
        } catch {
          // Transactions may fail if account is new
        }
      }
    } catch (error: any) {
      console.error('Failed to load wallet:', error);
    }
  };

  const handleCreateWallet = async () => {
    setCreating(true);
    try {
      const { wallet: newWallet, balance: bal } = await createAndFundWallet();
      setWallet(newWallet);
      setBalance(String(bal));
      Alert.alert(
        'Wallet Created! 🎉',
        `Funded with ${bal} XRP on testnet.\n\nAddress: ${newWallet.address}`,
      );
    } catch (error: any) {
      Alert.alert('Error', `Failed to create wallet: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWallet = () => {
    Alert.alert(
      'Delete Wallet',
      'Are you sure? Make sure you backed up your seed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteStoredWallet();
            setWallet(null);
            setBalance('0');
            setTransactions([]);
          },
        },
      ],
    );
  };

  const copyAddress = () => {
    if (wallet) {
      Clipboard.setString(wallet.address);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleTransactionPress = (hash: string) => {
    const { Linking } = require('react-native');
    Linking.openURL(`https://testnet.xrpl.org/transactions/${hash}`);
  };

  const formatTx = (tx: any) => {
    if (!wallet) return { description: '', amount: '', type: 'send' as const };

    if (tx.TransactionType === 'Payment') {
      if (tx.Account === wallet.address) {
        const amt =
          typeof tx.Amount === 'string' ? String(dropsToXrp(tx.Amount)) : tx.Amount.value;
        return {
          description: `Sent to ${tx.Destination?.slice(0, 12)}...`,
          amount: amt,
          type: 'send' as const,
        };
      } else {
        const amt =
          typeof tx.DeliverMax === 'string'
            ? String(dropsToXrp(tx.DeliverMax))
            : typeof tx.Amount === 'string'
              ? String(dropsToXrp(tx.Amount))
              : '?';
        return {
          description: `Received from ${tx.Account?.slice(0, 12)}...`,
          amount: amt,
          type: 'receive' as const,
        };
      }
    }

    const labels: Record<string, string> = {
      NFTokenMint: 'Minted NFT',
      NFTokenBurn: 'Burned NFT',
      NFTokenCreateOffer: 'Created NFT offer',
      NFTokenAcceptOffer: 'Accepted NFT offer',
    };

    return {
      description: labels[tx.TransactionType] || tx.TransactionType,
      amount: '',
      type: 'send' as const,
    };
  };

  // No wallet state
  if (!wallet) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>No Wallet</Text>
        </View>

        <View style={{ alignItems: 'center', padding: 40 }}>
          <Ionicons name="wallet-outline" size={60} color={theme.colors.textSecondary} />
          <Text style={{
            color: theme.colors.text,
            fontSize: 18,
            fontWeight: '600',
            marginTop: 16,
          }}>
            Create a Testnet Wallet
          </Text>
          <Text style={{
            color: theme.colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 24,
          }}>
            Get 100 XRP on testnet to start sending transactions and minting NFTs
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 32,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              opacity: creating ? 0.6 : 1,
            }}
            onPress={handleCreateWallet}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
                <Text style={{ color: theme.colors.onPrimary, fontSize: 16, fontWeight: '600' }}>
                  Create Testnet Wallet
                </Text>
              </>
            )}
          </TouchableOpacity>
          {creating && (
            <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>
              Connecting to testnet & funding wallet...
            </Text>
          )}
        </View>
      </ScrollView>
    );
  }

  // Wallet loaded
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{balance} XRP</Text>
        <TouchableOpacity onPress={copyAddress} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }} numberOfLines={1}>
            {wallet.address}
          </Text>
          <Ionicons name="copy-outline" size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Balance Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Balance Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Available</Text>
          <Text style={styles.breakdownAmount}>{balance} XRP</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Reserve</Text>
          <Text style={styles.breakdownAmount}>10 XRP</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Network</Text>
          <Text style={styles.breakdownAmount}>Testnet</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <BalanceChart />
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitleInHeader}>Recent Transactions</Text>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('History')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Text style={{ color: theme.colors.textSecondary }}>
              No transactions yet
            </Text>
          </View>
        ) : (
          transactions.map((entry, index) => {
            const tx = entry.tx || entry;
            const meta = entry.meta || {};
            const success = meta?.TransactionResult === 'tesSUCCESS';
            const formatted = formatTx(tx);

            return (
              <TouchableOpacity
                key={tx.hash || index}
                style={styles.transactionItem}
                onPress={() => tx.hash && handleTransactionPress(tx.hash)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={
                      formatted.type === 'receive'
                        ? 'arrow-down-outline'
                        : 'arrow-up-outline'
                    }
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {formatted.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {success ? 'Complete' : 'Failed'}
                  </Text>
                </View>
                <View style={styles.transactionAmountContainer}>
                  {formatted.amount ? (
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color:
                            formatted.type === 'send'
                              ? theme.colors.error
                              : theme.colors.success,
                        },
                      ]}
                    >
                      {formatted.type === 'send' ? '-' : '+'}
                      {formatted.amount} XRP
                    </Text>
                  ) : (
                    <Ionicons
                      name={success ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={success ? theme.colors.success : theme.colors.error}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Delete Wallet */}
      <TouchableOpacity
        style={{ alignItems: 'center', padding: 20, marginBottom: 40 }}
        onPress={handleDeleteWallet}
      >
        <Text style={{ color: theme.colors.error, fontSize: 14 }}>
          Delete Wallet
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BalanceScreen;
