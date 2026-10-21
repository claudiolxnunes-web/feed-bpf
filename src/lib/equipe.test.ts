import { describe, expect, it } from "vitest";
import { conferirRespostaEquipe, linkConvite } from "./equipe";

describe("Respostas de convite", () => {
  it("não apresenta erro retornado pelo banco como sucesso", () => {
    expect(() => conferirRespostaEquipe({ ok: false, error: "Convite pertence a outro e-mail" })).toThrow("Convite pertence a outro e-mail");
  });
  it("preserva token devolvido pela função de convite", () => {
    expect(conferirRespostaEquipe({ ok: true, token: "abc" }).token).toBe("abc");
  });
  it("link usa o domínio atual e a página de aceite", () => {
    const url = new URL(linkConvite("abc/def"));
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe("/aceitar-convite");
    expect(url.searchParams.get("token")).toBe("abc/def");
  });
});