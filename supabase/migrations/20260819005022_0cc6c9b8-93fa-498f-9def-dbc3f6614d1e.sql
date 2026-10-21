UPDATE public.modelos_acesso 
SET senha_hash = 'Pastarestrita.clxn', 
    updated_at = now() 
WHERE ativa = true;