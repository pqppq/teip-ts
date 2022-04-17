import { parse } from "./utils/mod.ts";
import { Range } from "./list/range.ts";
import { listToRanges } from "./utils/converter.ts";
import { Result, Ok, Err } from "./utils/result.ts";
import {
  write,
  processLine,
  processRegexLine,
  processRegexPattern,
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

const args = Deno.args;

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

  let lineEnd = "\n";
  // NUL is used as line delimiter
  if (flagZero) {
    lineEnd = String.fromCharCode(0, 16); // NUL character
  }

  const g = args["g"];
  let regex: Result<string, string>;
  if (g == "") {
    regex = new Ok("");
  } else if (g != "") {
    regex = new Ok(g);
  } else {
    regex = new Err(
      "teip: Expected argument for flag '-g' but reached end of arguments."
    );
  }

  const c = args["c"];
  const charList: Result<Range[], string> =
    c != undefined ? listToRanges("-c", c, flagInvert) : new Ok([Range.ALL]);
  if (charList.isErr()) {
    write(charList.value);
    Deno.exit(1);
  }

  const f = args["f"];
  const fieldList: Result<Range[], string> =
    f != undefined ? listToRanges("-f", f, flagInvert) : new Ok([Range.ALL]);
  if (fieldList.isErr()) {
    write(fieldList.value);
    Deno.exit(1);
  }

  const l = args["l"];
  const lineList: Result<Range[], string> =
    l != undefined ? listToRanges("-l", l, flagInvert) : new Ok([Range.ALL]);
  if (lineList.isErr()) {
    write(lineList.value);
    Deno.exit(1);
  }

  const d = args["d"];
  const regexDelimiter: RegExp = d ? new RegExp(d) : /\s+/;

  const flagDryrun: boolean = !cmds.length;

  // ***** Start processing *****
  const flags =
    Number(flagRegex) +
    Number(flagChar) +
    Number(flagLines) +
    Number(flagField);

  if (
    flags != 1 ||
    ((flagOnly || flagOnig) && !flagRegex) ||
    ((flagDelimiter || flagRegexDelimiter) && !flagField)
  ) {
    write("teip: Invalid arguments.");
    Deno.exit(1);
  }

  if (flagLines) {
    // -l <list>
    await processLine(cmds, lineList.value, lineEnd);
  } else if (!flagOnly && flagRegex) {
    if (flagOnig) {
      // -g <pattern> -G
      // TODO
    } else {
      // -g <pattern>
      await processRegexLine(cmds, regex.value, flagInvert, lineEnd);
    }
  } else {
    if (flagRegex) {
      if (flagOnig) {
        // -g <pattern> -G -o
        // TODO
      } else {
        // -g <pattern> -o
        await processRegexPattern(cmds, regex.value, flagInvert, lineEnd);
      }
    }
  }
}

main();
