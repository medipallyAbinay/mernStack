const express = require("express");

const userApi=express.Router();

//to extract body of request objects
userApi.use(express.json())
userApi.use(express.urlencoded())

//importing expressAsyncHandler
const expressAsyncHandler=require('express-async-handler');

//configuring cloudinary
var cloudinary=require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer=require('multer');
// const userApi = require("./userApis");
const { json } = require("express/lib/response");
cloudinary.config({
    cloud_name:'dgh5ihi0u',
    apt_key:459953436539166,
    api_secret:'7btjDyxPlK1AtgBn2Cty538b7YI',
    secure:true
})

//configuring cloudinary storage
const storage= new CloudinaryStorage ({
    cloudinary:cloudinary,
    params: async(request,file)=>{
        return {
            folder:"name",
            public_id:file.fieldname+"_"+Date.now( )
        }
    }
})

//configuring multer
var upload= multer({storage:CloudinaryStorage})

//creating a middleware to send all available posts
userApi.get('/all-users',expressAsyncHandler(async (request,response)=>{
    let userCollection=request.app.get("userColletion")
    let users=await userCollection.find().toArray()
    response.send({message:"ALL users",payload:users});
}))


//creating a new user
userApi.post('/createuser',upload.single("photo"),expressAsyncHandler(async(request,response)=>{
    let userCollection=request.app.get('userCollection')
    //extracting userdata
    let newUser=JSON.parse(request.body.userObj);

    // checking if user already exists
    let userOfDB=await userCollection.findOne({username:newUser.username});
   // console.log(userOfDB);
    if(userOfDB==null){
        // hashing the password
        let hashedPassword=await bcryptjs.hash(newUser.password,6)
        //changing the plaintext to encrypted password
        newUser.password=hashedPassword;
        //handling profile picture
        newUser.Image=request.file.path;
        delete newUser.photo
        //inserting new user into the database
        await userCollection.insertOne(newUser);
        response.send({message:"user successfully created. please remember your username and password"})
    }
   else{
       //the username is already taken so ask client to give a new username
       response.send({message:"Username already taken.. select a new username"})
   }
   
}))


//logging in
userApi.post('/login', expressAsyncHandler(async(request,response)=>{
    let userCollectionObject=request.app.get('userCollectionObject')

    //getting user credentials
    let currentUser=request.body;
    // validating the user
    let userOfDB=await userCollectionObject.findOne({username:currentUser.username})
    if(userOfDB==null){
        response.send({message:"No user exists"})
    }
    else{
        //checking if the passwords are correct
        let status=await bcryptjs.compare(currentUser.password,userOfDB.password)
        if(status==true){
            //sending the token to the client
            let token=jwt.sign({username:userOfDB.username},'ABCDEF',{expiresIn:"2d"})
            response.send({message:"Authentication Success",payload:token})
        }
        else{
            response.send({message:"Invalid Password"})
        }
    }
}) )

//delete user route
userApi.delete('/:username', expressAsyncHandler(async(request,response)=>{
    let userCollection=request.app.get('userCollection')
    // deleting user from database
    await userCollection.deleteOne({username:request.params.username})
    response.send({message:"user successfully deleted"})
}) )

//update existing us
userApi.post("/updatedetails",upload.single("photo") ,expressAsyncHandler(async(request,response)=>{
    let userCollectionObject=request.app.get('userCollection')
    // extracting updated object
    let modifiedUser=JSON.parse(request.body.modifiedUserObj)
    //check if credentials are valid 
    let userOfDB= await userCollectionObject.findOne({username:modifiedUser.username});
    if(userOfDB==null){
        response.send({message:"No user exists"})
    }
    else{
        let status=await bcryptjs.compare(modifiedUser.password,userOfDB.password)
        console.log(userOfDB,modifiedUser)
        if(status==true){
            modifiedUser.Image=request.file.path;
            await userCollectionObject.updateOne({username:userOfDB.username},{$set:{...modifiedUser}})
            response.send({message:"user updated"})
        }
        else{
            response.send({message:"invalid password"})
        }
    }
}) )

//expoting 
module.exports=userApi;
