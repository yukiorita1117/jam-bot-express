var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const { WebClient } = require("@slack/web-api");
const axios = require("axios").default;

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

// dotenv 確認
require("dotenv").config();
const env = process.env;
console.log(env.SLACK_TOKEN);
console.log(env.APIKEY);

// bodyParser 追加
const bodyParser = require("body-parser");

// TODO 環境変数にして隠蔽する。
const token = env.SLACK_TOKEN;
const web = new WebClient(token);
app.use(bodyParser.json());

let messageCounter = 0;
let todayWeather = "取得失敗";

// whether method middleware
app.use("/api/weather", function (req, res) {
  // TODO 最終的にはこのように書く
  const APIKEY = process.env.APIKEY;
  const tmpUrl =
    "http://api.openweathermap.org/data/2.5/weather?q=Tokyo&appid=" +
    `${APIKEY}`;

  // const baseUrl =
  //   "http://api.openweathermap.org/data/2.5/weather?id=2172797" +
  //   "&appid=" +
  //   APIKEY;

  axios.get(tmpUrl).then(function (res) {
    console.log("ステータスコード", res.status);
    console.log(res.data);
    res.send(res.data);

    // res.data.weather[0].main が天気の文字列
    // 雨 なら Rain で表示されるのでserver内で変換処理を作る。
  });
});

// slack bot middleware
app.post("/", function (req, res) {
  // Slackは"Request URL"に設定したURLが正当なものかを判定するため、Request URLに指定した内容にPOSTリクエストを送る。それに対し、受け取ったデータから "Challenge" を抜き出して送信する必要がある。
  // TODO ngrokでurlを再発行するたびにここはコメントアウト外して実行すること。
  // res.setHeader("Content-Type", "text/plain");
  // res.send(req.body.challenge);

  // 3秒以内にレスポンスを返さないとslackbotがエラーメッセージを投稿してしまう為挿入
  res.status(200).end();

  console.log(req.body.event);
  console.log("入力値:", req.body.event.text);

  // 100文字以上のmessageイベントにリプライ
  if (!req.body.event.bot_id && [...req.body.event.text].length >= 100) {
    messageCounter = 1;
    // chat.postMessageの実行
    web.chat.postMessage({
      as_user: true,
      channel: req.body.event.channel,
      text: `<@${req.body.event.user}> めっちゃ早口で言ってそう`,
    });
  }

  // Good Morning Event
  if (!req.body.event.bot_id && req.body.event.text.indexOf("おはよう") != -1) {
    messageCounter = 1;
    web.chat.postMessage({
      as_user: true,
      channel: req.body.event.channel,
      text: `<@${req.body.event.user}> おはようございます。今日も一日頑張ってくださいね！`,
    });
  }

  // goodby message
  if (!req.body.event.bot_id && req.body.event.text.indexOf("勤務終了") != -1) {
    messageCounter = 1;
    web.chat.postMessage({
      as_user: true,
      channel: req.body.event.channel,
      text: `<@${req.body.event.user}> お疲れ様でした。ゆっくり休んでくださいね！`,
    });
  }

  // whether method
  if (
    !req.body.event.bot_id &&
    req.body.event.text.indexOf("今日の天気") != -1
  ) {
    messageCounter = 1;
    web.chat.postMessage({
      as_user: true,
      channel: req.body.event.channel,
      text: `<@${req.body.event.user}> 今日の天気は${todayWeather}`,
    });
  }

  // reply question message
  if (!req.body.event.bot_id) {
    if (
      req.body.event.text.indexOf("?") != -1 ||
      req.body.event.text.indexOf("？") != -1
    ) {
      messageCounter = 1;
      web.chat.postMessage({
        as_user: true,
        channel: req.body.event.channel,
        text: `<@${req.body.event.user}> そんなのもわからないんですか？少しは自分で考えてください。`,
      });
    }
  }

  // TODO Image Post Event
  // 違うEvent使わないとダメかも。
  // if (!req.body.event.bot_id && req.body.event.text.indexOf("今日も") != -1) {
  //   web.chat.postMessage({
  //     as_user: true,
  //     channel: req.body.event.channel,
  //     // image path かいてみる
  //     text: `<@${req.body.event.user}> ここにpathかく`,
  //   });
  // }

  // reply other
  if (
    !req.body.event.bot_id &&
    req.body.event.text.length > 0 &&
    messageCounter === 0
  ) {
    web.chat.postMessage({
      as_user: true,
      channel: req.body.event.channel,
      text: `<@${req.body.event.user}> すみません、不要不急なことで話しかけられるのは困ります。。`,
    });
  }

  // reset
  messageCounter = 0;
});

// -------------------------------------------------------------------  //

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
