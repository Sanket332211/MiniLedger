import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/formatters';
import { LoanSummary } from '../api/client';

interface SummaryCardProps {
  summary: LoanSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const hasOverdue = summary.overdueAmount > 0;

  return (
    <View style={styles.cardContainer}>
      {/* Header Accent */}
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Ledger Overview</Text>
        </View>
        <View style={styles.statsBadge}>
          <Text style={styles.statsBadgeText}>{summary.totalCount} {summary.totalCount === 1 ? 'Loan' : 'Loans'}</Text>
        </View>
      </View>

      {/* Main Total Lent Metric */}
      <View style={styles.mainMetricRow}>
        <Text style={styles.metricLabel}>TOTAL LENT</Text>
        <Text style={styles.totalAmount}>{formatCurrency(summary.totalLent)}</Text>
      </View>

      {/* Breakdown Row: Repaid vs Overdue */}
      <View style={styles.breakdownRow}>
        {/* Total Repaid Box */}
        <View style={[styles.miniBox, styles.repaidBox]}>
          <View style={styles.miniBoxHeader}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.repaidText} />
            <Text style={styles.miniBoxLabel}>REPAID</Text>
          </View>
          <Text style={styles.repaidValue}>{formatCurrency(summary.totalRepaid)}</Text>
          <Text style={styles.miniBoxSubtext}>{summary.repaidCount} settled</Text>
        </View>

        {/* Overdue Amount Box */}
        <View style={[styles.miniBox, hasOverdue ? styles.overdueActiveBox : styles.overdueNeutralBox]}>
          <View style={styles.miniBoxHeader}>
            <MaterialCommunityIcons
              name={hasOverdue ? 'alert-circle' : 'shield-check-outline'}
              size={16}
              color={hasOverdue ? colors.overdueText : colors.textMuted}
            />
            <Text style={[styles.miniBoxLabel, hasOverdue && styles.overdueLabel]}>OVERDUE</Text>
          </View>
          <Text style={[styles.overdueValue, hasOverdue ? styles.overdueTextActive : styles.overdueTextNeutral]}>
            {formatCurrency(summary.overdueAmount)}
          </Text>
          <Text style={styles.miniBoxSubtext}>
            {hasOverdue ? `${summary.overdueCount} delayed` : 'None overdue'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  statsBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  mainMetricRow: {
    marginBottom: 18,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  miniBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  miniBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  repaidBox: {
    backgroundColor: colors.repaidBg,
    borderColor: colors.repaidBorder,
  },
  repaidValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.repaidText,
    marginBottom: 2,
  },
  overdueActiveBox: {
    backgroundColor: colors.overdueBg,
    borderColor: colors.overdueBorder,
  },
  overdueNeutralBox: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  overdueLabel: {
    color: colors.overdueText,
  },
  overdueValue: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  overdueTextActive: {
    color: colors.overdueText,
  },
  overdueTextNeutral: {
    color: colors.textSecondary,
  },
  miniBoxSubtext: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
