import { Cacheability } from "cacheability";
import { expect } from "chai";
import * as delay from "delay";
import { get } from "lodash";
import * as sinon from "sinon";
import testData from "../data";
import { Cachemap, DefaultCachemap, WorkerCachemap } from "../../src";

import {
  CacheHeaders,
  ConstructorArgs,
  Metadata,
  ObjectMap,
  StoreProxyTypes,
} from "../../src/types";

const clientArgs: ConstructorArgs = {
  name: "client",
  use: { client: "localStorage" },
};

const workerArgs: ConstructorArgs = {
  indexedDBOptions: {
    databaseName: "alfa-database",
    objectStoreName: "alfa",
  },
  name: "worker",
  use: { client: "indexedDB" },
};

const serverArgs: ConstructorArgs = {
  mockRedis: true,
  name: "server",
  use: { server: "redis" },
};

const mapArgs: ConstructorArgs = {
  name: "map",
  use: { server: "map" },
};

describe("the Cachemap.create method", () => {
  if (process.env.WEB_ENV) {
    context("when the environment is a browser", () => {
      context("when use.client is set to 'indexedDB'", () => {
        it("the method should return an instance of the WorkerCachemap class that uses indexedDB", async () => {
          const workerCachemap = await Cachemap.create(workerArgs) as WorkerCachemap;
          expect(workerCachemap).to.be.instanceof(WorkerCachemap);
          workerCachemap.terminate();
        });
      });

      context("when use.client is set to 'localStorage'", () => {
        it("the method should return an instance of the Cachemap class that uses local storage", async () => {
          const cachemap = await Cachemap.create(clientArgs);
          expect(cachemap).to.be.instanceof(DefaultCachemap);
        });
      });
    });
  } else {
    context("when the environment is a server", () => {
      context("when use.server is set to 'redis'", () => {
        it("the method should return an instance of the Cachemap class that uses redis", async () => {
          const cachemap = await Cachemap.create(serverArgs);
          expect(cachemap).to.be.instanceof(DefaultCachemap);
        });
      });
    });
  }
});

