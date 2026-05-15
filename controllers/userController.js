import userService from '../services/userService.js';

// Utility to sanitize user output (never expose password or sensitive fields)
function sanitizeUser(user) {
  if (!user) return null;
  const { password, __v, ...safe } = user.toObject ? user.toObject() : user;
  return safe;
}

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

// Get current user (authenticated user only)
export async function getMe(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const user = await userService.findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Update current user (allowlist: firstName, lastName, email only)
export async function updateMe(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const allowlist = ['firstName', 'lastName', 'email'];
    const payload = {};
    for (const key of allowlist) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }
    const user = await userService.updateUser(req.user._id, payload);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
}

// Change password for current user (uses user.save() so pre-save hash runs)
export async function changePassword(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }
    const user = await userService.findUserById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// List all users (admin only)
export async function listUsers(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const users = await userService.listUsers();
    res.json({ success: true, data: users.map(sanitizeUser) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Create a new user (admin only)
export async function createUser(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const allowlist = ['firstName', 'lastName', 'username', 'email', 'password', 'role', 'accountLocked'];
    const payload = {};
    for (const key of allowlist) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }
    // never let an API caller create another root admin
    payload.isRoot = false;
    if (payload.role && !['admin', 'user'].includes(payload.role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    if (!payload.username || !payload.password || !payload.firstName) {
      return res.status(400).json({ success: false, error: 'firstName, username, and password are required' });
    }
    const user = await userService.createUser(payload);
    res.status(201).json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ success: false, error: `${field} already in use` });
    }
    res.status(400).json({ success: false, error: err.message });
  }
}

// Get a single user by id (admin only)
export async function getUserById(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const user = await userService.findUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get user by username (admin or self only)
export async function getUserByUsername(req, res) {
  try {
    if (!req.user || (req.user.username !== req.params.username && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const user = await userService.findUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get user by email (admin or self only)
export async function getUserByEmail(req, res) {
  try {
    if (!req.user || (req.user.email !== req.params.email && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const user = await userService.findUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Update user (admin only — admins manage other accounts here; self-edit goes through /me)
export async function updateUser(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const target = await userService.findUserById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });

    const allowlist = ['firstName', 'lastName', 'email', 'role', 'accountLocked'];
    const payload = {};
    for (const key of allowlist) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }
    if (payload.role && !['admin', 'user'].includes(payload.role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    // Root admin's role and lock state are immutable
    if (target.isRoot) {
      delete payload.role;
      delete payload.accountLocked;
    }
    const user = await userService.updateUser(req.params.id, payload);
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ success: false, error: `${field} already in use` });
    }
    res.status(400).json({ success: false, error: err.message });
  }
}

// Admin password reset for another user (uses user.save() so pre-save hash runs)
export async function resetUserPassword(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    const user = await userService.findUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Delete user (admin only, cannot delete self or root)
export async function deleteUser(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(403).json({ success: false, error: 'Admins cannot delete themselves.' });
    }
    const target = await userService.findUserById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    if (target.isRoot) {
      return res.status(403).json({ success: false, error: 'The root administrator cannot be deleted.' });
    }
    await userService.deleteUser(req.params.id);
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Check if root admin exists (no sensitive data returned)
export async function checkRootAdmin(req, res) {
  try {
    const rootAdmin = await userService.findRootAdmin();
    res.json({ success: true, data: { exists: !!rootAdmin } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

const userController = {
  getMe,
  updateMe,
  changePassword,
  listUsers,
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  resetUserPassword,
  deleteUser,
  checkRootAdmin,
};
export default userController;
