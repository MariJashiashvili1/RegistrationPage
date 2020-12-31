const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path')
const Article = require('./models/article');
const articleRouter = require('./routes/articles');
const methodOverride = require('method-override');
const router = express.Router();
const app = express();
// passport config
require('./config/passport')(passport);
// Database
const db = require('./config/keys').MongoURI;

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err));
// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
// bodyparser
app.use(express.urlencoded({ extended: false }));


// express
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// passport
app.use(passport.initialize());
app.use(passport.session());
// flash
app.use(flash());


// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });
// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
// Set storage engine
const storage = multer.diskStorage({
  destination: './public/uploads/', 
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// init upload
const upload = multer({
  storage: storage,
  limits: {fileSize: 1000000},
  fileFilter: function(req, file, cb) {
     checkFileType(file, cb);
  }
}).single('MyImage');

// check file type
function checkFileType(file, cb) {
  // Allowed extension
  const filetypes = /jpeg|jpg|png|gif/;
  // check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname) {
    return cb(null, true);
  }
  else {
    cb('Error: Images Only!');
  }
}


app.use(express.static('./public'));
app.get('index', (req, res) => res.render('index'));


app.post('/uploads', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      res.render('index', {
        msg: err
      });
    } else {
      if(req.file == undefined){
        res.render('index', {
          msg: 'Error: No File Selected!'
        });
      } else {
        res.render('index', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`
        });
      }
    }
  });
});

app.use(methodOverride('_method'));
app.get('/index.ejs', async (req, res) => {
  const articles = await Article.find().sort({ createdAt: 'desc' })
  res.render('/index.ejs', { articles: articles })
});
app.use('/articles', articleRouter);
const PORT = process.env.PORT || 5500;

app.listen(PORT, console.log(`Server started on port ${PORT}`));