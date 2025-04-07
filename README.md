# unisanServer -  A web-based personnel and resource management application for medical service groups

### Description
#### Version history:
- 0.6.0 (released 07.04.2025)

#### Overview of features:
- user management (implemented)
- calendar and event management (implemented)
- web-based CMS for public website (discontinued)
- eLearning area providing course materials and information (discontinued)
- News feature for in-system notifications (in progress)
- public event registration (planned)
- user documentation (will be ready for release, whenever that may be)

### Tech


#### Dependencies

Our project uses [SASS](https://sass-lang.com/) and webpack.

##### Backend
Node 20
check package.json for npm dependencies

##### Frontend

located in ./src, requires npm install and webpack build
check package.json for details

## Usage

### Installation
- clone repo
- switch to project root `cd unisan-server`
- install backend dependencies:  `npm install --production`
- switch to frontend src directory: `cd src`
- build frontend files: `npx webpack --config webpack.prod.js`

#### Development setup
- in root dir: `npm install`
- switch to frontend src directory: `cd src`
- build frontend in dev mode and enable watcher: `npx webpack --config webpack.dev.js`
