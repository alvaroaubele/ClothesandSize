import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("neutralises formula-leading cells and quotes commas", () => {
    const out = toCsv(["a", "b"], [["=HYPERLINK(\"x\")", "plain, with comma"], ["-5", "@mention"]]);
    const lines = out.replace("﻿", "").trim().split("\r\n");
    expect(lines[0]).toBe("a,b");
    expect(lines[1]).toBe("\"'=HYPERLINK(\"\"x\"\")\",\"plain, with comma\"");
    expect(lines[2]).toBe("'-5,'@mention");
  });

  it("leaves ordinary numbers and text alone", () => {
    const out = toCsv(["n"], [[42], ["Priya"]]);
    expect(out).toContain("\r\n42\r\nPriya\r\n");
  });
});
