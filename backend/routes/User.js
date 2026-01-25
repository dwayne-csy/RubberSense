const express = require('express');
const { uploadWithJson } = require('../utils/Multer');
const {
  registerUser,
  loginUser,
  updateProfile,
  firebaseGoogleAuth,
  firebaseFacebookAuth,
  forgotPassword,
  resetPassword,
  changePassword // <-- import the new unified controller
} = require('../controllers/User');

const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

// AUTH
router.post('/register', registerUser);
router.post('/login', loginUser);

// PROFILE
router.get('/me', isAuthenticatedUser, async (req, res) => {
  const user = await require('../models/User').findById(req.user.id);
  res.status(200).json({ success: true, user });
});

// UPDATE PROFILE
router.put('/me/update', isAuthenticatedUser, uploadWithJson, updateProfile);

// FIREBASE AUTH
router.post('/firebase/auth/google', firebaseGoogleAuth);
router.post('/firebase/auth/facebook', firebaseFacebookAuth);

// PASSWORD RESET
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// 🔐 CHANGE PASSWORD (USER)
router.put('/change-password', isAuthenticatedUser, changePassword);

module.exports = router;
