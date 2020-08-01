const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
//const Cart = require('../models/cart')
const mongoose = require('mongoose');
const itemPerPage = 4;
exports.getProducts = (req, res, next) => {
  // const isLoggedIn = req.get('cookie').split(';')[2].trim().split('=')[1] === 'true';
  const page = +req.query.page || 1;
  let totalProd ;
  Product.countDocuments()
  .then(numProd =>{
    totalProd = numProd;
    return Product.find()
    .skip((page -1 )*itemPerPage)
    .limit(itemPerPage)
  })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currPage : page,
        hasNextPage : itemPerPage*page < totalProd,
        hasPrevPage : page>1,
        nextPage : page+1,
        prevPage : page-1
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getProduct = (req, res, next) => {
  // const isLoggedIn = req.get('cookie').split(';')[2].trim().split('=')[1] === 'true';
  const prodId = req.params.productId;
   console.log("[getProduct]",prodId);
  Product.findById(prodId)
    .then(product => {
      // console.log("details");
      //console.log(product);
      res.render('shop/product-detail', {
        product: product,
        pageTitle: 'Product Details',
        path: '/products',
      });
    })
    .catch(err => console.log(err));
}

exports.getIndex = (req, res, next) => {
  // const isLoggedIn = req.get('cookie').split(';')[2].trim().split('=')[1] === 'true';
  const page = +req.query.page || 1;
  let totalProd ;
  Product.countDocuments()
  .then(numProd =>{
    totalProd = numProd;
    return Product.find()
    .skip((page -1 )*itemPerPage)
    .limit(itemPerPage)
  })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currPage : page,
        hasNextPage : itemPerPage*page < totalProd,
        hasPrevPage : page>1,
        nextPage : page+1,
        prevPage : page-1
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getCart = (req, res, next) => {
  // const isLoggedIn = req.get('cookie').split(';')[2].trim().split('=')[1] === 'true';
  const productIds = req.user.cart.items.map(p => {
    // console.log("productIds");
    // console.log(p.productId);
    return p.productId;
  });

  const products = [];
  for (let prodId of productIds) {
    //console.log(prodId);
    products.push(Product.findById(prodId));
  }
  // console.log(products);
  Promise.all(products)
    .then(products => {
      const cartProducts = products.map(p => {
        return {
          ...p._doc,
          quantity: req.user.cart.items.find(cp => {
            return p._id.toString() === cp.productId.toString();
          }).quantity
        };
      })
      return cartProducts;
    })
    .then(cartProducts => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: cartProducts,

      }
      )
    })
    .catch(err => {
      console.log(err);
    })
};

exports.postCart = (req, res, next) => {

  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
}
exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(users => {
      // console.log(users);
      const Products = users.cart.items.map(p => {
        return { quantity: p.quantity, productData: { ...p.productId._doc } }
      });
      // console.log(Products);
      const order = new Order({
        products: Products,
        user: {
          email: req.user.email,
          userId: req.user._id
        }
      })
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
}
exports.getOrders = (req, res, next) => {
  // const isLoggedIn = req.get('cookie').split(';')[2].trim().split('=')[1] === 'true';
  Order.find()
    .then(orders => {
      let ords = [];
      orders.forEach(order => {
        if (order.user.userId.toString() === req.user._id.toString()) {
          ords.push(order);
        }
      });
      //console.log(ords);
      return ords;
    })
    .then(orders => {
      //console.log(orders[0].user.userId)
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        UserId: req.user._id
      });
    })
    .catch(err => {
      console.log('Error');
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId).then(order => {
    if (!order)
      return next(new Error('No order found!!'))
    if (order.user.userId.toString() !== req.user._id.toString())
      return next(new Error(Unauthorize));
    const pdfDoc = new PDFDocument();
    const invoiceName = 'Invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
    res.setHeader('content-type', 'application/pdf');
    res.setHeader('content-disposition', 'inline ; filename = "' + invoiceName + '"');
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    });
    pdfDoc.text('-----------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.productData.price;
      pdfDoc
        .fontSize(14)
        .text(
          prod.productData.title +
          ' - ' +
          prod.quantity +
          ' x ' +
          '$' +
          prod.productData.price
        );
    });
    pdfDoc.text('---');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

    pdfDoc.end();
    // fs.readFile(invoicePath,(err,data) =>{
    //   if(err)
    //     return next(err);
    //   res.setHeader('content-type','application/pdf');
    //   res.setHeader('content-disposition','attachment ; filename = "'+invoiceName+'"')
    //   res.send(data);
    // })
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('content-type', 'application/pdf');
    // res.setHeader('content-disposition', 'inline ; filename = "' + invoiceName + '"')
    // file.pipe(res);
  })
  .catch(err => next(err));

}
// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     pageTitle: 'Checkout'
//   });
// };

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  //console.log(prodId);
  //console.log(prodId);
  req.user.deleteProduct(prodId)
    .then((result) => {
      //console.log(result);
      res.redirect('/cart');
    })
    .catch(err => { console.log(err) });
}

exports.postDeleteOneItem = (req, res, next) => {
  const prodId = req.body.productId;
  //console.log(prodId);
  req.user.deleteOneProduct(prodId)
    .then((result) => {
      //console.log(result);
      res.redirect('/cart');
    })
    .catch(err => { console.log(err) });
}