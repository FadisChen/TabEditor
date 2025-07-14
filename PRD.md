# Tab Editor 專案需求文件
## 1. 專案概述 (Project Overview)
- 本專案旨在開發一個名為 **Tab Editor** 的網頁前端文字編輯器，其核心功能是提供類似 GitHub Copilot 的 AI 驅動文字片段建議。編輯器將在使用者輸入內容後，根據設定的延遲時間自動生成建議文字，並允許使用者透過 Tab 鍵接受建議。此外，專案還將包含一個設定面板，用於配置 AI 模型的參數和素材庫，以及一個「魔法棒」功能，用於將現有內容以**串流方式**改寫成完整文章。

## 2. 功能需求 (Functional Requirements)
### 2.1 核心功能：AI 建議文字片段 (Core Feature: AI Suggested Text Snippets)
觸發機制 (Trigger Mechanism)

當編輯器內容發生異動（onchange 事件）後，系統應開始計時。

若在設定的秒數（預設 3 秒，可透過設定面板調整，範圍 2~5 秒）內沒有新的按鍵輸入，則觸發 AI 建議生成。

顯示方式 (Display Method)

生成的建議文字片段應以淺灰色文字顯示在當前句子的末尾。

建議文字應清晰可辨，且與使用者實際輸入的文字有明顯區別。

接受與拒絕 (Acceptance and Rejection)

接受建議 (Accept Suggestion)：當使用者按下 Tab 鍵時，淺灰色的建議文字應被接受，並轉換為編輯器中的正式內容。接受建議後，系統會自動重新啟動建議計時器，以便生成下一個建議。

在手機或平板裝置上，當建議文字出現時，畫面右下方會顯示一個接受按鈕（👍），點擊該按鈕可接受建議。該按鈕的底色將與網頁整體風格保持一致，避免突兀。當沒有建議文字時，該按鈕將自動隱藏。

**AI 回應處理**：AI 模型回應的文字，如果開頭或結尾包含「...」，應自動移除。

拒絕建議 (Reject Suggestion)：當使用者按下 Tab 鍵以外的任何鍵，或點擊編輯器中的其他位置時，淺灰色的建議文字應立即消失。

### 2.2 設定面板 (Settings Panel)
觸發方式 (Trigger Method)

編輯器介面應包含一個 emoji 按鈕 ⚙️ ，點擊後彈出設定視窗。

**行動裝置適應**：在手機或平板裝置上，為節省顯示區域，`themeToggleBtn`、`downloadBtn`、`settingsBtn` 將整合到一個漢堡菜單（☰）中，點擊後展開選單。

輸入欄位 (Input Fields)

**Gemini API 金鑰**：一個文字輸入框，用於輸入使用者個人的 Gemini API Key。當輸入有效的 API Key 後，系統會自動載入可用的模型清單。

**Gemini 模型**：一個下拉選單，動態載入並顯示所有可用的 Gemini 模型。系統會自動從 Google AI API 獲取最新的模型清單，並**過濾只顯示名稱包含 `gemini-2.0` 或 `gemini-2.5` 的模型**。

**建議延遲秒數**：一個滑動條（slider），允許使用者設定 AI 建議觸發的延遲時間，範圍為 2 到 5 秒。

**文章風格 (選填)**：一個文字輸入框，讓使用者可以指定生成文章的風格（例如：專業、口語化、幽默），此設定會影響 AI 的回應。

**魔術棒生成長度**：一個滑動條（slider），允許使用者設定魔術棒功能生成的文章長度（以 token 為單位），範圍為 512 到 4096。

**素材庫**：一個多行文字輸入框（textarea），供使用者輸入用於 AI 建議生成和文章改寫的參考素材或背景知識。

儲存機制 (Storage Mechanism)

所有設定（API Key、Gemini Model、建議生成秒數、文章風格、文章長度、素材庫內容）應儲存於瀏覽器的 localStorage，以確保使用者下次開啟時能自動載入。

### 2.3 編輯器功能 (Editor Functionality)
內容異動監聽 (Content Change Listener)

編輯器應持續監聽其內容的變化，並在每次異動後重置建議觸發計時器。

