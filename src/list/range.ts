import { Result, Ok, Err } from "../utils/result.ts";

const MAX = Number.MAX_SAFE_INTEGER;

export class Range {
  public low: number;
  public high: number;

  constructor(low: number, high: number) {
    this.low = low;
    this.high = high;
  }

  static fromStr(s: string): Result<Range, string> {
    const [n, m] = s.split("-", 2);

    const field = "fields and positions are numbered from 1";
    const order = "high end of range less than low end";
    const inval = "failed to parse range";

    let res: Result<Range, string> = new Err<Range, string>(inval);

    // ex: 1
    if (n && m == undefined) {
      if (n.match(/\d+/)) {
        const nm = Number.parseInt(n);
        if (nm > 0) res = new Ok<Range, string>(new Range(nm, nm));
        else res = new Err<Range, string>(field);
      } else {
        res = new Err<Range, string>(inval);
      }
    }

    // ex: 1-
    if (n && m == "") {
      if (n.match(/\d+/)) {
        const low = Number.parseInt(n);
        if (low > 0) res = new Ok<Range, string>(new Range(low, MAX));
        else res = new Err<Range, string>(field);
      } else {
        res = new Err<Range, string>(inval);
      }
    }

    // ex: -2
    if (n == "" && m) {
      if (n.match(/\d+/)) {
        const high = Number.parseInt(m);
        if (high > 0) res = new Ok<Range, string>(new Range(1, high));
        else res = new Err<Range, string>(field);
      } else {
        res = new Err<Range, string>(inval);
      }
    }

    // ex: 1-2
    if (n && m) {
      if (n.match(/\d+/)) {
        const low = Number.parseInt(n);
        const high = Number.parseInt(m);
        if (low > 0 && low <= high)
          res = new Ok<Range, string>(new Range(low, high));
        else res = new Err<Range, string>(field);
      } else {
        res = new Err<Range, string>(inval);
      }
    }

    return res;
  }

  static fromList(list: string): Result<Range[], string> {
    const ranges: Range[] = [];

    for (const item of list.split(",")) {
      const res = Range.fromStr(item);
      if (res.isOk()) {
        ranges.push(res.value);
      } else {
        return new Err<Range[], string>(
          `range ${item} was invalid: ${res.value}`
        );
      }
    }

    ranges.sort((a: Range, b: Range) => {
      if (a.low < b.low) {
        return -1;
      }
      if (a.low > b.low) {
        return 1;
      }
      return 0;
    });

    // merge overlapping ranges
    for (let i = 0; i < ranges.length; i++) {
      const j = i + 1;

      while (j < ranges.length && ranges[j].low <= ranges[i].high) {
        const high_j = ranges.splice(j, 1)[0].high;
        ranges[i].high = Math.max(high_j, ranges[i].high);
      }
    }
    return new Ok<Range[], string>(ranges);
  }

  // return complement of ranges
  // ex. 2-3,6-7 -> 1,4-5,8-
  static complement(ranges: Range[]): Range[] {
    const complements: Range[] = [];

    const n = ranges.length;
    if (!n) {
      return complements;
    }

    const first = ranges[0];
    if (1 < first.low) {
      complements.push(new Range(1, first.low - 1));
    }

    for (let i = 0; i < n - 1; i++) {
      const left = ranges[i];
      const right = ranges[i + 1];
      if (left.high + 1 != right.low) {
        complements.push(new Range(left.high + 1, right.low - 1));
      }
    }

    const last = ranges[n - 1];
    if (last.high < MAX) {
      {
        complements.push(new Range(last.high + 1, MAX));
      }
    }
    return complements;
  }
}
