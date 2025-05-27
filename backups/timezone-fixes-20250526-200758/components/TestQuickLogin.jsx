import React, { useState, useEffect } from 'react';

const testAccounts = [
  { email: 'admin@timetracker.app', password: 'admin123', name: 'System Admin', role: 'admin' },
  { email: 'stacy@timetracker.app', password: 'stacy123', name: 'Stacy', role: 'user' },
  { email: 'jeremy@timetracker.app', password: 'jeremy123', name: 'Jeremy', role: 'user' }
];

export default function TestQuickLogin() {
  const [lastUser, setLastUser] = useState(null);
  const [debug, setDebug] = useState({});

  useEffect(() => {
    const lastUserEmail = localStorage.getItem('lastUserEmail');
    const user = testAccounts.find(acc => acc.email === lastUserEmail);
    setLastUser(user || null);
    setDebug({ lastUserEmail, user });
    console.log('TestQuickLogin: lastUserEmail from localStorage:', lastUserEmail);
    console.log('TestQuickLogin: lastUser found:', user);
  }, []);

  const setQuickLogin = (account) => {
    localStorage.setItem('lastUserEmail', account.email);
    setLastUser(account);
    setDebug({ lastUserEmail: account.email, user: account });
  };

  const clearQuickLogin = () => {
    localStorage.removeItem('lastUserEmail');
    setLastUser(null);
    setDebug({ lastUserEmail: null, user: null });
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Test Quick Login Debugger</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={clearQuickLogin} style={{ marginRight: 8 }}>Clear Quick Login</button>
        {testAccounts.map(acc => (
          <button key={acc.email} onClick={() => setQuickLogin(acc)} style={{ marginRight: 8 }}>
            Set as {acc.name}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Debug Info:</strong>
        <pre>{JSON.stringify(debug, null, 2)}</pre>
      </div>
      {lastUser ? (
        <div style={{ background: '#eff6ff', padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <strong>Quick Login as {lastUser.name}</strong>
          <div>Email: {lastUser.email}</div>
          <div>Role: {lastUser.role}</div>
        </div>
      ) : (
        <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <strong>No quick login user set.</strong>
        </div>
      )}
      <div>
        <strong>Test Accounts:</strong>
        <ul>
          {testAccounts.map(acc => (
            <li key={acc.email}>{acc.name} ({acc.email})</li>
          ))}
        </ul>
      </div>
    </div>
  );
} 