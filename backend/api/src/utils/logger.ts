import winston from "winston";
import { config } from "../config/config";

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  printf(({ level, message, timestamp, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${rest}`;
  })
);

export const logger = winston.createLogger({
  level: config.isProd ? "info" : "debug",
  format: config.isProd ? combine(timestamp(), json()) : devFormat,
  transports: [new winston.transports.Console()],
});
