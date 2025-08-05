import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store auth token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Dwarf Coconut Disease Detector</title>
        <meta name="description" content="Login to access the Dwarf Coconut Disease Detection dashboard" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥥</text></svg>" />
      </Head>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>🌴 Dwarf Coconut Detector</h1>
            <p>Dwarf Coconut Disease Detection System</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="error-message">
                <span>❌ {error}</span>
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  🔐 Sign In
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>🏫 Southern Luzon State University</p>
            <p>Tayabas Campus - Agriculture</p>
          </div>
        </div>

        <style jsx>{`
          .login-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }

          .login-card {
            background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%);
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
            border: 1px solid #404040;
            width: 100%;
            max-width: 400px;
            text-align: center;
          }

          .login-header h1 {
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
            font-weight: 600;
            background: linear-gradient(135deg, #4CAF50, #66BB6A);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .login-header p {
            margin: 0 0 2rem 0;
            color: #b0b0b0;
            font-size: 0.9rem;
          }

          .login-form {
            text-align: left;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #ffffff;
            font-weight: 500;
            font-size: 0.9rem;
          }

          .form-group input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #404040;
            border-radius: 8px;
            background: #1a1a1a;
            color: #ffffff;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }

          .form-group input:focus {
            outline: none;
            border-color: #4CAF50;
            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
          }

          .form-group input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .form-group input::placeholder {
            color: #808080;
          }

          .error-message {
            background: rgba(244, 67, 54, 0.1);
            border: 1px solid #F44336;
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 1rem;
            color: #F44336;
            font-size: 0.9rem;
            text-align: center;
          }

          .login-btn {
            width: 100%;
            padding: 0.875rem 1.5rem;
            background: linear-gradient(135deg, #4CAF50, #66BB6A);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
          }

          .login-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #388E3C, #4CAF50);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
          }

          .login-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .login-footer {
            border-top: 1px solid #404040;
            padding-top: 1.5rem;
            text-align: center;
          }

          .login-footer p {
            margin: 0.25rem 0;
            color: #808080;
            font-size: 0.8rem;
          }

          @media (max-width: 480px) {
            .login-container {
              padding: 1rem;
            }
            
            .login-card {
              padding: 2rem;
            }
            
            .login-header h1 {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}
