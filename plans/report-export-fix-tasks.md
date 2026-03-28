# 報表匯出修正與優化規劃

## 已發現問題
- PDF/Excel/CSV 匯出無法正確顯示中文（字型支援不足）
- 報表內月份顯示格式需修正（如：英文縮寫、年份格式、地區化）

## 修正建議
1. **PDF 中文字型支援**
   - 確認 [`utils/export/fontLoader.ts`](utils/export/fontLoader.ts:1) 已有載入 NotoSansSC 或其他支援中文的字型。
   - 檢查 [`utils/export/pdfExport.ts`](utils/export/pdfExport.ts:1) 是否正確呼叫 `loadChineseFont`，並於產生 PDF 前設置字型。
   - 若仍無法顯示中文，需檢查 jsPDF 版本與字型註冊流程，或考慮將字型檔案本地化。
2. **Excel/CSV 中文支援**
   - Excel/CSV 匯出本身支援 UTF-8，但需確認 BOM 標頭與欄位內容皆為 UTF-8 編碼。
   - 測試含中文資料的匯出檔案於 Excel/Google Sheets 開啟是否正常。
3. **月份顯示格式優化**
   - [`utils/export/reportGenerator.ts`](utils/export/reportGenerator.ts:1) 內 `generateMonthlyDetails` 應根據地區語系顯示月份（如：2024年3月、三月、March 2024）。
   - 建議使用 `toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })` 產生中文月份。
   - 檢查所有報表欄位與標題的日期格式，統一地區化顯示。

## 優化方向
- 增加匯出前的預覽，讓使用者確認內容與格式。
- 支援多語系匯出（根據使用者語言自動切換報表欄位與日期格式）。
- 增加匯出測試自動化，確保未來功能調整不會破壞匯出品質。

---

如需進一步細節或優先處理項目，請回覆本規劃。