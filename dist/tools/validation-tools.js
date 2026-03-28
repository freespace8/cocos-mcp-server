"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationTools = void 0;
class ValidationTools {
    getTools() {
        return [
            {
                name: 'validation',
                description: 'JSON validation and MCP request formatting. Use action parameter: validate_json (validate/fix JSON), safe_string (create safe string), format_request (format MCP request)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Operation type',
                            enum: ['validate_json', 'safe_string', 'format_request']
                        },
                        jsonString: { type: 'string', description: '[validate_json] JSON string to validate' },
                        expectedSchema: { type: 'object', description: '[validate_json] Expected schema' },
                        value: { type: 'string', description: '[safe_string] String value to make safe' },
                        toolName: { type: 'string', description: '[format_request] Tool name' },
                        arguments: { type: 'object', description: '[format_request] Tool arguments' }
                    },
                    required: ['action']
                }
            }
        ];
    }
    async execute(toolName, args) {
        const action = args.action;
        switch (action) {
            case 'validate_json':
                return await this.validateJsonParams(args.jsonString, args.expectedSchema);
            case 'safe_string':
                return await this.createSafeStringValue(args.value);
            case 'format_request':
                return await this.formatMcpRequest(args.toolName, args.arguments);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    async validateJsonParams(jsonString, expectedSchema) {
        try {
            // First try to parse as-is
            let parsed;
            try {
                parsed = JSON.parse(jsonString);
            }
            catch (error) {
                // Try to fix common issues
                const fixed = this.fixJsonString(jsonString);
                try {
                    parsed = JSON.parse(fixed);
                }
                catch (secondError) {
                    return {
                        success: false,
                        error: `Cannot fix JSON: ${error.message}`,
                        data: {
                            originalJson: jsonString,
                            fixedAttempt: fixed,
                            suggestions: this.getJsonFixSuggestions(jsonString)
                        }
                    };
                }
            }
            // Validate against schema if provided
            if (expectedSchema) {
                const validation = this.validateAgainstSchema(parsed, expectedSchema);
                if (!validation.valid) {
                    return {
                        success: false,
                        error: 'Schema validation failed',
                        data: {
                            parsedJson: parsed,
                            validationErrors: validation.errors,
                            suggestions: validation.suggestions
                        }
                    };
                }
            }
            return {
                success: true,
                data: {
                    parsedJson: parsed,
                    fixedJson: JSON.stringify(parsed, null, 2),
                    isValid: true
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async createSafeStringValue(value) {
        const safeValue = this.escapJsonString(value);
        return {
            success: true,
            data: {
                originalValue: value,
                safeValue: safeValue,
                jsonReady: JSON.stringify(safeValue),
                usage: `Use "${safeValue}" in your JSON parameters`
            }
        };
    }
    async formatMcpRequest(toolName, toolArgs) {
        try {
            const mcpRequest = {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: toolArgs
                }
            };
            const formattedJson = JSON.stringify(mcpRequest, null, 2);
            const compactJson = JSON.stringify(mcpRequest);
            return {
                success: true,
                data: {
                    request: mcpRequest,
                    formattedJson: formattedJson,
                    compactJson: compactJson,
                    curlCommand: this.generateCurlCommand(compactJson)
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to format MCP request: ${error.message}`
            };
        }
    }
    fixJsonString(jsonStr) {
        let fixed = jsonStr;
        // Fix common escape character issues
        fixed = fixed
            // Fix unescaped quotes in string values
            .replace(/(\{[^}]*"[^"]*":\s*")([^"]*")([^"]*")([^}]*\})/g, (match, prefix, content, suffix, end) => {
            const escapedContent = content.replace(/"/g, '\\"');
            return prefix + escapedContent + suffix + end;
        })
            // Fix unescaped backslashes
            .replace(/([^\\])\\([^"\\\/bfnrtu])/g, '$1\\\\$2')
            // Fix trailing commas
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix control characters
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            // Fix single quotes to double quotes
            .replace(/'/g, '"');
        return fixed;
    }
    escapJsonString(str) {
        return str
            .replace(/\\/g, '\\\\') // Escape backslashes first
            .replace(/"/g, '\\"') // Escape quotes
            .replace(/\n/g, '\\n') // Escape newlines
            .replace(/\r/g, '\\r') // Escape carriage returns
            .replace(/\t/g, '\\t') // Escape tabs
            .replace(/\f/g, '\\f') // Escape form feeds
            .replace(/\b/g, '\\b'); // Escape backspaces
    }
    validateAgainstSchema(data, schema) {
        const errors = [];
        const suggestions = [];
        // Basic type checking
        if (schema.type) {
            const actualType = Array.isArray(data) ? 'array' : typeof data;
            if (actualType !== schema.type) {
                errors.push(`Expected type ${schema.type}, got ${actualType}`);
                suggestions.push(`Convert value to ${schema.type}`);
            }
        }
        // Required fields checking
        if (schema.required && Array.isArray(schema.required)) {
            for (const field of schema.required) {
                if (!Object.prototype.hasOwnProperty.call(data, field)) {
                    errors.push(`Missing required field: ${field}`);
                    suggestions.push(`Add required field "${field}"`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            suggestions
        };
    }
    getJsonFixSuggestions(jsonStr) {
        const suggestions = [];
        if (jsonStr.includes('\\"')) {
            suggestions.push('Check for improperly escaped quotes');
        }
        if (jsonStr.includes("'")) {
            suggestions.push('Replace single quotes with double quotes');
        }
        if (jsonStr.includes('\n') || jsonStr.includes('\t')) {
            suggestions.push('Escape newlines and tabs properly');
        }
        if (jsonStr.match(/,\s*[}\]]/)) {
            suggestions.push('Remove trailing commas');
        }
        return suggestions;
    }
    generateCurlCommand(jsonStr) {
        const escapedJson = jsonStr.replace(/'/g, "'\"'\"'");
        return `curl -X POST http://127.0.0.1:8585/mcp \\
  -H "Content-Type: application/json" \\
  -d '${escapedJson}'`;
    }
}
exports.ValidationTools = ValidationTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy92YWxpZGF0aW9uLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLE1BQWEsZUFBZTtJQUN4QixRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxZQUFZO2dCQUNsQixXQUFXLEVBQUUsNEtBQTRLO2dCQUN6TCxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsZ0JBQWdCOzRCQUM3QixJQUFJLEVBQUUsQ0FBQyxlQUFlLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDO3lCQUMzRDt3QkFDRCxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx5Q0FBeUMsRUFBRTt3QkFDdEYsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsaUNBQWlDLEVBQUU7d0JBQ2xGLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHlDQUF5QyxFQUFFO3dCQUNqRixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSw0QkFBNEIsRUFBRTt3QkFDdkUsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsaUNBQWlDLEVBQUU7cUJBQ2hGO29CQUNELFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQztpQkFDdkI7YUFDSjtTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLElBQVM7UUFDckMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMzQixRQUFRLE1BQU0sRUFBRSxDQUFDO1lBQ2Is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LENBQUMsT0FBZTtRQUN6QyxNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7UUFFakMsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDMUIsV0FBVyxDQUFDLElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN4QixXQUFXLENBQUMsSUFBSSxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUNELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbkQsV0FBVyxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUM3QixXQUFXLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELE9BQU8sV0FBVyxDQUFDO0lBQ3ZCLENBQUM7SUFFTyxtQkFBbUIsQ0FBQyxPQUFlO1FBQ3ZDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JELE9BQU87O1FBRVAsV0FBVyxHQUFHLENBQUM7SUFDbkIsQ0FBQztDQUNKO0FBdE9ELDBDQXNPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25Ub29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3ZhbGlkYXRpb24nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSlNPTiB2YWxpZGF0aW9uIGFuZCBNQ1AgcmVxdWVzdCBmb3JtYXR0aW5nLiBVc2UgYWN0aW9uIHBhcmFtZXRlcjogdmFsaWRhdGVfanNvbiAodmFsaWRhdGUvZml4IEpTT04pLCBzYWZlX3N0cmluZyAoY3JlYXRlIHNhZmUgc3RyaW5nKSwgZm9ybWF0X3JlcXVlc3QgKGZvcm1hdCBNQ1AgcmVxdWVzdCknLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wZXJhdGlvbiB0eXBlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ3ZhbGlkYXRlX2pzb24nLCAnc2FmZV9zdHJpbmcnLCAnZm9ybWF0X3JlcXVlc3QnXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzb25TdHJpbmc6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnW3ZhbGlkYXRlX2pzb25dIEpTT04gc3RyaW5nIHRvIHZhbGlkYXRlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWRTY2hlbWE6IHsgdHlwZTogJ29iamVjdCcsIGRlc2NyaXB0aW9uOiAnW3ZhbGlkYXRlX2pzb25dIEV4cGVjdGVkIHNjaGVtYScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1tzYWZlX3N0cmluZ10gU3RyaW5nIHZhbHVlIHRvIG1ha2Ugc2FmZScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xOYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1tmb3JtYXRfcmVxdWVzdF0gVG9vbCBuYW1lJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiB7IHR5cGU6ICdvYmplY3QnLCBkZXNjcmlwdGlvbjogJ1tmb3JtYXRfcmVxdWVzdF0gVG9vbCBhcmd1bWVudHMnIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCBhY3Rpb24gPSBhcmdzLmFjdGlvbjtcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ3ZhbGlkYXRlX2pzb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnZhbGlkYXRlSnNvblBhcmFtcyhhcmdzLmpzb25TdHJpbmcsIGFyZ3MuZXhwZWN0ZWRTY2hlbWEpO1xuICAgICAgICAgICAgY2FzZSAnc2FmZV9zdHJpbmcnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZVNhZmVTdHJpbmdWYWx1ZShhcmdzLnZhbHVlKTtcbiAgICAgICAgICAgIGNhc2UgJ2Zvcm1hdF9yZXF1ZXN0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5mb3JtYXRNY3BSZXF1ZXN0KGFyZ3MudG9vbE5hbWUsIGFyZ3MuYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFjdGlvbjogJHthY3Rpb259YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZUpzb25QYXJhbXMoanNvblN0cmluZzogc3RyaW5nLCBleHBlY3RlZFNjaGVtYT86IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBGaXJzdCB0cnkgdG8gcGFyc2UgYXMtaXNcbiAgICAgICAgICAgIGxldCBwYXJzZWQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblN0cmluZyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGZpeCBjb21tb24gaXNzdWVzXG4gICAgICAgICAgICAgICAgY29uc3QgZml4ZWQgPSB0aGlzLmZpeEpzb25TdHJpbmcoanNvblN0cmluZyk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkID0gSlNPTi5wYXJzZShmaXhlZCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoc2Vjb25kRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBDYW5ub3QgZml4IEpTT046ICR7ZXJyb3IubWVzc2FnZX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsSnNvbjoganNvblN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXhlZEF0dGVtcHQ6IGZpeGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiB0aGlzLmdldEpzb25GaXhTdWdnZXN0aW9ucyhqc29uU3RyaW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgYWdhaW5zdCBzY2hlbWEgaWYgcHJvdmlkZWRcbiAgICAgICAgICAgIGlmIChleHBlY3RlZFNjaGVtYSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb24gPSB0aGlzLnZhbGlkYXRlQWdhaW5zdFNjaGVtYShwYXJzZWQsIGV4cGVjdGVkU2NoZW1hKTtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRpb24udmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdTY2hlbWEgdmFsaWRhdGlvbiBmYWlsZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZEpzb246IHBhcnNlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uRXJyb3JzOiB2YWxpZGF0aW9uLmVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uczogdmFsaWRhdGlvbi5zdWdnZXN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkSnNvbjogcGFyc2VkLFxuICAgICAgICAgICAgICAgICAgICBmaXhlZEpzb246IEpTT04uc3RyaW5naWZ5KHBhcnNlZCwgbnVsbCwgMiksXG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQ6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTYWZlU3RyaW5nVmFsdWUodmFsdWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHNhZmVWYWx1ZSA9IHRoaXMuZXNjYXBKc29uU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWxWYWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgc2FmZVZhbHVlOiBzYWZlVmFsdWUsXG4gICAgICAgICAgICAgICAganNvblJlYWR5OiBKU09OLnN0cmluZ2lmeShzYWZlVmFsdWUpLFxuICAgICAgICAgICAgICAgIHVzYWdlOiBgVXNlIFwiJHtzYWZlVmFsdWV9XCIgaW4geW91ciBKU09OIHBhcmFtZXRlcnNgXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBmb3JtYXRNY3BSZXF1ZXN0KHRvb2xOYW1lOiBzdHJpbmcsIHRvb2xBcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbWNwUmVxdWVzdCA9IHtcbiAgICAgICAgICAgICAgICBqc29ucnBjOiAnMi4wJyxcbiAgICAgICAgICAgICAgICBpZDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICd0b29scy9jYWxsJyxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdG9vbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogdG9vbEFyZ3NcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCBmb3JtYXR0ZWRKc29uID0gSlNPTi5zdHJpbmdpZnkobWNwUmVxdWVzdCwgbnVsbCwgMik7XG4gICAgICAgICAgICBjb25zdCBjb21wYWN0SnNvbiA9IEpTT04uc3RyaW5naWZ5KG1jcFJlcXVlc3QpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0OiBtY3BSZXF1ZXN0LFxuICAgICAgICAgICAgICAgICAgICBmb3JtYXR0ZWRKc29uOiBmb3JtYXR0ZWRKc29uLFxuICAgICAgICAgICAgICAgICAgICBjb21wYWN0SnNvbjogY29tcGFjdEpzb24sXG4gICAgICAgICAgICAgICAgICAgIGN1cmxDb21tYW5kOiB0aGlzLmdlbmVyYXRlQ3VybENvbW1hbmQoY29tcGFjdEpzb24pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBmb3JtYXQgTUNQIHJlcXVlc3Q6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaXhKc29uU3RyaW5nKGpzb25TdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGxldCBmaXhlZCA9IGpzb25TdHI7XG4gICAgICAgIFxuICAgICAgICAvLyBGaXggY29tbW9uIGVzY2FwZSBjaGFyYWN0ZXIgaXNzdWVzXG4gICAgICAgIGZpeGVkID0gZml4ZWRcbiAgICAgICAgICAgIC8vIEZpeCB1bmVzY2FwZWQgcXVvdGVzIGluIHN0cmluZyB2YWx1ZXNcbiAgICAgICAgICAgIC5yZXBsYWNlKC8oXFx7W159XSpcIlteXCJdKlwiOlxccypcIikoW15cIl0qXCIpKFteXCJdKlwiKShbXn1dKlxcfSkvZywgKG1hdGNoLCBwcmVmaXgsIGNvbnRlbnQsIHN1ZmZpeCwgZW5kKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXNjYXBlZENvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ICsgZXNjYXBlZENvbnRlbnQgKyBzdWZmaXggKyBlbmQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLy8gRml4IHVuZXNjYXBlZCBiYWNrc2xhc2hlc1xuICAgICAgICAgICAgLnJlcGxhY2UoLyhbXlxcXFxdKVxcXFwoW15cIlxcXFxcXC9iZm5ydHVdKS9nLCAnJDFcXFxcXFxcXCQyJylcbiAgICAgICAgICAgIC8vIEZpeCB0cmFpbGluZyBjb21tYXNcbiAgICAgICAgICAgIC5yZXBsYWNlKC8sKFxccypbfVxcXV0pL2csICckMScpXG4gICAgICAgICAgICAvLyBGaXggY29udHJvbCBjaGFyYWN0ZXJzXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxuL2csICdcXFxcbicpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxyL2csICdcXFxccicpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFx0L2csICdcXFxcdCcpXG4gICAgICAgICAgICAvLyBGaXggc2luZ2xlIHF1b3RlcyB0byBkb3VibGUgcXVvdGVzXG4gICAgICAgICAgICAucmVwbGFjZSgvJy9nLCAnXCInKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBmaXhlZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGVzY2FwSnNvblN0cmluZyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBzdHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpICAvLyBFc2NhcGUgYmFja3NsYXNoZXMgZmlyc3RcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykgICAgLy8gRXNjYXBlIHF1b3Rlc1xuICAgICAgICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKSAgIC8vIEVzY2FwZSBuZXdsaW5lc1xuICAgICAgICAgICAgLnJlcGxhY2UoL1xcci9nLCAnXFxcXHInKSAgIC8vIEVzY2FwZSBjYXJyaWFnZSByZXR1cm5zXG4gICAgICAgICAgICAucmVwbGFjZSgvXFx0L2csICdcXFxcdCcpICAgLy8gRXNjYXBlIHRhYnNcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXGYvZywgJ1xcXFxmJykgICAvLyBFc2NhcGUgZm9ybSBmZWVkc1xuICAgICAgICAgICAgLnJlcGxhY2UoL1xcYi9nLCAnXFxcXGInKTsgIC8vIEVzY2FwZSBiYWNrc3BhY2VzXG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2YWxpZGF0ZUFnYWluc3RTY2hlbWEoZGF0YTogYW55LCBzY2hlbWE6IGFueSk6IHsgdmFsaWQ6IGJvb2xlYW47IGVycm9yczogc3RyaW5nW107IHN1Z2dlc3Rpb25zOiBzdHJpbmdbXSB9IHtcbiAgICAgICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBzdWdnZXN0aW9uczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAvLyBCYXNpYyB0eXBlIGNoZWNraW5nXG4gICAgICAgIGlmIChzY2hlbWEudHlwZSkge1xuICAgICAgICAgICAgY29uc3QgYWN0dWFsVHlwZSA9IEFycmF5LmlzQXJyYXkoZGF0YSkgPyAnYXJyYXknIDogdHlwZW9mIGRhdGE7XG4gICAgICAgICAgICBpZiAoYWN0dWFsVHlwZSAhPT0gc2NoZW1hLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgRXhwZWN0ZWQgdHlwZSAke3NjaGVtYS50eXBlfSwgZ290ICR7YWN0dWFsVHlwZX1gKTtcbiAgICAgICAgICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKGBDb252ZXJ0IHZhbHVlIHRvICR7c2NoZW1hLnR5cGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXF1aXJlZCBmaWVsZHMgY2hlY2tpbmdcbiAgICAgICAgaWYgKHNjaGVtYS5yZXF1aXJlZCAmJiBBcnJheS5pc0FycmF5KHNjaGVtYS5yZXF1aXJlZCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZmllbGQgb2Ygc2NoZW1hLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGF0YSwgZmllbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGBNaXNzaW5nIHJlcXVpcmVkIGZpZWxkOiAke2ZpZWxkfWApO1xuICAgICAgICAgICAgICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKGBBZGQgcmVxdWlyZWQgZmllbGQgXCIke2ZpZWxkfVwiYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgc3VnZ2VzdGlvbnNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEpzb25GaXhTdWdnZXN0aW9ucyhqc29uU3RyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBcbiAgICAgICAgaWYgKGpzb25TdHIuaW5jbHVkZXMoJ1xcXFxcIicpKSB7XG4gICAgICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKCdDaGVjayBmb3IgaW1wcm9wZXJseSBlc2NhcGVkIHF1b3RlcycpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqc29uU3RyLmluY2x1ZGVzKFwiJ1wiKSkge1xuICAgICAgICAgICAgc3VnZ2VzdGlvbnMucHVzaCgnUmVwbGFjZSBzaW5nbGUgcXVvdGVzIHdpdGggZG91YmxlIHF1b3RlcycpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqc29uU3RyLmluY2x1ZGVzKCdcXG4nKSB8fCBqc29uU3RyLmluY2x1ZGVzKCdcXHQnKSkge1xuICAgICAgICAgICAgc3VnZ2VzdGlvbnMucHVzaCgnRXNjYXBlIG5ld2xpbmVzIGFuZCB0YWJzIHByb3Blcmx5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGpzb25TdHIubWF0Y2goLyxcXHMqW31cXF1dLykpIHtcbiAgICAgICAgICAgIHN1Z2dlc3Rpb25zLnB1c2goJ1JlbW92ZSB0cmFpbGluZyBjb21tYXMnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2VuZXJhdGVDdXJsQ29tbWFuZChqc29uU3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBlc2NhcGVkSnNvbiA9IGpzb25TdHIucmVwbGFjZSgvJy9nLCBcIidcXFwiJ1xcXCInXCIpO1xuICAgICAgICByZXR1cm4gYGN1cmwgLVggUE9TVCBodHRwOi8vMTI3LjAuMC4xOjg1ODUvbWNwIFxcXFxcbiAgLUggXCJDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25cIiBcXFxcXG4gIC1kICcke2VzY2FwZWRKc29ufSdgO1xuICAgIH1cbn0iXX0=