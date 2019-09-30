import fs from "fs-extra";
import ResourceServer from "networking/resource-server";
import request from "supertest";

jest.mock("fs");

let resourceServer!: ResourceServer;
let app!: Express.Application;

beforeEach(() => {
    resourceServer = new ResourceServer({port: "7778", resourcePath: ""});
    app = (resourceServer as any)._app;
});

describe("ResourceServer", () => {
    test("can handle file uploads", (done) => {
        const file = Buffer.from("test", "utf8");
        const fileUpload = jest.fn();
        resourceServer.onFileUpload = fileUpload;
        request(app)
            .post("/")
            .field("token", "123")
            .attach("files[]", file, {filename: "test.txt", contentType: "text/plain"})
            .expect(201)
            .end(() => {
                expect(fileUpload).toHaveBeenCalledTimes(1);
                expect(fileUpload.mock.calls[0][0]).toEqual(123);
                expect(fileUpload.mock.calls[0][1].mimetype).toEqual("text/plain");
                expect(fileUpload.mock.calls[0][1].data).toEqual(file);
                done();
            });
    });

    test("can handle file reuploads", (done) => {
        const file = Buffer.from("test", "utf8");
        const fileUpload = jest.fn();
        resourceServer.onFileUpload = fileUpload;
        request(app)
            .post("/")
            .field("token", "123")
            .field("resourceID", "testResource")
            .attach("files[]", file, {filename: "test.txt", contentType: "text/plain"})
            .expect(201)
            .end(() => {
                expect(fileUpload).toHaveBeenCalledTimes(1);
                expect(fileUpload.mock.calls[0][0]).toEqual(123);
                expect(fileUpload.mock.calls[0][1].mimetype).toEqual("text/plain");
                expect(fileUpload.mock.calls[0][1].data).toEqual(file);
                expect(fileUpload.mock.calls[0][2]).toEqual("testResource");
                done();
            });
    });

    test("can handle file deletion", (done) => {
        const fileDelete = jest.fn();
        resourceServer.onFileDelete = fileDelete;
        request(app)
            .delete("/")
            .field("token", "123")
            .field("resourceID", "testResource")
            .expect(201)
            .end(() => {
                expect(fileDelete).toHaveBeenCalledTimes(1);
                expect(fileDelete.mock.calls[0][0]).toEqual(123);
                expect(fileDelete.mock.calls[0][1]).toEqual("testResource");
                done();
            });
    });
});
