import { Result, Ok, Err } from "./result.ts";
import { Range } from "../list/range.ts";

export function toRanges(
  flag: string,
  list: string,
  complement: boolean
): Result<Range[], string> {
  if (!list) {
    return new Err<Range[], string>(
      `teip: Expected argument for flag '${flag}' but reached end of arguments.`
    );
  }
  if (complement) {
    const res = Range.fromList(list);
    if (res.isErr()) {
      return res;
    }
    return new Ok<Range[], string>(Range.complement(res.value));
  } else {
    return Range.fromList(list);
  }
}
