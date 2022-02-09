const path = require('path');

const express = require('express');

const {
    body
} = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

const Product = require('../models/product')

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuth,
    [body('title')
        .isString()
        .isLength({
            min: 3,
            max: 25
        })
        .withMessage('Please enter a title between 3 and 25 characters')
        .custom((value, {
            req
        }) => {
            return Product.findOne({
                    title: value
                })
                .then(titleProd => {
                    if (titleProd) {
                        return Promise.reject('Product with this title already exists, please try again with new title.');
                    }
                })
        })
        .trim(),
        body('imageUrl')
        .isURL()
        .withMessage('That is not a valid URL'),
        body('price')
        .isFloat()
        .isDecimal({
            force_decimal: true,
            decimal_digits: '2',
            locale: 'en-US'
        })
        .withMessage('Price must be a number with two decimal places.'),
        body('description')
        .isLength({
            min: 5,
            max: 400
        })
        .withMessage('Please enter a description between 5 and 400 characters in length')
        .trim()
    ],
    adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth,
    [body('title')
        .isString()
        .isLength({
            min: 3,
            max: 25
        })
        .withMessage('Please enter a title between 3 and 25 characters')
        .trim(),
        body('imageUrl')
        .isURL()
        .withMessage('That is not a valid URL'),
        body('price')
        .isFloat()
        .isDecimal({
            force_decimal: true,
            decimal_digits: '2',
            locale: 'en-US'
        })
        .withMessage('Price must be a number with two decimal places.'),
        body('description')
        .isLength({
            min: 5,
            max: 400
        })
        .withMessage('Please enter a description between 5 and 400 characters in length')
        .trim()
    ],
    adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;