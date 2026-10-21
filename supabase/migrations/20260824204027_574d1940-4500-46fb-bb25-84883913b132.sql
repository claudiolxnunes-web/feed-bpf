select cron.schedule(
  'alertas-vencimento-diario',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://uyrcxfypdzasdminxizq.supabase.co/functions/v1/alertas-vencimento',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '1c14b8e2d053caabbb8a9c99a2c0daff2b4b22a0a1ef44a6'
    ),
    body := '{}'::jsonb
  );
  $$
);