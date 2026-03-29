import { ToolDefinition } from './types';

interface MCPAdapterContext {
    getAvailableTools(): ToolDefinition[];
    executeToolCall(toolName: string, args: any): Promise<any>;
}

interface MCPHttpResponse {
    statusCode: number;
    body?: unknown;
    headers?: Record<string, string>;
}

interface JSONRPCRequest {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: any;
    result?: unknown;
    error?: unknown;
}

export class MCPProtocolAdapter {
    private readonly supportedProtocolVersions = ['2025-06-18', '2025-03-26', '2024-11-05'];

    public createGetMcpResponse(): MCPHttpResponse {
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

    public async handleMessage(message: JSONRPCRequest, context: MCPAdapterContext): Promise<MCPHttpResponse> {
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

    private async handleRequest(message: JSONRPCRequest, context: MCPAdapterContext): Promise<unknown> {
        const { id, method, params } = message;

        try {
            let result: unknown;

            switch (method) {
                case 'initialize':
                    result = {
                        protocolVersion: this.negotiateProtocolVersion(params?.protocolVersion),
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
        } catch (error: any) {
            return {
                jsonrpc: '2.0',
                id: id ?? null,
                error: {
                    code: error.code ?? -32603,
                    message: error.message ?? 'Internal server error'
                }
            };
        }
    }

    private handleNotification(message: JSONRPCRequest): MCPHttpResponse {
        const method = message.method ?? '';

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

    private async handleToolCall(params: any, context: MCPAdapterContext) {
        const name = params?.name;
        if (typeof name !== 'string' || name.length === 0) {
            throw {
                code: -32602,
                message: 'tools/call 缺少 name'
            };
        }

        const args = params?.arguments ?? {};
        const toolResult = await context.executeToolCall(name, args);

        return {
            content: [{ type: 'text', text: JSON.stringify(toolResult) }]
        };
    }

    private negotiateProtocolVersion(requestedVersion?: string): string {
        if (requestedVersion && this.supportedProtocolVersions.includes(requestedVersion)) {
            return requestedVersion;
        }

        return this.supportedProtocolVersions[0];
    }

    private createMethodNotFoundError(method?: string) {
        return {
            code: -32601,
            message: `Unknown method: ${method ?? ''}`
        };
    }

    private isNotification(message: JSONRPCRequest): boolean {
        return typeof message.method === 'string' && !Object.prototype.hasOwnProperty.call(message, 'id');
    }

    private isResponse(message: JSONRPCRequest): boolean {
        return !message.method && (Object.prototype.hasOwnProperty.call(message, 'result') || Object.prototype.hasOwnProperty.call(message, 'error'));
    }
}
