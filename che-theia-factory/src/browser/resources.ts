/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { AxiosInstance, AxiosPromise } from 'axios';

export interface IFactoryService {
    getById: <T>(workspaceKey: string) => AxiosPromise<T>;
}

export class FactoryService implements IFactoryService {

    private readonly factoryUrl = '/factory';

    constructor(private readonly axios: AxiosInstance,
        private readonly baseUrl: string) {
    }


    public getById<T>(factoryId: string): AxiosPromise<T> {
        return this.axios.request<T>({
            method: 'GET',
            baseURL: this.baseUrl,
            url: `${this.factoryUrl}/${factoryId}`
        });
    }

}
