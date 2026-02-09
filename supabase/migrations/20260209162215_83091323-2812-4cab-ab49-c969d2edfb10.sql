-- Recover stuck order 1: Stuart Borders
UPDATE orders SET status = 'succeeded', stripe_payment_intent_id = 'pi_3SywerEOAGwz3vRr0qCh0pLa', updated_at = now()
WHERE id = '481dd3eb-b831-461c-8bca-16a87070ef99' AND status = 'pending';

-- Recover stuck order 2: Chris Skiles
UPDATE orders SET status = 'succeeded', stripe_payment_intent_id = 'pi_3SywnlEOAGwz3vRr0bOoDu0R', updated_at = now()
WHERE id = '8d5e48b0-5c73-40a3-8556-761cf094fe70' AND status = 'pending';