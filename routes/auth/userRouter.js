const router = require('express').Router();
const userController = require('../../controller/auth/userController');
const { authMiddleware } = require('../../middleware/authMiddleware');


router.post('/user-register', userController.user_register);

router.post('/user-login', userController.user_login);

router.post('/apply-doctor', authMiddleware, userController.apply_doctor);

router.get('/get-user-notifications', authMiddleware, userController.get_user_notifications);

router.put('/user-mark-all-as-seen', authMiddleware, userController.user_mark_all_as_seen);

router.put('/delete-user-seenNotifications', authMiddleware, userController.delete_all_user_seen_notification);

router.get('/get-all-doctor', authMiddleware, userController.get_all_doctor);

router.get('/get-doctor-details', authMiddleware, userController.get_doctor_details);

router.put('/update-doctor/:id', authMiddleware, userController.update_doctor);

router.post('/check-book-avilabity', authMiddleware, userController.check_book_availability );

router.post('/book-appointment', authMiddleware, userController.book_appointment);

router.get('/get-appointment', authMiddleware, userController.get_appointment);



module.exports = router;