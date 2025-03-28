const { getAllProperties, getPropertyById, updateProperty, deleteProperty } = require('../Controllers/propertyController');


const router = require('express').Router();

router.get('/', getAllProperties)
router.get('/:id', getPropertyById)
module.exports = router;