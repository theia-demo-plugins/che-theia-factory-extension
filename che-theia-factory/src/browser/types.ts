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