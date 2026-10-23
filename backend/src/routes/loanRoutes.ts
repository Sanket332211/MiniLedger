import { Router } from 'express';
import { LoanController } from '../controllers/loanController';
import { UploadController, uploadMiddleware } from '../controllers/uploadController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

// Protect all loan routes with JWT authentication
router.use(authenticateJwt);

// Summary endpoint: total lent, total repaid, overdue amount
router.get('/summary', LoanController.getSummary);

// Loan entry CRUD
router.post('/', LoanController.createLoan);
router.get('/', LoanController.getLoans);
router.patch('/:id/repay', LoanController.markRepaid);
router.put('/:id/status', LoanController.updateStatus);
router.delete('/:id', LoanController.deleteLoan);

// Bonus: Photo of receipt upload
router.post('/upload-receipt', uploadMiddleware.single('receipt'), UploadController.uploadReceipt);

export default router;
