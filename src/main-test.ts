/* tslint:disable */
import "module-alias/register";
import ModuleAlias from "module-alias";
import * as path from "path";

ModuleAlias.addAliases({
  core: path.join(__dirname, "core"),
  messaging: path.join(__dirname, "messaging"),
  scripting: path.join(__dirname, "scripting"),
  networking: path.join(__dirname, "networking"),
  database: path.join(__dirname, "database"),
  "resource-management": path.join(__dirname, "resource-management")
});

import "source-map-support/register";
import Server from "core/server";
/* tslint:enable */

// Create and start the server
const serv = new Server({port: 7777, resourcePort: 7778, useLoginServer: false, useMapGen: false});
