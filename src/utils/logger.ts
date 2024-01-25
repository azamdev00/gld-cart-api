import * as winston from "winston";
import {format} from "winston";
import winstonDailyRotateFile from "winston-daily-rotate-file";
import {injectable} from "inversify";

export type LogMessage = string;

export type LogContext = object;

export enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}

export interface ILogger {
    logInfo(msg: LogMessage, context?: LogContext): void;

    logWarn(msg: LogMessage, context?: LogContext): void;

    logError(msg: LogMessage, context?: LogContext): void;

    logDebug(msg: LogMessage, context?: LogContext): void;
}

@injectable()
export class Logger implements ILogger {
    private logger: winston.Logger;
    private readonly _appName = "GLD Cart";

    constructor() {
        this.logger = this._initializeWinston();
    }

    public async logInfo(msg: LogMessage, context?: LogContext) {
        await this._log(msg, LogLevel.INFO, context);
    }

    public async logWarn(msg: LogMessage, context?: LogContext) {
        await this._log(msg, LogLevel.WARN, context);
    }

    public async logError(msg: LogMessage, context?: LogContext) {
        await this._log(msg, LogLevel.ERROR, context);
    }

    public async logDebug(msg: LogMessage, context?: LogContext) {
        if (process.env.NODE_ENV !== "production") {
            await this._log(msg, LogLevel.DEBUG, context);
        }
    }

    private async _log(msg: LogMessage, level: LogLevel, context?: LogContext) {
        this.logger.log(level, msg, {context: context});
    }

    private _initializeWinston() {
        return winston.createLogger({
            transports: this._getTransports(),
        });
    }

    private _getTransports() {
        const transports: Array<any> = [
            new winston.transports.Console({
                format: this._getFormatForConsole(),
            }),
        ];

        if (process.env.NODE_ENV === "production") {
            transports.push(this._getFileTransport());
        }

        return transports;
    }

    private _getFormatForConsole() {
        return format.combine(
            format.timestamp(),
            format.printf(
                (info) =>
                    `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message
                    } [CONTEXT] -> ${info.context ? "\n" + JSON.stringify(info.context, this._getCircularReplacer, 2) : "{}"
                    }`,
            ),
            format.colorize({all: true}),
        );
    }

    private _getFileTransport() {
        return new winstonDailyRotateFile({
            filename: `${this._appName}-%DATE%.log`,
            zippedArchive: true,
            maxSize: "10m", // Rotate after 10MB
            maxFiles: "14d", // Only keep last 14 days
            format: format.combine(
                format.timestamp(),
                format((info) => {
                    console.log(info);
                    info.app = this._appName;
                    return info;
                })(),
                format.json(),
            ),
        });
    }

    private _getCircularReplacer() {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular Reference]';
                }
                seen.add(value);
            }
            return value;
        };
    }
}