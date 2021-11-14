import React, { useContext } from 'react';
import { Grid, Typography, Paper, makeStyles } from '@material-ui/core';
import Webcam from "react-webcam";

import { SocketContext } from '../Context';
import { Web } from '@material-ui/icons';

const VideoPlayer = () => {
  const { name, callAccepted, myVideo, userVideo, callEnded, stream, call, myCanvasRef, userCanvasRef } = useContext(SocketContext);
  const classes = useStyles();

  console.log(myVideo);
  console.log(myCanvasRef);

  return (
    <Grid container className={classes.gridContainer}>
      {stream && (
        <Paper className={classes.paper}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>{name || 'Name'}</Typography>
            <Webcam hidden playsInline muted ref={myVideo} autoPlay className={classes.video} />
            <canvas ref={myCanvasRef} lassName={classes.video}></canvas>
          </Grid>
        </Paper>
      )}
      {callAccepted && !callEnded && (
        <Paper className={classes.paper}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
            <video playsInline ref={userVideo} autoPlay className={classes.video} />
            <canvas ref={userCanvasRef} lassName={classes.video}></canvas>
          </Grid>
        </Paper>
      )}
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
