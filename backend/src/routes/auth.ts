import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import sql from '../db';
import { signJwt } from '../lib/jwt';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { LoginSchema, SignupSchema, UpdateProfileSchema, ChangePasswordSchema } from '../lib/validators';

const auth = new Hono();

// ─── POST /auth/login ─────────────────────────────────────────────────────────
auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { email, password } = parsed.data;

  const loginRows = await sql`
    SELECT p.id, p.email, p.password, p.nama_lengkap, p.jabatan, p.instansi, p.foto_url,
           ur.role
    FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.email = ${email}
    LIMIT 1
  `;
  const user = loginRows[0] as any;

  if (!user) return fail(c, 'Email atau password salah', 401);

  const valid = await bcrypt.compare(password, user.password as string);
  if (!valid) return fail(c, 'Email atau password salah', 401);

  const token = await signJwt({ sub: user.id as string, role: (user.role ?? 'pengaju') as string });

  return ok(c, {
    token,
    user: {
      id: user.id,
      email: user.email,
      nama_lengkap: user.nama_lengkap,
      jabatan: user.jabatan,
      instansi: user.instansi,
      foto_url: user.foto_url,
    },
    role: user.role ?? 'pengaju',
  }, 'Login berhasil');
});

// ─── POST /auth/signup ────────────────────────────────────────────────────────
auth.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { email, password, nama_lengkap, jabatan, instansi, no_hp } = parsed.data;

  const existingRows = await sql`SELECT id FROM profiles WHERE email = ${email} LIMIT 1`;
  if (existingRows[0]) return fail(c, 'Email sudah terdaftar', 409);

  const hashed = await bcrypt.hash(password, 10);

  const signupRows = await sql`
    INSERT INTO profiles (email, password, nama_lengkap, jabatan, instansi, no_hp)
    VALUES (${email}, ${hashed}, ${nama_lengkap}, ${jabatan ?? null}, ${instansi ?? null}, ${no_hp ?? null})
    RETURNING id, email, nama_lengkap, jabatan, instansi, no_hp
  `;
  const newUser = signupRows[0] as any;

  await sql`INSERT INTO user_roles (user_id, role) VALUES (${newUser.id}, 'pengaju')`;

  const token = await signJwt({ sub: newUser.id as string, role: 'pengaju' });

  return ok(c, { token, user: newUser, role: 'pengaju' }, 'Registrasi berhasil', 201);
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const meRows = await sql`
    SELECT p.id, p.email, p.nama_lengkap, p.jabatan, p.instansi, p.no_hp, p.foto_url,
           p.created_at, ur.role
    FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.id = ${userId}
    LIMIT 1
  `;
  const meUser = meRows[0] as any;

  if (!meUser) return fail(c, 'User tidak ditemukan', 404);

  return ok(c, { user: meUser, role: meUser.role ?? 'pengaju' });
});

// ─── PATCH /auth/profile ──────────────────────────────────────────────────────
auth.patch('/profile', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { nama_lengkap, jabatan, instansi, no_hp, foto_url } = parsed.data;

  const profileRows = await sql`
    UPDATE profiles
    SET
      nama_lengkap = COALESCE(${nama_lengkap ?? null}, nama_lengkap),
      jabatan      = COALESCE(${jabatan ?? null}, jabatan),
      instansi     = COALESCE(${instansi ?? null}, instansi),
      no_hp        = COALESCE(${no_hp ?? null}, no_hp),
      foto_url     = COALESCE(${foto_url ?? null}, foto_url),
      updated_at   = NOW()
    WHERE id = ${userId}
    RETURNING id, email, nama_lengkap, jabatan, instansi, no_hp, foto_url
  `;

  return ok(c, profileRows[0], 'Profil berhasil diperbarui');
});

// ─── PATCH /auth/password ─────────────────────────────────────────────────────
auth.patch('/password', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { current_password, new_password } = parsed.data;

  const pwRows = await sql`SELECT password FROM profiles WHERE id = ${userId} LIMIT 1`;
  if (!pwRows[0]) return fail(c, 'User tidak ditemukan', 404);
  const pwUser = pwRows[0] as any;

  const valid = await bcrypt.compare(current_password, pwUser.password as string);
  if (!valid) return fail(c, 'Password saat ini salah', 401);

  const hashed = await bcrypt.hash(new_password, 10);
  await sql`UPDATE profiles SET password = ${hashed}, updated_at = NOW() WHERE id = ${userId}`;

  return ok(c, null, 'Password berhasil diubah');
});

export default auth;
