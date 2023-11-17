import { drawFace, setArmWidth, drawTorso, drawAbdomen, drawBiceps, drawForearms, drawShins, drawHands } from ".";

// drawWorker Web Worker
self.onmessage = function (event) {
    const { poseData, width, height, similarityScores, armWidth } = event.data;

    const draw = useCallback(
      (g) => {
        // Worker draw logic
        g.clear();
        if (poseData.faceLandmarks) {
          drawFace(poseData, g, width, height, similarityScores);
        }
        if (poseData.poseLandmarks) {
          setArmWidth(calculateArmWidth(props.poseData, width, height));
          // NOTE: Order of drawing body section matters, do not reorder
          drawTorso(props.poseData, g, width, height, similarityScores);
          drawAbdomen(props.poseData, g, width, height);
          drawBiceps(
           poseData,
           g,
           armWidth,
           width,
           height,
           similarityScores
          );
          drawForearms(
            poseData,
            g,
            armWidth,
            width,
            height,
            similarityScores
          );
          drawThighs(
            poseData,
            g,
            armWidth,
            width,
            height,
            similarityScores
          );
          drawShins(poseData, g, armWidth, width, height, similarityScores);
        }
          drawHands(poseData, g, width, height, similarityScores);
      });
    return draw;
}