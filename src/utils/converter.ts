import { Result, Ok, Err } from "./result.ts";
import { Range } from "../list/range.ts";

export function toRanges(
  list: string,
  complement: boolean
): Result<Range[], string> {
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
