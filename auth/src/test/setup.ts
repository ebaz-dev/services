import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../app";

declare global {
  var signin: () => Promise<string[]>;
  var apiPrefix: string;
}

jest.mock("../nats-wrapper");

let mongo: MongoMemoryServer;
beforeAll(async () => {
  process.env.JWT_KEY = "asdfasdf";
  process.env.NODE_ENV = "test";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri);
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
  try {
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
});

global.signin = async () => {
  const email = "test@test.com";
  const password = "password";
  const deviceType = "web";
  const deviceName = "jest test";

  // Register user
  const signupResponse = await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email,
      password,
    });

  // Confirm user
  await request(app).post(`${global.apiPrefix}/confirm-user`).send({
    email,
    confirmationCode: signupResponse.body.confirmationCode,
  });

  // Sign in user
  const signInResponse = await request(app)
    .post(`${global.apiPrefix}/signin`)
    .send({
      email,
      password,
      deviceType,
      deviceName,
    });

  const cookie = signInResponse.get("Set-Cookie");
  if (!cookie) {
    throw new Error("Failed to get authentication cookie");
  }

  return cookie;
};

global.apiPrefix = "/api/v1/users";
