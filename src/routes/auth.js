import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const { data: existingOwner } = await supabase
      .from('owners')
      .select('*')
      .eq('email', email)
      .single();

    if (existingOwner) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newOwner, error } = await supabase
      .from('owners')
      .insert({
        name,
        email,
        password: hashedPassword
      })
      .select()
      .single();

    if (error) throw error;

    const token = generateToken({ id: newOwner.id, role: 'owner', name: newOwner.name });

    res.status(201).json({
      message: 'Owner registered successfully',
      user: { id: newOwner.id, name: newOwner.name, email: newOwner.email, role: 'owner' },
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
    const isEmail = identifier.includes('@');

    if (isEmail) {
      // Try owner by email
      const { data: owner } = await supabase
        .from('owners')
        .select('*')
        .eq('email', identifier)
        .single();

      if (owner) {
        const validPassword = await bcrypt.compare(password, owner.password);
        if (validPassword) {
          user = { id: owner.id, name: owner.name, email: owner.email, role: 'owner' };
        }
      }
    } else {
      // Try employer by phone
      const { data: employer } = await supabase
        .from('employers')
        .select('*')
        .eq('phone', identifier)
        .single();

      if (employer) {
        const validPassword = await bcrypt.compare(password, employer.password);
        if (validPassword) {
          user = { id: employer.id, name: employer.name, phone: employer.phone, role: 'employer' };
        }
      }

      if (!user) {
        // Try driver by phone
        const { data: driver } = await supabase
          .from('drivers')
          .select('*')
          .eq('phone', identifier)
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

export default router;