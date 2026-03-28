"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastTools = void 0;
class BroadcastTools {
    constructor() {
        this.listeners = new Map();
        this.messageLog = [];
        this.setupBroadcastListeners();
    }
    getTools() {
        return [
            {
                name: 'broadcast',
                description: 'Broadcast message operations. Use action parameter: get_log (get recent messages), listen (start listening), stop_listening (stop listening), clear_log (clear log), get_listeners (get active listeners)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Operation type',
                            enum: ['get_log', 'listen', 'stop_listening', 'clear_log', 'get_listeners']
                        },
                        limit: { type: 'number', description: '[get_log] Number of recent messages', default: 50 },
                        messageType: { type: 'string', description: '[get_log/listen/stop_listening] Message type filter' }
                    },
                    required: ['action']
                }
            }
        ];
    }
    async execute(toolName, args) {
        const action = args.action;
        switch (action) {
            case 'get_log':
                return await this.getBroadcastLog(args.limit, args.messageType);
            case 'listen':
                return await this.listenBroadcast(args.messageType);
            case 'stop_listening':
                return await this.stopListening(args.messageType);
            case 'clear_log':
                return await this.clearBroadcastLog();
            case 'get_listeners':
                return await this.getActiveListeners();
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    setupBroadcastListeners() {
        const importantMessages = [
            'build-worker:ready', 'build-worker:closed',
            'scene:ready', 'scene:close',
            'asset-db:ready', 'asset-db:close',
            'asset-db:asset-add', 'asset-db:asset-change', 'asset-db:asset-delete'
        ];
        importantMessages.forEach(messageType => {
            this.addBroadcastListener(messageType);
        });
    }
    addBroadcastListener(messageType) {
        const listener = (data) => {
            this.messageLog.push({ message: messageType, data: data, timestamp: Date.now() });
            if (this.messageLog.length > 1000) {
                this.messageLog = this.messageLog.slice(-500);
            }
            console.log(`[Broadcast] ${messageType}:`, data);
        };
        if (!this.listeners.has(messageType)) {
            this.listeners.set(messageType, []);
        }
        this.listeners.get(messageType).push(listener);
        console.log(`[BroadcastTools] Added listener for ${messageType} (simulated)`);
    }
    removeBroadcastListener(messageType) {
        const listeners = this.listeners.get(messageType);
        if (listeners) {
            listeners.forEach(listener => {
                console.log(`[BroadcastTools] Removed listener for ${messageType} (simulated)`);
            });
            this.listeners.delete(messageType);
        }
    }
    async getBroadcastLog(limit = 50, messageType) {
        return new Promise((resolve) => {
            let filteredLog = this.messageLog;
            if (messageType) {
                filteredLog = this.messageLog.filter(entry => entry.message === messageType);
            }
            const recentLog = filteredLog.slice(-limit).map(entry => (Object.assign(Object.assign({}, entry), { timestamp: new Date(entry.timestamp).toISOString() })));
            resolve({
                success: true,
                data: {
                    log: recentLog,
                    count: recentLog.length,
                    totalCount: filteredLog.length,
                    filter: messageType || 'all',
                    message: 'Broadcast log retrieved successfully'
                }
            });
        });
    }
    async listenBroadcast(messageType) {
        return new Promise((resolve) => {
            try {
                if (!this.listeners.has(messageType)) {
                    this.addBroadcastListener(messageType);
                    resolve({
                        success: true,
                        data: {
                            messageType: messageType,
                            message: `Started listening for broadcast: ${messageType}`
                        }
                    });
                }
                else {
                    resolve({
                        success: true,
                        data: {
                            messageType: messageType,
                            message: `Already listening for broadcast: ${messageType}`
                        }
                    });
                }
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async stopListening(messageType) {
        return new Promise((resolve) => {
            try {
                if (this.listeners.has(messageType)) {
                    this.removeBroadcastListener(messageType);
                    resolve({
                        success: true,
                        data: {
                            messageType: messageType,
                            message: `Stopped listening for broadcast: ${messageType}`
                        }
                    });
                }
                else {
                    resolve({
                        success: true,
                        data: {
                            messageType: messageType,
                            message: `Was not listening for broadcast: ${messageType}`
                        }
                    });
                }
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async clearBroadcastLog() {
        return new Promise((resolve) => {
            const previousCount = this.messageLog.length;
            this.messageLog = [];
            resolve({
                success: true,
                data: {
                    clearedCount: previousCount,
                    message: 'Broadcast log cleared successfully'
                }
            });
        });
    }
    async getActiveListeners() {
        return new Promise((resolve) => {
            const activeListeners = Array.from(this.listeners.keys()).map(messageType => {
                var _a;
                return ({
                    messageType: messageType,
                    listenerCount: ((_a = this.listeners.get(messageType)) === null || _a === void 0 ? void 0 : _a.length) || 0
                });
            });
            resolve({
                success: true,
                data: {
                    listeners: activeListeners,
                    count: activeListeners.length,
                    message: 'Active listeners retrieved successfully'
                }
            });
        });
    }
}
exports.BroadcastTools = BroadcastTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvYWRjYXN0LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2Jyb2FkY2FzdC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxNQUFhLGNBQWM7SUFJdkI7UUFIUSxjQUFTLEdBQTRCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDL0MsZUFBVSxHQUE2RCxFQUFFLENBQUM7UUFHOUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVELFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFdBQVcsRUFBRSwyTUFBMk07Z0JBQ3hOLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsTUFBTSxFQUFFOzRCQUNKLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxnQkFBZ0I7NEJBQzdCLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLGVBQWUsQ0FBQzt5QkFDOUU7d0JBQ0QsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUscUNBQXFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTt3QkFDMUYsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUscURBQXFELEVBQUU7cUJBQ3RHO29CQUNELFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQztpQkFDdkI7YUFDSjtTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLElBQVM7UUFDckMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMzQixRQUFRLE1BQU0sRUFBRSxDQUFDO1lBQ2IsS0FBSyxTQUFTO2dCQUNWLE9BQU8sTUFBTSxJQUFJLENBQUMsZUFBZSxD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d0NBb01DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgQnJvYWRjYXN0VG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgbGlzdGVuZXJzOiBNYXA8c3RyaW5nLCBGdW5jdGlvbltdPiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIG1lc3NhZ2VMb2c6IEFycmF5PHsgbWVzc2FnZTogc3RyaW5nOyBkYXRhOiBhbnk7IHRpbWVzdGFtcDogbnVtYmVyIH0+ID0gW107XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5zZXR1cEJyb2FkY2FzdExpc3RlbmVycygpO1xuICAgIH1cblxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdicm9hZGNhc3QnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnJvYWRjYXN0IG1lc3NhZ2Ugb3BlcmF0aW9ucy4gVXNlIGFjdGlvbiBwYXJhbWV0ZXI6IGdldF9sb2cgKGdldCByZWNlbnQgbWVzc2FnZXMpLCBsaXN0ZW4gKHN0YXJ0IGxpc3RlbmluZyksIHN0b3BfbGlzdGVuaW5nIChzdG9wIGxpc3RlbmluZyksIGNsZWFyX2xvZyAoY2xlYXIgbG9nKSwgZ2V0X2xpc3RlbmVycyAoZ2V0IGFjdGl2ZSBsaXN0ZW5lcnMpJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcGVyYXRpb24gdHlwZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydnZXRfbG9nJywgJ2xpc3RlbicsICdzdG9wX2xpc3RlbmluZycsICdjbGVhcl9sb2cnLCAnZ2V0X2xpc3RlbmVycyddXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGltaXQ6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnW2dldF9sb2ddIE51bWJlciBvZiByZWNlbnQgbWVzc2FnZXMnLCBkZWZhdWx0OiA1MCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZVR5cGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnW2dldF9sb2cvbGlzdGVuL3N0b3BfbGlzdGVuaW5nXSBNZXNzYWdlIHR5cGUgZmlsdGVyJyB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgYWN0aW9uID0gYXJncy5hY3Rpb247XG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdnZXRfbG9nJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRCcm9hZGNhc3RMb2coYXJncy5saW1pdCwgYXJncy5tZXNzYWdlVHlwZSk7XG4gICAgICAgICAgICBjYXNlICdsaXN0ZW4nOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmxpc3RlbkJyb2FkY2FzdChhcmdzLm1lc3NhZ2VUeXBlKTtcbiAgICAgICAgICAgIGNhc2UgJ3N0b3BfbGlzdGVuaW5nJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zdG9wTGlzdGVuaW5nKGFyZ3MubWVzc2FnZVR5cGUpO1xuICAgICAgICAgICAgY2FzZSAnY2xlYXJfbG9nJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jbGVhckJyb2FkY2FzdExvZygpO1xuICAgICAgICAgICAgY2FzZSAnZ2V0X2xpc3RlbmVycyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QWN0aXZlTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhY3Rpb246ICR7YWN0aW9ufWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXR1cEJyb2FkY2FzdExpc3RlbmVycygpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaW1wb3J0YW50TWVzc2FnZXMgPSBbXG4gICAgICAgICAgICAnYnVpbGQtd29ya2VyOnJlYWR5JywgJ2J1aWxkLXdvcmtlcjpjbG9zZWQnLFxuICAgICAgICAgICAgJ3NjZW5lOnJlYWR5JywgJ3NjZW5lOmNsb3NlJyxcbiAgICAgICAgICAgICdhc3NldC1kYjpyZWFkeScsICdhc3NldC1kYjpjbG9zZScsXG4gICAgICAgICAgICAnYXNzZXQtZGI6YXNzZXQtYWRkJywgJ2Fzc2V0LWRiOmFzc2V0LWNoYW5nZScsICdhc3NldC1kYjphc3NldC1kZWxldGUnXG4gICAgICAgIF07XG4gICAgICAgIGltcG9ydGFudE1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZVR5cGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5hZGRCcm9hZGNhc3RMaXN0ZW5lcihtZXNzYWdlVHlwZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkQnJvYWRjYXN0TGlzdGVuZXIobWVzc2FnZVR5cGU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZUxvZy5wdXNoKHsgbWVzc2FnZTogbWVzc2FnZVR5cGUsIGRhdGE6IGRhdGEsIHRpbWVzdGFtcDogRGF0ZS5ub3coKSB9KTtcbiAgICAgICAgICAgIGlmICh0aGlzLm1lc3NhZ2VMb2cubGVuZ3RoID4gMTAwMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZUxvZyA9IHRoaXMubWVzc2FnZUxvZy5zbGljZSgtNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQnJvYWRjYXN0XSAke21lc3NhZ2VUeXBlfTpgLCBkYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMobWVzc2FnZVR5cGUpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQobWVzc2FnZVR5cGUsIFtdKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RlbmVycy5nZXQobWVzc2FnZVR5cGUpIS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgY29uc29sZS5sb2coYFtCcm9hZGNhc3RUb29sc10gQWRkZWQgbGlzdGVuZXIgZm9yICR7bWVzc2FnZVR5cGV9IChzaW11bGF0ZWQpYCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW1vdmVCcm9hZGNhc3RMaXN0ZW5lcihtZXNzYWdlVHlwZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzLmdldChtZXNzYWdlVHlwZSk7XG4gICAgICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0Jyb2FkY2FzdFRvb2xzXSBSZW1vdmVkIGxpc3RlbmVyIGZvciAke21lc3NhZ2VUeXBlfSAoc2ltdWxhdGVkKWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUobWVzc2FnZVR5cGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRCcm9hZGNhc3RMb2cobGltaXQ6IG51bWJlciA9IDUwLCBtZXNzYWdlVHlwZT86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGZpbHRlcmVkTG9nID0gdGhpcy5tZXNzYWdlTG9nO1xuXG4gICAgICAgICAgICBpZiAobWVzc2FnZVR5cGUpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExvZyA9IHRoaXMubWVzc2FnZUxvZy5maWx0ZXIoZW50cnkgPT4gZW50cnkubWVzc2FnZSA9PT0gbWVzc2FnZVR5cGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZWNlbnRMb2cgPSBmaWx0ZXJlZExvZy5zbGljZSgtbGltaXQpLm1hcChlbnRyeSA9PiAoe1xuICAgICAgICAgICAgICAgIC4uLmVudHJ5LFxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoZW50cnkudGltZXN0YW1wKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBsb2c6IHJlY2VudExvZyxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IHJlY2VudExvZy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsQ291bnQ6IGZpbHRlcmVkTG9nLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBtZXNzYWdlVHlwZSB8fCAnYWxsJyxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0Jyb2FkY2FzdCBsb2cgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBsaXN0ZW5Ccm9hZGNhc3QobWVzc2FnZVR5cGU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGlzdGVuZXJzLmhhcyhtZXNzYWdlVHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCcm9hZGNhc3RMaXN0ZW5lcihtZXNzYWdlVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlVHlwZTogbWVzc2FnZVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFN0YXJ0ZWQgbGlzdGVuaW5nIGZvciBicm9hZGNhc3Q6ICR7bWVzc2FnZVR5cGV9YFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZVR5cGU6IG1lc3NhZ2VUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBBbHJlYWR5IGxpc3RlbmluZyBmb3IgYnJvYWRjYXN0OiAke21lc3NhZ2VUeXBlfWBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzdG9wTGlzdGVuaW5nKG1lc3NhZ2VUeXBlOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGlzdGVuZXJzLmhhcyhtZXNzYWdlVHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVCcm9hZGNhc3RMaXN0ZW5lcihtZXNzYWdlVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlVHlwZTogbWVzc2FnZVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFN0b3BwZWQgbGlzdGVuaW5nIGZvciBicm9hZGNhc3Q6ICR7bWVzc2FnZVR5cGV9YFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZVR5cGU6IG1lc3NhZ2VUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBXYXMgbm90IGxpc3RlbmluZyBmb3IgYnJvYWRjYXN0OiAke21lc3NhZ2VUeXBlfWBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjbGVhckJyb2FkY2FzdExvZygpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzQ291bnQgPSB0aGlzLm1lc3NhZ2VMb2cubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlTG9nID0gW107XG4gICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJlZENvdW50OiBwcmV2aW91c0NvdW50LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnQnJvYWRjYXN0IGxvZyBjbGVhcmVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBY3RpdmVMaXN0ZW5lcnMoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVMaXN0ZW5lcnMgPSBBcnJheS5mcm9tKHRoaXMubGlzdGVuZXJzLmtleXMoKSkubWFwKG1lc3NhZ2VUeXBlID0+ICh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZVR5cGU6IG1lc3NhZ2VUeXBlLFxuICAgICAgICAgICAgICAgIGxpc3RlbmVyQ291bnQ6IHRoaXMubGlzdGVuZXJzLmdldChtZXNzYWdlVHlwZSk/Lmxlbmd0aCB8fCAwXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnM6IGFjdGl2ZUxpc3RlbmVycyxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IGFjdGl2ZUxpc3RlbmVycy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBY3RpdmUgbGlzdGVuZXJzIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=