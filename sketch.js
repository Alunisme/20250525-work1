// 教育科技職涯配對互動遊戲
// 使用 ml5.js handpose 偵測雙手大拇指(4)和食指(8)捏合選擇答案

let video;
let handPose;
let hands = [];

let gameStarted = false; // 是否開始遊戲

// 題庫：每題包含職涯名稱、三個描述選項、正確答案索引
let questions = [
  {
    title: "教育科技專案經理",
    options: [
      "協調團隊、規劃專案進度與溝通資源",
      "設計互動教材與數位學習內容",
      "開發教育平台的程式與功能"
    ],
    answer: 0
  },
  {
    title: "數位教材設計師",
    options: [
      "協調團隊、規劃專案進度與溝通資源",
      "設計互動教材與數位學習內容",
      "開發教育平台的程式與功能"
    ],
    answer: 1
  },
  {
    title: "教育軟體工程師",
    options: [
      "協調團隊、規劃專案進度與溝通資源",
      "設計互動教材與數位學習內容",
      "開發教育平台的程式與功能"
    ],
    answer: 2
  },
  {
    title: "學習數據分析師",
    options: [
      "分析學習行為數據，提供決策建議",
      "設計互動教材與數位學習內容",
      "協調團隊、規劃專案進度與溝通資源"
    ],
    answer: 0
  },
  {
    title: "教育科技顧問",
    options: [
      "協助學校導入教育科技解決方案",
      "開發教育平台的程式與功能",
      "設計互動教材與數位學習內容"
    ],
    answer: 0
  },
  {
    title: "線上課程企劃",
    options: [
      "設計互動教材與數位學習內容",
      "規劃線上課程內容與架構",
      "協調團隊、規劃專案進度與溝通資源"
    ],
    answer: 1
  },
  {
    title: "教育平台測試工程師",
    options: [
      "負責平台功能測試與品質保證",
      "設計互動教材與數位學習內容",
      "協調團隊、規劃專案進度與溝通資源"
    ],
    answer: 0
  },
  {
    title: "教育行銷專員",
    options: [
      "推廣教育產品，規劃行銷活動",
      "設計互動教材與數位學習內容",
      "開發教育平台的程式與功能"
    ],
    answer: 0
  },
  {
    title: "學習科技研究員",
    options: [
      "研究學習科技趨勢與應用",
      "協調團隊、規劃專案進度與溝通資源",
      "設計互動教材與數位學習內容"
    ],
    answer: 0
  },
  {
    title: "教育科技客服專員",
    options: [
      "協助用戶解決平台操作問題",
      "設計互動教材與數位學習內容",
      "開發教育平台的程式與功能"
    ],
    answer: 0
  }
];

let currentQuestion = 0; // 當前題目索引
let showResult = false;
let resultText = "";
let resultTime = 0;

// 選項框資料
let optionBoxes = [];
let optionBoxW = 150; // 縮小選項寬度
let optionBoxH = 48;  // 縮小選項高度
let optionBoxY = 220; // 稍微往上
let optionBoxGap = 30; // 間距縮小

// 答案框資料
let answerBox = { x: 220, y: 400, w: 200, h: 60 };

let dragging = false;
let draggedIndex = -1;
let offsetX = 0, offsetY = 0;
let pinchActive = [false, false];

let answeredCount = 0; // 已答題數
let showCorrect = false; // 答錯時顯示正確答案
let correctOptionText = ""; // 正確選項內容

function preload() {
  // 初始化 HandPose 模型
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  let cnv = createCanvas(640, 480);
  cnv.parent('sketch-holder');
  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  // 啟動手部偵測
  handPose.detectStart(video, gotHands);

  // 初始化三個選項框的位置
  optionBoxes = [];
  let totalW = optionBoxW * 3 + optionBoxGap * 2;
  let startX = (width - totalW) / 2;
  for (let i = 0; i < 3; i++) {
    optionBoxes.push({
      x: startX + i * (optionBoxW + optionBoxGap),
      y: optionBoxY,
      w: optionBoxW,
      h: optionBoxH,
      dragging: false
    });
  }

  answerBox = { x: width / 2 - 100, y: height - 120, w: 200, h: 60 };
  answeredCount = 0;
  showCorrect = false;
  correctOptionText = "";
}

