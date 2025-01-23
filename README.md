<p align="center">
  <a href="https://connect-u.site/" target="blank"><img src=".github/logo_full_dark.svg" width="400" alt="Connect-U Logo" /></a>
</p>



<p align="center">The Backend of <a href="https://connect-u.site/" target="_blank">Connect-U</a>. Event planning made easy ‒ for private meetups or public events. <br/> Plan, Share, Connect.</p>


<p align="center">
  <a href="https://nestjs.com/" target="_blank"><img src="https://img.shields.io/badge/Nest.js-%23E0234E.svg?logo=nestjs&logoColor=white"/></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff"/></a>
  <a href="https://www.docker.com/" target="_blank"><img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff"/></a>
  <a href="https://nodejs.org/" target="_blank"><img src="https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white"/></a>
  <a href="https://www.npmjs.com/" target="_blank"><img src="https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=fff"/></a>
  <a href="https://typeorm.io/" target="_blank"><img src="https://img.shields.io/badge/TypeORM-FE0803?logo=typeorm&logoColor=fff"/></a>
  <a href="https://jestjs.io/" target="_blank"><img src="https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=fff"/></a>
  <a href="https://eslint.org/" target="_blank"><img src="https://img.shields.io/badge/eslint-3A33D1?logo=eslint&logoColor=white"/></a>
  <a href="https://prettier.io/" target="_blank"><img src="https://img.shields.io/badge/prettier-1A2C34?logo=prettier&logoColor=F7BA3E"/></a>
  <a href="https://jwt.io/" target="_blank"><img src="https://img.shields.io/badge/JWT-000000?logo=JSON%20web%20tokens&logoColor=white"/></a>
  <a href="https://connect-u.site/" target="_blank"><img src="https://img.shields.io/website-up-down-green-red/http/argo.connect-u.site.svg"/></a>
  <a href="https://dev.connect-u.site/api/docs" target="_blank"><img src="https://img.shields.io/website-up-down-green-red/http/argo.connect-u.site.svg?label=OpenAPI%20Docs"/></a>
  <a href="https://github.com/VNxyz1/Connect-U-Backend/pkgs/container/connect-u-backend" target="_blank"><img src="https://img.shields.io/badge/Docker%20images-2496ED?logo=docker&logoColor=fff"/></a>
</p>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#project-setup">Project setup</a>
      <ul>
        <li><a href="#environments">Environments</a></li>
        <li><a href="#test-data">Test data</a></li>
        <li><a href="#start-the-project">Start the project</a></li>
        <li><a href="#run-tests">Run tests</a></li>
        <li><a href="#linter">Linter</a></li>
        <li><a href="#format-code">Format code</a></li>
      </ul>
    </li>
    <li>
      <a href="#build">Build</a>
      <ul>
        <li><a href="#locally">Locally</a></li>
        <li><a href="#docker">Docker</a></li>
      </ul>
    </li>
    <li><a href="#file-structure">File structure</a></li>
    <li>
      <a href="#contributing">File structure</a>
    </li>
    <li>
      <a href="#license">File structure</a>
    </li>
  </ol>
</details>



## Project setup

```bash
# install the nestjs cli and dependencies
$ npm install -g @nestjs/cli
$ npm install
```

### Environments
If started locally, the Project will use the environment defined in the `.env.development` file. If you want to make changes to the environment, just follow the guide in the `.env.development` and `.env.example` files.

### Test data
If you need test data to explore some functionalities, just set the environment variable `POPULATE_DB=true`, and specify how many users and events you want.

```dotenv
# fakerservice: Populates the DB with user- and event-data
POPULATE_DB=true
DESIRED_USERS=500
DESIRED_EVENTS=200
```
Friend relations and event participation, as well as clicks on events will automatically be added to the database.

### Start the project

```bash
# development
$ npm run start
```
```bash
# watch mode
$ npm run start:dev
```
```bash
# production mode
$ npm run start:prod
```

### Run tests

```bash
# unit tests
$ npm run test
```

### Linter

```bash
$ npm run lint
```

### Format code

```bash
$ npm run format
```

## Build
### Locally
Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Docker
- Build a docker image of the current application with `docker build -t connect-u-backend .`.
- Run the docker container with `docker run -d -p 3000:3000 connect-u-backend`
- It is now accessible on port `3000`

## File structure
A listing of the relevant files and directories.

```
Connect-U-Backend
│   README.md
│   .env.development                       # environment files for local development
│   .env.example
│   Dockerfile
│   ...
│
└───uploads                                # storage directory for uploaded images
│
└───src
│   │   main.ts
│   │   app.module.ts
│   │   app.controller.ts                  # healthcheck routes
│   │   ...
│   │
│   └───API                                # external APIs
│   └───auth                               # auth controller and service
│   └───event                              # event controller and service
│   │   │   event.controller.ts            # routes
│   │   │   event.controller.spec.ts       # controller e2e tests
│   │   │   event.service.ts               # service (mostly for database handling)
│   │   │   event.service.spec.ts          # service unit tests
│   │
│   │   ...
│
└───.github                                # collection of workflow files
    │   workflow.yaml
    │   ...
    
```

## Contributing

<a href="https://github.com/VNxyz1/Connect-U-Backend/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=VNxyz1/Connect-U-Backend" alt="contrib.rocks image" />
</a>

## License

Distributed under the MIT License. See `LICENSE.md` for more information.
