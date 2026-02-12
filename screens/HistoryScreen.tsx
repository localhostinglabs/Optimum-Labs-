import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { dropsToXrp } from 'xrpl';
import { theme } from '../../styles/theme';
import { styles } from './HistoryScreen.styles';
import { loadStoredWallet, getTransactionHistory } from '../../services/walletService';
import type { WalletInfo } from '../../types/xrpl';

interface TxEntry {
  tx: any;
  meta: any;
  validated: boolean;
}

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<TxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const stored = await loadStoredWallet();
      if (stored) {
        setWallet(stored);
        const txs = await getTransactionHistory(stored.address, 30);
        setTransactions(txs as TxEntry[]);
      }
    } catch (error: any) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const openExplorer = (hash: string) => {
    Linking.openURL(`https://testnet.xrpl.org/transactions/${hash}`);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Payment':
        return 'swap-horizontal-outline';
      case 'NFTokenMint':
        return 'color-palette-outline';
      case 'NFTokenBurn':
        return 'flame-outline';
      case 'NFTokenCreateOffer':
        return 'pricetag-outline';
      case 'NFTokenAcceptOffer':
        return 'checkmark-circle-outline';
      default:
        return 'document-outline';
    }
  };

  const formatTx = (tx: any, myAddress: string) => {
    if (tx.TransactionType === 'Payment') {
      if (tx.Account === myAddress) {
        const amt =
          typeof tx.Amount === 'string' ? dropsToXrp(tx.Amount) : tx.Amount.value;
        return {
          description: `Sent to ${tx.Destination?.slice(0, 12)}...`,
          cryptoAmount: String(amt),
          cryptoSymbol: 'XRP',
          displayType: 'send' as const,
        };
      } else {
        const amt =
          typeof tx.DeliverMax === 'string'
            ? dropsToXrp(tx.DeliverMax)
            : typeof tx.Amount === 'string'
              ? dropsToXrp(tx.Amount)
              : '?';
        return {
          description: `Received from ${tx.Account?.slice(0, 12)}...`,
          cryptoAmount: String(amt),
          cryptoSymbol: 'XRP',
          displayType: 'receive' as const,
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
      cryptoAmount: '',
      cryptoSymbol: '',
      displayType: 'send' as const,
    };
  };

  const getAmountColor = (displayType: string, status: string) => {
    if (status === 'Pending') return theme.colors.warning;
    if (displayType === 'send') return theme.colors.error;
    return theme.colors.success;
  };

  const getAmountPrefix = (displayType: string) => {
    if (displayType === 'send') return '-';
    if (displayType === 'receive') return '+';
    return '';
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Transaction History</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>
            Loading transactions...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleGoBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.6 },
          ]}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.onPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>All Transactions</Text>

          {!wallet && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.colors.textSecondary }}>
                Create a wallet to see transactions
              </Text>
            </View>
          )}

          {wallet && transactions.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.colors.textSecondary }}>
                No transactions yet
              </Text>
            </View>
          )}

          {transactions.map((entry, index) => {
            const tx = entry.tx || entry;
            const meta = entry.meta || {};
            const success = meta?.TransactionResult === 'tesSUCCESS';
            const hash = tx.hash;
            const formatted = formatTx(tx, wallet?.address || '');
            const status = success ? 'Complete' : 'Pending';

            return (
              <Pressable
                key={hash || index}
                style={({ pressed }) => [
                  styles.transactionItem,
                  pressed && { opacity: 0.6, backgroundColor: theme.colors.surface },
                ]}
                onPress={() => hash && openExplorer(hash)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${formatted.description}, ${formatted.cryptoAmount} ${formatted.cryptoSymbol}`}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={getIcon(tx.TransactionType)}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {formatted.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {tx.TransactionType}
                  </Text>
                  {!success && (
                    <Text style={styles.pendingStatus}>Failed</Text>
                  )}
                </View>
                <View style={styles.transactionAmountContainer}>
                  {formatted.cryptoAmount ? (
                    <>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: getAmountColor(formatted.displayType, status) },
                        ]}
                      >
                        {getAmountPrefix(formatted.displayType)}
                        {formatted.cryptoAmount} {formatted.cryptoSymbol}
                      </Text>
                    </>
                  ) : (
                    <Ionicons
                      name={success ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={success ? theme.colors.success : theme.colors.error}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}

          {/* Explorer Link */}
          {wallet && (
            <Pressable
              style={{ alignItems: 'center', paddingVertical: 20 }}
              onPress={() =>
                Linking.openURL(
                  `https://testnet.xrpl.org/accounts/${wallet.address}`,
                )
              }
            >
              <Text style={{ color: theme.colors.primary, fontSize: 14 }}>
                View on XRPL Testnet Explorer →
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HistoryScreen;
