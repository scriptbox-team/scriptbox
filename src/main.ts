/* tslint:disable */
import "module-alias/register";
import "source-map-support/register";
import Server from "core/server";
/* tslint:enable */

// Create and start the server
const serv = new Server({port: 7777});
serv.start();
