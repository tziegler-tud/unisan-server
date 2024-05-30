# unisanServer -  A web-based personnel and resource management application for medical service groups
### Author: Tom Ziegler
#### Contributers: 
github.com/SoulKa

### front-end docs
https://tziegler-tud.github.io/unisan-server/


### Purpose
Extension of the publicly available website [unisan-dresden.de](https://www.unisan-dresden.de) with backbone api and frontend for a sophisticated web-based management application. Specific aims will be determinded along the way - let's see where this is going.

Planned features include a user management, event mangement, an eLearning area and CMS for the public website.
#### Current state (03.08.2022):
- user management and event management implemented with most features
- new planned feature: resource and inventory management
- working on dashboard

#### Planned:
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
Node >= 16
ES2017

check package.json for npm dependencies

##### Frontend

located in ./src, requires npm install and webpack build
check package.json for details

### Todos

 A lot...
 
### Contact

For any communication concerning this project, contact us under the following adress:
admin@unisan-dresden.de
 

## Usage

### Installation
- clone repo
- switch to project root `cd unisan-server`
- install backend dependencies:  `npm install --production`
- switch to frontend src directory: `cd src`
- build frontend files: `npx webpack --config webpack.prod.js`

#### Development setup
- in root dir: `npm install`
- build frontend in dev mode and enable watcher: `npx webpack --config webpack.dev.js`
