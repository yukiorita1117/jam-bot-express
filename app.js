var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const { WebClient } = require("@slack/web-api");

var indexRouter = require("./routes/index");

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
// const urlencodedParser = bodyParser.urlencoded({ extended: false });

const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);
app.use(bodyParser.json());

// slack bot
app.post("/", function (req, res) {
  // Slackは"Request URL"に設定したURLが正当なものかを判定するため、
  // Request URLに指定した内容にPOSTリクエストを送る。
  // それに対し、受け取ったデータから"Challenge"を抜き出して送信する必要がある。
  // res.setHeader("Content-Type", "text/plain");
  // res.send(req.body.challenge);

  console.log(req.body.event);
  // botからの発言でなく、100文字以上のmessageイベントにリプライ
  if (!req.body.event.bot_id && [...req.body.event.text].length >= 100) {
    // chat.postMessageの実行
    web.chat.postMessage({
      as_user: true,
      channel: req.body.event.channel,
      text: `<@${req.body.event.user}> めっちゃ早口で言ってそう`,
    });
  }
});

// app.listen(8080);

// -------------------------------------------------------------------  //

// 今回は root を使いたいのでコメントアウト
// app.use('/', indexRouter);

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

// portを指定する
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;
