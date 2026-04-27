import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('product_types')
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
      .from('product_types')
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

    const { data: newType, error } = await supabase
      .from('product_types')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Create Product Type',
      details: `Created product type: ${newType.name}`
    });

    res.status(201).json(newType);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { name } = req.body;

    const { data: updated, error } = await supabase
      .from('product_types')
      .update({ name })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Update Product Type',
      details: `Updated product type: ${updated.name}`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { data: productType } = await supabase
      .from('product_types')
      .select('name')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('product_types')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await supabase.from('logs').insert({
      role: 'owner',
      action: 'Delete Product Type',
      details: `Deleted product type: ${productType?.name}`
    });

    res.json({ message: 'Product type deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;