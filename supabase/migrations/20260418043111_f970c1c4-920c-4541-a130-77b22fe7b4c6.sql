DROP TRIGGER IF EXISTS notify_on_new_message ON public.messages;
DROP FUNCTION IF EXISTS public.notify_new_message();