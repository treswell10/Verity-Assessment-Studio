const API_BASE = "http://localhost:8000";

export interface MemoQuestion {
  id: number;
  question_number: string;
  expected_answer: string;
  max_mark: number;
  order: number;
}

export interface Memorandum {
  id: number;
  filename: string;
  status: string;
  questions: MemoQuestion[];
}

export interface ScriptAnswer {
  id: number;
  question_number: string;
  answer_text: string;
}

export interface LearnerScript {
  id: number;
  memorandum_id: number;
  filename: string;
  status: string;
  final_score: number | null;
  final_percentage: number | null;
  answers: ScriptAnswer[];
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(body.detail || "Request failed");
  }
  return response.json();
}

export async function uploadMemorandum(file: File): Promise<Memorandum> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/api/memoranda`, {
    method: "POST",
    body: formData,
  });
  return handle<Memorandum>(response);
}

export async function getMemorandum(memorandumId: number): Promise<Memorandum> {
  const response = await fetch(`${API_BASE}/api/memoranda/${memorandumId}`);
  return handle<Memorandum>(response);
}

export async function updateMemoQuestion(
  memorandumId: number,
  questionId: number,
  update: { question_number?: string; expected_answer?: string; max_mark?: number }
): Promise<Memorandum> {
  const response = await fetch(
    `${API_BASE}/api/memoranda/${memorandumId}/questions/${questionId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    }
  );
  return handle<Memorandum>(response);
}

export async function confirmMemorandum(memorandumId: number): Promise<Memorandum> {
  const response = await fetch(`${API_BASE}/api/memoranda/${memorandumId}`, {
    method: "PATCH",
  });
  return handle<Memorandum>(response);
}

export async function uploadScript(
  memorandumId: number,
  file: File
): Promise<LearnerScript> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(
    `${API_BASE}/api/scripts?memorandum_id=${memorandumId}`,
    { method: "POST", body: formData }
  );
  return handle<LearnerScript>(response);
}

export interface MarkingResult {
  id: number;
  question_number: string;
  proposed_mark: number;
  max_mark: number;
  reason: string;
  confidence: number;
  final_mark: number | null;
  status: "proposed" | "confirmed" | "changed";
}

export const CONFIDENCE_THRESHOLD = 70;

export async function startMarking(scriptId: number): Promise<MarkingResult[]> {
  const response = await fetch(`${API_BASE}/api/scripts/${scriptId}/mark`, {
    method: "POST",
  });
  return handle<MarkingResult[]>(response);
}

export async function updateMarkingResult(
  scriptId: number,
  questionNumber: string,
  finalMark: number,
  status: "confirmed" | "changed"
): Promise<MarkingResult> {
  const response = await fetch(
    `${API_BASE}/api/scripts/${scriptId}/results/${encodeURIComponent(questionNumber)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ final_mark: finalMark, status }),
    }
  );
  return handle<MarkingResult>(response);
}
