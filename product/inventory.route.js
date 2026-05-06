const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Inventory = require('./inventory.model.js');
const Product = require('../product/product.model.js');

// Helper
const toNum = (v) => (typeof v === 'number' ? v : Number(v));

/* =====================================================
   CREATE INVENTORY HELPER
===================================================== */
async function createInventoryForNewProduct(pid, vid, initialStock = 0, opts = {}) {
  try {
    if (!pid || !vid) throw new Error('pid and vid required');

    const product = await Product.findOne({ pid: toNum(pid) });
    if (!product) throw new Error(`Product pid ${pid} not found`);

    const existing = await Inventory.findOne({ pid: toNum(pid), vid: toNum(vid) });

    if (existing) {
      if (initialStock && initialStock > 0) {
        existing.stock = existing.stock + toNum(initialStock);
        if (opts.updatedBy) existing.updatedBy = opts.updatedBy;
        await existing.save();
      }
      return existing;
    }

    const inv = new Inventory({
      pid: toNum(pid),
      vid: toNum(vid),
      stock: toNum(initialStock) || 0,
      reserved: 0,
      soldCount: 0,
      threshold: opts.threshold ?? 5,
      updatedBy: opts.updatedBy || null,
    });

    await inv.save();
    return inv;

  } catch (err) {
    throw err;
  }
}

module.exports.createInventoryForNewProduct = createInventoryForNewProduct;

