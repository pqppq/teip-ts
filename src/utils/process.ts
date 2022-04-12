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
  input: string
): Promise<Result<string, string>> {
  const p = Deno.run({
    cmd: ["bash"],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  await p.stdin?.write(utf8Encode(`echo -n ${input} | ${command.join(" ")}`));
  await p.stdin?.close();
  const exitCode = (await p.status()).code;
  const output = await p.output();

  if (output.length == 0) {
    return new Err("teip: Output of given commands is exhausted");
  }
  return new Ok(utf8Decode(output));
}

export async function write(
  result: string | string[],
  lineEnd: string
): Promise<void> {
  const output =
    typeof result == "object"
      ? result.join(lineEnd) + lineEnd
      : result + lineEnd;
  await Deno.stdout.write(utf8Encode(output));
}

// process -l option
export async function processLine(
  cmds: string[],
  lineList: Range[],
  lineEnd: string
): Promise<void> {
  const input = await readStdIn();

  const res: string[] = [];

  if (input.isOk()) {
    const lines = input.value.slice(0, -1).split(lineEnd);

    let range = lineList.shift();
    let low = range ? range.low : Range.MAX;
    let high = range ? range.high : Range.MAX;

    for (const [index, line] of lines.entries()) {
      const n = index + 1;
      if (high < n) {
        range = lineList.shift();
        low = range ? range.low : Range.MAX;
        high = range ? range.high : Range.MAX;
      }
      if (low <= n && n <= high) {
        const output = await execCommands(cmds, line);
        if (output.isOk()) {
          res.push(output.value.trimEnd());
        }
        if (output.isErr()) {
          await write(output.value, lineEnd);
          await write(res, lineEnd);
          Deno.exit(1);
        }
      } else {
        res.push(line);
      }
    }
  }

  await write(res, lineEnd);

  let exitCode = 0;
  if (input.isErr()) {
    write(input.value, lineEnd);
    exitCode = 1;
  }

  Deno.exit(exitCode);
}
