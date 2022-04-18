import { Range } from "../list/range.ts";
import { Result, Ok, Err } from "./result.ts";
import {
  decode as utf8Decode,
  encode as utf8Encode,
} from "https://deno.land/std@0.82.0/encoding/utf8.ts";

export const DEFAULT_BUF_SIZE = 1024;

// get lines from stdin
async function readStdIn(): Promise<Result<string, string>> {
  const buffer = new Uint8Array(DEFAULT_BUF_SIZE);
  const n = await Deno.stdin.read(buffer);
  if (n == null) {
    return new Err("teip: No input from stdin.");
  }

  const input = utf8Decode(buffer.subarray(0, n));

  if (input.length == 0) {
    return new Err("teip: Invalid arguments.");
  }

  return new Ok(input);
}

async function execCommands(
  command: string[],
  input: string,
  lineEnd: string
): Promise<Result<string, string>> {
  const p = Deno.run({
    cmd: ["bash"],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  await p.stdin?.write(utf8Encode(`echo -n '${input}' | ${command.join(" ")}`));
  await p.stdin?.close();
  const output = await p.output();
  if (output.length == 0) {
    if (input.length == 0) {
      return new Ok("");
    }
    return new Err("teip: Output of given commands is exhausted");
  }
  let str = utf8Decode(output);
  if (str.slice(-1) == lineEnd) {
    str = str.slice(0, -1);
  }
  return new Ok(str);
}

export async function write(
  result: string | string[],
  lineEnd: string
): Promise<void> {
  const output =
    typeof result == "object"
      ? result
          .map((l) => {
            if (l.slice(-1) == lineEnd) {
              return l.slice(0, -1);
            }
            return l;
          })
          .join(lineEnd) + lineEnd
      : result + lineEnd;
  await Deno.stdout.write(utf8Encode(output));
}

// process -l option
export async function processLine(
  cmds: string[],
  ranges: Range[],
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];

  if (input.isErr()) {
    write(input.value, "\n");
    exitCode = 1;
  }

  if (input.isOk()) {
    const lines = input.value.slice(0, -1).split(lineEnd);

    let range = ranges.shift();
    let low = range ? range.low : Range.MAX;
    let high = range ? range.high : Range.MAX;

    for (const [index, line] of lines.entries()) {
      const n = index + 1;
      if (high < n) {
        range = ranges.shift();
        low = range ? range.low : Range.MAX;
        high = range ? range.high : Range.MAX;
      }
      if (low <= n && n <= high) {
        const output = await execCommands(cmds, line, lineEnd);

        res.push(output.value);
        if (output.isErr()) {
          exitCode = 1;
          break;
        }
      } else {
        res.push(line);
      }
    }
  }

  await write(res, lineEnd);

  Deno.exit(exitCode);
}

export async function processRegexLine(
  cmds: string[],
  regex: string,
  invert: boolean,
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];

  if (input.isOk()) {
    const lines = input.value.slice(0, -1).split(lineEnd);

    for (const line of lines) {
      const matched = line.match(regex);
      let output: Result<string, string>;

      if (matched) {
        if (invert) {
          output = new Ok(line);
        } else {
          output = await execCommands(cmds, line, lineEnd);
        }
      } else {
        if (invert) {
          output = await execCommands(cmds, line, lineEnd);
        } else {
          output = new Ok(line);
        }
      }

      res.push(output.value);
      if (output.isErr()) {
        exitCode = 1;
        break;
      }
    }

    await write(res, lineEnd);

    if (input.isErr()) {
      write(input.value, "\n");
      exitCode = 1;
    }

    Deno.exit(exitCode);
  }
}

export async function processRegexPattern(
  cmds: string[],
  pattern: string,
  invert: boolean,
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];

  if (input.isOk()) {
    const lines = input.value.slice(0, -1).split(lineEnd);

    loop: for (const line of lines) {
      const ranges = Range.fromRegex(line, pattern, invert);
      let subString = "";
      let last = 0;
      for (const range of ranges) {
        const low = range.low - 1;
        const high = range.high - 1;

        const notMatchedPart = line.slice(last, low);
        const matchedPart = line.slice(low, high + 1);

        const processed = await execCommands(cmds, matchedPart, lineEnd);

        if (processed.isOk()) {
          subString += notMatchedPart + processed.value;
        }
        if (processed.isErr()) {
          res.push(subString);
          res.push(processed.value);
          break loop;
        }
        last = high + 1;
      }
      // add remained not matched part
      subString += line.slice(last, line.length);
      res.push(subString);
    }
  }
  await write(res, lineEnd);

  if (input.isErr()) {
    write(input.value, "\n");
    exitCode = 1;
  }

  Deno.exit(exitCode);
}
