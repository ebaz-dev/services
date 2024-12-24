import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../app";

declare global {
  var signin: () => Promise<string[]>;
  var apiPrefix: string;
}

jest.mock("../nats-wrapper");

let mongo: any;
beforeAll(async () => {
  process.env.JWT_KEY = "asdfasdf";
  process.env.NODE_ENV = "test";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri, {});
});

beforeEach(async () => {
  const collections = await mongoose.connection.db?.collections();

  if (!collections) {
    return;
  }

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});

global.signin = async () => {
  const email = "test@test.com";
  const password = "password";
  const deviceType = "web";
  const deviceName = "jest test";

  const response = await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email,
      password,
    })
    .expect(201);

  await request(app)
    .post(`${global.apiPrefix}/confirm-user`)
    .send({
      email: email,
      confirmationCode: response.body.confirmationCode,
    })
    .expect(200);

  const signedUser = await request(app)
    .post(`${global.apiPrefix}/signIn`)
    .send({
      email,
      password,
      deviceType,
      deviceName,
    })
    .expect(200);

  const cookie = signedUser.get("Set-Cookie");

  return cookie ?? [];
};

global.apiPrefix = "/api/v1/users";
