import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';

import { FaceMesh } from "@mediapipe/face_mesh";
import * as Facemesh from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import { Pose, POSE_CONNECTIONS, LandmarkGrid, PoseConfig, landmarkContainer } from '@mediapipe/pose';

const SocketContext = createContext();

// const socket = io('http://localhost:5000');
const socket = io('https://warm-wildwood-81069.herokuapp.com');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const connect = window.drawConnectors;
  var camera = null;
  const myCanvasRef = useRef();
  const userCanvasRef = useRef();


  // function onResults(results) {
  //   //console.log(results);
  //   const videoWidth = 550;
  //   const videoHeight = 300;

  //   // Set canvas width	
  //   myCanvasRef.current.width = videoWidth;
  //   myCanvasRef.current.height = videoHeight;
  //   const canvasElement = myCanvasRef.current;

  //   const canvasCtx = canvasElement.getContext("2d");
  //   canvasCtx.save();
  //   canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  //   canvasCtx.drawImage(
  //     results.image,
  //     0,
  //     0,
  //     canvasElement.width,
  //     canvasElement.height
  //   );
  //   if (results.multiFaceLandmarks) {
  //     for (const landmarks of results.multiFaceLandmarks) {
  //       connect(canvasCtx, landmarks, Facemesh.FACEMESH_TESSELATION, {
  //         color: "#C0C0C070",
  //         lineWidth: 1,
  //       });
  //       connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_EYE, {
  //         color: "#FF3030",
  //       });
  //       connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_EYEBROW, {
  //         color: "#FF3030",
  //       });
  //       connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_EYE, {
  //         color: "#30FF30",
  //       });
  //       connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_EYEBROW, {
  //         color: "#30FF30",
  //       });
  //       connect(canvasCtx, landmarks, Facemesh.FACEMESH_FACE_OVAL, {
  //         color: "#E0E0E0",
  //       });
  //       connect(canvasCtx, landmarks, Facemesh.FACEMESH_LIPS, {
  //         color: "#E0E0E0",
  //       });
  //     }
  //   }
  //   canvasCtx.restore();
  // }

  let arryof1sec = [];
  let i = 0;
  let timeObject;
  let flagTime = true;
  let flagFeatch = true;
  function onResults(results) {
    //set arraty of point for 1 sec when its starts
    if (flagTime) {
      timeObject = new Date();
      timeObject = new Date(timeObject.getTime() + 1000 * 2); //2 sec
      console.log('timeObject ', timeObject);
      flagTime = false;
    }
    let currTime = new Date().getTime();

    if (currTime < timeObject) {
      arryof1sec.push(results);
    }
    else if (currTime > timeObject && flagFeatch) {
      console.log(arryof1sec);
      flagFeatch = false;

      //Measure API response time with fetch 
      console.time("timer1");
      axios({
        method: 'POST',
        url: 'https://video-chat-socket-api.herokuapp.com/api/post',
        data: {
          "email": "email",
          "pass": "pass"
        }
      })
        .then((data) => {
          console.timeEnd("timer1");
          console.log(data);
        })
        .catch((error) => {
          console.timeEnd("timer1");
        })

      console.time("timer2");
      axios({
        method: 'POST',
        url: 'https://video-chat-socket-api.herokuapp.com/api/post/db',
        data: {
          "user": "shani"
        }
      })
        .then((data) => {
          console.timeEnd("timer2");
          console.log(data);
        })
        .catch((error) => {
          console.timeEnd("timer2");
        })

      // console.time("timer1");
      // fetch('https://video-chat-socket-api.herokuapp.com/post')
      //   .then((res) => {
      //     return res.json();
      //   })
      //   .then((data) => {
      //     console.timeEnd("timer1");
      //   })
    }

    // if (i < 100) {
    //   if (i == 0) console.log('0 ', new Date().getTime());
    //   arryof1sec.push(results);
    //   console.log(arryof1sec);
    //   i++;
    //   if (i == 90) {
    //     console.log('9999 ', new Date().getTime());
    //     console.log('arryof1sec ', arryof1sec);
    //   }
    // }

    //console.log(results);
    // const grid = new LandmarkGrid(landmarkContainer);
    // if (!results.poseLandmarks) {
    //   grid.updateLandmarks([]);
    //   return;
    // }

    const videoWidth = 550;
    const videoHeight = 300;

    // Set canvas width	
    myCanvasRef.current.width = videoWidth;
    myCanvasRef.current.height = videoHeight;
    const canvasElement = myCanvasRef.current;

    const canvasCtx = canvasElement.getContext('2d');
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.segmentationMask, 0, 0,
      canvasElement.width, canvasElement.height);

    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = 'source-in';
    canvasCtx.fillStyle = '#00FF00';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    connect(canvasCtx, results.poseLandmarks, Pose.POSE_CONNECTIONS,
      { color: '#00FF00', lineWidth: 4 });
    connect(canvasCtx, results.poseLandmarks,
      { color: '#FF0000', lineWidth: 2 });
    canvasCtx.restore();

    // grid.updateLandmarks(results.poseWorldLandmarks);
  }

  const setFaceMask = (video) => {
    console.log('video ', video);
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    console.log('video', video);
    faceMesh.onResults(onResults);

    if (
      typeof video.current !== "undefined" &&
      video.current !== null
    ) {
      camera = new cam.Camera(video.current.video, {
        onFrame: async () => {
          await faceMesh.send({ image: video.current.video });
        },
        width: 640,
        height: 480,
      });

      console.log('camera', camera);
      camera.start();
    }
  }

  const setPose = (video) => {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults(onResults);

    if (
      typeof video.current !== "undefined" &&
      video.current !== null
    ) {
      camera = new cam.Camera(video.current.video, {
        onFrame: async () => {
          await pose.send({ image: video.current.video });
        },
        width: 640,
        height: 480,
      });

      console.log('camera', camera);
      camera.start();
    }

  }

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        myVideo.current.srcObject = currentStream;
        console.log(currentStream);
        //setFaceMask(myVideo);
        setPose(myVideo);
      });

    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    //set me as a peer and difiend my data 
    const peer = new Peer({ initiator: false, trickle: false, stream });

    //when i get a signel that call is answered - i get data about the single 
    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    //i get the user stream and i set it in my web veiw
    peer.on('stream', (currentStream) => {
      //outer person stream
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
      myCanvasRef,
      userCanvasRef
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
