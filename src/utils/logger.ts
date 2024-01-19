interface LogEntry {
    message: string;
    timestamp: string;
}

class Logger {
    static readonly STORAGE_KEY ='logs';

    async addLog(message:string): Promise<void> {
        if (typeof message !== 'string' || !message.trim()) {
            throw new Error('Log message must be a non-empty string');
        }

        const logEntry:LogEntry = { message, timestamp: new Date().toISOString() };
        try {
            const logs = await this._getStoredLogs();
            logs.push(logEntry);
            await this._storeLogs(logs);
            console.log('Log saved.');
        } catch (error) {
            console.error('Error saving log:', error);
        }
    }

    async getLogs(): Promise<LogEntry[]> {
        try {
            return await this._getStoredLogs();
        } catch (error) {
            console.error('Error retrieving logs:', error);
            return [];
        }
    }

    async displayLogs(): Promise<void> {
        try {
            const logs = await this.getLogs();
            logs.forEach(log => console.log(`${log.timestamp}: ${log.message}`));
        } catch (error) {
            console.error('Error displaying logs:', error);
        }
    }

    private async _getStoredLogs(): Promise<LogEntry[]> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(Logger.STORAGE_KEY, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result[Logger.STORAGE_KEY] || []);
                }
            });
        });
    }

    private async _storeLogs(logs: LogEntry[]): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [Logger.STORAGE_KEY]: logs }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }
}
