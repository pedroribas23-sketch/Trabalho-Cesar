import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeName } from "../src/security";

describe("security", () => {
  it("normaliza o nome ignorando caixa e espaços extras", () => {
    assert.equal(normalizeName("  Kennedito   Silva "), "kennedito silva");
  });

  it("trata nomes vazios", () => {
    assert.equal(normalizeName(""), "");
    assert.equal(normalizeName("   "), "");
  });
});
