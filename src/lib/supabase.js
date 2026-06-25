import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn(
    "[BurgerFlow] Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. " +
      "Configure o arquivo .env (local) ou as Environment Variables na Vercel."
  );
}

export const supabase = createClient(url || "http://localhost", anon || "anon");
