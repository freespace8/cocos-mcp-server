"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPProtocolAdapter = void 0;
class MCPProtocolAdapter {
    constructor() {
        this.supportedProtocolVersions = ['2025-06-18', '2025-03-26', '2024-11-05'];
    }
    createGetMcpResponse() {
        return {
            statusCode: 405,
            headers: {
                Allow: 'POST, OPTIONS'
            },
            body: {
                error: 'This MCP endpoint only supports POST requests. SSE stream is not enabled.'
            }
        };
    }
    async handleMessage(message, context) {
        if (this.isNotification(message)) {
            return this.handleNotification(message);
        }
        if (this.isResponse(message)) {
            return {
                statusCode: 202
            };
        }
        return {
            statusCode: 200,
            body: await this.handleRequest(message, context)
        };
    }
    async handleRequest(message, context) {
        var _a, _b;
        const { id, method, params } = message;
        try {
            let result;
            switch (method) {
                case 'initialize':
                    result = {
                        protocolVersion: this.negotiateProtocolVersion(params === null || params === void 0 ? void 0 : params.protocolVersion),
                        capabilities: {
                            tools: {},
                            resources: {},
                            prompts: {}
                        },
                        serverInfo: {
                            name: 'cocos-mcp-server',
                            version: '1.4.0'
                        }
                    };
                    break;
                case 'ping':
                    result = {};
                    break;
                case 'tools/list':
                    result = { tools: context.getAvailableTools() };
                    break;
                case 'tools/call':
                    result = await this.handleToolCall(params, context);
                    break;
                case 'resources/list':
                    result = { resources: [] };
                    break;
                case 'resources/templates/list':
                    result = { resourceTemplates: [] };
                    break;
                case 'prompts/list':
                    result = { prompts: [] };
                    break;
                default:
                    throw this.createMethodNotFoundError(method);
            }
            return {
                jsonrpc: '2.0',
                id,
                result
            };
        }
        catch (error) {
            return {
                jsonrpc: '2.0',
                id: id !== null && id !== void 0 ? id : null,
                error: {
                    code: (_a = error.code) !== null && _a !== void 0 ? _a : -32603,
                    message: (_b = error.message) !== null && _b !== void 0 ? _b : 'Internal server error'
                }
            };
        }
    }
    handleNotification(message) {
        var _a;
        const method = (_a = message.method) !== null && _a !== void 0 ? _a : '';
        switch (method) {
            case 'notifications/initialized':
            case 'notifications/cancelled':
                return {
                    statusCode: 202
                };
            default:
                return {
                    statusCode: 202
                };
        }
    }
    async handleToolCall(params, context) {
        var _a;
        const name = params === null || params === void 0 ? void 0 : params.name;
        if (typeof name !== 'string' || name.length === 0) {
            throw {
                code: -32602,
                message: 'tools/call 缺少 name'
            };
        }
        const args = (_a = params === null || params === void 0 ? void 0 : params.arguments) !== null && _a !== void 0 ? _a : {};
        const toolResult = await context.executeToolCall(name, args);
        return {
            content: [{ type: 'text', text: JSON.stringify(toolResult) }]
        };
    }
    negotiateProtocolVersion(requestedVersion) {
        if (requestedVersion && this.supportedProtocolVersions.includes(requestedVersion)) {
            return requestedVersion;
        }
        return this.supportedProtocolVersions[0];
    }
    createMethodNotFoundError(method) {
        return {
            code: -32601,
            message: `Unknown method: ${method !== null && method !== void 0 ? method : ''}`
        };
    }
    isNotification(message) {
        return typeof message.method === 'string' && !Object.prototype.hasOwnProperty.call(message, 'id');
    }
    isResponse(message) {
        return !message.method && (Object.prototype.hasOwnProperty.call(message, 'result') || Object.prototype.hasOwnProperty.call(message, 'error'));
    }
}
exports.MCPProtocolAdapter = MCPProtocolAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXByb3RvY29sLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvbWNwLXByb3RvY29sLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBc0JBLE1BQWEsa0JBQWtCO0lBQS9CO1FBQ3FCLDhCQUF5QixHQUFHLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztJQWtKNUYsQ0FBQztJQWhKVSxvQkFBb0I7UUFDdkIsT0FBTztZQUNILFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFO2dCQUNMLEtBQUssRUFBRSxlQUFlO2FBQ3pCO1lBQ0QsSUFBSSxFQUFFO2dCQUNGLEtBQUssRUFBRSwyRUFBMkU7YUFDckY7U0FDSixDQUFDO0lBQ04sQ0FBQztJQUVNLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBdUIsRUFBRSxPQUEwQjtRQUMxRSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMvQixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDM0IsT0FBTztnQkFDSCxVQUFVLEVBQUUsR0FBRzthQUNsQixDQUFDO1FBQ04sQ0FBQztRQUVELE9BQU87WUFDSCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztTQUNuRCxDQUFDO0lBQ04sQ0FBQztJQUVPLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBdUIsRUFBRSxPQUEwQjs7UUFDM0UsTUFBTSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDO1FBRXZDLElBQUksQ0FBQztZQUNELElBQUksTUFBZSxDQUFDO1lBRXBCLFFBQVEsTUFB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bERlZmluaXRpb24gfSBmcm9tICcuL3R5cGVzJztcblxuaW50ZXJmYWNlIE1DUEFkYXB0ZXJDb250ZXh0IHtcbiAgICBnZXRBdmFpbGFibGVUb29scygpOiBUb29sRGVmaW5pdGlvbltdO1xuICAgIGV4ZWN1dGVUb29sQ2FsbCh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPGFueT47XG59XG5cbmludGVyZmFjZSBNQ1BIdHRwUmVzcG9uc2Uge1xuICAgIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgICBib2R5PzogdW5rbm93bjtcbiAgICBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuaW50ZXJmYWNlIEpTT05SUENSZXF1ZXN0IHtcbiAgICBqc29ucnBjPzogc3RyaW5nO1xuICAgIGlkPzogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbDtcbiAgICBtZXRob2Q/OiBzdHJpbmc7XG4gICAgcGFyYW1zPzogYW55O1xuICAgIHJlc3VsdD86IHVua25vd247XG4gICAgZXJyb3I/OiB1bmtub3duO1xufVxuXG5leHBvcnQgY2xhc3MgTUNQUHJvdG9jb2xBZGFwdGVyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHN1cHBvcnRlZFByb3RvY29sVmVyc2lvbnMgPSBbJzIwMjUtMDYtMTgnLCAnMjAyNS0wMy0yNicsICcyMDI0LTExLTA1J107XG5cbiAgICBwdWJsaWMgY3JlYXRlR2V0TWNwUmVzcG9uc2UoKTogTUNQSHR0cFJlc3BvbnNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBBbGxvdzogJ1BPU1QsIE9QVElPTlMnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICAgIGVycm9yOiAnVGhpcyBNQ1AgZW5kcG9pbnQgb25seSBzdXBwb3J0cyBQT1NUIHJlcXVlc3RzLiBTU0Ugc3RyZWFtIGlzIG5vdCBlbmFibGVkLidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgaGFuZGxlTWVzc2FnZShtZXNzYWdlOiBKU09OUlBDUmVxdWVzdCwgY29udGV4dDogTUNQQWRhcHRlckNvbnRleHQpOiBQcm9taXNlPE1DUEh0dHBSZXNwb25zZT4ge1xuICAgICAgICBpZiAodGhpcy5pc05vdGlmaWNhdGlvbihtZXNzYWdlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlTm90aWZpY2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaXNSZXNwb25zZShtZXNzYWdlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgICAgYm9keTogYXdhaXQgdGhpcy5oYW5kbGVSZXF1ZXN0KG1lc3NhZ2UsIGNvbnRleHQpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVSZXF1ZXN0KG1lc3NhZ2U6IEpTT05SUENSZXF1ZXN0LCBjb250ZXh0OiBNQ1BBZGFwdGVyQ29udGV4dCk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgICAgICBjb25zdCB7IGlkLCBtZXRob2QsIHBhcmFtcyB9ID0gbWVzc2FnZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHJlc3VsdDogdW5rbm93bjtcblxuICAgICAgICAgICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdpbml0aWFsaXplJzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2xWZXJzaW9uOiB0aGlzLm5lZ290aWF0ZVByb3RvY29sVmVyc2lvbihwYXJhbXM/LnByb3RvY29sVmVyc2lvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b29sczoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9tcHRzOiB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckluZm86IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29jb3MtbWNwLXNlcnZlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogJzEuNC4wJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdwaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Rvb2xzL2xpc3QnOlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB7IHRvb2xzOiBjb250ZXh0LmdldEF2YWlsYWJsZVRvb2xzKCkgfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAndG9vbHMvY2FsbCc6XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuaGFuZGxlVG9vbENhbGwocGFyYW1zLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncmVzb3VyY2VzL2xpc3QnOlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB7IHJlc291cmNlczogW10gfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncmVzb3VyY2VzL3RlbXBsYXRlcy9saXN0JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geyByZXNvdXJjZVRlbXBsYXRlczogW10gfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncHJvbXB0cy9saXN0JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geyBwcm9tcHRzOiBbXSB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZU1ldGhvZE5vdEZvdW5kRXJyb3IobWV0aG9kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBqc29ucnBjOiAnMi4wJyxcbiAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICByZXN1bHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgICAgICAgICAgaWQ6IGlkID8/IG51bGwsXG4gICAgICAgICAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogZXJyb3IuY29kZSA/PyAtMzI2MDMsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgPz8gJ0ludGVybmFsIHNlcnZlciBlcnJvcidcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVOb3RpZmljYXRpb24obWVzc2FnZTogSlNPTlJQQ1JlcXVlc3QpOiBNQ1BIdHRwUmVzcG9uc2Uge1xuICAgICAgICBjb25zdCBtZXRob2QgPSBtZXNzYWdlLm1ldGhvZCA/PyAnJztcblxuICAgICAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgICAgICAgY2FzZSAnbm90aWZpY2F0aW9ucy9pbml0aWFsaXplZCc6XG4gICAgICAgICAgICBjYXNlICdub3RpZmljYXRpb25zL2NhbmNlbGxlZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAyXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAyXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlVG9vbENhbGwocGFyYW1zOiBhbnksIGNvbnRleHQ6IE1DUEFkYXB0ZXJDb250ZXh0KSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBwYXJhbXM/Lm5hbWU7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgfHwgbmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IHtcbiAgICAgICAgICAgICAgICBjb2RlOiAtMzI2MDIsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3Rvb2xzL2NhbGwg57y65bCRIG5hbWUnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXJncyA9IHBhcmFtcz8uYXJndW1lbnRzID8/IHt9O1xuICAgICAgICBjb25zdCB0b29sUmVzdWx0ID0gYXdhaXQgY29udGV4dC5leGVjdXRlVG9vbENhbGwobmFtZSwgYXJncyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IFt7IHR5cGU6ICd0ZXh0JywgdGV4dDogSlNPTi5zdHJpbmdpZnkodG9vbFJlc3VsdCkgfV1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG5lZ290aWF0ZVByb3RvY29sVmVyc2lvbihyZXF1ZXN0ZWRWZXJzaW9uPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHJlcXVlc3RlZFZlcnNpb24gJiYgdGhpcy5zdXBwb3J0ZWRQcm90b2NvbFZlcnNpb25zLmluY2x1ZGVzKHJlcXVlc3RlZFZlcnNpb24pKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdGVkVmVyc2lvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnN1cHBvcnRlZFByb3RvY29sVmVyc2lvbnNbMF07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVNZXRob2ROb3RGb3VuZEVycm9yKG1ldGhvZD86IHN0cmluZykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogLTMyNjAxLFxuICAgICAgICAgICAgbWVzc2FnZTogYFVua25vd24gbWV0aG9kOiAke21ldGhvZCA/PyAnJ31gXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc05vdGlmaWNhdGlvbihtZXNzYWdlOiBKU09OUlBDUmVxdWVzdCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG1lc3NhZ2UubWV0aG9kID09PSAnc3RyaW5nJyAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lc3NhZ2UsICdpZCcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNSZXNwb25zZShtZXNzYWdlOiBKU09OUlBDUmVxdWVzdCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gIW1lc3NhZ2UubWV0aG9kICYmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZSwgJ3Jlc3VsdCcpIHx8IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlLCAnZXJyb3InKSk7XG4gICAgfVxufVxuIl19