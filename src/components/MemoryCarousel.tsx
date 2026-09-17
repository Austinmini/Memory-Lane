import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets, resolveMemoryImageSource } from '../constants';
import { MemoryRecord } from '../db/types';
import { speakMemory, stopSpeaking, isSpeaking } from '../services/speechService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - Spacing.md * 2, 420);
const IMAGE_HEIGHT = 240;

export interface MemoryCarouselProps {
  memories: MemoryRecord[];
  /**
   * @deprecated Slideshow functionality is now handled by Digital Picture Frame mode.
   */
  autoPlayIntervalSeconds?: number;
  onMemoryPress?: (memory: MemoryRecord) => void;
}

export const MemoryCarousel: React.FC<MemoryCarouselProps> = ({
  memories,
  onMemoryPress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const flatListRef = useRef<FlatList<MemoryRecord>>(null);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const goToNext = () => {
    if (memories.length === 0) return;
    const nextIndex = (currentIndex + 1) % memories.length;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  };

  const goToPrevious = () => {
    if (memories.length === 0) return;
    const prevIndex = (currentIndex - 1 + memories.length) % memories.length;
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    setCurrentIndex(prevIndex);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const calculatedIndex = Math.round(offsetX / CARD_WIDTH);
    if (calculatedIndex >= 0 && calculatedIndex < memories.length && calculatedIndex !== currentIndex) {
      setCurrentIndex(calculatedIndex);
    }
  };

  const handleToggleNarration = async (memory: MemoryRecord) => {
    const speaking = await isSpeaking();
    if (speaking && isPlayingAudio) {
      await stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    await speakMemory(memory.title, memory.relationship, memory.story, {
      onStart: () => setIsPlayingAudio(true),
      onDone: () => setIsPlayingAudio(false),
      onStopped: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  if (memories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[Typography.h2, { color: Colors.primary, textAlign: 'center' }]}>
          🌸 Memories
        </Text>
        <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
          No memories added yet. Caregivers can add cherished photos and stories anytime.
        </Text>
      </View>
    );
  }

  const currentMemory = memories[currentIndex] || memories[0];

  return (
    <View style={styles.container}>
      {/* Carousel Card Slider */}
      <FlatList
        ref={flatListRef}
        data={memories}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => onMemoryPress?.(item)}
            style={styles.cardWrapper}
          >
            <View style={styles.card}>
              {/* Photo Area */}
              <View style={styles.imageContainer}>
                {resolveMemoryImageSource(item.localImageUri) ? (
                  <Image
                    source={resolveMemoryImageSource(item.localImageUri)!}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.fallbackImageContainer}>
                    <Text style={styles.fallbackIcon}>🖼️</Text>
                    <Text style={[Typography.caption, { color: Colors.primaryMuted, marginTop: Spacing.xs }]}>
                      Family Photo
                    </Text>
                  </View>
                )}

                {/* Relationship Badge */}
                {item.relationship ? (
                  <View style={styles.relationshipBadge}>
                    <Text style={[Typography.badge, { color: Colors.primary }]}>
                      {item.relationship}
                    </Text>
                  </View>
                ) : null}

                {/* Favorite Star indicator */}
                {item.isFavorite === 1 ? (
                  <View style={styles.favoriteIndicator}>
                    <Text style={styles.starText}>⭐</Text>
                  </View>
                ) : null}
              </View>

              {/* Text / Story Details */}
              <View style={styles.infoContainer}>
                <Text
                  style={[Typography.h1, { color: Colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <Text
                  style={[Typography.bodyLarge, { color: Colors.textSecondary, marginTop: Spacing.sm }]}
                  numberOfLines={4}
                >
                  {item.story}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Paging Dots */}
      {memories.length > 1 && (
        <View style={styles.paginationDotsRow}>
          {memories.map((m, idx) => (
            <View
              key={m.id}
              style={[
                styles.dot,
                idx === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}

      {/* Dementia-Friendly Action Bar */}
      <View style={styles.controlsRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.navButton, memories.length <= 1 && styles.disabledButton]}
          onPress={goToPrevious}
          disabled={memories.length <= 1}
          activeOpacity={0.7}
          accessibilityLabel="Previous Memory"
          accessibilityRole="button"
        >
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>

        {/* Primary Audio Narration Button (High Contrast, Large Target >= 56dp) */}
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isPlayingAudio && { backgroundColor: Colors.accentWarm },
          ]}
          onPress={() => handleToggleNarration(currentMemory)}
          activeOpacity={0.8}
          accessibilityLabel={isPlayingAudio ? 'Stop speaking memory' : 'Read memory story aloud'}
          accessibilityRole="button"
        >
          <Text style={styles.voiceIcon}>{isPlayingAudio ? '⏹' : '🔊'}</Text>
          <Text style={[Typography.buttonLarge, { color: Colors.textInverse, marginLeft: Spacing.sm }]}>
            {isPlayingAudio ? 'Stop' : 'Listen'}
          </Text>
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.navButton, memories.length <= 1 && styles.disabledButton]}
          onPress={goToNext}
          disabled={memories.length <= 1}
          activeOpacity={0.7}
          accessibilityLabel="Next Memory"
          accessibilityRole="button"
        >
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Index Counter */}
      <View style={styles.subControlRow}>
        <Text style={[Typography.caption, { color: Colors.textMuted }]}>
          Memory {currentIndex + 1} of {memories.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  emptyContainer: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.surfaceMuted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    fontSize: 56,
  },
  relationshipBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  starText: {
    fontSize: 18,
  },
  infoContainer: {
    padding: Spacing.lg,
    minHeight: 140,
    justifyContent: 'flex-start',
  },
  paginationDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  dot: {
    height: 10,
    borderRadius: Radius.full,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 26,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 10,
    backgroundColor: Colors.border,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  navButton: {
    width: TouchTargets.minWidth,
    height: TouchTargets.minHeight,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonText: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: '700',
  },
  disabledButton: {
    borderColor: Colors.borderLight,
    opacity: 0.4,
  },
  voiceButton: {
    flex: 1,
    height: TouchTargets.largeButton,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  voiceIcon: {
    fontSize: 26,
    color: Colors.textInverse,
  },
  subControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
});
