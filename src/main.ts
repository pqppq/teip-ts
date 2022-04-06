import { parse } from "./utils/mod.ts";

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
}

main();
