require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from any localhost port or the configured frontend URL
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === (process.env.FRONTEND_URL || 'http://localhost:5173')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Admin Supabase client using service_role key (server-side only)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────
// POST /admin/create-user
// Body: { email, password, userData: { fullName, phone, role, licenseType, ... } }
// ─────────────────────────────────────────────────────────────
app.post('/admin/create-user', async (req, res) => {
  try {
    const { email, password, userData } = req.body;

    if (!email || !password || !userData) {
      return res.status(400).json({ error: 'email, password, and userData are required' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: userData.fullName },
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Create user profile in public.users
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (dbError) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: dbError.message });
    }

    res.json({ user: { id: userId, email, ...userData } });
  } catch (err) {
    console.error('create-user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /admin/delete-user/:id
// ─────────────────────────────────────────────────────────────
app.delete('/admin/delete-user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete profile first
    await supabaseAdmin.from('users').delete().eq('id', id);

    // Delete auth account
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('delete-user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /admin/update-user-password
// Body: { userId, newPassword }
// ─────────────────────────────────────────────────────────────
app.post('/admin/update-user-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    console.error('update-password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 My-Drive Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
