const request = require("supertest");
const app = require("../src/app");

describe("API smoke", () => {
    it("GET /api/v1/health", async () => {
        const res = await request(app).get("/api/v1/health");
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    it("GET public daily returns JSON", async () => {
        const res = await request(app).get(
            "/api/v1/public/highlights/daily?limit=3"
        );
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("timezone");
        expect(res.body).toHaveProperty("highlights");
    });
});
