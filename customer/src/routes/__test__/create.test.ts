import request from "supertest";
import { app } from "../../app";

it("fails when unauhtorized", async () => {
  await request(app)
    .post(`${global.apiPrefix}/create`)
    .send({
      type: "supplier",
      regNo: "690608",
      address: "Ulaanbaatar, Mongolia",
      phone: "80995566",
    })
    .expect(401);
});
