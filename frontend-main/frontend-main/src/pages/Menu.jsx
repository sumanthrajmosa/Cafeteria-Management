import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { menuAPI } from '../services/api';

function Menu() {
    const { isAdmin, isStaff } = useAuth();

    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Admin modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
    name: '',
    category: 'main',
    price: '',
    calories: '',
    protein: '',
    carbs: '',
    preparationTime: '',
    sustainabilityScore: 3,
    available: true
});


    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        try {
            const res = await menuAPI.getAll();
            setMenuItems(res.data);
        } catch (err) {
            console.error('Error loading menu:', err);
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       STAFF / ADMIN – TOGGLE
    ========================= */
    const toggleAvailability = async (item) => {
        await menuAPI.toggleAvailability(item._id, !item.available);
        loadMenu();
    };

    /* =========================
       ADMIN – ADD ITEM
    ========================= */
    const addItem = async () => {
        if (!newItem.name || !newItem.price) return;

       await menuAPI.addItem({
    name: newItem.name,
    category: newItem.category,
    price: Number(newItem.price),
    nutritionInfo: {
        calories: Number(newItem.calories),
        protein: Number(newItem.protein),
        carbs: Number(newItem.carbs)
    },
    preparationTime: Number(newItem.preparationTime),
    sustainabilityScore: Number(newItem.sustainabilityScore),
    available: newItem.available
});


        setShowAddModal(false);
        setNewItem({ name: '', category: 'main', price: '', preparationTime: '' });
        loadMenu();
    };

    /* =========================
       ADMIN – DELETE ITEM
    ========================= */
    const deleteItem = async (id) => {
        if (!window.confirm('Remove this item from menu?')) return;
        await menuAPI.deleteItem(id);
        loadMenu();
    };

    const categories = ['all', 'main', 'side', 'beverage', 'dessert'];

    const filteredItems =
        filter === 'all'
            ? menuItems
            : menuItems.filter(item => item.category === filter);

    if (loading) {
        return <div className="text-center">Loading menu...</div>;
    }

    return (
        <div>
            {/* ================= HEADER ================= */}
            <div className="page-header">
                <h1 className="page-title">Menu</h1>
                <p className="page-subtitle">Browse available food items</p>
            </div>

            {/* ================= ADMIN BAR ================= */}
            {isAdmin && (
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div className="flex justify-between items-center">
                        <h3 className="card-title">Menu Management</h3>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAddModal(true)}
                        >
                            + Add New Item
                        </button>
                    </div>
                </div>
            )}

            {/* ================= FILTER ================= */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`btn ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter(cat)}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ================= MENU GRID ================= */}
            <div className="menu-grid" style={{ marginTop: 'var(--spacing-lg)' }}>
                {filteredItems.map(item => (
                    <div
                        key={item._id}
                        className="menu-item-card"
                        style={{ opacity: item.available ? 1 : 0.5 }}
                    >
                        <div className="flex justify-between">
                            <div className="menu-item-category">{item.category}</div>
                            {!item.available && (
                                <span className="badge badge-error">Unavailable</span>
                            )}
                        </div>

                        <div className="menu-item-name">{item.name}</div>
                        <div className="menu-item-price">Rs {item.price.toFixed(2)}</div>

                        <div className="menu-item-nutrition">
                            <span>{item.nutritionInfo?.calories || 0} cal</span>
                            <span>{item.nutritionInfo?.protein || 0}g protein</span>
                            <span>{item.nutritionInfo?.carbs || 0}g carbs</span>
                        </div>

                        <div style={{ marginTop: '0.75rem' }}>
                            <span className="text-xs text-muted">
                                Prep time: {item.preparationTime} min
                            </span>
                        </div>

                        {/* STAFF + ADMIN */}
                        {(isStaff || isAdmin) && (
                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    className={`btn btn-sm ${
                                        item.available ? 'btn-secondary' : 'btn-primary'
                                    }`}
                                    style={{ width: '100%' }}
                                    onClick={() => toggleAvailability(item)}
                                >
                                    {item.available ? 'Mark Unavailable' : 'Mark Available'}
                                </button>
                            </div>
                        )}

                        {/* ADMIN ONLY */}
                        {isAdmin && (
                            <button
                                className="btn btn-sm btn-error"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                onClick={() => deleteItem(item._id)}
                            >
                                Remove Item
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="card text-center">
                    <p className="text-muted">No items found</p>
                </div>
            )}

            {/* ================= ADD ITEM MODAL ================= */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Add Menu Item</h3>

                        <div className="form-group">
                        <label className="form-label">Item Name</label>
                        <input
                            className="form-input"
                            placeholder="Eg: Lassi"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        />
                        </div>

                        <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={newItem.category}
                            onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                        >
                            <option value="main">Main</option>
                            <option value="side">Side</option>
                            <option value="beverage">Beverage</option>
                            <option value="dessert">Dessert</option>
                        </select>
                        </div>

                        <div className="form-group">
                        <label className="form-label">Price (Rs)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="50"
                            value={newItem.price}
                            onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                        />
                        </div>

                        <div className="form-group">
                        <label className="form-label">Preparation Time (min)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="2"
                            value={newItem.preparationTime}
                            onChange={e => setNewItem({ ...newItem, preparationTime: e.target.value })}
                        />
                        </div>

                    <div className="nutrition-grid">
                    <div className="form-group">
                        <label className="form-label">Calories</label>
                        <input
                        type="number"
                        className="form-input"
                        value={newItem.calories}
                        onChange={e => setNewItem({ ...newItem, calories: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Protein (g)</label>
                        <input
                        type="number"
                        className="form-input"
                        value={newItem.protein}
                        onChange={e => setNewItem({ ...newItem, protein: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Carbs (g)</label>
                        <input
                        type="number"
                        className="form-input"
                        value={newItem.carbs}
                        onChange={e => setNewItem({ ...newItem, carbs: e.target.value })}
                        />
                    </div>
                    </div>

                       <div className="form-group">
                <label className="form-label">Sustainability Score (1–5)</label>
                <select
                    className="form-select"
                    value={newItem.sustainabilityScore}
                    onChange={e =>
                    setNewItem({ ...newItem, sustainabilityScore: e.target.value })
                    }
                >
                    {[1,2,3,4,5].map(v => (
                    <option key={v} value={v}>{v}</option>
                    ))}
                </select>
                </div>


                        <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={addItem}>
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Menu;
