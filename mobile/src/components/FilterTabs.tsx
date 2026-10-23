import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

export type FilterType = 'all' | 'overdue' | 'pending' | 'repaid';

interface FilterTabsProps {
  activeFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  counts: {
    all: number;
    overdue: number;
    pending: number;
    repaid: number;
  };
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const tabs: { key: FilterType; label: string; count: number; alert?: boolean }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'overdue', label: 'Overdue', count: counts.overdue, alert: counts.overdue > 0 },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'repaid', label: 'Settled', count: counts.repaid },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                isActive && styles.activeTabButton,
                tab.alert && !isActive && styles.alertTabButton,
              ]}
              onPress={() => onSelectFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.activeTabLabel,
                  tab.alert && !isActive && styles.alertTabLabel,
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.badge,
                  isActive && styles.activeBadge,
                  tab.alert && styles.alertBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isActive && styles.activeBadgeText,
                    tab.alert && styles.alertBadgeText,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  alertTabButton: {
    backgroundColor: colors.overdueBg,
    borderColor: colors.overdueBorder,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: colors.textInverse,
  },
  alertTabLabel: {
    color: colors.overdueText,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  alertBadge: {
    backgroundColor: colors.overdueBadge,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeBadgeText: {
    color: colors.textInverse,
  },
  alertBadgeText: {
    color: '#FFF',
  },
});
