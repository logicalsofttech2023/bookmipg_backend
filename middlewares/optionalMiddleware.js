import jwt from "jsonwebtoken";

const optionalAuth = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (authHeader) {
        try {
            const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            console.log("Invalid token, proceeding without authentication");
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
};


export default optionalAuth;
