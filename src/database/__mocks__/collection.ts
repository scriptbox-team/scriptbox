const mock = jest.fn().mockImplementation((...args: any): any => {
    const data = [];
    return {
        insert: async (document: object) => {
            data.push(document);
        },
        insertMany: async (document: object[]) => { },
        update: async (id: string, document: object) => { },
        delete: async (id: string) => { },
        get: async (id: string) => { },
        getMany: async (getBy: object, sort: object = {}) => { },
        drop: async () => { }
    };
});

export default mock;
