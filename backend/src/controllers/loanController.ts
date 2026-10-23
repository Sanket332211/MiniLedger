import { Request, Response, NextFunction } from 'express';
import { LoanService } from '../services/loanService';
import { createLoanSchema, updateLoanStatusSchema } from '../utils/validation';

export class LoanController {
  /**
   * POST /api/loans
   * Add a loan entry
   */
  static async createLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const validated = createLoanSchema.parse(req.body);

      const loan = await LoanService.createLoan(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Loan entry created successfully.',
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans
   * List all entries for current user
   */
  static async getLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const filter = req.query.filter as 'all' | 'pending' | 'repaid' | 'overdue' | undefined;
      const search = req.query.search as string | undefined;

      const loans = await LoanService.getLoans(userId, filter, search);

      res.status(200).json({
        success: true,
        count: loans.length,
        data: loans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans/summary
   * Returns: total lent, total repaid, overdue amount
   */
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await LoanService.getSummary(userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/loans/:id/repay
   * Convenient endpoint to mark as repaid
   */
  static async markRepaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const loanId = parseInt(req.params.id, 10);

      if (isNaN(loanId)) {
        res.status(400).json({ success: false, error: 'Invalid loan ID parameter.' });
        return;
      }

      const loan = await LoanService.setRepaidStatus(userId, loanId, true);

      res.status(200).json({
        success: true,
        message: 'Loan marked as repaid successfully.',
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/loans/:id/status
   * Toggle or set status (repaid: true/false)
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const loanId = parseInt(req.params.id, 10);

      if (isNaN(loanId)) {
        res.status(400).json({ success: false, error: 'Invalid loan ID parameter.' });
        return;
      }

      const validated = updateLoanStatusSchema.parse(req.body);
      const loan = await LoanService.setRepaidStatus(userId, loanId, validated.isRepaid);

      res.status(200).json({
        success: true,
        message: `Loan status updated to ${validated.isRepaid ? 'repaid' : 'pending'}.`,
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/loans/:id
   */
  static async deleteLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const loanId = parseInt(req.params.id, 10);

      if (isNaN(loanId)) {
        res.status(400).json({ success: false, error: 'Invalid loan ID parameter.' });
        return;
      }

      const success = await LoanService.deleteLoan(userId, loanId);

      if (!success) {
        res.status(404).json({ success: false, error: 'Loan entry not found or unauthorized.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Loan entry deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
