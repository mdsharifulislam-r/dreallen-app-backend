import colors from 'colors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app';
import config, { validateSpacesConfig } from './config';
import { seedSuperAdmin } from './DB/seedAdmin';
import { socketHelper } from './helpers/socketHelper';
import { errorLogger, logger } from './shared/logger';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
for (const warning of validateSpacesConfig()) {
  logger.warn(warning);
}

//uncaught exception
process.on('uncaughtException', error => {
  errorLogger.error('UnhandleException Detected', error);
  process.exit(1);
});

let server: any;

process.on('unhandledRejection', error => {
  errorLogger.error('UnhandleRejection Detected', error);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

async function main() {
  try {
    if (!config.database_url) {
      throw new Error('DATABASE_URL is not configured');
    }

    await mongoose.connect(config.database_url);
    logger.info(colors.green('🚀 Database connected successfully'));

    //Seed Super Admin after database connection is successful
    await seedSuperAdmin();

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);

    server = app.listen(port, config.ip_address as string, () => {
      logger.info(
        colors.yellow(`♻️  Application listening on port:${config.port}`)
      );
    });

    //socket
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: '*',
      },
    });
    socketHelper.socket(io);
    (global as any).io = io;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    errorLogger.error(
      colors.red(`🤢 Failed to start server: ${detail}`)
    );
    process.exit(1);
  }
}

main();

//SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM IS RECEIVE');
  if (server) {
    server.close();
  }
});
