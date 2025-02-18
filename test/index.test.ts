import "./setup";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, afterEach, test, expect } from "vitest";
import { listen, Listener } from "../src";

// eslint-disable-next-line no-console
// console.log = fn()

function handle (request: IncomingMessage, response: ServerResponse) {
  response.end(request.url);
}

describe("listhen", () => {
  let listener: Listener | undefined;

  afterEach(async () => {
    if (listener) {
      await listener.close();
      listener = undefined;
    }
  });

  test("listen (no args)", async () => {
    listener = await listen(handle);
    expect(listener.url.startsWith("http://")).toBe(true);
  });

  test("listen (http)", async () => {
    listener = await listen(handle, {
      isTest: false,
      autoClose: false,
      baseURL: "/foo/bar"
    });
    expect(listener.url.startsWith("http://")).toBe(true);
    expect(listener.url.endsWith("/foo/bar")).toBe(true);
    // eslint-disable-next-line no-console
    // expect(console.log).toHaveBeenCalledWith(expect.stringMatching('\n  > Local:    http://localhost:3000/foo/bar'))
  });

  test("listen (https - selfsigned)", async () => {
    listener = await listen(handle, { https: true });
    expect(listener.url.startsWith("https://")).toBe(true);
  });

  test("listen (https - custom)", async () => {
    listener = await listen(handle, {
      https: {
        // eslint-disable-next-line unicorn/prefer-module
        key: resolve(__dirname, "fixture/cert/key.pem"),
        // eslint-disable-next-line unicorn/prefer-module
        cert: resolve(__dirname, "fixture/cert/cert.pem")
      }
    });
    expect(listener.url.startsWith("https://")).toBe(true);
  });

  test("double close", async () => {
    listener = await listen(handle, { isTest: false });
    await listener.close();
    await listener.close();
  });

  test("autoClose", async () => {
    /* not passing close */ await listen(handle);
    // @ts-ignore
    process.emit("exit");
  });

  test("pass hostname to get-port-please", async () => {
    listener = await listen(handle, { hostname: "127.0.0.1" });
    expect(listener.url.startsWith("http://127.0.0.1")).toBe(true);
  });

  test("pass port to get-port-please", async () => {
    listener = await listen(handle, { port: 40_000 });
    expect(listener.url.endsWith(":40000/")).toBe(true);
  });

  test("pass extended options to get-port-please", async () => {
    listener = await listen(handle, { port: { port: 5000, portRange: [50_000, 59_999] } });
    expect(listener.url).toMatch(/:5\d{4}\/$/);
  });
});
