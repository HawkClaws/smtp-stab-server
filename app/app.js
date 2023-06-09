const SMTPServer = require("smtp-server").SMTPServer;
const {
  simpleParser
} = require('mailparser');

// フォーマットの文字列から数字部分を抽出する関数
function extractNumberFromString(str) {
  const regex = /status(\d+)@/;
  const match = str.match(regex);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
}

const server = new SMTPServer(
  {
    // STARTTLSコマンドを無効化
    disabledCommands: ['STARTTLS', 'AUTH'],

    // 内容 確認
    async onData(source, session, callback) {
      source.pipe(process.stdout);
      let responseCode;
      let isError = false;
      try {
        const parsedData = await simpleParser(source);
        const { from, to, bcc, cc, subject, text } = parsedData;
        responseCode = extractNumberFromString(to.text);
        if (responseCode != null && responseCode >= 300) {
          isError = true;
        }
        console.log(responseCode);
        console.log({
          from: from.text,
          to: to.text,
          cc: (cc || { text: '' }).text,
          bcc: (bcc || { text: '' }).text,
          subject,
          text: text,
        });
      } catch (err) {
        console.log(err);
      }

      if (isError) {
        const error = new Error("Error from smtp stub server");
        error.responseCode = responseCode;
        return callback(error);
      } else {
        return callback();
      }
    }
  }
);


server.on("error", err => {
  console.log("Error %s", err.message);
});
server.listen(456);
console.log("== start smtp stab server ==")