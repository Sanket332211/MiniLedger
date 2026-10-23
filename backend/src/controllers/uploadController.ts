import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, `receipt-${uniqueSuffix}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed.'));
    }
  },
});

export class UploadController {
  static uploadReceipt(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No image file uploaded.' });
        return;
      }

      // Return URL path reachable via backend static file serving
      const receiptUrl = `/uploads/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: 'Receipt photo uploaded successfully.',
        data: {
          filename: req.file.filename,
          receiptUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
