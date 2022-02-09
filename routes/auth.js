const express = require('express');

const {
    check, body
} = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

const User = require('../models/user');

router.get('/signup', authController.getSignup);

router.get('/login', authController.getLogin);

router.get('/reset', authController.getReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/signup',
[
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, {req}) => {
            return User.findOne({
                email: value
            })
            .then(userDoc => {
                if (userDoc) {
                   return Promise.reject('Email already exists, please try again with new email address.');
                }
            })
        })
        .normalizeEmail()
        .trim(),
    body('password',
         'Please enter a password that is at least 6 characters long and contains only numbers and text.'
            )
        .isLength({min: 6})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password and confirmation do not match');
        }
        return true;
    })    
    ], 
    authController.postSignup);

router.post('/login',
[
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, {req}) => {
            return User.findOne({
                email: value
            })
            .then(userDoc => {
                if (!userDoc) {
                   return Promise.reject('No account exists with this email address.');
                }
            })
        })
        .normalizeEmail(),
    body('password',
         'Please enter a password that is at least 6 characters long and contains only numbers and text.'
            )
        .isLength({min: 6})
        .isAlphanumeric()
        .trim()   
    ],
     authController.postLogin);

router.post('/logout', authController.postLogout);

router.post('/reset', authController.postReset);

router.post('/set-password', authController.postNewPassword);

module.exports = router;