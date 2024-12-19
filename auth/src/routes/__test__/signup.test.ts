import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

it("returns a 201 on successful signup", async () => {
  return request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email: "test@test.com",
      password: "password",
    })
    .expect(201);
});

it("returns a 400 with an invalid email", async () => {
  return request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email: "alskdflaskjfd",
      password: "password",
    })
    .expect(400);
});

it("returns a 400 with an invalid password", async () => {
  return request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email: "alskdflaskjfd",
      password: "p",
    })
    .expect(400);
});

it("returns a 400 with missing email and password", async () => {
  await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email: "test@test.com",
    })
    .expect(400);

  await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      password: "alskjdf",
    })
    .expect(400);
});

it("disallows duplicate emails", async () => {
  const email = "test@test.com";
  const password = "password";

  const registeredUser = await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email,
      password,
    })
    .expect(201);

  await request(app)
    .post(`${global.apiPrefix}/confirm-user`)
    .send({
      email,
      confirmationCode: registeredUser.body.confirmationCode,
    })
    .expect(200);

  await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email,
      password,
    })
    .expect(400);
});

it("sets set confirmation code and expire time after signup", async () => {
  const response = await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email: "test@test.com",
      password: "password",
    })
    .expect(201);

  expect(response.body.confirmationCode).toBeDefined();
  expect(response.body.confirmationCodeExpiresAt).toBeDefined();
});

it("how to be call publish after an successful signup", async () => {
  const response = await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email: "test@test.com",
      password: "password",
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
