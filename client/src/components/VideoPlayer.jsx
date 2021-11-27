import React, { useContext, useEffect } from 'react';
import { Grid, Typography, Paper, makeStyles } from '@material-ui/core';
import Webcam from "react-webcam";
import Swal from 'sweetalert2';

import { SocketContext } from '../Context';

const VideoPlayer = () => {
  const { name, callAccepted, myVideo, userVideo, callEnded, stream, call, myCanvasRef, userCanvasRef, me, posesArry, you, sendPoses, sendMyPoses, socket } = useContext(SocketContext);
  const classes = useStyles();

  const goodJob = (mytitle) => {
    //say Goog Job:
    Swal.fire({
      title: mytitle,
      width: 600,
      padding: '3em',
      background: '#fff url(/images/good-job.jpg) ',
      backdrop: `
                  rgba(0,0,123,0.4)
                  url("/images/good.gif")`
    })
  }
  useEffect(() => {
    socket.on("resivingPoses", (data) => {
      var start = data.time;
      console.log("strat: ", start, " sec:", new Date(start).getSeconds());
      var end = new Date().toString();
      console.log("end: ", end, " sec:", new Date(end).getSeconds());
      console.log('resiving took:', (new Date(end).getSeconds()- new Date(start).getSeconds()), 'sec');
      console.log('data-resiving : ', data);
      //feedBack when send ended
      goodJob('received poses-data from you !');
    })
  }, [socket]);

  useEffect(() => {
    console.log('me', me);
    console.log('you', you);
  }, [me, you]);


  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       const response = await sendPoses(posesArry);
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   };

  //   //console.log(posesArry);
  //   if (callAccepted && !callEnded) {
  //     if (posesArry.length > 0 && posesArry != undefined) {
  //       //do call for update curr poss // bouth users do it im the same time .
  //       //fetchData();

  //       if (you.length != 0) {
  //         //when i'm the user who answer the call 
  //         // then only me sents the req for sync - my peer will get it with socket server
  //         console.log('me', me);
  //         console.log('you', you);
  //       }
  //     }
  //   }

  // }, [posesArry, callAccepted, callEnded]);


  const onSendMyPoses = async () => {
    var start = new Date().toString();
    console.log("start after click: ",start);
    if (posesArry.length > 0 && you.length != 0) {
      console.log('sending poses....');

      let data = {
        from: me,
        to: you,
        time: start,
        poses: posesArry
      }
      const response = await sendMyPoses(data);
      goodJob('sent you my poses-data');
    }
    else {
      Swal.fire('cant send posess- missing id of peer on conection')
      console.log('cant send posess');
    }

  }

  return (
    <Grid container className={classes.gridContainer}>
      {stream && (
        <Paper className={classes.paper}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>{name || 'Name'}</Typography>
            <Webcam playsInline muted ref={myVideo} autoPlay className={classes.video} />
            {/* <canvas ref={myCanvasRef} className={classes.video}></canvas> */}
          </Grid>
        </Paper>
      )}
      {callAccepted && !callEnded && (
        <Paper className={classes.paper}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
            <video playsInline ref={userVideo} autoPlay className={classes.video} />
            {/* <canvas ref={userCanvasRef} className={classes.video}></canvas> */}
          </Grid>
        </Paper>
      )}

      <button onClick={onSendMyPoses}>Send My Poses</button>

    </Grid>
  );
};


const useStyles = makeStyles((theme) => ({
  video: {
    width: '550px',
    [theme.breakpoints.down('xs')]: {
      width: '300px',
    },
  },
  gridContainer: {
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  paper: {
    padding: '10px',
    border: '2px solid black',
    margin: '10px',
  },
}));

export default VideoPlayer;
