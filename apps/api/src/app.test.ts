import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app";

describe("API integration", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves the public health endpoint", async () => {
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "online" });
  });

  it("protects server routes with JWT authentication", async () => {
    const response = await app.inject({ method: "GET", url: "/api/servers" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ message: "Unauthorized" });
  });
});
