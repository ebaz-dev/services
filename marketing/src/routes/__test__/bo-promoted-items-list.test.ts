import request from "supertest";
import { app } from "../../app";

const apiPrefix = `/api/v1/marketing/bo/promoted-items/list`;

describe("GET /promoted-items/list", () => {
  it("fails with 401 Unauthorized when no authentication is provided", async () => {
    await request(app).get(apiPrefix).expect(401);
  });
});

// describe("GET /promoted-items", () => {
//   it("fails when invalid supplierId is provided", async () => {
//     const supplierId = "invalidSupplierId";

//     await request(app).get(apiPrefix).query({ supplierId }).expect(400);
//   });

//   it("fails when invalid type is provided", async () => {
//     const type = 123; // Invalid type, should be a string

//     await request(app).get(apiPrefix).query({ type }).expect(400);
//   });

//   it("fails when invalid isActive is provided", async () => {
//     const isActive = "notBoolean"; // Invalid isActive, should be a boolean

//     await request(app).get(apiPrefix).query({ isActive }).expect(400);
//   });

//   it("fails when invalid IDs are provided", async () => {
//     const ids = "invalidId1,invalidId2";

//     await request(app).get(apiPrefix).query({ ids }).expect(400);
//   });

//   it("returns a list of promoted items with valid query parameters", async () => {
//     const supplierId = "66f220e5714f4b10708c2409";
//     const type = "product";
//     const isActive = true;
//     const ids = "66f220e5714f4b10708c2409,66ebe3e3c0acbbab7824b195";

//     const response = await request(app)
//       .get(apiPrefix)
//       .query({ supplierId, type, isActive, ids })
//       .expect(200);

//     expect(response.body).toHaveProperty("data");
//     expect(response.body).toHaveProperty("total");
//     expect(response.body).toHaveProperty("totalPages");
//     expect(response.body).toHaveProperty("currentPage");
//   });

//   it("returns a list of promoted items with pagination", async () => {
//     const page = 2;
//     const limit = 5;

//     const response = await request(app)
//       .get(apiPrefix)
//       .query({ page, limit })
//       .expect(200);

//     expect(response.body).toHaveProperty("data");
//     expect(response.body).toHaveProperty("total");
//     expect(response.body).toHaveProperty("totalPages");
//     expect(response.body).toHaveProperty("currentPage");
//     expect(response.body.currentPage).toBe(page);
//   });
// });
