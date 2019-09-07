import express from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs-extra";
import Resource from "resource-management/resource";

interface IResourceServerOptions {
    port: string;
    resourcePath: string;
}

export default class ResourceServer {
    public onFileUpload?: (token: number, file: UploadedFile, resource?: string) => void;
    public onFileDelete?: (token: number, resource: string) => void;
    private _app: express.Application;
    private _port: string;
    private _resourcePath: string;
    private _resourceContentType: Map<string, string>;
    constructor(options: IResourceServerOptions) {
        this._app = express();
        this._app.use(fileUpload());
        this._port = options.port;
        this._resourcePath = options.resourcePath;
        this._resourceContentType = new Map<string, string>();
        this._app.get("/image/:id", (req, res) => {
            const resType = this._resourceContentType.get(req.params.id);
            if (resType === undefined || resType.split("/")[0] !== "image") {
                res.status(404)
                   .send("Resource not found")
                   .end();
                return;
            }
            res.setHeader("Content-Type", resType);
            res.sendFile(req.params.id, {root: this._resourcePath});
        });
        this._app.get("/audio/:id", (req, res) => {
            const resType = this._resourceContentType.get(req.params.id);
            if (resType === undefined || resType.split("/")[0] !== "audio") {
                res.status(404)
                   .send("Resource not found")
                   .end();
                return;
            }
            res.setHeader("Content-Type", resType);
            res.sendFile(req.params.id, {root: this._resourcePath});
        });

        this._app.get("/text/:id", (req, res) => {
            const resType = this._resourceContentType.get(req.params.id);
            if (resType === undefined || resType.split("/")[0] !== "text") {
                res.status(404)
                   .send("Resource not found")
                   .end();
                return;
            }
            res.setHeader("Content-Type", resType);
            res.sendFile(req.params.id, {root: this._resourcePath});
        });
        this._app.route("/")
            .post((req: express.Request, res: express.Response) => {
                const files = req.files;
                if (files === undefined) {
                    return;
                }
                for (const fileName of Object.keys(files)) {
                    const file = files[fileName];
                    // Not sure how this can be an array
                    // But it'll probably be fine if I just process it like this?
                    if (Array.isArray(file)) {
                        for (const subfile of file) {
                            try {
                                this.onFileUpload!(parseInt(req.body.token, 10), subfile, req.body.resourceID);
                            }
                            catch (err) {
                                console.log(err);
                                res.status(400)
                                   .send(err)
                                   .end();
                                return;
                            }
                        }
                        res.status(201)
                            .send("Upload successful")
                            .end();
                    }
                    else {
                        try {
                            this.onFileUpload!(parseInt(req.body.token, 10), file, req.body.resourceID);
                        }
                        catch (err) {
                            console.log(err);
                            res.status(400)
                                .send(err)
                                .end();
                            return;
                        }
                        res.status(201)
                            .send("Upload successful")
                            .end();
                    }
                }
            })
            .delete((req: express.Request, res: express.Response) => {
                try {
                    this.onFileDelete!(parseInt(req.body.token, 10), req.body.resourceID);
                }
                catch (err) {
                    console.log(err);
                    res.status(400)
                        .send(err)
                        .end();
                    return;
                }
                res.status(201)
                    .send("Deletion successful")
                    .end();
            });
    }
    public host() {
        this._app.listen(this._port, () => {
            console.log("Resource server started.");
        });
    }
    public async add(resource: Resource, file: UploadedFile): Promise<Resource> {
        await fs.outputFile(this._resourcePath + resource.id, file.data);
        this._resourceContentType.set(resource.id, file.mimetype);
        return resource;
    }
    public async update(resource: Resource, file: UploadedFile): Promise<Resource> {
        await fs.outputFile(this._resourcePath + resource.id, file.data);
        this._resourceContentType.set(resource.id, file.mimetype);
        return resource;
    }
    public async delete(resource: Resource): Promise<void> {
        this._resourceContentType.delete(resource.id);
        await fs.unlink(this._resourcePath + resource.id);
    }
    public async loadTextResource(resourceID: string) {
        return fs.readFile(this._resourcePath + resourceID, "utf8");
    }
    // TODO: Change all functions with promises to async functions
}