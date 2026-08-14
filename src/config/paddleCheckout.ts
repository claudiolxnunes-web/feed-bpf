// TEMPORÁRIO (14/08/2026): a conta Paddle foi ativada, mas os secrets
// PADDLE_* ainda não existem no Supabase — os 5 checkouts (create-checkout,
// create-checkout-audits, create-checkout-nutriagrolabels, create-checkout-agrorc,
// create-checkout-agrogestao) quebrariam em runtime.
//
// Reativação: assim que os secrets forem cadastrados, troque para `true`.
// As edge functions continuam intactas — nenhum outro arquivo precisa mudar.
export const PADDLE_CHECKOUT_ENABLED = false;

export const PADDLE_CHECKOUT_DISABLED_MESSAGE =
  "Pagamentos temporariamente indisponíveis. Tente novamente em breve.";
