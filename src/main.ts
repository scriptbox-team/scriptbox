/* tslint:disable */
import "module-alias/register";
import ModuleAlias from "module-alias";
import * as path from "path";
import fs from "fs-extra";

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

try {
  fs.readJSON(path.join(__dirname, "config.json"))
    .then((config) => {
      const serv = new Server(config);
    });
}
catch (err) {
  console.error(err);
}