function windowResized() {
  resizeCanvas(640, 480);
  // 重新計算選項框與答案框位置
  let totalW = optionBoxW * 3 + optionBoxGap * 2;
  let startX = (width - totalW) / 2;
  for (let i = 0; i < 3; i++) {
    optionBoxes[i].x = startX + i * (optionBoxW + optionBoxGap);
    optionBoxes[i].y = optionBoxY;
    optionBoxes[i].w = optionBoxW;
    optionBoxes[i].h = optionBoxH;
    optionBoxes[i].dragging = false;
  }
  answerBox = { x: width / 2 - 100, y: height - 120, w: 200, h: 60 };
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background(220);
  image(video, 0, 0, width, height);

  drawProfile();

  if (!gameStarted) {
    drawStartScreen();
    return;
  }

  // 題目區
  fill(0, 180);
  rect(0, 0, width, 80);
  fill(255);
  textSize(28);
  textAlign(CENTER, CENTER);
  text("題目：" + questions[currentQuestion].title, width / 2, 40);

  // 顯示進度
  textSize(16);
  fill(225);
  textAlign(RIGHT, TOP);
  text(`第 ${answeredCount + 1} / ${questions.length} 題`, width - 20, 10);

  // 答案框
  fill(200, 240, 255, 180);
  rect(answerBox.x, answerBox.y, answerBox.w, answerBox.h, 12);
  fill(0);
  textSize(18);
  textAlign(CENTER, CENTER);
  text("請將答案拖曳到此", answerBox.x + answerBox.w / 2, answerBox.y + answerBox.h / 2);

  // 選項框
  textSize(13);
  for (let i = 0; i < 3; i++) {
    let box = optionBoxes[i];
    fill(255, 255, 200, 220);
    if (box.dragging) fill(255, 220, 120, 240);
    rect(box.x, box.y, box.w, box.h, 12);
    fill(0);
    textAlign(CENTER, CENTER);
    // 自動換行顯示選項文字
    drawTextInBox(questions[currentQuestion].options[i], box.x, box.y, box.w, box.h);
  }

  handlePinchAndDrag();
  drawHandKeypointsAndLines();

  // 顯示答題結果
  if (showResult) {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    textSize(40);
    textAlign(CENTER, CENTER);
    text(resultText, width / 2, height / 2 - 60);

    textSize(24);
    fill(255, 255, 0);
    text("正確答案：", width / 2, height / 2 - 10);
    fill(0, 200, 255);
    text(correctOptionText, width / 2, height / 2 + 30);

    fill(255, 100, 100);
    textSize(20);
    text("手指捏合可前往下一題", width / 2, height / 2 + 70);
  }

  // 十題結束
  if (answeredCount >= questions.length) {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("恭喜完成所有題目！", width / 2, height / 2 - 40);
    textSize(28);
    text("點擊下方按鈕再來一次", width / 2, height / 2 + 10);
    fill(255);
    stroke(0);
    rect(width / 2 - 80, height / 2 + 60, 160, 60, 16);
    noStroke();
    fill(0);
    textSize(28);
    text("再來一次", width / 2, height / 2 + 90);
  }
}

// 自動換行顯示選項文字在框內
function drawTextInBox(str, x, y, w, h) {
  let words = str.split('');
  let lines = [];
  let current = '';
  textSize(13);
  for (let i = 0; i < words.length; i++) {
    let testLine = current + words[i];
    if (textWidth(testLine) > w - 16 && current.length > 0) {
      lines.push(current);
      current = words[i];
    } else {
      current = testLine;
    }
  }
  if (current.length > 0) lines.push(current);
  let lineH = 16;
  let totalH = lines.length * lineH;
  let startY = y + (h - totalH) / 2 + lineH / 2;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x + w / 2, startY + i * lineH);
  }
}

