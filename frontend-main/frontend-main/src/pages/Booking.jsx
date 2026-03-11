import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { slotsAPI, menuAPI, bookingsAPI } from '../services/api';
import upiQrCode from '../assets/upi-qr.png';

function Booking() {
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Payment modal state
    const [showPayment, setShowPayment] = useState(false);
    const [paymentTab, setPaymentTab] = useState('wallet');
    const [paymentStep, setPaymentStep] = useState('form'); // form | processing | success
    const [cardDetails, setCardDetails] = useState({
        number: '', name: '', expiry: '', cvv: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [slotsRes, menuRes] = await Promise.all([
                slotsAPI.getToday(),
                menuAPI.getAll()
            ]);
            const activeSlots = slotsRes.data.filter(s => s.status === 'available');

            // Deduplicate slots to prevent UI duplicates if DB has multiple entries
            const uniqueSlotsMap = new Map();
            activeSlots.forEach(slot => {
                const key = `${slot.mealType}-${slot.startTime}`;
                if (!uniqueSlotsMap.has(key)) {
                    uniqueSlotsMap.set(key, slot);
                }
            });

            setSlots(Array.from(uniqueSlotsMap.values()));
            setMenuItems(menuRes.data.filter(m => m.available));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (item) => {
        const exists = selectedItems.find(i => i.itemId === item._id);
        if (exists) {
            setSelectedItems(selectedItems.filter(i => i.itemId !== item._id));
        } else {
            setSelectedItems([...selectedItems, {
                itemId: item._id, name: item.name, quantity: 1, price: item.price
            }]);
        }
    };

    const updateQuantity = (itemId, quantity) => {
        setSelectedItems(selectedItems.map(item =>
            item.itemId === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
        ));
    };

    // Calculate total price
    const totalAmount = selectedItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
    );

    // Open payment modal
    const handleProceedToPay = () => {
        if (!selectedSlot) {
            setError('Please select a time slot');
            return;
        }
        if (selectedItems.length === 0) {
            setError('Please select at least one menu item');
            return;
        }
        setError('');
        setShowPayment(true);
        setPaymentStep('form');
        setPaymentTab('wallet');
    };

    // Process payment (mock - always succeeds after 2 seconds)
    const handlePayment = async () => {
        setPaymentStep('processing');

        // Simulate payment processing for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        setPaymentStep('success');

        // After showing success, create the booking
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Actually create the booking
        setSubmitting(true);
        try {
            const response = await bookingsAPI.create({
                slotId: selectedSlot._id,
                menuItems: selectedItems.map(i => ({
                    itemId: i.itemId, name: i.name, quantity: i.quantity
                }))
            });
            setShowPayment(false);
            setSuccess('Payment successful! Booking confirmed! Redirecting...');
            setTimeout(() => {
                navigate('/addons/claim', {
                    state: { bookingId: response.data._id || response.data.id }
                });
            }, 1500);
        } catch (error) {
            setShowPayment(false);
            setError(error.response?.data?.message || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    // Format card number with spaces
    const formatCardNumber = (value) => {
        const v = value.replace(/\D/g, '').slice(0, 16);
        return v.replace(/(.{4})/g, '$1 ').trim();
    };

    // Format expiry date
    const formatExpiry = (value) => {
        const v = value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 2) return v.slice(0, 2) + '/' + v.slice(2);
        return v;
    };

    const categories = ['main', 'side', 'beverage', 'dessert'];

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Book a Meal</h1>
                <p className="page-subtitle">Select a time slot, choose your items, and complete payment</p>
            </div>

            {error && (
                <div className="badge badge-error" style={{
                    width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div className="badge badge-success" style={{
                    width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem'
                }}>
                    {success}
                </div>
            )}

            <div className="dashboard-grid-2">
                {/* Time Slots */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Select Time Slot</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {slots.map(slot => (
                            <div
                                key={slot._id}
                                className={`queue-item ${selectedSlot?._id === slot._id ? 'current' : ''}`}
                                style={{ cursor: 'pointer', position: 'relative' }}
                                onClick={() => setSelectedSlot(slot)}
                            >
                                {slot.hasIncentive && (
                                    <span className="badge badge-info" style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px'
                                    }}>
                                        +{slot.incentivePoints} pts
                                    </span>
                                )}
                                <div>
                                    <div className="font-bold" style={{ textTransform: 'capitalize' }}>
                                        {slot.mealType}
                                    </div>
                                    <div className="text-xs text-muted">
                                        {slot.startTime} - {slot.endTime}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`badge ${slot.bookedCount < slot.capacity * 0.7 ? 'badge-success' : 'badge-warning'}`}>
                                        {slot.capacity - slot.bookedCount} spots
                                    </span>
                                </div>
                            </div>
                        ))}
                        {slots.length === 0 && (
                            <p className="text-muted text-center">No available slots</p>
                        )}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Your Order</h3>
                    </div>

                    {selectedSlot && (
                        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-100)' }}>
                            <div className="text-sm text-muted">Selected Slot</div>
                            <div className="font-bold" style={{ textTransform: 'capitalize' }}>
                                {selectedSlot.mealType} ({selectedSlot.startTime} - {selectedSlot.endTime})
                            </div>
                        </div>
                    )}

                    {selectedItems.length > 0 ? (
                        <div>
                            {selectedItems.map(item => (
                                <div key={item.itemId} className="flex justify-between items-center mb-2">
                                    <div>
                                        <span>{item.name}</span>
                                        <span className="text-xs text-muted" style={{ marginLeft: '0.5rem' }}>
                                            ₹{item.price.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                                        >
                                            -
                                        </button>
                                        <span style={{ width: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Total */}
                            <div style={{
                                marginTop: '1rem', paddingTop: '1rem',
                                borderTop: '2px solid var(--gray-200)',
                                display: 'flex', justifyContent: 'space-between',
                                fontWeight: 700, fontSize: '1.1rem'
                            }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--primary-600)' }}>₹{totalAmount.toFixed(2)}</span>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1.25rem', fontSize: '1rem', padding: '0.875rem', letterSpacing: '0.3px' }}
                                onClick={handleProceedToPay}
                                disabled={submitting}
                            >
                                {submitting ? 'Booking...' : `Proceed to Pay  ₹${totalAmount.toFixed(2)}`}
                            </button>
                        </div>
                    ) : (
                        <p className="text-muted text-center">No items selected</p>
                    )}
                </div>
            </div>

            {/* Menu Items */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">Menu Items</h3>
                </div>

                {categories.map(category => (
                    <div key={category} style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ textTransform: 'capitalize', marginBottom: '1rem', color: 'var(--gray-600)' }}>
                            {category}
                        </h4>
                        <div className="menu-grid">
                            {menuItems.filter(item => item.category === category).map(item => {
                                const isSelected = selectedItems.some(i => i.itemId === item._id);
                                return (
                                    <div
                                        key={item._id}
                                        className="menu-item-card"
                                        style={{
                                            cursor: 'pointer',
                                            border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--gray-200)'
                                        }}
                                        onClick={() => toggleItem(item)}
                                    >
                                        <div className="menu-item-name">{item.name}</div>
                                        <div className="menu-item-price">₹{item.price.toFixed(2)}</div>
                                        <div className="menu-item-nutrition">
                                            <span>{item.nutritionInfo?.calories || 0} cal</span>
                                            <span>{item.nutritionInfo?.protein || 0}g protein</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* ======================== PAYMENT MODAL ======================== */}
            {showPayment && (
                <div className="payment-overlay" onClick={() => paymentStep === 'form' && setShowPayment(false)}>
                    <div className="payment-modal" onClick={(e) => e.stopPropagation()}>

                        {/* Processing State */}
                        {paymentStep === 'processing' && (
                            <div className="payment-processing">
                                <div className="payment-spinner"></div>
                                <div className="payment-processing-text">Processing Payment...</div>
                                <div className="payment-processing-sub">Please do not close this window</div>
                            </div>
                        )}

                        {/* Success State */}
                        {paymentStep === 'success' && (
                            <div className="payment-success">
                                <div className="payment-success-icon">✓</div>
                                <div className="payment-success-text">Payment Successful!</div>
                                <div className="payment-success-sub">Creating your booking...</div>
                            </div>
                        )}

                        {/* Form State */}
                        {paymentStep === 'form' && (
                            <>
                                {/* Header */}
                                <div className="payment-modal-header">
                                    <h3>Secure Payment</h3>
                                    <button
                                        className="payment-close-btn"
                                        onClick={() => setShowPayment(false)}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Amount Display */}
                                <div className="payment-amount">
                                    <div className="payment-amount-label">Total Amount</div>
                                    <div className="payment-amount-value">₹{totalAmount.toFixed(2)}</div>
                                </div>

                                {/* Payment Tabs */}
                                <div className="payment-tabs">
                                    <button
                                        className={`payment-tab ${paymentTab === 'wallet' ? 'active' : ''}`}
                                        onClick={() => setPaymentTab('wallet')}
                                        id="payment-tab-wallet"
                                    >
                                        <span className="payment-tab-icon">W</span>
                                        Wallet
                                    </button>
                                    <button
                                        className={`payment-tab ${paymentTab === 'upi' ? 'active' : ''}`}
                                        onClick={() => setPaymentTab('upi')}
                                    >
                                        <span className="payment-tab-icon">U</span>
                                        UPI
                                    </button>
                                    <button
                                        className={`payment-tab ${paymentTab === 'card' ? 'active' : ''}`}
                                        onClick={() => setPaymentTab('card')}
                                    >
                                        <span className="payment-tab-icon">C</span>
                                        Card
                                    </button>
                                </div>

                                {/* Payment Body */}
                                <div className="payment-body">

                                    {/* WALLET TAB */}
                                    {paymentTab === 'wallet' && (
                                        <div>
                                            <div className="payment-wallet-balance">
                                                <div className="payment-wallet-balance-label">Cafeteria Wallet Balance</div>
                                                <div className="payment-wallet-balance-value">₹500.00</div>
                                            </div>
                                            <p className="text-sm text-muted" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                                ₹{totalAmount.toFixed(2)} will be deducted from your wallet.
                                                Remaining balance: ₹{(500 - totalAmount).toFixed(2)}
                                            </p>
                                            <button className="payment-btn wallet-btn" onClick={handlePayment}>
                                                Pay ₹{totalAmount.toFixed(2)} from Wallet
                                            </button>
                                        </div>
                                    )}

                                    {/* UPI TAB */}
                                    {paymentTab === 'upi' && (
                                        <div className="payment-upi-section">
                                            <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                                                Scan QR code with any UPI app to pay
                                            </p>
                                            <img
                                                src={upiQrCode}
                                                alt="UPI QR Code"
                                                className="payment-qr-img"
                                            />
                                            <div className="payment-upi-id">
                                                UPI ID: <strong>smartcafeteria@ybl</strong>
                                            </div>
                                            <button className="payment-btn upi-btn" onClick={handlePayment}>
                                                I have Paid ₹{totalAmount.toFixed(2)} ✓
                                            </button>
                                        </div>
                                    )}

                                    {/* CARD TAB */}
                                    {paymentTab === 'card' && (
                                        <div>
                                            <div className="form-group">
                                                <label className="form-label">Card Number</label>
                                                <input
                                                    className="form-input"
                                                    placeholder="1234 5678 9012 3456"
                                                    value={cardDetails.number}
                                                    onChange={(e) => setCardDetails({
                                                        ...cardDetails,
                                                        number: formatCardNumber(e.target.value)
                                                    })}
                                                    maxLength={19}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Cardholder Name</label>
                                                <input
                                                    className="form-input"
                                                    placeholder="John Doe"
                                                    value={cardDetails.name}
                                                    onChange={(e) => setCardDetails({
                                                        ...cardDetails,
                                                        name: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className="payment-card-row">
                                                <div className="form-group">
                                                    <label className="form-label">Expiry</label>
                                                    <input
                                                        className="form-input"
                                                        placeholder="MM/YY"
                                                        value={cardDetails.expiry}
                                                        onChange={(e) => setCardDetails({
                                                            ...cardDetails,
                                                            expiry: formatExpiry(e.target.value)
                                                        })}
                                                        maxLength={5}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">CVV</label>
                                                    <input
                                                        className="form-input"
                                                        placeholder="123"
                                                        type="password"
                                                        value={cardDetails.cvv}
                                                        onChange={(e) => setCardDetails({
                                                            ...cardDetails,
                                                            cvv: e.target.value.replace(/\D/g, '').slice(0, 3)
                                                        })}
                                                        maxLength={3}
                                                    />
                                                </div>
                                            </div>
                                            <button className="payment-btn" onClick={handlePayment}>
                                                Pay ₹{totalAmount.toFixed(2)}
                                            </button>
                                        </div>
                                    )}

                                    {/* Secure Payment Badge */}
                                    <div className="payment-secure">
                                        Secured ・ Smart Cafeteria Payment Gateway
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Booking;
