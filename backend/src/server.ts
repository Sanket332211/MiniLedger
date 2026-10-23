import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initDb } from './config/database';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function bootstrap() {
  try {
    console.log('🚀 [MiniLedger] Initializing database and starting server...');
    await initDb();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🎉 MiniLedger Backend Server is running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📋 Auth: http://localhost:${PORT}/api/auth/send-otp`);
      console.log(`💰 Loans: http://localhost:${PORT}/api/loans`);
      console.log(`📊 Summary: http://localhost:${PORT}/api/loans/summary`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
