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

import { injectable, inject } from "inversify";
import { MessageService } from "@theia/core/lib/common";
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { EnvVariablesServer, EnvVariable } from "@theia/core/lib/common/env-variables";
import { FactoryService } from "./resources";
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Git, Repository } from "@theia/git/lib/common";
import { IFactory } from "./types"
import { IProjectConfig } from "@eclipse-che/workspace-client";

const queryString = require('query-string');

/**
 * Provides basic Eclipse Che factory client side features at startup of the Theia browser IDE:
 * - checking/retrieving factory-id from URL
 * - request che factory api to get the factory definition
 * - clone the projects defined in the factory definition
 * - checkout branch if needed
 */
@injectable()
export class FactoryTheiaClient implements FrontendApplicationContribution {

    private static axiosInstance: AxiosInstance = axios;

    private envVariables: EnvVariable[] | undefined;

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(EnvVariablesServer) private readonly envVariablesServer: EnvVariablesServer,
        @inject(Git) protected readonly git: Git,
    ) { }

    async onStart(app: FrontendApplication) {
        const factoryid = queryString.parse(window.location.search)['factory-id'];
        if (!factoryid) {
            return;
        }

        this.envVariables = await this.envVariablesServer.getVariables();
        if (!this.envVariables) {
            return;
        }

        const cheApiExternalVar = this.getEnvVariable('CHE_API_EXTERNAL');
        if (!cheApiExternalVar) {
            return;
        }

        const projectsRootEnvVar = this.getEnvVariable('CHE_PROJECTS_ROOT');
        var projectsRoot = "/projects";
        if (projectsRootEnvVar && projectsRootEnvVar.value) {
            projectsRoot = projectsRootEnvVar.value;
        }

        const factory = new FactoryService(FactoryTheiaClient.axiosInstance, String(cheApiExternalVar.value));
        const response: AxiosResponse<IFactory> = await factory.getById<IFactory>(factoryid);

        response.data.workspace.projects.forEach((project: IProjectConfig) => {
            if (!project.source) {
                return;
            }

            const source = project.source;
            const projectPath = projectsRoot + project.path;

            this.messageService.info(`Cloning ... ${source.location} to ${projectPath}...`)

            this.git.clone(
                source.location,
                {
                    localUri: projectPath
                }
            ).then(
                (repo: Repository) => {
                    this.messageService.info(`Project ${projectPath} successfully cloned.`);
                    if (source.parameters['branch']) {
                        const options: Git.Options.Checkout.CheckoutBranch = { branch: source.parameters['branch'] };
                        this.git.checkout(repo, options);
                    }
                }
            ).catch((error) => {
                console.error(`Couldn't clone ${source.location} to ${projectPath}... ${error}`);
                this.messageService.error(`Couldn't clone ${source.location} to ${projectPath}... ${error}`);
            });

        });
    }

    getEnvVariable(name: string): EnvVariable | undefined {
        if (!this.envVariables) {
            return undefined;
        }
        return this.envVariables.find(function(envVariable) { return envVariable.name === name });
    }
}
