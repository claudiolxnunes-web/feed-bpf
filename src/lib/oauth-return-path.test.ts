import { describe, expect, it } from "vitest";
import { oauthReturnPath } from "./oauth-return-path";

describe("OAuth local return paths", () => {
  it("preserves the consent request and fragment", () => {
    expect(oauthReturnPath("/.lovable/oauth/consent?authorization_id=abc#decision")).toBe("/.lovable/oauth/consent?authorization_id=abc#decision");
  });
  it.each(["//evil.invalid", "/\\evil.invalid", "https://evil.invalid", "/a\nb", "/%2e%2e//evil.invalid", null])("rejects external or malformed targets: %s", (value) => {
    expect(oauthReturnPath(value)).toBe("/");
  });
});