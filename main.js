var fs = require('fs');
var youtubedl = require('youtube-dl');
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var http = require('http');

const OUTPUT_FOLDER = "output";
const EXTENTION_TYPE = "mp3";

init()

function init(){
  if((process.argv).length >= 6){
    download(process.argv[3], process.argv[4], function(error,infoJSON){
      infoJSON.songTitle = process.argv[4];
      infoJSON.artist = process.argv[5];
      if(error)
        return error;
      else if(process.argv[6], process.argv[7])
        trimMp3(infoJSON.filePath,process.argv[6], process.argv[7],function(error,newPath){
          infoJSON.filePath = newPath;
          if(process.argv[2] != null && process.argv[2] != "null"){
            finalAjax(process.argv[2],infoJSON,function(error,response){
              if(!error){
                console.log(infoJSON);
                if(response)
                  console.log(response);
                console.log("Script completed!");
              }
            })
          }
          else{
              console.log(infoJSON);
              console.log("Script completed!");
          }
        })
      else{
        if(process.argv[2] != null && process.argv[2] != "null"){
          finalAjax(process.argv[2],infoJSON,function(error,response){
            if(!error){
              console.log(infoJSON);
              if(response)
                console.log(response);
              console.log("Script completed!");
            }
          })
        }
        else{
            console.log(infoJSON);
            console.log("Script completed!");
        }
      }
    });
  }
  else{
    console.log("Invalid use; use 'node main.js <final callback url, nullable*> <source media URL*> <Song title*> <artist name*> <start-time> <end-time>");
    console.log("* are mandatory.");
    console.log("I.E ::: node main.js http://www.legofshadows.com/media/test https://www.youtube.com/watch?v=d2hRTLdvdnk kriegerLove KriegBot 0:40 2:00");
  }

}

function download(input, name, callBack){
  var video = youtubedl(input, ['--format=18'],{ cwd: __dirname });
  var output = OUTPUT_FOLDER+"/"+ name + Date.now()+"."+EXTENTION_TYPE;
  var statsJson;
  video.on('info', function(info) {
    console.log("Downloading : " + info._filename);
    statsJson = JSON.parse('{"filePath": "'+output+'", "size": '+info.size+',"format": "'+EXTENTION_TYPE+'"}');
  });

  video.on('end', function() {
    // console.log(statsJson);
    if(callBack)
      return callBack(null,statsJson);
  });

  video.pipe(fs.createWriteStream(output));
}

function trimMp3(filePath,min,max,callBack){
  if(min.indexOf(":") === -1)
    min = "0:"+min;
  if(max.indexOf(":") === -1)
    max = "0:"+max;

  var duration = diff(min, max);
  var newPath = filePath.replace(/\.[^/.]+$/, "") + "-"+ Date.now() + path.extname(filePath);
  ffmpeg(filePath)
    .setStartTime(min)
    .setDuration(duration)
    .output(newPath)
    .on('end', function(err) {
        fs.unlink(filePath, function(){
          if(!err && callBack)
            return callBack(null,newPath);
        })
    })
    .on('error', function(error){
        console.log('error: ' + error);
        if(callBack)
          return callBack(error,null);
    }).run();
}

function diff(start, end) {
    start = start.split(":");
    end = end.split(":");
    var startDate = new Date(0, 0, 0, start[0], start[1], 0);
    var endDate = new Date(0, 0, 0, end[0], end[1], 0);
    var diff = endDate.getTime() - startDate.getTime();
    var hours = Math.floor(diff / 1000 / 60 / 60);
    diff -= hours * 1000 * 60 * 60;
    var minutes = Math.floor(diff / 1000 / 60);
    if (hours < 0)
       hours = hours + 24;
    return (hours <= 9 ? "0" : "") + hours + ":" + (minutes <= 9 ? "0" : "") + minutes;
}

function finalAjax(url,object,callBack){
  var request = require('request');
  if(!url || url == "null")
    return null;
  else{
    request({
		uri: url,
		method: "POST",
		form: object
	}, function (error, response, body) {
          if (!error) {
            if(callBack)
				// console.log(body);
              return callBack(null,body);
          } else {
			  return callBack(error, null);
		  }
    })
  }
}