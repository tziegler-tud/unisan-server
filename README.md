# unisan-server

A **web-based personnel and resource management platform** tailored for medical service organizations.

---

## Version 0.7.0 (July 21, 2025)

### ✅ Feature Overview

| Feature                          | Status        | Notes                                     |
|----------------------------------|---------------|-------------------------------------------|
| User Management                  | ✅ Implemented |                                           |
| Event Calendar                   | ✅ Implemented |                                           |
| Duty Roster Planner              | ✅ Implemented |                                           |
| In-System News                   | ✅ Implemented | Internal notifications                    |
| OAuth2 Provider                  | ✅ Implemented | Built-in authorization server             |
| Email Integration (Mailu)        | ✅ Implemented | Currently supports Mailu API only         |
| Public Event Registration        | 🔄 Planned     |                                          |
| End-User Documentation           | 🔄 Planned     |                                          |
| Web-based CMS                    | ❌ Discontinued| Moved to separat project                  |
| eLearning Module                 | ❌ Discontinued| Using Moodle instead                      |

---

## Tech Stack

### Backend
- [Node.js](https://nodejs.org/) (Requires >= 20, tested for 22.14.0)
- [Express.js](https://expressjs.com/) (v4) 
- [Mongoose 7](https://mongoosejs.com/docs/7.x/docs/guide.html) ontop of [MongoDB driver](https://mongodb-node.netlify.app/docs/drivers/node/current/reference/compatibility/) for Node.js
- [MongoDB](https://www.mongodb.com/) (Supports v3.6.x - 7.X, check [compatibility table](https://mongoosejs.com/docs/compatibility.html) for deployed Mongoose version)
- [SASS](https://sass-lang.com/) for styling
- [Webpack 5](https://webpack.js.org/) for bundling

### Frontend
- Vanilla JavaScript (in transition to [TypeScript](https://www.typescriptlang.org/))
- [Handlebars.js](https://handlebarsjs.com/) for client-side templating

---

## Installation

Make sure you have a suitable MongoDB instance available or use the provided docker-compose file and adjust it to your needs.

#### Production setup

```bash
# Clone the repository
git clone https://github.com/tziegler-tud/unisan-server.git
cd unisan-server

# Install backend dependencies
npm install

# Build frontend
cd src
npm install
npx webpack --config webpack.prod.js
````

#### Development Setup

```bash
# Clone the repository
git clone https://github.com/tziegler-tud/unisan-server.git
cd unisan-server

# Install all dependencies
npm install

# Switch to frontend directory
cd src
# Install frontend packages
npm install --include=dev

# Build frontend in dev mode and watch for changes
npx webpack --config webpack.dev.js
```

### Configuration

Configuration is done via two files ```config.json``` and ```db.json``` located in ```/config```.

To start, copy example configurations
```
cd /config
cp config.example.json ./config.json
cp db.example.json ./db.json
```
Adjust the values in ```config.json``` according to your setup:
```
# The following entries are required for the Oauth provider to work.
{
  "hostname": "https://unisan-server.de",   <-- The public url your server will be available at.
  "port":     "80"                          <-- The public port (not the internal port for the Node.js application). If you use a reverse proxy, this is  usually 80.
}
```
Adjust the values in ```db.json``` according to your setup:

```
{
  "connectionString": "mongodb://localhost:27017/unisan-server", <-- This connects to a MongoDB instance on localhost:27017 using the database 'unisan-server'. See https://www.mongodb.com/docs/manual/reference/connection-string/
  "username": "unisanServerUser",   <-- MongoDB user. It is recommended to create a seperate user for this application. Requires 
  "pwd": "yourDbPassword",          <-- Password for MongoDB user
  "authSource": "unisan-server"     <-- Setting the authSource is required
}
```
---

## Roadmap

Planned features and improvements:
* [ ] Reusable Events & Blueprints
* [ ] Public event registration module
* [ ] End-user documentation and help center
* [ ] Full migration to TypeScript frontend
* [ ] Email server support expansion beyond Mailu

---

## Support / Contact

For questions, issues and feature requests, please use the [GitHub Issues](https://github.com/tziegler-tud/unisan-server/issues) tab.

Maintainer: [@tziegler-tud](https://github.com/tziegler-tud)

---