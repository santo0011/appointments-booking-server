const jwt = require('jsonwebtoken');

module.exports.authMiddleware = async (req, res, next) => {

    const { authorization } = req.headers;

    // console.log("authorization", authorization)


    if (authorization) {

        const token = authorization.split('Bearer ')[1]

        if (!token) {
            return res.status(409).json({ error: 'Please login first' })
        } else {
            try {
                const deCodeToken = await jwt.verify(token, process.env.SECRET)
                req.userId = deCodeToken.id
                req.isAdmin = deCodeToken.isAdmin
                next();
            } catch (error) {
                return res.status(409).json({ error: 'Please login' })
            }
        }
    } else {
        return res.status(409).json({ error: 'Please login' })
    }

}
