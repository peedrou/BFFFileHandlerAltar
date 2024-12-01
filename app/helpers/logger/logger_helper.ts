import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const logFolderPath = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logFolderPath)) {
  fs.mkdirSync(logFolderPath);
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json(),
  ),
  transports: [
    new transports.Console({
      level: 'error',
      format: format.simple(),
    }),
    new transports.File({
      filename: path.join(logFolderPath, 'all_logs.log'),
      level: 'info',
    }),
  ],
});

export default logger;
