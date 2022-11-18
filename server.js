const exp=require('express');
const app=exp();

const PORT=8080;


//connecting to database
const DBURL="mongodb+srv://medipallyabinay:Abhinay%4044@firstculsterma.gkbwv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

//importing mongo client
const mongoclient=require("mongodb").MongoClient;

//connecting to mongo client
mongoclient.connect(DBURL)
.then((client)=>{
    console.log("DB conncetion successfull")
    //posts is a collection in the database retrive it
    const databaseObject=client.db("socialMediaDb");
    let postsCollection=databaseObject.collection("posts");
    let userCollection=databaseObject.collection("users");
    //setting collection object
    app.set("postCollection",postsCollection);
    app.set("userCollection",userCollection);
})
.catch(()=>{
    console.log("failed to connect dababase to the application")
})

app.use(exp.json())

//importing postApis 
const postApis=require('./APIS/PostApis');
app.use('/posts',postApis);

//importing userApis
const userApis=require('./APIS/UserApis');
app.use('/users',userApis);

//Middleware to handle errors
app.use((error,request,response,next)=>{
    response.send({Message:`Error Occured`,Error_type:`${error.message}`})
})

//Middleware to handle invalid path
app.use((request,response,next)=>{
    response.send({Message:`Invalid path: The path ${request.url} is invalid`})
})
app.listen(PORT,()=>console.log(`app is listening on ${PORT}`));

