const express = require('express');

const authController = require('../controllers/auth');

const User = require('../models/user');

const { check } = require('express-validator/check');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
// console.log("[authRoutes 1]");
router.post('/signup', 
[
    check('email').
    isEmail().
    withMessage('enter a valid email').
    custom((value, { req }) => {
        return User.findOne({ email: value })
        .then(user => {
            if (user) {
                return Promise.reject('Email exist already');
            }
        })
    })
    .normalizeEmail(),
    check('password', 'Please enter a password with only number and alphabet and atleast 5 charactor')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
    check('confirmPassword')
    .custom((value, { req }) => {
            if (value !== req.body.password)
                throw new Error('password have to match');
            return true;
        }).trim()
], authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword)

router.post('/new-password', authController.postNewPassword)
// console.log("[authRoutes 2]");

module.exports = router;