import request from "supertest";
import { app } from "../../app";

it("fails when a email that does not exist is supplied", async () => {
  await request(app)
    .post(`${global.apiPrefix}/signin`)
    .send({
      email: "test@test.com",
      password: "password",
    })
    .expect(400);
});

it("fails when an incorrect password is supplied", async () => {
  await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email: "test@test.com",
      password: "password",
    })
    .expect(201);

  await request(app)
    .post(`${global.apiPrefix}/signin`)
    .send({
      email: "test@test.com",
      password: "aslkdfjalskdfj",
    })
    .expect(400);
});

it("responds with a cookie when given valid credentials and user confirmed", async () => {
  const deviceType = "web";
  const deviceName = "jest test";

  const registeredUser = await request(app)
    .post(`${global.apiPrefix}/signup`)
    .send({
      email: "test@test.com",
      password: "password",
    })
    .expect(201);

  await request(app)
    .post(`${global.apiPrefix}/confirm-user`)
    .send({
      email: "test@test.com",
      confirmationCode: registeredUser.body.confirmationCode,
    })
    .expect(200);

  const response = await request(app)
    .post(`${global.apiPrefix}/signin`)
    .send({
      email: "test@test.com",
      password: "password",
      deviceName,
      deviceType,
    })
    .expect(200);

  console.log("BODY ----", response);

  expect(response.get("Set-Cookie")).toBeDefined();
});
