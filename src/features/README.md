# features/

Módulos de negocio aislados. Cada feature agrupa su propia UI, lógica de datos y tipos.

Estructura sugerida por feature:

```
features/
└── propiedades/
    ├── components/      # UI específica del módulo
    ├── queries.ts       # acceso a datos vía cliente Supabase (RLS aplica)
    ├── actions.ts       # Server Actions (mutaciones)
    └── types.ts         # tipos del dominio
```

Reglas:
- Toda tabla del módulo lleva `empresa_id` y nace con RLS habilitado (ver `supabase/migrations/`).
- Componentes consumen `queries`/`actions`; nunca llaman al cliente Supabase crudo desde el JSX.

Aún no implementado — pendiente según roadmap en `PROYECTO.md`.
