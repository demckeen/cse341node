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

router.get('/account', authController.getAccount);

router.get('/add-address', authController.getAddAddress);

router.get('/edit-address', authController.getEditAddress);

router.get('/update-email', authController.getUpdateEmail);

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
        }),
    body('firstname')
        .if(body('lastname').exists())
        .if(body('street').exists())
        .if(body('zip').exists())
        .if(body('state').exists())
        .notEmpty()
        .withMessage('First name is required for address.')
        .optional({nullable: true, checkFalsy: true}),
    body('lastname')
        .if(body('firstname').exists())
        .if(body('street').exists())
        .if(body('state').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('Last name is required for address.')
        .optional({nullable: true, checkFalsy: true}),
    body('street')
        .if(body('firstname').exists())
        .if(body('lastname').exists())
        .if(body('state').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('Street address is required for address.')
        .optional({nullable: true, checkFalsy: true}),
    body('state')
        .if(body('firstname').exists())
        .if(body('lastname').exists())
        .if(body('street').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('State is required for address.')
        .optional({nullable: true, checkFalsy: true}),
    body('zip')
        .if(body('firstname').exists())
        .if(body('lastname').exists())
        .if(body('state').exists())
        .if(body('street').exists())
        .notEmpty()
        .isPostalCode('US')
        .withMessage('Please use valid US zip code.')
        .optional({nullable: true, checkFalsy: true}),
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

router.post('/add-address', [
    body('firstname')
        .if(body('lastname').exists())
        .if(body('street').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('First name is required for address.')
        .optional({nullable: true, checkFalsy: true}),
    body('lastname')
        .if(body('firstname').exists())
        .if(body('street').exists())
        .if(body('state').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('Last name is required for address.')
        .optional({nullable: true, checkFalsy: true}),
    body('street')
        .if(body('firstname').exists())
        .if(body('lastname').exists())
        .if(body('state').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('Street address is required for address.')
        .optional({nullable: true, checkFalsy: true}),
    body('state')
            .if(body('firstname').exists())
            .if(body('lastname').exists())
            .if(body('street').exists())
            .if(body('zip').exists())
            .notEmpty()
            .withMessage('State is required for address.')
            .optional({nullable: true, checkFalsy: true}),
    body('zip')
        .if(body('firstname').exists())
        .if(body('lastname').exists())
        .if(body('street').exists())
        .if(body('state').exists())
        .notEmpty()
        .isPostalCode('US')
        .withMessage('Please use valid US zip code.')
        .optional({nullable: true, checkFalsy: true}),
    ], 
    authController.postAddAddress);

router.post('/edit-address', [
    body('firstname')
        .if(body('lastname').exists())
        .if(body('street').exists())
        .if(body('state').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('First name is required for address.'),
    body('lastname')
        .if(body('firstname').exists())
        .if(body('street').exists())
        .if(body('state').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('Last name is required for address.'),
    body('street')
        .if(body('firstname').exists())
        .if(body('lastname').exists())
        .if(body('state').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('Street address is required for address.'),
    body('state')
        .if(body('firstname').exists())
        .if(body('lastname').exists())
        .if(body('street').exists())
        .if(body('zip').exists())
        .notEmpty()
        .withMessage('State is required for address.'),
    body('zip')
        .if(body('firstname').exists())
        .if(body('lastname').exists())
        .if(body('street').exists())
        .if(body('state').exists())
        .notEmpty()
        .isPostalCode('US')
        .withMessage('Please use valid US zip code.')
    ], 
    authController.postEditAddress);

router.post('/update-email', [
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
        .trim()
], authController.postUpdateEmail)

module.exports = router;