const router = require('express').Router();
const adminController = require('../../controller/admin/adminController');
const { authMiddleware } = require('../../middleware/authMiddleware');



router.get('/get-notifications', authMiddleware, adminController.get_notifications);

router.put('/mark-all-as-seen', authMiddleware, adminController.mark_all_as_seen);

router.put('/delete-seenNotifications', authMiddleware, adminController.delete_all_seen_notification);

router.get('/get-doctors-list', authMiddleware, adminController.get_doctors_list);

router.put('/change-doctor-status', authMiddleware, adminController.change_doctor_Staus);


module.exports = router;