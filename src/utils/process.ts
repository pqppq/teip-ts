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
  solid: boolean,
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
    if (input.length == 0 || solid) {
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
  solid: boolean,
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];

  if (input.isOk()) {
    const lines = input.value.split(lineEnd);

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
        const output = await execCommands(cmds, line, solid, lineEnd);

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

  if (input.isErr()) {
    write(input.value, "\n");
    exitCode = 1;
  }

  Deno.exit(exitCode);
}

// process -g option
export async function processRegexLine(
  cmds: string[],
  regex: string,
  invert: boolean,
  solid: boolean,
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];

  if (input.isOk()) {
    const lines = input.value.split(lineEnd);

    for (const line of lines) {
      const matched = line.match(regex);
      let output: Result<string, string>;

      if (matched) {
        if (invert) {
          output = new Ok(line);
        } else {
          output = await execCommands(cmds, line, solid, lineEnd);
        }
      } else {
        if (invert) {
          output = await execCommands(cmds, line, solid, lineEnd);
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

// process -og
export async function processRegexPattern(
  cmds: string[],
  regex: RegExp,
  invert: boolean,
  solid: boolean,
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];

  if (input.isOk()) {
    const lines = input.value.split(lineEnd);

    loop: for (const line of lines) {
      const ranges = Range.fromRegex(line, regex, invert);
      let subString = "";
      let last = 0;
      for (const range of ranges) {
        const low = range.low - 1;
        const high = range.high - 1;

        const notMatchedPart = line.slice(last, low);
        const matchedPart = line.slice(low, high + 1);

        const processed = await execCommands(cmds, matchedPart, solid, lineEnd);

        subString += notMatchedPart;
        if (processed.isOk()) {
          subString += processed.value;
        }
        if (processed.isErr()) {
          exitCode = 1;
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

// process -c option
export async function processChar(
  cmds: string[],
  ranges: Range[],
  solid: boolean,
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];

  if (input.isOk()) {
    const lines = input.value.split(lineEnd);

    loop: for (const line of lines) {
      let subString = "";
      let last = 0;
      for (const range of ranges) {
        const low = range.low - 1;
        const high = range.high - 1;

        const notSelectedPart = line.slice(last, low);
        const selectedPart = line.slice(low, high + 1);

        const processed = await execCommands(
          cmds,
          selectedPart,
          solid,
          lineEnd
        );

        subString += notSelectedPart;
        if (processed.isOk()) {
          subString += processed.value;
        }
        if (processed.isErr()) {
          exitCode = 1;
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

// process -f -d <delimiter>
export async function processField(
  cmds: string[],
  ranges: Range[],
  delimiter: string,
  solid: boolean,
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];
  if (input.isOk()) {
    const lines = input.value.split(lineEnd);
    loop: for (const line of lines) {
      const parts = line.split(delimiter);
      let ri = 0;
      const subString = [];

      for (const [i, part] of parts.entries()) {
        if (ranges[ri].high < i + 1 && ri + 1 < ranges.length) {
          ri += 1;
        }
        if (ranges[ri].low <= i + 1 && i + 1 <= ranges[ri].high) {
          const processed = await execCommands(cmds, part, solid, lineEnd);
          if (processed.isOk()) {
            subString.push(processed.value);
          }
          if (processed.isErr()) {
            res.push(subString.join(delimiter));
            res.push(processed.value);
            break loop;
          }
        } else {
          subString.push(part);
        }
      }
      res.push(subString.join(delimiter));
    }
  }

  await write(res, lineEnd);

  if (input.isErr()) {
    write(input.value, "\n");
    exitCode = 1;
  }

  Deno.exit(exitCode);
}

// process -f -D <pattern>
export async function processRegexField(
  cmds: string[],
  ranges: Range[],
  regexDelimiter: RegExp,
  solid: boolean,
  lineEnd: string
): Promise<void> {
  let exitCode = 0;
  const input = await readStdIn();
  const res: string[] = [];

  if (input.isOk()) {
    const lines = input.value.split(lineEnd);

    loop: for (const line of lines) {
      const parts = line.split(regexDelimiter);
      const delimiters = line.match(regexDelimiter);
      let subString = "";
      let ri = 0;

      for (let [i, part] of parts.entries()) {
        if (ranges[ri].high < i + 1 && ri + 1 < ranges.length) {
          ri += 1;
        }
        if (ranges[ri].low <= i + 1 && i + 1 <= ranges[ri].high) {
          if (part == "") {
            part = " ";
          }
          const processed = await execCommands(cmds, part, solid, lineEnd);
          if (processed.isOk()) {
            subString += processed.value;
          }
          if (processed.isErr()) {
            res.push(subString);
            res.push(processed.value);
            break loop;
          }
        } else {
          subString += part;
        }
        const delimiter = delimiters?.length ? delimiters.shift() : "";
        subString += delimiter;
      }
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
