import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { speakCalmly } from '../services/speechService';

export interface CaregiverLockModalProps {
  visible: boolean;
  onUnlock: () => void;
  onClose: () => void;
  correctPin?: string;
}

export const CaregiverLockModal: React.FC<CaregiverLockModalProps> = ({
  visible,
  onUnlock,
  onClose,
  correctPin = '1234',
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const holdIntervalRef = useRef<any>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMessage('');
      setHoldProgress(0);
    }
  }, [visible]);

  // Check PIN whenever it reaches 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPin) {
        setErrorMessage('');
        // Brief pause for visual confirmation
        setTimeout(() => {
          setPin('');
          onUnlock();
        }, 200);
      } else {
        // Trigger subtle shake animation & feedback
        triggerError();
      }
    }
  }, [pin, correctPin]);

  const triggerError = () => {
    setErrorMessage('Incorrect PIN. (Default is 1234)');
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(200);
      } catch {
        // Safe vibration fallback
      }
    }

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();

    // Clear PIN after brief delay
    setTimeout(() => {
      setPin('');
    }, 600);
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setErrorMessage('');
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setErrorMessage('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMessage('');
    setPin('');
  };

  // Hold-to-unlock mechanism (Caregiver bypass)
  const handleHoldStart = () => {
    setHoldProgress(0);
    let count = 0;
    holdIntervalRef.current = setInterval(() => {
      count += 100;
      const progress = Math.min(1, count / 3000);
      setHoldProgress(progress);
      if (count >= 3000) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setHoldProgress(1);
        setTimeout(() => {
          onUnlock();
        }, 150);
      }
    }, 100);
  };

  const handleHoldEnd = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  const speakHint = () => {
    speakCalmly('Caregiver access lock. Enter your 4-digit PIN to access caregiver controls.');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalCardContainer}>
          <View style={styles.modalCard}>
            {/* Header / Lock Icon */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🔒</Text>
              </View>
              <Text style={[Typography.h2, { color: Colors.primary, textAlign: 'center' }]}>
                Caregiver Access
              </Text>
              <Text style={[Typography.caption, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
                Protected mode for managing family memories, photos, and routine reminders.
              </Text>
            </View>

            {/* PIN Dots Display */}
            <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      isFilled ? styles.dotFilled : styles.dotEmpty,
                      errorMessage ? styles.dotError : null,
                    ]}
                  />
                );
              })}
            </Animated.View>

            {/* Error Message or Default Hint */}
            <View style={styles.messageBox}>
              {errorMessage ? (
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              ) : (
                <Text style={styles.hintText}>Default PIN: 1234</Text>
              )}
            </View>

            {/* Numeric Keypad (Minimum touch targets > 64dp for accessibility) */}
            <View style={styles.keypad}>
              <View style={styles.keypadRow}>
                {['1', '2', '3'].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.keyButton}
                    onPress={() => handleKeyPress(digit)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Digit ${digit}`}
                  >
                    <Text style={styles.keyButtonText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['4', '5', '6'].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.keyButton}
                    onPress={() => handleKeyPress(digit)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Digit ${digit}`}
                  >
                    <Text style={styles.keyButtonText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['7', '8', '9'].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.keyButton}
                    onPress={() => handleKeyPress(digit)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Digit ${digit}`}
                  >
                    <Text style={styles.keyButtonText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={[styles.keyButton, styles.specialKeyButton]}
                  onPress={handleClear}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Clear PIN"
                >
                  <Text style={styles.specialKeyText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('0')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Digit 0"
                >
                  <Text style={styles.keyButtonText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keyButton, styles.specialKeyButton]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Delete last digit"
                >
                  <Text style={styles.specialKeyText}>⌫</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Alternative Hold-to-Unlock for Caregiver Convenience */}
            <View style={styles.holdSection}>
              <TouchableOpacity
                style={styles.holdButton}
                onPressIn={handleHoldStart}
                onPressOut={handleHoldEnd}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Hold for 3 seconds to unlock without PIN"
              >
                {/* Hold Progress Background Bar */}
                <View
                  style={[
                    styles.holdProgressBar,
                    { width: `${Math.round(holdProgress * 100)}%` },
                  ]}
                />
                <Text style={styles.holdButtonText}>
                  {holdProgress > 0
                    ? `Holding... ${Math.round(holdProgress * 100)}%`
                    : '⏱️ Or Hold 3s to Unlock'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cancel / Return Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Return to Patient View"
              >
                <Text style={styles.cancelButtonText}>← Return to Patient View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 24, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconText: {
    fontSize: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  dotError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.danger,
  },
  messageBox: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: '700',
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.sm,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  keyButton: {
    flex: 1,
    height: 64,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keyButtonText: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  specialKeyButton: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderLight,
  },
  specialKeyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  holdSection: {
    width: '100%',
    marginTop: Spacing.md,
  },
  holdButton: {
    height: 48,
    backgroundColor: Colors.accentWarmLight,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accentWarm,
    overflow: 'hidden',
    position: 'relative',
  },
  holdProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.accentWarm,
    opacity: 0.35,
  },
  holdButtonText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.accentWarm,
  },
  footer: {
    width: '100%',
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  cancelButton: {
    minHeight: TouchTargets.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 17,
  },
});
