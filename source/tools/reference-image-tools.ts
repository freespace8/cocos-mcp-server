import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class ReferenceImageTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'reference_image',
                description: 'Reference image operations. Use action parameter: add (add images), remove (remove images), switch (switch to image), set_data (set property), query_config (query config), query_current (query current), refresh (refresh display), set_position (set position), set_scale (set scale), set_opacity (set opacity), list (list all), clear_all (clear all)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Operation type',
                            enum: ['add', 'remove', 'switch', 'set_data', 'query_config', 'query_current', 'refresh', 'set_position', 'set_scale', 'set_opacity', 'list', 'clear_all']
                        },
                        paths: { type: 'array', items: { type: 'string' }, description: '[add/remove] Image paths' },
                        path: { type: 'string', description: '[switch] Image path' },
                        sceneUUID: { type: 'string', description: '[switch] Scene UUID' },
                        key: { type: 'string', description: '[set_data] Property key', enum: ['path', 'x', 'y', 'sx', 'sy', 'opacity'] },
                        value: { description: '[set_data] Property value' },
                        x: { type: 'number', description: '[set_position] X offset' },
                        y: { type: 'number', description: '[set_position] Y offset' },
                        sx: { type: 'number', description: '[set_scale] X scale 0.1-10' },
                        sy: { type: 'number', description: '[set_scale] Y scale 0.1-10' },
                        opacity: { type: 'number', description: '[set_opacity] Opacity 0-1' }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        const action = args.action;
        switch (action) {
            case 'add':
                return await this.addReferenceImage(args.paths);
            case 'remove':
                return await this.removeReferenceImage(args.paths);
            case 'switch':
                return await this.switchReferenceImage(args.path, args.sceneUUID);
            case 'set_data':
                return await this.setReferenceImageData(args.key, args.value);
            case 'query_config':
                return await this.queryReferenceImageConfig();
            case 'query_current':
                return await this.queryCurrentReferenceImage();
            case 'refresh':
                return await this.refreshReferenceImage();
            case 'set_position':
                return await this.setReferenceImagePosition(args.x, args.y);
            case 'set_scale':
                return await this.setReferenceImageScale(args.sx, args.sy);
            case 'set_opacity':
                return await this.setReferenceImageOpacity(args.opacity);
            case 'list':
                return await this.listReferenceImages();
            case 'clear_all':
                return await this.clearAllReferenceImages();
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    private async addReferenceImage(paths: string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'add-image', paths).then(() => {
                resolve({
                    success: true,
                    data: {
                        addedPaths: paths,
                        count: paths.length,
                        message: `Added ${paths.length} reference image(s)`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async removeReferenceImage(paths?: string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'remove-image', paths).then(() => {
                const message = paths && paths.length > 0 ? 
                    `Removed ${paths.length} reference image(s)` : 
                    'Removed current reference image';
                resolve({
                    success: true,
                    message: message
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async switchReferenceImage(path: string, sceneUUID?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const args = sceneUUID ? [path, sceneUUID] : [path];
            Editor.Message.request('reference-image', 'switch-image', ...args).then(() => {
                resolve({
                    success: true,
                    data: {
                        path: path,
                        sceneUUID: sceneUUID,
                        message: `Switched to reference image: ${path}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setReferenceImageData(key: string, value: any): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'set-image-data', key, value).then(() => {
                resolve({
                    success: true,
                    data: {
                        key: key,
                        value: value,
                        message: `Reference image ${key} set to ${value}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryReferenceImageConfig(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'query-config').then((config: any) => {
                resolve({
                    success: true,
                    data: config
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryCurrentReferenceImage(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'query-current').then((current: any) => {
                resolve({
                    success: true,
                    data: current
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async refreshReferenceImage(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'refresh').then(() => {
                resolve({
                    success: true,
                    message: 'Reference image refreshed'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setReferenceImagePosition(x: number, y: number): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                await Editor.Message.request('reference-image', 'set-image-data', 'x', x);
                await Editor.Message.request('reference-image', 'set-image-data', 'y', y);
                
                resolve({
                    success: true,
                    data: {
                        x: x,
                        y: y,
                        message: `Reference image position set to (${x}, ${y})`
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async setReferenceImageScale(sx: number, sy: number): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                await Editor.Message.request('reference-image', 'set-image-data', 'sx', sx);
                await Editor.Message.request('reference-image', 'set-image-data', 'sy', sy);
                
                resolve({
                    success: true,
                    data: {
                        sx: sx,
                        sy: sy,
                        message: `Reference image scale set to (${sx}, ${sy})`
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async setReferenceImageOpacity(opacity: number): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'set-image-data', 'opacity', opacity).then(() => {
                resolve({
                    success: true,
                    data: {
                        opacity: opacity,
                        message: `Reference image opacity set to ${opacity}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async listReferenceImages(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                const config = await Editor.Message.request('reference-image', 'query-config');
                const current = await Editor.Message.request('reference-image', 'query-current');
                
                resolve({
                    success: true,
                    data: {
                        config: config,
                        current: current,
                        message: 'Reference image information retrieved'
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async clearAllReferenceImages(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // Remove all reference images by calling remove-image without paths
                await Editor.Message.request('reference-image', 'remove-image');
                
                resolve({
                    success: true,
                    message: 'All reference images cleared'
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }
}