import jwt from 'jsonwebtoken'
import User from "../models/UserModel.js"

export const verifyToken = async (request, response, next) => {
  try {
    // Check for token in cookies first
    const token = request.cookies.jwt || request.headers.authorization?.split(' ')[1]
    
    if (!token) {
      const error = new Error("Not authorized, no token!")
      error.status = 401
      throw error
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      const error = new Error("User not found!")
      error.status = 404
      throw error
    }

    request.userId = user.id
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      error.status = 401
      error.message = "Invalid token!"
    }
    next(error)
  }
}