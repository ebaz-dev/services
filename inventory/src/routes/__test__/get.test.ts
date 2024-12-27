import request from "supertest";
import { app } from "../../app";

const apiPrefix = "/api/v1/inventory";

it("fails when an invalid ID is provided", async () => {
  await request(app).get(`${apiPrefix}/invalid-id`).expect(400);
});
