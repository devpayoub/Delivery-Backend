import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  isValidName, isValidPhone, isValidAddress, isValidUUID, isValidStatus,
  sanitize, validateIdParam
} from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('deliveries').select('*, cities(name), product_types(name)').order('created_at', { ascending: false });

    if (req.user.role === 'employer') {
      query = query.eq('employer_id', req.user.id);
    } else if (req.user.role === 'driver') {
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

router.get('/:id', authenticateToken, validateIdParam, async (req, res) => {
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
    if (!isValidName(client_name)) {
      return res.status(400).json({ error: 'Client name must be 1-100 characters' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone format (8-15 digits)' });
    }
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: 'Address must be 1-500 characters' });
    }
    if (!isValidUUID(product_type_id)) {
      return res.status(400).json({ error: 'Invalid product type ID format' });
    }
    if (!isValidUUID(city_id)) {
      return res.status(400).json({ error: 'Invalid city ID format' });
    }

    const employerId = req.user.role === 'owner' ? req.body.employer_id : req.user.id;
    if (req.user.role === 'owner' && req.body.employer_id && !isValidUUID(req.body.employer_id)) {
      return res.status(400).json({ error: 'Invalid employer ID format' });
    }

    const { data: newDelivery, error } = await supabase
      .from('deliveries')
      .insert({
        client_name: sanitize(client_name),
        phone: sanitize(phone),
        address: sanitize(address),
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
      details: `Created delivery for ${sanitize(client_name)}`
    });

    res.status(201).json(newDelivery);
  } catch (err) {
    console.error('Create delivery error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, validateIdParam, async (req, res) => {
  try {
    const { client_name, phone, address, product_type_id, city_id, assigned_driver_id, status, reason } = req.body;
    const updates = {};

    if (client_name !== undefined) {
      if (!isValidName(client_name)) return res.status(400).json({ error: 'Client name must be 1-100 characters' });
      updates.client_name = sanitize(client_name);
    }
    if (phone !== undefined) {
      if (!isValidPhone(phone)) return res.status(400).json({ error: 'Invalid phone format (8-15 digits)' });
      updates.phone = sanitize(phone);
    }
    if (address !== undefined) {
      if (!isValidAddress(address)) return res.status(400).json({ error: 'Address must be 1-500 characters' });
      updates.address = sanitize(address);
    }
    if (product_type_id !== undefined) {
      if (!isValidUUID(product_type_id)) return res.status(400).json({ error: 'Invalid product type ID format' });
      updates.product_type_id = product_type_id;
    }
    if (city_id !== undefined) {
      if (!isValidUUID(city_id)) return res.status(400).json({ error: 'Invalid city ID format' });
      updates.city_id = city_id;
    }
    if (assigned_driver_id !== undefined) {
      if (assigned_driver_id && !isValidUUID(assigned_driver_id)) return res.status(400).json({ error: 'Invalid driver ID format' });
      updates.assigned_driver_id = assigned_driver_id;
    }
    if (status !== undefined) {
      if (!isValidStatus(status)) return res.status(400).json({ error: 'Status must be one of: Pending, In Transit, Delivered, Cancelled' });
      updates.status = status;
    }
    if (reason !== undefined) {
      updates.reason = reason ? sanitize(reason) : reason;
    }

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

router.delete('/:id', authenticateToken, requireRole('employer', 'owner'), validateIdParam, async (req, res) => {
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