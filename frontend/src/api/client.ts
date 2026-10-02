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
