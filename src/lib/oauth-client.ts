import { supabase } from "@/integrations/supabase/client";

export interface AuthorizationDetails {
  client?: { name?: string; client_name?: string; redirect_uri?: string };
  redirect_uri?: string;
  scope?: string;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
}
interface OAuthResult {
  data: AuthorizationDetails | null;
  error: { message: string } | null;
}
// Typed boundary for the provider's beta namespace; all calls use the installed client.
interface OAuthMethods {
  getAuthorizationDetails(id: string): Promise<OAuthResult>;
  approveAuthorization(id: string): Promise<OAuthResult>;
  denyAuthorization(id: string): Promise<OAuthResult>;
}
export const oauthClient = (supabase.auth as unknown as { oauth: OAuthMethods }).oauth;