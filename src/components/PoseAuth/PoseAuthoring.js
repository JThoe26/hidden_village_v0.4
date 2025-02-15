import Background from "../Background";
import Pose from "../Pose";
import { useState, useEffect } from "react";
import { MainBox, StartBox, IntermediateBox, EndBox } from "./PoseAuthoringBoxes";
import { black, green, blue, white, pink, orange } from "../../utils/colors";
import RectButton from "../RectButton";
import { useMachine } from "@xstate/react";
import { PoseAuthMachine } from "../../machines/poseauthMachine";
import { capturePose, saveConjecture, resetConjecture } from "./ButtonFunctions";
import { calculateFaceDepth } from "../Pose/landmark_utilities";
import { Text, Graphics } from '@inlet/react-pixi';

// Defining a NotificationBox component using Pixi components, used for all notification pop-ups
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

    // *********************************
    // Handler functions
    // *********************************

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

    // Function that handles capture phase when timer turns to zero.
    const handleCapture = () => {
      setNotificationMessage("Captured pose.");
      setBoxVisible(true);
      capturePose(props.poseData, state.value); // Implement Pose-Capturing
      setTimeout(() => setBoxVisible(false), 1000);
    };

    // Function that handles error massage is user is to close to screen during capture.
    const handleCaptureError = () => {
      setNotificationMessage("Error caturing pose\nToo close to the camera \nPlease try again");
      setBoxVisible(true);
      setTimeout(() => setBoxVisible(false), 3000);
    }

    // Function that handles saving poses when 'Save Draft' button is clicked
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

    // Function that handles reseting all poses and tolerance when clicked
    const handleReset = () => {
      setNotificationMessage("Clearing poses.");
      setBoxVisible(true);
      resetConjecture()
      setTimeout(() => setBoxVisible(false), 1000);
    };

    // *********************************
    // Tolerance functions
    // *********************************

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

    // *********************************
    // Active use effects
    // *********************************

    // UseEffect to monitor facedepth and determine wether the user is too close to the screen
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

    // UseEffect to capture pose data when the flag is set and poseData changes
    useEffect(() => {
      if (shouldCapture) {
        handleCapture();
        setShouldCapture(false); // Reset the flag after capturing
      }
    }, [props.poseData, shouldCapture]); // Only re-run if props.poseData or shouldCapture changes

    // *********************************
    // Returned objects
    // *********************************

    return (
      <>
        <Background height={height} width={width} />
        <MainBox height={height} width={width} />
        <StartBox height={height} width={width} x={1} y={1} boxState={state.value} similarityScores={poseSimilarity} inCE={false} />
        {/* Start box edit button build */}
        <RectButton
          height={height * 0.05}  
          width={width * 0.10}    
          x={width * 0.25}
          y={height * .19}
          color={white}
          fontSize={width * 0.014}
          fontColor={black}
          text={"EDIT"}
          fontWeight={800}
          callback={() => send("START")}  // Send START state to poseauthMachine
        />
        {/* Start box tolerance button build */}
        <RectButton
          height={height * 0.05}  
          width={width * 0.10}    
          x={width * 0.25}
          y={height * 0.33}
          color={white}
          fontSize={width * 0.014}
          fontColor={black}
          text={"TOL%"}          
          fontWeight={800}
          callback={() => startTolerance()}   // Enter tolerance for start box
        />
        <IntermediateBox height={height} width={width}  x={1} y={1} boxState={state.value} similarityScores={poseSimilarity} inCE={false} />
        {/* Intermidiate box edit button build */}
        <RectButton
          height={height * 0.05}
          width={width * 0.10}
          x={width * 0.25}
          y={height * 0.43}
          color={white}
          fontSize={width * 0.014}
          fontColor={black}
          text={"EDIT"}
          fontWeight={800}
          callback={() => send("INTERMEDIATE")}   // Send INTERMIDIATE state to poseauthMachine
        />
        {/* Intermidiate tolerance button build */}
        <RectButton
          height={height * 0.05}
          width={width * 0.10}
          x={width * 0.25}
          y={height * 0.57}
          color={white}
          fontSize={width * 0.014}
          fontColor={black}
          text={"TOL%"}
          fontWeight={800}
          callback={() => intermediateTolerance()}    // Enter tolerance for intermidiate box
        />
        <EndBox height={height} width={width}  x={1} y={1} boxState={state.value} similarityScores={poseSimilarity} inCE={false} />
        {/* End box edit button build */}
        <RectButton
          height={height * 0.05}
          width={width * 0.10}
          x={width * 0.25}
          y={height * 0.67}
          color={white}
          fontSize={width * 0.014}
          fontColor={black}
          text={"EDIT"}
          fontWeight={800}
          callback={() => send("END")}    // Send END state to poseauthMachine
        />
        {/* End box tolerance button build */}
        <RectButton
          height={height * 0.05}
          width={width * 0.10}
          x={width * 0.25}
          y={height * 0.81}
          color={white}
          fontSize={width * 0.014}
          fontColor={black}
          text={"TOL%"}
          fontWeight={800}
          callback={() => endTolerance()}   // Enter tolerance for end box
        />
        {/* Active user pose build */}
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
        {/* Timer build */}
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
        {/* Capture Button build */}
        <RectButton
          height={height * 0.12}
          width={width * 0.20}
          x={width * 0.41}
          y={height * 0.83}
          color={white}
          fontSize={width * 0.021}
          fontColor={pink}
          text={"Capture"}
          fontWeight={800}
          callback={() => startTimer()} // Start timer to capture pose
        />
        {/* Save Button build */}
        <RectButton
          height={height * 0.12}
          width={width * 0.20}
          x={width * 0.52}
          y={height * 0.83}
          color={white}
          fontSize={width * 0.021}
          fontColor={green}
          text={"Save"}
          fontWeight={800}
          callback={handleSave} // Handle saving current poses to database
        />
        {/* Done Button build */}
        <RectButton
        height={height * 0.12}
        width={width * 0.20}
        x={width * 0.67}
        y={height * 0.83}
        color={white}
        fontSize={width * 0.021}
        fontColor={blue}
        text={"Done"}
        fontWeight={800}
        callback={props.conjectureCallback} // Exit Back To Conjecture Module
      />
        {/* Reset Button build */}
        <RectButton
          height={height * 0.12}
          width={width * 0.20}
          x={width * 0.78}
          y={height * 0.83}
          color={white}
          fontSize={width * 0.021}
          fontColor={orange}
          text={"Reset"}
          fontWeight={800}
          callback={handleReset}  // Clear all poses and tolerance from pose auth
        />
        {/* Conditionally rendering the NotificationBox based on the isBoxVisible state */}
        {isBoxVisible && <NotificationBox message={notificationMessage} textSize={30} />}
      </>
    );
};

export default PoseAuthoring;
