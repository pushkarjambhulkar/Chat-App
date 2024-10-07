const mongoose = require('mongoose')
const { type } = require('server/reply')

const userSchema =  new mongoose.Schema({
    name : {
        type : String,
        required : [true, "provide name"]
    },
    email : {
        type : String,
        required : [true,"provide email"],
        unique : true
    },
    password : {
        type : String,
        required : [true, "provide password"]
    },
    profile_pic : {
        type : String,
        default : ""
    },
    Update_Password :{
        type:String,
        required : [true, "provide password"]
        
    }
},{
    timestamps : true
})

const UserModel = mongoose.model('User',userSchema)

module.exports = UserModel