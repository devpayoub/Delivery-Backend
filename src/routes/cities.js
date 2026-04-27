import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cities')
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
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { data: newCity, error } = await supabase
      .from('cities')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Create City',
      details: `Created city: ${newCity.name}`
    });

    res.status(201).json(newCity);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { name } = req.body;

    const { data: updated, error } = await supabase
      .from('cities')
      .update({ name })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Update City',
      details: `Updated city: ${updated.name}`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { data: city } = await supabase
      .from('cities')
      .select('name')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Delete City',
      details: `Deleted city: ${city?.name}`
    });

    res.json({ message: 'City deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;