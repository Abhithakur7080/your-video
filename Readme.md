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

#### utility setup =>
1. `async await handler:` created async await handler where i can use easily handle the promises and trycatch and here i both 2 options i commented but currently i uses promises functions which can be make easy to setup.
2. `API Error:` this api basically handle our code where which data i send and it will give error then what i have to do status code, messages and anything about errors.
3. `API Response:` this api basically handle our code where which data i send and it will successfully sent then what i have to do status code, messages and anything about data.

#### model setup =>
1. making a video model and using `mongoose-aggregate-paginate-v2` dependency to set use the pagination of our video model.
2. making our user model including username, email, password,..... and using `bcrypt` dependency to set password in incrypted by secure and also decrypted used. Also use another dependency `jsonwebtoken` to set user login time for sometimes here i used 2 functions which 1 are when user logged in give access token and also get a refresh token for some times.