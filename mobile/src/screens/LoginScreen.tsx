import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { requestOtp, submitOtp } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+15550192834');
  const [otp, setOtp] = useState('');
  const [serverHintOtp, setServerHintOtp] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);


  const handleSendOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Please enter a valid phone number (e.g. +15550192834).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestOtp(cleanPhone);
      setStep('otp');
      setInfoMsg('Code sent! Check your server terminal log for the mock OTP.');
      if (res.mockOtp) {
        setServerHintOtp(res.mockOtp);
        console.log(
          `%c🔑 [MOCK OTP] Code: ${res.mockOtp} %c(Phone: ${cleanPhone})`,
          'color: #00d26a; font-weight: bold; font-size: 14px;',
          'color: #888;'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP. Is the backend server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('OTP must be 6 digits.');
      return;
    }

    setIsLoading(true);
    try {
      await submitOtp(phone.trim(), cleanOtp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="book-open-page-variant" size={36} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandSubtitle}>Track money lent to friends effortlessly</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>
            {step === 'phone' ? 'Sign in with Phone' : 'Enter Verification Code'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {step === 'phone'
              ? 'We will generate a mock OTP printed in your server logs.'
              : `Code sent to ${phone}`}
          </Text>

          {/* Feedback Messages */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.overdueText} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {infoMsg && (
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={16} color={colors.primary} />
              <Text style={styles.infoText}>{infoMsg}</Text>
            </View>
          )}

          {step === 'phone' ? (
            /* Step 1: Phone input */
            <View>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+15550192834"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>

              {/* Dev Quick-Fill */}
              <TouchableOpacity
                style={styles.quickFillBtn}
                onPress={() => setPhone('+15550192834')}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.primary} />
                <Text style={styles.quickFillText}>Use demo phone: +1 555-019-2834</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Send Mock OTP</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Step 2: OTP input */
            <View>
              <Text style={styles.inputLabel}>6-DIGIT CODE</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="shield-key-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.textInput, styles.otpInput]}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              {/* Quick Auto-Fill Hint if mockOtp available */}
              {serverHintOtp && (
                <TouchableOpacity
                  style={styles.mockOtpBanner}
                  onPress={() => setOtp(serverHintOtp)}
                >
                  <MaterialCommunityIcons name="key-variant" size={16} color={colors.repaidText} />
                  <Text style={styles.mockOtpBannerText}>
                    Console OTP: <Text style={styles.mockOtpCode}>{serverHintOtp}</Text> (Tap to auto-fill)
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify & Enter</Text>
                    <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                  setErrorMsg(null);
                }}
              >
                <Text style={styles.backButtonText}>← Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '700',
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  mockOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.repaidBg,
    borderColor: colors.repaidBorder,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  mockOtpBannerText: {
    fontSize: 13,
    color: colors.repaidText,
    fontWeight: '600',
  },
  mockOtpCode: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
