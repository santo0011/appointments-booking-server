const { responseReturn } = require('../../utiles/response');
const userModel = require('../../models/userModel');
const doctorModel = require('../../models/doctorModel');
const appointmentsModel = require('../../models/appointmentsModel');
const bcrpty = require('bcrypt');
const moment = require('moment');
const { createToken } = require('../../utiles/tokenCreate');
const { ObjectId } = require('mongodb');

class userController {

    // user_register
    user_register = async (req, res) => {
        const { fullName, email, password } = req.body;
        const errorData = {}

        if (!fullName) {
            errorData.fullName = "Full name is required"
        }
        if (!email) {
            errorData.email = "Email is required"
        }
        if (!password) {
            errorData.password = "Password is required"
        }

        try {

            const getUser = await userModel.findOne({ email });

            if (getUser) {
                responseReturn(res, 400, { error: "User alrady exists !" })
            } else {
                const user = await userModel.create({
                    fullName,
                    email,
                    password: await bcrpty.hash(password, 10)
                });

                responseReturn(res, 201, { message: "Regsiter success" })
            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" })
        }

    }

    // user_login
    user_login = async (req, res) => {
        const { email, password } = req.body;
        const errorData = {}

        if (!email) {
            errorData.email = "Email is required"
        }
        if (!password) {
            errorData.password = "Password is required"
        }
        try {
            const user = await userModel.findOne({ email });

            if (!user) {
                responseReturn(res, 404, { error: "User not found !" })
            } else {
                const match = await bcrpty.compare(password, user.password);
                if (!match) {
                    responseReturn(res, 500, { error: "Password wrong !" })
                } else {
                    const token = await createToken({
                        id: user._id,
                        name: user.fullName,
                        email: user.email,
                        isDoctor: user.isDoctor,
                        isAdmin: user.isAdmin
                    });

                    const userInfo = {
                        id: user._id,
                        name: user.fullName,
                        email: user.email,
                        isDoctor: user.isDoctor,
                        isAdmin: user.isAdmin
                    }

                    user.password = undefined

                    responseReturn(res, 200, { userInfo, token, message: "Login success" })
                }

            }

        } catch (error) {
            responseReturn(res, 500, { error: error.message })
        }
    }



    // apply_doctor
    apply_doctor = async (req, res) => {
        const { userId } = req;
        const { firstName, lastName, email, phoneNumber, address, department, specialization, experience, feePerConsultation, fromTime, toTime } = req.body;


        if (!firstName || !lastName || !email || !phoneNumber || !address || !department || !specialization || !experience || !feePerConsultation || !fromTime || !toTime) {
            responseReturn(res, 400, { error: 'All fields are required!' });
        } else {

            const timings = {
                fromTime,
                toTime
            }

            try {

                const appliedDoctor = await doctorModel.findOne({ userId: userId });
                if (appliedDoctor) {
                    responseReturn(res, 400, { error: "This account already aplied" })
                } else {

                    const newDoctor = await doctorModel.create({
                        userId,
                        firstName,
                        lastName,
                        email,
                        phoneNumber,
                        address,
                        department,
                        specialization,
                        experience,
                        feePerConsultation,
                        timings,
                        fromTime,
                        toTime
                    });

                    const adminUser = await userModel.findOne({ isAdmin: true });

                    const unseenNotifications = adminUser.unseenNotifications
                    unseenNotifications.push({
                        type: "New doctor request",
                        message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a doctor account`,
                        data: {
                            doctorId: newDoctor._id,
                            name: newDoctor.firstName + " " + newDoctor.lastName
                        },
                        onclickPath: "/admin-doctors"
                    })

                    await userModel.findByIdAndUpdate(adminUser._id, { unseenNotifications }, { new: true })

                    responseReturn(res, 200, { message: "Apply success for doctor account" })

                }

            } catch (error) {

                console.log(error.message)

                responseReturn(res, 500, { error: "Server error !" })
            }
        }


    }


    // get_user_notifications
    get_user_notifications = async (req, res) => {
        const { userId, isAdmin } = req;
        try {

            if (!isAdmin) {
                const userNotifications = await userModel.findOne({ _id: userId });

                if (userNotifications.unseenNotifications || userNotifications.seenNotifications) {
                    const unseenNotifications = userNotifications.unseenNotifications.reverse();
                    const seenNotifications = userNotifications.seenNotifications.reverse();
                    responseReturn(res, 200, { userSeenNotifications: seenNotifications, userUnseenNotifications: unseenNotifications })

                }
            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" })
        }
    }


    // user_mark_all_as_seen
    user_mark_all_as_seen = async (req, res) => {
        const { id } = req.body;
        try {
            const user = await userModel.findOne({ _id: id });
            const unseenNotifications = user.unseenNotifications;
            user.seenNotifications.push(...unseenNotifications);
            user.unseenNotifications = [];

            const updateUser = await userModel.findByIdAndUpdate(id, user, { new: true });

            responseReturn(res, 200, {
                message: "All notifications marked as seen"
            });

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" })
        }
    }

    // delete_all_user_seen_notification
    delete_all_user_seen_notification = async (req, res) => {
        const { id } = req.body;

        try {

            const user = await userModel.findOne({ _id: id });
            user.seenNotifications = [];

            const updateUser = await userModel.findByIdAndUpdate(id, user, { new: true });

            updateUser.password = undefined;
            responseReturn(res, 200, {
                message: "Deleted all seen notifications"
            });

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" })
        }

    }

    // get_all_doctor
    get_all_doctor = async (req, res) => {
        const { searchValue, page, parPage } = req.query;
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);
        const { userId } = req;

        try {

            if (searchValue) {
                const doctors = await doctorModel.find({
                    status: 'approved',
                    userId: { $ne: userId },
                    $or: [
                        { firstName: { $regex: searchValue, $options: 'i' } },
                        { lastName: { $regex: searchValue, $options: 'i' } },
                        { department: { $regex: searchValue, $options: 'i' } },
                        { specialization: { $regex: searchValue, $options: 'i' } },
                        { address: { $regex: searchValue, $options: 'i' } },
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $toString: "$feePerConsultation" },
                                    regex: searchValue,
                                    options: "i"
                                }
                            }
                        },
                    ]
                }).sort({ createdAt: -1 });

                const userDoctorCount = await doctorModel.find({ status: 'approved', userId: { $ne: userId } }).countDocuments();

                responseReturn(res, 200, {
                    userDoctors: doctors,
                    userDoctorCount
                })

            } else {
                const doctors = await doctorModel.find({ status: 'approved', userId: { $ne: userId } }).skip(skipPage).limit(parPage).sort({ createdAt: -1 });

                const userDoctorCount = await doctorModel.find({ status: 'approved', userId: { $ne: userId } }).countDocuments();

                responseReturn(res, 200, {
                    userDoctors: doctors,
                    userDoctorCount
                })
            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" })
        }

    }

    // get_doctor_details
    get_doctor_details = async (req, res) => {
        const { id } = req.query;
        try {
            const doctorDetails = await doctorModel.findOne({ userId: id });

            responseReturn(res, 200, { doctorDetails })
        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" })
        }
    }



    // update_doctor
    update_doctor = async (req, res) => {
        const { id } = req.params;
        const { firstName, lastName, email, phoneNumber, address, department, specialization, experience, feePerConsultation, fromTime, toTime } = req.body;

        if (!firstName || !lastName || !email || !phoneNumber || !address || !department || !specialization || !experience || !feePerConsultation || !fromTime || !toTime) {
            responseReturn(res, 400, { error: 'All fields are required!' });
        } else {
            const timings = {
                fromTime,
                toTime
            }

            try {

                const updateDoctor = await doctorModel.findByIdAndUpdate(id, {
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    address,
                    department,
                    specialization,
                    experience,
                    feePerConsultation,
                    timings,
                    fromTime,
                    toTime
                }, { new: true });

                responseReturn(res, 200, { message: "Doctor account updated successfully" });

            } catch (error) {
                responseReturn(res, 500, { error: "Server error !" })
            }

        }

    }

    // check_book_avilabity
    check_book_availability = async (req, res) => {
        const { time, userId, doctorId, doctorUserId, userName } = req.body;

        const date = moment(req.body.date, "DD-MM-YYYY").toISOString()
        const formTime = moment(time, "HH:mm").subtract(1, 'hours').toISOString()
        const toTime = moment(time, "HH:mm").add(1, 'hours').toISOString()

        try {
            const appointments = await appointmentsModel.find({
                doctorId,
                date,
                time: {
                    $gte: formTime,
                    $lte: toTime
                }
            });

            if (appointments.length > 0) {
                responseReturn(res, 400, { error: "Appointments not available" })
            } else {
                responseReturn(res, 200, { message: "Appointments available" })
            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error !" });
        }
    };


    // book_appointment
    book_appointment = async (req, res) => {
        const { date, time, userId, doctorId, doctorUserId, userName } = req.body;

        if (!date || !time || !userId || !doctorId || !doctorUserId) {
            responseReturn(res, 400, { error: "All fields are required!" });
        } else {

            const ddddd = moment(date, 'DD-MM-YYYY').toISOString();
            const ttttt = moment(time, 'HH:mm').toISOString();
            try {
                const appointment = await appointmentsModel.create({
                    userId,
                    doctorId,
                    date: ddddd,
                    time: ttttt
                });

                if (appointment) {
                    const user = await userModel.findById(doctorUserId);

                    if (user) {
                        const unseenNotifications = user.unseenNotifications || [];
                        unseenNotifications.push({
                            type: "New-appointment-request",
                            message: `A new appointment has been made by ${userName}`,
                            onclickPath: "/doctor/appointments"
                        });

                        await userModel.findByIdAndUpdate(doctorUserId, { unseenNotifications }, { new: true });
                    } else {
                        responseReturn(res, 400, { error: "Doctor user not found!" });
                    }
                    responseReturn(res, 200, { message: "Appointment booked successfully!" });
                } else {
                    responseReturn(res, 400, { error: "Failed to create appointment!" });
                }
            } catch (error) {
                responseReturn(res, 500, { error: "Server error!" });
            }
        }
    };


    // get_appointment
    get_appointment = async (req, res) => {
        const { searchValue, page } = req.query;
        const parPage = parseInt(req.query.parPage);
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);
        const user_id = req.userId;

        try {
            const user = await appointmentsModel.findOne({ userId: user_id });

            if (user) {

                if (searchValue) {

                    const queryObject = [
                        {
                            $match: {
                                userId: user.userId
                            }
                        }, {
                            $lookup: {
                                from: 'doctors',
                                localField: 'doctorId',
                                foreignField: '_id',
                                as: "doctorDetails"
                            }
                        },
                        {
                            $unwind: '$doctorDetails',
                        },
                        {
                            $match: {
                                $or: [
                                    { 'doctorDetails.firstName': { $regex: searchValue, $options: "i" } },
                                    { 'doctorDetails.lastName': { $regex: searchValue, $options: "i" } },
                                    { 'doctorDetails.address': { $regex: searchValue, $options: "i" } },
                                    { status: { $regex: searchValue, $options: "i" } },
                                    { date: { $regex: searchValue, $options: "i" } },
                                    {
                                        $expr: {
                                            $regexMatch: {
                                                input: { $toString: "$doctorDetails.feePerConsultation" },
                                                regex: searchValue,
                                                options: "i"
                                            }
                                        }
                                    },
                                ]
                            }
                        },
                        { $sort: { createdAt: -1 } }

                    ];

                    const myAppointments = await appointmentsModel.aggregate(queryObject);
                    const myAppointmentCount = await appointmentsModel.find({ userId: user_id }).countDocuments();
                    responseReturn(res, 200, { myAppointments, myAppointmentCount });


                } else {

                    const queryObject = [
                        {
                            $match: {
                                userId: user.userId
                            }
                        }, {
                            $lookup: {
                                from: 'doctors',
                                localField: 'doctorId',
                                foreignField: '_id',
                                as: "doctorDetails"
                            }
                        },
                        {
                            $unwind: '$doctorDetails',
                        },
                        { $skip: skipPage },
                        { $limit: parPage },
                        { $sort: { createdAt: -1 } }
                    ];

                    const myAppointments = await appointmentsModel.aggregate(queryObject);
                    const myAppointmentCount = await appointmentsModel.find({ userId: user_id }).countDocuments();
                    responseReturn(res, 200, { myAppointments, myAppointmentCount });

                }
            } else {
                responseReturn(res, 500, { error: "User not found!" });
            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error!" });
        }
    }


    // cancle_appointment
    cancle_appointment = async (req, res) => {
        const { appoi_id, doctorUserId, userName } = req.body;

        try {
            const cancelApp = await appointmentsModel.findByIdAndDelete(appoi_id);

            if (cancelApp) {
                const doctor = await userModel.findById(doctorUserId);

                if (doctor) {
                    const unseenNotifications = doctor.unseenNotifications || [];
                    unseenNotifications.push({
                        type: "Cancel-appointment-request",
                        message: `Appointment has been cancled by ${userName}`,
                        onclickPath: "/"
                    });

                    await userModel.findByIdAndUpdate(doctorUserId, { unseenNotifications }, { new: true });
                } else {
                    responseReturn(res, 400, { error: "Doctor not found!" });
                }

                responseReturn(res, 200, { message: "Appointmnet cancled successfully" })
            }

        } catch (error) {
            responseReturn(res, 500, { error: "Server error!" });
        }
    }


}

module.exports = new userController();

// const ddddd = moment(date, 'DD-MM-YYYY').toISOString();
// const ttttt = moment(time, 'HH:mm').toISOString();
