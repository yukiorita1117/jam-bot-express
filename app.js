var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// bodyParser 追加
const bodyParser = require("body-parser");

// urlencodedParserの導入
const urlencodedParser = bodyParser.urlencoded({ extended: false });

//
app.post("/", urlencodedParser, function (req, res) {
  // 3秒以内にレスポンスを返さないとslackbotがエラーメッセージを投稿してしまう為挿入
  res.status(200).end();
  // req.body.payloadをパースする
  const payload = JSON.parse(req.body.payload);
  console.log(payload);
});

app.listen(3000);

// -------------------------------------------------------------------  //

// 今回は root を使いたいのでコメントアウト
// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
