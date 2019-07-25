/* tslint:disable */
import "module-alias/register";
import ModuleAlias from "module-alias";
import * as path from "path";

ModuleAlias.addAliases({
  core: path.join(__dirname, "core"),
  messaging: path.join(__dirname, "messaging"),
  scripting: path.join(__dirname, "scripting"),
  networking: path.join(__dirname, "networking"),
  __scripted__: path.join(__dirname, "__scripted__")
});
/* tslint:enable */
