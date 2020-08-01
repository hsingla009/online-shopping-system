const path = require('path');

const express = require('express');
const isAuth = require('../middleware/is-auth');
const adminController = require('../controllers/admin');
const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

router.post('/edit-product', isAuth, adminController.getEditProduct);
// // /admin/products => GET
router.get('/products', adminController.getProducts);
// console.log("[adminRoutes.js 1]");

router.post('/delete-product',isAuth, adminController.postDeleteProduct);

router.post('/product',isAuth, adminController.postEditProduct);
// /admin/add-product => POST
router.post('/add-product',isAuth, adminController.postAddProduct);

module.exports = router;
