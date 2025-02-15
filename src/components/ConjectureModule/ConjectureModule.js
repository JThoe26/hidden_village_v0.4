import Background from "../Background";
import { green, neonGreen, black, blue, white, pink, orange, red, transparent, turquoise } from "../../utils/colors";
import Button from "../Button";
import RectButton from "../RectButton";
import InputBox from "../InputBox";
import { ConjectureBox, KeywordsBox, NameBox, PINBox } from "./ConjectureModuleBoxes";
import { EndBox, IntermediateBox, StartBox } from "../PoseAuth/PoseAuthoringBoxes";
import { writeToDatabaseConjecture, writeToDatabaseDraft } from "../../firebase/database";
import { useMachine } from "@xstate/react";
import { ConjectureEditorMachine } from "../../machines/conjectureEditorMachine";

const ConjectureModule = (props) => {
  const { height, width, poseData, columnDimensions, rowDimensions, editCallback, mainCallback } = props;
  const [state, send] = useMachine(ConjectureEditorMachine);
    return (
      <>
        <Background height={height * 1.1} width={width} />
        <NameBox height={height} width={width} boxState={state.value} />
        <PINBox height={height} width={width} />
        <StartBox height={height * 0.5} width={width * 0.5} x={5} y={4.6} boxState={null} similarityScores={null} inCE={true} />
        <IntermediateBox height={height * 0.5} width={width * 0.5} x={9} y={1.906} boxState={null} similarityScores={null} inCE={true} />
        <EndBox height={height * 0.5} width={width * 0.5} x={13} y={1.2035} boxState={null} similarityScores={null} inCE={true} />
        {/* Button to Pose Editor */}
        <Button
          height={height * 0.18}
          width={width * 0.08}
          x={width * 0.17}
          y={height * 0.42}
          color={blue}
          fontSize={32}
          fontColor={white}
          text={"POSE EDITOR"}
          fontWeight={800}
          callback={editCallback}
        />
          <Button
            height={height * 0.14}
            width={width * 0.04}
            x={width * 0.10}
            y={height * 0.61}
            color={blue}
            fontSize={50}
            fontColor={white}
            text={"A"}
            fontWeight={800}
            callback={null}
        />
          <Button
            height={height * 0.14}
            width={width * 0.04}
            x={width * 0.10}
            y={height * 0.70}
            color={blue}
            fontSize={50}
            fontColor={white}
            text={"B"}
            fontWeight={800}
            callback={null}
        />
          <Button
            height={height * 0.14}
            width={width * 0.04}
            x={width * 0.10}
            y={height * 0.79}
            color={blue}
            fontSize={50}
            fontColor={white}
            text={"C"}
            fontWeight={800}
            callback={null}
        />
          <Button
            height={height * 0.14}
            width={width * 0.04}
            x={width * 0.10}
            y={height * 0.88}
            color={blue}
            fontSize={50}
            fontColor={white}
            text={"D"}
            fontWeight={800}
            callback={null}
        />
        {/* Save Button */}
        <RectButton
          height={height * 0.13}
          width={width * 0.26}
          x={width * 0.58}
          y={height * 0.93}
          color={neonGreen}
          fontSize={width * 0.014}
          fontColor={white}
          text={"SAVE DRAFT"}
          fontWeight={800}
          callback={ () => writeToDatabaseDraft() } // Implement Save feature
        />
        {/* Cancel Button */}
        <RectButton
          height={height * 0.13}
          width={width * 0.26}
          x={width * 0.71}
          y={height * 0.93}
          color={red}
          fontSize={width * 0.015}
          fontColor={white}
          text={"CANCEL"}
          fontWeight={800}
          callback={mainCallback} // Exit Back To Home
        />
        {/* Publish Button */}
        <RectButton
          height={height * 0.13}
          width={width * 0.26}
          x={width * 0.45}
          y={height * 0.93}
          color={blue}
          fontSize={width * 0.015}
          fontColor={white}
          text={"PUBLISH"}
          fontWeight={800}
          callback={ () => writeToDatabaseConjecture() } // publish to database
        />
        {/* 'X' Buttons for the mutliple choice boxes */}
        <InputBox
          height={height * 0.14}
          width={width * 0.07}
          x={width * 0.735}
          y={height * 0.58}
          color={white}
          fontSize={width * 0.024}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={localStorage.getItem("OptionA Checkmark")}
          fontWeight={600}
          callback={() => send("OPTIONA")}
        />
        <InputBox
          height={height * 0.14}
          width={width * 0.07}
          x={width * 0.735}
          y={height * 0.67}
          color={white}
          fontSize={width * 0.024}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={localStorage.getItem("OptionB Checkmark")}
          fontWeight={600}
          callback={() => send("OPTIONB")}
        />
        <InputBox
          height={height * 0.14}
          width={width * 0.07}
          x={width * 0.735}
          y={height * 0.76}
          color={white}
          fontSize={width * 0.024}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={localStorage.getItem("OptionC Checkmark")}
          fontWeight={600}
          callback={() => send("OPTIONC")}
        />
        <InputBox
          height={height * 0.14}
          width={width * 0.07}
          x={width * 0.735}
          y={height * 0.85}
          color={white}
          fontSize={width * 0.024}  //  Dynamically modify font size based on screen width
          fontColor={black}
          text={localStorage.getItem("OptionD Checkmark")}
          fontWeight={600}
          callback={() => send("OPTIOND")}
        />
      </>
    );
  };
  
  export default ConjectureModule;
