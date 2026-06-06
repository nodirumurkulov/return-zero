-- Add importing status for async mock store connect
alter type public.store_connection_status add value if not exists 'importing' before 'connected';
