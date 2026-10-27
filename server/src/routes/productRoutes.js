const express = require('express');
const { createProduct, getProducts, updateProduct, deleteProduct, bulkImportProducts, deleteProductImage } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const { requireTenant } = require('../middlewares/tenantMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const multer = require('multer');

const router = express.Router();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for high-res PDF catalogs
});

router.use(protect);
router.use(requireTenant);

router.post('/', authorize('product.create'), createProduct);
router.post('/bulk-import', authorize('product.create'), upload.single('file'), bulkImportProducts);
router.get('/', authorize('product.read'), getProducts);
router.patch('/:id', authorize('product.update'), updateProduct);
router.delete('/:id', authorize('product.delete'), deleteProduct);
router.delete('/:id/image', authorize('product.update'), deleteProductImage);

module.exports = router;
