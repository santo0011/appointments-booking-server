const { responseReturn } = require('../../utiles/response');
const articleModel = require('../../models/articleModel');
const notificationModel = require('../../models/NotificationModel');


class homeController {

    //  get_all_category
    get_all_category = async (req, res) => {
        const { searchValue, page, parPage } = req.query;
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);

        let homeArticle = [];

        try {
            const countArticle = await articleModel.find({}).countDocuments();

            if (searchValue) {

            } else {
                homeArticle = await articleModel.find({}).skip(skipPage).limit(parPage).sort({ createAt: -1 });
            }

            responseReturn(res, 200, {
                homeArticle,
                countArticle
            });

        } catch (error) {
            responseReturn(res, 500, { error: "Server error" })
        }
    }


    // home_tag_category_get
    home_tag_category_get = async (req, res) => {
        try {
            const homeCategory = await articleModel.aggregate([
                {
                    $match: {
                        category: {
                            $not: {
                                $size: 0
                            }
                        }
                    },
                },
                {
                    $unwind: "$category"
                },
                {
                    $group: {
                        _id: "$category",
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);

            const homeTag = await articleModel.distinct('tag')
            responseReturn(res, 200, {
                homeCategory,
                homeTag
            })

        } catch (error) {
            responseReturn(res, 500, { error: "Server error" })
        }
    }


    // old_react_article
    old_react_article = async (req, res) => {
        try {
            const oldArticle = await articleModel.aggregate([
                {
                    $match: {}
                },
                {
                    $sample: {
                        size: 3
                    }
                }
            ]);

            const recentArticle = await articleModel.find({}).limit(3).sort({
                createdAt: -1
            });
            responseReturn(res, 200, {
                oldArticle,
                recentArticle
            });

        } catch (error) {
            console.log(error.mesasge)
        }
    }


    // category_article_get
    category_article_get = async (req, res) => {
        const { categorySlug, page, parPage } = req.query;
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);

        try {
            const countArticle = await articleModel.find({ category_slug: categorySlug }).countDocuments();
            const homeArticle = await articleModel.find({ category_slug: categorySlug }).skip(skipPage).limit(parPage).sort({ createAt: -1 })
            responseReturn(res, 200, {
                countArticle,
                homeArticle
            });

        } catch (error) {
            console.log(error.mesasge)
        }
    }

    // tag_article_get
    tag_article_get = async (req, res) => {
        const { tagSlug, page, parPage } = req.query;
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);

        try {
            const countArticle = await articleModel.find({ tag_slug: tagSlug }).countDocuments();
            const homeArticle = await articleModel.find({ tag_slug: tagSlug }).skip(skipPage).limit(parPage).sort({ createAt: -1 })

            console.log(homeArticle)

            responseReturn(res, 200, {
                countArticle,
                homeArticle
            });

        } catch (error) {
            console.log(error.mesasge)
        }
    }



    // get_article_details
    get_article_details = async (req, res) => {
        const { articleSlug } = req.params;
        try {
            const read_article = await articleModel.findOne({ slug: articleSlug });

            const related_article = await articleModel.aggregate([
                {
                    $match: {
                        $and: [
                            {
                                category_slug: {
                                    $eq: read_article.category_slug
                                }
                            },
                            {
                                slug: {
                                    $ne: articleSlug
                                }
                            }
                        ]
                    }
                },
                {
                    $sample: {
                        size: 3
                    }
                }
            ]);

            const readMore = await articleModel.aggregate([
                {
                    $match: {
                        $and: [
                            {
                                category_slug: {
                                    $eq: read_article.category_slug
                                }
                            },
                            {
                                slug: {
                                    $ne: articleSlug
                                }
                            }
                        ]
                    }
                },
                {
                    $sample: {
                        size: 1
                    }
                }
            ]);

            const moreTag = await articleModel.distinct('tag_slug', {
                tag_slug: {
                    $ne: read_article.tag_slug
                }
            })


            responseReturn(res, 200, {
                read_article,
                related_article,
                readMore: {
                    title: readMore.length > 0 ? readMore[0].title : "",
                    slug: readMore.length > 0 ? readMore[0].slug : "",
                },
                moreTag
            });

        } catch (error) {
            console.log(error.mesasge)
        }
    }


    // like_dislike_get
    like_dislike_get = async (req, res) => {
        const { articleSlug } = req.params;
        const { userId } = req;
        try {
            const get = await articleModel.findOne({ slug: articleSlug }).select({ like: 1, dislike: 1, like_dislike: 1 });
            const check_user = await get.like_dislike.find(u => u.like_disliker_id === userId);

            if (check_user) {
                if (check_user.like_or_dislike === "like") {
                    responseReturn(res, 201, {
                        like_status: "like",
                        dislike_status: "",
                        like: get.like,
                        dislike: get.dislike
                    })
                } else {
                    responseReturn(res, 201, {
                        like_status: "",
                        dislike_status: "dislike",
                        like: get.like,
                        dislike: get.dislike
                    })
                }

            } else {
                responseReturn(res, 201, {
                    like_status: "",
                    dislike_status: "",
                    like: get.like,
                    dislike: get.dislike
                })
            }

        } catch (error) {
            console.log(error.mesasge)
        }
    }



    // user_article_like
    user_article_like = async (req, res) => {
        const { articleId, like_status, dislike_status, adminId } = req.body
        const { userName, userId } = req;

        try {
            const { like, slug, dislike } = await articleModel.findOne({ _id: articleId });
            if (!like_status && !dislike_status) {
                await articleModel.updateOne({ _id: articleId }, {
                    like: like + 1,
                    $push: {
                        like_dislike: {
                            like_or_dislike: "like",
                            like_disliker_id: userId
                        }
                    }
                }, { new: true });

                await notificationModel.create({
                    subject: `${userName} like your article`,
                    slug,
                    adminId
                });

                responseReturn(res, 200, { message: "You like this article" })

            } else if (like_status && !dislike_status) {

                await articleModel.updateOne({ _id: articleId }, {
                    like: like - 1,
                    $pull: {
                        like_dislike: {
                            like_disliker_id: userId
                        }
                    }
                });

                await notificationModel.create({
                    subject: `${userName} like remove your article`,
                    slug,
                    adminId
                });
                responseReturn(res, 200, { message: "Undo like" })
            } else if (!like_status && dislike_status) {

                await articleModel.updateOne(
                    {
                        _id: articleId,
                        'like_dislike.like_disliker_id': userId
                    }, {
                    like: like + 1,
                    dislike: dislike - 1,
                    $set: {
                        'like_dislike.$.like_or_dislike': 'like'
                    }
                }
                );

                await notificationModel.create({
                    subject: `${userName} like your article`,
                    slug,
                    adminId
                });

                responseReturn(res, 200, { message: "You like this article" })

            }

        } catch (error) {
            console.log(error.mesasge)
        }
    }


    // user_article_dislike
    user_article_dislike = async (req, res) => {
        const { articleId, like_status, dislike_status, adminId } = req.body
        const { userName, userId } = req;

        try {

            const { like, slug, dislike } = await articleModel.findOne({ _id: articleId });
            if (!like_status && !dislike_status) {
                await articleModel.updateOne({ _id: articleId }, {
                    dislike: dislike + 1,
                    $push: {
                        like_dislike: {
                            like_or_dislike: "dislike",
                            like_disliker_id: userId
                        }
                    }
                }, { new: true });

                await notificationModel.create({
                    subject: `${userName} dislike your article`,
                    slug,
                    adminId
                });

                responseReturn(res, 200, { message: "You dislike this article" })

            } else if (!like_status && dislike_status) {

                await articleModel.updateOne({ _id: articleId }, {
                    dislike: dislike - 1,
                    $pull: {
                        like_dislike: {
                            like_disliker_id: userId
                        }
                    }
                });

                await notificationModel.create({
                    subject: `${userName} dislike remove your article`,
                    slug,
                    adminId
                });
                responseReturn(res, 200, { message: "Undo dislike" })
            } else if (like_status && !dislike_status) {

                await articleModel.updateOne(
                    {
                        _id: articleId,
                        'like_dislike.like_disliker_id': userId
                    }, {
                    dislike: dislike + 1,
                    like: like - 1,
                    $set: {
                        'like_dislike.$.like_or_dislike': 'dislike'
                    }
                }
                );

                await notificationModel.create({
                    subject: `${userName} dislike your article`,
                    slug,
                    adminId
                });

                responseReturn(res, 200, { message: "You dislike this article" })
            }

        } catch (error) {
            console.log(error.mesasge)
        }

    }

}


module.exports = new homeController();