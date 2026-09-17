import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';

export interface OnboardingGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenPictureFrame?: () => void;
}

interface GuideSlide {
  badge: string;
  emoji: string;
  title: string;
  subtitle: string;
  points: {
    icon: string;
    title: string;
    description: string;
  }[];
  tipText?: string;
}

const GUIDE_SLIDES: GuideSlide[] = [
  {
    badge: 'Welcome to Memory Lane',
    emoji: '🌿',
    title: 'Two Thoughtful Modes in One App',
    subtitle: 'Designed specifically to bring calm, dignity, and gentle structure to daily life.',
    points: [
      {
        icon: '🕊️',
        title: 'Serene Patient View',
        description:
          'A tranquil, clutter-free screen for your loved one with clear clock & date orientation, familiar faces, and comforting voice readouts.',
      },
      {
        icon: '🔒',
        title: 'Protected Caregiver Setup',
        description:
          'On first install, Memory Lane starts in Caregiver Mode so you can personalize photos and daily alarms before giving the device to your loved one.',
      },
    ],
    tipText: 'Tip: You can switch to Patient View anytime, and return using PIN 1234.',
  },
  {
    badge: 'Cherished Faces & Stories',
    emoji: '🖼️',
    title: 'Family Memories & Voice Stories',
    subtitle: 'Spark recognition and warm memories through familiar photos and narration.',
    points: [
      {
        icon: '📸',
        title: 'Add Family & Pet Photos',
        description:
          'We included 1 sample memory of Sarah & Leo to show how it works. Be sure to add your loved one\'s real family members and pets with photos and short stories.',
      },
      {
        icon: '🔊',
        title: 'Soothing Voice Narration',
        description:
          'Tap "Read Story" on any memory card to hear a gentle, patient English voice read the person\'s name, relationship, and story out loud.',
      },
    ],
    tipText: 'Tip: Pin special photos with the ⭐ star so they appear first in the slideshow.',
  },
  {
    badge: 'Structure & Independence',
    emoji: '⏰',
    title: 'Voice-Guided Daily Routines',
    subtitle: 'Gentle prompts throughout the day for medication, meals, and hydration.',
    points: [
      {
        icon: '💊',
        title: 'Medically Thoughtful Schedule',
        description:
          'We provided 1 sample routine for Morning Medication. Add your loved one\'s personal routines for hydration, lunch, walks, and evening rest.',
      },
      {
        icon: '🗣️',
        title: 'Automated Voice Reminders',
        description:
          'When an alert triggers, Memory Lane speaks the reminder gently aloud, giving your loved one clear audio guidance.',
      },
      {
        icon: '🛡️',
        title: '100% Offline & Safe',
        description:
          'Uses standard local notifications without high-privilege alarms or battery drain. Zero data ever leaves your device.',
      },
    ],
    tipText: 'Tip: Tap "✓ Mark Done" to easily track today\'s completed routines.',
  },
  {
    badge: 'Tabletop Companion',
    emoji: '🖼️',
    title: 'Ambient Digital Picture Frame',
    subtitle: 'Turn your phone or tablet into an interactive bedside photo frame.',
    points: [
      {
        icon: '✨',
        title: 'Full-Screen Photo Slideshow',
        description:
          'Cycles through family photos with gentle cross-fades and ambient backdrops. Minimalist title overlay keeps the focus purely on loved ones.',
      },
      {
        icon: '🌅',
        title: 'Landscape Side Wings',
        description:
          'When rotated sideways on a stand, display a soft digital clock on the left wing and the upcoming daily routine on the right wing.',
      },
      {
        icon: '📢',
        title: 'Auto-Returning Alerts',
        description:
          'Routine alerts announce over the photo slideshow with a 60-second auto-return timer so photo playback seamlessly resumes.',
      },
    ],
    tipText: 'Tip: Keep your tablet plugged into power on a nightstand for an all-day bedside companion.',
  },
];

export const OnboardingGuideModal: React.FC<OnboardingGuideModalProps> = ({
  visible,
  onClose,
  onOpenPictureFrame,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const currentSlide = GUIDE_SLIDES[currentSlideIndex];
  const isLastSlide = currentSlideIndex === GUIDE_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onClose();
    } else {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setCurrentSlideIndex(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlayBackdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalCard, isTablet && styles.modalCardTablet]}>
            {/* Top Navigation & Close */}
            <View style={styles.topHeaderRow}>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{currentSlide.badge}</Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close Onboarding Guide"
              >
                <Text style={styles.closeButtonText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Slide Content */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Hero */}
              <View style={styles.heroSection}>
                <View style={styles.heroIconCircle}>
                  <Text style={styles.heroEmoji}>{currentSlide.emoji}</Text>
                </View>
                <Text style={[Typography.h1, styles.slideTitle]}>
                  {currentSlide.title}
                </Text>
                <Text style={[Typography.bodyLarge, styles.slideSubtitle]}>
                  {currentSlide.subtitle}
                </Text>
              </View>

              {/* Step / Feature Cards */}
              <View style={styles.pointsList}>
                {currentSlide.points.map((pt, idx) => (
                  <View key={idx} style={styles.pointCard}>
                    <View style={styles.pointIconBox}>
                      <Text style={styles.pointIcon}>{pt.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.h3, styles.pointTitle]}>
                        {pt.title}
                      </Text>
                      <Text style={[Typography.body, styles.pointDescription]}>
                        {pt.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Caregiver Pro-Tip Box */}
              {currentSlide.tipText ? (
                <View style={styles.tipBox}>
                  <Text style={styles.tipEmoji}>💡</Text>
                  <Text style={styles.tipText}>{currentSlide.tipText}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Bottom Footer with Dots & Action Buttons */}
            <View style={styles.footerContainer}>
              {/* Pagination Dots */}
              <View style={styles.dotsRow}>
                {GUIDE_SLIDES.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setCurrentSlideIndex(i)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Go to slide ${i + 1}`}
                  >
                    <View
                      style={[
                        styles.dot,
                        i === currentSlideIndex ? styles.activeDot : styles.inactiveDot,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Button Action Row */}
              <View style={styles.actionButtonsRow}>
                {currentSlideIndex > 0 ? (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handlePrevious}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Previous slide"
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleClose}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Skip onboarding tour"
                  >
                    <Text style={styles.backButtonText}>Skip Tour</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    isLastSlide && styles.finishButton,
                  ]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={isLastSlide ? "Start using Memory Lane" : "Next slide"}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastSlide ? '🌿 Start Using Memory Lane' : 'Next →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 38, 29, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    width: '100%',
    maxHeight: '92%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalCardTablet: {
    maxWidth: 640,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  badgePill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  badgePillText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  closeButtonText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primaryMuted,
  },
  heroEmoji: {
    fontSize: 32,
  },
  slideTitle: {
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  slideSubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  pointsList: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pointIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pointIcon: {
    fontSize: 22,
  },
  pointTitle: {
    color: Colors.primary,
    marginBottom: 3,
  },
  pointDescription: {
    color: Colors.textSecondary,
    lineHeight: 20,
    fontSize: 14,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentWarmLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accentWarm,
    marginTop: Spacing.md,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: Colors.border,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: TouchTargets.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minHeight: TouchTargets.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  finishButton: {
    backgroundColor: Colors.success,
  },
  nextButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
