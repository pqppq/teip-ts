import { Range } from "../src/list/range.ts";
import { assertEquals } from "https://deno.land/std@0.133.0/testing/asserts.ts";
import { Result, Ok, Err } from "../src/utils/result.ts";

Deno.test("range test from list", () => {
  const actual = Range.fromList("1-2,5-7").value;
  const expected = [new Range(1, 2), new Range(5, 7)];
  assertEquals(actual, expected);
});

Deno.test("range test from list", () => {
  const range = Range.fromList("1-2,3-4,6-7");
  const actual = range.value;
  const expected = [new Range(1, 4), new Range(6, 7)];
  assertEquals(actual, expected);
});

Deno.test("range test from list -v", () => {
  const range = Range.fromList("1-2,5-7");
  const actual = range.isOk()
    ? Range.complement(range.value)
    : [new Range(0, 0)];
  const expected = [new Range(3, 4), new Range(8, Range.MAX)];
  assertEquals(actual, expected);
});

Deno.test("range test from regex d+", () => {
  const line = "123abc456def";
  const pattern = "\\d+";
  const actual = Range.fromRegex(line, new RegExp(pattern, "g"), false);
  const expected = [new Range(1, 3), new Range(7, 9)];
  assertEquals(actual, expected);
});

Deno.test("range test from regex d+ -v", () => {
  const line = "123abc456def";
  const pattern = "\\d+";
  const actual = Range.fromRegex(line, new RegExp(pattern, "g"), true);
  const expected = [new Range(4, 6), new Range(10, Range.MAX)];
  assertEquals(actual, expected);
});

Deno.test("range test from regex [a-z]+", () => {
  const line = "123abc456def";
  const pattern = "[a-z]+";
  const actual = Range.fromRegex(line, new RegExp(pattern, "g"), false);
  const expected = [new Range(4, 6), new Range(10, Range.MAX)];
  assertEquals(actual, expected);
});

Deno.test("range test from regex [a-z]+ -v", () => {
  const line = "123abc456def";
  const pattern = "[a-z]+";
  const actual = Range.fromRegex(line, new RegExp(pattern, "g"), true);
  const expected = [new Range(1, 3), new Range(7, 9)];
  assertEquals(actual, expected);
});

Deno.test("range test from regex .\\n.", () => {
  const line = "ABC\nDEF\nGHI\nJKL\n";
  const pattern = ".\n.";
  const actual = Range.fromRegex(line, new RegExp(pattern, "g"), false);
  const expected = [new Range(3, 5), new Range(7, 9), new Range(11, 13)];
  assertEquals(actual, expected);
});

Deno.test("range test from delimiter ,", () => {
  const line = "AAA,BBB,CCC\n";
  const delimiter = ",";
  const actual = Range.fromDelimiter(line, delimiter, false);
  const expected = [new Range(1, 3), new Range(5, 7), new Range(9, Range.MAX)];
  assertEquals(actual, expected);
});

Deno.test("range test from delimiter , -v", () => {
  const line = "AAA,BBB,CCC\n";
  const delimiter = ",";
  const actual = Range.fromDelimiter(line, delimiter, true);
  const expected = [new Range(1, 3), new Range(5, 7), new Range(9, Range.MAX)];
  assertEquals(actual, expected);
});
