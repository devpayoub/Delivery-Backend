import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('deliveries').select('*, cities(name), product_types(name)').order('created_at', { ascending: false });

    if (req.user.role === 'employer') {
      query = query.eq('employer_id', req.user.id);
    } else if (req.user.role === 'driver') {
      // Get driver's city and show ALL deliveries for that city (City Pool Model)
      const { data: driver } = await supabase
        .from('drivers')
        .select('city_id')
        .eq('id', req.user.id)
        .single();
      
      if (driver?.city_id) {
        query = query.eq('city_id', driver.city_id);
      } else {
        query = query.eq('assigned_driver_id', req.user.id);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, requireRole('employer', 'owner'), async (req, res) => {
  try {
    const { client_name, phone, address, product_type_id, city_id } = req.body;

    if (!client_name || !phone || !address || !product_type_id || !city_id) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const employerId = req.user.role === 'owner' ? req.body.employer_id : req.user.id;

    const { data: newDelivery, error } = await supabase
      .from('deliveries')
      .insert({
        client_name,
        phone,
        address,
        product_type_id,
        city_id,
        employer_id: employerId,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('logs').insert({
      role: req.user.role,
      action: 'Create Delivery',
      details: `Created delivery for ${client_name}`
    });

    res.status(201).json(newDelivery);
  } catch (err) {
    console.error('Create delivery error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { client_name, phone, address, product_type_id, city_id, assigned_driver_id, status, reason } = req.body;
    const updates = {};
    
    if (client_name) updates.client_name = client_name;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (product_type_id) updates.product_type_id = product_type_id;
    if (city_id) updates.city_id = city_id;
    if (assigned_driver_id !== undefined) updates.assigned_driver_id = assigned_driver_id;
    if (status) updates.status = status;
    if (reason !== undefined) updates.reason = reason;

    const { data: updated, error } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('logs').insert({
      role: req.user.role,
      action: 'Update Delivery',
      details: `Updated delivery: ${updated.client_name}`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole('employer', 'owner'), async (req, res) => {
  try {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('client_name')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('deliveries')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await supabase.from('logs').insert({
      role: req.user.role,
      action: 'Delete Delivery',
      details: `Deleted delivery: ${delivery?.client_name}`
    });

    res.json({ message: 'Delivery deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;