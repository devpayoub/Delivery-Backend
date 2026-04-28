import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  isValidName, isValidPhone, isValidIdNumber, isValidPassword,
  sanitize, validateBase64Image, validateIdParam
} from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, requireRole('owner'), validateIdParam, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { name, phone, id_number, password } = req.body;

    if (!name || !phone || !id_number || !password) {
      return res.status(400).json({ error: 'Name, phone, id_number and password are required' });
    }
    if (!isValidName(name)) {
      return res.status(400).json({ error: 'Name must be 1-100 characters' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone format (8-15 digits)' });
    }
    if (!isValidIdNumber(id_number)) {
      return res.status(400).json({ error: 'ID number must be 1-50 characters' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const cleanName = sanitize(name);
    const cleanPhone = sanitize(phone);
    const cleanIdNumber = sanitize(id_number);

    const { data: existing } = await supabase
      .from('employers')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let id_pic_url = req.body.id_pic_url || null;
    if (req.body.id_pic_base64) {
      const result = validateBase64Image(req.body.id_pic_base64);
      if (!result.valid) {
        return res.status(400).json({ error: result.error });
      }
      const fileName = `employer_${Date.now()}_id_pic.${result.ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, result.buffer);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        id_pic_url = urlData.publicUrl;
      }
    }

    const { data: newEmployer, error } = await supabase
      .from('employers')
      .insert({
        name: cleanName,
        phone: cleanPhone,
        id_number: cleanIdNumber,
        id_pic: id_pic_url,
        password: hashedPassword
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Create Employer',
      details: `Created employer: ${newEmployer.name}`
    });

    res.status(201).json(newEmployer);
  } catch (err) {
    console.error('Create employer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, requireRole('owner'), validateIdParam, async (req, res) => {
  try {
    const { name, phone, id_number } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!isValidName(name)) return res.status(400).json({ error: 'Name must be 1-100 characters' });
      updates.name = sanitize(name);
    }
    if (phone !== undefined) {
      if (!isValidPhone(phone)) return res.status(400).json({ error: 'Invalid phone format (8-15 digits)' });
      updates.phone = sanitize(phone);
    }
    if (id_number !== undefined) {
      if (!isValidIdNumber(id_number)) return res.status(400).json({ error: 'ID number must be 1-50 characters' });
      updates.id_number = sanitize(id_number);
    }

    if (req.body.id_pic_base64) {
      const result = validateBase64Image(req.body.id_pic_base64);
      if (!result.valid) {
        return res.status(400).json({ error: result.error });
      }
      const fileName = `employer_${Date.now()}_id_pic.${result.ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, result.buffer);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        updates.id_pic = urlData.publicUrl;
      }
    }

    if (req.body.password) {
      if (!isValidPassword(req.body.password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    const { data: updated, error } = await supabase
      .from('employers')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Update Employer',
      details: `Updated employer: ${updated.name}`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole('owner'), validateIdParam, async (req, res) => {
  try {
    const { data: employer } = await supabase
      .from('employers')
      .select('name')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('employers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Delete Employer',
      details: `Deleted employer: ${employer?.name}`
    });

    res.json({ message: 'Employer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;