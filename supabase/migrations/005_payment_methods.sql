-- BeautyFlow · 005 · Nuevos métodos de pago
-- Agrega tarjeta_debito, tarjeta_credito y go_cuotas al enum de payment_method

ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'tarjeta_debito';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'tarjeta_credito';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'go_cuotas';
