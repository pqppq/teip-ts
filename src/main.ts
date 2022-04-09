import { parse } from "./utils/mod.ts";
import { Range } from "./list/range.ts";
import { toRanges } from "./utils/converter.ts";
import { Result } from "./utils/result.ts";

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

function main(): void {
  const args = parse(Deno.args);

  const cmds = args["--"];
  const rest = args["_"];

  const flag_only = args["o"];
  const flag_onig = args["G"];
  const flag_solid = args["s"];
  const flag_invert = args["v"];
  const flag_zero = args["z"];

  const flag_regex = args["g"] ? true : false;
  const flag_char = args["c"] ? true : false;
  const flag_lines = args["l"] ? true : false;
  const flag_field = args["f"] ? true : false;
  const flag_delimiter = args["d"] ? true : false;
  const flag_regex_delimiter = args["D"] ? true : false;

  const c = args["c"];
  let char_list: Result<Range[], string> = c
    ? toRanges(c, flag_invert)
    : toRanges("1", true);
  console.log(char_list);
  if (char_list.isErr()) {
    console.log(char_list.value);
    Deno.exit(1);
  }

  const f = args["f"];
  let field_list: Result<Range[], string> = f
    ? toRanges(f, flag_invert)
    : toRanges("1", true);
  if (field_list.isErr()) {
    console.log(field_list.value);
    Deno.exit(1);
  }

  const l = args["l"];
  let line_list: Result<Range[], string> = l
    ? toRanges(l, flag_invert)
    : toRanges("1", true);
  if (line_list.isErr()) {
    console.log(line_list.value);
    Deno.exit(1);
  }

  let regex_mode = "";
  let line_end = "\n";
  // NUL is used as line delimiter
  if (flag_zero) {
    regex_mode = "(?ms)";
    line_end = "\0";
  }

  let regex = "";
  if (!flag_onig) {
    // TODO
  } else {
    if (flag_zero) {
      // TODO
    } else {
      // TODO
    }
  }

  const d = args["d"];
  const regex_delimiter: RegExp = d ? new RegExp(d, regex_mode) : /\s+/;

  const flag_dryrun: boolean = !cmds.length;

  const single_token_per_line = (!flag_only && flag_regex) || flag_lines;

  // const ch:
}
main();
