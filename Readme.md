# yourVid app

#### Project setup =>
1. `.gitignore` file but some file want to add so better coder use .gitkeep file also public/temp/.gitkeep
2. `.env` hide sensitive data so we have to use `.env.sample` for sometime we have to deploy app but not read this hidden data so it will be needed
3. make 3 files `index.js` `constants.js` `app.js`
4. use `nodemon` devdependency for server need not to restart again and again.
5. use `prettier` sometimes developers add extra whitespaces and semicolons missed so it is used to correct this (two files `.prettierrc` for which want to change, `.prettierignore` for prettier need not to change this files and folders)

<hr>

#### Database setup =>
1. Create database on `mongodb` website and create `cluster` and create `collections`
2. Make database file in `src/db/index.js` and imported `mongoose` library and handle all required.
3. Sensitive info added in `dotenv` file and also setup my `dotenv` configuration
4. Also added some dotenv information in `dotenvsample` file for more `readibility` and hide some `confidental information`
5. Also updated some dotenv configuration on `package.json` when app is running on developement mode

<hr>

#### Utility setup =>
1. `async await handler:` created async await handler where i can use easily handle the promises and trycatch and here i both 2 options i commented but currently i uses promises functions which can be make easy to setup.
2. `API Error:` this api basically handle our code where which data i send and it will give error then what i have to do status code, messages and anything about errors.
3. `API Response:` this api basically handle our code where which data i send and it will successfully sent then what i have to do status code, messages and anything about data.

#### Model setup =>
1. making a video model and using `mongoose-aggregate-paginate-v2` dependency to set use the pagination of our video model.
2. making our user model including username, email, password,..... and using `bcrypt` dependency to set password in incrypted by secure and also decrypted used. Also use another dependency `jsonwebtoken` to set user login time for sometimes here i used 2 functions which 1 are when user logged in give access token and also get a refresh token for some times.

#### Media upload setup =>
1. use `cloudinary` to upload the database of media url and if something error on uploading use `file system` `fs` to unlink the temperory uploaded the file on local.
2. use `multer` middleware to upload help when uploading any then go to cloudinary and get a url upload url on the mongodb database.

#### controller =>
-------------------------- user controller ------------------------
1. `Register:` using all previous setting use post method user completed successfully.
2. `Login:` using all previous setting use post method to user logged in successfully and also i created a generated access and refresh token send to user.
3. `Logout:` Also logout a user handled by server side so make verify cookie from body or header and check using `jsonwebtoken` and find user in database and send the user as an empty object. 
4. `Refresh/Access-Token:` using refresh token and access token got initially when register and login but when logged out access token flushed and refresh token used to some limited time if expired then again generate a refresh token for same limited time and access token given when user logged in.
5. `Change password:` user can change her password with old password, new password and confirm password.
6. `Get current user:` get current user when user already logged in.
7. `Update account details:` user can update account details by text like email, fullname...
8. `Change Avatar:` user can get file and update avatar on database and cloudinary.
9. `Change Cover Image:` user can get file and update her Cover Image on database and cloudinary.
10. `Channel profile:` user can get channel profile.
11. `watch history:` user can get her watch history.