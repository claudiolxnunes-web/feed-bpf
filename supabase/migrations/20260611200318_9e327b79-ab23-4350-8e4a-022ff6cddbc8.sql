
CREATE OR REPLACE FUNCTION public.notify_nc_via_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'feed_bpf_project_url' LIMIT 1);
  supabase_key TEXT := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'feed_bpf_publishable_key' LIMIT 1);
  msg TEXT;
BEGIN
  msg := '⚠️ *Nova Não Conformidade* (Audits_BPF)' || E'\n\n' ||
         '*Setor:* ' || COALESCE(NEW.setor, 'N/A') || E'\n' ||
         '*Descrição:* ' || COALESCE(LEFT(NEW.descricao, 300), 'N/A') || E'\n' ||
         '*Responsável:* ' || COALESCE(NEW.responsavel, 'N/A') || E'\n' ||
         '*Prazo:* ' || COALESCE(NEW.prazo::text, 'N/A') || E'\n' ||
         '*Status:* ' || COALESCE(NEW.status, 'aberta');

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/evolution-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || supabase_key
    ),
    body := jsonb_build_object(
      'to', COALESCE(current_setting('app.alert_whatsapp', true), '5561996757585'),
      'message', msg,
      'modulo', 'audits_bpf',
      'tipo', 'alerta_nc',
      'empresa_id', NEW.empresa_id,
      'user_id', NEW.user_id,
      'metadata', jsonb_build_object('nc_id', NEW.id)
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_nc_via_whatsapp falhou: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_nc_whatsapp ON public.nao_conformidades;
CREATE TRIGGER trg_notify_nc_whatsapp
AFTER INSERT ON public.nao_conformidades
FOR EACH ROW
EXECUTE FUNCTION public.notify_nc_via_whatsapp();