// 畫個人資料
function drawProfile() {
  fill(255, 255, 255, 220);
  rect(10, 80, 180, 90, 12);
  fill(0);
  textSize(18);
  textAlign(LEFT, TOP);
  text("學號: 413730267", 20, 90);
  text("系所: TKUET", 20, 115);
  text("姓名: 伍志倫", 20, 140);
}

// 畫開始畫面與說明
function drawStartScreen() {
  fill(0, 180);
  rect(0, 0, width, height);
  fill(255);
  textSize(48);
  textAlign(CENTER, CENTER);
  text("教育科技職涯配對遊戲", width / 2, height / 2 - 100);
  textSize(28);
  text("請點擊下方按鈕開始遊戲", width / 2, height / 2 - 40);

  // 遊戲介紹與說明
  textSize(15);
  text("本遊戲結合AI手勢辨識與教育科技職涯知識，\n" +
       "請將雙手伸向鏡頭，系統會偵測您的手部。\n" +
       "用食指與拇指捏合可選擇並拖曳答案。\n" +
       "將選項拖曳到下方藍色答案框內即可作答。\n" +
       "答對或答錯會顯示結果，2秒後自動進入下一題。\n" +
       "如仍在捏合狀態可再次將選項取出。", width / 2, height / 2 + 30);

  // 開始按鈕
  fill(255);
  stroke(0);
  rect(width / 2 - 80, height / 2 + 120, 160, 60, 16);
  noStroke();
  fill(0);
  textSize(28);
  text("開始遊戲", width / 2, height / 2 + 150);
}

function mousePressed() {
  if (!gameStarted) {
    // 檢查是否點擊到開始按鈕
    let btnX = width / 2 - 80;
    let btnY = height / 2 + 100;
    let btnW = 160;
    let btnH = 60;
    if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      gameStarted = true;
      answeredCount = 0;
      currentQuestion = 0;
      showResult = false;
      showCorrect = false;
      if (typeof window.wrongCount !== "undefined") window.wrongCount = 0;
    }
  } else if (answeredCount >= questions.length) {
    // 再來一次，回到開始畫面
    let btnX = width / 2 - 80;
    let btnY = height / 2 + 60;
    let btnW = 160;
    let btnH = 60;
    if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      gameStarted = false;
      answeredCount = 0;
      currentQuestion = 0;
      showResult = false;
      showCorrect = false;
      if (typeof window.wrongCount !== "undefined") window.wrongCount = 0;
      // 重置選項框
      let totalW = optionBoxW * 3 + optionBoxGap * 2;
      let startX = (width - totalW) / 2;
      for (let i = 0; i < 3; i++) {
        optionBoxes[i].x = startX + i * (optionBoxW + optionBoxGap);
        optionBoxes[i].y = optionBoxY;
        optionBoxes[i].dragging = false;
      }
    }
  } else if (showResult && showCorrect) {
    // 答錯時，點擊畫面才進入下一題
    showResult = false;
    showCorrect = false;
    nextQuestion();
  }
}

