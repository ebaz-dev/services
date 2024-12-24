import request from "supertest";
import { app } from "../../app";

it("fails when a unauthorized", async () => {
  await request(app)
    .get(`${global.apiPrefix}/bo/order`)
    .send({})
    .expect(401);
});
