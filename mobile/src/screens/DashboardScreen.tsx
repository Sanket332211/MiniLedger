import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import {
  fetchLoans,
  fetchSummary,
  toggleLoanStatus,
  LoanItem,
  LoanSummary,
} from '../api/client';
import { SummaryCard } from '../components/SummaryCard';
import { LoanCard } from '../components/LoanCard';
import { FilterTabs, FilterType } from '../components/FilterTabs';
import { AddLoanModal } from '../components/AddLoanModal';
import { ReceiptViewerModal } from '../components/ReceiptViewerModal';

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [summary, setSummary] = useState<LoanSummary>({
    totalLent: 0,
    totalRepaid: 0,
    overdueAmount: 0,
    pendingAmount: 0,
    totalCount: 0,
    repaidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  });

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [fetchedLoans, fetchedSummary] = await Promise.all([
        fetchLoans(activeFilter, searchQuery),
        fetchSummary(),
      ]);
      setLoans(fetchedLoans);
      setSummary(fetchedSummary);
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleToggleRepaid = async (loanId: number, currentStatus: boolean) => {
    // Optimistic UI update
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId ? { ...l, is_repaid: !currentStatus, is_overdue: false } : l
      )
    );

    try {
      await toggleLoanStatus(loanId, !currentStatus);
      // Refresh summary and state from server
      const updatedSummary = await fetchSummary();
      setSummary(updatedSummary);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Revert if error
      loadData();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Bar / Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIcon}>
            <MaterialCommunityIcons name="book-open-page-variant" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>MiniLedger</Text>
            <Text style={styles.headerSubtitle}>{user?.phone || 'My Ledger'}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconButton, styles.logoutButton]}
            onPress={logout}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.overdueText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onToggleRepaid={handleToggleRepaid}
            onViewReceipt={(url) => setPreviewImageUrl(url)}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Top Financial Summary Card */}
            <SummaryCard summary={summary} />

            {/* Search Input Bar */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search friend's name..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs (All / Overdue / Pending / Settled) */}
            <FilterTabs
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              counts={{
                all: summary.totalCount,
                overdue: summary.overdueCount,
                pending: summary.pendingCount,
                repaid: summary.repaidCount,
              }}
            />

            {/* Section Heading */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeFilter === 'overdue'
                  ? 'Overdue Loans'
                  : activeFilter === 'repaid'
                  ? 'Settled Loans'
                  : activeFilter === 'pending'
                  ? 'Pending Loans'
                  : 'All Loan Entries'}
              </Text>
              <Text style={styles.sectionCount}>{loans.length} results</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptySubtitle}>Loading ledger entries...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons
                  name={activeFilter === 'overdue' ? 'check-decagram-outline' : 'cash-multiple'}
                  size={42}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'overdue'
                  ? 'No Overdue Loans!'
                  : searchQuery
                  ? 'No Matching Friends'
                  : 'No Loans Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'overdue'
                  ? 'Awesome! All current friend loans are either up to date or settled.'
                  : searchQuery
                  ? `No entries match "${searchQuery}". Try a different name.`
                  : 'Tap the "+ Lend Money" button below to add your first loan entry.'}
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Floating Action Button (+ Lend Money) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalOpen(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        <Text style={styles.fabText}>Lend Money</Text>
      </TouchableOpacity>

      {/* Add Loan Modal */}
      <AddLoanModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLoanCreated={loadData}
      />

      {/* Receipt Image Viewer Modal (Bonus) */}
      <ReceiptViewerModal
        visible={!!previewImageUrl}
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'android' ? 14 : 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: colors.overdueBg,
  },
  listContent: {
    paddingBottom: 90,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