// 處理捏合手勢與拖曳選項（兩手皆可）
function handlePinchAndDrag() {
  if (!gameStarted || answeredCount >= questions.length) return;
  if (hands.length > 0) {
    for (let h = 0; h < hands.length; h++) {
      let hand = hands[h];
      if (hand.confidence > 0.1) {
        let thumb = hand.keypoints[4];
        let index = hand.keypoints[8];
        let d = dist(thumb.x, thumb.y, index.x, index.y);

        // 判斷是否捏合
        if (d < 30) {
          // 答對或答錯時，捏合可直接進入下一題（無論是否拖曳）
          if (showResult) {
            showResult = false;
            showCorrect = false;
            nextQuestion();
            return;
          }
          // 若尚未開始拖曳，檢查是否在某個選項框內
          if (!pinchActive[h] && !dragging && !showResult) {
            for (let i = 0; i < 3; i++) {
              let box = optionBoxes[i];
              if (
                thumb.x > box.x && thumb.x < box.x + box.w &&
                thumb.y > box.y && thumb.y < box.y + box.h
              ) {
                box.dragging = true;
                dragging = true;
                draggedIndex = i;
                offsetX = box.x - thumb.x;
                offsetY = box.y - thumb.y;
                break;
              }
            }
          }
          pinchActive[h] = true;
        } else {
          // 放開時檢查是否有選項在答案框內
          if (dragging && draggedIndex !== -1 && !showResult) {
            let box = optionBoxes[draggedIndex];
            // 若選項已經在答案框內，檢查答案
            if (
              box.x + box.w / 2 > answerBox.x && box.x + box.w / 2 < answerBox.x + answerBox.w &&
              box.y + box.h / 2 > answerBox.y && box.y + box.h / 2 < answerBox.y + answerBox.h
            ) {
              correctOptionText = questions[currentQuestion].options[questions[currentQuestion].answer];
              if (draggedIndex === questions[currentQuestion].answer) {
                resultText = "答對了！";
                showResult = true;
                answeredCount++;
                showCorrect = false;
              } else {
                resultText = "答錯了！";
                showResult = true;
                showCorrect = true;
                answeredCount++;
              }
            }
            // 放開後重置拖曳狀態
            box.dragging = false;
            dragging = false;
            draggedIndex = -1;
          }
          pinchActive[h] = false;
        }

        // 拖曳時讓選項框跟著大拇指移動
        if (dragging && draggedIndex !== -1 && pinchActive[h] && !showResult) {
          let box = optionBoxes[draggedIndex];
          // 若碰到答案框，自動吸附到答案框中央
          if (
            thumb.x > answerBox.x && thumb.x < answerBox.x + answerBox.w &&
            thumb.y > answerBox.y && thumb.y < answerBox.y + answerBox.h
          ) {
            box.x = answerBox.x + (answerBox.w - box.w) / 2;
            box.y = answerBox.y + (answerBox.h - box.h) / 2;
          } else {
            box.x = thumb.x + offsetX;
            box.y = thumb.y + offsetY;
          }
        }
      }
    }
  }
}

// 畫出所有手的關鍵點與連線
function drawHandKeypointsAndLines() {
  if (!gameStarted) return;
  if (hands.length > 0) {
    for (let hand of hands) {
      // 畫出21個關鍵點
      for (let i = 0; i < hand.keypoints.length; i++) {
        let keypoint = hand.keypoints[i];
        // 根據左右手設定顏色
        if (hand.handedness == "Left") {
          fill(255, 0, 255); // 紫色
        } else {
          fill(255, 255, 0); // 黃色
        }
        noStroke();
        circle(keypoint.x, keypoint.y, 16);
      }
      // 畫出五指連線
      stroke(0, 255, 0); // 綠色
      strokeWeight(2);
      connectKeypoints(hand.keypoints, 0, 4);   // 拇指
      connectKeypoints(hand.keypoints, 5, 8);   // 食指
      connectKeypoints(hand.keypoints, 9, 12);  // 中指
      connectKeypoints(hand.keypoints, 13, 16); // 無名指
      connectKeypoints(hand.keypoints, 17, 20); // 小指
      noStroke(); // <--- 加這一行，避免影響後續繪圖
    }
  }
}

// 畫出一根手指的連線
function connectKeypoints(keypoints, start, end) {
  for (let i = start; i < end; i++) {
    let kpA = keypoints[i];
    let kpB = keypoints[i + 1];
    line(kpA.x, kpA.y, kpB.x, kpB.y);
  }
}

// 切換到下一題
function nextQuestion() {
  currentQuestion++;
  if (currentQuestion >= questions.length) {
    currentQuestion = 0;
  }
  // 重置選項框位置
  for (let i = 0; i < 3; i++) {
    optionBoxes[i].x = 70 + i * (optionBoxW + optionBoxGap);
    optionBoxes[i].y = optionBoxY;
    optionBoxes[i].dragging = false;
  }
}
