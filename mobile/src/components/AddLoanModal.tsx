import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { createLoan, uploadReceiptPhoto } from '../api/client';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onLoanCreated: () => void;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  visible,
  onClose,
  onLoanCreated,
}) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick preset dates generator
  const setPresetDate = (daysAhead: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  const resetForm = () => {
    setFriendName('');
    setAmount('');
    setDueDate('');
    setNotes('');
    setReceiptUrl(null);
    setLocalPhotoUri(null);
    setErrorMsg(null);
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to attach a receipt.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedAsset = result.assets[0];
        setLocalPhotoUri(pickedAsset.uri);

        // Upload to backend immediately
        setIsUploadingPhoto(true);
        try {
          const uploadedUrl = await uploadReceiptPhoto(pickedAsset.uri);
          setReceiptUrl(uploadedUrl);
        } catch (uploadErr: any) {
          Alert.alert('Upload Failed', uploadErr.message || 'Could not upload photo.');
          setLocalPhotoUri(null);
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select image.');
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);

    // Validation
    if (!friendName.trim()) {
      setErrorMsg('Please enter your friend’s name.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than $0.');
      return;
    }

    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setErrorMsg('Please select or enter a valid due date (YYYY-MM-DD).');
      return;
    }

    setIsSubmitting(true);
    try {
      await createLoan({
        friendName: friendName.trim(),
        amount: numAmount,
        dueDate,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
      });

      resetForm();
      onLoanCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create loan entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>New Loan Entry</Text>
              <Text style={styles.modalSubtitle}>Track money you lent to a friend</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {errorMsg && (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={colors.overdueText} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Friend Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FRIEND'S NAME</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sarah Miller"
                  placeholderTextColor={colors.textMuted}
                  value={friendName}
                  onChangeText={setFriendName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AMOUNT LENT</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Due Date & Presets */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DUE DATE (YYYY-MM-DD)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="calendar-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="2026-11-01"
                  placeholderTextColor={colors.textMuted}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.presetRow}>
                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(1)}>
                  <Text style={styles.presetText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(7)}>
                  <Text style={styles.presetText}>+1 Week</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(14)}>
                  <Text style={styles.presetText}>+2 Weeks</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(30)}>
                  <Text style={styles.presetText}>+1 Month</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOTES / PURPOSE (OPTIONAL)</Text>
              <View style={[styles.inputContainer, styles.notesInputContainer]}>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  placeholder="e.g. Dinner split, concert ticket, etc."
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Bonus: Receipt Photo Upload */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithBadge}>
                <Text style={styles.inputLabel}>RECEIPT PHOTO</Text>
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusBadgeText}>BONUS</Text>
                </View>
              </View>

              {localPhotoUri ? (
                <View style={styles.receiptPreviewContainer}>
                  <Image source={{ uri: localPhotoUri }} style={styles.receiptImage} />
                  <View style={styles.receiptPreviewInfo}>
                    <Text style={styles.receiptPreviewText}>Receipt Attached</Text>
                    {isUploadingPhoto ? (
                      <View style={styles.uploadingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.uploadingText}>Uploading photo...</Text>
                      </View>
                    ) : (
                      <Text style={styles.uploadedText}>✓ Upload complete</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => {
                      setLocalPhotoUri(null);
                      setReceiptUrl(null);
                    }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.overdueText} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={handlePickImage}
                  disabled={isUploadingPhoto}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="camera-plus-outline" size={24} color={colors.primary} />
                  <Text style={styles.uploadBoxTitle}>Attach Receipt Photo</Text>
                  <Text style={styles.uploadBoxSubtitle}>Tap to choose from library or take a photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || isUploadingPhoto}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="plus-circle" size={18} color="#FFF" />
                  <Text style={styles.submitBtnText}>Add Loan Entry</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.overdueBg,
    borderColor: colors.overdueBorder,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.overdueText,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  bonusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  bonusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  notesInputContainer: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  uploadBoxSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  receiptPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  receiptPreviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  receiptPreviewText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  uploadingText: {
    fontSize: 11,
    color: colors.primary,
  },
  uploadedText: {
    fontSize: 11,
    color: colors.repaidText,
    fontWeight: '600',
    marginTop: 2,
  },
  removePhotoButton: {
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
