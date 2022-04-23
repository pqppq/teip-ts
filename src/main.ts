import {
  decode as utf8Decode,
  encode as utf8Encode,
} from "https://deno.land/std@0.82.0/encoding/utf8.ts";
import { parse } from "./utils/mod.ts";
import { Range } from "./list/range.ts";
import { listToRanges } from "./utils/converter.ts";

import { Result, Ok, Err } from "./utils/result.ts";
import {
  write,
  processLine,
  processRegexLine,
  processRegexPattern,
  processChar,
  processField,
  processRegexField,
} from "./utils/process.ts";

//  --help          Display this help and exit
//  --version       Show version and exit
//  -g <pattern>    Select lines that match the regular expression <pattern>
//  -o              -g selects only matched parts
//  -G              -g adopts Oniguruma regular expressions
//  -f <list>       Select only these white-space separated fields
//  -d <delimiter>  Use <delimiter> for field delimiter of -f
//  -D <pattern>    Use regular expression <pattern> for field delimiter of -f
//  -c <list>       Select only these characters
//  -l <list>       Select only these lines
//  -s              Execute command for each selected part
//  -v              Invert the sense of selecting
//  -z              Line delimiter is NUL instead of newline

async function main(): Promise<void> {
  const args = parse(Deno.args);

  const cmds = args["--"];
  const rest = args[""];

  const flagOnly = args["o"];
  const flagOnig = args["G"];
  const flagSolid = args["s"];
  const flagInvert = args["v"];
  const flagZero = args["z"];

  const flagRegex = args["g"] ? true : false;
  const flagChar = args["c"] ? true : false;
  const flagLines = args["l"] ? true : false;
  const flagField = args["f"] ? true : false;
  const flagDelimiter = args["d"] ? true : false;
  const flagRegexDelimiter = args["D"] ? true : false;

  const flags =
    Number(flagRegex) +
    Number(flagChar) +
    Number(flagLines) +
    Number(flagField);

  if (
    rest ||
    flags != 1 ||
    ((flagOnly || flagOnig) && !flagRegex) ||
    ((flagDelimiter || flagRegexDelimiter) && !flagField) ||
    (flagDelimiter && flagRegexDelimiter && flagField)
  ) {
    write("teip: Invalid arguments.", "\n");
    Deno.exit(1);
  }

  let lineEnd = "\n";
  // NUL is used as line delimiter
  if (flagZero) {
    lineEnd = "\x00"; // NUL character
  }

  const g = args["g"];
  let regexPattern: Result<string, string>;
  if (g == "") {
    regexPattern = new Ok("");
  } else if (g != "") {
    regexPattern = new Ok(g);
  } else {
    regexPattern = new Ok(
      "teip: Expected argument for flag '-g' but reached end of arguments."
    );
  }

  const c = args["c"];
  const charList: Result<Range[], string> =
    c != undefined ? listToRanges("-c", c, flagInvert) : new Ok([Range.ALL]);
  if (charList.isErr()) {
    write(charList.value, "\n");
    Deno.exit(1);
  }

  const f = args["f"];
  const fieldList: Result<Range[], string> =
    f != undefined ? listToRanges("-f", f, flagInvert) : new Ok([Range.ALL]);
  if (fieldList.isErr()) {
    write(fieldList.value, "\n");
    Deno.exit(1);
  }

  const l = args["l"];
  const lineList: Result<Range[], string> =
    l != undefined ? listToRanges("-l", l, flagInvert) : new Ok([Range.ALL]);
  if (lineList.isErr()) {
    write(lineList.value, "\n");
    Deno.exit(1);
  }

  const d = args["d"];
  const D = args["D"];
  const delimiter = d ? d : "";
  const regexDelimiter = D ? new RegExp(D, "g") : new RegExp("\\s+", "g");

  const flagDryrun: boolean = !cmds.length as boolean;

  const input = await readStdIn();
  if (input.isErr()) {
    write("teip: fail to read from stdin.", "\n");
  }
  const lines = input.value.split(lineEnd);

  // ***** Start processing *****

  let result: Result<string[], string[]> = new Ok([]);

  if (flagLines) {
    // -l <list>
    result = await processLine(
      lines,
      cmds,
      lineList.value,
      flagSolid,
      lineEnd,
      flagDryrun
    );
  } else if (!flagOnly && flagRegex) {
    if (flagOnig) {
      // -g <pattern> -G
      // TODO
      write("teip: Oniguruma option is not supported now.", "\n");
      Deno.exit(1);
    } else {
      // -g <pattern>
      result = await processRegexLine(
        lines,
        cmds,
        regexPattern.value,
        flagInvert,
        flagSolid,
        lineEnd,
        flagDryrun
      );
    }
  } else {
    const processed: string[] = [];
    for (const line of lines) {
      let output: Result<string, string> = new Ok("");
      if (flagRegex) {
        if (flagOnig) {
          // -g <pattern> -G -o
          // TODO
          output = new Err("teip: Oniguruma option is not supported now.");
        } else {
          // -g <pattern> -o
          const regex = new RegExp(regexPattern.value, "g");
          output = await processRegexPattern(
            line,
            cmds,
            regex,
            flagInvert,
            flagSolid,
            lineEnd,
            flagDryrun
          );
        }
      } else if (flagChar) {
        // -c <list>
        output = await processChar(
          line,
          cmds,
          charList.value,
          flagSolid,
          lineEnd,
          flagDryrun
        );
      } else if (flagField) {
        if (flagDelimiter) {
          // -f <list> -d <delimiter>
          output = await processField(
            line,
            cmds,
            fieldList.value,
            delimiter,
            flagSolid,
            lineEnd,
            flagDryrun
          );
        } else {
          // -f <list> -D <pattern>
          output = await processRegexField(
            line,
            cmds,
            fieldList.value,
            regexDelimiter,
            flagSolid,
            lineEnd,
            flagDryrun
          );
        }
      }

      processed.push(output.value);
      if (output.isErr()) {
        result = new Err(processed);
        break;
      }
    }
    result = new Ok(processed);
  }

  write(result.value, lineEnd);
  if (result.isOk()) {
    Deno.exit(0);
  } else {
    Deno.exit(1);
  }
}

// get lines from stdin
async function readStdIn(): Promise<Result<string, string>> {
  const DEFAULT_BUF_SIZE = 1024;
  const buffer = new Uint8Array(DEFAULT_BUF_SIZE);
  const n = await Deno.stdin.read(buffer);
  if (n == null) {
    return new Err("teip: No input from stdin.");
  }

  let input = utf8Decode(buffer.subarray(0, n));

  if (input.length == 0) {
    return new Err("teip: Invalid arguments.");
  }

  if (input.endsWith("\n")) {
    input = input.slice(0, -1);
  }

  return new Ok(input);
}

main();
