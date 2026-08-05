CREATE OR REPLACE FUNCTION public.notify_error_via_whatsapp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  supabase_url TEXT := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'feed_bpf_project_url' LIMIT 1);
  supabase_key TEXT := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'feed_bpf_publishable_key' LIMIT 1);
  v_route TEXT := lower(COALESCE(NEW.route, ''));
  v_ua TEXT := lower(COALESCE(NEW.user_agent, ''));
  v_is_target BOOLEAN;
  v_is_bot BOOLEAN;
BEGIN
  -- Apenas erros críticos
  IF NEW.error_type NOT IN ('boundary', 'chunk_error', 'boot_failsafe') THEN
    RETURN NEW;
  END IF;

  -- Apenas produtos prioritários: Feed_BPF, Audits_BPF, NutriAgro Labels (rotulos)
  v_is_target :=
    v_route LIKE '/feedbpf%'  OR v_route LIKE '/feed-bpf%'  OR v_route LIKE '/feed_bpf%'  OR
    v_route LIKE '/auditsbpf%' OR v_route LIKE '/audits-bpf%' OR v_route LIKE '/audits_bpf%' OR
    v_route LIKE '/rotulos%'  OR v_route LIKE '/nutriagro%'  OR v_route LIKE '/labels%';

  IF NOT v_is_target THEN
    RETURN NEW;
  END IF;

  -- Ignora crawlers/bots (evita ruído de bingbot/googlebot acessando chunks antigos)
  v_is_bot := v_ua LIKE '%bot%' OR v_ua LIKE '%crawler%' OR v_ua LIKE '%spider%'
           OR v_ua LIKE '%bingbot%' OR v_ua LIKE '%googlebot%' OR v_ua LIKE '%yandex%'
           OR v_ua LIKE '%baidu%' OR v_ua LIKE '%duckduck%' OR v_ua LIKE '%facebookexternalhit%';

  IF v_is_bot THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/notify-error-whatsapp',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || supabase_key
    ),
    body := jsonb_build_object(
      'id', NEW.id,
      'type', NEW.error_type,
      'message', NEW.message,
      'route', NEW.route,
      'version', NEW.app_version,
      'userAgent', NEW.user_agent,
      'stack', NEW.stack
    )
  );
  RETURN NEW;
END;
$function$;