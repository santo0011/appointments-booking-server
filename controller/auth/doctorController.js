const { responseReturn } = require('../../utiles/response');
const userModel = require('../../models/userModel');
const doctorModel = require('../../models/doctorModel');
const appointmentsModel = require('../../models/appointmentsModel');
const bcrpty = require('bcrypt');
const moment = require('moment');
const { createToken } = require('../../utiles/tokenCreate');
const articleModel = require('../../models/articleModel');


class doctorController {

    // get_apply_appointments
    get_apply_appointments = async (req, res) => {
        const { searchValue, page, id } = req.query;
        const parPage = parseInt(req.query.parPage);
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);

        try {
            const doctor = await doctorModel.findOne({ userId: id });

            if (doctor) {

                if (searchValue) {

                    const queryObject = [
                        {
                            $match: {
                                doctorId: doctor._id
                            }
                        }, {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: "userDetails"
                            }
                        },
                        {
                            $unwind: '$userDetails',
                        },
                        {
                            $match: {
                                $or: [
                                    { 'userDetails.fullName': { $regex: searchValue, $options: "i" } },
                                    { status: { $regex: searchValue, $options: "i" } },
                                    {
                                        $expr: {
                                            $regexMatch: {
                                                input: { $toString: "$userId" },
                                                regex: searchValue,
                                                options: "i"
                                            }
                                        }
                                    },
                                ]
                            }
                        },
                        { $sort: { createdAt: -1 } }
                    ]

                    const requestAppointmets = await appointmentsModel.aggregate(queryObject)

                    const requestAppointmetCount = await appointmentsModel.find({ doctorId: doctor._id }).countDocuments();
                    responseReturn(res, 200, { requestAppointmets, requestAppointmetCount });

                } else {

                    const queryObject = [
                        {
                            $match: {
                                doctorId: doctor._id
                            }
                        }, {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: "userDetails"
                            }
                        },
                        {
                            $unwind: '$userDetails',
                        },
                        { $skip: skipPage },
                        { $limit: parPage },
                        { $sort: { createdAt: -1 } }
                    ]

                    const requestAppointmets = await appointmentsModel.aggregate(queryObject)
                    const requestAppointmetCount = await appointmentsModel.find({ doctorId: doctor._id }).countDocuments();
                    responseReturn(res, 200, { requestAppointmets, requestAppointmetCount });
                }

            } else {
                responseReturn(res, 404, { error: "Doctor not found!" });
            }
        } catch (error) {
            responseReturn(res, 500, { error: "Server error!" });
        }
    };


    // approve_book_status
    approve_book_status = async (req, res) => {
        const { id, status } = req.body;
        try {
            const bookStatus = await appointmentsModel.findByIdAndUpdate(id, { status }, { new: true });

             console.log(bookStatus)

            responseReturn(res, 200, { message: "Status update" })
        } catch (error) {
            responseReturn(res, 500, { error: "Server error!" });
        }

    }

}


module.exports = new doctorController();
