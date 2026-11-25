import User from '../models/User.js';
import FinanceProfile from '../models/FinanceProfile.js';
import HealthProfile from '../models/HealthProfile.js';
import CycleProfile from '../models/CycleProfile.js';
import { signToken } from '../utils/token.js';

const sendAuth = (res, user, status = 200) => {
  const token = signToken(user._id);
  res.status(status).json({ token, user: user.toSafeJSON() });
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ message: 'An account with that email already exists' });

  const user = await User.create({ name, email, password });

  // Bootstrap the per-user singleton profiles so the app always has them.
  await Promise.all([
    FinanceProfile.create({ user: user._id }),
    HealthProfile.create({ user: user._id }),
    CycleProfile.create({ user: user._id }),
  ]);

  sendAuth(res, user, 201);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  sendAuth(res, user);
};

export const me = async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
};
