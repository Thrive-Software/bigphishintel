import jwt from 'jsonwebtoken';

// Endpoints a user with mustChangePassword:true is still allowed to call.
// Compared against `${req.baseUrl}${req.path}` (i.e. the full mount path).
const PASSWORD_CHANGE_ALLOWED = [
  { method: 'GET', path: '/api/users/me' },
  { method: 'POST', path: '/api/users/me/change-password' },
];

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token available.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    req.user = decoded;

    if (decoded.mustChangePassword) {
      const fullPath = `${req.baseUrl}${req.path}`.replace(/\/$/, '') || '/';
      const allowed = PASSWORD_CHANGE_ALLOWED.some(
        (r) => r.method === req.method && r.path === fullPath
      );
      if (!allowed) {
        return res.status(403).json({
          success: false,
          code: 'MUST_CHANGE_PASSWORD',
          message: 'You must change your password before continuing.'
        });
      }
    }

    next();
  } catch (ex) {
    res.status(401).json({
      success: false,
      message: 'Expired or invalid authentication token.'
    });
  }
};

export default authMiddleware;