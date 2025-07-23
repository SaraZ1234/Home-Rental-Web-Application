//Core module
const path = require('path');

const express = require('express');

const rootDir = require('./utils/pathUtil');

const hostRouter = require('./routes/HostRouter');
const userRouter = require('./routes/UserRouter');

const app = express();

//ejs
app.set('view engine', 'ejs');
//telling vscode that I will use ejs in views folder. (Means any file of views folder).
app.set('views', 'views');


app.use(express.urlencoded({ extended: false }));

app.use('/host', hostRouter);

app.use((req, res, next) => {
  console.log('➡️ Request:', req.method, req.url);
  next();
});


app.use('/host', userRouter);


const port = 3005;

app.listen(port, () => {
  console.log(`Server running on address http://localhost:${port}`);

})