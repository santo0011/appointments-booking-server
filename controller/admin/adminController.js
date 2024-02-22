const { responseReturn } = require('../../utiles/response');
const userModel = require('../../models/userModel');
const doctorModel = require('../../models/doctorModel');

class adminController {

    // get_notifications
    get_notifications = async (req, res) => {
        try {
            const notifications = await userModel.findOne({ isAdmin: true });

            if (notifications.unseenNotifications || notifications.seenNotifications) {
                const unseenNotifications = notifications.unseenNotifications.reverse();
                const seenNotifications = notifications.seenNotifications.reverse();
                responseReturn(res, 200, { seenNotifications: seenNotifications, unseenNotifications: unseenNotifications })

            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" })
        }

    }

    // mark_all_as_seen
    mark_all_as_seen = async (req, res) => {

        try {
            const adminUser = await userModel.findOne({ isAdmin: true });
            const unseenNotifications = adminUser.unseenNotifications;
            adminUser.seenNotifications.push(...unseenNotifications);
            adminUser.unseenNotifications = [];

            const updatedAdmin = await userModel.findByIdAndUpdate(adminUser._id, adminUser, { new: true });

            updatedAdmin.password = undefined;
            responseReturn(res, 200, {
                message: "All notifications marked as seen",
                data: updatedAdmin
            });
        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" });
        }

    }

    // delete_all_seen_notification
    delete_all_seen_notification = async (req, res) => {
        try {
            const adminUser = await userModel.findOne({ isAdmin: true });
            adminUser.seenNotifications = [];

            const updatedAdmin = await userModel.findByIdAndUpdate(adminUser._id, adminUser, { new: true });

            updatedAdmin.password = undefined;
            responseReturn(res, 200, {
                message: "Deleted all seen notifications",
                data: updatedAdmin
            });
        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" });
        }
    }

    // get_doctors_list
    get_doctors_list = async (req, res) => {
        const { searchValue, page, parPage } = req.query;
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);

        try {

            if (searchValue) {
                const doctors = await doctorModel.find({
                    $or: [
                        { firstName: { $regex: searchValue, $options: 'i' } },
                        { lastName: { $regex: searchValue, $options: 'i' } },
                        { status: { $regex: searchValue, $options: 'i' } },
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $toString: "$phoneNumber" },
                                    regex: searchValue,
                                    options: "i"
                                }
                            }
                        },
                    ]
                }).sort({ createdAt: -1 });

                const doctorCount = await doctorModel.find({}).countDocuments();

                responseReturn(res, 200, {
                    allDoctor: doctors,
                    doctorCount
                })

            } else {
                const doctors = await doctorModel.find({}).skip(skipPage).limit(parPage).sort({ createdAt: -1 });
                const doctorCount = await doctorModel.find({}).countDocuments();

                responseReturn(res, 200, {
                    allDoctor: doctors,
                    doctorCount
                })
            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" });
        }
    }

    // change_doctor_Staus
    change_doctor_Staus = async (req, res) => {
        const { id, userId, status } = req.body;

        try {
            const aprovedDoctor = await doctorModel.findByIdAndUpdate(id, { status: status }, { new: true });
            const userDoctor = await userModel.findByIdAndUpdate(userId, { isDoctor: true }, { new: true });

            if (userDoctor.isDoctor === true) {
                const user = await userModel.findById(userDoctor._id);
                const unseenNotifications = user.unseenNotifications
                unseenNotifications.push({
                    type: "Approved message",
                    message: `Your account has been ${status}`,
                    onclickPath: "/user-notifications"
                })

                await userModel.findByIdAndUpdate(user._id, { unseenNotifications })

                responseReturn(res, 200, { message: `Doctor ${aprovedDoctor.status} success` })
            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" });
        }

    }

}


module.exports = new adminController();