import request from "supertest";
import { app } from "../../app";

it("fails when a unauthorized", async () => {
  await request(app)
    .post(`${global.apiPrefix}/cart/confirm`)
    .send({})
    .expect(401);
});