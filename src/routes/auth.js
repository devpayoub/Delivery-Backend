import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { isValidEmail, isValidPassword, isValidName, sanitize } from '../middleware/validate.js';

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (!isValidName(name)) {
      return res.status(400).json({ error: 'Name must be 1-100 characters' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email).toLowerCase();

    const { data: existingOwner } = await supabase
      .from('owners')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (existingOwner) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newOwner, error } = await supabase
      .from('owners')
      .insert({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword
      })
      .select()
      .single();

    if (error) throw error;

    const user = { id: newOwner.id, name: newOwner.name, email: newOwner.email, role: 'owner' };
    const token = generateToken(user);

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({
      message: 'Owner registered successfully',
      user,
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    let user = null;
    const cleanIdentifier = sanitize(identifier);
    const isEmail = cleanIdentifier.includes('@');

    if (isEmail) {
      const { data: owner } = await supabase
        .from('owners')
        .select('*')
        .eq('email', cleanIdentifier.toLowerCase())
        .single();

      if (owner) {
        const validPassword = await bcrypt.compare(password, owner.password);
        if (validPassword) {
          user = { id: owner.id, name: owner.name, email: owner.email, role: 'owner' };
        }
      }
    } else {
      const { data: employer } = await supabase
        .from('employers')
        .select('*')
        .eq('phone', cleanIdentifier)
        .single();

      if (employer) {
        const validPassword = await bcrypt.compare(password, employer.password);
        if (validPassword) {
          user = { id: employer.id, name: employer.name, phone: employer.phone, role: 'employer' };
        }
      }

      if (!user) {
        const { data: driver } = await supabase
          .from('drivers')
          .select('*')
          .eq('phone', cleanIdentifier)
          .single();

        if (driver) {
          const validPassword = await bcrypt.compare(password, driver.password);
          if (validPassword) {
            user = { id: driver.id, name: driver.name, phone: driver.phone, role: 'driver' };
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    await supabase.from('logs').insert({
      role: user.role,
      action: 'Login',
      details: `User logged in as ${user.role}`
    });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;