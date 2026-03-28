import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class SceneAdvancedTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'scene_advanced',
                description: 'Advanced scene operations. Use action parameter: reset_property (reset node property), move_array_element (move array element), remove_array_element (remove array element), copy_node (copy nodes), paste_node (paste nodes), cut_node (cut nodes), reset_transform (reset node transform), reset_component (reset component), restore_prefab (restore prefab from asset), execute_method (execute component method), execute_script (execute scene script), snapshot (scene snapshot), snapshot_abort (abort snapshot), begin_undo (begin undo recording), end_undo (end undo), cancel_undo (cancel undo), soft_reload (soft reload scene), query_ready (check scene ready), query_dirty (check unsaved changes), query_classes (query registered classes), query_components (query available components), query_has_script (check component script), query_nodes_by_asset (find nodes by asset UUID)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Operation type',
                            enum: ['reset_property', 'move_array_element', 'remove_array_element', 'copy_node', 'paste_node', 'cut_node', 'reset_transform', 'reset_component', 'restore_prefab', 'execute_method', 'execute_script', 'snapshot', 'snapshot_abort', 'begin_undo', 'end_undo', 'cancel_undo', 'soft_reload', 'query_ready', 'query_dirty', 'query_classes', 'query_components', 'query_has_script', 'query_nodes_by_asset']
                        },
                        uuid: { type: 'string', description: '[reset_property/move_array_element/remove_array_element/reset_transform/reset_component/execute_method] Node/Component UUID' },
                        path: { type: 'string', description: '[reset_property/move_array_element/remove_array_element] Property path' },
                        targetIndex: { type: 'number', description: '[move_array_element] Target item original index' },
                        offset: { type: 'number', description: '[move_array_element] Offset amount' },
                        index: { type: 'number', description: '[remove_array_element] Index to remove' },
                        uuids: { description: '[copy_node/paste_node/cut_node] Node UUID(s) - string or array' },
                        pasteTarget: { type: 'string', description: '[paste_node] Target parent node UUID' },
                        keepWorldTransform: { type: 'boolean', description: '[paste_node] Keep world transform', default: false },
                        nodeUuid: { type: 'string', description: '[restore_prefab/begin_undo] Node UUID' },
                        assetUuid: { type: 'string', description: '[restore_prefab/query_nodes_by_asset] Asset UUID' },
                        methodName: { type: 'string', description: '[execute_method/execute_script] Method name' },
                        pluginName: { type: 'string', description: '[execute_script] Plugin name' },
                        methodArgs: { type: 'array', description: '[execute_method/execute_script] Method arguments', default: [] },
                        undoId: { type: 'string', description: '[end_undo/cancel_undo] Undo recording ID' },
                        extends: { type: 'string', description: '[query_classes] Filter by base class' },
                        className: { type: 'string', description: '[query_has_script] Script class name' }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        const action = args.action;
        switch (action) {
            case 'reset_property':
                return await this.resetNodeProperty(args.uuid, args.path);
            case 'move_array_element':
                return await this.moveArrayElement(args.uuid, args.path, args.targetIndex, args.offset);
            case 'remove_array_element':
                return await this.removeArrayElement(args.uuid, args.path, args.index);
            case 'copy_node':
                return await this.copyNode(args.uuids);
            case 'paste_node':
                return await this.pasteNode(args.pasteTarget, args.uuids, args.keepWorldTransform);
            case 'cut_node':
                return await this.cutNode(args.uuids);
            case 'reset_transform':
                return await this.resetNodeTransform(args.uuid);
            case 'reset_component':
                return await this.resetComponent(args.uuid);
            case 'restore_prefab':
                return await this.restorePrefab(args.nodeUuid, args.assetUuid);
            case 'execute_method':
                return await this.executeComponentMethod(args.uuid, args.methodName, args.methodArgs);
            case 'execute_script':
                return await this.executeSceneScript(args.pluginName, args.methodName, args.methodArgs);
            case 'snapshot':
                return await this.sceneSnapshot();
            case 'snapshot_abort':
                return await this.sceneSnapshotAbort();
            case 'begin_undo':
                return await this.beginUndoRecording(args.nodeUuid);
            case 'end_undo':
                return await this.endUndoRecording(args.undoId);
            case 'cancel_undo':
                return await this.cancelUndoRecording(args.undoId);
            case 'soft_reload':
                return await this.softReloadScene();
            case 'query_ready':
                return await this.querySceneReady();
            case 'query_dirty':
                return await this.querySceneDirty();
            case 'query_classes':
                return await this.querySceneClasses(args.extends);
            case 'query_components':
                return await this.querySceneComponents();
            case 'query_has_script':
                return await this.queryComponentHasScript(args.className);
            case 'query_nodes_by_asset':
                return await this.queryNodesByAssetUuid(args.assetUuid);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    private async resetNodeProperty(uuid: string, path: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'reset-property', { 
                uuid, 
                path, 
                dump: { value: null } 
            }).then(() => {
                resolve({
                    success: true,
                    message: `Property '${path}' reset to default value`
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async moveArrayElement(uuid: string, path: string, target: number, offset: number): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'move-array-element', {
                uuid,
                path,
                target,
                offset
            }).then(() => {
                resolve({
                    success: true,
                    message: `Array element at index ${target} moved by ${offset}`
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async removeArrayElement(uuid: string, path: string, index: number): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'remove-array-element', {
                uuid,
                path,
                index
            }).then(() => {
                resolve({
                    success: true,
                    message: `Array element at index ${index} removed`
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async copyNode(uuids: string | string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'copy-node', uuids).then((result: string | string[]) => {
                resolve({
                    success: true,
                    data: {
                        copiedUuids: result,
                        message: 'Node(s) copied successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async pasteNode(target: string, uuids: string | string[], keepWorldTransform: boolean = false): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'paste-node', {
                target,
                uuids,
                keepWorldTransform
            }).then((result: string | string[]) => {
                resolve({
                    success: true,
                    data: {
                        newUuids: result,
                        message: 'Node(s) pasted successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async cutNode(uuids: string | string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'cut-node', uuids).then((result: any) => {
                resolve({
                    success: true,
                    data: {
                        cutUuids: result,
                        message: 'Node(s) cut successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async resetNodeTransform(uuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'reset-node', { uuid }).then(() => {
                resolve({
                    success: true,
                    message: 'Node transform reset to default'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async resetComponent(uuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'reset-component', { uuid }).then(() => {
                resolve({
                    success: true,
                    message: 'Component reset to default values'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async restorePrefab(nodeUuid: string, assetUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            (Editor.Message.request as any)('scene', 'restore-prefab', nodeUuid, assetUuid).then(() => {
                resolve({
                    success: true,
                    message: 'Prefab restored successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async executeComponentMethod(uuid: string, name: string, args: any[] = []): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'execute-component-method', {
                uuid,
                name,
                args
            }).then((result: any) => {
                resolve({
                    success: true,
                    data: {
                        result: result,
                        message: `Method '${name}' executed successfully`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async executeSceneScript(name: string, method: string, args: any[] = []): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'execute-scene-script', {
                name,
                method,
                args
            }).then((result: any) => {
                resolve({
                    success: true,
                    data: result
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async sceneSnapshot(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'snapshot').then(() => {
                resolve({
                    success: true,
                    message: 'Scene snapshot created'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async sceneSnapshotAbort(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'snapshot-abort').then(() => {
                resolve({
                    success: true,
                    message: 'Scene snapshot aborted'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async beginUndoRecording(nodeUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'begin-recording', nodeUuid).then((undoId: string) => {
                resolve({
                    success: true,
                    data: {
                        undoId: undoId,
                        message: 'Undo recording started'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async endUndoRecording(undoId: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'end-recording', undoId).then(() => {
                resolve({
                    success: true,
                    message: 'Undo recording ended'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async cancelUndoRecording(undoId: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'cancel-recording', undoId).then(() => {
                resolve({
                    success: true,
                    message: 'Undo recording cancelled'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async softReloadScene(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'soft-reload').then(() => {
                resolve({
                    success: true,
                    message: 'Scene soft reloaded successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySceneReady(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-is-ready').then((ready: boolean) => {
                resolve({
                    success: true,
                    data: {
                        ready: ready,
                        message: ready ? 'Scene is ready' : 'Scene is not ready'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySceneDirty(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-dirty').then((dirty: boolean) => {
                resolve({
                    success: true,
                    data: {
                        dirty: dirty,
                        message: dirty ? 'Scene has unsaved changes' : 'Scene is clean'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySceneClasses(extendsClass?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const options: any = {};
            if (extendsClass) {
                options.extends = extendsClass;
            }

            Editor.Message.request('scene', 'query-classes', options).then((classes: any[]) => {
                resolve({
                    success: true,
                    data: {
                        classes: classes,
                        count: classes.length,
                        extendsFilter: extendsClass
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySceneComponents(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-components').then((components: any[]) => {
                resolve({
                    success: true,
                    data: {
                        components: components,
                        count: components.length
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryComponentHasScript(className: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-component-has-script', className).then((hasScript: boolean) => {
                resolve({
                    success: true,
                    data: {
                        className: className,
                        hasScript: hasScript,
                        message: hasScript ? `Component '${className}' has script` : `Component '${className}' does not have script`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryNodesByAssetUuid(assetUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-nodes-by-asset-uuid', assetUuid).then((nodeUuids: string[]) => {
                resolve({
                    success: true,
                    data: {
                        assetUuid: assetUuid,
                        nodeUuids: nodeUuids,
                        count: nodeUuids.length,
                        message: `Found ${nodeUuids.length} nodes using asset`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
}