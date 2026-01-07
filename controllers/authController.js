
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  const { name, email, password, role, companyName, address } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name, email, password, role, companyName, address,
    isApproved: role === 'ADMIN' ? true : false,
    creditLimit: role === 'SHOP_OWNER' ? 50000 : 0
  });

  if (user) {
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        address: user.address,
        isApproved: user.isApproved,
        creditLimit: user.creditLimit,
        creditUsed: user.creditUsed
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (!user.isApproved && user.role !== 'ADMIN') {
      return res.status(401).json({ message: 'Account pending administrator approval' });
    }
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        address: user.address,
        isApproved: user.isApproved,
        creditLimit: user.creditLimit,
        creditUsed: user.creditUsed
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

exports.updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.companyName = req.body.companyName || user.companyName;
    user.address = req.body.address || user.address;
    user.gstNumber = req.body.gstNumber || user.gstNumber;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
