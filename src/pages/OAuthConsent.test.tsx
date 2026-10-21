import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({ details: vi.fn(), approve: vi.fn(), deny: vi.fn(), user: { email: "test@example.invalid" } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: provider.user, loading: false, signOut: vi.fn() }) }));
vi.mock("@/lib/oauth-client", () => ({ oauthClient: {
  getAuthorizationDetails: provider.details,
  approveAuthorization: provider.approve,
  denyAuthorization: provider.deny,
} }));
import OAuthConsent from "./OAuthConsent";

describe("OAuth consent decisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    provider.details.mockResolvedValue({ data: { client: { name: "Test agent" }, scope: "openid email" }, error: null });
  });
  afterEach(cleanup);
  function open() { return render(<MemoryRouter initialEntries={["/.lovable/oauth/consent?authorization_id=request-123"]}><OAuthConsent /></MemoryRouter>); }
  it("passes the authorization ID to approve and keeps failed approval recoverable", async () => {
    provider.approve.mockResolvedValue({ data: null, error: { message: "Provider unavailable" } });
    const view = open();
    fireEvent.click(await view.findByRole("button", { name: "Permitir conexão" }));
    await waitFor(() => expect(provider.approve).toHaveBeenCalledWith("request-123"));
    await waitFor(() => expect(view.getByRole("button", { name: "Permitir conexão" })).toBeEnabled());
    expect(provider.deny).not.toHaveBeenCalled();
  });
  it("passes the authorization ID to deny and keeps failed denial recoverable", async () => {
    provider.deny.mockResolvedValue({ data: null, error: { message: "Provider unavailable" } });
    const view = open();
    fireEvent.click(await view.findByRole("button", { name: "Cancelar conexão" }));
    await waitFor(() => expect(provider.deny).toHaveBeenCalledWith("request-123"));
    await waitFor(() => expect(view.getByRole("button", { name: "Cancelar conexão" })).toBeEnabled());
    expect(provider.approve).not.toHaveBeenCalled();
  });
  it("does not allow a decision when the provider rejects the request", async () => {
    provider.details.mockResolvedValue({ data: null, error: { message: "Expired request" } });
    const view = open();
    await view.findByRole("alert");
    expect(view.queryByRole("button", { name: "Permitir conexão" })).toBeNull();
    expect(provider.approve).not.toHaveBeenCalled();
    expect(provider.deny).not.toHaveBeenCalled();
  });
});