# Data Model Roadmap

The current production-safe backend stores sanitized application state in `public.impulse_state.data` as JSONB. That keeps deployments simple and protects existing data during rapid iteration.

The next database phase should move toward normalized tables without removing the JSON state table immediately.

## Parallel Tables

- `impulse_users`
- `impulse_profiles`
- `impulse_categories`
- `impulse_game_sections`
- `impulse_products`
- `impulse_orders`
- `impulse_order_messages`
- `impulse_ledger_entries`
- `impulse_admin_logs`
- `impulse_assets`

## Migration Order

1. Create the normalized tables alongside `impulse_state`.
2. Backfill from the current JSON snapshot.
3. Run dual writes for high-value actions: registration, recharge, checkout, order status, chat, logs.
4. Compare JSON state and normalized tables in admin diagnostics.
5. Switch reads endpoint-by-endpoint.
6. Keep `impulse_state` as a rollback snapshot until normalized reads have been stable.

This avoids the update problem where existing accounts or orders disappear after a release.
