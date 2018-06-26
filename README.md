# Che Theia factory
This Theia extension is performing additional actions while creating/starting a Che workspace through a factory URL.
Provides basic factory client side clone feature

- retrieving the factory-id from the URL
- requesting Che factory API to get the factory definition


From the factory definition:
- cloning projects defined in the factory definition
- checking out the right branch if needed

## Testing this extension
Having that

- We have two or three Github projects to import in a factory,
- One of the project has a specific branch to checkout.

When:

1. Create a new empty workspace (blank or any other type but that works with the Che legacy IDE).
2. Start the workspace. Import projects from Che legacy IDE (we do that so the project types are defined, could also be done manually without having to start a workspace). 
3. Checkout the specific branch for one of the project.
3. Create a new factory from the created workspace.
4. Edit the factory and select `from a stack` and `Java Theia (OpenShift)`
5. Edit the configuration and add to the theia machine the environment variable THEIA_EXTENSIONS


            "env": {
              "CHE_MACHINE_NAME": "ws/theia",
              "THEIA_EXTENSIONS": "che-theia-factory:https://github.com/eclipse/che-theia-factory-extension.git"
            }

Then:

- Running the factory, should clone the projects defined
- The project with the checked out branch should have the right branch checkedout


## Getting started

Install [nvm](https://github.com/creationix/nvm#install-script).

    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash

Install npm and node.

    nvm install 8
    nvm use 8

Install yarn.

    npm install -g yarn

## Running the browser example

    yarn rebuild:browser
    cd browser-app
    yarn start

Open http://localhost:3000 in the browser.

## Developing with the browser example

Start watching of the extension.

    cd che-theia-factory-frontend-extension
    yarn watch

Start watching of the browser example.

    yarn rebuild:browser
    cd browser-app
    yarn watch

Launch `Start Browser Backend` configuration from VS code.

Open http://localhost:3000 in the browser.


## Publishing extension

Create a npm user and login to the npm registry, [more on npm publishing](https://docs.npmjs.com/getting-started/publishing-npm-packages).

    npm login

Publish packages with lerna to update versions properly across local packages, [more on publishing with lerna](https://github.com/lerna/lerna#publish).

    npx lerna publish
