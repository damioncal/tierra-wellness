import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jqozowdktujaechduieb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxb3pvd2RrdHVqYWVjaGR1aWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTA0OTksImV4cCI6MjA5MDE4NjQ5OX0.c61VQstgoGa4HJqG8O0KOKjVjSvmJDh8Da_9qTtm260'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)