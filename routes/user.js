var express = require('express');
const { response } = require('../app');
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.cartCount(req.session.user._id)
  }
  productHelpers.allProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount, admin: false });
  })
});

router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelpers.doSignUp(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/')
  })
})

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loginErr })
  }
  req.session.loginErr = false
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = "Invalid username or Password";
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.cartProducts(req.session.user._id)
  let total = await userHelpers.totalAmount(req.session.user._id)
  let userId = req.session.user._id
  let user = req.session.user
  res.render('user/cart', { products, total, user, userId })
})

router.get('/add-to-cart/:id', (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.productQuantity(req.body).then( async (response)=> {
    response.total = await userHelpers.totalAmount(req.body.userId)
    res.json(response)
  })
})

router.get('/order-page', verifyLogin, async (req, res) => {
  let user = req.session.user
  let total = await userHelpers.totalAmount(req.session.user._id)
  res.render('user/order-page', { total, user })
})

router.post('/order-page', async (req, res) => {
  let products = await userHelpers.cartProductList(req.body.userId)
  let total = await userHelpers.totalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, total).then((response) => {
    res.json({ status: true })
  })
})

router.get('/order-success', (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})

router.get('/orders', async (req, res) => {
  let orders = await userHelpers.userOrders(req.session.user._id)
  res.render('user/orders', { orders, user: req.session.user})
})

router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.orderProducts(req.params.id)
  res.render('user/view-order-products', { products, user: req.session.user })
})

module.exports = router;
