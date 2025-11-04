-- Script para dar permissão de leitura pública às coleções necessárias
-- Execute apenas em desenvolvimento local!

-- Permissão para talents (se ainda não existir)
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
    '{}',
    NULL,
    NULL,
    '*'
) ON CONFLICT DO NOTHING;

-- Permissão para internship_leaders
INSERT INTO directus_permissions (
    role,
    collection,
    action,
    permissions,
    validation,
    presets,
    fields
) VALUES (
    NULL,
    'internship_leaders',
    'read',
    '{}',
    NULL,
    NULL,
    '*'
) ON CONFLICT DO NOTHING;

-- Permissão para target_roles
INSERT INTO directus_permissions (
    role,
    collection,
    action,
    permissions,
    validation,
    presets,
    fields
) VALUES (
    NULL,
    'target_roles',
    'read',
    '{}',
    NULL,
    NULL,
    '*'
) ON CONFLICT DO NOTHING;

-- Permissão para directus_users (necessário para busca por email)
INSERT INTO directus_permissions (
    role,
    collection,
    action,
    permissions,
    validation,
    presets,
    fields
) VALUES (
    NULL,
    'directus_users',
    'read',
    '{}',
    NULL,
    NULL,
    'id,email'
) ON CONFLICT DO NOTHING;

