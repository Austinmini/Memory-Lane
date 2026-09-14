import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { MemoryRecord } from '../db/types';
import { MemoryRepository } from '../db/memoryRepository';
import { saveImageToSandbox, deleteSandboxImage } from '../services/imageService';
import { speakMemory, stopSpeaking, isSpeaking } from '../services/speechService';

const RELATIONSHIP_SUGGESTIONS = [
  'Daughter',
  'Son',
  'Grandchild',
  'Spouse',
  'Sister',
  'Brother',
  'Friend',
  'Pet',
  'Family Vacation',
  'Favorite Place',
];

export interface EditMemoryScreenProps {
  /**
   * Optional memory to edit. If null or undefined, screen functions in "Add Memory" mode.
   */
  memory?: MemoryRecord | null;
  /**
   * Callback invoked after successful save.
   */
  onSave?: (savedMemory: MemoryRecord) => void;
  /**
   * Callback invoked when caregiver cancels or exits.
   */
  onCancel?: () => void;
  /**
   * Callback invoked after a memory is deleted.
   */
  onDelete?: (deletedId: string) => void;
}

export const EditMemoryScreen: React.FC<EditMemoryScreenProps> = ({
  memory,
  onSave,
  onCancel,
  onDelete,
}) => {
  const isEditing = !!memory;

  const [title, setTitle] = useState(memory?.title || '');
  const [relationship, setRelationship] = useState(memory?.relationship || '');
  const [story, setStory] = useState(memory?.story || '');
  const [imageUri, setImageUri] = useState<string | null>(memory?.localImageUri || null);
  const [isFavorite, setIsFavorite] = useState(memory?.isFavorite === 1);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Stop speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  /**
   * Open system photo picker (Android 13+ Photo Picker compliant, 0 storage permissions required).
   */
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(
        'Photo Selection Note',
        err?.message || 'Could not select photo. Please try again.'
      );
    }
  };

  /**
   * Take a new photo using device camera if permitted.
   */
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission',
          'Camera access is needed to take a photo. You can also pick an existing picture from your photo gallery.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Could not access camera.');
    }
  };

  /**
   * Remove selected photo.
   */
  const handleRemovePhoto = () => {
    setImageUri(null);
  };

  /**
   * Test the gentle English voice narration of the current memory fields.
   */
  const handleToggleVoicePreview = async () => {
    const speaking = await isSpeaking();
    if (speaking && isPlayingPreview) {
      await stopSpeaking();
      setIsPlayingPreview(false);
      return;
    }

    const testTitle = title.trim() || 'Loved One';
    const testRel = relationship.trim() || 'Family';
    const testStory = story.trim() || 'This is a warm and comforting memory of someone very special to you.';

    setIsPlayingPreview(true);
    await speakMemory(testTitle, testRel, testStory, {
      onStart: () => setIsPlayingPreview(true),
      onDone: () => setIsPlayingPreview(false),
      onStopped: () => setIsPlayingPreview(false),
      onError: () => setIsPlayingPreview(false),
    });
  };

  /**
   * Validate and save the memory to SQLite and sandbox file system.
   */
  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Name Required', 'Please enter a name or title for this memory (e.g. "Sarah" or "Our Garden").');
      return;
    }

    setIsSaving(true);
    try {
      const memoryId = memory?.id || `mem_${Date.now()}`;
      let finalImageUri = imageUri || '';

      // If user selected a new photo from picker cache, copy it permanently to sandbox
      if (imageUri && imageUri !== memory?.localImageUri) {
        finalImageUri = await saveImageToSandbox(imageUri, memoryId);
      }

      let savedRecord: MemoryRecord;

      if (isEditing && memory) {
        await MemoryRepository.update(memory.id, {
          title: trimmedTitle,
          relationship: relationship.trim(),
          story: story.trim(),
          localImageUri: finalImageUri,
          isFavorite: isFavorite ? 1 : 0,
        });
        savedRecord = {
          ...memory,
          title: trimmedTitle,
          relationship: relationship.trim(),
          story: story.trim(),
          localImageUri: finalImageUri,
          isFavorite: isFavorite ? 1 : 0,
          updatedAt: Date.now(),
        };
      } else {
        savedRecord = await MemoryRepository.create({
          id: memoryId,
          title: trimmedTitle,
          relationship: relationship.trim(),
          story: story.trim(),
          localImageUri: finalImageUri,
          isFavorite: isFavorite ? 1 : 0,
          sortOrder: 0,
        });
      }

      onSave?.(savedRecord);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save memory. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Confirm and delete existing memory.
   */
  const handleDelete = () => {
    if (!memory) return;

    Alert.alert(
      'Delete Memory?',
      `Are you sure you want to delete "${memory.title}"? This cannot be undone.`,
      [
        { text: 'Keep Memory', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              await MemoryRepository.delete(memory.id);
              if (memory.localImageUri) {
                await deleteSandboxImage(memory.localImageUri);
              }
              onDelete?.(memory.id);
            } catch (err: any) {
              Alert.alert('Delete Error', err?.message || 'Failed to delete memory.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Navigation Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <Text style={[Typography.bodyMediumBold, { color: Colors.textSecondary }]}>
              ✕ Cancel
            </Text>
          </TouchableOpacity>

          <Text style={[Typography.h2, { color: Colors.primary }]}>
            {isEditing ? 'Edit Memory' : 'Add Memory'}
          </Text>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Text style={[Typography.button, { color: Colors.textInverse }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Photo Selection Card */}
        <View style={styles.card}>
          <Text style={[Typography.h3, { color: Colors.textPrimary, marginBottom: Spacing.sm }]}>
            Photo
          </Text>

          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.imageActionRow}>
                <TouchableOpacity
                  style={[styles.photoButton, { backgroundColor: Colors.surfaceElevated }]}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700' }]}>
                    🔄 Change
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.photoButton, { backgroundColor: Colors.dangerLight }]}
                  onPress={handleRemovePhoto}
                  activeOpacity={0.7}
                >
                  <Text style={[Typography.caption, { color: Colors.danger, fontWeight: '700' }]}>
                    🗑 Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
                Add a photo to help spark recognition and warm memories
              </Text>
              <View style={styles.imageActionRow}>
                <TouchableOpacity
                  style={[styles.photoButton, { backgroundColor: Colors.primary }]}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Text style={[Typography.caption, { color: Colors.textInverse, fontWeight: '700' }]}>
                    🖼️ Pick from Photos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.photoButton, { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border }]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700' }]}>
                    📷 Take Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Name & Title Input */}
        <View style={styles.card}>
          <Text style={[Typography.h3, { color: Colors.textPrimary, marginBottom: Spacing.xs }]}>
            Name or Title *
          </Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
            Who or what is pictured? Keep it familiar and clear.
          </Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Sarah & Leo, Rusty, Lake Tahoe"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="next"
            maxLength={60}
          />
        </View>

        {/* Relationship Tag Input & Quick Chips */}
        <View style={styles.card}>
          <Text style={[Typography.h3, { color: Colors.textPrimary, marginBottom: Spacing.xs }]}>
            Relationship or Label
          </Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
            Displayed as a prominent badge to help orient who this is.
          </Text>

          <TextInput
            style={styles.textInput}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g. Daughter, Grandson, Loyal Pet, Old Home"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="next"
            maxLength={40}
          />

          {/* Quick Suggestions Chips */}
          <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs, fontWeight: '600' }]}>
            Quick suggestions:
          </Text>
          <View style={styles.chipsWrap}>
            {RELATIONSHIP_SUGGESTIONS.map((chip) => {
              const isSelected = relationship.toLowerCase() === chip.toLowerCase();
              return (
                <TouchableOpacity
                  key={chip}
                  style={[
                    styles.chip,
                    isSelected && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                  ]}
                  onPress={() => setRelationship(chip)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      Typography.caption,
                      { color: isSelected ? Colors.textInverse : Colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Memory Story / Soothing Narration */}
        <View style={styles.card}>
          <Text style={[Typography.h3, { color: Colors.textPrimary, marginBottom: Spacing.xs }]}>
            Memory Story (Read Aloud)
          </Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
            Write a short, comforting sentence. The app will read this out loud when requested.
          </Text>

          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={story}
            onChangeText={setStory}
            placeholder="e.g. Sarah is your loving daughter. She lives nearby and loves visiting every Sunday afternoon."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Test Voice Readout Button */}
          <TouchableOpacity
            style={[
              styles.voicePreviewButton,
              isPlayingPreview && { backgroundColor: Colors.accentWarm },
            ]}
            onPress={handleToggleVoicePreview}
            activeOpacity={0.8}
          >
            <Text style={styles.voicePreviewIcon}>{isPlayingPreview ? '⏹' : '🔊'}</Text>
            <Text style={[Typography.bodyMediumBold, { color: Colors.textInverse, marginLeft: Spacing.sm }]}>
              {isPlayingPreview ? 'Stop Voice Preview' : 'Test Calming Voice Narration'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Favorite Pin Toggle */}
        <View style={[styles.card, styles.switchRow]}>
          <View style={{ flex: 1, paddingRight: Spacing.md }}>
            <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
              ⭐ Pin to Top (Favorite)
            </Text>
            <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 2 }]}>
              Pinned memories will always appear first in the patient's carousel.
            </Text>
          </View>
          <Switch
            value={isFavorite}
            onValueChange={setIsFavorite}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Platform.OS === 'android' ? Colors.surface : undefined}
          />
        </View>

        {/* Delete Memory Button (Edit Mode Only) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Text style={[Typography.button, { color: Colors.danger }]}>
              🗑 Delete This Memory
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cancelButton: {
    minHeight: TouchTargets.minHeight,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imagePreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
  },
  placeholderContainer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  imageActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  photoButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  multilineInput: {
    minHeight: 110,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  voicePreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    minHeight: 52,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  voicePreviewIcon: {
    fontSize: 22,
    color: Colors.textInverse,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.lg,
    minHeight: TouchTargets.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
});
