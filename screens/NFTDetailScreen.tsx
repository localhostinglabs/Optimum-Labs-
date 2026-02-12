import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { styles } from './NFTDetailScreen.styles';

interface NFTDetailRouteParams {
  tokenId: string;
  nftMeta?: {
    name: string;
    description: string;
    detailDescription: string;
    image: string;
  };
}

const NFTDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { tokenId, nftMeta } = route.params as NFTDetailRouteParams;

  const token = nftMeta || {
    name: 'Unknown NFT',
    description: '',
    detailDescription: '',
    image: '🎨',
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.onPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{token.name}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Token Image */}
        <View style={styles.tokenImageContainer}>
          <View style={styles.tokenImage}>
            <Text style={styles.tokenEmoji}>{token.image}</Text>
          </View>
          <Text style={styles.tokenName}>{token.name}</Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.description}>
            {token.detailDescription || token.description}
          </Text>

          {/* Token ID */}
          <View style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
          }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
              Token ID
            </Text>
            <Text style={{ color: theme.colors.text, fontSize: 11, fontFamily: 'monospace' }} numberOfLines={2}>
              {tokenId}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons
              name="heart-outline"
              size={20}
              color={theme.colors.onPrimary}
            />
            <Text style={styles.primaryButtonText}>Add to Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons
              name="share-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.secondaryButtonText}>Share Token</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default NFTDetailScreen;
