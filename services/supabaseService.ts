import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// Feedback interface
export interface Feedback {
  id: number;
  username?: string;
  title: string;
  description: string;
  created_at: string;
}

// Submit anonymous feedback
export async function submitFeedback(username: string, title: string, description: string): Promise<boolean> {
  const { error } = await supabase
    .from('feedback')
    .insert([{ username: username || null, title, description }])
  if (error) {
    console.error("Submit failed:", error)
    return false
  }
  return true
}

// Fetch all feedback
export async function fetchFeedback(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error("Fetch failed:", error)
    return []
  }
  return data || []
}
