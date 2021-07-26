const path = require('path');

const express = require('express');

const isAuth = require('../middleware/is-auth');

const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);
// console.log("[shopRoutes.js 1]");
router.get('/products/:productId', shopController.getProduct);
// console.log("[shopRoutes.js 2]");

router.post('/cart', isAuth, shopController.postCart);

router.get('/cart', isAuth, shopController.getCart);



router.get('/orders', isAuth, shopController.getOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

router.get('/checkout', shopController.getCheckout);


router.post('/delete-cart-product', isAuth, shopController.postDeleteProduct);

router.post('/delete-one-item', isAuth, shopController.postDeleteOneItem);



module.exports = router;
