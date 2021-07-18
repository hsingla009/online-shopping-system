const Product = require('../models/product');
const deleteFile = require('../util/file');
const itemPerPage = 1;
exports.getAddProduct = (req, res, next) => {
 // console.log('err');
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    hasError : false,
    editing: false,
    errorMessage : null,
    product: {
      title : null,
      price : null,
      description : null,
    },
  });
};

exports.postAddProduct = (req, res, next) => {
  //console.log('er');
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
//  console.log(image);
  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      hasError : true,
      product: {
        title : title,
        price : price,
        description : description
      },
      editing: false,
      errorMessage : 'Attached file is not an image'
    })
  }
  const imageUrl = image.path;
  const product = new Product({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    userId: req.user._id
  });
  product.save()
    .then(() => {
      console.log("product created");
      res.redirect('/');
    }).catch(err =>{
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  //console.log(req.url);
  if (!editMode) {
    return res.redirect('/');
  }
  console.log("editing");
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        product: product,
        editing: editMode,
        hasError :false,
        errorMessage : null
      });
    })
.catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImage = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;
 // console.log("editing");
//  console.log(prodId);
  if(!updatedImage){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      hasError : true,
      product: {
        _id : prodId,
        title : updatedTitle,
        price : updatedPrice,
        description : updatedDescription
      },
      editing: true,
      errorMessage : 'Attached file is not an image'
    })
  }
  const updatedImageUrl = updatedImage.path;
  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() === req.user._id.toString()) {
        deleteFile(product.imageUrl);
        product.title = updatedTitle;
        product.description = updatedDescription;
        product.imageUrl = updatedImageUrl;
        product.price = updatedPrice;
      }
      return product.save();
    })
    .then(() => {
      //console.log("product updated");
      res.redirect('/');
    })
    .catch(err => console.log(err));
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  //console.log(req.user._id);
  Product.findById(prodId)
  .then(product=>{
    deleteFile(product.imageUrl);
  })
  .catch(err => {
    console.log(err);
  })
  Product.findByIdAndDelete(prodId)
    .then(() => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    })
}

exports.getProducts = (req, res, next) => {
  // const isLoggedIn = req.get('cookie').split(';')[2].trim().split('=')[1] === 'true';

  const page = +req.query.page || 1;
  let totalProd ;
  console.log("adminProduct",req.user);
  Product.countDocuments({userId:req.user._id})
  .then(numProd =>{
    totalProd = numProd;
    return Product.find({userId:req.user._id})
    .skip((page -1 )*itemPerPage)
    .limit(itemPerPage)
  })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
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
}

