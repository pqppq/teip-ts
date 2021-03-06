import { Result, Ok, Err } from "../utils/result.ts";

export class Range {
  public low: number;
  public high: number;
  static MAX = Number.MAX_SAFE_INTEGER;
  static ALL = new Range(1, Range.MAX);

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
    const pattern = /^\d+$/;

    // ex: 1
    if (n && m == undefined) {
      if (n.match(pattern)) {
        const nm = Number.parseInt(n);
        if (nm > 0) res = new Ok<Range, string>(new Range(nm, nm));
        else res = new Err<Range, string>(field);
      } else {
        res = new Err<Range, string>(inval);
      }
    }

    // ex: 1-
    if (n && m == "") {
      if (n.match(pattern)) {
        const low = Number.parseInt(n);
        if (low > 0) res = new Ok<Range, string>(new Range(low, Range.MAX));
        else res = new Err<Range, string>(field);
      } else {
        res = new Err<Range, string>(inval);
      }
    }

    // ex: -2
    if (n == "" && m) {
      if (n.match(pattern)) {
        const high = Number.parseInt(m);
        if (high > 0) res = new Ok<Range, string>(new Range(1, high));
        else res = new Err<Range, string>(field);
      } else {
        res = new Err<Range, string>(inval);
      }
    }

    // ex: 1-2
    if (n && m) {
      if (n.match(pattern) && m.match(pattern)) {
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

      // while (j < ranges.length && ranges[j].low <= ranges[i].high) {
      while (j < ranges.length && ranges[j].low <= ranges[i].high + 1) {
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
      return [Range.ALL];
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
    if (last.high < Range.MAX) {
      {
        complements.push(new Range(last.high + 1, Range.MAX));
      }
    }
    return complements;
  }

  static fromRegex(line: string, regex: RegExp, complement: boolean): Range[] {
    const ranges: Range[] = [];
    let left = 1;
    let right = 1;

    for (
      let matched = regex.exec(line);
      matched != null;
      matched = regex.exec(line)
    ) {
      const n = matched[0].length;
      const last = regex.lastIndex;

      right = last == line.length ? Range.MAX : last;
      left = last - (n - 1);

      ranges.push(new Range(left, right));
    }
    if (complement) {
      return this.complement(ranges);
    }
    return ranges;
  }
  static fromDelimiter(
    line: string,
    delimiter: string,
    complement: boolean
  ): Range[] {
    const ranges: Range[] = [];
    let left = 1;

    const parts = line.split(delimiter);

    for (const part of parts) {
      const n = part.length;
      let right = left + (n - 1);

      if (right == line.length) {
        right = Range.MAX;
      }
      ranges.push(new Range(left, right));
      left += n + delimiter.length;
    }
    if (complement) {
      return this.complement(ranges);
    }
    return ranges;
  }
}
