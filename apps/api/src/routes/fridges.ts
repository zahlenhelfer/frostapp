import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Fridge, FrostItem, Shelf, CreateFridgeRequest, UpdateFridgeRequest, CreateItemRequest, UpdateItemRequest, UpdateShelfRequest } from '@frostapp/shared';
import { validateFridgeName, validateShelfCount, validateItemName, validateDepositDate, isValidUUID } from '../utils/validation.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { getDatabase } from '../db/database.js';

const router = Router();

// Helper functions
function generateId(): string {
  return uuidv4();
}

// Database helper functions
async function getFridgeWithShelves(fridgeId: string): Promise<Fridge | null> {
  const db = getDatabase();
  
  // Get fridge
  const fridgeRow = await db.get('SELECT * FROM fridges WHERE id = ?', fridgeId);
  if (!fridgeRow) return null;

  // Get shelves with items
  const shelves = await db.all(
    `SELECT s.* FROM shelves s 
     WHERE s.fridge_id = ? 
     ORDER BY s.position ASC`,
    fridgeId
  );

  const shelvesWithItems: Shelf[] = await Promise.all(
    shelves.map(async (shelfRow: any) => {
      const items = await db.all(
        `SELECT id, name, deposit_date as depositDate, created_at as createdAt, updated_at as updatedAt 
         FROM items 
         WHERE shelf_id = ? 
         ORDER BY created_at ASC`,
        shelfRow.id
      );
      
      return {
        id: shelfRow.id,
        name: shelfRow.name,
        items: items.map((item: any) => ({
          id: item.id,
          name: item.name,
          depositDate: item.depositDate,
        })),
      };
    })
  );

  return {
    id: fridgeRow.id,
    name: fridgeRow.name,
    shelfCount: fridgeRow.shelf_count,
    shelves: shelvesWithItems,
  };
}

async function createShelves(db: any, fridgeId: string, count: number): Promise<void> {
  const shelves = Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    name: `Fach ${i + 1}`,
    position: i,
  }));

  for (const shelf of shelves) {
    await db.run(
      'INSERT INTO shelves (id, fridge_id, name, position) VALUES (?, ?, ?, ?)',
      [shelf.id, fridgeId, shelf.name, shelf.position]
    );
  }
}

// GET /api/fridges - List all fridges
router.get('/', async (_req, res, next) => {
  try {
    const db = getDatabase();
    const fridgeRows = await db.all('SELECT id FROM fridges ORDER BY created_at DESC');
    
    const fridges = await Promise.all(
      fridgeRows.map((row: any) => getFridgeWithShelves(row.id))
    );
    
    res.json(fridges.filter((f): f is Fridge => f !== null));
  } catch (error) {
    next(error);
  }
});

// POST /api/fridges - Create a new fridge
router.post('/', async (req, res, next) => {
  try {
    const { name, shelfCount } = req.body as CreateFridgeRequest;

    // Validate name with enhanced security
    const nameValidation = validateFridgeName(name);
    if (!nameValidation.valid) {
      throw new BadRequestError(nameValidation.error!);
    }

    // Validate shelf count
    const countValidation = validateShelfCount(shelfCount ?? 4);
    if (!countValidation.valid) {
      throw new BadRequestError(countValidation.error!);
    }

    const db = getDatabase();
    const fridgeId = generateId();
    const finalShelfCount = countValidation.value!;

    // Insert fridge
    await db.run(
      'INSERT INTO fridges (id, name, shelf_count) VALUES (?, ?, ?)',
      [fridgeId, nameValidation.value!, finalShelfCount]
    );

    // Create shelves
    await createShelves(db, fridgeId, finalShelfCount);

    // Get complete fridge
    const fridge = await getFridgeWithShelves(fridgeId);
    res.status(201).json(fridge);
  } catch (error) {
    next(error);
  }
});

