import Background from "../Background";
import { ThreadedPose, Pose } from "../Pose";
// Importing the useState hook from React to manage component state
import { useState, useEffect } from "react";
import { MainBox, StartBox, IntermediateBox, EndBox } from "./PoseAuthoringBoxes";
import { black, green, blue, white, pink, orange } from "../../utils/colors";
import RectButton from "../RectButton";
import { useMachine } from "@xstate/react";
import { PoseAuthMachine } from "../../machines/poseauthMachine";
import { capturePose, saveConjecture, resetConjecture } from "./ButtonFunctions";
import { calculateFaceDepth } from "../Pose/landmark_utilities";
// Importing Text and Graphics components from @inlet/react-pixi for rendering text and shapes in Pixi
import { Text, Graphics } from '@inlet/react-pixi';

// Defining a NotificationBox component using Pixi components
const NotificationBox = ({ message, textSize }) => {
  return (
    <Graphics
      draw={(g) => {
        g.clear();
        g.beginFill(0xffffff); // white background
        g.drawRect(630, 165, 400, 100); // adjust size as needed
        g.endFill();
      }}
    >
      <Text text={message} x={630} y={165} style={{ fill: 0x000000, fontSize: textSize }} />
    </Graphics>
  );
};

const PoseAuthoring = (props) => {
    const { height, width, poseData, columnDimensions, rowDimensions, conjectureCallback } = props;
    const playerColumn = props.columnDimensions(3);
    const [poseSimilarity, setPoseSimilarity] = useState([]);
    const [state, send] = useMachine(PoseAuthMachine);

    // constants for the layout
    const mainBoxWidth = props.width * 0.52;
    const mainBoxHeight = props.height * 0.65;
    const mainBoxX = props.width * 0.375;
    const mainBoxY = props.height * 0.17;

    // Save/Capture/Done/Reset button variables
    const [isBoxVisible, setBoxVisible] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [showConfirmExit, setShowConfirmExit] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);

    // timer variables
    const [showTimer, setShowTimer] = useState(false);
    const [timer, setTimer] = useState(10);
    const [isTooClose, setIsTooClose] = useState(false);

    // State to indicate whether we should capture the pose
    const [shouldCapture, setShouldCapture] = useState(false);

    // function to start the on screen timer once the capture button is pressed
    const startTimer = () => {
      setTimer(10);
      setShowTimer(true);
      const timerInterval = setInterval(() => {
        setTimer((prevTimer) => {
          const depth = localStorage.getItem('user_depth');
          // if this depth value is inside of local storage set the timer to false and clear the interval 
          if (depth !== null && parseFloat(depth) < -2) {
            setShowTimer(false);
            clearInterval(timerInterval);
            handleCaptureError();
            return;
          }
          
          // if the timer is active subtract 1 from the current number
          if (prevTimer > 0) {
            return prevTimer - 1;
          } 
          // if the timer has reached 0 set the flag to true which will trigger the handleCapture function
          else {
            clearInterval(timerInterval);
            setShowTimer(false);
            if (!isTooClose) {
              setShouldCapture(true); // Set the flag to true when the timer finishes if not too close
            }
            return prevTimer;
            }
        });
      }, 1000);
    };

    const handleSave = () => {
      if (localStorage.length === 0) {
        console.log("Local Storage is empty. Nothing to save.");
        return;
      }
  
      saveConjecture();
      setNotificationMessage("Saved Successfully!");
      setBoxVisible(true);
      setTimeout(() => setBoxVisible(false), 3000);
    };

    const handleDone = () => {
      console.log("Done button clicked");
    
      // Check if local storage is empty
      if (localStorage.length === 0) {
        exitPoseAuthoring();
      } else {
        setShowConfirmExit(true);
      
        // Set a timeout to hide the confirmation button after 3 seconds
        const timeoutId = setTimeout(() => {
          setShowConfirmExit(false);
        }, 3000);
      
        // Save the timeout ID in the component's state
        setTimeoutId(timeoutId);
      }
    };
    
    const handleCaptureError = () => {
      setNotificationMessage("Error caturing pose\nToo close to the camera \nPlease try again");
      setBoxVisible(true);
      setTimeout(() => setBoxVisible(false), 3000);
    }
      
    const exitPoseAuthoring = () => {
      setNotificationMessage("Done, exiting Pose Authoring");
      setBoxVisible(true);
      setTimeout(() => {
        setBoxVisible(false);
        props.mainCallback();
      }, 2000);
    };

    const handleConfirmExit = () => {
      // Clear the timeout
      clearTimeout(timeoutId);

      // Clear local storage
      localStorage.clear();
    
      // Hide the confirmation button
      setShowConfirmExit(false);
    
      // Exit Pose Authoring
      exitPoseAuthoring();
    };
    
    // UseEffect to capture pose data when the flag is set and poseData changes
    useEffect(() => {
      if (shouldCapture) {
        handleCapture();
        setShouldCapture(false); // Reset the flag after capturing
      }
    }, [props.poseData, shouldCapture]); // Only re-run if props.poseData or shouldCapture changes

    const handleCapture = () => {
      setNotificationMessage("Captured pose.");
      setBoxVisible(true);
      capturePose(props.poseData, state.value); // Implement Pose-Capturing
      setTimeout(() => setBoxVisible(false), 1000);
    };
    
    const handleReset = () => {
      setNotificationMessage("Clearing poses.");
      setBoxVisible(true);
      resetConjecture()
      setTimeout(() => setBoxVisible(false), 1000);
    };

    // Creates a popup in which the user can enter a tolerance amount for the Start Pose
    function startTolerance() {
      let tolerance = prompt("Please Enter Your Tolerance Amount (0-100%)", "50");
      if (tolerance != null) {
        tolerance = parseInt(tolerance, 10);
        if (!isNaN(tolerance) && tolerance >= 0 && tolerance <= 100) {
          localStorage.setItem('Start Tolerance', tolerance + "%") }
        else {
          setNotificationMessage("Please enter a valid\ntolerance value between\n0 and 100.");
          setBoxVisible(true);
          setTimeout(() => setBoxVisible(false), 2000);
        }
      }
    }

    // Creates a popup in which the user can enter a tolerance amount for the Intermediate Pose
    function intermediateTolerance() {
      let tolerance = prompt("Please Enter Your Tolerance Amount (0-100%)", "50");
      if (tolerance != null) {
        tolerance = parseInt(tolerance, 10);
        if (!isNaN(tolerance) && tolerance >= 0 && tolerance <= 100) {
          localStorage.setItem('Intermediate Tolerance', tolerance + "%") }
        else {
          setNotificationMessage("Please enter a valid\ntolerance value between\n0 and 100.");
          setBoxVisible(true);
          setTimeout(() => setBoxVisible(false), 2000);
        }
      }
    }

    // Creates a popup in which the user can enter a tolerance amount for the End Pose
    function endTolerance() {
      let tolerance = prompt("Please Enter Your Tolerance Amount (0-100%)", "50");
      if (tolerance != null) {
        tolerance = parseInt(tolerance, 10);
        if (!isNaN(tolerance) && tolerance >= 0 && tolerance <= 100) {
          localStorage.setItem('End Tolerance', tolerance + "%") }
        else {
          setNotificationMessage("Please enter a valid\ntolerance value between\n0 and 100.");
          setBoxVisible(true);
          setTimeout(() => setBoxVisible(false), 2000);
        }
      }
    }

    useEffect(() => {
      if (props.poseData && props.poseData.poseLandmarks) {
        const depth = calculateFaceDepth(props.poseData.poseLandmarks);
        // console.log lets you see the depth in youre browsers console; ctrl + shift + i
        console.log(depth)
        if (depth < -2) { // You can change the negative integer lower for closer range
          console.warn("Warning: You are too close to the camera!");
          localStorage.setItem('user_depth', depth);  // Logs current depth so that it can be used to generate text
          setTimeout(function() {   // Removes message on screen after 1 second
            localStorage.removeItem('user_depth');
          }, 1000)
        }
      }
    }, [props.poseData])

    return (
      <>
        <Background height={height} width={width} />
        <MainBox height={height} width={width} />
        <StartBox height={height} width={width} boxState={state.value} similarityScores={poseSimilarity} />
        <RectButton
          // Start Pose button
          height={height * 0.05}  
          width={width * 0.10}    
          x={width * 0.25}  // width * 0.25
          y={height * .19}
          color={white}
          fontSize={width * 0.014}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={"EDIT"}
          fontWeight={800}
          callback={() => send("START")}
        />
        <RectButton
          // Start Pose button
          height={height * 0.05}  
          width={width * 0.10}    
          x={width * 0.25}
          y={height * 0.33}
          color={white}
          fontSize={width * 0.014}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={"TOL%"}          
          fontWeight={800}
          callback={() => startTolerance()}
        />
        <IntermediateBox height={height} width={width} boxState={state.value} similarityScores={poseSimilarity} />
        <RectButton
          height={height * 0.05}
          width={width * 0.10}
          x={width * 0.25}
          y={height * 0.43}
          color={white}
          fontSize={width * 0.014}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={"EDIT"}
          fontWeight={800}
          callback={() => send("INTERMEDIATE")}
        />
        <RectButton
          height={height * 0.05}
          width={width * 0.10}
          x={width * 0.25}
          y={height * 0.57}
          color={white}
          fontSize={width * 0.014}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={"TOL%"}
          fontWeight={800}
          callback={() => intermediateTolerance()}
        />
        <EndBox height={height} width={width} boxState={state.value} similarityScores={poseSimilarity} />
        <RectButton
          height={height * 0.05}
          width={width * 0.10}
          x={width * 0.25}
          y={height * 0.67}
          color={white}
          fontSize={width * 0.014}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={"EDIT"}
          fontWeight={800}
          callback={() => send("END")}
        />
        <RectButton
          height={height * 0.05}
          width={width * 0.10}
          x={width * 0.25}
          y={height * 0.81}
          color={white}
          fontSize={width * 0.014}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={"TOL%"}
          fontWeight={800}
          callback={() => endTolerance()}
        />
        <Pose
          poseData={props.poseData}
          colAttr={{
            x: (mainBoxX + (mainBoxWidth - (mainBoxWidth * 0.8)) / 1.75),
            y: (mainBoxY + (mainBoxHeight - (mainBoxHeight * 0.8)) / 1.75),
            width: mainBoxWidth * 0.8,
            height: mainBoxHeight * 0.8,
          }}
          similarityScores={poseSimilarity}
        />
        {showTimer && (
          <Graphics
            draw={graphics => {
              graphics.lineStyle(2, 0x000000);
              graphics.beginFill(0, 0);
              graphics.drawRect(mainBoxX + mainBoxWidth - 50, mainBoxY + 15, 40, 40, 5);
              graphics.endFill();
            }}
          >
            <Text
              text={`${timer}`}
              style={{
                fill: black,
                fontSize: 25,
                fontFamily: "Arial",
              }}
              x={mainBoxX + mainBoxWidth - 45}
              y={mainBoxY + 20}
            />
          </Graphics>
        )}
        <RectButton
          height={height * 0.12}
          width={width * 0.20}
          x={width * 0.41}
          y={height * 0.83}
          color={white}
          fontSize={width * 0.021}  //  Dynamically modify font size based on screen width
          fontColor={pink}
          text={"Capture"}
          fontWeight={800}
          callback={() => startTimer()} // Implement Pose-Capturing
        />
        <RectButton
          height={height * 0.12}
          width={width * 0.20}
          x={width * 0.52}
          y={height * 0.83}
          color={white}
          fontSize={width * 0.021}  //  Dynamically modify font size based on screen width
          fontColor={green}
          text={"Save"}
          fontWeight={800}
          callback={handleSave} // Implement Save Feature
        />
        <RectButton
        height={height * 0.12}
        width={width * 0.20}
        x={width * 0.67}
        y={height * 0.83}
        color={white}
        fontSize={24}
        fontColor={blue}
        text={"Done"}
        fontWeight={800}
        callback={props.conjectureCallback} // Exit Back To Conjecture Module
      />
        <RectButton
          height={height * 0.12}
          width={width * 0.20}
          x={width * 0.78}
          y={height * 0.83}
          color={white}
          fontSize={width * 0.021}  //  Dynamically modify font size based on screen width
          fontColor={orange}
          text={"Reset"}
          fontWeight={800}
          callback={handleReset} // Implement Reset??
        />
        {/* Conditionally rendering the NotificationBox based on the isBoxVisible state */}
        {isBoxVisible && <NotificationBox message={notificationMessage} textSize={30} />}
        {showConfirmExit && (
          <RectButton
            height={props.height * 0.98}
            width={props.width * .35}
            x={props.width * 0.40}
            y={props.height * 0.30}
            color={white}
            fontSize={props.width * 0.021}
            fontColor={blue}
            text={"Exit Pose Authoring?\n(Click to exit)"}
            fontWeight={800}
            callback={handleConfirmExit}
          />
        )}
      </>
    );
};

export default PoseAuthoring;
