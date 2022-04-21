import * as mod from "https://deno.land/std/flags/mod.ts";

export function parse(args: string[]): mod.Args {
  const options = {
    "--": true,
    string: ["g", "f", "d", "D", "c", "l"],
    boolean: ["version", "help", "o", "G", "s", "v", "z"],
    default: {},
  };
  const argv = mod.parse(args, options);

  args.forEach((value, index) => {
    // option like -f -12,3 is parsed as {'f': '', '1': true, '2': ',3'}
    // need to fix like {'f': '-12,3'}
    if (value.match(/^-\d+(,\d+)*-?$/)) {
      const bef = args[index - 1];
      if (!bef || !bef.match(/^-\w*[fcl]$/)) return;

      delete argv[value.slice(1, 2)];
      delete argv[value.slice(2, 3)];
      argv[bef.slice(-1)] = value;
    }
  });

  argv["--"] = argv["--"]
    .map((v: string) => {
      return v.match(/[;\s]/) ? `'${v}'` : v;
    })
    .map((v: string) => {
      return v.replace(/([#|`<>&])/, "\\$1");
    });

  return argv;
}
