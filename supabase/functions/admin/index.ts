import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname; // e.g. '/admin/create-user'

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify caller is an admin (used for privileged endpoints)
  const verifyAdmin = async (authHeader: string | null): Promise<boolean> => {
    if (!authHeader) return false;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return false;
    const { data: profile } = await supabaseAdmin
      .from('users').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
  };

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // GET /admin/health
    if (req.method === 'GET' && path.endsWith('/health')) {
      return json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // POST /admin/create-user — public (student self-registration OR admin creates teacher/admin)
    if (req.method === 'POST' && path.endsWith('/create-user')) {
      const { email, password, userData } = await req.json();
      if (!email || !password || !userData) {
        return json({ error: 'email, password, and userData are required' }, 400);
      }
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: userData.fullName },
        email_confirm: true,
      });
      if (authError) return json({ error: authError.message }, 400);

      const userId = authData.user.id;
      const { error: dbError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (dbError) {
        await supabaseAdmin.auth.admin.deleteUser(userId); // rollback
        return json({ error: dbError.message }, 400);
      }
      return json({ user: { id: userId, email, ...userData } });
    }

    // DELETE /admin/delete-user/:id — admin only
    if (req.method === 'DELETE' && path.includes('/delete-user/')) {
      if (!await verifyAdmin(req.headers.get('authorization'))) {
        return json({ error: 'Unauthorized — admin role required' }, 401);
      }
      const id = path.split('/delete-user/')[1].split('?')[0];
      await supabaseAdmin.from('users').delete().eq('id', id);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    // POST /admin/update-user-password — admin only
    if (req.method === 'POST' && path.endsWith('/update-user-password')) {
      if (!await verifyAdmin(req.headers.get('authorization'))) {
        return json({ error: 'Unauthorized — admin role required' }, 401);
      }
      const { userId, newPassword } = await req.json();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    console.error('admin edge function error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
