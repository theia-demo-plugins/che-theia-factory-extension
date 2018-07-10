/*
 * Copyright (c) 2018-2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { injectable, inject } from 'inversify';
import { Emitter } from '@theia/core';
import { MessageService } from '@theia/core/lib/common';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { EnvVariablesServer, EnvVariable } from '@theia/core/lib/common/env-variables';
import { Git, Repository } from '@theia/git/lib/common';
import { IProjectConfig } from '@eclipse-che/workspace-client';
import { FactoryTheiaManager } from './factory-manager';
import { IFactoryAction } from './types';
import URI from '@theia/core/lib/common/uri';
import { EditorManager } from '@theia/editor/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

/**
 * Enumeration ID's of ide actions.
 */
export enum ActionId {
    OPEN_FILE = 'openFile',
    RUN_COMMAND = 'runCommand'
}

/**
 * Provides basic Eclipse Che factory client side features at startup of the Theia browser IDE:
 * - checking/retrieving factory-id from URL
 * - request che factory api to get the factory definition
 * - clone the projects defined in the factory definition
 * - checkout branch if needed
 */
@injectable()
export class FactoryTheiaClient implements FrontendApplicationContribution {

    private readonly appLoadedEmitter = new Emitter<{ actions: Array<IFactoryAction> }>();
    private readonly projectsLoadedEmitter = new Emitter<{ actions: Array<IFactoryAction> }>();
    private readonly appClosedEmitter = new Emitter<{ actions: Array<IFactoryAction> }>();
    readonly onAppLoaded = this.appLoadedEmitter.event;
    readonly onProjectsLoaded = this.projectsLoadedEmitter.event;
    readonly onAppClosed = this.appClosedEmitter.event;

    private projectsRoot: string = '/projects';
    private envVariables: EnvVariable[] | undefined;

    private onAppClosedActions: IFactoryAction[] = [];
    private onAppLoadedActions: IFactoryAction[] = [];

    constructor(@inject(MessageService) private readonly messageService: MessageService,
                @inject(EnvVariablesServer) private readonly envVariablesServer: EnvVariablesServer,
                @inject(EditorManager) protected readonly editorManager: EditorManager,
                @inject(Git) protected readonly git: Git,
                @inject(FrontendApplicationStateService) protected readonly frontendApplicationStateService: FrontendApplicationStateService,
                @inject(FactoryTheiaManager) private readonly factoryManager: FactoryTheiaManager) {
        this.frontendApplicationStateService.reachedState('ready').then(() => {
            this.appLoadedEmitter.fire({actions: this.onAppLoadedActions});
        });

        window.onbeforeunload = () => {
            this.appClosedEmitter.fire({actions: this.onAppClosedActions});
        };

        this.onAppLoaded((event: { actions: Array<IFactoryAction> }) => {
            event.actions.forEach((onAppLoadedAction: IFactoryAction) => {
                console.log('>>>>>>>>>>> onAppLoaded.action', onAppLoadedAction);
            });
        });
        this.onProjectsLoaded((event: { actions: Array<IFactoryAction> }) => {
            console.log('>>>>>>>>>>> onProjectsLoaded.action');
            event.actions.forEach((onProjectsLoadedAction: IFactoryAction) => {
                switch (onProjectsLoadedAction.id) {
                    case ActionId.OPEN_FILE:
                        this.openFile(onProjectsLoadedAction.properties!.file);
                        break;
                    case ActionId.RUN_COMMAND:
                        // not implemented yet
                        break;
                    default:
                        const errorMessage = `Action id '${onProjectsLoadedAction.id}' is not supported yet!`;
                        console.error(errorMessage);
                        this.messageService.error(errorMessage);
                }
            });
        });
        this.onAppClosed(() => {
            this.onAppClosedActions.forEach((onAppClosedAction: IFactoryAction) => {
                console.log('>>>>>>>>>>> onAppClosed.action', onAppClosedAction);
            });
        });
    }

    async onStart(app: FrontendApplication) {
        const factory = await this.factoryManager.fetchCurrentFactory();
        if (!factory) {
            return;
        }

        this.envVariables = await this.envVariablesServer.getVariables();
        if (!this.envVariables) {
            return;
        }

        const projectsRootEnvVar = this.getEnvVariable('CHE_PROJECTS_ROOT');
        if (projectsRootEnvVar && projectsRootEnvVar.value) {
            this.projectsRoot = projectsRootEnvVar.value;
        }

        this.onAppClosedActions = this.factoryManager.getFactoryOnAppClosedActions(factory);
        this.onAppLoadedActions = this.factoryManager.getFactoryOnAppLoadedActions(factory);

        const onProjectsLoadedActions = this.factoryManager.getFactoryOnProjectsLoadedActions(factory);
        const importProjectPromices: Array<Promise<void>> = [];

        const projects = this.factoryManager.getFactoryProjects(factory);
        projects.forEach((project: IProjectConfig) => {
            if (!project.source) {
                return;
            }

            const source = project.source;
            const projectPath = this.projectsRoot + project.path;

            this.messageService.info(`CLONING ... ${source.location} to ${projectPath}...`);

            importProjectPromices.push(this.git.clone(
                source.location,
                {
                    localUri: projectPath
                }
            ).then(
                (repo: Repository) => {
                    this.messageService.info(`Project ${projectPath} successfully cloned.`);
                    if (source.parameters['branch']) {
                        const options: Git.Options.Checkout.CheckoutBranch = {branch: source.parameters['branch']};
                        this.git.checkout(repo, options);
                    }
                    return Promise.resolve();
                }
            ).catch((error) => {
                console.error(`Couldn't clone ${source.location} to ${projectPath}... ${error}`);
                this.messageService.error(`Couldn't clone ${source.location} to ${projectPath}... ${error}`);
                return Promise.reject(error);
            }));

        });
        Promise.all(importProjectPromices).then(() => {
            if (projects.length) {
                this.projectsLoadedEmitter.fire({actions: onProjectsLoadedActions});
            }
        });
    }

    protected async openFile(relativePath: string | undefined): Promise<void> {
        if (!relativePath) {
            return;
        }
        const uri = new URI().withPath(this.projectsRoot + relativePath).withScheme('file');
        console.info('opening file: ' + this.projectsRoot + relativePath);
        await this.editorManager.open(uri);
    }

    getEnvVariable(name: string): EnvVariable | undefined {
        if (!this.envVariables) {
            return undefined;
        }
        return this.envVariables.find(function (envVariable) {
            return envVariable.name === name
        });
    }
}
