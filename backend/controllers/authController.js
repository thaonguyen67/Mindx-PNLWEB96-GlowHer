import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { email, password, name, weight, height } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', data: null });
    }
    const emailNorm = String(email).trim().toLowerCase();
    if (!emailNorm) {
      return res.status(400).json({ success: false, message: 'Email and password are required', data: null });
    }
    const existing = await User.findOne({ email: emailNorm });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists', data: null });
    }
    const hashed = await bcrypt.hash(password, 10);
    const displayName = name?.trim() || emailNorm.split('@')[0] || 'User';
    const user = await User.create({
      email: emailNorm,
      password: hashed,
      name: displayName,
      weight,
      height,
    });
    const { password: _, refreshToken: __, ...userData } = user.toObject();
    return res.status(201).json({ success: true, message: 'Registered successfully', data: userData });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', data: null });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', data: null });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', data: null });
    }
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.AT_SECRET,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { id: user._id, tokenType: 'RF' },
      process.env.RT_SECRET,
      { expiresIn: '7d' }
    );
    user.refreshToken = refreshToken;
    await user.save();
    const { password: _, refreshToken: __, ...userData } = user.toObject();
    return res.json({ success: true, message: 'Logged in successfully', data: { accessToken, refreshToken, user: userData } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token required', data: null });
    }
    const decoded = jwt.verify(token, process.env.RT_SECRET);
    if (decoded.tokenType !== 'RF') {
      return res.status(401).json({ success: false, message: 'Invalid token type', data: null });
    }
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Refresh token mismatch', data: null });
    }
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.AT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ success: true, message: 'Token refreshed', data: { accessToken } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', data: null });
  }
};
