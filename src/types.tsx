export interface Todo {
  content: string;
  readonly id: number;
  completed_flg: boolean;
  delete_flg: boolean;
}