/* =====================================================
   PATCH STOCK (SET / INC)
===================================================== */
router.patch('/stock/:pid/vendor/:vid', async (req, res) => {
  try {
    const pid = toNum(req.params.pid);
    const vid = toNum(req.params.vid);

    const user = req.user || {};
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (user.role === 'vendor' && Number(user.vid) !== vid) {
      return res.status(403).json({
        message: 'Forbidden - cannot modify another vendor inventory',
      });
    }

    const mode = (req.query.mode || 'inc').toLowerCase();

    // ===== SET MODE =====
    if (mode === 'set') {
      const stockVal = Number(req.body.stock);

      if (!Number.isFinite(stockVal) || stockVal < 0) {
        return res.status(400).json({ message: 'stock must be >= 0' });
      }

      const inv = await Inventory.findOneAndUpdate(
        { pid, vid },
        {
          $set: {
            stock: stockVal,
            updatedAt: new Date(),
            updatedBy: user.username || user.id || null,
          },
        },
        { new: true }
      );

      if (!inv) return res.status(404).json({ message: 'Inventory not found' });

      return res.json(inv);
    }

    // ===== INC MODE =====
    const delta = Number(req.body.delta);

    if (!Number.isFinite(delta)) {
      return res.status(400).json({ message: 'delta (number) required' });
    }

    const inv = await Inventory.findOneAndUpdate(
      { pid, vid },
      {
        $inc: { stock: delta },
        $set: {
          updatedAt: new Date(),
          updatedBy: user.username || user.id || null,
        },
      },
      { new: true }
    );

    if (!inv) return res.status(404).json({ message: 'Inventory not found' });

    if (inv.stock < 0) {
      await Inventory.updateOne({ pid, vid }, { $inc: { stock: -delta } });
      return res.status(400).json({
        message: 'Operation would make stock negative',
      });
    }

    return res.json(inv);

  } catch (err) {
    console.error('vendor update stock error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   PURCHASE API
===================================================== */
router.post('/purchase', async (req, res) => {
  console.log('purchase request body:', req.body);

  try {
    const items = req.body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items required' });
    }

    // Validate input
    for (const it of items) {
      if (!it.pid || !it.vid || !it.qty) {
        return res.status(400).json({
          message: 'each item must include pid, vid and qty',
        });
      }

      if (!Number.isFinite(Number(it.qty)) || Number(it.qty) <= 0) {
        return res.status(400).json({
          message: 'qty must be a positive number',
        });
      }
    }

    const updatedItems = [];

    for (const it of items) {
      const pid = toNum(it.pid);
      const vid = toNum(it.vid);
      const qty = toNum(it.qty);

      const inv = await Inventory.findOneAndUpdate(
        { pid, vid, stock: { $gte: qty } },
        {
          $inc: { stock: -qty, soldCount: qty },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );

      if (!inv) {
        // rollback
        if (updatedItems.length > 0) {
          try {
            const rollbackPromises = updatedItems.map((ui) =>
              Inventory.updateOne(
                { pid: ui.pid, vid: ui.vid },
                { $inc: { stock: ui.qty, soldCount: -ui.qty } }
              )
            );
            await Promise.all(rollbackPromises);
            console.warn('Rolled back previous inventory updates');
          } catch (rbErr) {
            console.error('Rollback failed:', rbErr);
          }
        }

        return res.status(400).json({
          error: `Insufficient stock for pid ${pid}, vid ${vid}`,
        });
      }

      updatedItems.push({ pid, vid, qty });
    }

    console.log('Purchase successful:', updatedItems);

    return res.json({
      success: true,
      message: 'Purchase completed',
      items: updatedItems,
    });

  } catch (err) {
    console.error('purchase error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   GETTERS
===================================================== */
router.get('/getstock/:pid/:vid', async (req, res) => {
  try {
    const pid = toNum(req.params.pid);
    const vid = toNum(req.params.vid);

    const inv = await Inventory.findOne({ pid, vid });

    if (!inv) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    return res.json({
      stock: inv.stock,
      reserved: inv.reserved,
      soldCount: inv.soldCount,
    });

  } catch (err) {
    console.error('get stock error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/inventorybyvendor/:vid', async (req, res) => {
  try {
    const vid = toNum(req.params.vid);
    const invRecords = await Inventory.find({ vid });
    return res.json(invRecords);
  } catch (err) {
    console.error('get inventory by vendor error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/inventorybyproduct/:pid', async (req, res) => {
  try {
    const pid = toNum(req.params.pid);
    const invRecords = await Inventory.find({ pid });
    return res.json(invRecords);
  } catch (err) {
    console.error('get inventory by product error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/allinventory', async (req, res) => {
  try {
    const invRecords = await Inventory.find();
    return res.json(invRecords);
  } catch (err) {
    console.error('get all inventory error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   SOFT DELETE
===================================================== */
router.patch('/deletestock/:pid/vendor/:vid', async (req, res) => {
  try {
    const pid = toNum(req.params.pid);
    const vid = toNum(req.params.vid);

    const inv = await Inventory.findOneAndUpdate(
      { pid, vid },
      {
        $set: {
          status: 'inactive',
          stock: 0,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!inv) return res.status(404).json({ message: 'Inventory not found' });

    res.json({ inventory: inv });

  } catch (err) {
    console.error('delete stock error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   RESTORE
===================================================== */
router.patch('/restorestock/:pid/vendor/:vid', async (req, res) => {
  try {
    const pid = toNum(req.params.pid);
    const vid = toNum(req.params.vid);

    const inv = await Inventory.findOneAndUpdate(
      { pid, vid },
      {
        $set: {
          status: 'active',
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!inv) return res.status(404).json({ message: 'Inventory not found' });

    res.json({ inventory: inv });

  } catch (err) {
    console.error('restore error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   VALIDATE STOCK
===================================================== */
router.post('/validate-stock', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required' });
    }

    for (const it of items) {
      const pid = Number(it.pid);
      const vid = Number(it.vid);
      const qty = Number(it.qty);

      if (!pid || !vid || !qty || qty <= 0) {
        return res.status(400).json({
          message: 'each item must include pid, vid and qty > 0',
        });
      }

      const inv = await Inventory.findOne({ pid, vid, status: 'active' });

      if (!inv) {
        return res.status(400).json({
          message: `Inventory not found for pid ${pid}, vid ${vid}`,
        });
      }

      if (inv.stock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for pid ${pid}. Available: ${inv.stock}`,
        });
      }
    }

    return res.json({
      success: true,
      message: 'Stock validated successfully',
    });

  } catch (err) {
    console.error('validate-stock error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   EXPORT
===================================================== */
module.exports = router;
module.exports.createInventoryForNewProduct = createInventoryForNewProduct;