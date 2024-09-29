export interface Todo {
  content: string;
  readonly id: number;
  completed: boolean;
  delete_flg: boolean;
  sort: number;
  sub_content?: string;
  output_date: string;
  progress_rate: number;
  copy_id: number; // コピーID
  start_date: string; // 新しい開始日
  completion_date: string; // 新しい完了予定日
  completion_date_actual?: string;
}
