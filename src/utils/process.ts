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

async function sendPipeWithCommand(
  command: string[],
  input: string
): Promise<void> {
  const p = Deno.run({
    cmd: ["bash"],
    stdin: "piped",
    stdout: "inherit",
    stderr: "inherit",
  });
  await p.stdin?.write(utf8Encode(`echo -n ${input} | ${command.join(" ")}`));
  p.stdin.close();
}

async function sendPipe(input: string): Promise<void> {
  const p = Deno.run({
    cmd: ["echo", "-n", input],
    stdin: "null",
    stdout: "inherit",
    stderr: "inherit",
  });
}

// process -l option
export async function processLine(
  cmds: string[],
  lineList: Range[],
  lineEnd: string
): Promise<void> {
  const input = await readStdIn();
  let exitCode = 0;
  if (input.isErr()) {
    console.log(input.value);
    exitCode = 1;
  }

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
        await sendPipeWithCommand(cmds, line);
        await sendPipe(lineEnd);
      } else {
        await sendPipe(line);
        await sendPipe(lineEnd);
      }
    }
  }

  if (exitCode == 0) Deno.exit(0);
  else Deno.exit(1);
}
