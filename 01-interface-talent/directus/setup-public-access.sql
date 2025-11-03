-- Script para dar permissão de leitura pública à coleção talents
-- Execute apenas em desenvolvimento local!

-- Dar permissão de leitura para role pública (NULL = role pública) na coleção talents
INSERT INTO directus_permissions (
    role,
    collection,
    action,
    permissions,
    validation,
    presets,
    fields
) VALUES (
    NULL,  -- NULL = role pública
    'talents',
    'read',
    '{}',  -- Sem restrições (pode ler tudo)
    NULL,
    NULL,
    '*'  -- Pode ler todos os campos
) ON CONFLICT DO NOTHING;