建議文字顯示 (Suggested Text Display)

需確保建議文字的顯示不會干擾使用者正常的輸入體驗。

建議文字應在使用者開始輸入新文字時自動消失。

互動行為 (Interaction Behavior)

除了 Tab 鍵外，其他按鍵的行為應保持標準文字編輯器的行為。

點擊編輯器外部應取消當前的建議顯示。

### 2.4 AI 建議生成邏輯 (AI Suggestion Generation Logic)
#### API 使用 (API Usage)

使用使用者在設定面板中提供的 Gemini API Key 和選擇的 Gemini Model 進行 API 呼叫。

API 呼叫應包含適當的錯誤處理機制，並在發生錯誤時提供使用者友善的提示。

#### 輸入內容 (Input Content)

AI 建議的輸入應包含編輯器中當前的全部內容，作為上下文。

#### 素材庫與風格應用 (Knowledge Base & Style Application)

將設定面板中提供的「素材庫」和「文章風格」內容作為 AI 模型的額外上下文或指導，以確保生成的建議與使用者預期的主題或風格一致。其中，「文章風格」將同時應用於建議文字生成和魔法棒功能。

### 2.5 魔法棒功能：文章改寫 (Magic Wand Feature: Article Rewriting)
#### 觸發方式 (Trigger Method)

編輯器介面應包含一個 emoji 按鈕 🪄，點擊後觸發文章改寫功能。

編輯器介面應包含一個 emoji 按鈕 🗑️，點擊後清空編輯器內容。

#### API 使用 (API Usage)

與建議生成功能相同，使用 Gemini API 進行呼叫，但會額外傳入「文章風格」和「文章長度」參數。

#### 輸入內容 (Input Content)

將編輯器中當前的全部內容作為輸入，要求 AI 模型進行改寫。

#### 素材庫與風格應用 (Knowledge Base & Style Application)

同樣將「素材庫」和「文章風格」內容作為改寫的參考，影響改寫的風格、語氣或重點。

**回應方式 (Response Method)**

**改寫後的內容將以串流（streaming）方式即時顯示在編輯器中，逐字取代原有內容，提供即時的視覺回饋。**

### 2.6 深色模式切換 (Dark Mode Toggle)
#### 觸發方式 (Trigger Method)

編輯器介面應包含一個 emoji 按鈕 🌙/☀️，點擊後切換深色/淺色模式。

#### 功能特性 (Features)

自動檢測系統偏好：系統會自動檢測使用者的系統深色模式偏好設定。

手動切換：使用者可以透過按鈕手動切換深色/淺色模式，覆蓋系統設定。

狀態記憶：使用者的模式選擇會儲存在 localStorage 中，下次開啟時自動載入。

視覺回饋：按鈕圖示會根據當前模式顯示相應的 emoji（🌙 表示當前為淺色模式，☀️ 表示當前為深色模式）。

**樣式修正：在深色模式下，設定視窗中的輸入框、下拉選單和文字區域的文字顏色會調整為淺色，以確保可讀性。**

## 3. 技術棧 (Technology Stack)
### 前端 (Frontend)：

HTML5, CSS3 (Tailwind CSS 優先考慮), JavaScript (ES6+)

### API 整合 (API Integration)：

Fetch API (用於與 Gemini API 進行非同步通訊，支援串流)

### 本地儲存 (Local Storage)：

localStorage API (用於儲存使用者設定)

## 4. 非功能性需求 (Non-Functional Requirements)
### 使用者體驗 (User Experience - UX)

介面應直觀、簡潔，易於操作。

建議文字的顯示和消失應流暢，不影響輸入。

**文章改寫的串流回應應提供流暢、即時的更新體驗。**

設定面板應清晰易懂。

### 效能 (Performance)

編輯器應響應迅速，即使在內容較多的情況下也能保持流暢。

AI 建議的生成和顯示應盡可能快速，以提供良好的即時體驗。

API 呼叫應具備超時處理和錯誤回饋機制。

### 響應式設計 (Responsive Design)

介面應能適應不同螢幕尺寸和裝置（桌面、平板、手機），提供良好的使用者體驗。