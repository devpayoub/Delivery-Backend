import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

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

router.get('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
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

    const { data: existing } = await supabase
      .from('employers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let id_pic_url = req.body.id_pic_url || null;
    if (req.body.id_pic_base64) {
      const base64Data = req.body.id_pic_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `employer_${Date.now()}_id_pic.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        id_pic_url = urlData.publicUrl;
      }
    }

    const { data: newEmployer, error } = await supabase
      .from('employers')
      .insert({
        name,
        phone,
        id_number,
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

router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { name, phone, id_number } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (id_number) updates.id_number = id_number;

    if (req.body.id_pic_base64) {
      const base64Data = req.body.id_pic_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `employer_${Date.now()}_id_pic.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        updates.id_pic = urlData.publicUrl;
      }
    }

    if (req.body.password) {
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

router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
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