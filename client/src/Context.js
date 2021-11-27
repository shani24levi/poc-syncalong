import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';

import { FaceMesh } from "@mediapipe/face_mesh";
import * as Facemesh from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import { Pose, POSE_CONNECTIONS, LandmarkGrid, PoseConfig, landmarkContainer } from '@mediapipe/pose';
import { data } from '@tensorflow/tfjs';

const SocketContext = createContext();

//const socket = io('http://localhost:5000');
const socket = io('https://video-chat-socket-api.herokuapp.com/');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');
  const [you, setYou] = useState('');
  const [posesArry, setPosesArry] = useState([]);


  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const connect = window.drawConnectors;
  var camera = null;
  const myCanvasRef = useRef();
  const userCanvasRef = useRef();


  function onResultsFace(results) {
    //console.log(results);
    const videoWidth = 550;
    const videoHeight = 300;

    // Set canvas width	
    myCanvasRef.current.width = videoWidth;
    myCanvasRef.current.height = videoHeight;
    const canvasElement = myCanvasRef.current;

    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        connect(canvasCtx, landmarks, Facemesh.FACEMESH_TESSELATION, {
          color: "#C0C0C070",
          lineWidth: 1,
        });
        connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_EYE, {
          color: "#FF3030",
        });
        connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_EYEBROW, {
          color: "#FF3030",
        });
        connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_EYE, {
          color: "#30FF30",
        });
        connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_EYEBROW, {
          color: "#30FF30",
        });
        connect(canvasCtx, landmarks, Facemesh.FACEMESH_FACE_OVAL, {
          color: "#E0E0E0",
        });
        connect(canvasCtx, landmarks, Facemesh.FACEMESH_LIPS, {
          color: "#E0E0E0",
        });
      }
    }
    canvasCtx.restore();
  }

  let arryof1sec = [];
  let i = 0;
  let timeObject;
  let flagTime = true;
  let flagFeatch = true;
  function onResults(results) {
    //when ther is a conection then start maser time and send data to server
    // if (callAccepted) {
    if (flagTime) {
      timeObject = new Date();
      timeObject = new Date(timeObject.getTime() + 1000 * 5); //2 sec
      //console.log('timeObject ', timeObject);
      flagTime = false;
    }
    let currTime = new Date().getTime();
    if (currTime < timeObject && flagFeatch) {
      arryof1sec.push(results);
    }

    else if (currTime > timeObject && flagFeatch) {
      //  console.log(arryof1sec);
      setPosesArry(arryof1sec);
      //flagFeatch = false;

      arryof1sec = [];
      flagTime = true;
      flagFeatch = true;
    }
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
    console.time("timer1-answerCall");
    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
      console.timeEnd("timer1-answerCall");
    });

    //i get the user stream and i set it in my web veiw
    console.time("timer1-stream");
    peer.on('stream', (currentStream) => {
      //outer person stream
      console.timeEnd("timer1-stream");
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    //id is to who i call
    setYou(id);
    const peer = new Peer({ initiator: true, trickle: false, stream });

    console.time("timer2-callUser");
    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
      console.timeEnd("timer2-callUser");
    });

    console.time("timer2-stream");
    var start = new Date();
    peer.on('stream', (currentStream) => {
      console.timeEnd("timer2-stream");
      console.log('Request took:', (new Date() - start) / 1000, 'sec');
      userVideo.current.srcObject = currentStream;
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const sendPoses = async (data) => {
    //Measure API response time with fetch 
    //console.log(connectionRef.current);
    if (connectionRef.current != undefined) {
      //console.log(callAccepted && !callEnded);
      console.time("timer-to-with-db-2");
      axios({
        method: 'POST',
        url: 'https://video-chat-socket-api.herokuapp.com/api/post/db',
        data: {
          "user": me,
          "pose2sec": arryof1sec
        }
      })
        .then((data) => {
          console.timeEnd("timer-to-with-db-2");
          //console.log(data);
          //set object for re-loop
          arryof1sec = [];
          flagTime = true;
          flagFeatch = true;
        })
        .catch((error) => {
          console.timeEnd("timer-to-with-db-2");
        })
    }
  }

  const sendMyPoses = async (data) => {
    //Measure API of sendin data after conection has accore
    var start = new Date();
    socket.emit("sendPoses", data);
    console.log('Request took for sending my-pose:', (new Date() - start) / 1000, 'sec');
  }

  const resivingPoses = async () => {
    socket.on("resivingPoses", (data) => {
      console.log(data);
    })
  }

  const getUsersSync = async () => {
    //fatch bouth curr poses of usesrs from db

    const peer = new Peer({ initiator: true, trickle: false, stream });
    //set it in socket to other user
    console.time("timer2-get-other-posess");
    peer.on('poses', (poses) => {
      console.timeEnd("timer2-get-other-posess");
      console.log(poses);
    });
  }

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
      userCanvasRef,
      posesArry,
      you,
      sendPoses,
      sendMyPoses,
      socket
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
