import * as mod from "https://deno.land/std/flags/mod.ts";

export function parse(args: string[]): mod.Args {
  const options = {
    "--": false,
    string: ["g", "f", "d", "D", "c", "l"],
    boolean: ["version", "help", "o", "G", "s", "v", "z"],
    default: {},
  };
  const argv = mod.parse(args, options);

  args.forEach((value, index) => {
    // option like -f -1,2 is parsed as {'f': "", '1': '2'}
    // need to fix like {'f': '-1,2'}
    if (value.match(/^-\d+(,\d+)*-?$/)) {
      if (index == 0 || !["-f", "-c", "-l"].includes(args[index - 1])) {
        throw new Error(`Invalid option: ${value}`);
      }

      delete argv[value.slice(1, 2)];
      delete argv[value.slice(2, 3)];
      argv[args[index - 1].slice(1)] = value;
    }
  });

  return argv;
}

function userDefined(target: string, options: mod.ParseOptions): boolean {
  const boolean = options.boolean || [];
  const string = options.string || [];
  const alias = Object.keys(options.alias || []);

  const v = target.replace(/^--?/, "");

  return (
    isBoolean(target, options) ||
    isString(target, options) ||
    isAlias(target, options)
  );
}

function isBoolean(target: string, options: mod.ParseOptions): boolean {
  const v = target.replace(/^--?/, "");
  const boolean = options.boolean || [];
  if (
    typeof boolean == "boolean" ||
    (typeof boolean == "string" && boolean == v)
  )
    return true;
  if (typeof boolean == "object" && boolean.includes(v)) return true;

  return false;
}

function isString(target: string, options: mod.ParseOptions): boolean {
  const v = target.replace(/^--?/, "");
  const string = options.string || [];
  if (typeof string == "string" && string == v) return true;
  if (typeof string == "object" && string.includes(v)) return true;

  return false;
}

function isAlias(target: string, options: mod.ParseOptions): boolean {
  const v = target.replace(/^--?/, "");
  const alias = Object.keys(options.alias || []);

  if (typeof alias == "string" && alias == v) return true;
  if (typeof alias == "object" && alias.includes(v)) return true;

  return false;
}
