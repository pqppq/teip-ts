import { parse } from "./utils/mod.ts";
import { Range } from "./list/range.ts";
import { toRanges } from "./utils/converter.ts";
import { Result, Ok, Err } from "./utils/result.ts";
import { write, processLine, processRegexLine } from "./utils/process.ts";

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
    // NUL character
    lineEnd = String.fromCharCode(0, 16);
  }

  const g = args["g"];
  let regex: Result<string, string> =
    g != undefined
      ? new Ok(g)
      : new Err(
          "teip: Expected argument for flag '-g' but reached end of arguments."
        );
  if (regex.isErr()) {
    write(regex.value, lineEnd);
    Deno.exit(1);
  }

  const c = args["c"];
  let charList: Result<Range[], string> =
    c != undefined ? toRanges("-c", c, flagInvert) : new Ok([Range.ALL]);
  if (charList.isErr()) {
    write(charList.value, lineEnd);
    Deno.exit(1);
  }

  const f = args["f"];
  let fieldList: Result<Range[], string> =
    f != undefined ? toRanges("-f", f, flagInvert) : new Ok([Range.ALL]);
  if (fieldList.isErr()) {
    write(fieldList.value, lineEnd);
    Deno.exit(1);
  }

  const l = args["l"];
  let lineList: Result<Range[], string> =
    l != undefined ? toRanges("-l", l, flagInvert) : new Ok([Range.ALL]);
  if (lineList.isErr()) {
    write(lineList.value, lineEnd);
    Deno.exit(1);
  }

  const d = args["d"];
  const regexDelimiter: RegExp = d ? new RegExp(d, regexMode) : /\s+/;

  const flagDryrun: boolean = !cmds.length;

  // ***** Start processing *****

  // read from stdin
  if (flagLines) {
    await processLine(cmds, lineList.value, lineEnd);
  } else if (!flagOnly && flagRegex) {
    if (flagOnig) {
      // TODO
    } else {
      await processRegexLine(cmds, regex, lineList.value, flagInvert, lineEnd);
    }
  }
}
main();
