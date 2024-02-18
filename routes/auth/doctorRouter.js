const router = require('express').Router();
const doctorController = require('../../controller/auth/doctorController');
const { authMiddleware } = require('../../middleware/authMiddleware');


router.get('/get-apply-appointments', authMiddleware, doctorController.get_apply_appointments);


module.exports = router;