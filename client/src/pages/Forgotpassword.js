import React, { useState } from 'react';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!');
      setSuccess('');
      return;
    }

    setError('');

    try {
      // Call the backend API to update the password
      const response = await fetch('/api/updatePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error updating password');
      } else {
        setSuccess('Password updated successfully');
        setEmail('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
        
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        />

        <label>New Password:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        />
        
        <label>Confirm Password:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        
        <button type="submit" style={{ padding: '10px', borderRadius: '4px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
          Set Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
