/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { injectable, inject } from 'inversify';
import { FactoryService, IFactoryService } from './resources';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { IFactory, IFactoryAction } from './types'
import { IProjectConfig } from '@eclipse-che/workspace-client';

const queryString = require('query-string');


@injectable()
export class FactoryTheiaManager {
    private static axiosInstance: AxiosInstance = axios;

    private factoryId: string;
    private factoryService: IFactoryService | undefined;
    private currentFactory: IFactory | undefined;

    constructor(
        @inject(EnvVariablesServer) private readonly envVariablesServer: EnvVariablesServer
    ) {
        this.factoryId = queryString.parse(window.location.search)['factory-id'];
        if (!this.factoryId) {
            return;
        }
        this.envVariablesServer.getValue('CHE_API_EXTERNAL').then(cheApiExternalVar => {
            if (cheApiExternalVar) {
                this.factoryService = new FactoryService(FactoryTheiaManager.axiosInstance, String(cheApiExternalVar.value));
            }
        });
    }

    async fetchCurrentFactory(): Promise<IFactory | undefined> {
        if (!this.factoryId || !this.factoryService) {
            return undefined;
        }
        const response: AxiosResponse<IFactory> = await this.factoryService.getById<IFactory>(this.factoryId);
        if (!response || !response.data) {
            return undefined;
        }

        const factory = response.data;
        this.currentFactory = factory;

        return factory;
    }

    getCurrentFactory(): IFactory | undefined {
        return this.currentFactory;
    }

    getFactoryProjects(factory: IFactory | undefined): IProjectConfig[] {
        if (!factory || !factory.workspace || !factory.workspace.projects) {
            return [];
        }

        return factory.workspace.projects;
    }

    getFactoryOnAppLoadedActions(factory: IFactory | undefined): Array<IFactoryAction> {
        if (!factory || !factory.ide || !factory.ide.onAppLoaded || !factory.ide.onAppLoaded.actions) {
            return [];
        }

        return factory.ide.onAppLoaded.actions;
    }

    getFactoryOnProjectsLoadedActions(factory: IFactory | undefined): Array<IFactoryAction> {
        if (!factory || !factory.ide || !factory.ide.onProjectsLoaded || !factory.ide.onProjectsLoaded.actions) {
            return [];
        }

        return factory.ide.onProjectsLoaded.actions;
    }

    getFactoryOnAppClosedActions(factory: IFactory | undefined): Array<IFactoryAction> {
        if (!factory || !factory.ide || !factory.ide.onAppClosed || !factory.ide.onAppClosed.actions) {
            return [];
        }

        return factory.ide.onAppClosed.actions;
    }
}
