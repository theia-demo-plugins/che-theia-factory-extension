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


import { FactoryTheiaManager } from './factory-manager';
import { FactoryTheiaClient } from './factory-theia-client';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';

import { ContainerModule } from "inversify";

export default new ContainerModule(bind => {
    bind(FactoryTheiaManager).toSelf().inSingletonScope();
    bind(FactoryTheiaClient).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toDynamicValue(c => c.container.get(FactoryTheiaClient));
});
