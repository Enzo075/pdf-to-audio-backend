import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL não definida no .env");
if (!supabaseServiceKey)
  throw new Error("SUPABASE_SERVICE_KEY não definida no .env");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
