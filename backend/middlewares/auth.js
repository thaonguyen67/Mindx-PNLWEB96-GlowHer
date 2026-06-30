import jwt from 'jsonwebtoken';

export const authentication = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided', data: null });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.AT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', data: null });
  }
};

export const optionalAuthentication = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.AT_SECRET);
  } catch {
    /* guest request — continue without user */
  }
  next();
};
