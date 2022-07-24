var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.allProducts().then((products) => {
    res.render('admin/view-products', { products, admin: true })
  })
});

router.get('/add-product', function (req, res) {
  res.render('admin/add-product')
})

router.post('/add-product', (req, res) => {
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image
    image.mv('./public/product-images/' + id + '.jpg', (err) => {
      if (err) {
        console.log('ERROR' + err)
      } else {
        res.render('admin/add-product')
      }
    })
  })

})

router.get('/delete-product/', (req, res) => {
  let productId = req.query.id
  productHelpers.deleteProduct(productId).then(() => {
    res.redirect('/admin')
  })
})

router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelpers.productDetails(req.params.id)
  res.render('admin/edit-product', { product })
})

router.post('/edit-product/:id', (req, res) => {
  let id = req.params.id
  productHelpers.updateProduct(req.body, id).then(() => {
    res.redirect('/admin')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + id + '.jpg')
    }
  })
})

module.exports = router;
