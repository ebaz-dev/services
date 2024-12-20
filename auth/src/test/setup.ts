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
  console.log("Test environment setup - NODE_ENV:", process.env.NODE_ENV);

  process.env.JWT_KEY = "asdfasdf";
  process.env.NODE_ENV = "test";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  });
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

  // Register user with error handling
  const signupResponse = await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email,
      password,
    });

  if (!signupResponse.body.confirmationCode) {
    throw new Error("No confirmation code received from signup");
  }

  // Confirm user with error handling
  const confirmResponse = await request(app)
    .post(`${global.apiPrefix}/confirm-user`)
    .send({
      email,
      confirmationCode: signupResponse.body.confirmationCode,
    });

  if (confirmResponse.status !== 200) {
    throw new Error(`User confirmation failed: ${confirmResponse.status}`);
  }

  // Sign in user with error handling
  const signInResponse = await request(app)
    .post(`${global.apiPrefix}/signin`)
    .send({
      email,
      password,
      deviceType,
      deviceName,
    });

  if (signInResponse.status !== 200) {
    throw new Error(`Sign in failed: ${signInResponse.status}`);
  }

  const cookie = signInResponse.get("Set-Cookie");
  if (!cookie) {
    console.error("Sign in response:", signInResponse.body);
    throw new Error("Failed to get authentication cookie");
  }

  if (!signInResponse.get("Set-Cookie")) {
    console.log("Debug - Sign in response headers:", signInResponse.headers);
    console.log("Debug - Sign in response body:", signInResponse.body);
    console.log("Debug - NODE_ENV:", process.env.NODE_ENV);
  }

  return cookie;
};

global.apiPrefix = "/api/v1/users";
