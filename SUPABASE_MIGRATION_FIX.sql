-- Run this on an existing Supabase project that already has bill_items without stock_id

ALTER TABLE public.bill_items
ADD COLUMN IF NOT EXISTS stock_id BIGINT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bill_items_stock_id_fkey'
      AND conrelid = 'public.bill_items'::regclass
  ) THEN
    ALTER TABLE public.bill_items
    ADD CONSTRAINT bill_items_stock_id_fkey
    FOREIGN KEY (stock_id) REFERENCES public.stocks(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bill_items_stock_id ON public.bill_items(stock_id);
