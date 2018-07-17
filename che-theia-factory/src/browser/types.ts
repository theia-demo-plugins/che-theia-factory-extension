/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { IWorkspaceConfig } from "@eclipse-che/workspace-client";


export interface IFactory {
    workspace: IWorkspaceConfig;
    ide?: {
        onAppLoaded?: {
            actions?: Array<IFactoryAction>
        };
        onProjectsLoaded?: {
            actions?: Array<IFactoryAction>
        };
        onAppClosed?: {
            actions?: Array<IFactoryAction>
        };
    }
}

export interface IFactoryAction {
    id: string,
    properties?: {
        name?: string,
        file?: string,
        greetingTitle?: string,
        greetingContentUrl?: string
    }
}
