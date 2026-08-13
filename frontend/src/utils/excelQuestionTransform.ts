// Chuyển đổi 1 dòng Excel phẳng (cột: text, type, option_1..option_6, correct_answer,
// subject, difficulty, tags) sang đúng cấu trúc JSON mà backend question_service yêu cầu
// (content.text, options[{id,text,is_correct}], correct_answer, metadata{...}).
//
// Trước đây AdminQuestions.tsx gửi thẳng dòng Excel phẳng lên API /bulk — API yêu cầu
// cấu trúc lồng nhau nên luôn bị từ chối (trừ khi ai đó tự tay gõ JSON vào ô Excel,
// không thực tế). Định dạng cột ở đây khớp đúng với những gì nút "Xuất Excel" xuất ra,
// nên xuất ra sửa rồi import lại (round-trip) hoạt động được.
//
// Giới hạn: chỉ hỗ trợ multiple_choice / multiple_select / true_false qua Excel.
// Câu nối cột và tự luận có cấu trúc phức tạp hơn 1 dòng bảng tính — tạo qua giao diện
// "Thêm câu hỏi" thay vì Excel.

export interface ExcelQuestionRow {
  text?: string;
  type?: string;
  subject?: string;
  difficulty?: string;
  tags?: string;
  correct_answer?: string | number;
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
  option_5?: string;
  option_6?: string;
  [key: string]: any;
}

export interface TransformResult {
  payloads: any[];
  errors: string[];
}

const VALID_TYPES = new Set(['multiple_choice', 'multiple_select', 'true_false']);

export function transformExcelRowsToQuestions(rows: ExcelQuestionRow[]): TransformResult {
  const payloads: any[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // dòng 1 là header trong Excel
    const text = String(row.text || '').trim();
    const type = String(row.type || 'multiple_choice').trim();

    if (!text) {
      errors.push(`Dòng ${rowNum}: thiếu nội dung câu hỏi (cột "text").`);
      return;
    }
    if (!VALID_TYPES.has(type)) {
      errors.push(`Dòng ${rowNum}: loại câu hỏi "${type}" không hỗ trợ qua Excel (chỉ multiple_choice/multiple_select/true_false). Bỏ qua dòng này.`);
      return;
    }

    const subject = String(row.subject || '').trim();
    if (!subject) {
      errors.push(`Dòng ${rowNum}: thiếu môn học (cột "subject").`);
      return;
    }
    const difficulty = String(row.difficulty || 'medium').trim();
    const tags = String(row.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

    let options: { id: string; text: string; is_correct: boolean }[] = [];
    let correctAnswer: string | string[] = '';

    if (type === 'true_false') {
      const correctRaw = String(row.correct_answer ?? '').trim().toLowerCase();
      const isTrue = ['true', 'đúng', 'dung', '1'].includes(correctRaw);
      options = [
        { id: 'opt_true', text: 'Đúng', is_correct: isTrue },
        { id: 'opt_false', text: 'Sai', is_correct: !isTrue },
      ];
      correctAnswer = isTrue ? 'opt_true' : 'opt_false';
    } else {
      const rawOptions: string[] = [];
      for (let i = 1; i <= 6; i++) {
        const val = row[`option_${i}`];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          rawOptions.push(String(val).trim());
        }
      }
      if (rawOptions.length < 2) {
        errors.push(`Dòng ${rowNum}: cần ít nhất 2 đáp án (cột option_1, option_2,...).`);
        return;
      }

      const correctIndices = String(row.correct_answer ?? '')
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= rawOptions.length);

      if (correctIndices.length === 0) {
        errors.push(`Dòng ${rowNum}: cột "correct_answer" phải ghi số thứ tự đáp án đúng (VD: "1" hoặc "1,3").`);
        return;
      }
      if (type === 'multiple_choice' && correctIndices.length > 1) {
        errors.push(`Dòng ${rowNum}: loại "multiple_choice" (1 đáp án đúng) nhưng cột correct_answer lại ghi nhiều số — chỉ lấy đáp án đầu tiên.`);
      }

      options = rawOptions.map((text, i) => ({
        id: `opt_${i + 1}`,
        text,
        is_correct: correctIndices.includes(i + 1),
      }));
      correctAnswer = type === 'multiple_choice'
        ? `opt_${correctIndices[0]}`
        : correctIndices.map((i) => `opt_${i}`);
    }

    payloads.push({
      content: { text },
      type,
      options,
      correct_answer: correctAnswer,
      metadata: { subject, difficulty, tags },
    });
  });

  return { payloads, errors };
}
