import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadStoredWallet } from '../../services/walletService';
import { mintNFT, getAccountNFTs, burnNFT, decodeNFTUri } from '../../services/nftService';
import type { WalletInfo, NFTInfo } from '../../types/xrpl';
import { styles } from './NFTsScreen.styles';

const EMOJI_OPTIONS = ['🐱', '☕', '🌏', '👕', '🎨', '🎵', '🏆', '💎', '🌸', '🍣', '⛩️', '🗼'];

// Parse NFT metadata from URI
function parseNFTMetadata(nft: NFTInfo): {
  name: string;
  description: string;
  detailDescription: string;
  image: string;
} {
  try {
    const uri = nft.URI ? decodeNFTUri(nft.URI) : '';
    const parsed = JSON.parse(uri);
    return {
      name: parsed.name || 'Unnamed',
      description: parsed.description || '',
      detailDescription: parsed.detailDescription || parsed.description || '',
      image: parsed.image || '🎨',
    };
  } catch {
    return {
      name: nft.NFTokenID.slice(0, 8) + '...',
      description: nft.URI ? decodeNFTUri(nft.URI) : 'No URI',
      detailDescription: '',
      image: '🎨',
    };
  }
}

const NFTsScreen: React.FC = ({ navigation }: any) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [nfts, setNfts] = useState<NFTInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showMintForm, setShowMintForm] = useState(false);
  const [mintName, setMintName] = useState('');
  const [mintDescription, setMintDescription] = useState('');
  const [mintDetailDescription, setMintDetailDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎨');
  const [minting, setMinting] = useState(false);

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
        const tokens = await getAccountNFTs(stored.address);
        setNfts(tokens);
      }
    } catch (error: any) {
      console.error('Failed to load NFTs:', error);
    }
  };

  const handleMint = async () => {
    if (!wallet) {
      Alert.alert('No Wallet', 'Create a wallet first.');
      return;
    }
    if (!mintName.trim()) {
      Alert.alert('Missing Name', 'Give your NFT a name.');
      return;
    }
    if (!mintDescription.trim()) {
      Alert.alert('Missing Description', 'Add a short description.');
      return;
    }

    // Pack metadata as JSON into the URI
    const metadata = JSON.stringify({
      name: mintName.trim(),
      description: mintDescription.trim(),
      detailDescription: mintDetailDescription.trim() || mintDescription.trim(),
      image: selectedEmoji,
    });

    setMinting(true);
    try {
      const result = await mintNFT(wallet.seed, {
        uri: metadata,
        flags: 8,
      });

      if (result.success) {
        Alert.alert('NFT Minted! 🎨', `"${mintName}" has been created on the XRP Ledger!`);
        setShowMintForm(false);
        setMintName('');
        setMintDescription('');
        setMintDetailDescription('');
        setSelectedEmoji('🎨');
        await loadData();
      } else {
        Alert.alert('Mint Failed', result.error || 'Unknown error');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setMinting(false);
    }
  };

  const handleBurn = (nfTokenID: string, name: string) => {
    if (!wallet) return;
    Alert.alert('Burn NFT', `Permanently destroy "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Burn',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await burnNFT(wallet.seed, nfTokenID);
            if (result.success) {
              Alert.alert('Burned 🔥', `"${name}" has been destroyed.`);
              await loadData();
            } else {
              Alert.alert('Failed', result.error || 'Unknown error');
            }
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleTokenPress = (nft: NFTInfo) => {
    const meta = parseNFTMetadata(nft);
    (navigation as any).navigate('NFTDetail', {
      tokenId: nft.NFTokenID,
      nftMeta: meta,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NFT Collection</Text>
        <TouchableOpacity
          onPress={() => setShowMintForm(!showMintForm)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            position: 'absolute',
            right: 16,
            top: 16,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {showMintForm ? 'Cancel' : '+ Mint'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Mint Form */}
        {showMintForm && (
          <View style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
              Mint New NFT
            </Text>

            {/* Emoji Picker */}
            <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>Choose an icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {EMOJI_OPTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setSelectedEmoji(emoji)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: selectedEmoji === emoji ? '#3B82F6' : '#0F172A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    borderWidth: selectedEmoji === emoji ? 2 : 1,
                    borderColor: selectedEmoji === emoji ? '#60A5FA' : '#334155',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name */}
            <TextInput
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 8,
                padding: 12,
                color: '#fff',
                fontSize: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#334155',
              }}
              placeholder="Name (e.g. Cat)"
              placeholderTextColor="#9CA3AF"
              value={mintName}
              onChangeText={setMintName}
            />

            {/* Short Description */}
            <TextInput
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 8,
                padding: 12,
                color: '#fff',
                fontSize: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#334155',
              }}
              placeholder="Short description (e.g. Shibuya Cat café)"
              placeholderTextColor="#9CA3AF"
              value={mintDescription}
              onChangeText={setMintDescription}
            />

            {/* Detail Description */}
            <TextInput
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 8,
                padding: 12,
                color: '#fff',
                fontSize: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#334155',
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Detailed description (optional)"
              placeholderTextColor="#9CA3AF"
              value={mintDetailDescription}
              onChangeText={setMintDetailDescription}
              multiline
              numberOfLines={3}
            />

            {/* Preview */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#0F172A',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#334155',
            }}>
              <Text style={{ fontSize: 30, marginRight: 12 }}>{selectedEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {mintName || 'NFT Name'}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                  {mintDescription || 'Description'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#7C3AED',
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
                opacity: minting ? 0.6 : 1,
              }}
              onPress={handleMint}
              disabled={minting}
            >
              {minting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
                  Mint NFT
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* No wallet */}
        {!wallet && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>
              Create a wallet first to view NFTs
            </Text>
          </View>
        )}

        {/* No NFTs */}
        {wallet && nfts.length === 0 && !showMintForm && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>No NFTs yet</Text>
            <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
              Tap "+ Mint" to create your first NFT
            </Text>
          </View>
        )}

        {/* NFT Grid */}
        <View style={styles.tokenGrid}>
          {nfts.map(nft => {
            const meta = parseNFTMetadata(nft);

            return (
              <TouchableOpacity
                key={nft.NFTokenID}
                style={styles.tokenTile}
                onPress={() => handleTokenPress(nft)}
                onLongPress={() => handleBurn(nft.NFTokenID, meta.name)}
                activeOpacity={0.7}
              >
                <View style={styles.tokenImageContainer}>
                  <Text style={styles.tokenEmoji}>{meta.image}</Text>
                </View>
                <Text style={styles.tokenName} numberOfLines={1}>
                  {meta.name}
                </Text>
                <Text style={styles.tokenDescription} numberOfLines={2}>
                  {meta.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default NFTsScreen;