function testCachemapClass(args: ConstructorArgs): void {
  describe(`the cachemap class for the ${args.name}`, () => {
    const key: string = testData["136-7317"].url;
    const value: ObjectMap = testData["136-7317"].body;
    const cacheHeaders: CacheHeaders = { cacheControl: "public, max-age=1" };
    const hash = true;
    let cachemap: DefaultCachemap | WorkerCachemap;

    describe("the delete method", () => {
      beforeEach(async () => {
        cachemap = await Cachemap.create(args);
        await cachemap.set(key, value, { cacheHeaders, hash });
      });

      afterEach(async () => {
        await cachemap.clear();
        if (cachemap instanceof WorkerCachemap) cachemap.terminate();
      });

      context("when a key exists in the cachemap", () => {
        it("then the method should delete the key/value pair", async () => {
          await cachemap.delete(key, { hash });

          if (args.name === "map") {
            expect(await cachemap.size()).to.eql(0);
          } else {
            expect(await cachemap.size()).to.eql(1);
          }

          expect(cachemap.metadata).lengthOf(0);
        });
      });

      context("when the database throws an exception", () => {
        const message = "Oops, there seems to be a problem";
        let stub: sinon.SinonStub;

        beforeEach(() => {
          if (args.name === "worker") return;
          const storeClient: StoreProxyTypes = get(cachemap, ["_store"]);
          const error = new Error(message);
          stub = sinon.stub(storeClient, "set").rejects(error);
        });

        afterEach(() => {
          if (args.name === "worker") return;
          stub.restore();
        });

        it("then the method should return a rejected promise with the reason", async () => {
          try {
            await cachemap.delete(key, { hash, stub: true });
          } catch (error) {
            expect(error.message).to.equal(message);
          }
        });
      });
    });

    describe("the get method", () => {
      let metadata: Metadata;

      beforeEach(async () => {
        cachemap = await Cachemap.create(args);
        await cachemap.set(key, value, { cacheHeaders, hash });
        metadata = { ...cachemap.metadata[0] };
      });

      afterEach(async () => {
        await cachemap.clear();
        if (cachemap instanceof WorkerCachemap) cachemap.terminate();
      });

      context("when a key exists in the cachemap", () => {
        it("then the method should return the value and update the metadata", async () => {
          const result = await cachemap.get(key, { hash });
          expect(result).to.deep.equal(value);
          const updatedMetadata = cachemap.metadata[0];
          expect(updatedMetadata.accessedCount).to.equal(1);
          expect(updatedMetadata.added).to.equal(metadata.added);
          expect(updatedMetadata.cacheability).to.deep.equal(metadata.cacheability);
          expect(updatedMetadata.key).to.equal(metadata.key);
          expect(updatedMetadata.lastAccessed >= metadata.lastAccessed).to.equal(true);
          expect(updatedMetadata.lastUpdated).to.equal(metadata.lastUpdated);
          expect(updatedMetadata.size).to.equal(metadata.size);
        });
      });

      context("when the database throws an exception", () => {
        const message = "Oops, there seems to be a problem";
        let stub: sinon.SinonStub;

        beforeEach(() => {
          if (args.name === "worker") return;
          const storeClient: StoreProxyTypes = get(cachemap, ["_store"]);
          const error = new Error(message);
          stub = sinon.stub(storeClient, "set").rejects(error);
        });

        afterEach(() => {
          if (args.name === "worker") return;
          stub.restore();
        });

        it("then the method should return a rejected promise with the reason", async () => {
          try {
            await cachemap.get(key, { hash, stub: true });
          } catch (error) {
            expect(error.message).to.equal(message);
          }
        });
      });
    });

    describe("the has method", () => {
      before(async () => {
        cachemap = await Cachemap.create(args);
        await cachemap.set(key, value, { cacheHeaders, hash });
      });

      after(async () => {
        await cachemap.clear();
        if (cachemap instanceof WorkerCachemap) cachemap.terminate();
      });

      context("when a key exists in the cachemap", () => {
        it("then the method should return the key's cacheability object", async () => {
          const cacheability = await cachemap.has(key, { hash }) as Cacheability;
          expect(cacheability).to.be.instanceof(Cacheability);
          const cacheControl = cacheability.metadata.cacheControl;
          expect(cacheControl.public).to.equal(true);
          expect(cacheControl.maxAge).to.equal(1);
        });
      });

      context("when an expired key exists in the cachemap and deleteExpired is passed in", () => {
        it("then the method should return false and delete the expired key/value pair", async () => {
          await delay(1000);
          const cacheability = await cachemap.has(key, { deleteExpired: true, hash }) as false;
          expect(cacheability).to.equal(false);

          if (args.name === "map") {
            expect(await cachemap.size()).to.eql(0);
          } else {
            expect(await cachemap.size()).to.eql(1);
          }

          expect(cachemap.metadata).lengthOf(0);
        });
      });

      context("when no key exists in the cachemap", () => {
        it("then the method should return false", async () => {
          const cacheability = await cachemap.has(key, { hash }) as false;
          expect(cacheability).to.equal(false);
        });
      });

      context("when the database throws an exception", () => {
        const message = "Oops, there seems to be a problem";
        let stub: sinon.SinonStub;

        before(async () => {
          await cachemap.set(key, value, { cacheHeaders, hash });
          if (args.name === "worker") return;
          const storeClient: StoreProxyTypes = get(cachemap, ["_store"]);
          const error = new Error(message);
          stub = sinon.stub(storeClient, "set").rejects(error);
        });

        after(() => {
          if (args.name === "worker") return;
          stub.restore();
        });

        it("then the method should return a rejected promise with the reason", async () => {
          try {
            await cachemap.has(key, { deleteExpired: true, hash, stub: true });
          } catch (error) {
            expect(error.message).to.equal(message);
          }
        });
      });
    });

    describe("the set method", () => {
      let metadata: Metadata;

      before(async () => {
        cachemap = await Cachemap.create(args);
      });

      after(async () => {
        await cachemap.clear();
        if (cachemap instanceof WorkerCachemap) cachemap.terminate();
      });

      context("when a key does not exist in the cachemap", () => {
        it("then the method should store the pair and add its metadata", async () => {
          await cachemap.set(key, value, { cacheHeaders, hash });

          if (args.name === "map") {
            expect(await cachemap.size()).to.eql(1);
          } else {
            expect(await cachemap.size()).to.eql(2);
          }

          expect(cachemap.metadata).lengthOf(1);
          metadata = { ...cachemap.metadata[0] };
          expect(metadata.accessedCount).to.equal(0);
          expect(metadata.added).to.be.a("number");
          expect(metadata.cacheability).to.be.instanceOf(Cacheability);
          expect(metadata.key).to.be.a("string");
          expect(metadata.lastAccessed).to.be.a("number");
          expect(metadata.lastUpdated).to.be.a("number");
          expect(metadata.size).to.be.a("number");
        });
      });

      context("when a key already exists in the cachemap", () => {
        it("then the method should overwrite the existing value and update the metadata", async () => {
          await cachemap.set(key, value, { cacheHeaders, hash });

          if (args.name === "map") {
            expect(await cachemap.size()).to.eql(1);
          } else {
            expect(await cachemap.size()).to.eql(2);
          }

          expect(cachemap.metadata).lengthOf(1);
          const updatedMetadata = cachemap.metadata[0];
          expect(updatedMetadata.accessedCount).to.equal(0);
          expect(updatedMetadata.added).to.equal(metadata.added);
          expect(updatedMetadata.cacheability.metadata.ttl >= metadata.cacheability.metadata.ttl).to.equal(true);
          expect(updatedMetadata.key).to.equal(metadata.key);
          expect(updatedMetadata.lastAccessed).to.equal(metadata.lastAccessed);
          expect(updatedMetadata.lastUpdated >= metadata.lastUpdated).to.equal(true);
          expect(updatedMetadata.size).to.equal(metadata.size);
        });
      });

      context("when the database throws an exception", () => {
        const message = "Oops, there seems to be a problem";
        let stub: sinon.SinonStub;

        before(() => {
          if (args.name === "worker") return;
          const storeClient: StoreProxyTypes = get(cachemap, ["_store"]);
          const error = new Error(message);
          stub = sinon.stub(storeClient, "set").rejects(error);
        });

        after(() => {
          if (args.name === "worker") return;
          stub.restore();
        });

        it("then the method should return a rejected promise with the reason", async () => {
          try {
            await cachemap.set(key, value, { cacheHeaders, hash, stub: true });
          } catch (error) {
            expect(error.message).to.equal(message);
          }
        });
      });
    });
  });
}

if (process.env.WEB_ENV) {
  testCachemapClass(clientArgs);
  testCachemapClass(workerArgs);
} else {
  testCachemapClass(serverArgs);
  testCachemapClass(mapArgs);
}
