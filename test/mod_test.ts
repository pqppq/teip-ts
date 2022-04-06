import { parse } from "../src/utils/mod.ts";
import { assertEquals } from "https://deno.land/std@0.133.0/testing/asserts.ts";

Deno.test("parse test --version", () => {
  const args = ["--version"];
  const expected = {
    version: true,
    help: false,
    o: false,
    G: false,
    s: false,
    v: false,
    z: false,
    _: [],
    "--": [],
  };
  const actual = parse(args);
  assertEquals(actual, expected);
});

Deno.test("parse test --help", () => {
  const args = ["--help"];
  const expected = {
    version: false,
    help: true,
    o: false,
    G: false,
    s: false,
    v: false,
    z: false,
    _: [],
    "--": [],
  };
  const actual = parse(args);
  assertEquals(actual, expected);
});

Deno.test("parse test booleans", () => {
  const args = ["-o", "-G", "-s", "-v", "-z"];
  const expected = {
    version: false,
    help: false,
    o: true,
    G: true,
    s: true,
    v: true,
    z: true,
    _: [],
    "--": [],
  };
  const actual = parse(args);
  assertEquals(actual, expected);
});

Deno.test("args test string 1", () => {
  const args = ["-f", "1,2,3"];
  const expected = {
    version: false,
    help: false,
    o: false,
    G: false,
    s: false,
    v: false,
    z: false,
    f: "1,2,3",
    _: [],
    "--": [],
  };
  const actual = parse(args);
  assertEquals(actual, expected);
});

Deno.test("args test string 1", () => {
  const args = ["-f", "-1,2,3"];
  const expected = {
    version: false,
    help: false,
    o: false,
    G: false,
    s: false,
    v: false,
    z: false,
    f: "-1,2,3",
    _: [],
    "--": [],
  };
  const actual = parse(args);
  assertEquals(actual, expected);
});

Deno.test("args test mix", () => {
  const args = ["sushi", "-oGscf", "-1,2,3", "--", "sed", "s/./@/"];
  const expected = {
    version: false,
    help: false,
    o: true,
    G: true,
    s: true,
    v: false,
    z: false,
    c: "",
    f: "-1,2,3",
    _: ["sushi"],
    "--": ["sed", "s/./@/"],
  };
  const actual = parse(args);
  assertEquals(actual, expected);
});
