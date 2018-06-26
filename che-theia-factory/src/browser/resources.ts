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