// GET /api/fridges/:id - Get a specific fridge
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new BadRequestError('Invalid fridge ID format');
    }
    
    const fridge = await getFridgeWithShelves(id);

    if (!fridge) {
      throw new NotFoundError('Fridge not found');
    }

    res.json(fridge);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/fridges/:id - Update a fridge
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateFridgeRequest;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new BadRequestError('Invalid fridge ID format');
    }
    
    const db = getDatabase();
    const fridgeRow = await db.get('SELECT * FROM fridges WHERE id = ?', id);

    if (!fridgeRow) {
      throw new NotFoundError('Fridge not found');
    }

    if (updates.name !== undefined) {
      const nameValidation = validateFridgeName(updates.name);
      if (!nameValidation.valid) {
        throw new BadRequestError(nameValidation.error!);
      }
      await db.run(
        'UPDATE fridges SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nameValidation.value!, id]
      );
    }

    if (updates.shelfCount !== undefined) {
      const countValidation = validateShelfCount(updates.shelfCount);
      if (!countValidation.valid) {
        throw new BadRequestError(countValidation.error!);
      }
      
      const newCount = countValidation.value!;
      const currentCount = fridgeRow.shelf_count;

      // Adjust shelves
      if (newCount > currentCount) {
        // Add shelves
        const additionalShelves = Array.from({ length: newCount - currentCount }, (_, i) => ({
          id: generateId(),
          name: `Fach ${currentCount + i + 1}`,
          position: currentCount + i,
        }));

        for (const shelf of additionalShelves) {
          await db.run(
            'INSERT INTO shelves (id, fridge_id, name, position) VALUES (?, ?, ?, ?)',
            [shelf.id, id, shelf.name, shelf.position]
          );
        }
      } else if (newCount < currentCount) {
        // Remove shelves (only if they're empty)
        const shelvesToRemove = await db.all(
          'SELECT s.id, COUNT(i.id) as item_count FROM shelves s LEFT JOIN items i ON s.id = i.shelf_id WHERE s.fridge_id = ? AND s.position >= ? GROUP BY s.id',
          [id, newCount]
        );

        const nonEmptyShelf = shelvesToRemove.find((s: any) => s.item_count > 0);
        if (nonEmptyShelf) {
          throw new BadRequestError('Cannot remove shelves that contain items');
        }

        // Delete the empty shelves
        for (const shelf of shelvesToRemove) {
          await db.run('DELETE FROM shelves WHERE id = ?', shelf.id);
        }
      }

      await db.run(
        'UPDATE fridges SET shelf_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newCount, id]
      );
    }

    const fridge = await getFridgeWithShelves(id);
    res.json(fridge);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/fridges/:id - Delete a fridge
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new BadRequestError('Invalid fridge ID format');
    }
    
    const db = getDatabase();
    const fridgeRow = await db.get('SELECT id FROM fridges WHERE id = ?', id);

    if (!fridgeRow) {
      throw new NotFoundError('Fridge not found');
    }

    // Cascading delete will handle shelves and items
    await db.run('DELETE FROM fridges WHERE id = ?', id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/fridges/:id/shelves/:shelfId/items - Add item to shelf
router.post('/:id/shelves/:shelfId/items', async (req, res, next) => {
  try {
    const { id, shelfId } = req.params;
    const { name, depositDate } = req.body as CreateItemRequest;

    // Validate UUID formats
    if (!isValidUUID(id)) {
      throw new BadRequestError('Invalid fridge ID format');
    }
    if (!isValidUUID(shelfId)) {
      throw new BadRequestError('Invalid shelf ID format');
    }

    const db = getDatabase();
    const fridgeRow = await db.get('SELECT id FROM fridges WHERE id = ?', id);
    if (!fridgeRow) {
      throw new NotFoundError('Fridge not found');
    }

    const shelfRow = await db.get('SELECT id FROM shelves WHERE id = ? AND fridge_id = ?', [shelfId, id]);
    if (!shelfRow) {
      throw new NotFoundError('Shelf not found');
    }

    // Validate item name
    const nameValidation = validateItemName(name);
    if (!nameValidation.valid) {
      throw new BadRequestError(nameValidation.error!);
    }

    // Validate deposit date
    const dateValidation = validateDepositDate(depositDate);
    if (!dateValidation.valid) {
      throw new BadRequestError(dateValidation.error!);
    }

    const itemId = generateId();
    await db.run(
      'INSERT INTO items (id, shelf_id, name, deposit_date) VALUES (?, ?, ?, ?)',
      [itemId, shelfId, nameValidation.value!, dateValidation.value!]
    );

    const item: FrostItem = {
      id: itemId,
      name: nameValidation.value!,
      depositDate: dateValidation.value!,
    };

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/fridges/:id/shelves/:shelfId/items/:itemId - Update item
router.patch('/:id/shelves/:shelfId/items/:itemId', async (req, res, next) => {
  try {
    const { id, shelfId, itemId } = req.params;
    const updates = req.body as UpdateItemRequest;

    // Validate UUID formats
    if (!isValidUUID(id)) {
      throw new BadRequestError('Invalid fridge ID format');
    }
    if (!isValidUUID(shelfId)) {
      throw new BadRequestError('Invalid shelf ID format');
    }
    if (!isValidUUID(itemId)) {
      throw new BadRequestError('Invalid item ID format');
    }

    const db = getDatabase();
    const fridgeRow = await db.get('SELECT id FROM fridges WHERE id = ?', id);
    if (!fridgeRow) {
      throw new NotFoundError('Fridge not found');
    }

    const shelfRow = await db.get('SELECT id FROM shelves WHERE id = ? AND fridge_id = ?', [shelfId, id]);
    if (!shelfRow) {
      throw new NotFoundError('Shelf not found');
    }

    const itemRow = await db.get('SELECT * FROM items WHERE id = ? AND shelf_id = ?', [itemId, shelfId]);
    if (!itemRow) {
      throw new NotFoundError('Item not found');
    }

    let updatedName = itemRow.name;
    let updatedDate = itemRow.deposit_date;

    if (updates.name !== undefined) {
      const nameValidation = validateItemName(updates.name);
      if (!nameValidation.valid) {
        throw new BadRequestError(nameValidation.error!);
      }
      updatedName = nameValidation.value!;
    }

    if (updates.depositDate !== undefined) {
      const dateValidation = validateDepositDate(updates.depositDate);
      if (!dateValidation.valid) {
        throw new BadRequestError(dateValidation.error!);
      }
      updatedDate = dateValidation.value!;
    }

    await db.run(
      'UPDATE items SET name = ?, deposit_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedName, updatedDate, itemId]
    );

    const item: FrostItem = {
      id: itemId,
      name: updatedName,
      depositDate: updatedDate,
    };

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/fridges/:id/shelves/:shelfId/items/:itemId - Delete item
router.delete('/:id/shelves/:shelfId/items/:itemId', async (req, res, next) => {
  try {
    const { id, shelfId, itemId } = req.params;

    // Validate UUID formats
    if (!isValidUUID(id)) {
      throw new BadRequestError('Invalid fridge ID format');
    }
    if (!isValidUUID(shelfId)) {
      throw new BadRequestError('Invalid shelf ID format');
    }
    if (!isValidUUID(itemId)) {
      throw new BadRequestError('Invalid item ID format');
    }

    const db = getDatabase();
    const fridgeRow = await db.get('SELECT id FROM fridges WHERE id = ?', id);
    if (!fridgeRow) {
      throw new NotFoundError('Fridge not found');
    }

    const shelfRow = await db.get('SELECT id FROM shelves WHERE id = ? AND fridge_id = ?', [shelfId, id]);
    if (!shelfRow) {
      throw new NotFoundError('Shelf not found');
    }

    const itemRow = await db.get('SELECT id FROM items WHERE id = ? AND shelf_id = ?', [itemId, shelfId]);
    if (!itemRow) {
      throw new NotFoundError('Item not found');
    }

    await db.run('DELETE FROM items WHERE id = ?', itemId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/fridges/:id/shelves/:shelfId - Update shelf name
router.patch('/:id/shelves/:shelfId', async (req, res, next) => {
  try {
    const { id, shelfId } = req.params;
    const { name } = req.body as UpdateShelfRequest;

    // Validate UUID formats
    if (!isValidUUID(id)) {
      throw new BadRequestError('Invalid fridge ID format');
    }
    if (!isValidUUID(shelfId)) {
      throw new BadRequestError('Invalid shelf ID format');
    }

    const db = getDatabase();
    const fridgeRow = await db.get('SELECT id FROM fridges WHERE id = ?', id);
    if (!fridgeRow) {
      throw new NotFoundError('Fridge not found');
    }

    const shelfRow = await db.get('SELECT * FROM shelves WHERE id = ? AND fridge_id = ?', [shelfId, id]);
    if (!shelfRow) {
      throw new NotFoundError('Shelf not found');
    }

    // Validate shelf name (same as item name validation)
    const nameValidation = validateItemName(name);
    if (!nameValidation.valid) {
      throw new BadRequestError(nameValidation.error!);
    }

    await db.run(
      'UPDATE shelves SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nameValidation.value!, shelfId]
    );

    // Get items for this shelf
    const items = await db.all(
      'SELECT id, name, deposit_date as depositDate FROM items WHERE shelf_id = ? ORDER BY created_at ASC',
      shelfId
    );

    const shelf: Shelf = {
      id: shelfId,
      name: nameValidation.value!,
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        depositDate: item.depositDate,
      })),
    };

    res.json(shelf);
  } catch (error) {
    next(error);
  }
});

export { router as fridgeRouter };
