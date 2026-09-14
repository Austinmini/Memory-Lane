import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { speakCalmly, stopSpeaking, isSpeaking } from '../services/speechService';

export interface HeaderTimeWidgetProps {
  /**
   * Optional custom callback when user taps orientation readout.
   */
  onPressVoice?: () => void;
}

/**
 * Returns a warm, dementia-friendly description of the time of day.
 */
export function getTimeOfDayPeriod(hour: number): { period: string; emoji: string; greeting: string } {
  if (hour >= 5 && hour < 12) {
    return { period: 'Morning', emoji: '☀️', greeting: 'Good morning' };
  } else if (hour >= 12 && hour < 17) {
    return { period: 'Afternoon', emoji: '🌤️', greeting: 'Good afternoon' };
  } else if (hour >= 17 && hour < 21) {
    return { period: 'Evening', emoji: '🌇', greeting: 'Good evening' };
  } else {
    return { period: 'Night', emoji: '🌙', greeting: 'Restful night' };
  }
}

/**
 * Formats a Date into standard readable components.
 */
export function formatOrientationDetails(date: Date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayOfMonth = date.getDate();
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const timeString = `${hours12}:${minutesStr} ${ampm}`;

  const { period, emoji, greeting } = getTimeOfDayPeriod(hours24);

  return {
    dayName,
    monthName,
    dayOfMonth,
    timeString,
    period,
    emoji,
    greeting,
    fullDayPeriod: `${dayName} ${period}`,
    fullDate: `${monthName} ${dayOfMonth}, ${date.getFullYear()}`,
  };
}

export const HeaderTimeWidget: React.FC<HeaderTimeWidgetProps> = ({ onPressVoice }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSpeakingOrientation, setIsSpeakingOrientation] = useState(false);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000 * 15); // Check every 15s to keep clock precise

    return () => clearInterval(timer);
  }, []);

  const {
    dayName,
    timeString,
    period,
    emoji,
    greeting,
    fullDate,
  } = formatOrientationDetails(currentDate);

  const handleSpeakOrientation = async () => {
    const speaking = await isSpeaking();
    if (speaking && isSpeakingOrientation) {
      await stopSpeaking();
      setIsSpeakingOrientation(false);
      return;
    }

    onPressVoice?.();
    const spokenMessage = `${greeting}. Today is ${dayName} ${period}, ${fullDate}. The time is ${timeString}.`;

    setIsSpeakingOrientation(true);
    await speakCalmly(spokenMessage, {
      onStart: () => setIsSpeakingOrientation(true),
      onDone: () => setIsSpeakingOrientation(false),
      onStopped: () => setIsSpeakingOrientation(false),
      onError: () => setIsSpeakingOrientation(false),
    });
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Banner: Day & Part of Day */}
      <View style={styles.periodRow}>
        <View style={styles.periodPill}>
          <Text style={styles.periodEmoji}>{emoji}</Text>
          <Text style={[Typography.h3, { color: Colors.primary, fontWeight: '700' }]}>
            {dayName} {period}
          </Text>
        </View>

        {/* Listen Button for Orientation */}
        <TouchableOpacity
          style={[
            styles.listenButton,
            isSpeakingOrientation && { backgroundColor: Colors.accentWarm },
          ]}
          onPress={handleSpeakOrientation}
          activeOpacity={0.8}
          accessibilityLabel="Read time and date aloud"
          accessibilityRole="button"
        >
          <Text style={styles.listenIcon}>{isSpeakingOrientation ? '⏹' : '🔊'}</Text>
          <Text style={[Typography.caption, { color: Colors.textInverse, fontWeight: '700', marginLeft: 4 }]}>
            {isSpeakingOrientation ? 'Stop' : 'Listen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Large Digital Clock */}
      <Text style={[Typography.clock, { color: Colors.textPrimary, marginTop: Spacing.xs }]}>
        {timeString}
      </Text>

      {/* Written Date with High Contrast */}
      <Text style={[Typography.orientationDate, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
        {fullDate}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  periodEmoji: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  listenIcon: {
    fontSize: 18,
    color: Colors.textInverse,
  },
});
