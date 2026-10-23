import { query } from '../config/database';

export interface Loan {
  id: number;
  user_id: number;
  friend_name: string;
  amount: number;
  due_date: string;
  is_repaid: boolean;
  repaid_at: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  pendingAmount: number;
  totalCount: number;
  repaidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export class LoanService {
  /**
   * Add a new loan entry
   */
  static async createLoan(
    userId: number,
    data: {
      friendName: string;
      amount: number;
      dueDate: string;
      notes?: string | null;
      receiptUrl?: string | null;
    }
  ): Promise<Loan> {
    const res = await query<Loan>(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, notes, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        data.friendName.trim(),
        data.amount,
        data.dueDate,
        data.notes || null,
        data.receiptUrl || null,
      ]
    );

    const loan = res.rows[0];
    return this.enrichLoan(loan);
  }

  /**
   * Mark a loan as repaid or toggle status
   */
  static async setRepaidStatus(userId: number, loanId: number, isRepaid: boolean): Promise<Loan> {
    const repaidAt = isRepaid ? new Date() : null;

    const res = await query<Loan>(
      `UPDATE loans
       SET is_repaid = $1, repaid_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [isRepaid, repaidAt, loanId, userId]
    );

    if (res.rows.length === 0) {
      throw new Error('Loan entry not found or you do not have permission to modify it.');
    }

    return this.enrichLoan(res.rows[0]);
  }

  /**
   * Get all loans for a user with optional filtering
   */
  static async getLoans(
    userId: number,
    filter?: 'all' | 'pending' | 'repaid' | 'overdue',
    search?: string
  ): Promise<Loan[]> {
    let sql = `SELECT * FROM loans WHERE user_id = $1`;
    const params: any[] = [userId];

    if (search && search.trim().length > 0) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND LOWER(friend_name) LIKE $${params.length}`;
    }

    sql += ` ORDER BY due_date ASC, created_at DESC`;

    const res = await query<Loan>(sql, params);
    const enriched = res.rows.map((loan) => this.enrichLoan(loan));

    if (filter === 'repaid') {
      return enriched.filter((l) => l.is_repaid);
    }
    if (filter === 'pending') {
      return enriched.filter((l) => !l.is_repaid);
    }
    if (filter === 'overdue') {
      return enriched.filter((l) => l.is_overdue);
    }

    return enriched;
  }

  /**
   * Get loan summary: total lent, total repaid, overdue amount
   */
  static async getSummary(userId: number): Promise<LoanSummary> {
    const res = await query<Loan>(`SELECT * FROM loans WHERE user_id = $1`, [userId]);
    const loans = res.rows.map((loan) => this.enrichLoan(loan));

    let totalLent = 0;
    let totalRepaid = 0;
    let overdueAmount = 0;
    let pendingAmount = 0;
    let repaidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    for (const loan of loans) {
      const amount = Number(loan.amount) || 0;
      totalLent += amount;

      if (loan.is_repaid) {
        totalRepaid += amount;
        repaidCount++;
      } else {
        pendingAmount += amount;
        pendingCount++;

        if (loan.is_overdue) {
          overdueAmount += amount;
          overdueCount++;
        }
      }
    }

    return {
      totalLent: Math.round(totalLent * 100) / 100,
      totalRepaid: Math.round(totalRepaid * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      totalCount: loans.length,
      repaidCount,
      pendingCount,
      overdueCount,
    };
  }

  /**
   * Delete a loan entry
   */
  static async deleteLoan(userId: number, loanId: number): Promise<boolean> {
    const res = await query(`DELETE FROM loans WHERE id = $1 AND user_id = $2`, [loanId, userId]);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Helper to add is_overdue flag based on current date
   */
  private static enrichLoan(loan: Loan): Loan {
    // Normalizing due_date
    const rawDate = loan.due_date as any;
    const dueDateStr = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate).slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);

    const is_overdue = !loan.is_repaid && dueDateStr < todayStr;

    return {
      ...loan,
      amount: Number(loan.amount),
      due_date: dueDateStr,
      is_overdue,
    };
  }
}
