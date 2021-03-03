const video = document.getElementById("myvideo");
const handimg = document.getElementById("handimage");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const Http = new XMLHttpRequest();

let trackButton = document.getElementById("trackbutton");
let nextImageButton = document.getElementById("nextimagebutton");
let updateNote = document.getElementById("updatenote");

let imgindex = 1
let isVideo = false;
let model = null;

// video.width = 500
// video.height = 400


//Get parameters
const modelParams = {
    flipHorizontal: true,   // flip e.g for video
    maxNumBoxes: 2,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.6,    // confidence threshold for predictions.
}


//Run webcam control, start video

function startVideo() {
    handTrack.startVideo(video).then(function (status) {
        console.log("video started", status);
        if (status) {
            updateNote.innerText = "Video started. Now tracking"
            isVideo = true
            runDetection()
        } else {
            updateNote.innerText = "Please enable video"
        }
    });
}

//toggle video, start or stop video 
function toggleVideo() {
    if (!isVideo) {
        updateNote.innerText = "Starting video"
        startVideo();
    } else {
        updateNote.innerText = "Stopping video"
        handTrack.stopVideo(video)
        isVideo = false;
        updateNote.innerText = "Video stopped"
    }
}



nextImageButton.addEventListener("click", function(){
    nextImage();
});

trackButton.addEventListener("click", function(){
    toggleVideo();
});


//
function nextImage() {

    imgindex++;
    handimg.src = "images/" + imgindex % 15 + ".jpg"
    // alert(handimg.src)
    runDetectionImage(handimg)
}

//Send new command to the IP camera only that cases, when the movement is changed. Not after every processed frame

var old_cmdone = [];
function command(command) {
  if (old_cmdone != command) {
    const url='https://leszped.tmit.bme.hu/smartcity-control/c.php?/cgi- bin/CGIProxy.fcgi?cmd='+command;
    Http.open("GET", url);
    Http.setRequestHeader('Content-Type', 'application/xml');
    Http.send();
    Http.onreadystatechange = (e) => {
    console.log(Http.responseText)
    updateNote.innerText = Http.responseText
    }
    console.log(command)
    old_cmdone = command;
  }
}









//Render Prediction
function runDetection() {
    model.detect(video).then(predictions => {
        console.log("Predictions: ", predictions);
        model.renderPredictions(predictions, canvas, context, video);


        //Draw Line on the vedio
        context.moveTo(0, 160);
        context.lineTo(640, 160);
        context.stroke();
        console.log(video.width);
        console.log(video.height);
        context.moveTo(0, 320);
        context.lineTo(640, 320);
        context.stroke();

        context.moveTo(213, 0);
        context.lineTo(213, 480);
        context.stroke();

        context.moveTo(426, 0);
        context.lineTo(426, 480);
        context.stroke();





        if (predictions.length == 1){
          console.log("one hands recognized")
          console.log(predictions[0].bbox[0]);
          let distance_x = Math.abs(predictions[0].bbox[0] + (predictions[0].bbox[2] / 2))
          let distance_y = Math.abs(predictions[0].bbox[1] + (predictions[0].bbox[3] / 2))
          position = [distance_x, distance_y];


          if (distance_x < 213) {
            if (distance_y < 160) {
              console.log("top left")
              command('ptzMoveTopLeft')

            }
            else if (distance_y > 320) {
              console.log("bottomleft")
              command('ptzMoveBottomLeft')
            }
            else {
              console.log("left")
              command('ptzMoveLeft')
            }
          }
          if (distance_x > 426) {
            if (distance_y < 160) {
              console.log("top right");
              command('ptzMoveTopRight')
            }
            else if (distance_y > 320) {
              console.log("bottom right");
              command('ptzMoveBottomRight')
              }

            else {
              console.log("right");
              command('ptzMoveRight')
                }
              }

           else{
             if (distance_y < 160) {
              console.log("move up");
              command('ptzMoveUp')
             }
             else if (distance_y > 320) {
               console.log("move down");
               command('ptzMoveDown')
             }
             else {
                 console.log("stop");
                 command('ptzStopRun')
                 }
               }
             }



        if (predictions.length == 0){
          console.log("no hand recognized")
          console.log("stop")
          command('ptzStopRun')
          }

        if (predictions.length == 2) {
            console.log("two hands recognized")
            //Http.open("GET", url.concat(command_string));
            const url='https://leszped.tmit.bme.hu/smartcity-control/c.php?/cgi- bin/CGIProxy.fcgi?cmd=getPTZSpeed';
            Http.open("GET", url);
            Http.setRequestHeader('Content-Type', 'application/xml');
            Http.send();
            Http.onreadystatechange = (e) => {
            console.log(Http.responseText)
            updateNote.innerText = Http.responseText
            }
            updateNote.innerText = Http.responseText
            console.log(Http.responseText)
            console.log(predictions[0].bbox[0])
            let midival = Math.abs(predictions[0].bbox[0] - predictions[1].bbox[0]);
            console.log(midival)

            if (midival<213) {
              console.log("zoomIn")
              command('zoomIn')
            }
            else if (midival > 426) {
              console.log("zoomOut")
              command('zoomOut')
            }
            else{
              console.log("zoomStop")
              command('zoomStop')

            }







        }

        if (isVideo) {


            requestAnimationFrame(runDetection);

        }
    });
}





function runDetectionImage(img) {
    model.detect(img).then(predictions => {
        console.log("Predictions: ", predictions);
        model.renderPredictions(predictions, canvas, context, img);
    });
}

// Load the model.
handTrack.load(modelParams).then(lmodel => {
    // detect objects in the image.
    model = lmodel
    updateNote.innerText = "Loaded Model!"
    runDetectionImage(handimg)
    trackButton.disabled = false
    nextImageButton.disabled = false
});
