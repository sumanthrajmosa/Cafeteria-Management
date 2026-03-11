import { useState, useEffect } from 'react';
import { totpAPI } from '../services/api';

function TotpSetup() {
    const [status, setStatus] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [secret, setSecret] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [disableCode, setDisableCode] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('idle'); // 'idle' | 'setup' | 'disabling'

    const showMsg = (type, text) => setMessage({ type, text });

    useEffect(() => { fetchStatus(); }, []);

    const fetchStatus = async () => {
        try {
            const res = await totpAPI.getStatus();
            setStatus(res.data);
        } catch {
            showMsg('error', 'Failed to load two-factor authentication status.');
        }
    };

    const handleSetup = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await totpAPI.setup();
            setQrCode(res.data.qrCode);
            setSecret(res.data.secret);
            setStep('setup');
        } catch (e) {
            showMsg('error', e.response?.data?.error || 'Failed to start 2FA setup.');
        }
        setLoading(false);
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await totpAPI.confirm(confirmCode);
            showMsg('success', 'Two-factor authentication is now enabled.');
            setStep('idle');
            setQrCode(null);
            setSecret('');
            setConfirmCode('');
            fetchStatus();
        } catch (e) {
            showMsg('error', e.response?.data?.error || 'Invalid code. Please try again.');
        }
        setLoading(false);
    };

    const handleDisable = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await totpAPI.disable(disablePassword, disableCode);
            showMsg('success', 'Two-factor authentication has been disabled.');
            setStep('idle');
            setDisablePassword('');
            setDisableCode('');
            fetchStatus();
        } catch (e) {
            showMsg('error', e.response?.data?.error || 'Failed to disable 2FA.');
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Two-Factor Authentication
            </h1>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>
                Use a TOTP authenticator app such as Google Authenticator or Authy to add
                an extra layer of security to your account.
            </p>

            {message.text && (
                <div
                    className={`badge badge-${message.type === 'error' ? 'error' : 'success'}`}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    {message.text}
                </div>
            )}

            {/* Status banner */}
            {status && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
                    background: status.totpEnabled ? 'rgba(34,197,94,0.08)' : 'var(--gray-50)',
                    border: `1px solid ${status.totpEnabled ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    marginBottom: '2rem'
                }}>
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                            Two-factor authentication is{' '}
                            {status.totpEnabled
                                ? <span style={{ color: '#16a34a' }}>enabled</span>
                                : <span style={{ color: '#dc2626' }}>not configured</span>}
                        </div>
                        <div className="text-sm text-muted">
                            {status.totpEnabled
                                ? 'Your account is protected with a one-time password on each login.'
                                : 'Your account is currently not protected by 2FA. Enable it below.'}
                        </div>
                    </div>
                </div>
            )}

            {/* Enable flow */}
            {!status?.totpEnabled && step === 'idle' && (
                <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.6rem' }}>
                        Enable Two-Factor Authentication
                    </h2>
                    <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>
                        After setup, a 6-digit code from your authenticator app will be required on every login.
                    </p>
                    <button className="btn btn-primary" onClick={handleSetup} disabled={loading}>
                        {loading ? 'Generating...' : 'Set Up Two-Factor Authentication'}
                    </button>
                </div>
            )}

            {step === 'setup' && qrCode && (
                <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.9rem' }}>
                        Scan the QR Code
                    </h2>
                    <ol className="text-sm" style={{ marginBottom: '1.5rem', paddingLeft: '1.25rem', lineHeight: 2 }}>
                        <li>Open Google Authenticator, Authy, or any TOTP app.</li>
                        <li>Tap <strong>+</strong> and choose <strong>Scan a QR code</strong>.</li>
                        <li>Scan the code below, then enter the 6-digit code to confirm.</li>
                    </ol>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <img src={qrCode} alt="Two-factor authentication QR code"
                            style={{ width: 200, height: 200, border: '4px solid white', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} />
                    </div>

                    <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                        <p className="text-xs text-muted" style={{ marginBottom: 4 }}>Cannot scan the code? Enter this key manually:</p>
                        <code style={{ fontSize: '0.88rem', letterSpacing: '0.12rem', wordBreak: 'break-all' }}>{secret}</code>
                    </div>

                    <form onSubmit={handleConfirm}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmCode">Enter the 6-digit code to confirm</label>
                            <input id="confirmCode" type="text" inputMode="numeric" maxLength={6}
                                className="form-input"
                                value={confirmCode}
                                onChange={e => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                style={{ letterSpacing: '0.4rem', fontSize: '1.4rem', textAlign: 'center' }}
                                autoFocus required />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary"
                                disabled={loading || confirmCode.length !== 6}>
                                {loading ? 'Verifying...' : 'Confirm and Enable'}
                            </button>
                            <button type="button" className="btn btn-ghost"
                                onClick={() => { setStep('idle'); setQrCode(null); }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Disable flow */}
            {status?.totpEnabled && step === 'idle' && (
                <div style={{ marginTop: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.6rem' }}>
                        Disable Two-Factor Authentication
                    </h2>
                    <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>
                        Disabling 2FA removes the one-time password requirement on login.
                        You will need your current password and a valid code to confirm this action.
                    </p>
                    <button
                        className="btn btn-ghost"
                        style={{ color: '#dc2626', borderColor: '#dc2626' }}
                        onClick={() => setStep('disabling')}>
                        Disable Two-Factor Authentication
                    </button>
                </div>
            )}

            {step === 'disabling' && (
                <form onSubmit={handleDisable}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Confirm Disable
                    </h2>
                    <div className="form-group">
                        <label className="form-label" htmlFor="disablePassword">Current Password</label>
                        <input id="disablePassword" type="password" className="form-input"
                            value={disablePassword}
                            onChange={e => setDisablePassword(e.target.value)}
                            placeholder="Your account password" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="disableCode">Authenticator Code</label>
                        <input id="disableCode" type="text" inputMode="numeric" maxLength={6}
                            className="form-input"
                            value={disableCode}
                            onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            style={{ letterSpacing: '0.4rem', fontSize: '1.4rem', textAlign: 'center' }}
                            required />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary"
                            style={{ background: '#dc2626' }}
                            disabled={loading || !disablePassword || disableCode.length !== 6}>
                            {loading ? 'Disabling...' : 'Confirm Disable'}
                        </button>
                        <button type="button" className="btn btn-ghost"
                            onClick={() => { setStep('idle'); setDisablePassword(''); setDisableCode(''); }}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default TotpSetup;
