import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { LoanItem, getApiBaseUrl } from '../api/client';
import { formatCurrency, formatDate, getDaysStatus } from '../utils/formatters';

interface LoanCardProps {
  loan: LoanItem;
  onToggleRepaid: (loanId: number, currentStatus: boolean) => void;
  onViewReceipt?: (url: string) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onToggleRepaid,
  onViewReceipt,
}) => {
  const isOverdue = loan.is_overdue && !loan.is_repaid;
  const isRepaid = loan.is_repaid;
  const daysInfo = getDaysStatus(loan.due_date, isRepaid);

  // Generate an avatar color based on friend's name
  const getAvatarColor = (name: string) => {
    const palette = ['#6366F1', '#EC4899', '#8B5CF6', '#3B82F6', '#14B8A6', '#F59E0B'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const fullReceiptUrl = loan.receipt_url
    ? loan.receipt_url.startsWith('http')
      ? loan.receipt_url
      : `${getApiBaseUrl()}${loan.receipt_url}`
    : null;

  return (
    <View
      style={[
        styles.card,
        isOverdue && styles.overdueCard,
        isRepaid && styles.repaidCard,
      ]}
    >
      {/* Top Warning Banner for Overdue items */}
      {isOverdue && (
        <View style={styles.overdueBanner}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={colors.overdueText} />
          <Text style={styles.overdueBannerText}>OVERDUE • {daysInfo.label.toUpperCase()}</Text>
        </View>
      )}

      {/* Main Row: Avatar + Friend Info + Amount */}
      <View style={styles.mainRow}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(loan.friend_name) }]}>
            <Text style={styles.avatarText}>
              {loan.friend_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName} numberOfLines={1}>
              {loan.friend_name}
            </Text>
            <View style={styles.dueDateRow}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={13}
                color={isOverdue ? colors.overdueText : colors.textMuted}
              />
              <Text style={[styles.dueDateText, isOverdue && styles.dueDateTextOverdue]}>
                Due: {formatDate(loan.due_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text
            style={[
              styles.amountText,
              isRepaid && styles.amountTextRepaid,
              isOverdue && styles.amountTextOverdue,
            ]}
          >
            {formatCurrency(loan.amount)}
          </Text>
          <View
            style={[
              styles.statusPill,
              isRepaid && styles.repaidPill,
              isOverdue && styles.overduePill,
              !isRepaid && !isOverdue && styles.pendingPill,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isRepaid && styles.repaidPillText,
                isOverdue && styles.overduePillText,
                !isRepaid && !isOverdue && styles.pendingPillText,
              ]}
            >
              {isRepaid ? 'Settled' : daysInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Optional Notes */}
      {!!loan.notes && (
        <View style={styles.notesContainer}>
          <MaterialCommunityIcons name="text-box-outline" size={13} color={colors.textMuted} />
          <Text style={styles.notesText} numberOfLines={2}>
            {loan.notes}
          </Text>
        </View>
      )}

      {/* Footer Row: Receipt Thumbnail & Mark Repaid Button */}
      <View style={styles.footerRow}>
        {/* Bonus Receipt preview */}
        {fullReceiptUrl ? (
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => onViewReceipt && onViewReceipt(fullReceiptUrl)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: fullReceiptUrl }} style={styles.receiptThumb} />
            <View style={styles.receiptBadge}>
              <MaterialCommunityIcons name="receipt" size={12} color={colors.primary} />
              <Text style={styles.receiptButtonText}>Receipt</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {/* Repayment Toggle Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isRepaid ? styles.actionButtonSettled : styles.actionButtonActive,
          ]}
          onPress={() => onToggleRepaid(loan.id, isRepaid)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name={isRepaid ? 'undo' : 'check-circle-outline'}
            size={16}
            color={isRepaid ? colors.textSecondary : colors.textInverse}
          />
          <Text
            style={[
              styles.actionButtonText,
              isRepaid ? styles.actionButtonTextSettled : styles.actionButtonTextActive,
            ]}
          >
            {isRepaid ? 'Undo Repayment' : 'Mark as Repaid'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  overdueCard: {
    borderColor: colors.overdueBorder,
    backgroundColor: '#FFFDFD',
    borderLeftWidth: 4,
    borderLeftColor: colors.overdueBadge,
  },
  repaidCard: {
    opacity: 0.85,
    backgroundColor: colors.surface,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.overdueBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  overdueBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.overdueText,
    letterSpacing: 0.6,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dueDateTextOverdue: {
    color: colors.overdueText,
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  amountTextRepaid: {
    color: colors.repaidText,
    textDecorationLine: 'none',
  },
  amountTextOverdue: {
    color: colors.overdueText,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  repaidPill: {
    backgroundColor: colors.repaidBg,
  },
  repaidPillText: {
    color: colors.repaidText,
    fontSize: 11,
    fontWeight: '600',
  },
  overduePill: {
    backgroundColor: colors.overdueBg,
  },
  overduePillText: {
    color: colors.overdueText,
    fontSize: 11,
    fontWeight: '700',
  },
  pendingPill: {
    backgroundColor: colors.pendingBg,
  },
  pendingPillText: {
    color: colors.pendingText,
    fontSize: 11,
    fontWeight: '600',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  receiptButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionButtonActive: {
    backgroundColor: colors.primary,
  },
  actionButtonSettled: {
    backgroundColor: colors.surfaceSubtle,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonTextActive: {
    color: colors.textInverse,
  },
  actionButtonTextSettled: {
    color: colors.textSecondary,
  },
});
