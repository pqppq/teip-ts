import { Result, Ok, Err } from "./result.ts";
import { Range } from "../list/range.ts";

export function listToRanges(
  flag: string,
  list: string,
  complement: boolean
): Result<Range[], string> {
  if (!list) {
    return new Err(
      `teip: Expected argument for flag '${flag}' but reached end of arguments.`
    );
  }
  if (complement) {
    const res = Range.fromList(list);
    if (res.isErr()) {
      return res;
    }
    return new Ok(Range.complement(res.value));
  } else {
    return Range.fromList(list);
  }
}

